# -*- coding: utf-8 -*-
import json
import os
import sys

sys.path.append(r"C:\Users\ajove.DESKTOP-A98A6JQ\.gemini\antigravity\brain\0d64780b-10bb-4d4c-a2b3-57d8264d9a5c\scratch")
from validate_mapping import recipes_data
from generate_recipes_data import new_ingredients, new_preparations

ROOT = r"C:\Users\ajove.DESKTOP-A98A6JQ\OneDrive\Documentos\Projetos de IA\Receitas e Balanceamento de Gelatos"
ING_PATH = os.path.join(ROOT, "src", "data", "ingredients.json")
PREP_PATH = os.path.join(ROOT, "src", "data", "preparations.json")
REC_PATH = os.path.join(ROOT, "src", "data", "recipes.json")
DB_PATH = os.path.join(ROOT, "src", "db", "database.ts")
TEST_PATH = os.path.join(ROOT, "src", "core", "__tests__", "gelatoIrresistivelRefinement.test.ts")

# Insumos Name Mapping
ING_MAP = {
    "Leite Integral Tipo A": "Leite Integral",
    "Leite Integral Tipo A (Infusionado com Hortelã)": "Leite Integral",
    "Creme De Leite Fresco 35%": "Creme De Leite Fresco 35%",
    "Açúcar": "Açúcar",
    "Dextrose": "Dextrose",
    "Glucose em pó": "Glucose em pó",
    "Leite em Pó Desnatado": "Leite Em Pó Desnatado",
    "Neutro": "Neutro",
    "Gema de Ovo": "Gema Do Ovo Pasteurizada",
    "Pasta de Avelã": "Pasta De Avelã s/ açúcar",
    "Pasta de Pistache": "Pasta De Pistache 100%",
    "Pasta de Amêndoa": "Pasta De Amêndoas s/ açúcar",
    "Pasta de Gianduia": "Pasta Gianduia",
    "Pasta de Torrone": "Torrone",
    "Pasta de Paçoca": "Pasta De Amendoim 100%",
    "Pasta de Nozes": "Pasta de Nozes 100%",
    "Morango": "Morango",
    "Café Espresso Fresco (Extração Líquida)": "Café Expresso",
    "Chocolate Ao Leite 33.7%": "Chocolate Ao Leite 33.7%",
    "Chocolate Amargo 70%": "Chocolate Amargo 70%",
    "Chocolate Branco": "Chocolate Branco",
    "Suco de Limão Siciliano": "Limão Siciliano",
    "Suco de Limão": "Suco de Limão",
    "Vinho Marsala (ou Porto)": "Vinho Marsala (ou Vinho do Porto)",
    "Iogurte Integral Natural": "Iogurte Integral",
    "Doce de Leite Artesanal": "Doce de Leite Artesanal (Sem Amido)",
    "Arroz-Doce Artesanal Cozido (Pré-Preparo)": "Arroz-Doce Artesanal Cozido com Canela (Pré-Preparo)",
    "Rapadura Artesanal": "Rapadura Artesanal",
    "Cachaça Artesanal": "Cachaça",
    "Queijo Minas Meia Cura": "Queijo Meia Cura Artesanal",
    "Caramelo Artesanal Flor de Sal (Pré-Preparo)": "Caramelo Artesanal a 175°C com Flor de Sal (Pré-Preparo)",
    "Tangerina / Mexerica": "Tangerina / Mexerica",
    "Gengibre em Pó": "Gengibre em Pó",
    "Cupuaçu": "Polpa Cupuaçu",
    "Banana Prata": "Banana",
    "Maracujá": "Maracujá",
    "Goiaba": "Goiaba",
    "Manga": "Manga",
    "Abacaxi": "Abacaxi",
    "Hortelã Fresca": "Hortelã",
    "Cacau em Pó 100% Alcalino": "Cacau Em Pó 22% gordura",
    "Sal rosa": "Sal Rosa do Himalaia",
    "Abacate": "Abacate",
    "Cream cheese": "Cream cheese",
    "Frutas Vermelhas": "Frutas Vermelhas",
    "Água de Infusão de Alecrim": "Água",
    "Inulina - fibra vegetal": "Inulina - Fibra Vegetal",
    "Água": "Água",
    "Sal": "Sal",
    "Mel": "Mel"
}

