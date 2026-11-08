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

# Map DB by normalized name
db_by_norm = {}
for item in db:
    n = norm(item['name'])
    db_by_norm[n] = item

# 2. Comprehensive Alias Mapping
alias_to_db = {
    # Laticínios
    norm('Leite Integral pasteurizado'): norm('Leite Integral'),
    norm('Leite Integral (3,0% Gord.)'): norm('Leite Integral'),
    norm('Leite Integral (4,0% Gord.)'): norm('Leite Integral'),
    norm('Leite Semi-desnatado'): norm('Leite Semi Desnatado'),
    norm('Leite Desnatado Líquido'): norm('Leite Desnatado'),
    norm('Leite Desnatado pasteurizado'): norm('Leite Desnatado'),
    norm('Leite em Pó Desnatado (LPD)'): norm('Leite Em Pó Desnatado'),
    norm('Leite em Pó Desnatado (SMP)'): norm('Leite Em Pó Desnatado'),
    norm('Leite em Pó Desnatado'): norm('Leite Em Pó Desnatado'),
    norm('Leite em Pó Integral (LPI)'): norm('Leite em Pó Integral'),
    norm('Leite em Pó Integral (WMP)'): norm('Leite em Pó Integral'),
    norm('Soro de Leite em Pó Doce'): norm('Soro de Leite em Pó'),
    norm('Soro de Leite em Pó'): norm('Soro de Leite em Pó'),
    norm('Creme de Leite Fresco 35%'): norm('Creme de Leite Fresco'),
    norm('Creme de Leite 35% (Fresco)'): norm('Creme de Leite Fresco'),
    norm('Creme de Leite 38%'): norm('Creme de Leite Fresco'),
    norm('Creme de Leite 40% (Pasteur.)'): norm('Creme De Leite 40%'),
    norm('Creme de Leite UHT 20%'): norm('Creme de Leite UHT 20%'),
    norm('Creme de Leite UHT 17%'): norm('Creme de Leite UHT 20%'),
    norm('Creme de Leite 18% (Light)'): norm('Creme de Leite UHT 20%'),
    norm('Creme Plástico (80% Gord.)'): norm('Manteiga'),
    norm('Manteiga sem sal'): norm('Manteiga'),
    norm('Manteiga Sem Sal (Comum)'): norm('Manteiga'),
    norm('Gordura Anidra de Leite (AMF)'): norm('Gordura Anidra de Leite (AMF)'),
    norm('Leite Condensado Açucarado'): norm('Leite Condensado'),
    norm('Iogurte Natural Integral'): norm('Iogurte Natural'),
    norm('Cream Cheese tradicional'): norm('Cream Cheese'),
    norm('Mascarpone'): norm('Queijo Mascarpone'),
    norm('Ricota fresca'): norm('Queijo Ricota'),
    norm('Queijo Parmesão'): norm('Queijo Parmesão (Parmigiano)'),
    norm('Queijo Gorgonzola'): norm('Queijo Gorgonzola'),
    norm('Queijo Minas Meia Cura'): norm('Queijo Meia Cura'),
    norm('Queijo Brie sem casca'): norm('Queijo Brie'),

    # Ovos e Proteínas
    norm('Gema de Ovo fresca'): norm('Gema De Ovo'),
    norm('Gema de Ovo Fresca/Líquida'): norm('Gema De Ovo'),
    norm('Gema de Ovo em Pó'): norm('Gema de Ovo em Pó'),
    norm('Ovo Inteiro pasteurizado'): norm('Ovo Integral Pasteurizado'),
    norm('Ovo Inteiro Pasteurizado'): norm('Ovo Integral Pasteurizado'),
    norm('Clara de Ovo pasteurizada'): norm('Clara De Ovo'),
    norm('Whey Protein 80% (WPC / WPH neutro ou baunilha)'): norm('Whey Protein Concentrado 80%'),
    norm('Whey Protein 80%'): norm('Whey Protein Concentrado 80%'),
    norm('Whey Protein Isolado (WPI)'): norm('Whey Protein Isolado (WPI)'),

    # Açúcares e Adoçantes
    norm('Sacarose (Açúcar)'): norm('Açúcar'),
    norm('Sacarose (Açúcar Cristal)'): norm('Açúcar'),
    norm('Sacarose (Açúcar refinado)'): norm('Açúcar'),
    norm('Sacarose'): norm('Açúcar'),
    norm('Dextrose Monoidratada'): norm('Dextrose'),
    norm('Dextrose (Glicose monoidratada)'): norm('Dextrose'),
    norm('Dextrose'): norm('Dextrose'),
    norm('Frutose pura'): norm('Frutose'),
    norm('Frutose Pura'): norm('Frutose'),
    norm('Frutose'): norm('Frutose'),
    norm('Açúcar Invertido líquido'): norm('Açúcar Invertido'),
    norm('Açúcar Invertido (Trimoline)'): norm('Açúcar Invertido'),
    norm('Açúcar Invertido 70%'): norm('Açúcar Invertido'),
    norm('Glucose em Pó (Dry)'): norm('Xarope de Glicose Desidratado (Glucodry 38 DE)'),
    norm('Glucodry (Glucose em pó)'): norm('Xarope de Glicose Desidratado (Glucodry 38 DE)'),
    norm('Xarope de Glicose Desidratado (38-42 DE)'): norm('Xarope de Glicose Desidratado (Glucodry 38 DE)'),
    norm('Xarope de Glicose Desidratado (Dry 38 DE)'): norm('Xarope de Glicose Desidratado (Glucodry 38 DE)'),
    norm('Xarope de Glucose líquida'): norm('Xarope de Glicose Líquido'),
    norm('Xarope de Milho 42 DE Líq.'): norm('Xarope de Glicose Líquido'),
    norm('Xarope de Milho 30 DE Líq.'): norm('Xarope de Glicose Líquido'),
    norm('Maltodextrina 20 DE'): norm('Maltodextrina (18-20 DE)'),
    norm('Maltodextrina (18-20 DE)'): norm('Maltodextrina (18-20 DE)'),
    norm('Maltodextrina'): norm('Maltodextrina (18-20 DE)'),
    norm('Mel Puro de Abelhas'): norm('Mel'),
    norm('Mel Puro silvestre'): norm('Mel'),
    norm('Mel puro'): norm('Mel'),
    norm('Mel'): norm('Mel'),
    norm('Lactose'): norm('Lactose'),
    norm('Trealose'): norm('Trealose'),
    norm('Alulose'): norm('Alulose'),
    norm('Maltitol'): norm('Maltitol'),
    norm('Eritritol'): norm('Eritritol'),
    norm('Xilitol'): norm('Xilitol'),
    norm('Sorbitol'): norm('Sorbitol'),
    norm('Polidextrose'): norm('Polidextrose - Fibra'),
    norm('Inulina (Fibra solúvel)'): norm('Inulina - Fibra'),
    norm('Inulina (Fibra vegetal)'): norm('Inulina - Fibra'),
    norm('Inulina'): norm('Inulina - Fibra'),
    norm('Açúcar de maçã integral'): norm('Açúcar de Maçã (66% açúcar)'),
    norm('Açúcar de maçã'): norm('Açúcar de Maçã (66% açúcar)'),

    # Chocolates e Cacau
    norm('Cacau em Pó alcalino 22-24%'): norm('Cacau Em Pó 22% gordura'),
    norm('Cacau em pó alcalino 22-24%'): norm('Cacau Em Pó 22% gordura'),
    norm('Cacau em Pó 10-12%'): norm('Cacau Em Pó 11% gordura'),
    norm('Cacau em pó 100%'): norm('Cacau Em Pó 11% gordura'),
    norm('Cacau em pó (Padrão 10-22%)'): norm('Cacau Em Pó 11% gordura'),
    norm('Manteiga de Cacau pura'): norm('Manteiga de cacau'),
    norm('Manteiga de Cacau'): norm('Manteiga de cacau'),
    norm('Chocolate 70% nobre'): norm('Chocolate Amargo 70%'),
    norm('Chocolate amargo 70%'): norm('Chocolate Amargo 70%'),
    norm('Chocolate meio amargo 70%'): norm('Chocolate Amargo 70%'),
    norm('Chocolate 70%'): norm('Chocolate Amargo 70%'),
    norm('Chocolate ao Leite 33%'): norm('Chocolate Ao Leite 32%'),
    norm('Chocolate Branco nobre'): norm('Chocolate Branco'),
    norm('Chocolate Branco 30%'): norm('Chocolate Branco'),
    norm('Massa de Cacau / Chocolate'): norm('Chocolate 100% (Massa de Cacau pura)'),

    # Pastas e Oleaginosas
    norm('Pasta pura de Pistache 100%'): norm('Pasta de Pistache Pura'),
    norm('Pasta Pura de Pistache Integral'): norm('Pasta de Pistache Pura'),
    norm('Pasta pura de Avelã 100%'): norm('Pasta de Avelã Pura'),
    norm('Pasta Pura de Avelã Tostada'): norm('Pasta de Avelã Pura'),
    norm('Pasta pura de Amendoim 100%'): norm('Pasta de Amendoim'),
    norm('Pasta Pura de Amendoim'): norm('Pasta de Amendoim'),
    norm('Pasta pura de Amêndoas 100%'): norm('Pasta De Amêndoas s/ açúcar'),
    norm('Amêndoas Tostadas'): norm('Amêndoas'),
    norm('Nozes Chilenas'): norm('Nozes'),

    # Estabilizantes e Neutros
    norm('Estabilizante Neutro puro'): norm('Neutro'),
    norm('Neutro Estabilizante'): norm('Neutro'),
    norm('Neutro estabilizante'): norm('Neutro'),
    norm('Neutro'): norm('Neutro'),
    norm('Goma Garrofim (LBG)'): norm('Goma Garrofim (LBG)'),
    norm('Goma Garrofim'): norm('Goma Garrofim (LBG)'),
    norm('Goma Gár'): norm('Goma Guar'),
    norm('Goma Guar'): norm('Goma Guar'),
    norm('Carboximetilcelulose (CMC)'): norm('Carboximetilcelulose (CMC)'),
    norm('CMC'): norm('Carboximetilcelulose (CMC)'),
    norm('Pectina cítrica'): norm('Pectina'),
    norm('Pectina'): norm('Pectina'),

    # Óleos e Gorduras Vegetais
    norm('Óleo de coco sem sabor'): norm('Óleo de coco'),
    norm('Óleo de coco'): norm('Óleo de coco'),
    norm('Óleo de girassol'): norm('Óleo de girassol'),
    norm('Leite de Coco integral'): norm('Leite de Coco'),

    # Água
    norm('Água Potável'): norm('Água'),
    norm('Água mineral'): norm('Água'),
    norm('Água'): norm('Água'),
}

