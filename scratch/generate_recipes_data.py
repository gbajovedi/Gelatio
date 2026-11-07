# -*- coding: utf-8 -*-
import json
import os
import re

ROOT = r"C:\Users\ajove.DESKTOP-A98A6JQ\OneDrive\Documentos\Projetos de IA\Receitas e Balanceamento de Gelatos"
ING_PATH = os.path.join(ROOT, "src", "data", "ingredients.json")
PREP_PATH = os.path.join(ROOT, "src", "data", "preparations.json")
REC_PATH = os.path.join(ROOT, "src", "data", "recipes.json")
DB_PATH = os.path.join(ROOT, "src", "db", "database.ts")
TEST_PATH = os.path.join(ROOT, "src", "core", "__tests__", "gelatoIrresistivelRefinement.test.ts")

# 1. 15 NOVOS INSUMOS
new_ingredients = [
    {
        "id": "ing_219",
        "name": "Vinho Marsala (ou Vinho do Porto)",
        "category": "Álcoois & Bebidas",
        "costKg": 65.0,
        "sugars": 0.11,
        "fat": 0.0,
        "msnf": 0.0,
        "otherSolids": 0.18,
        "totalSolids": 0.29,
        "water": 0.71,
        "pod": 0.11,
        "pac": 3.60,
        "protein": 0.0,
        "hasAllergen": False
    },
    {
        "id": "ing_220",
        "name": "Rapadura Artesanal",
        "category": "Açúcares",
        "costKg": 18.0,
        "sugars": 0.89,
        "fat": 0.0,
        "msnf": 0.0,
        "otherSolids": 0.025,
        "totalSolids": 0.915,
        "water": 0.085,
        "pod": 0.85,
        "pac": 0.89,
        "protein": 0.01,
        "hasAllergen": False
    },
    {
        "id": "ing_221",
        "name": "Queijo Meia Cura Artesanal",
        "category": "Laticínios",
        "costKg": 58.0,
        "sugars": 0.01,
        "fat": 0.27,
        "msnf": 0.03,
        "otherSolids": 0.28,
        "totalSolids": 0.59,
        "water": 0.41,
        "pod": 0.0,
        "pac": 0.15,
        "protein": 0.25,
        "hasAllergen": True
    },
    {
        "id": "ing_222",
        "name": "Arroz Grão Curto para Arroz-Doce",
        "category": "Outros",
        "costKg": 8.0,
        "sugars": 0.002,
        "fat": 0.005,
        "msnf": 0.0,
        "otherSolids": 0.793,
        "totalSolids": 0.87,
        "water": 0.13,
        "pod": 0.0,
        "pac": 0.0,
        "protein": 0.07,
        "hasAllergen": False
    },
    {
        "id": "ing_223",
        "name": "Gergelim Preto Integral",
        "category": "Pastas & Oleaginosas",
        "costKg": 45.0,
        "sugars": 0.003,
        "fat": 0.50,
        "msnf": 0.0,
        "otherSolids": 0.447,
        "totalSolids": 0.95,
        "water": 0.05,
        "pod": 0.0,
        "pac": 0.0,
        "protein": 0.18,
        "hasAllergen": True
    },
    {
        "id": "ing_224",
        "name": "Bolo Rocambole de Doce de Leite",
        "category": "Confeitaria & Inclusões",
        "costKg": 38.0,
        "sugars": 0.42,
        "fat": 0.12,
        "msnf": 0.04,
        "otherSolids": 0.14,
        "totalSolids": 0.72,
        "water": 0.28,
        "pod": 0.45,
        "pac": 0.50,
        "protein": 0.06,
        "hasAllergen": True
    },
    {
        "id": "ing_225",
        "name": "Gengibre em Pó",
        "category": "Outros",
        "costKg": 42.0,
        "sugars": 0.03,
        "fat": 0.04,
        "msnf": 0.0,
        "otherSolids": 0.83,
        "totalSolids": 0.90,
        "water": 0.10,
        "pod": 0.0,
        "pac": 0.05,
        "protein": 0.09,
        "hasAllergen": False
    },
    {
        "id": "ing_226",
        "name": "Sal Rosa do Himalaia",
        "category": "Outros",
        "costKg": 15.0,
        "sugars": 0.0,
        "fat": 0.0,
        "msnf": 0.0,
        "otherSolids": 1.0,
        "totalSolids": 1.0,
        "water": 0.0,
        "pod": 0.0,
        "pac": 5.5,
        "protein": 0.0,
        "hasAllergen": False
    },
    {
        "id": "ing_227",
        "name": "Arroz-Doce Artesanal Cozido com Canela (Pré-Preparo)",
        "category": "Bases e Caldas",
        "costKg": 16.5,
        "sugars": 0.35,
        "fat": 0.02,
        "msnf": 0.05,
        "otherSolids": 0.23,
        "totalSolids": 0.65,
        "water": 0.35,
        "pod": 0.35,
        "pac": 0.38,
        "protein": 0.04,
        "hasAllergen": True
    },
    {
        "id": "ing_228",
        "name": "Caramelo Artesanal a 175°C com Flor de Sal (Pré-Preparo)",
        "category": "Bases e Caldas",
        "costKg": 24.0,
        "sugars": 0.52,
        "fat": 0.04,
        "msnf": 0.03,
        "otherSolids": 0.16,
        "totalSolids": 0.75,
        "water": 0.25,
        "pod": 0.52,
        "pac": 0.55,
        "protein": 0.02,
        "hasAllergen": True
    },
    {
        "id": "ing_229",
        "name": "Geleia Artesanal de Morango (Pré-Preparo)",
        "category": "Variegato",
        "costKg": 28.0,
        "sugars": 0.45,
        "fat": 0.0,
        "msnf": 0.0,
        "otherSolids": 0.08,
        "totalSolids": 0.53,
        "water": 0.47,
        "pod": 0.42,
        "pac": 0.58,
        "protein": 0.01,
        "hasAllergen": False
    },
    {
        "id": "ing_230",
        "name": "Geleia Artesanal de Figo Turco (Pré-Preparo)",
        "category": "Variegato",
        "costKg": 36.0,
        "sugars": 0.48,
        "fat": 0.003,
        "msnf": 0.0,
        "otherSolids": 0.12,
        "totalSolids": 0.603,
        "water": 0.397,
        "pod": 0.45,
        "pac": 0.60,
        "protein": 0.012,
        "hasAllergen": False
    },
    {
        "id": "ing_231",
        "name": "Geleia Artesanal de Amoras Silvestres (Pré-Preparo)",
        "category": "Variegato",
        "costKg": 32.0,
        "sugars": 0.44,
        "fat": 0.004,
        "msnf": 0.0,
        "otherSolids": 0.09,
        "totalSolids": 0.534,
        "water": 0.466,
        "pod": 0.41,
        "pac": 0.56,
        "protein": 0.014,
        "hasAllergen": False
    },
    {
        "id": "ing_232",
        "name": "Geleia Artesanal de Mirtilos Frescos (Pré-Preparo)",
        "category": "Variegato",
        "costKg": 42.0,
        "sugars": 0.45,
        "fat": 0.003,
        "msnf": 0.0,
        "otherSolids": 0.09,
        "totalSolids": 0.543,
        "water": 0.457,
        "pod": 0.42,
        "pac": 0.57,
        "protein": 0.007,
        "hasAllergen": False
    },
    {
        "id": "ing_233",
        "name": "Crocante Artesanal de Gergelim Preto (Pré-Preparo)",
        "category": "Inclusões Crocantes",
        "costKg": 35.0,
        "sugars": 0.45,
        "fat": 0.28,
        "msnf": 0.0,
        "otherSolids": 0.24,
        "totalSolids": 0.97,
        "water": 0.03,
        "pod": 0.45,
        "pac": 0.45,
        "protein": 0.10,
        "hasAllergen": True
    }
]