STYLE_MAP = {
    "rec_gir_01": "Gelatos de Leite",
    "rec_gir_02": "Gelatos de Leite",
    "rec_gir_03": "Gelatos de Oleaginosas",
    "rec_gir_04": "Gelatos de Leite com Chocolate",
    "rec_gir_05": "Gelatos de Oleaginosas",
    "rec_gir_06": "Gelatos de Oleaginosas",
    "rec_gir_07": "Gelatos de Oleaginosas",
    "rec_gir_08": "Gelatos de Leite com Chocolate",
    "rec_gir_09": "Sorbets Polposos / Frutas Densas",
    "rec_gir_10": "Gelatos de Leite",
    "rec_gir_11": "Gelatos de Leite com Chocolate",
    "rec_gir_12": "Gelatos de Leite com Chocolate",
    "rec_gir_13": "Sorbets Cítricos / Frutas Ácidas",
    "rec_gir_14": "Gelatos Alcoólicos",
    "rec_gir_15": "Gelatos de Leite com Fruta",
    "rec_gir_16": "Gelatos de Leite",
    "rec_gir_17": "Gelatos de Leite",
    "rec_gir_18": "Gelatos Alcoólicos",
    "rec_gir_19": "Gelatos de Leite",
    "rec_gir_20": "Gelatos de Leite com Chocolate",
    "rec_gir_21": "Gelatos de Leite",
    "rec_gir_22": "Gelatos de Leite",
    "rec_gir_23": "Sorbets Cítricos / Frutas Ácidas",
    "rec_gir_24": "Sorbets Polposos / Frutas Densas",
    "rec_gir_25": "Sorbets Polposos / Frutas Densas",
    "rec_gir_26": "Gelatos de Oleaginosas",
    "rec_gir_27": "Sorbets Cítricos / Frutas Ácidas",
    "rec_gir_28": "Sorbets Polposos / Frutas Densas",
    "rec_gir_29": "Sorbets Polposos / Frutas Densas",
    "rec_gir_30": "Sorbets Cítricos / Frutas Ácidas",
    "rec_gir_31": "Sorbets Cítricos / Frutas Ácidas",
    "rec_gir_32": "Gelatos Veganos",
    "rec_gir_33": "Gelatos de Oleaginosas",
    "rec_gir_34": "Gelatos de Leite com Chocolate",
    "rec_gir_35": "Gelatos de Leite com Chocolate",
    "rec_gir_36": "Gelatos Veganos",
    "rec_gir_37": "Gelatos de Leite",
    "rec_gir_38": "Gelatos de Leite com Chocolate",
    "rec_gir_39": "Gelatos de Leite com Fruta",
    "rec_gir_40": "Sorbets Cítricos / Frutas Ácidas"
}