# 3. Harvest all source data
sources = {}

def register_source(raw_name, data, src_file):
    canonical = raw_name.replace('**', '').strip()
    n = norm(canonical)
    if n not in sources:
        sources[n] = {
            'name': canonical,
            'fat': data.get('fat', 0.0),
            'sugars': data.get('sugars', 0.0),
            'msnf': data.get('msnf', 0.0),
            'otherSolids': data.get('otherSolids', 0.0),
            'totalSolids': data.get('totalSolids', 0.0),
            'water': data.get('water', 0.0),
            'pac': data.get('pac', 0.0),
            'pod': data.get('pod', 0.0),
            'protein': data.get('protein', 0.0),
            'density': data.get('density', 0.0),
            'sources': [src_file]
        }
    else:
        if src_file not in sources[n]['sources']:
            sources[n]['sources'].append(src_file)
        for k in ['fat', 'sugars', 'msnf', 'otherSolids', 'totalSolids', 'water', 'pac', 'pod', 'protein', 'density']:
            if sources[n][k] == 0.0 and data.get(k, 0.0) != 0.0:
                sources[n][k] = data[k]

# A. Addolcire
with open('Fontes/Markdown/gelato-profissional-addolcire.md', 'r', encoding='utf-8') as f:
    for l in f:
        if l.strip().startswith('|') and not l.strip().startswith('| :---') and not '| Insumo |' in l:
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 7 and any(c.isdigit() for c in ''.join(p[1:])):
                register_source(p[0], {
                    'sugars': clean_val(p[1]) / 100.0,
                    'fat': clean_val(p[2]) / 100.0,
                    'msnf': clean_val(p[3]) / 100.0,
                    'otherSolids': clean_val(p[4]) / 100.0,
                    'totalSolids': clean_val(p[5]) / 100.0,
                    'water': clean_val(p[6]) / 100.0
                }, 'gelato-profissional-addolcire.md')

