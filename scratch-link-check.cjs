const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const allMarkdownFiles = [];

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.md')) {
            allMarkdownFiles.push(fullPath);
        }
    }
}

walkDir(docsDir);
allMarkdownFiles.push(path.join(__dirname, 'README.md'));

const brokenLinks = [];

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

for (const file of allMarkdownFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
        const link = match[2];
        if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('#')) {
            continue;
        }
        
        const linkWithoutHash = link.split('#')[0];
        if (!linkWithoutHash) continue; // It was just a hash

        const targetPath = path.resolve(path.dirname(file), linkWithoutHash);
        if (!fs.existsSync(targetPath)) {
            brokenLinks.push({ file, link, targetPath });
        }
    }
}

console.log(JSON.stringify(brokenLinks, null, 2));
