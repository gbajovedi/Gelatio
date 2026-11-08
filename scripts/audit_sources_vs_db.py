import json
import re
import os

def norm(s):
    if not s: return ''
    s = s.lower().strip()
    for a, b in [('á','a'),('à','a'),('ã','a'),('â','a'),('é','e'),('ê','e'),('í','i'),('ó','o'),('ô','o'),('õ','o'),('ú','u'),('ç','c')]:
        s = s.replace(a, b)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

def clean_val(v):
    if not v or v.strip() in ['-', '–', '~', '']: return 0.0
    v = v.replace('%', '').replace('g', '').replace(',', '.').strip()
    if ' - ' in v or ' a ' in v:
        parts = re.split(r'\s*[-a]\s*', v)
        try:
            return round((float(parts[0]) + float(parts[1])) / 2.0, 4)
        except:
            return 0.0
    try:
        return round(float(v), 4)
    except:
        return 0.0

# 1. Load DB
with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

db_map = {}
for item in db:
    n = norm(item['name'])
    db_map[n] = item

print(f"Total de ingredientes no Banco de Dados: {len(db)}")

# 2. Extract from Sources
sources_data = {}

def add_source_ing(canonical_name, data, source_name):
    n = norm(canonical_name)
    if n not in sources_data:
        sources_data[n] = {
            'canonical_name': canonical_name,
            'fat': data.get('fat', 0.0),
            'msnf': data.get('msnf', 0.0),
            'sugars': data.get('sugars', 0.0),
            'otherSolids': data.get('otherSolids', 0.0),
            'totalSolids': data.get('totalSolids', 0.0),
            'water': data.get('water', 0.0),
            'pac': data.get('pac', 0.0),
            'pod': data.get('pod', 0.0),
            'protein': data.get('protein', 0.0),
            'density': data.get('density', 0.0),
            'sources': [source_name],
            'category': data.get('category', 'Outros')
        }
    else:
        if source_name not in sources_data[n]['sources']:
            sources_data[n]['sources'].append(source_name)
        for k in ['fat', 'msnf', 'sugars', 'otherSolids', 'totalSolids', 'water', 'pac', 'pod', 'protein', 'density']:
            if sources_data[n][k] == 0.0 and data.get(k, 0.0) != 0.0:
                sources_data[n][k] = data[k]

