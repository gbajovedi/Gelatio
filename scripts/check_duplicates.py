import json
import re

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

def norm(s):
    s = s.lower().strip()
    for a, b in [('á','a'),('à','a'),('ã','a'),('â','a'),('é','e'),('ê','e'),('í','i'),('ó','o'),('ô','o'),('õ','o'),('ú','u'),('ç','c')]:
        s = s.replace(a, b)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

exact_dup = []
similar = []

for i in range(len(db)):
    for j in range(i+1, len(db)):
        n1 = norm(db[i]['name'])
        n2 = norm(db[j]['name'])
        if n1 == n2:
            exact_dup.append((db[i], db[j]))
        elif (n1 in n2 or n2 in n1) and abs(len(n1) - len(n2)) <= 6:
            similar.append((db[i], db[j]))

print(f"Exact duplicates found: {len(exact_dup)}")
for a, b in exact_dup:
    print(f"  [{a['id']}] {a['name']} == [{b['id']}] {b['name']}")

print(f"\nSimilar / Near duplicate names found: {len(similar)}")
for a, b in similar:
    print(f"  [{a['id']}] {a['name']} <===> [{b['id']}] {b['name']}")