def generate_steps(rec_id, rec_data):
    style = STYLE_MAP[rec_id]
    name = rec_data["name"]
    infusion = rec_data.get("infusion")
    notes = rec_data.get("prep_notes", "")
    is_sorbet = "Sorbets" in style or "Veganos" in style or "Sorbet" in name
    has_eggs = any(ing == "Gema de Ovo" for ing, _ in rec_data["calda"])
    has_cocoa = any("Cacau" in ing for ing, _ in rec_data["calda"])
    has_choc = any("Chocolate" in ing for ing, _ in rec_data["calda"])
    has_nuts = any("Pasta" in ing or "Nozes" in ing for ing, _ in rec_data["calda"])
    has_alcohol = any("Vinho" in ing or "Cachaça" in ing for ing, _ in rec_data["calda"])
    has_variegato = len(rec_data.get("variegatos", [])) > 0
    
    steps = []
    
    # 1. Pesagem
    steps.append({
        "id": f"{rec_id}_step_1",
        "order": 1,
        "title": "Pesagem de Precisão e Pré-Dispersão dos Secos",
        "category": "pesagem",
        "temperature": "Ambiente",
        "duration": "5 min",
        "description": "Pesar rigorosamente os pós secos (açúcares, estabilizante neutro e fibras) em balança de precisão decimal. Misturar a seco em tigela para dispersão homogênea e prevenção de grumos."
    })
    
    # 2. Pasteurização / Aquecimento
    if is_sorbet and not has_cocoa:
        steps.append({
            "id": f"{rec_id}_step_2",
            "order": 2,
            "title": "Dispersão a Frio e Homogeneização com Mixer",
            "category": "emulsao",
            "temperature": "Ambiente",
            "duration": "10 min",
            "description": "Dispersar a mistura de secos na água e polpa da fruta fresca utilizando mixer de imersão de alta rotação (8.000 a 10.000 RPM) por 2 a 3 minutos para hidratação das gomas sem aquecer a fruta."
        })
    elif has_cocoa:
        steps.append({
            "id": f"{rec_id}_step_2",
            "order": 2,
            "title": "Pasteurização Alta e Hidratação do Cacau a 90°C",
            "category": "aquecimento",
            "temperature": "90°C",
            "duration": "15 min",
            "description": "Aquecer a base líquida. Aos 40°C, introduzir os secos e o cacau em pó alcalino. Elevar até 90°C para gelatinização do amido de cacau e hidratação profunda dos sólidos insolúveis."
        })
    elif has_eggs:
        steps.append({
            "id": f"{rec_id}_step_2",
            "order": 2,
            "title": "Pasteurização Segura de Gemas a 80°C–82°C",
            "category": "aquecimento",
            "temperature": "80°C–82°C",
            "duration": "15 min",
            "description": "Aquecer a base láctea. Aos 40°C, verter os secos. Ao atingir 60°C, incorporar as gemas batidas com mixer. Elevar a temperatura sob agitação constante até 80°C–82°C para pasteurização sanitária de Salmonella e ativação da lecitina sem talhar."
        })
    else:
        steps.append({
            "id": f"{rec_id}_step_2",
            "order": 2,
            "title": "Pasteurização Clássica da Calda Láctea a 85°C",
            "category": "aquecimento",
            "temperature": "85°C",
            "duration": "15 min",
            "description": "Aquecer leite e creme em fogo moderado. Aos 40°C, verter os secos em chuva agitando com fouet. Elevar a 85°C para desnaturação das proteínas do soro e completa dissolução dos açúcares."
        })
    
    # 3. Protocolos específicos intermediários
    step_num = 3
    
    # 3a. Infusão se houver
    if infusion:
        steps.append({
            "id": f"{rec_id}_step_{step_num}",
            "order": step_num,
            "title": "Protocolo de Infusão Aromática e Coagem",
            "category": "emulsao",
            "temperature": "60°C",
            "duration": "30 min a 12h",
            "description": f"{infusion} Manter em recipiente vedado para preservar compostos voláteis e coar completamente antes de avançar para a maturação."
        })
        step_num += 1
        
    # 3b. Chocolate (65°C off-heat) se houver
    if has_choc:
        steps.append({
            "id": f"{rec_id}_step_{step_num}",
            "order": step_num,
            "title": "Fusão do Chocolate Off-Heat a 65°C",
            "category": "emulsao",
            "temperature": "65°C",
            "duration": "5 min",
            "description": "Retirar a panela do fogo. Deixar a calda estabilizar em 65°C (off-heat) e verter sobre o chocolate nobre, emulsionando com mixer vertical de alta rotação até total dissolução dos sólidos e brilho acetinado."
        })
        step_num += 1
        
    # 3c. Pastas de Oleaginosas se houver
    if has_nuts and not has_choc:
        steps.append({
            "id": f"{rec_id}_step_{step_num}",
            "order": step_num,
            "title": "Incorporação e Emulsão Fina da Pasta Pura",
            "category": "emulsao",
            "temperature": "50°C",
            "duration": "5 min",
            "description": "Adicionar a pasta pura de oleaginosa na calda a 50°C. Emulsionar vigorosamente com mixer por 2 minutos para micronizar os glóbulos de lipídios vegetais."
        })
        step_num += 1
        
    # 3d. Alcoólicos se houver
    if has_alcohol:
        steps.append({
            "id": f"{rec_id}_step_{step_num}",
            "order": step_num,
            "title": "Adição do Destilado/Licor a Frio",
            "category": "emulsao",
            "temperature": "15°C",
            "duration": "3 min",
            "description": "Adicionar a bebida alcoólica com a calda já resfriada (abaixo de 15°C) antes da maturação, evitando a evaporação de etanol e preservando o PAC anticongelante do álcool."
        })
        step_num += 1
        
    # 3e. Se não teve nenhum passo intermediário especial, colocar emulsão mecânica
    if not infusion and not has_choc and not has_nuts and not has_alcohol:
        steps.append({
            "id": f"{rec_id}_step_{step_num}",
            "order": step_num,
            "title": "Emulsão e Homogeneização com Mixer",
            "category": "emulsao",
            "temperature": "65°C" if not is_sorbet else "Ambiente",
            "duration": "3 min",
            "description": "Aplicar mixer de alta rotação (8.000 a 10.000 RPM) por 2 a 3 minutos para quebrar os glóbulos de gordura e refinar a textura sedosa da calda."
        })
        step_num += 1
    
    # 4. Resfriamento Rápido
    steps.append({
        "id": f"{rec_id}_step_{step_num}",
        "order": step_num,
        "title": "Resfriamento Rápido em Banho de Gelo (<10°C)",
        "category": "maturacao",
        "temperature": "<10°C",
        "duration": "15 min",
        "description": "Transferir a calda para banho-maria invertido com bastante gelo e sal grosso, agitando vigorosamente até baixar a temperatura abaixo de 10°C em menos de 15 minutos."
    })
    step_num += 1
    
    # 5. Maturação Estática
    steps.append({
        "id": f"{rec_id}_step_{step_num}",
        "order": step_num,
        "title": "Maturação Estática sob Refrigeração a 4°C",
        "category": "maturacao",
        "temperature": "4°C",
        "duration": "4h a 12h",
        "description": "Armazenar a calda coberta com filme em contato a 4°C por 4 a 12 horas para estabilização coloidal, hidratação plena dos hidrocoloides e cristalização parcial dos glóbulos de gordura."
    })
    step_num += 1
    
    # 6. Mantecação Dinâmica
    steps.append({
        "id": f"{rec_id}_step_{step_num}",
        "order": step_num,
        "title": "Mantecação Dinâmica na Sorveteira (-7°C)",
        "category": "batimento",
        "temperature": "-7°C",
        "duration": "30 a 45 min",
        "description": "Bater na sorveteira pré-resfriada até consistência aveludada, firme e incorporação controlada de ar (overrun 25-35%)."
    })
    step_num += 1
    
    # 7. Finalização / Mescla / Vitrine
    if has_variegato:
        v_str = ", ".join([f"{v['grams']}g/kg de {v['name']}" for v in rec_data.get("variegatos", [])])
        steps.append({
            "id": f"{rec_id}_step_{step_num}",
            "order": step_num,
            "title": "Mesclagem na Extração e Decoração de Vitrine",
            "category": "abatimento",
            "temperature": "-12°C",
            "duration": "5 min",
            "description": f"Na saída da máquina para a cuba pré-resfriada, intercalar o gelato em camadas com {v_str}. Levar ao ultracongelador por 10 min a -35°C para selar e expor na vitrine a -12°C."
        })
    else:
        steps.append({
            "id": f"{rec_id}_step_{step_num}",
            "order": step_num,
            "title": "Abatimento Térmico e Exposição em Vitrine (-12°C)",
            "category": "abatimento",
            "temperature": "-12°C",
            "duration": "10 min",
            "description": "Extrair diretamente em cuba resfriada, levar ao ultracongelador a -35°C por 10 minutos para formar a casquinha superficial estabilizadora e servir na vitrine comercial a -12°C."
        })
        
    return steps

