import re

with open(r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\doc3_raw.txt", 'r', encoding='utf-8-sig') as f:
    text = f.read()

text = text.replace('â€"', '-').replace('â€™', "'")

parts = re.split(r'(?m)^#\s+\*?\*?(NTD\d+)[*\s]*$', text)
bodies = {}
i = 1
while i < len(parts) - 1:
    sku = parts[i].strip()
    bodies[sku] = parts[i+1].strip()
    i += 2

body = bodies.get('NTD4422', '')
print(f"NTD4422 body length: {len(body)}")
print("=== FIRST 500 chars ===")
print(body[:500])
