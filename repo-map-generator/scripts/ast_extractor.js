const fs = require('fs');
const path = require('path');

function extractSignatures(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const signatures = [];
    const lines = content.split('\n');

    // Lightweight Regex-based signature extractor (fallback when full AST isn't strictly needed)
    const regexes = [
        /(?:export\s+)?(?:default\s+)?class\s+\w+(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w\s,]+)?/g,
        /(?:export\s+)?(?:default\s+)?interface\s+\w+/g,
        /(?:export\s+)?type\s+\w+\s*=/g,
        /(?:export\s+)?(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*[^\{]+)?/g,
        /(?:export\s+)?const\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g
    ];

    lines.forEach((line, index) => {
        // Skip comment lines
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) return;

        for (const regex of regexes) {
            const match = line.match(regex);
            if (match) {
                signatures.push({ line: index + 1, signature: match[0].trim() });
            }
        }
    });

    return signatures;
}

function walkDir(dir, extFilter = ['.ts', '.tsx', '.js', '.jsx']) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('.next')) {
                results = results.concat(walkDir(file, extFilter));
            }
        } else {
            if (extFilter.includes(path.extname(file))) {
                results.push(file);
            }
        }
    });
    return results;
}

const targetDir = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : process.cwd();
const files = walkDir(targetDir);

const repoMap = {};
files.forEach(file => {
    const relPath = path.relative(process.cwd(), file);
    const sigs = extractSignatures(file);
    if (sigs.length > 0) {
        repoMap[relPath] = sigs;
    }
});

console.log("# Repo AST Map\n");
for (const [file, sigs] of Object.entries(repoMap)) {
    console.log(`## ${file}`);
    sigs.forEach(s => {
        console.log(`- [L${s.line}] \`${s.signature}\``);
    });
    console.log("");
}
