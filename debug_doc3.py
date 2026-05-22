import re

with open(r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\doc3_raw.txt", 'r', encoding='utf-8-sig') as f:
    text = f.read()

text = text.replace('â€"', '-').replace('â€™', "'").replace('â€œ', '"').replace('â€', '"')
text = text.replace('Â²', '2').replace('Â', '')

parts = re.split(r'(?m)^# (NTD\d+)\s*$', text)
print(f"Split into {len(parts)} parts -> {(len(parts)-1)//2} products")

bodies = {}
i = 1
while i < len(parts) - 1:
    sku = parts[i].strip()
    body = parts[i+1].strip()
    bodies[sku] = body
    i += 2

# Report on long bodies
print("\n=== BODY LENGTHS ===")
for sku, body in bodies.items():
    print(f"  {sku}: {len(body)} chars")
