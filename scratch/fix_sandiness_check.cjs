const fs = require('fs');
let code = fs.readFileSync('src/components/Receitas/RecipeList.tsx', 'utf8');

const targetStr = `        // 1. Risco crítico de arenosidade (Fórmula de Caviezel: SLNG excede teto seguro em > 0.8%)
        if (analysis.sandinessRisk.isAtRisk && analysis.sandinessRisk.excessPct > 0.008) {
          criticalReasons.push(
            \`Arenosidade: SLNG (\${(analysis.percentages.msnf * 100).toFixed(1)}%) excede o teto seguro de Caviezel (\${(analysis.sandinessRisk.maxSafeMsnf * 100).toFixed(1)}%)\`
          );
        }`;

const replacementStr = `        // 1. Risco crítico de arenosidade (Fórmula de Caviezel: SLNG excede teto seguro em > 0.8%)
        const sandiness = analysis.sandinessRisk;
        if (sandiness && sandiness.isAtRisk && sandiness.excessPct > 0.008) {
          criticalReasons.push(
            \`Arenosidade: SLNG (\${(analysis.percentages.msnf * 100).toFixed(1)}%) excede o teto seguro de Caviezel (\${(sandiness.maxSafeMsnf * 100).toFixed(1)}%)\`
          );
        }`;

if (code.includes('analysis.sandinessRisk.isAtRisk')) {
  // normalize CRLF
  code = code.replace(/\r\n/g, '\n');
  code = code.replace(targetStr.replace(/\r\n/g, '\n'), replacementStr.replace(/\r\n/g, '\n'));
  fs.writeFileSync('src/components/Receitas/RecipeList.tsx', code, 'utf8');
  console.log('Successfully replaced sandinessRisk with local const!');
} else {
  console.log('targetStr not found!');
}

