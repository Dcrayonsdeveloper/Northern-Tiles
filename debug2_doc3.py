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

# Show last 500 chars of bloated bodies
for sku in ['NTD4382', 'NTD4394', 'NTD4418', 'NTD4072', 'NTD4105']:
    body = bodies[sku]
    print(f"\n=== {sku} ({len(body)} chars) - LAST 600 chars ===")
    print(body[-600:])
    print(f"\n=== {sku} - FIRST 200 chars ===")
    print(body[:200])
