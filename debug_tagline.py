import re, unicodedata

with open(r"c:\Users\pc\Desktop\Northern-Tiles\storage\app\doc3_raw.txt", 'r', encoding='utf-8-sig') as f:
    text = f.read()

# Find the ELEMENT GREY MATT title
idx = text.find('ELEMENT GREY MATT 600x600mm')
snippet = text[idx:idx+100]
print("Raw snippet:", repr(snippet))
print("Chars:")
for i, c in enumerate(snippet[:50]):
    print(f"  [{i}] ord={ord(c)} char={repr(c)} name={unicodedata.name(c, 'UNKNOWN')}")
