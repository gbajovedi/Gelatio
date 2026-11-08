import json

with open('src/data/recipes.json', 'r', encoding='utf-8') as f:
    recipes = json.load(f)

old_ings = {
    'leite condensado': {'fat': 0.08, 'sugars': 0.44, 'msnf': 0.182, 'totalSolids': 0.72, 'pac': 0.55, 'pod': 0.43},
    'leite condensado desnatado': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.60, 'totalSolids': 0.60, 'pac': 0.52, 'pod': 0.083},
    'leite em pó desnatado': {'fat': 0.01, 'sugars': 0.0, 'msnf': 0.97, 'totalSolids': 0.98, 'pac': 0.55, 'pod': 0.08},
    'leite em pó integral': {'fat': 0.26, 'sugars': 0.0, 'msnf': 0.72, 'totalSolids': 0.98, 'pac': 0.40, 'pod': 0.06},
    'maltodextrina': {'fat': 0.0, 'sugars': 0.95, 'msnf': 0.0, 'totalSolids': 0.95, 'pac': 0.25, 'pod': 0.02},
    'glucose em pó': {'fat': 0.0, 'sugars': 0.96, 'msnf': 0.0, 'totalSolids': 0.96, 'pac': 0.70, 'pod': 0.40},
    'inulina - fibra vegetal': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.0, 'totalSolids': 0.95, 'pac': 0.20, 'pod': 0.0},
    'mel': {'fat': 0.0, 'sugars': 0.85, 'msnf': 0.0, 'totalSolids': 0.85, 'pac': 1.90, 'pod': 1.20},
    'pasta de pistache 100%': {'fat': 0.46, 'sugars': 0.08, 'msnf': 0.0, 'totalSolids': 0.98, 'pac': 0.0, 'pod': 0.0},
    'pasta de avelã s/ açúcar': {'fat': 0.61, 'sugars': 0.04, 'msnf': 0.0, 'totalSolids': 0.97, 'pac': 0.0, 'pod': 0.0},
    'chocolate branco': {'fat': 0.20, 'sugars': 0.55, 'msnf': 0.15, 'totalSolids': 1.0, 'pac': 0.0, 'pod': 0.0},
    'manteiga': {'fat': 0.82, 'sugars': 0.0, 'msnf': 0.02, 'totalSolids': 0.84, 'pac': 0.0, 'pod': 0.0},
    'creme de leite fresco 35%': {'fat': 0.35, 'sugars': 0.0, 'msnf': 0.06, 'totalSolids': 0.41, 'pac': 0.03, 'pod': 0.0054}
}

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    new_ings = {i['name'].lower().strip(): i for i in json.load(f)}

with open('src/data/styles.json', 'r', encoding='utf-8') as f:
    styles_dict = json.load(f)

def get_style(r):
    target = r.get('targetStyle') or r.get('category') or ''
    if target in styles_dict: return styles_dict[target]
    for name, s in styles_dict.items():
        if name.lower() in target.lower(): return s
    return styles_dict['Gelatos de Leite']

drifted = []

for r in recipes:
    style = get_style(r)
    total_g = r.get('totalGrams', sum(i['grams'] for i in r['ingredients']))
    
    old_pac, old_fat, old_msnf, old_ts = 0.0, 0.0, 0.0, 0.0
    new_pac, new_fat, new_msnf, new_ts = 0.0, 0.0, 0.0, 0.0
    
    for item in r['ingredients']:
        n = item['name'].lower().strip()
        g = item['grams']
        
        ni = new_ings.get(n, {})
        new_fat += g * ni.get('fat', 0)
        new_msnf += g * ni.get('msnf', 0)
        new_ts += g * ni.get('totalSolids', 0)
        new_pac += g * ni.get('pac', 0)
        
        oi = old_ings.get(n, ni)
        old_fat += g * oi.get('fat', 0)
        old_msnf += g * oi.get('msnf', 0)
        old_ts += g * oi.get('totalSolids', 0)
        old_pac += g * oi.get('pac', 0)
        
    old_rel_pac = (old_pac * 1000) / total_g
    new_rel_pac = (new_pac * 1000) / total_g
    
    s_min = style.get('min', {})
    s_max = style.get('max', {})
    
    old_in_pac = (s_min.get('pac', 0) <= old_rel_pac <= s_max.get('pac', 999))
    new_in_pac = (s_min.get('pac', 0) <= new_rel_pac <= s_max.get('pac', 999))
    
    # Check any parameter that was in bounds and fell out
    old_in_fat = (s_min.get('fat', 0) <= old_fat/total_g <= s_max.get('fat', 1))
    new_in_fat = (s_min.get('fat', 0) <= new_fat/total_g <= s_max.get('fat', 1))

    old_in_ts = (s_min.get('totalSolids', 0) <= old_ts/total_g <= s_max.get('totalSolids', 1))
    new_in_ts = (s_min.get('totalSolids', 0) <= new_ts/total_g <= s_max.get('totalSolids', 1))
    
    out_reasons = []
    if old_in_pac and not new_in_pac:
        out_reasons.append(f"PAC saiu da faixa ({s_min.get('pac')}-{s_max.get('pac')}): era {old_rel_pac:.1f}, agora {new_rel_pac:.1f}")
    if old_in_fat and not new_in_fat:
        out_reasons.append(f"Gordura saiu da faixa ({s_min.get('fat')*100:.1f}-{s_max.get('fat')*100:.1f}%): era {old_fat*100/total_g:.1f}%, agora {new_fat*100/total_g:.1f}%")
    if old_in_ts and not new_in_ts:
        out_reasons.append(f"ST saiu da faixa ({s_min.get('totalSolids')*100:.1f}-{s_max.get('totalSolids')*100:.1f}%): era {old_ts*100/total_g:.1f}%, agora {new_ts*100/total_g:.1f}%")

    if out_reasons:
        drifted.append({
            'id': r['id'],
            'name': r['name'],
            'reasons': out_reasons
        })

print(f"Total de receitas analisadas: {len(recipes)}")
print(f"Receitas que estavam DENTRO das metas do estilo e SAÍRAM após a calibração: {len(drifted)}")
for d in drifted:
    print(f"\n[{d['id']}] {d['name']}")
    for r in d['reasons']:
        print(f"  * {r}")
