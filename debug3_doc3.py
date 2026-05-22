import re

with open(r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\doc3_raw.txt", 'r', encoding='utf-8-sig') as f:
    text = f.read()

text = text.replace('â€"', '-').replace('â€™', "'").replace('â€œ', '"').replace('â€', '"')
text = text.replace('Â²', '2').replace('Â', '')

parts = re.split(r'(?m)^# (NTD\d+)\s*$', text)
bodies = {}
i = 1
while i < len(parts) - 1:
    sku = parts[i].strip()
    bodies[sku] = parts[i+1].strip()
    i += 2

# Inspect NTD4418 at positions 3000-5000 to see what comes after the first product
body = bodies['NTD4418']
print(f"NTD4418 length: {len(body)}")
print("\n=== chars 3500-5000 ===")
print(body[3500:5000])

print("\n=== chars 5000-6500 ===")
print(body[5000:6500])

# Also check for product-title-like headings in body
product_headings = re.findall(r'(?m)^#+\s+\*\*[A-Z][A-Z ]+', body)
print(f"\n=== Product-like headings in NTD4418 body ===")
for h in product_headings:
    print(f"  {h[:80]}")
