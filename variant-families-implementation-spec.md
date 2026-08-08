# Variant Families — Complete Implementation Specification

> Implementation-ready spec extracted from a working **Laravel 12 + Blade + TailwindCSS + Alpine.js** store. It contains the full data model, backend, admin UI, storefront, routes, business rules, edge cases, and a parity checklist. A dev agent can build the entire feature from this document without seeing the original site. Stack-neutral notes are included where the target stack differs.

---

## 0. CRITICAL CONCEPT — read first

A **Variant Family groups whole, standalone `Product` records** (e.g. the same purifier model sold in different colours/models, each with its own product page/SKU/price/stock). It is **NOT** the same thing as a per-product "variant/option" row.

- A family "variant" = a full **Product** row linked by `products.variant_family_id`.
- The storefront shows the family as a **selector of cards, each linking to that sibling product's own page** (full-page navigation by slug). It is NOT a JS state swap.
- This codebase ALSO has an unrelated `ProductVariant` model (size/colour options *within one product*, Amazon-style JS selector). **The two are mutually exclusive on the product page** and share nothing. If a product is in a family, its own `ProductVariant`s are ignored on the page. Do not merge these concepts.

**Membership is exclusive:** a product belongs to at most one family. Adding a product that's already in another family *moves* it.

**The "2+ rule":** a family renders on the storefront only when it has **≥2 live members** (live = `is_active = true AND status = 'approved'`). Single-member families show nothing (admin shows a "selector hidden" badge).

---

## 1. Data model / schema

### 1.1 Migration (single migration; columns are created in final shape — no later ALTERs)

```php
// create table variant_families
Schema::create('variant_families', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();                 // family display name, UNIQUE
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('position')->default(0);   // global ordering of families
    $table->foreignId('default_product_id')->nullable()
          ->constrained('products')->nullOnDelete();   // FK -> products, ON DELETE SET NULL
    $table->timestamps();
});

// add columns to products
Schema::table('products', function (Blueprint $table) {
    $table->foreignId('variant_family_id')->nullable()
          ->constrained('variant_families')->nullOnDelete(); // FK -> variant_families, SET NULL on delete
    $table->unsignedInteger('variant_family_position')->default(0); // in-family sort order
    $table->index('variant_family_id');
});
```

`down()` drops the FK + the two product columns, then drops `variant_families`.

**FK on-delete semantics (must replicate):**
- Delete a product → `variant_families.default_product_id` becomes NULL.
- Delete a family → products' `variant_family_id` becomes NULL (DB safety net; the controller also reassigns/nulls inside a transaction first).

> The original migration also had a **one-time seeding block** that bucketed products into families by an SKU-keyword heuristic. **Skip this on a fresh site** — it's site-specific bootstrap, not schema. (Details in §11 if you need it.)

### 1.2 `VariantFamily` model

```php
class VariantFamily extends Model
{
    protected $fillable = ['name', 'is_active', 'position', 'default_product_id'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    // Members, ALWAYS ordered by in-family position
    public function products(): HasMany
    {
        return $this->hasMany(Product::class)->orderBy('variant_family_position');
    }

    public function defaultProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'default_product_id');
    }
}
```
No scopes/accessors/helpers beyond these. `position` and `default_product_id` are uncast ints.

### 1.3 `Product` model additions

```php
// add to $fillable:
'variant_family_id',
'variant_family_position',

// relationship:
public function variantFamily(): BelongsTo
{
    return $this->belongsTo(VariantFamily::class);   // default FK variant_family_id
}
```
No casts on the two columns. That is the entire family surface on `Product` — no `isDefault()`/`siblings()` on the model; that logic lives in a support helper (§5.3).

### 1.4 Product fields consumed by this feature
`id, name, slug, sku, price, mrp, stock_quantity, is_active, status ('approved'|...), attributes (json), primaryImage` (relation exposing `full_url`). Storefront navigation resolves products by **`slug`**.

---

## 2. Backend — Admin controller (all 9 methods)

