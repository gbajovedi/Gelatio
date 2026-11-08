import json

with open('src/data/recipes.json', 'r', encoding='utf-8') as f:
    recipes = json.load(f)

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    ingredients = json.load(f)

with open('src/data/styles.json', 'r', encoding='utf-8') as f:
    styles_dict = json.load(f)

ing_map = {i['name'].lower().strip(): i for i in ingredients}

def get_style(r):
    target = r.get('targetStyle') or r.get('category') or ''
    if target in styles_dict:
        return target, styles_dict[target]
    for name, s in styles_dict.items():
        if name.lower() in target.lower() or target.lower() in name.lower():
            return name, s
    # Default fallbacks
    cat = r.get('category', '').lower()
    if 'sorbet' in cat:
        return 'Sorbets', styles_dict['Sorbets']
    if 'proteico' in cat:
        return 'Gelatos Proteicos', styles_dict['Gelatos Proteicos']
    if 'zero' in cat or 'diet' in cat:
        return 'Gelatos Zero Açúcar', styles_dict['Gelatos Zero Açúcar']
    if 'chocolate' in cat:
        return 'Gelatos de Leite com Chocolate', styles_dict.get('Gelatos de Leite com Chocolate', styles_dict['Gelatos de Leite'])
    if 'oleaginosa' in cat or 'pistache' in cat or 'avelã' in cat:
        return 'Gelatos de Oleaginosas', styles_dict['Gelatos de Oleaginosas']
    return 'Gelatos de Leite', styles_dict['Gelatos de Leite']

results = []

for r in recipes:
    style_name, style = get_style(r)
    total_g = r.get('totalGrams', 0)
    if total_g == 0:
        total_g = sum(item['grams'] for item in r['ingredients'])
    
    fat, sugars, msnf, ts, pac, pod = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    missing = []
    
    for item in r['ingredients']:
        n = item['name'].lower().strip()
        ing = ing_map.get(n)
        if not ing:
            missing.append(item['name'])
            continue
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
    
    issues = []
    if style:
        s_min = style.get('min', {})
        s_max = style.get('max', {})
        
        # Margem de tolerância técnica (±0.6% ou ±4 PAC)
        if 'fat' in s_min and (fat / total_g) < (s_min['fat'] - 0.006):
            issues.append(f"Gordura baixa: {fat_pct:.1f}% (min estilo: {s_min['fat']*100:.1f}%)")
        if 'fat' in s_max and (fat / total_g) > (s_max['fat'] + 0.006):
            issues.append(f"Gordura alta: {fat_pct:.1f}% (max estilo: {s_max['fat']*100:.1f}%)")
            
        if 'sugars' in s_min and (sugars / total_g) < (s_min['sugars'] - 0.006):
            issues.append(f"Acucares baixos: {sugars_pct:.1f}% (min estilo: {s_min['sugars']*100:.1f}%)")
        if 'sugars' in s_max and (sugars / total_g) > (s_max['sugars'] + 0.006):
            issues.append(f"Acucares altos: {sugars_pct:.1f}% (max estilo: {s_max['sugars']*100:.1f}%)")
            
        if 'msnf' in s_min and (msnf / total_g) < (s_min['msnf'] - 0.006):
            issues.append(f"SLNG baixo: {msnf_pct:.1f}% (min estilo: {s_min['msnf']*100:.1f}%)")
        if 'msnf' in s_max and (msnf / total_g) > (s_max['msnf'] + 0.006):
            issues.append(f"SLNG alto: {msnf_pct:.1f}% (max estilo: {s_max['msnf']*100:.1f}%)")
            
        if 'totalSolids' in s_min and (ts / total_g) < (s_min['totalSolids'] - 0.012):
            issues.append(f"ST baixo: {ts_pct:.1f}% (min estilo: {s_min['totalSolids']*100:.1f}%)")
        if 'totalSolids' in s_max and (ts / total_g) > (s_max['totalSolids'] + 0.012):
            issues.append(f"ST alto: {ts_pct:.1f}% (max estilo: {s_max['totalSolids']*100:.1f}%)")
            
        if 'pac' in s_min and rel_pac < (s_min['pac'] - 4):
            issues.append(f"PAC baixo: {rel_pac:.1f} (min estilo: {s_min['pac']})")
        if 'pac' in s_max and rel_pac > (s_max['pac'] + 4):
            issues.append(f"PAC alto: {rel_pac:.1f} (max estilo: {s_max['pac']})")

    # Arenosidade check: max safe lactose (SLNG <= (100 - ST) * 0.3)
    free_water = 100 - ts_pct
    max_safe_msnf = free_water * 0.30
    if msnf_pct > max_safe_msnf + 0.5:
        issues.append(f"Risco de Arenosidade: SLNG {msnf_pct:.1f}% > teto seguro {max_safe_msnf:.1f}%")

    if issues or missing:
        results.append({
            'id': r['id'],
            'name': r['name'],
            'category': r.get('category'),
            'style': style_name,
            'issues': issues,
            'missing': missing,
            'metrics': {
                'fat': round(fat_pct, 1),
                'sugars': round(sugars_pct, 1),
                'msnf': round(msnf_pct, 1),
                'ts': round(ts_pct, 1),
                'pac': round(rel_pac, 1),
                'pod': round(rel_pod, 1)
            }
        })

print(f"Total de receitas avaliadas: {len(recipes)}")
print(f"Receitas com apontamentos em relacao as faixas teoricas do estilo: {len(results)}")

for item in results:
    print(f"\n[{item['id']}] {item['name']} | Estilo: {item['style']}")
    if item['missing']:
        print(f"  Insumos nao encontrados: {item['missing']}")
    for iss in item['issues']:
        print(f"  * {iss}")
    print(f"  Metricas: Gord={item['metrics']['fat']}%, Acuc={item['metrics']['sugars']}%, SLNG={item['metrics']['msnf']}%, ST={item['metrics']['ts']}%, PAC={item['metrics']['pac']}, POD={item['metrics']['pod']}")
