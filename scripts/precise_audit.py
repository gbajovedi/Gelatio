import json

with open('src/data/ingredients.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

db_by_id = {i['id']: i for i in db}

# Master list of canonical ingredients from literature tables
canonical_items = [
    # 1. LATICÍNIOS
    {
        'name': 'Leite Integral Pasteurizado',
        'sources': ['Addolcire', 'Carpigiani', 'Gelato Irresistível', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.035, 'sugars': 0.0, 'msnf': 0.090, 'totalSolids': 0.125, 'water': 0.875, 'pac': 0.05, 'pod': 0.016, 'density': 1.032},
        'db_id': 'ing_105',
        'type': 'Laticínio'
    },
    {
        'name': 'Leite Semidesnatado',
        'sources': ['Addolcire'],
        'params': {'fat': 0.018, 'sugars': 0.0, 'msnf': 0.090, 'totalSolids': 0.108, 'water': 0.892, 'pac': 0.05, 'pod': 0.016},
        'db_id': 'ing_106',
        'type': 'Laticínio'
    },
    {
        'name': 'Leite Desnatado Líquido',
        'sources': ['Addolcire', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.002, 'sugars': 0.0, 'msnf': 0.090, 'totalSolids': 0.092, 'water': 0.908, 'pac': 0.05, 'pod': 0.016, 'density': 1.036},
        'db_id': 'ing_102',
        'type': 'Laticínio'
    },
    {
        'name': 'Leite em Pó Integral (LPI 26%)',
        'sources': ['Addolcire', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.260, 'sugars': 0.0, 'msnf': 0.700, 'totalSolids': 0.960, 'water': 0.040, 'pac': 0.40, 'pod': 0.13},
        'db_id': 'ing_104',
        'type': 'Laticínio'
    },
    {
        'name': 'Leite em Pó Desnatado (LPD)',
        'sources': ['Addolcire', 'Gelato Irresistível', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.010, 'sugars': 0.0, 'msnf': 0.960, 'totalSolids': 0.970, 'water': 0.030, 'pac': 0.55, 'pod': 0.17},
        'db_id': 'ing_103',
        'type': 'Laticínio'
    },
    {
        'name': 'Creme de Leite Fresco 35%',
        'sources': ['Addolcire', 'Gelato Irresistível', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.350, 'sugars': 0.0, 'msnf': 0.058, 'totalSolids': 0.408, 'water': 0.592, 'pac': 0.03, 'pod': 0.01, 'density': 0.997},
        'db_id': 'ing_55',
        'type': 'Laticínio'
    },
    {
        'name': 'Creme de Leite Fresco 38%',
        'sources': ['Addolcire'],
        'params': {'fat': 0.380, 'sugars': 0.0, 'msnf': 0.056, 'totalSolids': 0.436, 'water': 0.564, 'pac': 0.03, 'pod': 0.01},
        'db_id': 'ing_56',
        'type': 'Laticínio'
    },
    {
        'name': 'Creme de Leite 40%',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.400, 'sugars': 0.0, 'msnf': 0.053, 'totalSolids': 0.453, 'water': 0.547, 'density': 0.994},
        'db_id': 'ing_205',
        'type': 'Laticínio'
    },
    {
        'name': 'Creme de Leite 18% (Light)',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.180, 'sugars': 0.0, 'msnf': 0.073, 'totalSolids': 0.253, 'water': 0.747, 'density': 1.014},
        'db_id': None,
        'type': 'Laticínio'
    },
    {
        'name': 'Nata 45%',
        'sources': ['Addolcire'],
        'params': {'fat': 0.450, 'sugars': 0.0, 'msnf': 0.010, 'otherSolids': 0.010, 'totalSolids': 0.470, 'water': 0.530},
        'db_id': 'ing_127',
        'type': 'Laticínio'
    },
    {
        'name': 'Creme Plástico (80% Gordura)',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.800, 'sugars': 0.0, 'msnf': 0.018, 'totalSolids': 0.818, 'water': 0.182, 'density': 0.954},
        'db_id': None,
        'type': 'Laticínio'
    },
    {
        'name': 'Manteiga Sem Sal (82-84%)',
        'sources': ['Addolcire', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.840, 'sugars': 0.0, 'msnf': 0.005, 'totalSolids': 0.840, 'water': 0.160, 'density': 0.951},
        'db_id': 'ing_116',
        'type': 'Laticínio'
    },
    {
        'name': 'Gordura Anidra de Leite (AMF / Butteroil 99,9%)',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.999, 'sugars': 0.0, 'msnf': 0.0, 'totalSolids': 0.999, 'water': 0.001, 'density': 0.900},
        'db_id': 'ing_207',
        'type': 'Laticínio'
    },
    {
        'name': 'Leite Evaporado a Granel',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.100, 'sugars': 0.0, 'msnf': 0.230, 'totalSolids': 0.330, 'water': 0.670, 'density': 1.104},
        'db_id': None,
        'type': 'Laticínio'
    },
    {
        'name': 'Leite Condensado Desnatado',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.300, 'totalSolids': 0.300, 'water': 0.700, 'density': 1.122},
        'db_id': 'ing_96',
        'type': 'Laticínio'
    },
    {
        'name': 'Leite Condensado Tradicional',
        'sources': ['Addolcire', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.080, 'sugars': 0.430, 'msnf': 0.240, 'totalSolids': 0.750, 'water': 0.250, 'density': 1.305},
        'db_id': 'ing_95',
        'type': 'Laticínio'
    },
    {
        'name': 'Soro de Leite em Pó Doce',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.930, 'totalSolids': 0.930, 'water': 0.070},
        'db_id': None, # In DB we have no pure sweet whey powder or it's mixed
        'type': 'Laticínio'
    },
    {
        'name': 'Iogurte Natural Integral',
        'sources': ['Addolcire'],
        'params': {'fat': 0.040, 'sugars': 0.0, 'msnf': 0.095, 'totalSolids': 0.135, 'water': 0.865},
        'db_id': 'ing_91',
        'type': 'Laticínio'
    },
    {
        'name': 'Cream Cheese Tradicional',
        'sources': ['Addolcire'],
        'params': {'fat': 0.310, 'sugars': 0.0, 'msnf': 0.100, 'totalSolids': 0.410, 'water': 0.590},
        'db_id': 'ing_53',
        'type': 'Laticínio'
    },
    {
        'name': 'Queijo Mascarpone',
        'sources': ['Addolcire'],
        'params': {'fat': 0.470, 'sugars': 0.0, 'msnf': 0.090, 'totalSolids': 0.560, 'water': 0.440},
        'db_id': 'ing_120',
        'type': 'Laticínio'
    },
    {
        'name': 'Queijo Ricota Fresca',
        'sources': ['Addolcire'],
        'params': {'fat': 0.130, 'sugars': 0.0, 'msnf': 0.120, 'totalSolids': 0.250, 'water': 0.750},
        'db_id': 'ing_155',
        'type': 'Laticínio'
    },
    {
        'name': 'Queijo Parmesão',
        'sources': ['Gelato Irresistível'],
        'params': {'fat': 0.290, 'sugars': 0.0, 'msnf': 0.330, 'totalSolids': 0.700, 'water': 0.300},
        'db_id': 'ing_135',
        'type': 'Laticínio'
    },
    {
        'name': 'Queijo Gorgonzola',
        'sources': ['Gelato Irresistível'],
        'params': {'fat': 0.280, 'sugars': 0.0, 'msnf': 0.180, 'totalSolids': 0.530, 'water': 0.470},
        'db_id': 'ing_174',
        'type': 'Laticínio'
    },
    {
        'name': 'Queijo Meia Cura Artesanal',
        'sources': ['Gelato Irresistível'],
        'params': {'fat': 0.280, 'sugars': 0.0, 'msnf': 0.240, 'totalSolids': 0.540, 'water': 0.460},
        'db_id': 'ing_221',
        'type': 'Laticínio'
    },
    {
        'name': 'Queijo Brie / Cabra',
        'sources': ['Addolcire'],
        'params': {'fat': 0.280, 'sugars': 0.0, 'msnf': 0.180, 'totalSolids': 0.510, 'water': 0.490},
        'db_id': 'ing_175',
        'type': 'Laticínio'
    },

    # 2. OVOS E PROTEÍNAS
    {
        'name': 'Ovo Inteiro Pasteurizado',
        'sources': ['Addolcire', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.115, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.135, 'totalSolids': 0.250, 'water': 0.750, 'density': 1.020},
        'db_id': 'ing_133',
        'type': 'Ovos & Proteínas'
    },
    {
        'name': 'Ovo Integral em Pó',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.420, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.540, 'totalSolids': 0.960, 'water': 0.040},
        'db_id': 'ing_210',
        'type': 'Ovos & Proteínas'
    },
    {
        'name': 'Gema de Ovo Fresca / Pasteurizada',
        'sources': ['Addolcire', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.310, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.190, 'totalSolids': 0.500, 'water': 0.500, 'density': 1.028},
        'db_id': 'ing_82',
        'type': 'Ovos & Proteínas'
    },
    {
        'name': 'Gema de Ovo em Pó',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.613, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.340, 'totalSolids': 0.953, 'water': 0.047},
        'db_id': 'ing_209',
        'type': 'Ovos & Proteínas'
    },
    {
        'name': 'Clara de Ovo Pasteurizada',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.007, 'msnf': 0.0, 'otherSolids': 0.113, 'totalSolids': 0.120, 'water': 0.880},
        'db_id': 'ing_49',
        'type': 'Ovos & Proteínas'
    },
    {
        'name': 'Whey Protein 80% (WPC 80)',
        'sources': ['Gelatos Proteicos'],
        'params': {'fat': 0.050, 'sugars': 0.050, 'msnf': 0.0, 'otherSolids': 0.850, 'totalSolids': 0.950, 'water': 0.050, 'protein': 0.80},
        'db_id': 'ing_166',
        'type': 'Ovos & Proteínas'
    },
    {
        'name': 'Whey Protein Isolado (WPI 90%)',
        'sources': ['Gelatos Proteicos'],
        'params': {'fat': 0.010, 'sugars': 0.010, 'msnf': 0.0, 'otherSolids': 0.930, 'totalSolids': 0.950, 'water': 0.050, 'protein': 0.90},
        'db_id': None,
        'type': 'Ovos & Proteínas'
    },

    # 3. AÇÚCARES E CRIOSCOPIA
    {
        'name': 'Sacarose (Açúcar)',
        'sources': ['Addolcire', 'Carpigiani', 'Ice Cream 7th Ed', 'Gelato Irresistível', 'Gelatos Sem Açúcar'],
        'params': {'fat': 0.0, 'sugars': 1.0, 'msnf': 0.0, 'totalSolids': 1.0, 'water': 0.0, 'pac': 1.0, 'pod': 1.0, 'density': 0.900},
        'db_id': 'ing_16',
        'type': 'Açúcares'
    },
    {
        'name': 'Dextrose Monoidratada',
        'sources': ['Addolcire', 'Carpigiani', 'Ice Cream 7th Ed', 'Gelato Irresistível'],
        'params': {'fat': 0.0, 'sugars': 0.92, 'msnf': 0.0, 'totalSolids': 0.92, 'water': 0.08, 'pac': 1.9, 'pod': 0.70, 'density': 0.900},
        'db_id': 'ing_8',
        'type': 'Açúcares'
    },
    {
        'name': 'Frutose Pura',
        'sources': ['Addolcire', 'Carpigiani', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 1.0, 'msnf': 0.0, 'totalSolids': 1.0, 'water': 0.0, 'pac': 1.9, 'pod': 1.30},
        'db_id': 'ing_9',
        'type': 'Açúcares'
    },
    {
        'name': 'Açúcar Invertido Líquido (75-76%)',
        'sources': ['Addolcire', 'Carpigiani'],
        'params': {'fat': 0.0, 'sugars': 0.75, 'msnf': 0.0, 'totalSolids': 0.75, 'water': 0.25, 'pac': 1.9, 'pod': 1.30},
        'db_id': 'ing_15',
        'type': 'Açúcares'
    },
    {
        'name': 'Xarope de Glicose Desidratado (38-42 DE / Glucodry)',
        'sources': ['Addolcire', 'Carpigiani', 'Gelato Irresistível'],
        'params': {'fat': 0.0, 'sugars': 0.96, 'msnf': 0.0, 'totalSolids': 0.96, 'water': 0.04, 'pac': 0.55, 'pod': 0.29},
        'db_id': 'ing_10',
        'type': 'Açúcares'
    },
    {
        'name': 'Xarope de Glicose Desidratado (28-30 DE)',
        'sources': ['Carpigiani', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.96, 'msnf': 0.0, 'totalSolids': 0.96, 'water': 0.04, 'pac': 0.40, 'pod': 0.23},
        'db_id': 'ing_195',
        'type': 'Açúcares'
    },
    {
        'name': 'Xarope de Glicose Líquido (42 DE)',
        'sources': ['Addolcire', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.80, 'msnf': 0.0, 'totalSolids': 0.80, 'water': 0.20, 'pac': 0.80, 'pod': 0.40, 'density': 1.417},
        'db_id': 'ing_11',
        'type': 'Açúcares'
    },
    {
        'name': 'Xarope de Milho 30 DE Líquido',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.36, 'msnf': 0.0, 'totalSolids': 0.795, 'water': 0.205, 'pac': 0.60, 'pod': 0.25, 'density': 1.417},
        'db_id': None,
        'type': 'Açúcares'
    },
    {
        'name': 'Xarope de Milho 62 DE Líquido',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.68, 'msnf': 0.0, 'totalSolids': 0.810, 'water': 0.190, 'pac': 1.20, 'pod': 0.65, 'density': 1.417},
        'db_id': None,
        'type': 'Açúcares'
    },
    {
        'name': 'Maltodextrina (18-20 DE)',
        'sources': ['Addolcire', 'Carpigiani'],
        'params': {'fat': 0.0, 'sugars': 0.96, 'msnf': 0.0, 'totalSolids': 0.96, 'water': 0.04, 'pac': 0.40, 'pod': 0.175},
        'db_id': 'ing_13',
        'type': 'Açúcares'
    },
    {
        'name': 'Mel Puro de Abelhas',
        'sources': ['Addolcire', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.80, 'msnf': 0.0, 'totalSolids': 0.80, 'water': 0.20, 'pac': 1.40, 'pod': 1.20, 'density': 1.438},
        'db_id': 'ing_121',
        'type': 'Açúcares'
    },
    {
        'name': 'Lactose Pura',
        'sources': ['Carpigiani'],
        'params': {'fat': 0.0, 'sugars': 1.0, 'msnf': 0.0, 'totalSolids': 1.0, 'water': 0.0, 'pac': 1.0, 'pod': 0.16},
        'db_id': 'ing_12',
        'type': 'Açúcares'
    },
    {
        'name': 'Trealose',
        'sources': ['Carpigiani'],
        'params': {'fat': 0.0, 'sugars': 1.0, 'msnf': 0.0, 'totalSolids': 1.0, 'water': 0.0, 'pac': 1.0, 'pod': 0.45},
        'db_id': 'ing_196',
        'type': 'Açúcares'
    },
    {
        'name': 'Alulose',
        'sources': ['Carpigiani'],
        'params': {'fat': 0.0, 'sugars': 1.0, 'msnf': 0.0, 'totalSolids': 1.0, 'water': 0.0, 'pac': 1.9, 'pod': 0.70},
        'db_id': None,
        'type': 'Açúcares'
    },

    # 4. POLIÓIS E FIBRAS
    {
        'name': 'Maltitol',
        'sources': ['Carpigiani', 'Gelatos Sem Açúcar'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.98, 'totalSolids': 0.98, 'water': 0.02, 'pac': 1.0, 'pod': 0.80},
        'db_id': 'ing_113',
        'type': 'Açúcares'
    },
    {
        'name': 'Eritritol',
        'sources': ['Carpigiani', 'Gelatos Sem Açúcar'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.99, 'totalSolids': 0.99, 'water': 0.01, 'pac': 2.8, 'pod': 0.70},
        'db_id': 'ing_64',
        'type': 'Açúcares'
    },
    {
        'name': 'Xilitol',
        'sources': ['Gelatos Sem Açúcar', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.98, 'totalSolids': 0.98, 'water': 0.02, 'pac': 2.2, 'pod': 1.0},
        'db_id': 'ing_168',
        'type': 'Açúcares'
    },
    {
        'name': 'Sorbitol',
        'sources': ['Gelatos Sem Açúcar', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.98, 'totalSolids': 0.98, 'water': 0.02, 'pac': 1.9, 'pod': 0.60},
        'db_id': 'ing_198',
        'type': 'Açúcares'
    },
    {
        'name': 'Polidextrose',
        'sources': ['Addolcire', 'Gelatos Sem Açúcar'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.95, 'totalSolids': 0.95, 'water': 0.05, 'pac': 0.6, 'pod': 0.0},
        'db_id': 'ing_150',
        'type': 'Neutros, Gomas & Fibras'
    },
    {
        'name': 'Inulina (Fibra Vegetal)',
        'sources': ['Addolcire', 'Gelato Irresistível', 'Gelatos Sem Açúcar'],
        'params': {'fat': 0.0, 'sugars': 0.07, 'msnf': 0.0, 'otherSolids': 0.90, 'totalSolids': 0.97, 'water': 0.03, 'pac': 0.6, 'pod': 0.0},
        'db_id': 'ing_88',
        'type': 'Neutros, Gomas & Fibras'
    },
    {
        'name': 'Açúcar de Maçã (66% açúcar)',
        'sources': ['Gelatos Sem Açúcar'],
        'params': {'fat': 0.0, 'sugars': 0.66, 'msnf': 0.0, 'otherSolids': 0.04, 'totalSolids': 0.70, 'water': 0.30, 'pac': 1.0, 'pod': 0.90},
        'db_id': 'ing_14',
        'type': 'Açúcares'
    },

    # 5. CHOCOLATES E CACAU
    {
        'name': 'Cacau em Pó 22% gordura',
        'sources': ['Addolcire'],
        'params': {'fat': 0.23, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.72, 'totalSolids': 0.95, 'water': 0.05},
        'db_id': 'ing_34',
        'type': 'Chocolates & Cacau'
    },
    {
        'name': 'Cacau em Pó 11% gordura',
        'sources': ['Gelato Irresistível', 'Ice Cream 7th Ed'],
        'params': {'fat': 0.11, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.84, 'totalSolids': 0.95, 'water': 0.05},
        'db_id': 'ing_33',
        'type': 'Chocolates & Cacau'
    },
    {
        'name': 'Manteiga de Cacau Pura',
        'sources': ['Addolcire'],
        'params': {'fat': 1.0, 'sugars': 0.0, 'msnf': 0.0, 'totalSolids': 1.0, 'water': 0.0},
        'db_id': 'ing_117',
        'type': 'Chocolates & Cacau'
    },
    {
        'name': 'Massa de Cacau / Chocolate 100%',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.52, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.48, 'totalSolids': 1.0, 'water': 0.0},
        'db_id': 'ing_141',
        'type': 'Chocolates & Cacau'
    },
    {
        'name': 'Chocolate Amargo 70%',
        'sources': ['Addolcire', 'Gelato Irresistível'],
        'params': {'fat': 0.40, 'sugars': 0.30, 'msnf': 0.0, 'otherSolids': 0.30, 'totalSolids': 1.0, 'water': 0.0, 'pac': 0.30, 'pod': 0.30},
        'db_id': 'ing_43',
        'type': 'Chocolates & Cacau'
    },
    {
        'name': 'Chocolate Ao Leite 33.7%',
        'sources': ['Addolcire'],
        'params': {'fat': 0.36, 'sugars': 0.45, 'msnf': 0.13, 'otherSolids': 0.07, 'totalSolids': 1.0, 'water': 0.0},
        'db_id': 'ing_45',
        'type': 'Chocolates & Cacau'
    },
    {
        'name': 'Chocolate Branco',
        'sources': ['Addolcire'],
        'params': {'fat': 0.30, 'sugars': 0.55, 'msnf': 0.10, 'otherSolids': 0.05, 'totalSolids': 1.0, 'water': 0.0},
        'db_id': 'ing_47',
        'type': 'Chocolates & Cacau'
    },

    # 6. PASTAS E OLEAGINOSAS
    {
        'name': 'Pasta de Pistache 100%',
        'sources': ['Addolcire', 'Gelato Irresistível'],
        'params': {'fat': 0.55, 'sugars': 0.05, 'msnf': 0.0, 'otherSolids': 0.38, 'totalSolids': 0.98, 'water': 0.02},
        'db_id': 'ing_146',
        'type': 'Pastas & Oleaginosas'
    },
    {
        'name': 'Pasta de Avelã s/ açúcar',
        'sources': ['Addolcire', 'Gelato Irresistível'],
        'params': {'fat': 0.65, 'sugars': 0.08, 'msnf': 0.0, 'otherSolids': 0.25, 'totalSolids': 0.98, 'water': 0.02},
        'db_id': 'ing_140',
        'type': 'Pastas & Oleaginosas'
    },
    {
        'name': 'Pasta de Amendoim 100%',
        'sources': ['Addolcire', 'Gelato Irresistível'],
        'params': {'fat': 0.49, 'sugars': 0.08, 'msnf': 0.0, 'otherSolids': 0.41, 'totalSolids': 0.98, 'water': 0.02},
        'db_id': 'ing_139',
        'type': 'Pastas & Oleaginosas'
    },
    {
        'name': 'Pasta de Amêndoas s/ açúcar',
        'sources': ['Gelato Irresistível'],
        'params': {'fat': 0.54, 'sugars': 0.05, 'msnf': 0.0, 'otherSolids': 0.35, 'totalSolids': 0.94, 'water': 0.06},
        'db_id': 'ing_137',
        'type': 'Pastas & Oleaginosas'
    },
    {
        'name': 'Pasta de Nozes 100%',
        'sources': ['Gelato Irresistível'],
        'params': {'fat': 0.65, 'sugars': 0.07, 'msnf': 0.0, 'otherSolids': 0.24, 'totalSolids': 0.96, 'water': 0.04},
        'db_id': 'ing_145',
        'type': 'Pastas & Oleaginosas'
    },
    {
        'name': 'Pasta Concentrada de Frutas',
        'sources': ['Addolcire'],
        'params': {'fat': 0.0, 'sugars': 0.70, 'msnf': 0.0, 'otherSolids': 0.08, 'totalSolids': 0.78, 'water': 0.12},
        'db_id': None,
        'type': 'Frutas & Polpas'
    },

    # 7. OUTROS / NEUTROS / VEGETAIS
    {
        'name': 'Leite de Coco Tradicional',
        'sources': ['Addolcire'],
        'params': {'fat': 0.05, 'sugars': 0.08, 'msnf': 0.0, 'otherSolids': 0.01, 'totalSolids': 0.14, 'water': 0.86},
        'db_id': 'ing_99',
        'type': 'Bebidas Vegetais & Plant-Based'
    },
    {
        'name': 'Neutro / Estabilizante',
        'sources': ['Addolcire', 'Gelato Irresistível'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 1.0, 'totalSolids': 1.0, 'water': 0.0},
        'db_id': 'ing_129',
        'type': 'Neutros, Gomas & Fibras'
    },
    {
        'name': 'Água Potável',
        'sources': ['Ice Cream 7th Ed'],
        'params': {'fat': 0.0, 'sugars': 0.0, 'msnf': 0.0, 'otherSolids': 0.0, 'totalSolids': 0.0, 'water': 1.0, 'density': 1.000},
        'db_id': 'ing_17',
        'type': 'Outros'
    }
]