`App\Http\Controllers\Admin\VariantFamilyController`. **All mutating methods return JSON** (`{ ok, message, ... }`) — this is an AJAX/SPA-style page, no redirects, no session flash. All `{family}`/`{product}` params are route-model-bound. Validation is inline (no FormRequests).

| # | Method | Signature | Validation | Behavior | Response |
|---|--------|-----------|-----------|----------|----------|
| 1 | `index` | `(): View` | — | Load all families `orderBy('position')`, eager-load `products` (each `with('primaryImage')`, pre-ordered by in-family position) + `defaultProduct:id`. | renders `admin.variant-families.index` with `$families` |
| 2 | `store` | `(Request): JsonResponse` | `name` = `required\|string\|max:100\|unique:variant_families,name` | Create `{name, is_active:true, position: max(position)+1}` | `{ok:true, message:"Family “…” created.", id}` |
| 3 | `update` | `(Request, VariantFamily $family)` | `name` = `sometimes\|required\|string\|max:100\|unique:variant_families,name,{id}`; `is_active` = `sometimes\|boolean` | `$family->update($validated)` (rename and/or toggle) | `{ok:true, message:"Family updated."}` |
| 4 | `destroy` | `(Request, VariantFamily $family)` | `strategy` = `required\|in:detach,move`; `target_family_id` = `nullable\|required_if:strategy,move\|integer\|exists:variant_families,id` | Reject move-into-self → 422. In a DB transaction: **move** → append this family's products (in position order) onto target continuing target's max position; **detach** → set members' `variant_family_id=null, variant_family_position=0`. Then `$family->delete()`. | `{ok:true, message:"Family “…” deleted."}` |
| 5 | `addProduct` | `(Request, VariantFamily $family)` | `product_id` = `required\|integer\|exists:products,id` | If product already in THIS family → 422 no-op. Else set `variant_family_id=family.id`, `variant_family_position = max+1` (moves it out of any other family). | `{ok:true, message:"Added “…”." \| "Moved “…” from “…”."}` |
| 6 | `removeProduct` | `(VariantFamily $family, Product $product)` | — (route-bound) | `abort_unless product.variant_family_id === family.id` (404). If it was the family default → null `default_product_id`. Set product `variant_family_id=null, variant_family_position=0`. | `{ok:true, message:"Product removed from family."}` |
| 7 | `reorderProducts` | `(Request, VariantFamily $family)` | `ids`=`required\|array`; `ids.*`=`integer` | For each `position => id`: `Product::whereKey(id)->where('variant_family_id', family.id)->update(['variant_family_position'=>position])` (index-based, scoped). | `{ok:true}` (no message) |
| 8 | `reorderFamilies` | `(Request)` | `ids`=`required\|array`; `ids.*`=`integer` | For each `position => id`: `VariantFamily::whereKey(id)->update(['position'=>position])`. | `{ok:true}` |
| 9 | `setDefault` | `(Request, VariantFamily $family)` | `product_id` = `required\|integer\|exists:products,id` | `abort_unless product.variant_family_id === family.id` (422). Set `default_product_id`. | `{ok:true, message:"Default set to “…”."}` |

**Invariants enforced:**
- One product ↔ one family (adding elsewhere moves it).
- Reorder writes the array **index** as the position (0-based), always scoped so foreign ids can't be repositioned.
- `default_product_id` is only ever written by `setDefault` / `removeProduct` / `destroy` logic — never mass-assigned from request input.
- New family/product appended at `max(position)+1`.

### 2.1 Routes (admin, under an auth+catalog-permission group)

```php
Route::prefix('variant-families')->name('variant-families.')->group(function () {
    Route::get('/',                              [VariantFamilyController::class, 'index'])->name('index');
    Route::post('/',                             [VariantFamilyController::class, 'store'])->name('store');
    Route::post('/reorder',                      [VariantFamilyController::class, 'reorderFamilies'])->name('reorder'); // BEFORE {family}
    Route::put('/{family}',                      [VariantFamilyController::class, 'update'])->name('update');
    Route::delete('/{family}',                   [VariantFamilyController::class, 'destroy'])->name('destroy');
    Route::post('/{family}/products',            [VariantFamilyController::class, 'addProduct'])->name('products.add');
    Route::delete('/{family}/products/{product}',[VariantFamilyController::class, 'removeProduct'])->name('products.remove');
    Route::post('/{family}/products/reorder',    [VariantFamilyController::class, 'reorderProducts'])->name('products.reorder');
    Route::post('/{family}/default',             [VariantFamilyController::class, 'setDefault'])->name('default');
});
```
Note the static `/reorder` route is declared **before** `/{family}` so the wildcard doesn't swallow it.