# A. Addolcire Matriz Bromatológica
with open('Fontes/Markdown/gelato-profissional-addolcire.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_tab = False
for l in lines:
    if '| Insumo |' in l and 'Açúcares' in l:
        in_tab = True
        continue
    if in_tab:
        if l.strip().startswith('| :---'):
            continue
        elif l.strip().startswith('|'):
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 7:
                name = p[0]
                sug = clean_val(p[1]) / 100.0
                fat = clean_val(p[2]) / 100.0
                msnf = clean_val(p[3]) / 100.0
                other = clean_val(p[4]) / 100.0
                ts = clean_val(p[5]) / 100.0
                wat = clean_val(p[6]) / 100.0
                add_source_ing(name, {
                    'sugars': sug, 'fat': fat, 'msnf': msnf, 'otherSolids': other,
                    'totalSolids': ts, 'water': wat
                }, 'Addolcire')
        else:
            in_tab = False

# B. Carpigiani Tabela de Açúcares
with open('Fontes/Markdown/carpigiani-parametros-fisico-quimicos.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_sug = False
for l in lines:
    if '| Açúcar / Carboidrato |' in l:
        in_sug = True
        continue
    if in_sug:
        if l.strip().startswith('| :---'):
            continue
        elif l.strip().startswith('|'):
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 4:
                name = p[0]
                pod = clean_val(p[2])
                pac = clean_val(p[3])
                add_source_ing(name, {
                    'pod': pod / 100.0,
                    'pac': pac / 100.0,
                    'sugars': 1.0,
                    'totalSolids': 1.0
                }, 'Carpigiani')
        else:
            in_sug = False

# C. Ice Cream 7th Edition Tabela 3.2
with open('Fontes/Markdown/ice-cream-7th-edition-referencia.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_ic = False
for l in lines:
    if '| Ingrediente | Gordura (%) | ESD / MSNF (%) |' in l:
        in_ic = True
        continue
    if in_ic:
        if l.strip().startswith('| :---'):
            continue
        elif l.strip().startswith('|'):
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 6:
                name = p[0]
                fat = clean_val(p[1]) / 100.0
                msnf = clean_val(p[2]) / 100.0
                sug = clean_val(p[3]) / 100.0
                prot = clean_val(p[4]) / 100.0
                ts = clean_val(p[5]) / 100.0
                dens = clean_val(p[6]) if len(p) > 6 else 0.0
                wat = round(1.0 - ts, 4) if ts > 0 else 0.0
                add_source_ing(name, {
                    'fat': fat, 'msnf': msnf, 'sugars': sug, 'protein': prot,
                    'totalSolids': ts, 'water': wat, 'density': dens
                }, 'Ice Cream 7th Ed')
        else:
            in_ic = False

# D. Gelato Irresistível Tabela 2
with open('Fontes/Markdown/gelato-irresistivel-livro-completo.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_gi = False
for l in lines:
    if '| Insumo | Água (%) | Açúcares (%) | Gorduras (%) |' in l:
        in_gi = True
        continue
    if in_gi:
        if l.strip().startswith('| :---'):
            continue
        elif l.strip().startswith('|'):
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 6:
                name = p[0]
                wat = clean_val(p[1]) / 100.0
                sug = clean_val(p[2]) / 100.0
                fat = clean_val(p[3]) / 100.0
                msnf = clean_val(p[4]) / 100.0
                other = clean_val(p[5]) / 100.0
                ts = clean_val(p[6]) / 100.0 if len(p) > 6 else round(1.0 - wat, 4)
                add_source_ing(name, {
                    'water': wat, 'sugars': sug, 'fat': fat, 'msnf': msnf,
                    'otherSolids': other, 'totalSolids': ts
                }, 'Gelato Irresistível')
        else:
            in_gi = False

# E. Gelatos Sem Açúcar: Tabela de Polióis e Fibras
with open('Fontes/Markdown/gelatos-sem-acucar-e-reducao.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_sa = False
for l in lines:
    if '| Insumo | PAC (Poder Anticongelante) | POD (Poder Adoçante) |' in l:
        in_sa = True
        continue
    if in_sa:
        if l.strip().startswith('| :---'):
            continue
        elif l.strip().startswith('|'):
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 4:
                name = p[0].split('(')[0].strip()
                pac = clean_val(p[1])
                pod = clean_val(p[2])
                add_source_ing(name, {
                    'pac': pac,
                    'pod': pod,
                    'totalSolids': 0.98
                }, 'Gelatos Sem Açúcar')
        else:
            in_sa = False

print(f"Total de ingredientes únicos catalogados nas Fontes: {len(sources_data)}")

# Aliases dictionary to connect sources to DB names
aliases = {
    norm('Leite Integral pasteurizado'): norm('Leite Integral'),
    norm('Leite Integral (3,0% Gord.)'): norm('Leite Integral'),
    norm('Leite Integral (4,0% Gord.)'): norm('Leite Integral'),
    norm('Leite Desnatado Líquido'): norm('Leite Desnatado'),
    norm('Leite Desnatado pasteurizado'): norm('Leite Desnatado'),
    norm('Leite Semi-desnatado'): norm('Leite Desnatado'),
    norm('Creme de Leite Fresco 35%'): norm('Creme de Leite Fresco'),
    norm('Creme de Leite 35% (Fresco)'): norm('Creme de Leite Fresco'),
    norm('Creme de Leite 40% (Pasteur.)'): norm('Creme De Leite 40%'),
    norm('Creme de Leite 18% (Light)'): norm('Creme de Leite UHT 20%'),
    norm('Creme de Leite UHT 17%'): norm('Creme de Leite UHT 20%'),
    norm('Creme Plástico (80% Gord.)'): norm('Manteiga'),
    norm('Leite em Pó Desnatado (LPD)'): norm('Leite Em Pó Desnatado'),
    norm('Leite em Pó Desnatado (SMP)'): norm('Leite Em Pó Desnatado'),
    norm('Leite em Pó Desnatado'): norm('Leite Em Pó Desnatado'),
    norm('Leite em Pó Integral (LPI)'): norm('Leite em Pó Integral'),
    norm('Leite em Pó Integral (WMP)'): norm('Leite em Pó Integral'),
    norm('Soro de Leite em Pó Doce'): norm('Soro de Leite em Pó'),
    norm('Sacarose (Açúcar)'): norm('Açúcar'),
    norm('Sacarose (Açúcar Cristal)'): norm('Açúcar'),
    norm('Sacarose'): norm('Açúcar'),
    norm('Dextrose Monoidratada'): norm('Dextrose'),
    norm('Dextrose (Glicose monoidratada)'): norm('Dextrose'),
    norm('Frutose Pura'): norm('Frutose'),
    norm('Açúcar Invertido (Trimoline)'): norm('Açúcar Invertido'),
    norm('Açúcar Invertido líquido'): norm('Açúcar Invertido'),
    norm('Glucose em Pó (Dry)'): norm('Xarope de Glicose Desidratado (Glucodry 38 DE)'),
    norm('Glucodry (Glucose em pó)'): norm('Xarope de Glicose Desidratado (Glucodry 38 DE)'),
    norm('Xarope de Glicose Desidratado (38-42 DE)'): norm('Xarope de Glicose Desidratado (Glucodry 38 DE)'),
    norm('Xarope de Glucose líquida'): norm('Xarope de Glicose Líquido'),
    norm('Xarope de Milho 42 DE Líq.'): norm('Xarope de Glicose Líquido'),
    norm('Maltodextrina 20 DE'): norm('Maltodextrina (18-20 DE)'),
    norm('Maltodextrina (18-20 DE)'): norm('Maltodextrina (18-20 DE)'),
    norm('Mel Puro de Abelhas'): norm('Mel'),
    norm('Mel Puro silvestre'): norm('Mel'),
    norm('Manteiga sem sal'): norm('Manteiga'),
    norm('Manteiga Sem Sal (Comum)'): norm('Manteiga'),
    norm('Gordura Anidra de Leite (AMF)'): norm('Gordura Anidra de Leite (AMF)'),
    norm('Leite Condensado'): norm('Leite Condensado'),
    norm('Leite Condensado Açucarado'): norm('Leite Condensado'),
    norm('Iogurte Natural Integral'): norm('Iogurte Natural'),
    norm('Gema de Ovo fresca'): norm('Gema De Ovo'),
    norm('Gema de Ovo Fresca/Líquida'): norm('Gema De Ovo'),
    norm('Ovo Inteiro pasteurizado'): norm('Ovo Integral Pasteurizado'),
    norm('Ovo Inteiro Pasteurizado'): norm('Ovo Integral Pasteurizado'),
    norm('Cacau em Pó alcalino 22-24%'): norm('Cacau Em Pó 22% gordura'),
    norm('Cacau em Pó 10-12%'): norm('Cacau Em Pó 11% gordura'),
    norm('Cacau em Pó (Padrão 10-22%)'): norm('Cacau Em Pó 11% gordura'),
    norm('Massa de Cacau / Chocolate'): norm('Chocolate 100% (Massa de Cacau pura)'),
    norm('Pasta pura de Avelã 100%'): norm('Pasta de Avelã Pura'),
    norm('Pasta Pura de Avelã Tostada'): norm('Pasta de Avelã Pura'),
    norm('Pasta pura de Pistache 100%'): norm('Pasta de Pistache Pura'),
    norm('Pasta Pura de Pistache Integral'): norm('Pasta de Pistache Pura'),
    norm('Pasta pura de Amendoim 100%'): norm('Pasta de Amendoim'),
    norm('Pasta Pura de Amendoim'): norm('Pasta de Amendoim'),
    norm('Maltitol'): norm('Maltitol'),
    norm('Eritritol'): norm('Eritritol'),
    norm('Xilitol'): norm('Xilitol'),
    norm('Sorbitol'): norm('Sorbitol'),
    norm('Polidextrose'): norm('Polidextrose - Fibra'),
    norm('Inulina (Fibra solúvel)'): norm('Inulina - Fibra'),
    norm('Estabilizante Neutro puro'): norm('Neutro'),
    norm('Neutro Estabilizante'): norm('Neutro'),
}

# 3. Compare Sources vs DB
missing_in_db = []
divergent_params = []
consistent_items = []

for n, src in sources_data.items():
    db_item = db_map.get(n)
    if not db_item and n in aliases:
        db_item = db_map.get(aliases[n])
    
    if not db_item:
        for db_k, db_v in db_map.items():
            if n in db_k or db_k in n:
                db_item = db_v
                break
                
    if not db_item:
        missing_in_db.append(src)
    else:
        diffs = []
        if src['fat'] > 0 and abs(src['fat'] - db_item.get('fat', 0)) > 0.02:
            diffs.append(f"Gordura: Fonte={src['fat']*100:.1f}% vs DB={db_item.get('fat', 0)*100:.1f}%")
            
        if src['sugars'] > 0 and abs(src['sugars'] - db_item.get('sugars', 0)) > 0.03:
            diffs.append(f"Açúcares: Fonte={src['sugars']*100:.1f}% vs DB={db_item.get('sugars', 0)*100:.1f}%")
            
        if src['msnf'] > 0 and abs(src['msnf'] - db_item.get('msnf', 0)) > 0.02:
            diffs.append(f"SLNG/MSNF: Fonte={src['msnf']*100:.1f}% vs DB={db_item.get('msnf', 0)*100:.1f}%")
            
        if src['totalSolids'] > 0 and abs(src['totalSolids'] - db_item.get('totalSolids', 0)) > 0.03:
            diffs.append(f"Sólidos Totais: Fonte={src['totalSolids']*100:.1f}% vs DB={db_item.get('totalSolids', 0)*100:.1f}%")
            
        if src['pac'] > 0:
            db_pac = db_item.get('pac', 0)
            if db_pac > 0:
                ratio = src['pac'] / db_pac if db_pac else 0
                if abs(ratio - 1.0) > 0.15 and abs(ratio - 0.01) > 0.002 and abs(ratio - 100.0) > 2.0:
                    diffs.append(f"PAC: Fonte={src['pac']} vs DB={db_pac}")
            else:
                diffs.append(f"PAC Zerado no DB: Fonte={src['pac']} vs DB=0")
                
        if src['pod'] > 0:
            db_pod = db_item.get('pod', 0)
            if db_pod > 0:
                ratio = src['pod'] / db_pod if db_pod else 0
                if abs(ratio - 1.0) > 0.15 and abs(ratio - 0.01) > 0.002 and abs(ratio - 100.0) > 2.0:
                    diffs.append(f"POD: Fonte={src['pod']} vs DB={db_pod}")
            else:
                diffs.append(f"POD Zerado no DB: Fonte={src['pod']} vs DB=0")

        if diffs:
            divergent_params.append({
                'source_name': src['canonical_name'],
                'db_name': db_item['name'],
                'db_id': db_item['id'],
                'sources': src['sources'],
                'diffs': diffs
            })
        else:
            consistent_items.append({
                'source_name': src['canonical_name'],
                'db_name': db_item['name'],
                'db_id': db_item['id'],
                'sources': src['sources']
            })

# 4. Check for duplicates in DB itself
name_tracker = {}
for item in db:
    simple_name = norm(item['name'])
    if simple_name in name_tracker:
        name_tracker[simple_name].append(item)
    else:
        name_tracker[simple_name] = [item]

db_duplicates = {k: v for k, v in name_tracker.items() if len(v) > 1}

print('\n======================================================')
print(f"RESUMO DO COMPARATIVO:")
print(f" - Ingredientes consistentes com o banco: {len(consistent_items)}")
print(f" - Ingredientes com parâmetros divergentes/incorretos: {len(divergent_params)}")
print(f" - Ingredientes das fontes NÃO cadastrados no banco: {len(missing_in_db)}")
print(f" - Duplicatas detectadas dentro do próprio banco: {len(db_duplicates)}")
print('======================================================\n')

print('--- INGREDIENTES NÃO CADASTRADOS NO BANCO ---')
for m in missing_in_db:
    print(f" * {m['canonical_name']} (Fontes: {', '.join(m['sources'])}) | Gordura={m['fat']*100:.1f}%, Açúcares={m['sugars']*100:.1f}%, SLNG={m['msnf']*100:.1f}%, ST={m['totalSolids']*100:.1f}%")

print('\n--- INGREDIENTES COM PARÂMETROS DIVERGENTES / INCORRETOS ---')
for d in divergent_params:
    print(f" * [{d['db_id']}] {d['db_name']} (Fonte: {d['source_name']} em {', '.join(d['sources'])})")
    for diff in d['diffs']:
        print(f"     -> {diff}")
