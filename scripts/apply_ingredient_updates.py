import json

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

print(f"Initial ingredients count: {len(db)}")

# 1. Update existing divergent ingredients
updates = {
    'ing_96': {
        'fat': 0.0,
        'sugars': 0.0,
        'msnf': 0.30,
        'otherSolids': 0.0,
        'totalSolids': 0.30,
        'water': 0.70,
        'pod': 0.048,
        'pac': 0.30,
        'protein': 0.111,
        'density': 1.122
    },
    'ing_95': {
        'fat': 0.08,
        'sugars': 0.43,
        'msnf': 0.23,
        'otherSolids': 0.01,
        'totalSolids': 0.75,
        'water': 0.25,
        'pod': 0.45,
        'pac': 0.55,
        'protein': 0.085,
        'density': 1.305
    },
    'ing_103': {
        'fat': 0.01,
        'sugars': 0.0,
        'msnf': 0.96,
        'otherSolids': 0.0,
        'totalSolids': 0.97,
        'water': 0.03,
        'pod': 0.08,
        'pac': 0.55,
        'protein': 0.36
    },
    'ing_104': {
        'fat': 0.26,
        'sugars': 0.0,
        'msnf': 0.70,
        'otherSolids': 0.0,
        'totalSolids': 0.96,
        'water': 0.04,
        'pod': 0.06,
        'pac': 0.40,
        'protein': 0.27
    },
    'ing_13': {
        'name': 'Maltodextrina (18-20 DE)',
        'fat': 0.0,
        'sugars': 0.96,
        'msnf': 0.0,
        'otherSolids': 0.0,
        'totalSolids': 0.96,
        'water': 0.04,
        'pod': 0.175,
        'pac': 0.40,
        'protein': 0.0
    },
    'ing_10': {
        'name': 'Glucose em pó (Glucodry 38-42 DE)',
        'fat': 0.0,
        'sugars': 0.96,
        'msnf': 0.0,
        'otherSolids': 0.0,
        'totalSolids': 0.96,
        'water': 0.04,
        'pod': 0.29,
        'pac': 0.55,
        'protein': 0.0
    },
    'ing_88': {
        'fat': 0.0,
        'sugars': 0.07,
        'msnf': 0.0,
        'otherSolids': 0.90,
        'totalSolids': 0.97,
        'water': 0.03,
        'pod': 0.0,
        'pac': 0.60,
        'protein': 0.0
    },
    'ing_121': {
        'fat': 0.0,
        'sugars': 0.80,
        'msnf': 0.0,
        'otherSolids': 0.0,
        'totalSolids': 0.80,
        'water': 0.20,
        'pod': 1.20,
        'pac': 1.40,
        'protein': 0.0,
        'density': 1.438
    },
    'ing_146': {
        'fat': 0.54,
        'sugars': 0.05,
        'msnf': 0.0,
        'otherSolids': 0.39,
        'totalSolids': 0.98,
        'water': 0.02,
        'protein': 0.20
    },
    'ing_140': {
        'fat': 0.65,
        'sugars': 0.08,
        'msnf': 0.0,
        'otherSolids': 0.25,
        'totalSolids': 0.98,
        'water': 0.02,
        'protein': 0.15
    },
    'ing_47': {
        'fat': 0.30,
        'sugars': 0.55,
        'msnf': 0.10,
        'otherSolids': 0.05,
        'totalSolids': 1.0,
        'water': 0.0
    },
    'ing_196': {
        'fat': 0.0,
        'sugars': 1.0,
        'msnf': 0.0,
        'otherSolids': 0.0,
        'totalSolids': 1.0,
        'water': 0.0,
        'pod': 0.45,
        'pac': 1.0,
        'protein': 0.0
    },
    'ing_15': {
        'fat': 0.0,
        'sugars': 0.75,
        'msnf': 0.0,
        'otherSolids': 0.0,
        'totalSolids': 0.75,
        'water': 0.25,
        'pod': 1.30,
        'pac': 1.90,
        'protein': 0.0
    },
    'ing_9': {
        'fat': 0.0,
        'sugars': 1.0,
        'msnf': 0.0,
        'otherSolids': 0.0,
        'totalSolids': 1.0,
        'water': 0.0,
        'pod': 1.30,
        'pac': 1.90,
        'protein': 0.0
    }
}

for item in db:
    if item['id'] in updates:
        for k, v in updates[item['id']].items():
            item[k] = v
        print(f"Updated {item['id']}: {item['name']}")

