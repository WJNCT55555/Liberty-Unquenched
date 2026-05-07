const fs = require('fs');
const path = require('path');

const replacements = {
    '\\.Workers': '.Obreros',
    '\\.PoorPeasants': '.Braceros',
    '\\.Yeoman': '.Labradores',
    '\\.Aristocracy': '.Latifundistas',
    '\\.MiddleClass': '.PequenaBurguesia',
    '\\.Intellectuals': '.Intelectuales',
    '\\.Bourgeoisie': '.Burguesia',
    '\\.Church': '.Clero',
    "\\['Workers'\\]": "['Obreros']",
    "\\['PoorPeasants'\\]": "['Braceros']",
    "\\['Yeoman'\\]": "['Labradores']",
    "\\['Aristocracy'\\]": "['Latifundistas']",
    "\\['MiddleClass'\\]": "['PequenaBurguesia']",
    "\\['Intellectuals'\\]": "['Intelectuales']",
    "\\['Bourgeoisie'\\]": "['Burguesia']",
    "\\['Church'\\]": "['Clero']"
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src/game', function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        for (const [search, replace] of Object.entries(replacements)) {
            const regex = new RegExp(search, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, replace);
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Modified: ' + filePath);
        }
    }
});