### 2.2 Shared product-search endpoint (used by the Add-Product modal)

`GET /admin/search/products?q=` → `SearchController::products`:
- Returns `[]` if `q` < 2 chars.
- Else up to **15** products, `select id,name,sku,price` where `name LIKE %q%` ordered by name.
- Response shape: `[{id, name, sku, price}, ...]`.

### 2.3 Endpoint ↔ payload ↔ response cheat-sheet

| Action | Method + URL | Body | Success |
|--------|-------------|------|---------|
| Create | POST `/admin/variant-families` | `{name}` | `{ok,message,id}` |
| Update/toggle | PUT `/admin/variant-families/{id}` | `{name?, is_active?}` | `{ok,message}` |
| Delete | DELETE `/admin/variant-families/{id}` | `{strategy:'detach'\|'move', target_family_id?}` | `{ok,message}` |
| Reorder families | POST `/admin/variant-families/reorder` | `{ids:[...]}` | `{ok}` |
| Add product | POST `/admin/variant-families/{id}/products` | `{product_id}` | `{ok,message}` |
| Remove product | DELETE `/admin/variant-families/{id}/products/{pid}` | — | `{ok,message}` |
| Reorder products | POST `/admin/variant-families/{id}/products/reorder` | `{ids:[...]}` | `{ok}` |
| Set default | POST `/admin/variant-families/{id}/default` | `{product_id}` | `{ok,message}` |
| Product search | GET `/admin/search/products?q=` | — | `[{id,name,sku,price}]` |

---

## 3. Admin UI (single page, modals + AJAX)

**There is exactly one view** (`admin/variant-families/index.blade.php`, ~245 lines). No separate create/edit/assignment pages — all CRUD is Alpine modals + `fetch()`. **After every mutating action (except reorder) the page hard-reloads** (`location.reload()` after 350 ms) to re-sync the DOM; reorders persist silently without reload.

### 3.1 Layout & sidebar
- Wrapped in an admin layout component that provides two slots: `title` and `header`, and globally loads **toastr** (success/error toasts) + Alpine + a `@stack('scripts')` hook.
- Sidebar link under the **Catalog** group: `Variant Families` → active when route matches `admin.variant-families.*`.
- Header slot: title + subtitle ("Group products as colour / model variants. Drag to reorder — the order shows on the product page. A family needs 2+ products for the selector to appear.") + a **New Family** button.
- ⚠️ The **New Family button is in the header slot, OUTSIDE the Alpine `x-data` scope.** It bridges via a window CustomEvent: `onclick="window.dispatchEvent(new CustomEvent('vf-new-family'))"`, and the root div listens `@vf-new-family.window="openNew()"`. Replicate this bridge or move the button inside the scope.

### 3.2 Families list (collapsible cards, not a table)
Root: `<div x-data="variantFamilies()" x-init="init()" @vf-new-family.window="openNew()"><div id="vf-families" class="space-y-4">`.
Each family = a `.card.vf-family[data-id]` with its own accordion `x-data="{ open: <hasProducts ? false : true> }"` (empty families start expanded).

**Family header row (in order):**
1. Drag handle `.vf-drag` (6-dot grip) — reorder families.
2. Chevron (`:class="open && 'rotate-90'"`) + collapse toggle button.
3. `{{ name }}` (bold, truncated).
4. Product-count badge: `{{ count }} {{ Str::plural('product', count) }}` (neutral badge).
5. **Conditional "selector hidden" badge** — see §3.5.
6. **Active/Inactive toggle badge** (clickable): `@click="toggleActive(id, <!currentActive>)"`; green when active, neutral when inactive.
7. `+ Add Product` button → `openAdd(id)`.
8. Edit (pencil) → `openEdit(id, name, active)`.
9. Delete (trash) → `openDelete(id, name, count)`.

