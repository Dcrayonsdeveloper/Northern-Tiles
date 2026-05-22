"""
Parse all products from doc4 (1c_2A87jtMjeBYFJY7sK9EPfkqTuG1kkuILJ0eff6plo).
Output: storage/app/products_doc4.json

Doc4 format differences from doc3:
- Sections use ## (H2) not ### (H3)  → rendered as <h3> in output
- Product Specifications at ### (H3)
- No mojibake; ² is proper U+00B2
"""
import json, re

RAW_FILE = r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\doc4_raw.txt"
OUT_FILE = r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\products_doc4.json"

with open(RAW_FILE, 'r', encoding='utf-8-sig') as f:
    text = f.read()

# Normalize superscript 2 and stray characters
text = text.replace('²', '2').replace('²', '2')
# Normalize smart quotes / dashes
text = text.replace('—', ' - ').replace('–', ' - ')
text = text.replace('’', "'").replace('“', '"').replace('”', '"')

# Split on "# NTDxxxx" — handle malformed variants like "# NTD4140**  "
parts = re.split(r'(?m)^#\s+\*?\*?(NTD\d+)[*\s]*$', text)
bodies = {}
i = 1
while i < len(parts) - 1:
    bodies[parts[i].strip()] = parts[i + 1].strip()
    i += 2

print(f"Found {len(bodies)} product blocks")

# ─── Category assignment ─────────────────────────────────────────────────────
def get_category(sku):
    return (36, 'floor-wall-tiles', 'Floor & Wall Tile')

def strip_tagline(name):
    """Remove subtitle after ' - Uppercase...' pattern."""
    name = re.sub(r'\s*[-—–]\s+[A-Z].+$', '', name)
    return name.strip()

# ─── Slug generator ──────────────────────────────────────────────────────────
def make_slug(name, cat_slug):
    s = name.lower()
    s = re.sub(r'\d+x\d+(?:x\d+)?(?:mm|cm)?', '', s)
    s = re.sub(r'(?<!\w)\d+mm\b', '', s)
    s = re.sub(r'(?<!\w)\d+cm\b', '', s)
    s = re.sub(r'[^a-z0-9\s-]', ' ', s)
    words = s.split()
    clean = []
    for w in words:
        if w and (not clean or w != clean[-1]):
            clean.append(w)
    slug = '-'.join(clean).strip('-')
    slug = re.sub(r'-tile$', '-tiles', slug)
    if not slug.endswith(cat_slug):
        slug = slug.rstrip('-') + '-' + cat_slug
    slug = re.sub(r'-{2,}', '-', slug)
    return slug.strip('-')

# ─── HTML helpers ─────────────────────────────────────────────────────────────
def inline_html(s):
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    return s.strip()

def bullet_li(line):
    stripped = re.sub(r'^\s+[-*]\s+', '', line).strip()
    m = re.match(r'\*\*([^*:]+:)\*\*\s*(.*)', stripped)
    if m:
        return f'<li><strong>{m.group(1)}</strong> {inline_html(m.group(2))}</li>'
    return f'<li>{inline_html(stripped)}</li>'

def content_to_html(lines):
    out = []; in_list = False; para = []

    def flush_p():
        t = ' '.join(l.strip() for l in para if l.strip())
        if t:
            out.append(f'<p>{inline_html(t)}</p>')
        para.clear()

    def close_ul():
        nonlocal in_list
        if in_list:
            out.append('</ul>')
            in_list = False

    for line in lines:
        s = line.strip()
        if not s:
            flush_p()
            continue
        if re.match(r'\s+[-*]\s+', line) or re.match(r'^[-*]\s+', line):
            flush_p()
            if not in_list:
                out.append('<ul>')
                in_list = True
            out.append(f'  {bullet_li(line)}')
        else:
            close_ul()
            para.append(s)

    flush_p()
    close_ul()
    return '\n'.join(out)

# ─── Section parser ───────────────────────────────────────────────────────────
# In doc4: H1 = product title (skip), H2 = sections/meta/overview, H3 = specs
HEADING_RE = re.compile(r'^(#{1,6})\s+(.+)', re.MULTILINE)
SKIP_PATS  = [r'meta\s+description', r'product\s+specifications?', r'product\s+title', r'shopify']
OVRVW_PATS = [r'product\s+overview']

def clean_heading(h):
    h = re.sub(r'^\*\*(.+)\*\*$', r'\1', h.strip())
    h = re.sub(r'^\d+\.\s+', '', h)
    h = h.strip('*:').strip()
    return h

def is_skip(h):
    return any(re.search(p, clean_heading(h).lower()) for p in SKIP_PATS)

def is_overview(h):
    return any(re.search(p, clean_heading(h).lower()) for p in OVRVW_PATS)

def parse_body(body):
    sections = []
    lines = body.splitlines()
    cur_kind = 'pre'; cur_head = None; cur_lines = []

    def save():
        if cur_head is not None or cur_lines:
            sections.append((cur_kind, cur_head, cur_lines[:]))

    for line in lines:
        m = HEADING_RE.match(line)
        if m:
            save()
            level = len(m.group(1))
            h = m.group(2).strip()
            if level == 1:           kind = 'skip'    # H1 = product title
            elif is_skip(h):         kind = 'skip'
            elif is_overview(h):     kind = 'overview'
            else:                    kind = 'section'
            cur_kind = kind; cur_head = clean_heading(h); cur_lines = []
        else:
            cur_lines.append(line)
    save()
    return sections

