import fs from 'fs';

// 1. Atualizar recipes.json
let recipesContent = fs.readFileSync('./src/data/recipes.json', 'utf8');
recipesContent = recipesContent.replaceAll('"Gelatos Tradicionais de Leite"', '"Gelatos de Leite"');
recipesContent = recipesContent.replaceAll('"Sorbets Cítricos / Frutas Ácidas"', '"Sorbets Cítricos"');
recipesContent = recipesContent.replaceAll('"Sorbets Polposos / Frutas Densas"', '"Sorbets Polposos"');
fs.writeFileSync('./src/data/recipes.json', recipesContent, 'utf8');

// 2. Atualizar styles.json
let stylesContent = fs.readFileSync('./src/data/styles.json', 'utf8');
stylesContent = stylesContent.replaceAll('"Sorbets Cítricos / Frutas Ácidas"', '"Sorbets Cítricos"');
stylesContent = stylesContent.replaceAll('"Sorbets Polposos / Frutas Densas"', '"Sorbets Polposos"');
fs.writeFileSync('./src/data/styles.json', stylesContent, 'utf8');

console.log('Arquivos recipes.json e styles.json atualizados com sucesso!');
