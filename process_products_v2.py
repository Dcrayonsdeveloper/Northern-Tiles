"""
Process all 100 products from the new Google Doc.
Generates: description HTML, slugs, names, meta_desc, specs, tags, category.
"""
import json, re

DOC_FILE = r"C:\Users\pc\.claude\projects\c--Users-pc-Desktop-Northern-Tiles\844c2770-4abd-4de9-8466-af2eba71c4a0\tool-results\mcp-claude_ai_Google_Drive-read_file_content-1779439440986.txt"
OUT_FILE = r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\products_v2.json"

with open(DOC_FILE, 'r', encoding='utf-8') as f:
    raw = f.read()
data = json.loads(raw)
text = data['fileContent']

parts = re.split(r'(?m)^# (NTD\d+)\s*$', text)
bodies = {}
i = 1
while i < len(parts)-1:
    bodies[parts[i].strip()] = parts[i+1].strip()
    i += 2

# ─── Category assignment (category_id, slug_suffix) ───────────────────────────
# Square tiles → Tiles (id=31, slug suffix = tiles)
SQUARE_SKUS  = {'NTD4256','NTD4257','NTD4258','NTD4271','NTD4272','NTD4273',
                'NTD4274','NTD4275','NTD4276','NTD4277','NTD4278'}
# External → External (id=32, slug suffix = external)
EXTERNAL_SKUS = {'NTD4013','NTD4014','NTD4015','NTD4018','NTD4019',
                 'NTD4188','NTD4189','NTD4190','NTD4191','NTD4192',
                 'NTD4403','NTD4404','NTD4405','NTD4406','NTD4407',
                 'NTD4408','NTD4409','NTD4410','NTD4411','NTD4412',
                 'NTD4414','NTD4415','NTD4416','NTD4431','NTD4432',
                 'NTD4433','NTD4434'}

def get_category(sku):
    if sku in EXTERNAL_SKUS:
        return (32, 'external', 'External')
    if sku in SQUARE_SKUS:
        return (31, 'tiles', 'Tiles')
    return (35, 'wall-tiles', 'Wall Tile')

# ─── Slug generator ────────────────────────────────────────────────────────────
def make_slug(raw_name, cat_slug):
    """Remove dimensions/sizes, lowercase, hyphenate, append category slug."""
    s = raw_name.lower()
    # Remove dimension patterns: 600x600mm, 60x246, 48x450mm, 132x132mm, 20mm, 10mm etc.
    s = re.sub(r'\d+x\d+(?:x\d+)?(?:mm|cm)?', '', s)  # 600x600mm, 400x600x80mm
    s = re.sub(r'(?<!\w)\d+mm\b', '', s)                # standalone 20mm, 10mm
    s = re.sub(r'(?<!\w)\d+cm\b', '', s)
    # Remove redundant size-like words
    s = re.sub(r'\b(r11|p5|p4|p3)\b', lambda m: m.group(0), s)  # keep R11 rating
    # Remove special chars
    s = re.sub(r'[^a-z0-9\s-]', ' ', s)
    # Tokenise and clean
    words = s.split()
    # Remove duplicate consecutive words
    clean = []
    for w in words:
        if w and (not clean or w != clean[-1]):
            clean.append(w)
    slug = '-'.join(clean).strip('-')
    # Remove trailing -tile (must end with -tiles)
    slug = re.sub(r'-tile$', '-tiles', slug)
    # Append category slug if not already ending with it
    if not slug.endswith(cat_slug):
        slug = slug.rstrip('-') + '-' + cat_slug
    # Collapse multiple hyphens
    slug = re.sub(r'-{2,}', '-', slug)
    return slug.strip('-')

# ─── HTML helpers ──────────────────────────────────────────────────────────────
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
        if t: out.append(f'<p>{inline_html(t)}</p>')
        para.clear()
    def close_ul():
        nonlocal in_list
        if in_list: out.append('</ul>'); in_list = False
    for line in lines:
        s = line.strip()
        if not s: flush_p(); continue
        if re.match(r'\s+[-*]\s+', line):
            flush_p();
            if not in_list: out.append('<ul>'); in_list = True
            out.append(f'  {bullet_li(line)}')
        else:
            close_ul(); para.append(s)
    flush_p(); close_ul()
    return '\n'.join(out)

