import json

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    ingredients = json.load(f)

with open('src/data/recipes.json', 'r', encoding='utf-8') as f:
    recipes = json.load(f)

with open('src/data/styles.json', 'r', encoding='utf-8') as f:
    styles = json.load(f)

ing_map = {i['name'].lower().strip(): i for i in ingredients}
condensed_recipes = ['rec_33', 'rec_37', 'rec_48', 'rec_54', 'rec_60', 'rec_69', 'rec_70', 'rec_208']

print("=== VERIFICAÇÃO TÉRMICA DAS RECEITAS COM LEITE CONDENSADO (PADRÃO BRASIL) ===")
for r in recipes:
    if r['id'] in condensed_recipes:
        total_g = r['totalGrams']
        fat = 0.0
        sugars = 0.0
        msnf = 0.0
        ts = 0.0
        pac = 0.0
        pod = 0.0
        
        for item in r['ingredients']:
            ing = ing_map.get(item['name'].lower().strip())
            if ing:
                g = item['grams']
                fat += g * ing.get('fat', 0)
                sugars += g * ing.get('sugars', 0)
                msnf += g * ing.get('msnf', 0)
                ts += g * ing.get('totalSolids', 0)
                pac += g * ing.get('pac', 0)
                pod += g * ing.get('pod', 0)
        
        fat_pct = (fat / total_g) * 100
        sugars_pct = (sugars / total_g) * 100
        msnf_pct = (msnf / total_g) * 100
        ts_pct = (ts / total_g) * 100
        rel_pac = (pac * 1000) / total_g
        rel_pod = (pod * 1000) / total_g
        
        print(f"\n[{r['id']}] {r['name']}")
        print(f"  Gordura: {fat_pct:.1f}% | Açúcares: {sugars_pct:.1f}% | SLNG: {msnf_pct:.1f}% | ST: {ts_pct:.1f}%")
        print(f"  PAC Relativo: {rel_pac:.1f} (Faixa típica: 220-300) | POD: {rel_pod:.1f}")
        
        # Check if PAC is within normal serving range
        assert 220 <= rel_pac <= 320, f"PAC fora de faixa em {r['id']}: {rel_pac}"
        assert 34 <= ts_pct <= 46, f"ST fora de faixa em {r['id']}: {ts_pct}"

print("\nTodas as receitas com Leite Condensado estão perfeitamente equilibradas na faixa ideal de vitrine!")