def extract_name(body):
    # H1 bold: # **TITLE**
    for m in re.finditer(r'^#\s+\*\*([^*\n]+)\*\*\s*$', body, re.MULTILINE):
        name = re.sub(r'^NTD\d+\s*', '', m.group(1).strip())
        if name and not re.search(r'meta\s+description|specifications?', name, re.I):
            return name
    # H1 plain: # TITLE
    for m in re.finditer(r'^#\s+([^*\n#]+?)\s*$', body, re.MULTILINE):
        name = re.sub(r'^NTD\d+\s*', '', m.group(1).strip()).strip('*')
        if name and not re.search(r'meta\s+description|specifications?', name, re.I):
            return name
    # H2 bold at top of body (some products use ## for title): ## **TITLE**
    for m in re.finditer(r'^#{2,3}\s+\*\*([^*\n]+)\*\*\s*$', body, re.MULTILINE):
        name = re.sub(r'^NTD\d+\s*', '', m.group(1).strip())
        if name and not re.search(r'meta\s+description|specifications?|overview', name, re.I):
            return name
    return ''

def extract_meta_description(body):
    m = re.search(
        r'(?:#{1,6}\s+)?\*?\*?Meta Description[:\*]*\*?\*?\s*\n+(.*?)(?=\n#{1,6}|\n\*\*[A-Z]|\Z)',
        body, re.I | re.DOTALL
    )
    if m:
        txt = ' '.join(l.strip() for l in m.group(1).splitlines() if l.strip())
        return re.sub(r'\*\*([^*]+)\*\*', r'\1', txt).strip()
    return ''

def extract_specs(body):
    specs = {}
    spec_m = re.search(
        r'(?:#{1,6})\s+\*?\*?Product Specifications?\*?\*?\s*\n(.*?)(?=\n#{1,6}|\Z)',
        body, re.DOTALL | re.I
    )
    if spec_m:
        for line in spec_m.group(1).splitlines():
            m = re.match(r'\s+[-*]\s+\*\*([^*:]+):\*\*\s*(.+)', line)
            if m:
                specs[m.group(1).strip()] = m.group(2).strip()
    return specs

def build_description(body):
    sections = parse_body(body)
    parts = []; intro_done = False

    for kind, head, content_lines in sections:
        if kind in ('skip', 'pre'):
            continue
        if kind == 'overview':
            if not intro_done:
                para = ' '.join(l.strip() for l in content_lines if l.strip())
                para = re.sub(r'\*\*([^*]+)\*\*', r'\1', para).strip()
                if para:
                    parts.append(f'<p>{para}</p>')
                    intro_done = True
            continue
        ch = clean_heading(head or '')
        if not ch:
            continue
        html = content_to_html(content_lines)
        if html.strip():
            parts.append(f'<h3>{ch}</h3>\n{html}')
        else:
            parts.append(f'<h3>{ch}</h3>')

    return '\n\n'.join(parts)

def build_short_desc(meta_desc):
    text = re.sub(r'<[^>]+>', '', meta_desc)
    m = re.search(r'^(.{40,200}[.!?])', text)
    return m.group(1).strip() if m else text[:200].strip()

def extract_tags(specs):
    tags = []
    for key in ['Style', 'Finish', 'Material', 'Application Space',
                'Country of Origin', 'Colour', 'Colours', 'Slip Rating']:
        if key in specs:
            val = specs[key]
            sep = ',' if ',' in val else '/'
            tags.extend([t.strip() for t in val.split(sep)])
    return [t for t in tags if t and len(t) > 1]

# ─── Process all products ─────────────────────────────────────────────────────
results = {}
for sku, body in bodies.items():
    cat_id, cat_slug, cat_name = get_category(sku)

    name       = extract_name(body)
    meta_desc  = extract_meta_description(body)
    specs      = extract_specs(body)
    desc       = build_description(body)
    short_d    = build_short_desc(meta_desc)
    clean_name = strip_tagline(name)
    slug       = make_slug(clean_name, cat_slug) if clean_name else ''
    tags       = extract_tags(specs)

    sqm = None
    if 'Quantity Per Box' in specs:
        m = re.search(r'([\d.]+)\s*m2', specs['Quantity Per Box'], re.I)
        if m:
            sqm = float(m.group(1))

    results[sku] = {
        'sku':               sku,
        'name':              clean_name,
        'slug':              slug,
        'meta_title':        clean_name[:160] if clean_name else '',
        'meta_description':  meta_desc[:320] if meta_desc else '',
        'short_description': short_d,
        'description':       desc,
        'specifications':    specs,
        'sqm_per_box':       sqm,
        'tags':              tags,
        'category_id':       cat_id,
        'category_name':     cat_name,
    }

# ─── Deduplicate slugs ────────────────────────────────────────────────────────
seen = {}
for sku, p in results.items():
    base = p['slug']
    if not base:
        continue
    if base not in seen:
        seen[base] = sku
    else:
        c = 2
        while f'{base}-{c}' in seen:
            c += 1
        p['slug'] = f'{base}-{c}'
        seen[f'{base}-{c}'] = sku

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f'Processed {len(results)} products -> {OUT_FILE}')
print()
for sku, p in results.items():
    nm = (p['name'] or 'NO NAME')[:50]
    sl = p['slug'][:55]
    d  = len(p['description'])
    m  = bool(p['meta_description'])
    print(f"{sku}: {nm!r} | slug={sl} | desc={d}ch | meta={'Y' if m else 'N'}")