# 2. 13 NOVOS PRÉ-PREPAROS E VARIEGATOS
new_preparations = [
    {
        "id": "prep_gir_geleia_padrao",
        "name": "Geleia-Padrão de Frutas Ricas em Pectina (Gelato Irresistível)",
        "category": "Variegato",
        "instructions": "Pasteurizar a 85°C por 15 minutos, resfriar e conservar na temperatura de 4°C. Opcional: maçã fresca para pectina natural.",
        "ingredients": [
            {"name": "Morango", "grams": 1000},
            {"name": "Açúcar", "grams": 400},
            {"name": "Glucose Líquida", "grams": 300},
            {"name": "Suco de Limão", "grams": 100},
            {"name": "Água", "grams": 100},
            {"name": "Goma Xantana", "grams": 6}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_gel_1",
                "order": 1,
                "title": "Dispersão e Homogeneização a Frio",
                "category": "pesagem",
                "temperature": "Ambiente",
                "duration": "5 min",
                "description": "Misturar a sacarose com a goma xantana a seco para evitar grumos. Juntar a polpa de fruta fresca, glucose líquida, suco de limão e água."
            },
            {
                "id": "step_gir_gel_2",
                "order": 2,
                "title": "Pasteurização e Gelificação a 85°C",
                "category": "aquecimento",
                "temperature": "85°C",
                "duration": "15 min",
                "description": "Cozinhar em panela de fundo triplo até 85°C sob agitação suave contínua, mantendo por 15 minutos para ativar a pectina e concentrar os aromas sem caramelização excessiva."
            },
            {
                "id": "step_gir_gel_3",
                "order": 3,
                "title": "Abatimento e Maturação a 4°C",
                "category": "maturacao",
                "temperature": "4°C",
                "duration": "4h",
                "description": "Resfriar rapidamente em banho de gelo até atingir temperatura inferior a 10°C. Armazenar a 4°C por no mínimo 4 horas antes de aplicar como mescla."
            }
        ]
    },
    {
        "id": "prep_gir_geleia_amora",
        "name": "Geleia Artesanal de Amoras Silvestres (Gelato Irresistível)",
        "category": "Variegato",
        "instructions": "Geleia de amora com acidez equilibrada pelo limão e brilho sedoso pela glucose líquida.",
        "ingredients": [
            {"name": "Frutas Vermelhas", "grams": 1000},
            {"name": "Açúcar", "grams": 400},
            {"name": "Glucose Líquida", "grams": 300},
            {"name": "Suco de Limão", "grams": 100},
            {"name": "Água", "grams": 100},
            {"name": "Goma Xantana", "grams": 6}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_amo_1",
                "order": 1,
                "title": "Mistura a Frio",
                "category": "pesagem",
                "temperature": "Ambiente",
                "duration": "5 min",
                "description": "Misturar amoras com sacarose, glucose líquida, xantana e limão em panela de inox."
            },
            {
                "id": "step_gir_amo_2",
                "order": 2,
                "title": "Cozimento a 85°C",
                "category": "aquecimento",
                "temperature": "85°C",
                "duration": "15 min",
                "description": "Aquecer a 85°C por 15 minutos mexendo delicadamente para preservar fragmentos inteiros da fruta."
            },
            {
                "id": "step_gir_amo_3",
                "order": 3,
                "title": "Resfriamento Rápido",
                "category": "maturacao",
                "temperature": "4°C",
                "duration": "4h",
                "description": "Resfriar a 4°C antes de mesclar nas cubas de gelato de cheesecake."
            }
        ]
    },
    {
        "id": "prep_gir_geleia_figo",
        "name": "Geleia Artesanal de Figo Turco (Gelato Irresistível)",
        "category": "Variegato",
        "instructions": "Geleia encorpada de figos frescos em pedaços com sementinhas crocantes para mesclar no gelato de nozes.",
        "ingredients": [
            {"name": "Açúcar", "grams": 350},
            {"name": "Glucose Líquida", "grams": 250},
            {"name": "Suco de Limão", "grams": 60},
            {"name": "Água", "grams": 200},
            {"name": "Goma Xantana", "grams": 5}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_fig_1",
                "order": 1,
                "title": "Preparo e Pique dos Figos",
                "category": "pesagem",
                "temperature": "Ambiente",
                "duration": "10 min",
                "description": "Cortar figos frescos em cubinhos de 5mm preservando a casca macia e sementes."
            },
            {
                "id": "step_gir_fig_2",
                "order": 2,
                "title": "Cozimento e Brilho a 85°C",
                "category": "aquecimento",
                "temperature": "85°C",
                "duration": "15 min",
                "description": "Cozinhar com açúcar, glucose líquida e gotas de limão a 85°C até aspecto translúcido e textura untuosa."
            },
            {
                "id": "step_gir_fig_3",
                "order": 3,
                "title": "Estabilização a Frio",
                "category": "maturacao",
                "temperature": "4°C",
                "duration": "6h",
                "description": "Maturar na geladeira antes de mesclar em camadas no gelato de nozes."
            }
        ]
    },
    {
        "id": "prep_gir_geleia_mirtilo",
        "name": "Geleia Artesanal de Mirtilos Frescos (Gelato Irresistível)",
        "category": "Variegato",
        "instructions": "Variegato aveludado de mirtilo com cor roxa intensa e sabor silvestre para mesclar no sorbet de abacate.",
        "ingredients": [
            {"name": "Açúcar", "grams": 380},
            {"name": "Glucose Líquida", "grams": 280},
            {"name": "Suco de Limão", "grams": 80},
            {"name": "Água", "grams": 100},
            {"name": "Goma Xantana", "grams": 5}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_mir_1",
                "order": 1,
                "title": "Maceração a Frio",
                "category": "pesagem",
                "temperature": "Ambiente",
                "duration": "5 min",
                "description": "Amassar suavemente metade dos mirtilos e juntar com os açúcares e limão."
            },
            {
                "id": "step_gir_mir_2",
                "order": 2,
                "title": "Pasteurização e Gelificação a 85°C",
                "category": "aquecimento",
                "temperature": "85°C",
                "duration": "15 min",
                "description": "Aquecer a 85°C por 15 minutos até romper parcialmente as bagas e liberar a cor natural antocianina."
            },
            {
                "id": "step_gir_mir_3",
                "order": 3,
                "title": "Resfriamento",
                "category": "maturacao",
                "temperature": "4°C",
                "duration": "4h",
                "description": "Abater a 4°C e conservar vedado sob refrigeração."
            }
        ]
    },
    {
        "id": "prep_gir_arroz_doce",
        "name": "Arroz-Doce Artesanal Cozido com Canela (Gelato Irresistível)",
        "category": "Pré-preparo",
        "instructions": "Cozimento tradicional com leite integral, arroz e canela em pau até evaporação total da água.",
        "ingredients": [
            {"name": "Água", "grams": 1400},
            {"name": "Leite Integral", "grams": 1000},
            {"name": "Açúcar", "grams": 600},
            {"name": "Arroz Grão Curto para Arroz-Doce", "grams": 500}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_arr_1",
                "order": 1,
                "title": "Fervura e Gelatinização do Grão",
                "category": "aquecimento",
                "temperature": "100°C",
                "duration": "30 min",
                "description": "Levar água e leite à fervura com 2 paus de canela. Adicionar o arroz e a sacarose."
            },
            {
                "id": "step_gir_arr_2",
                "order": 2,
                "title": "Redução e Absorção Plena",
                "category": "aquecimento",
                "temperature": "95°C",
                "duration": "20 min",
                "description": "Cozinhar em fogo baixo mexendo sempre até a água evaporar totalmente e o arroz atingir ponto de papa cremosa e macia."
            },
            {
                "id": "step_gir_arr_3",
                "order": 3,
                "title": "Resfriamento para Incorporação na Calda",
                "category": "maturacao",
                "temperature": "4°C",
                "duration": "3h",
                "description": "Retirar as ramas de canela. Deixar esfriar completamente antes de adicionar 280g/kg na calda do gelato."
            }
        ]
    },
    {
        "id": "prep_gir_caramelo_flor_de_sal",
        "name": "Caramelo Artesanal a 175°C com Flor de Sal (Gelato Irresistível)",
        "category": "Pré-preparo",
        "instructions": "Caramelo âmbar escuro artesanal finalizado com manteiga, leite e leite condensado.",
        "ingredients": [
            {"name": "Açúcar", "grams": 350},
            {"name": "Leite Integral", "grams": 250},
            {"name": "Água", "grams": 150},
            {"name": "Leite Condensado", "grams": 100},
            {"name": "Manteiga", "grams": 20},
            {"name": "Sal", "grams": 3}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_car_1",
                "order": 1,
                "title": "Caramelização a Seco a 175°C",
                "category": "aquecimento",
                "temperature": "175°C",
                "duration": "12 min",
                "description": "Caramelizar o açúcar com a água na panela até tom âmbar escuro e aroma tostado profundo (175°C a 180°C). Cuidado para não queimar."
            },
            {
                "id": "step_gir_car_2",
                "order": 2,
                "title": "Desglaceamento Vigoroso Fora do Fogo",
                "category": "emulsao",
                "temperature": "85°C",
                "duration": "5 min",
                "description": "Tirar do fogo e, com fouet, verter imediatamente a manteiga, o leite condensado e o leite morno, batendo sem parar até obter emulsão homogênea."
            },
            {
                "id": "step_gir_car_3",
                "order": 3,
                "title": "Finalização com Flor de Sal e Resfriamento",
                "category": "maturacao",
                "temperature": "4°C",
                "duration": "2h",
                "description": "Acrescentar a flor de sal para equilibrar o perfil gustativo e resfriar até 4°C antes de incorporar 300g/kg na calda base."
            }
        ]
    },
    {
        "id": "prep_gir_calda_caramelo_salgado",
        "name": "Calda Fluida de Caramelo Salgado para Variegato (Gelato Irresistível)",
        "category": "Variegato",
        "instructions": "Calda de caramelo com glucose e flor de sal que não congela nem endurece na temperatura de vitrine (-12°C).",
        "ingredients": [
            {"name": "Açúcar", "grams": 400},
            {"name": "Glucose Líquida", "grams": 300},
            {"name": "Creme De Leite Fresco 35%", "grams": 250},
            {"name": "Sal", "grams": 8}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_ccs_1",
                "order": 1,
                "title": "Caramelização do Açúcar",
                "category": "aquecimento",
                "temperature": "175°C",
                "duration": "10 min",
                "description": "Dourar o açúcar até cor dourada escura."
            },
            {
                "id": "step_gir_ccs_2",
                "order": 2,
                "title": "Adição de Glucose e Creme Quente",
                "category": "emulsao",
                "temperature": "90°C",
                "duration": "5 min",
                "description": "Verter o creme de leite morno e a glucose líquida fora do fogo, mexendo até total dissolução."
            },
            {
                "id": "step_gir_ccs_3",
                "order": 3,
                "title": "Salpicar Flor de Sal",
                "category": "maturacao",
                "temperature": "Ambiente",
                "duration": "1h",
                "description": "Misturar a flor de sal e deixar esfriar. Usar para mesclagem em cubas."
            }
        ]
    },
    {
        "id": "prep_gir_crocante_gergelim_preto",
        "name": "Crocante Artesanal de Gergelim Preto (Gelato Irresistível)",
        "category": "Inclusões Crocantes",
        "instructions": "Crocante caramelizado a seco de sementes pretas de gergelim para mesclar no gelato Fiordipanna.",
        "ingredients": [
            {"name": "Gergelim Preto Integral", "grams": 500},
            {"name": "Açúcar", "grams": 500}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_cgp_1",
                "order": 1,
                "title": "Tostagem Aromática das Sementes",
                "category": "aquecimento",
                "temperature": "130°C",
                "duration": "8 min",
                "description": "Tostar o gergelim preto em frigideira seca em fogo baixo por 8 minutos até liberar os aromas característicos de noz tostada."
            },
            {
                "id": "step_gir_cgp_2",
                "order": 2,
                "title": "Caramelização a Seco a 160°C",
                "category": "aquecimento",
                "temperature": "160°C",
                "duration": "10 min",
                "description": "Caramelizar o açúcar em fogo médio até tom dourado. Despejar as sementes tostadas e envolver rapidamente."
            },
            {
                "id": "step_gir_cgp_3",
                "order": 3,
                "title": "Laminação e Pique Fino",
                "category": "pesagem",
                "temperature": "Ambiente",
                "duration": "15 min",
                "description": "Espalhar finamente sobre tapete de silicone (silpat). Após esfriar e vitrificar, quebrar em pequenos pedaços com rolo ou cutter para mesclar 100g/kg."
            }
        ]
    },
    {
        "id": "prep_gir_avelas_tostadas",
        "name": "Avelãs Tostadas e Caramelizadas em Pedaços (Gelato Irresistível)",
        "category": "Inclusões Crocantes",
        "instructions": "Avelãs em grãos crocantes para mesclar no gelato de Gianduia e Avelã.",
        "ingredients": [
            {"name": "Açúcar", "grams": 500},
            {"name": "Água", "grams": 150}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_ave_1",
                "order": 1,
                "title": "Torra Leve",
                "category": "aquecimento",
                "temperature": "150°C",
                "duration": "15 min",
                "description": "Tostar as avelãs no forno a 150°C por 15 minutos e esfregar em pano para retirar a película marrom."
            },
            {
                "id": "step_gir_ave_2",
                "order": 2,
                "title": "Caramelização e Resfriamento",
                "category": "aquecimento",
                "temperature": "165°C",
                "duration": "10 min",
                "description": "Caramelizar no açúcar fundido, despejar no silpat e picar grosseiramente."
            }
        ]
    },
    {
        "id": "prep_gir_torrone_cubos",
        "name": "Torrone Artesanal em Cubos Crocantes (Gelato Irresistível)",
        "category": "Inclusões Crocantes",
        "instructions": "Cubinhos de torrone crocante para mescla e decoração de vitrine.",
        "ingredients": [
            {"name": "Torrone", "grams": 1000}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_tor_1",
                "order": 1,
                "title": "Corte em Cubos Regulares",
                "category": "pesagem",
                "temperature": "Ambiente",
                "duration": "10 min",
                "description": "Com faca de chef pesada ou guilhotina, picar placas de torrone em cubinhos de 6 a 8mm."
            },
            {
                "id": "step_gir_tor_2",
                "order": 2,
                "title": "Armazenamento Hermético",
                "category": "maturacao",
                "temperature": "Ambiente",
                "duration": "5 min",
                "description": "Manter em recipiente vedado com sílica alimentar para evitar que a umidade do ar amoleça o açúcar antes da mesclagem (80g/kg)."
            }
        ]
    },
    {
        "id": "prep_gir_flocagem_chocolate_meio_amargo",
        "name": "Flocagem Artesanal de Chocolate Meio Amargo (Gelato Irresistível)",
        "category": "Variegato",
        "instructions": "Flocos crocantes de chocolate 54-70% para Stracciatella clássica.",
        "ingredients": [
            {"name": "Chocolate Amargo 70%", "grams": 1000}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_flo_1",
                "order": 1,
                "title": "Derretimento e Temperagem",
                "category": "aquecimento",
                "temperature": "45°C",
                "duration": "10 min",
                "description": "Derreter em banho-maria até 45°C. Espalhar na mesa de inox até endurecer."
            },
            {
                "id": "step_gir_flo_2",
                "order": 2,
                "title": "Flocagem no Cilindro",
                "category": "batimento",
                "temperature": "-7°C",
                "duration": "2 min",
                "description": "Quebrar em lascas com faca e colocar na máquina no momento da extração para quebrar e distribuir os flocos."
            }
        ]
    },
    {
        "id": "prep_gir_flocagem_chocolate_branco",
        "name": "Flocagem Artesanal de Chocolate Branco Nobre (Gelato Irresistível)",
        "category": "Variegato",
        "instructions": "Flocos de chocolate branco para Cioccomenta e Stracciatella Invertida.",
        "ingredients": [
            {"name": "Chocolate Branco", "grams": 1000}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_flw_1",
                "order": 1,
                "title": "Derretimento Cuidadoso",
                "category": "aquecimento",
                "temperature": "40°C",
                "duration": "10 min",
                "description": "Derreter o chocolate branco nobre em banho-maria suave (máx 40°C) para não queimar o leite."
            },
            {
                "id": "step_gir_flw_2",
                "order": 2,
                "title": "Cristalização em Mesa e Extração",
                "category": "batimento",
                "temperature": "Ambiente",
                "duration": "15 min",
                "description": "Espalhar em placa de inox, deixar cristalizar, quebrar e adicionar no cilindro ao apitar a extração (90g/kg)."
            }
        ]
    },
    {
        "id": "prep_gir_rocambole_cubos",
        "name": "Cubos Artesanais de Rocambole de Doce de Leite (Gelato Irresistível)",
        "category": "Inclusões Crocantes",
        "instructions": "Cubos de rocambole macio para finalização e mescla em cubas de gelato.",
        "ingredients": [
            {"name": "Bolo Rocambole de Doce de Leite", "grams": 1000}
        ],
        "preparationSteps": [
            {
                "id": "step_gir_roc_1",
                "order": 1,
                "title": "Corte em Cubinhos Delicados",
                "category": "pesagem",
                "temperature": "Ambiente",
                "duration": "10 min",
                "description": "Fatiar o rocambole de doce de leite gelado e cortar em cubos pequenos de 8mm."
            },
            {
                "id": "step_gir_roc_2",
                "order": 2,
                "title": "Mesclagem na Extração",
                "category": "maturacao",
                "temperature": "Ambiente",
                "duration": "5 min",
                "description": "Intercalar 50g por kg na saída da máquina para que o bolo absorva leve umidade sem desmanchar."
            }
        ]
    }
]

print("Base definitions ready.")
