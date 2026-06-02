const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/(dashboard)/tasks/page.tsx',
  'app/(dashboard)/calendar/page.tsx',
  'app/(dashboard)/participants/page.tsx'
];

const replacements = [
  // Backgrounds
  [/bg-white\/75/g, 'bg-card/75'],
  [/bg-white\/50/g, 'bg-card/50'],
  [/bg-white/g, 'bg-card'],
  [/bg-slate-50/g, 'bg-muted'],
  [/bg-slate-100/g, 'bg-muted/80'],
  [/bg-slate-950/g, 'bg-primary'],
  [/hover:bg-slate-800/g, 'hover:bg-primary/90'],
  [/hover:bg-slate-50/g, 'hover:bg-muted/50'],
  
  // Cyan accents -> Primary
  [/bg-cyan-500/g, 'bg-primary'],
  [/hover:bg-cyan-400/g, 'hover:bg-primary/90'],
  [/focus:border-cyan-500/g, 'focus:border-primary'],
  [/focus:ring-cyan-500\/20/g, 'focus:ring-primary/20'],
  [/text-cyan-700/g, 'text-primary'],
  
  // Text colors
  [/text-slate-950/g, 'text-foreground'],
  [/text-slate-900/g, 'text-foreground'],
  [/text-slate-700/g, 'text-muted-foreground'],
  [/text-slate-600/g, 'text-muted-foreground'],
  [/text-slate-500/g, 'text-muted-foreground'],
  [/text-white/g, 'text-primary-foreground'],
  
  // Borders
  [/border-slate-200\/80/g, 'border-border/80'],
  [/border-slate-200/g, 'border-border'],
  [/border-slate-300/g, 'border-border/80'],
  [/border-slate-400/g, 'border-border'],
  
  // Shadows
  [/shadow-slate-200\/60/g, 'shadow-sm'],
  
  // Fix specific sections that had inline styles
  [/className="rounded-4xl border border-border p-8 shadow-sm shadow-sm"[\s\S]*?style=\{\{\s*background:[^}]+\}\}/g, 'className="rounded-4xl border border-border bg-card text-card-foreground p-8 shadow-sm"']
];

for (const relPath of filesToFix) {
  const absPath = path.join(__dirname, relPath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    continue;
  }
  
  let content = fs.readFileSync(absPath, 'utf8');
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  
  // Handle the calendar header specifically
  content = content.replace(/bg-gradient-to-br from-slate-50 to-slate-100/g, 'bg-card text-card-foreground');
  
  fs.writeFileSync(absPath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}
