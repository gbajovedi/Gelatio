const fs = require('fs');
let code = fs.readFileSync('src/components/Financeiro/PricingCalculator.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

// Revert line 999
code = code.replace(
  'div className="flex items-center gap-1 sm:gap-1.5 pt-0.5 whitespace-nowrap overflow-x-auto">\n                  {costGroups.map(g => (',
  'div className="flex flex-wrap items-center gap-1.5 pt-0.5">\n                  {costGroups.map(g => ('
);

// Update line 1258
code = code.replace(
  'div className="flex flex-wrap items-center gap-1.5 pt-0.5">\n                      <span className="text-[10px] text-slate-500 mr-0.5 shrink-0">Sugestões:</span>',
  'div className="flex items-center gap-1 sm:gap-1.5 pt-0.5 whitespace-nowrap overflow-x-auto">\n                      <span className="text-[10px] text-slate-500 mr-0.5 shrink-0">Sugestões:</span>'
);

fs.writeFileSync('src/components/Financeiro/PricingCalculator.tsx', code, 'utf8');
console.log('Done script!');