**Product row inside expanded body** (`.vf-products[data-family]` › `.vf-product[data-id]`), in order:
1. Drag handle `.vf-pdrag` — reorder products within family.
2. 40×40 thumbnail `primaryImage.full_url` (`object-contain`; empty grey box if none).
3. Name `Str::limit(html_entity_decode(name), 60)`.
4. SKU (mono) or `—`.
5. Price `₹{{ number_format(price, 0) }}`.
6. Stock badge (`stock_quantity > 0` → "In stock"/green else "Out of stock"/red), hidden < `sm`.
7. Active badge (green/neutral), hidden < `md`.
8. **Default-variant star** → `setDefault(familyId, productId)`; filled amber star when `family.default_product_id === product.id`, hollow otherwise.
9. Remove (✕) → `removeProduct(familyId, productId)`.

Per-family product empty state: `No products yet — click “+ Add Product”.`
Whole-page empty state: card with `No variant families yet.` + a `+ New Family` button.

### 3.3 Modals
**New/Edit family** (one modal, `form.id` distinguishes): fields = `Family Name` text (Enter submits) + `Active` checkbox shown only when editing. Title/button label switch Create/Save. Dismiss via Escape / click-outside / Cancel.

**Add Product**: search input (`@input.debounce.300ms="searchProducts()"`) hitting the shared `/admin/search/products?q=` endpoint (min 2 chars); results list (name + sku) each `@click="addProduct(p.id)"`; "No products found." when `q.length>=2 && !results.length`; a `Done` button. Helper text: "A product can only be in one family — adding one that's already in another family moves it here."

**Delete family**: shows product count and a **strategy chooser** (2 radios): `detach` ("Keep products independent") vs `move` ("Move products to another family" → reveals a `<select>` of the OTHER families). Confirm button `Delete Family` (danger). Guard: move requires a target.

### 3.4 Full Alpine component (verbatim logic — this IS the client behavior)