# B. Carpigiani
with open('Fontes/Markdown/carpigiani-parametros-fisico-quimicos.md', 'r', encoding='utf-8') as f:
    for l in f:
        if l.strip().startswith('|') and not l.strip().startswith('| :---') and not '| Açúcar' in l:
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 4 and any(c.isdigit() for c in ''.join(p[2:4])):
                name = p[0].split('(')[0].strip()
                pod = clean_val(p[2])
                pac = clean_val(p[3])
                register_source(p[0], {
                    'pod': pod / 100.0,
                    'pac': pac / 100.0,
                    'sugars': 1.0,
                    'totalSolids': 1.0
                }, 'carpigiani-parametros-fisico-quimicos.md')

# C. Ice Cream 7th Edition
with open('Fontes/Markdown/ice-cream-7th-edition-referencia.md', 'r', encoding='utf-8') as f:
    for l in f:
        if l.strip().startswith('|') and not l.strip().startswith('| :---') and not '| Ingrediente |' in l and not '| Parâmetro' in l and not '| Constituinte |' in l and not '| País |' in l and not '| Composição' in l:
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 6 and any(c.isdigit() for c in ''.join(p[1:])):
                fat = clean_val(p[1]) / 100.0
                msnf = clean_val(p[2]) / 100.0
                sug = clean_val(p[3]) / 100.0
                prot = clean_val(p[4]) / 100.0
                ts = clean_val(p[5]) / 100.0
                dens = clean_val(p[6]) if len(p) > 6 else 0.0
                wat = round(1.0 - ts, 4) if ts > 0 else 0.0
                register_source(p[0], {
                    'fat': fat, 'msnf': msnf, 'sugars': sug, 'protein': prot,
                    'totalSolids': ts, 'water': wat, 'density': dens
                }, 'ice-cream-7th-edition-referencia.md')