def run_migration():
    print("=== RE-APLICANDO MIGRAÇÃO COM PASSOS REFINADOS ===")
    
    # 1. Update ingredients.json
    with open(ING_PATH, "r", encoding="utf-8") as f:
        ings = json.load(f)
    existing_ing_ids = {i["id"] for i in ings}
    for ing in new_ingredients:
        if ing["id"] not in existing_ing_ids:
            ings.append(ing)
    with open(ING_PATH, "w", encoding="utf-8") as f:
        json.dump(ings, f, indent=2, ensure_ascii=False)
        
    # 2. Update preparations.json
    with open(PREP_PATH, "r", encoding="utf-8") as f:
        preps = json.load(f)
    existing_prep_ids = {p["id"] for p in preps}
    for prep in new_preparations:
        if prep["id"] not in existing_prep_ids:
            preps.append(prep)
    with open(PREP_PATH, "w", encoding="utf-8") as f:
        json.dump(preps, f, indent=2, ensure_ascii=False)
        
    # 3. Build recipes
    with open(REC_PATH, "r", encoding="utf-8") as f:
        recs = json.load(f)
        
    for idx, r_data in enumerate(recipes_data):
        rec_num = 189 + idx
        rec_id = f"rec_{rec_num}"
        orig_id = r_data["id"]
        
        calda_items = []
        for raw_name, grams in r_data["calda"]:
            mapped_name = ING_MAP.get(raw_name, raw_name)
            calda_items.append({"name": mapped_name, "grams": grams})
            
        tot_g = sum(item["grams"] for item in calda_items)
        assert tot_g == 1000, f"Calda {r_data['name']} tem {tot_g}g != 1000g"
        
        style = STYLE_MAP[orig_id]
        steps = generate_steps(orig_id, r_data)
        
        recipe_obj = {
            "id": rec_id,
            "name": r_data["name"],
            "category": style,
            "targetStyle": style,
            "ingredients": calda_items,
            "totalGrams": 1000,
            "preparationSteps": steps
        }
        if r_data.get("variegatos"):
            recipe_obj["variegatos"] = r_data["variegatos"]
            
        pos = next((i for i, r in enumerate(recs) if r["id"] == rec_id), -1)
        if pos >= 0:
            recs[pos] = recipe_obj
        else:
            recs.append(recipe_obj)
            
    with open(REC_PATH, "w", encoding="utf-8") as f:
        json.dump(recs, f, indent=2, ensure_ascii=False)
        
    print(f"Receitas atualizadas com passos térmicos calibrados (total: {len(recs)})")

if __name__ == "__main__":
    run_migration()
