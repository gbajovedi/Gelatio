import json

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

with open('scripts/db_names.txt', 'w', encoding='utf-8') as out:
    for i in sorted(db, key=lambda x: x['name']):
        out.write(f"{i['id']}: {i['name']} ({i.get('category')})\n")

print(f"Wrote {len(db)} ingredients to scripts/db_names.txt")