# D. Gelato Irresistível
with open('Fontes/Markdown/gelato-irresistivel-livro-completo.md', 'r', encoding='utf-8') as f:
    for l in f:
        if l.strip().startswith('|') and not l.strip().startswith('| :---') and not '| Insumo |' in l:
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 6 and any(c.isdigit() for c in ''.join(p[1:])):
                wat = clean_val(p[1]) / 100.0
                sug = clean_val(p[2]) / 100.0
                fat = clean_val(p[3]) / 100.0
                msnf = clean_val(p[4]) / 100.0
                other = clean_val(p[5]) / 100.0
                ts = clean_val(p[6]) / 100.0 if len(p) > 6 else round(1.0 - wat, 4)
                register_source(p[0], {
                    'water': wat, 'sugars': sug, 'fat': fat, 'msnf': msnf,
                    'otherSolids': other, 'totalSolids': ts
                }, 'gelato-irresistivel-livro-completo.md')

# E. Gelatos Sem Açúcar
with open('Fontes/Markdown/gelatos-sem-acucar-e-reducao.md', 'r', encoding='utf-8') as f:
    for l in f:
        if l.strip().startswith('|') and not l.strip().startswith('| :---') and not '| Insumo |' in l:
            p = [x.strip().replace('**', '') for x in l.split('|')[1:-1]]
            if len(p) >= 4 and any(c.isdigit() for c in ''.join(p[1:3])):
                name = p[0].split('(')[0].strip()
                pac = clean_val(p[1])
                pod = clean_val(p[2])
                register_source(p[0], {
                    'pac': pac, 'pod': pod, 'totalSolids': 0.98
                }, 'gelatos-sem-acucar-e-reducao.md')

# 4. Comparative Evaluation
not_in_db = []
divergent = []
consistent = []

