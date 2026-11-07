import json

with open("src/data/recipes.json", "r", encoding="utf-8") as f:
    recs = json.load(f)

for r in recs:
    for ing in r["ingredients"]:
        if ing["id"].startswith("prep_"):
            print(f"Recipe: {r['name']} uses {ing['id']} - {ing['name']} ({ing['grams']}g)")
            break
