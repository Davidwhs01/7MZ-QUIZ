const fs = require('fs');

const files = [
  'src/components/home/LoginProfileCard.tsx',
  'src/app/ranking/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/page.tsx',
  'src/app/play/page.tsx'
];

for(const f of files) {
   let content = fs.readFileSync(f, 'utf8');
   
   // Reverse logo
   content = content.replace(/geek-logo\.png/g, '7mz-logo.jpg');
   
   // Reverse Geek Arena text
   content = content.replace(/Comunidade Geek/g, '7 Minutoz');
   content = content.replace(/GEEK(?= <span)/g, '7MZ'); 
   content = content.replace(/GEEK ARENA/g, '7MZ ARENA');
   
   fs.writeFileSync(f, content, 'utf8');
}
console.log('Reversed successfully!');
