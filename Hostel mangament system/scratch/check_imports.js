
import fs from 'fs';
import path from 'path';

const filesToCheck = [
  'src/app/admin/payments/page.js',
  'src/app/admin/payments/new/page.js',
  'src/app/admin/complaints/page.js',
  'src/app/admin/reports/page.js',
  'src/app/admin/join-requests/page.js',
  'src/app/admin/select-hostel/SelectHostelUI.js',
  'src/components/NotificationsPage.js'
];

filesToCheck.forEach(file => {
  const fullPath = path.resolve('d:/Sp/Projects/Hostel mangament system', file);
  if (!fs.existsSync(fullPath)) return;
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Extract imports from lucide-react
  const lucideMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/);
  const imports = lucideMatch ? lucideMatch[1].split(',').map(i => i.split('as')[0].trim()) : [];
  
  // Extract tags that look like icons (Capitalized, used as <IconName or as variable)
  const tags = [...content.matchAll(/<([A-Z]\w+)/g)].map(m => m[1]);
  
  // Extract variables used in icon properties (e.g. icon={IconName})
  const props = [...content.matchAll(/icon={([A-Z]\w+)}/g)].map(m => m[1]);
  
  const used = [...new Set([...tags, ...props])];
  const missing = used.filter(u => {
    // Exclude locally defined components (simple check: if it's in the file as "const Name =" or "function Name")
    if (content.includes(`const ${u} =`) || content.includes(`function ${u}(`)) return false;
    // Exclude other likely non-icon components (this is rough)
    if (['Link', 'Image', 'StudentPicker', 'NotificationsPage', 'SelectHostelUI'].includes(u)) return false;
    return !imports.includes(u);
  });
  
  if (missing.length > 0) {
    console.log(`File: ${file}`);
    console.log(`Missing imports: ${missing.join(', ')}`);
  }
});
