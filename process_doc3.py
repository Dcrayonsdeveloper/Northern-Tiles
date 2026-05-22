"""
Parse all products from doc3 (1ubFbNNDMl9WVIlZcgZqdZa2u_q4A7Elb2nDAzGIcndE).
Output: storage/app/products_doc3.json
"""
import json, re

RAW_FILE = r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\doc3_raw.txt"
OUT_FILE = r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\products_doc3.json"

with open(RAW_FILE, 'r', encoding='utf-8-sig') as f:
    text = f.read()

# Fix mojibake: UTF-8 bytes read as CP1252 produce:
#   em dash U+2014 (E2 80 94) -> U+00E2 U+20AC U+201C (confirmed by debug)
#   en dash U+2013 (E2 80 93) -> U+00E2 U+20AC U+201D
#   right single quote U+2019 (E2 80 99) -> U+00E2 U+20AC U+2122
#   left double quote U+201C (E2 80 9C) -> U+00E2 U+20AC U+0153
EM_DASH  = 'â€“'  # mojibake for em dash
EN_DASH  = 'â€”'  # mojibake for en dash
RSQ      = 'â€™'  # mojibake for right single quote
LDQ      = 'â€œ'  # mojibake for left double quote
SQ2      = 'Â²'         # mojibake for superscript 2 (m2)

text = text.replace(EM_DASH, ' - ')
text = text.replace(EN_DASH, ' - ')
text = text.replace(RSQ, "'")
text = text.replace(LDQ, '"')
text = text.replace(SQ2, '2')
# Also handle proper Unicode equivalents
text = text.replace('—', ' - ').replace('–', ' - ')
text = text.replace('’', "'").replace('“', '"').replace('”', '"')
text = text.replace('Â', '').replace('²', '2')  # stray Â, ²

# Split on "# NTDxxxx" lines — handle malformed variants like "# NTD4419**  "
parts = re.split(r'(?m)^#\s+\*?\*?(NTD\d+)[*\s]*$', text)
bodies = {}
i = 1
while i < len(parts) - 1:
    bodies[parts[i].strip()] = parts[i + 1].strip()
    i += 2

print(f"Found {len(bodies)} product blocks")

# ─── Category assignment ────────────────────────────────────────────────────
EXTERNAL_SKUS = {
    'NTD4435', 'NTD4436', 'NTD4437', 'NTD4438',
    'NTD4397', 'NTD4398', 'NTD4399', 'NTD4400', 'NTD4401', 'NTD4402',
    'NTD4413',
}
DECORATIVE_SKUS = {
    'NTD4368', 'NTD4369', 'NTD4370', 'NTD4371',
    'NTD4439', 'NTD4440',
    'NTD4365', 'NTD4366', 'NTD4367',
    'NTD4372', 'NTD4373', 'NTD4374', 'NTD4375', 'NTD4376',
}

def get_category(sku):
    if sku in EXTERNAL_SKUS:
        return (37, 'outdoor-tiles', 'Outdoor Tile')
    if sku in DECORATIVE_SKUS:
        return (38, 'decorative-tile', 'Decorative Tile')
    return (36, 'floor-wall-tiles', 'Floor & Wall Tile')

def strip_tagline(name):
    """Remove subtitle/tagline: everything after ' - Uppercase...' pattern."""
    # Handle literal em/en dashes or hyphens used as separators
    name = re.sub(r'\s*[-—–]\s+[A-Z].+$', '', name)
    return name.strip()

# ─── Slug generator ─────────────────────────────────────────────────────────
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

# ─── HTML helpers ────────────────────────────────────────────────────────────
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

# ─── Section parser ──────────────────────────────────────────────────────────
HEADING_RE = re.compile(r'^(#{1,6})\s+(.+)', re.MULTILINE)
SKIP_PATS  = [r'product\s+title', r'shopify', r'meta\s+description', r'product\s+specifications?']
OVRVW_PATS = [r'product\s+overview']

def clean_heading(h):
    h = re.sub(r'^\*\*(.+)\*\*$', r'\1', h.strip())
    h = re.sub(r'^\d+\.\s+', '', h)
    return h.strip('*').strip()

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
            if level == 1:           kind = 'skip'   # H1 is always the product title
            elif is_skip(h):         kind = 'skip'
            elif is_overview(h):     kind = 'overview'
            else:                    kind = 'section'
            cur_kind = kind; cur_head = clean_heading(h); cur_lines = []
        else:
            if re.match(r'^\*\*Meta Description[:\*]*\*\*\s*$', line.strip(), re.I):
                save(); cur_kind = 'skip'; cur_head = 'Meta Description'; cur_lines = []
            elif re.match(r'^\*\*Product Overview\*\*\s*$', line.strip(), re.I):
                save(); cur_kind = 'overview'; cur_head = 'Product Overview'; cur_lines = []
            else:
                cur_lines.append(line)
    save()
    return sections

def extract_name(body):
    # H1 (bold or plain)
    for m in re.finditer(r'^#\s+\*?\*?([^*\n#]+?)\*?\*?\s*$', body, re.MULTILINE):
        name = re.sub(r'^NTD\d+\s*', '', m.group(1).strip()).strip('*').strip()
        if name and not re.search(r'meta\s+description|specifications?', name, re.I):
            return name
    # H2 bold
    for m in re.finditer(r'^#{2,3}\s+\*\*([^*\n]+)\*\*', body, re.MULTILINE):
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
    m = re.search(r'\*\*Meta Description:\*\*\s+(.+?)(?=\n\n|\n#{1,6}|\Z)', body, re.I | re.DOTALL)
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

# ─── Process all products ────────────────────────────────────────────────────
results = {}
for sku, body in bodies.items():
    cat_id, cat_slug, cat_name = get_category(sku)

    name      = extract_name(body)
    meta_desc = extract_meta_description(body)
    specs     = extract_specs(body)
    desc      = build_description(body)
    short_d   = build_short_desc(meta_desc)
    clean_name = strip_tagline(name)
    slug      = make_slug(clean_name, cat_slug) if clean_name else ''
    tags      = extract_tags(specs)

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

# ─── Deduplicate slugs ───────────────────────────────────────────────────────
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
