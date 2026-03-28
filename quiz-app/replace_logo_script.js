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
   // Swap logo
   content = content.replace(/7mz-logo\.jpg/g, 'geek-logo.png');
   
   // Apply Geek Arena renames where obvious
   content = content.replace(/7 Minutoz/g, 'Comunidade Geek');
   content = content.replace(/7MZ(?= <span)/g, 'GEEK'); 
   content = content.replace(/7MZ ARENA/g, 'GEEK ARENA');
   
   fs.writeFileSync(f, content, 'utf8');
}
console.log('Logo replaced successfully!');
