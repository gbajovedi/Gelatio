import json

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

print(f"Initial ingredients count: {len(db)}")

# 1. Update Leite Condensado Integral (ing_95) to Brazilian MAPA / TACO / Moça standard
for item in db:
    if item['id'] == 'ing_95':
        item['name'] = 'Leite Condensado'
        item['fat'] = 0.08
        item['sugars'] = 0.44
        item['msnf'] = 0.21
        item['otherSolids'] = 0.0
        item['totalSolids'] = 0.73
        item['water'] = 0.27
        item['pod'] = 0.45
        item['pac'] = 0.55
        item['protein'] = 0.077
        item['density'] = 1.305
        item['hasAllergen'] = True
        item['allergenDetails'] = ['leite']
        print(f"Updated ing_95 to Brazilian Standard: fat=8%, sugars=44%, msnf=21%, ST=73%")

    # 2. Update Leite Condensado Desnatado (ing_96) to Brazilian Retail Sweetened Skim Standard (Moça Light)
    elif item['id'] == 'ing_96':
        item['name'] = 'Leite Condensado Desnatado'
        item['fat'] = 0.0
        item['sugars'] = 0.48
        item['msnf'] = 0.24
        item['otherSolids'] = 0.0
        item['totalSolids'] = 0.72
        item['water'] = 0.28
        item['pod'] = 0.50
        item['pac'] = 0.61
        item['protein'] = 0.095
        item['density'] = 1.310
        item['hasAllergen'] = True
        item['allergenDetails'] = ['leite']
        print(f"Updated ing_96 to Brazilian Standard: fat=0%, sugars=48%, msnf=24%, ST=72%, PAC=0.61")

    # 3. Update Manteiga (ing_116) to Brazilian Addolcire / MAPA standard (84% fat)
    elif item['id'] == 'ing_116':
        item['fat'] = 0.84
        item['sugars'] = 0.0
        item['msnf'] = 0.005
        item['otherSolids'] = 0.0
        item['totalSolids'] = 0.845
        item['water'] = 0.155
        item['protein'] = 0.008
        print(f"Updated ing_116 to Brazilian Standard: fat=84%, ST=84.5%, water=15.5%")

    # 4. Update Creme De Leite Fresco 35% (ing_55) to Brazilian Addolcire standard
    elif item['id'] == 'ing_55':
        item['fat'] = 0.35
        item['sugars'] = 0.0
        item['msnf'] = 0.058
        item['otherSolids'] = 0.0
        item['totalSolids'] = 0.408
        item['water'] = 0.592
        item['pac'] = 0.03
        item['pod'] = 0.01
        item['protein'] = 0.021
        print(f"Updated ing_55 to Brazilian Standard: fat=35%, msnf=5.8%, ST=40.8%")

# 5. Add new Brazilian items and disambiguated industrial item
new_items = [
    {
        "id": "ing_244",
        "name": "Leite Condensado Semidesnatado (6% Gordura)",
        "category": "Laticínios",
        "costKg": 19.50,
        "fat": 0.06,
        "sugars": 0.45,
        "msnf": 0.215,
        "otherSolids": 0.0,
        "totalSolids": 0.725,
        "water": 0.275,
        "protein": 0.075,
        "pod": 0.47,
        "pac": 0.57,
        "density": 1.308,
        "hasAllergen": True,
        "allergenDetails": ["leite"]
    },
    {
        "id": "ing_245",
        "name": "Leite Desnatado Concentrado sem Açúcar (Industrial)",
        "category": "Laticínios",
        "costKg": 14.00,
        "fat": 0.0,
        "sugars": 0.0,
        "msnf": 0.30,
        "otherSolids": 0.0,
        "totalSolids": 0.30,
        "water": 0.70,
        "protein": 0.111,
        "pod": 0.048,
        "pac": 0.30,
        "density": 1.122,
        "hasAllergen": True,
        "allergenDetails": ["leite"]
    }
]

existing_ids = {i['id'] for i in db}
for ni in new_items:
    if ni['id'] not in existing_ids:
        db.append(ni)
        print(f"Added item: {ni['id']} - {ni['name']}")

print(f"Final ingredients count: {len(db)}")

with open('src/data/ingredients.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print("Saved updated src/data/ingredients.json successfully.")