```javascript
const VF_CSRF = @json(csrf_token());
const VF_BASE = @json(url('admin/variant-families'));
function variantFamilies() {
    return {
        families: @json($families->map(fn ($f) => ['id'=>$f->id,'name'=>$f->name])->values()), // for the "move to" select
        modals: { form: false, add: false, del: false },
        form: { id: null, name: '', active: true },
        add:  { familyId: null, q: '', results: [] },
        del:  { id: null, name: '', count: 0, strategy: 'detach', target: '' },

        async req(url, method, body) {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type':'application/json', 'X-CSRF-TOKEN':VF_CSRF, 'X-Requested-With':'XMLHttpRequest', 'Accept':'application/json' },
                body: body ? JSON.stringify(body) : null,
            });
            let data = {}; try { data = await res.json(); } catch(e) {}
            return { ok: res.ok && data.ok !== false, data };   // treats {ok:false}+422 as failure
        },
        done(r) {
            if (r.ok) { toastr.success(r.data.message || 'Saved'); setTimeout(() => location.reload(), 350); }
            else { toastr.error(r.data.message || 'Something went wrong'); }
            return r.ok;
        },

        openNew()  { this.form = {id:null,name:'',active:true}; this.modals.form = true; this.$nextTick(()=>this.$refs.familyName.focus()); },
        openEdit(id,name,active) { this.form = {id,name,active}; this.modals.form = true; this.$nextTick(()=>this.$refs.familyName.focus()); },
        async saveForm() {
            if (!this.form.name.trim()) { toastr.error('Name is required'); return; }
            const r = this.form.id
                ? await this.req(`${VF_BASE}/${this.form.id}`, 'PUT', { name:this.form.name, is_active:this.form.active })
                : await this.req(`${VF_BASE}`, 'POST', { name:this.form.name });
            this.done(r);
        },
        async toggleActive(id,next) { this.done(await this.req(`${VF_BASE}/${id}`, 'PUT', { is_active:next })); },

        openAdd(familyId) { this.add = {familyId,q:'',results:[]}; this.modals.add = true; this.$nextTick(()=>this.$refs.addSearch.focus()); },
        async searchProducts() {
            if (this.add.q.trim().length < 2) { this.add.results = []; return; }
            try {
                const res = await fetch('{{ route('admin.search.products') }}?q=' + encodeURIComponent(this.add.q), { headers:{'X-Requested-With':'XMLHttpRequest','Accept':'application/json'} });
                this.add.results = await res.json();
            } catch(e) { this.add.results = []; }
        },
        async addProduct(productId) { this.done(await this.req(`${VF_BASE}/${this.add.familyId}/products`, 'POST', { product_id:productId })); },
        async removeProduct(familyId,productId) {
            if (!confirm('Remove this product from the family?')) return;
            this.done(await this.req(`${VF_BASE}/${familyId}/products/${productId}`, 'DELETE'));
        },
        async setDefault(familyId,productId) { this.done(await this.req(`${VF_BASE}/${familyId}/default`, 'POST', { product_id:productId })); },

        openDelete(id,name,count) { this.del = {id,name,count,strategy:'detach',target:''}; this.modals.del = true; },
        async confirmDelete() {
            const body = { strategy: this.del.strategy };
            if (this.del.strategy === 'move') {
                if (!this.del.target) { toastr.error('Pick a family to move products into'); return; }
                body.target_family_id = this.del.target;
            }
            this.done(await this.req(`${VF_BASE}/${this.del.id}`, 'DELETE', body));
        },

        init() {   // SortableJS drag-reorder wiring
            if (!window.Sortable) return;
            const list = document.getElementById('vf-families');
            if (list) Sortable.create(list, { handle:'.vf-drag', animation:150, onEnd: () => {
                const ids = [...list.querySelectorAll(':scope > .vf-family')].map(el => Number(el.dataset.id));
                this.req(`${VF_BASE}/reorder`, 'POST', { ids }).then(r => r.ok ? toastr.success('Family order saved') : toastr.error('Reorder failed'));
            }});
            document.querySelectorAll('.vf-products').forEach(pl => Sortable.create(pl, { handle:'.vf-pdrag', animation:150, onEnd: () => {
                const fid = pl.dataset.family;
                const ids = [...pl.querySelectorAll('.vf-product')].map(el => Number(el.dataset.id));
                this.req(`${VF_BASE}/${fid}/products/reorder`, 'POST', { ids }).then(r => r.ok ? toastr.success('Product order saved') : toastr.error('Reorder failed'));
            }});
        },
    };
}
```

### 3.5 The "selector hidden" badge (admin) — exact rule
```blade
@if($family->products->count() < 2)
    <span class="badge badge-warning" title="Selector hidden until this family has 2+ products">selector hidden</span>
@endif
```
Mirrors the storefront runtime rule (≥2 live members). Purely informational.

### 3.6 Admin dependencies
- **SortableJS** (drag reorder) — CDN `Sortable.min.js`.
- **toastr** + jQuery (toasts) — provided globally by the layout.
- **Alpine.js** (modals/state).
- Global `[x-cloak]{display:none}` CSS.
- Project component CSS classes referenced: `.btn/.btn-primary/.btn-secondary`, `.card`, `.badge` + `.badge-{success,warning,error,neutral}`, `.form-input/.form-select/.form-checkbox/.form-radio/.form-label`, and color tokens `primary/warning/error(=danger)/neutral`. Port or map these.

---

## 4. Storefront

### 4.1 Where it renders
Only on the **product detail page**. It does **NOT** appear on the home page, and product cards have **NO** family indicator (verified — both would be net-new if wanted).

### 4.2 Controller wiring
In the storefront product `show()`:
```php
// Same-family products presented as colour/model variants. Null when not in a family or only 1 live member.
$familyVariants = ProductFamily::siblings($product);   // Collection<Product>|null
return view('products.show', compact('product', /* … */, 'familyVariants'));
```
No view composer; `$familyVariants` is passed directly.

