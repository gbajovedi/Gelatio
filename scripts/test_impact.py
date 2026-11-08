import json

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

with open('src/data/recipes.json', 'r', encoding='utf-8') as f:
    recs = json.load(f)

db_dict = {i['name'].lower(): i for i in db}

# Check all recipes using any of the ingredients to be updated
target_ing_names = [
    'leite condensado', 'leite condensado desnatado', 'leite em pó desnatado',
    'leite em pó integral', 'maltodextrina', 'glucose em pó', 'inulina - fibra vegetal',
    'mel', 'pasta de pistache 100%', 'pasta de avelã s/ açúcar', 'chocolate branco',
    'trealose', 'açúcar invertido', 'frutose'
]

impacted_recs = []
for r in recs:
    has_target = False
    for ing in r['ingredients']:
        if ing['name'].lower() in target_ing_names:
            has_target = True
            break
    if has_target:
        impacted_recs.append(r['id'])

print(f"Total recipes impacted by calibrated parameters: {len(impacted_recs)} out of {len(recs)}")
