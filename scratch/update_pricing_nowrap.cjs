const fs = require('fs');

let code = fs.readFileSync('src/components/Financeiro/PricingCalculator.tsx', 'utf8');

// replace flex-wrap with nowrap
code = code.replace(
  'className="flex flex-wrap items-center gap-1.5 pt-0.5"',
  'className="flex items-center gap-1 sm:gap-1.5 pt-0.5 whitespace-nowrap overflow-x-auto"'
);

code = code.replace(
  '<span className="text-[10px] text-slate-500 mr-0.5">Sugestões:</span>',
  '<span className="text-[10px] text-slate-500 mr-0.5 shrink-0">Sugestões:</span>'
);

// also ensure min-h
code = code.replace(
  '<div className="mt-2 space-y-1.5">',
  '<div className="mt-2 space-y-1.5 min-h-[46px]">'
);

fs.writeFileSync('src/components/Financeiro/PricingCalculator.tsx', code, 'utf8');
console.log('Successfully updated nowrap, min-h and shrink-0!');