# ─── Section parser ────────────────────────────────────────────────────────────
HEADING_RE = re.compile(r'^(#{1,6})\s+(.+)', re.MULTILINE)

SKIP_PATS = [
    r'product\s+title',
    r'shopify\s+product\s+title',
    r'meta\s+description',
    r'product\s+specifications?',
    r'^\d+\.\s+',  # numbered sections like "1. Product Title"
]
OVERVIEW_PATS = [r'product\s+overview', r'^\d+\.\s+product\s+overview']

def clean_heading(h):
    h = re.sub(r'^\*\*(.+)\*\*$', r'\1', h.strip())
    h = re.sub(r'^\d+\.\s+', '', h)
    h = re.sub(r'^\*\*\d+\.\s+(.+)\*\*$', r'\1', h)
    return h.strip('*').strip()

def is_skip(h):
    t = clean_heading(h).lower()
    return any(re.search(p, t) for p in SKIP_PATS)

def is_overview(h):
    t = clean_heading(h).lower()
    return any(re.search(p, t) for p in OVERVIEW_PATS)

# Also handle "**Product Overview**" as a non-heading bold line
BOLD_OVERVIEW_RE = re.compile(r'^\*\*Product Overview\*\*\s*$', re.IGNORECASE | re.MULTILINE)

def parse_body(body):
    """Return list of (kind, heading_text, content_lines) where kind in: skip/overview/section."""
    sections = []
    lines = body.splitlines()
    cur_kind = 'pre'; cur_head = None; cur_lines = []

    def save():
        if cur_head is not None or cur_lines:
            sections.append((cur_kind, cur_head, cur_lines[:]))

    for i, line in enumerate(lines):
        m = HEADING_RE.match(line)
        if m:
            save()
            h = m.group(2).strip()
            ch = clean_heading(h)
            if is_skip(h):   kind = 'skip'
            elif is_overview(h): kind = 'overview'
            else:            kind = 'section'
            cur_kind = kind; cur_head = ch; cur_lines = []
        else:
            # Check for **Product Overview** as bold paragraph
            if re.match(r'^\*\*Product Overview\*\*\s*$', line.strip(), re.IGNORECASE):
                save()
                cur_kind = 'overview'; cur_head = 'Product Overview'; cur_lines = []
            # Check for **Meta Description** line
            elif re.match(r'^\*\*Meta Description[:\*]*\*\*\s*$', line.strip(), re.IGNORECASE):
                save()
                cur_kind = 'skip'; cur_head = 'Meta Description'; cur_lines = []
            else:
                cur_lines.append(line)

    save()
    return sections

def extract_meta_description(body):
    """Extract meta description text from doc body."""
    # Look for "Meta Description" heading and grab following paragraph
    m = re.search(
        r'(?:#{1,6}\s+)?\*?\*?Meta Description[:\*]*\*?\*?\s*\n+(.*?)(?=\n#{1,6}|\n\*\*[A-Z]|\Z)',
        body, re.IGNORECASE | re.DOTALL
    )
    if m:
        txt = ' '.join(l.strip() for l in m.group(1).splitlines() if l.strip())
        return re.sub(r'\*\*([^*]+)\*\*', r'\1', txt).strip()
    return ''

def extract_name(body):
    """Extract full product title from doc."""
    m = re.search(r'^#\s+\*\*([^*\n]+)\*\*', body, re.MULTILINE)
    if m:
        name = m.group(1).strip()
    else:
        m = re.search(r'\*\*([A-Z][A-Za-z0-9 \-|/]+(?:mm|MM)?[^*]{0,80})\*\*', body[:600])
        name = m.group(1).strip() if m else ''
    # Strip accidental leading SKU (e.g. "NTD4287MASSIMO..." → "MASSIMO...")
    name = re.sub(r'^NTD\d+\s*', '', name)
    return name