### 4.3 The selector Blade (verbatim)
Decision flags near the top of the view:
```blade
@php
    $familyVariants = $familyVariants ?? null;
    $inFamily = $familyVariants && $familyVariants->count() > 1;   // 2+ rule
    // when in a family, ignore this product's own ProductVariants:
    $variantImageMap = $inFamily ? [] : $product->variants->mapWithKeys(fn($v)=>[$v->id=>$v->images->pluck('full_url')->values()]);
@endphp
```
The family branch (renders only when `$inFamily`):
```blade
@elseif($inFamily)
    <div>
        <label class="block text-sm font-medium text-neutral-700 mb-2">
            {{ __('ui.select_variant') }}:
            <span class="font-semibold text-neutral-900">{{ $product->variantFamily?->name }}</span>  {{-- family label --}}
        </label>
        <div class="flex flex-wrap gap-2.5">
            @foreach($familyVariants as $sib)
                @php
                    $isCurrent = $sib->id === $product->id;
                    $sibImg = $sib->primaryImage?->full_url;
                    $sibAttrs = is_array($sib->attributes) ? $sib->attributes : [];
                    $sibLabel = collect($sibAttrs)->only(['Colour','Color','Colour Name','Model','Style'])->filter()->first()
                                ?: html_entity_decode($sib->name);
                @endphp
                <a href="{{ $isCurrent ? '#' : route('products.show', $sib->slug) }}"
                   @if($isCurrent) aria-current="true" @endif
                   class="flex flex-col w-28 sm:w-32 p-2 border rounded-lg bg-white transition-colors
                          {{ $isCurrent ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-neutral-200 hover:border-neutral-400' }}
                          {{ $sib->stock_quantity < 1 ? 'opacity-60' : '' }}">
                    <div class="w-full rounded-md overflow-hidden bg-neutral-50 mb-1.5" style="aspect-ratio:1/1;">
                        @if($sibImg)<img src="{{ $sibImg }}" alt="{{ Str::limit($sibLabel,30) }}" class="w-full h-full object-contain" loading="lazy">@endif
                    </div>
                    <span class="text-xs font-medium text-neutral-800 leading-tight line-clamp-2 min-h-8">{{ Str::limit($sibLabel,40) }}</span>
                    <span class="text-sm font-bold text-neutral-900 mt-0.5">₹{{ number_format($sib->price,0) }}</span>
                    @if($sib->mrp > $sib->price)<span class="text-[11px] text-neutral-400 line-through">₹{{ number_format($sib->mrp,0) }}</span>@endif
                    @if($sib->stock_quantity < 1)<span class="text-[11px] text-error-500 font-medium">{{ __('ui.out_of_stock') }}</span>@endif
                </a>
            @endforeach
        </div>
    </div>
@endif
```
> In the original, the family label used a legacy SKU heuristic `ProductFamily::detect($product->sku)`; on a fresh site use `$product->variantFamily?->name` (shown above).

**Behavior:**
- Each card is an `<a>` linking to `/products/{sibling-slug}` — **full-page navigation**. No JS state swap for families.
- The **current** product's card links to `#`, gets a blue ring + `aria-current="true"`. The "selected variant" is simply the product whose page you're on — there is no separate storefront "default variant" redirect (the `default_product_id` is admin-only metadata).
- Card shows: label (first of `attributes` keys `Colour/Color/Colour Name/Model/Style`, else product name), square image (`object-contain`, empty grey box if missing), price, strikethrough MRP when `mrp > price`, "Out of Stock" note + `opacity-60` when `stock_quantity < 1` (still clickable).
- Card order = `variant_family_position` (via `products()` relation).
- Families and native `ProductVariant`s never both render: `$inFamily` skips the native-variant JS selector.

