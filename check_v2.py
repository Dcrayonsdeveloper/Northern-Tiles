import json

with open('storage/app/products_v2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check for slug duplicates
slugs = {}
for sku, p in data.items():
    s = p['slug']
    if s not in slugs:
        slugs[s] = []
    slugs[s].append(sku)

dups = {s: skus for s, skus in slugs.items() if len(skus) > 1}
print('=== SLUG DUPLICATES ===')
for s, skus in dups.items():
    print(f'  {s}: {skus}')

# Check for empty/bad names
print()
print('=== NAME ISSUES ===')
for sku, p in data.items():
    nm = p['name']
    if not nm or sku in nm[:10]:
        print(f'  {sku}: name={repr(nm[:80])}')

# Full slug list
print()
print('=== ALL SLUGS ===')
for sku, p in data.items():
    print(f'  {sku}: {p["slug"]}')

# NTD4287 detail
print()
p = data['NTD4287']
print('=== NTD4287 ===')
print('name:', p['name'])
print('slug:', p['slug'])