# 2. Add the 10 missing canonical ingredients
new_items = [
    {
        "id": "ing_234",
        "name": "Creme de Leite 18% (Light)",
        "category": "Laticínios",
        "costKg": 18,
        "fat": 0.18,
        "sugars": 0,
        "msnf": 0.0731,
        "otherSolids": 0,
        "totalSolids": 0.2531,
        "water": 0.7469,
        "pod": 0.01,
        "pac": 0.04,
        "protein": 0.026,
        "density": 1.014,
        "hasAllergen": True,
        "allergenDetails": ["leite"]
    },
    {
        "id": "ing_235",
        "name": "Creme Plástico (Plastic Cream 80% Gordura)",
        "category": "Laticínios",
        "costKg": 45,
        "fat": 0.80,
        "sugars": 0,
        "msnf": 0.018,
        "otherSolids": 0,
        "totalSolids": 0.818,
        "water": 0.182,
        "pod": 0.0,
        "pac": 0.01,
        "protein": 0.006,
        "density": 0.954,
        "hasAllergen": True,
        "allergenDetails": ["leite"]
    },
    {
        "id": "ing_236",
        "name": "Leite Evaporado a Granel",
        "category": "Laticínios",
        "costKg": 22,
        "fat": 0.10,
        "sugars": 0,
        "msnf": 0.23,
        "otherSolids": 0,
        "totalSolids": 0.33,
        "water": 0.67,
        "pod": 0.04,
        "pac": 0.13,
        "protein": 0.085,
        "density": 1.104,
        "hasAllergen": True,
        "allergenDetails": ["leite"]
    },
    {
        "id": "ing_237",
        "name": "Soro de Leite em Pó Doce",
        "category": "Laticínios",
        "costKg": 25,
        "fat": 0.0,
        "sugars": 0.0,
        "msnf": 0.93,
        "otherSolids": 0,
        "totalSolids": 0.93,
        "water": 0.07,
        "pod": 0.15,
        "pac": 0.76,
        "protein": 0.129,
        "hasAllergen": True,
        "allergenDetails": ["leite"]
    },
    {
        "id": "ing_238",
        "name": "Whey Protein Isolado (WPI 90%)",
        "category": "Ovos & Proteínas",
        "costKg": 140,
        "fat": 0.008,
        "sugars": 0.008,
        "msnf": 0.0,
        "otherSolids": 0.934,
        "totalSolids": 0.95,
        "water": 0.05,
        "pod": 0.0,
        "pac": 0.01,
        "protein": 0.90,
        "hasAllergen": True,
        "allergenDetails": ["leite"]
    },
    {
        "id": "ing_239",
        "name": "Xarope de Milho 30 DE Líquido",
        "category": "Açúcares",
        "costKg": 15,
        "fat": 0.0,
        "sugars": 0.36,
        "msnf": 0.0,
        "otherSolids": 0.435,
        "totalSolids": 0.795,
        "water": 0.205,
        "pod": 0.25,
        "pac": 0.60,
        "protein": 0.0,
        "density": 1.417,
        "hasAllergen": False
    },
    {
        "id": "ing_240",
        "name": "Xarope de Milho 62 DE Líquido",
        "category": "Açúcares",
        "costKg": 16,
        "fat": 0.0,
        "sugars": 0.68,
        "msnf": 0.0,
        "otherSolids": 0.13,
        "totalSolids": 0.81,
        "water": 0.19,
        "pod": 0.65,
        "pac": 1.20,
        "protein": 0.0,
        "density": 1.417,
        "hasAllergen": False
    },
    {
        "id": "ing_241",
        "name": "Alulose",
        "category": "Açúcares",
        "costKg": 85,
        "fat": 0.0,
        "sugars": 1.0,
        "msnf": 0.0,
        "otherSolids": 0.0,
        "totalSolids": 1.0,
        "water": 0.0,
        "pod": 0.70,
        "pac": 1.90,
        "protein": 0.0,
        "hasAllergen": False
    },
    {
        "id": "ing_242",
        "name": "Pasta Concentrada de Frutas",
        "category": "Frutas & Polpas",
        "costKg": 95,
        "fat": 0.0,
        "sugars": 0.70,
        "msnf": 0.0,
        "otherSolids": 0.08,
        "totalSolids": 0.78,
        "water": 0.22,
        "pod": 1.0,
        "pac": 1.40,
        "protein": 0.01,
        "hasAllergen": False
    },
    {
        "id": "ing_243",
        "name": "Massa de Cacau 100% (Chocolate 100% Puro)",
        "category": "Chocolates & Cacau",
        "costKg": 65,
        "fat": 0.53,
        "sugars": 0.0,
        "msnf": 0.0,
        "otherSolids": 0.47,
        "totalSolids": 1.0,
        "water": 0.0,
        "pod": 0.0,
        "pac": 0.0,
        "protein": 0.09,
        "hasAllergen": False
    }
]

existing_ids = {i['id'] for i in db}
for ni in new_items:
    if ni['id'] not in existing_ids:
        db.append(ni)
        print(f"Added new canonical ingredient: {ni['id']} - {ni['name']}")

print(f"Final ingredients count: {len(db)}")

with open('src/data/ingredients.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print("Saved updated src/data/ingredients.json successfully.")