### 4.4 The `siblings()` helper (storefront read path)
```php
public static function siblings(Product $product): ?Collection
{
    if (! $product->variant_family_id) return null;

    $family = $product->relationLoaded('variantFamily')
        ? $product->variantFamily
        : VariantFamily::find($product->variant_family_id);

    if (! $family || ! $family->is_active) return null;          // family must exist AND be active

    $members = $family->products()                               // ordered by variant_family_position
        ->where('is_active', true)
        ->where('status', 'approved')
        ->with('primaryImage')
        ->get();

    return $members->count() > 1 ? $members : null;              // 2+ live members, else null
}
```
Guards: no family id → null; family missing/inactive → null; <2 live (active+approved) members → null. The current product is included in the returned collection (Blade filters it visually).

### 4.5 Storefront routes
None specific to families. Navigation is the standard product route with **slug binding**:
```php
Route::get('/products/{product:slug}', [ProductController::class, 'show'])->name('products.show');
```

---

## 5. Business rules & invariants (must hold)
1. A product is in **at most one** family (`variant_family_id`). Re-adding elsewhere **moves** it.
2. Family renders on storefront only with **≥2 live members** (`is_active && status='approved'`); else hidden.
3. An **inactive family** (`is_active=false`) is hidden on the storefront (admin still lists it).
4. Card/member order = `variant_family_position` (0-based, set by drag-reorder or append-at-max+1).
5. Family order = `position` (0-based).
6. `default_product_id` is admin metadata only; the storefront selects "current" purely by the URL's product. (If you WANT a family-root→default redirect, it's net-new.)
7. Deleting a family never deletes products: they're either **detached** (family_id→null) or **moved** to another family.
8. Removing the family's default product nulls `default_product_id`.
9. Names are **unique** across families.
10. Never wire this to per-product `ProductVariant`s; keep them independent and mutually exclusive on the page.

---

## 6. States & edge cases

| Case | Behavior |
|------|----------|
| Product not in a family | selector hidden; native ProductVariant selector shows instead (if any) |
| Family has 1 live member | selector hidden (admin shows "selector hidden" badge) |
| Family inactive | selector hidden on storefront |
| Sibling inactive / status≠approved / soft-deleted | filtered out server-side; never shown |
| Sibling out of stock | card `opacity-60` + "Out of Stock" label, **still clickable** |
| Missing sibling image | empty grey square (no placeholder icon) |
| Current product card | href `#`, blue ring, `aria-current="true"` |
| Admin: add product already in this family | 422, toast "That product is already in this family." |
| Admin: add product in another family | moved; toast "Moved “X” from “Y”." |
| Admin: reorder failure | toast "Reorder failed" (no reload) |
| Admin: any mutate success | toast message + hard reload after 350 ms |
| Admin: delete family (has products) | must choose detach/move; move requires target; can't move into self (422) |
| Admin: search < 2 chars | no request; empty results |
| Empty families list | full-page empty card + New Family CTA |
| Empty family (0 products) | starts expanded; "No products yet" row |
| Invalid family/product id | route-model-binding 404; integrity guards `abort_unless` 404/422 |
| Auth | admin routes behind admin-auth + catalog-section permission; storefront is public |

---

## 7. Exact user flows

**A. Storefront (customer):**
Home/listing → click a product → product page. If the product's family has ≥2 live members, a "Select variant" row of sibling cards renders (ordered by position), current one ringed. Click another card → **full page navigates** to `/products/{that-slug}` → that product's own page (its images, price, SKU, stock, add-to-cart, URL). Repeat. Add-to-cart / Buy-now act on whichever product page you're on. No family pages/routes exist.

**B. Admin:**
Sidebar → Catalog → Variant Families (`/admin/variant-families`). See families as collapsible cards ordered by position, each with product count + active toggle + "selector hidden" warning if <2.
- **New**: header "New Family" → modal → name → POST → reload.
- **Rename / toggle active**: pencil → modal (name + Active) → PUT; or click the Active badge → PUT `{is_active}`.
- **Add product**: "+ Add Product" → modal → type ≥2 chars → pick from search → POST `{product_id}` (moves if already elsewhere) → reload.
- **Set default**: click a product's star → POST `{product_id}` → reload.
- **Reorder families**: drag family cards (`.vf-drag`) → POST `/reorder {ids}` (silent, no reload).
- **Reorder products**: drag product rows (`.vf-pdrag`) → POST `/{id}/products/reorder {ids}` (silent).
- **Remove product**: ✕ → confirm() → DELETE → reload.
- **Delete family**: trash → modal → choose detach|move(+target) → DELETE `{strategy,target_family_id?}` → reload.