for n, src in sources.items():
    # Resolve via alias or direct
    db_key = alias_to_db.get(n, n)
    db_item = db_by_norm.get(db_key)
    
    if not db_item:
        # try substring match in DB names
        for k, v in db_by_norm.items():
            if n in k or k in n:
                db_item = v
                break
                
    if not db_item:
        not_in_db.append(src)
    else:
        diffs = []
        # Fat check
        if src['fat'] > 0 and abs(src['fat'] - db_item.get('fat', 0)) > 0.025:
            diffs.append(('fat', f"Gordura: Fonte={src['fat']*100:.1f}% vs DB={db_item.get('fat', 0)*100:.1f}%"))
            
        # Sugars check
        if src['sugars'] > 0 and abs(src['sugars'] - db_item.get('sugars', 0)) > 0.03:
            diffs.append(('sugars', f"Açúcares: Fonte={src['sugars']*100:.1f}% vs DB={db_item.get('sugars', 0)*100:.1f}%"))
            
        # MSNF check
        if src['msnf'] > 0 and abs(src['msnf'] - db_item.get('msnf', 0)) > 0.025:
            diffs.append(('msnf', f"SLNG/MSNF: Fonte={src['msnf']*100:.1f}% vs DB={db_item.get('msnf', 0)*100:.1f}%"))
            
        # Total solids check
        if src['totalSolids'] > 0 and abs(src['totalSolids'] - db_item.get('totalSolids', 0)) > 0.035:
            diffs.append(('totalSolids', f"Sólidos Totais: Fonte={src['totalSolids']*100:.1f}% vs DB={db_item.get('totalSolids', 0)*100:.1f}%"))
            
        # PAC check
        if src['pac'] > 0:
            db_pac = db_item.get('pac', 0)
            if db_pac > 0:
                ratio = src['pac'] / db_pac if db_pac else 0
                if abs(ratio - 1.0) > 0.15 and abs(ratio - 0.01) > 0.002 and abs(ratio - 100.0) > 2.0:
                    diffs.append(('pac', f"PAC: Fonte={src['pac']} vs DB={db_pac}"))
            else:
                diffs.append(('pac', f"PAC Zerado no DB: Fonte={src['pac']} vs DB=0"))

        # POD check
        if src['pod'] > 0:
            db_pod = db_item.get('pod', 0)
            if db_pod > 0:
                ratio = src['pod'] / db_pod if db_pod else 0
                if abs(ratio - 1.0) > 0.15 and abs(ratio - 0.01) > 0.002 and abs(ratio - 100.0) > 2.0:
                    diffs.append(('pod', f"POD: Fonte={src['pod']} vs DB={db_pod}"))
            else:
                diffs.append(('pod', f"POD Zerado no DB: Fonte={src['pod']} vs DB=0"))

        if diffs:
            divergent.append({
                'source': src,
                'db_item': db_item,
                'diffs': diffs
            })
        else:
            consistent.append({
                'source': src,
                'db_item': db_item
            })

# 5. Output Report
report_lines = []
report_lines.append(f"TOTAL DE INSUMOS MAPEADOS NAS FONTES: {len(sources)}")
report_lines.append(f"TOTAL NO BANCO DE DADOS: {len(db)}")
report_lines.append(f" - Consistentes com o Banco: {len(consistent)}")
report_lines.append(f" - Com Parâmetros Divergentes/Incorretos: {len(divergent)}")
report_lines.append(f" - NÃO Cadastrados no Banco: {len(not_in_db)}\n")

report_lines.append("="*80)
report_lines.append("1. INSUMOS DAS FONTES NÃO CADASTRADOS NO BANCO")
report_lines.append("="*80)
for m in not_in_db:
    report_lines.append(f"\n[NÃO CADASTRADO] {m['name']}")
    report_lines.append(f"  Fontes: {', '.join(m['sources'])}")
    report_lines.append(f"  Composição: Gordura={m['fat']*100:.1f}%, Açúcares={m['sugars']*100:.1f}%, SLNG={m['msnf']*100:.1f}%, Outros={m['otherSolids']*100:.1f}%, ST={m['totalSolids']*100:.1f}%, Água={m['water']*100:.1f}%")
    if m['pac'] > 0 or m['pod'] > 0:
        report_lines.append(f"  Crioscopia: PAC={m['pac']}, POD={m['pod']}")
    if m['density'] > 0:
        report_lines.append(f"  Densidade: {m['density']} kg/L")

report_lines.append("\n" + "="*80)
report_lines.append("2. INSUMOS CADASTRADOS COM PARÂMETROS DIVERGENTES OU INCORRETOS")
report_lines.append("="*80)
for d in divergent:
    s = d['source']
    db_i = d['db_item']
    report_lines.append(f"\n[DIVERGÊNCIA] Banco: [{db_i['id']}] {db_i['name']} <---> Fonte: {s['name']}")
    report_lines.append(f"  Fontes: {', '.join(s['sources'])}")
    report_lines.append(f"  Valores Banco: Gord={db_i.get('fat',0)*100:.1f}%, Açúc={db_i.get('sugars',0)*100:.1f}%, SLNG={db_i.get('msnf',0)*100:.1f}%, ST={db_i.get('totalSolids',0)*100:.1f}%, PAC={db_i.get('pac',0)}, POD={db_i.get('pod',0)}")
    for _, diff_text in d['diffs']:
        report_lines.append(f"    * {diff_text}")

with open('audit_report.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(report_lines))

print('\n'.join(report_lines[:40]))
print(f"\nRelatório completo gerado em audit_report.txt ({len(report_lines)} linhas).")