print(f"Total canonical items analyzed: {len(canonical_items)}")

missing = []
divergent = []
consistent = []

for item in canonical_items:
    db_id = item['db_id']
    if not db_id or db_id not in db_by_id:
        missing.append(item)
    else:
        db_item = db_by_id[db_id]
        diffs = []
        p = item['params']
        for k in ['fat', 'sugars', 'msnf', 'totalSolids', 'pac', 'pod']:
            if k in p and p[k] is not None:
                src_val = p[k]
                db_val = db_item.get(k, 0.0)
                if k in ['pac', 'pod']:
                    if src_val > 0 and db_val > 0:
                        ratio = src_val / db_val
                        if abs(ratio - 1.0) > 0.18:
                            diffs.append((k, src_val, db_val))
                    elif src_val > 0 and db_val == 0:
                        diffs.append((k, src_val, db_val))
                else:
                    if abs(src_val - db_val) > 0.025:
                        diffs.append((k, src_val, db_val))
        
        if diffs:
            divergent.append((item, db_item, diffs))
        else:
            consistent.append((item, db_item))

print(f"\n1. Insumos NÃO Cadastrados: {len(missing)}")
for m in missing:
    print(f"  - {m['name']} (Fontes: {', '.join(m['sources'])})")

print(f"\n2. Insumos com Divergência de Parâmetros: {len(divergent)}")
for item, db_i, diffs in divergent:
    diff_str = ", ".join([f"{k}: Fonte={s*100 if k not in ['pac','pod'] else s:.2f} vs DB={d*100 if k not in ['pac','pod'] else d:.2f}" for k, s, d in diffs])
    print(f"  - [{db_i['id']}] {db_i['name']} <==> {item['name']}: {diff_str}")

print(f"\n3. Insumos Consistentes / Calibrados: {len(consistent)}")
for item, db_i in consistent:
    print(f"  - [{db_i['id']}] {db_i['name']}")