---

## 8. Feature-parity checklist

**Schema/data**
- [ ] `variant_families` table (id, name unique, is_active bool=true, position uint=0, default_product_id nullable FK→products SET NULL, timestamps)
- [ ] `products.variant_family_id` nullable FK→variant_families SET NULL + index
- [ ] `products.variant_family_position` uint=0
- [ ] `VariantFamily` model (fillable, is_active cast, `products()` ordered by position, `defaultProduct()`)
- [ ] `Product`: fillable + `variantFamily()` belongsTo

**Backend**
- [ ] Controller `index` (eager loads) + 8 JSON mutating methods with exact validation & invariants (§2)
- [ ] 9 admin routes (+ static `/reorder` before `/{family}`)
- [ ] Product-search endpoint (`?q=`, min 2, ≤15, `{id,name,sku,price}`)
- [ ] `siblings()` helper (guards + active/approved filter + 2+ rule + position order)
- [ ] Product `show()` passes `$familyVariants`

**Admin UI**
- [ ] Single index view: family accordion cards, product rows, badges (count/active/stock/default star/"selector hidden")
- [ ] 3 modals: New/Edit, Add Product (debounced search), Delete (detach/move strategy)
- [ ] Alpine `variantFamilies()` component (§3.4) incl. `req/done` + hard-reload-on-success
- [ ] SortableJS reorder for families & products (silent persist)
- [ ] Header "New Family" cross-scope window-event bridge
- [ ] Sidebar link with active-state
- [ ] toastr wiring; `[x-cloak]`

**Storefront**
- [ ] Family selector on product page (cards → sibling slugs, current ringed, label/image/price/MRP/out-of-stock)
- [ ] `$inFamily` mutual-exclusion with native ProductVariant selector
- [ ] Full-page slug navigation (no JS swap)
- [ ] Hidden when <2 live / family inactive / not in family
- [ ] (Confirm) NOT on home page; NO product-card indicator — add only if desired (net-new)

**States/edge cases** — implement all of §6.

---

## 9. Dependencies
- **Backend:** Laravel (Eloquent, route-model binding, validation). Any MVC framework works — the logic is framework-agnostic.
- **Admin frontend:** Alpine.js, SortableJS (CDN), toastr+jQuery (toasts), a component CSS kit (`.btn/.card/.badge/.form-*` + color tokens). On a different stack: replace Alpine with your component state, SortableJS with any drag lib (persist the ordered id array), toastr with your toast system.
- **Storefront:** server-rendered Blade; the selector is plain `<a>` links (works with zero JS). `primaryImage.full_url` accessor. i18n keys `ui.select_variant`, `ui.out_of_stock`.
- **Shared:** the admin product-search endpoint.

---

## 10. Reimplementation order (suggested)
1. Migration + `VariantFamily` model + `Product` additions.
2. Controller + routes + product-search endpoint.
3. `siblings()` helper + wire into product `show()`.
4. Storefront selector Blade (ship this first — pure server-render, high value).
5. Admin index view + Alpine + SortableJS + modals + sidebar link.
6. Walk every §6 edge case + §8 checklist.

---

## 11. (Optional) Legacy SKU seeding — skip unless you want auto-bootstrap
The original had a support class `ProductFamily` with a hardcoded `FAMILIES` keyword map + `SKU_OVERRIDES`, and `detect($sku)` returning a family name by substring match. It was used ONCE inside the migration to auto-create families from existing SKUs (bucket active products by detected name, sort each bucket by ascending price, assign positions). On a fresh site with no SKU convention, **omit this entirely** and let admins build families manually. `detect()` also fed the storefront label in the original, but that's replaced above by `$product->variantFamily?->name`.