def extract_specs(body):
    """Extract product specifications as dict."""
    specs = {}
    spec_m = re.search(
        r'(?:#{1,6})\s+\*?\*?Product Specifications?\*?\*?\s*\n(.*?)(?=\n#{1,6}|\Z)',
        body, re.DOTALL | re.IGNORECASE
    )
    if spec_m:
        for line in spec_m.group(1).splitlines():
            m = re.match(r'\s+[-*]\s+\*\*([^*:]+):\*\*\s*(.+)', line)
            if m:
                specs[m.group(1).strip()] = m.group(2).strip()
    return specs

def build_description(sku, body):
    """Build clean HTML description."""
    sections = parse_body(body)
    parts = []
    intro_done = False

    for kind, head, content_lines in sections:
        if kind in ('skip', 'pre'):
            continue
        if kind == 'overview':
            if not intro_done:
                # extract plain paragraph text
                para = ' '.join(l.strip() for l in content_lines if l.strip())
                para = re.sub(r'\*\*([^*]+)\*\*', r'\1', para).strip()
                if para:
                    parts.append(f'<p>{para}</p>')
                    intro_done = True
            continue
        # section
        ch = head if head else ''
        ch = clean_heading(ch)
        if not ch:
            continue
        html = content_to_html(content_lines)
        if html.strip():
            parts.append(f'<h3>{ch}</h3>\n{html}')
        else:
            parts.append(f'<h3>{ch}</h3>')

    return '\n\n'.join(parts)

def build_short_desc(meta_desc, intro):
    """Build short description from meta description or intro paragraph."""
    text = meta_desc or intro
    text = re.sub(r'<[^>]+>', '', text)  # strip HTML
    # Take up to first sentence
    m = re.search(r'^(.{40,200}[.!?])', text)
    return m.group(1).strip() if m else text[:200].strip()

def extract_tags(specs):
    tags = []
    for key in ['Style', 'Finish', 'Material', 'Application Space', 'Country of Origin',
                'Colour', 'Colours', 'Slip Rating']:
        if key in specs:
            val = specs[key]
            sep = ',' if ',' in val else '/'
            tags.extend([t.strip() for t in val.split(sep)])
    return [t for t in tags if t and len(t) > 1]

# ─── Process all products ──────────────────────────────────────────────────────
results = {}
for sku, body in bodies.items():
    cat_id, cat_slug, cat_name = get_category(sku)

    name        = extract_name(body)
    meta_desc   = extract_meta_description(body)
    specs       = extract_specs(body)
    description = build_description(sku, body)
    short_desc  = build_short_desc(meta_desc, re.sub(r'<[^>]+>', '', description[:300]))
    slug        = make_slug(name, cat_slug)
    tags        = extract_tags(specs)

    # Derived spec fields
    sqm = None
    if 'Quantity Per Box' in specs:
        m = re.search(r'([\d.]+)\s*m2', specs['Quantity Per Box'], re.IGNORECASE)
        if m: sqm = float(m.group(1))

    results[sku] = {
        'sku':          sku,
        'name':         name,
        'slug':         slug,
        'meta_title':   name[:160] if name else '',
        'meta_description': meta_desc[:320] if meta_desc else '',
        'short_description': short_desc,
        'description':  description,
        'specifications': specs,
        'sqm_per_box':  sqm,
        'tags':         tags,
        'category_id':  cat_id,
        'category_name': cat_name,
    }

# ─── Deduplicate slugs by appending -2, -3 etc. ──────────────────────────────
seen_slugs = {}
for sku, p in results.items():
    base = p['slug']
    if base not in seen_slugs:
        seen_slugs[base] = sku
    else:
        counter = 2
        while f'{base}-{counter}' in seen_slugs:
            counter += 1
        new_slug = f'{base}-{counter}'
        seen_slugs[new_slug] = sku
        p['slug'] = new_slug

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f'Processed {len(results)} products -> {OUT_FILE}')
print()
for sku, p in results.items():
    nm = (p['name'] or 'NO NAME')[:50]
    sl = p['slug'][:45]
    d  = len(p['description'])
    m  = bool(p['meta_description'])
    print(f"{sku}: {nm!r} | slug={sl} | desc={d}ch | meta={'Y' if m else 'N'}")
