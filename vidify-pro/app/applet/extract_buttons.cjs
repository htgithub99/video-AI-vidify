const fs = require('fs');

const content = fs.readFileSync('src/components/PipelineWizard.tsx', 'utf8');

const buttonRegex = /<button[\s\S]*?>([\s\S]*?)<\/button>/g;
let match;
const buttons = [];

while ((match = buttonRegex.exec(content)) !== null) {
    const buttonContent = match[1];
    if (buttonContent.includes('currentLang === \'vi\'')) {
        const langMatch = buttonContent.match(/currentLang === 'vi' \? ['"](.*?)['"] : ['"](.*?)['"]/);
        if (langMatch) {
            buttons.push(`VI: ${langMatch[1]} | EN: ${langMatch[2]}`);
        } else {
             // extract from {currentLang === 'vi' ? ... : ...}
             const fallbackMatch = buttonContent.match(/\{currentLang === 'vi'(.*?)\}/g);
             if (fallbackMatch) buttons.push(fallbackMatch.join('  '));
        }
    }
}

fs.writeFileSync('button_extract.txt', buttons.join('\n'));
