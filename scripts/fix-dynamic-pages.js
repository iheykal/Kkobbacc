const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pagesDir = path.join(__dirname, '..', 'src', 'app');

// Find all page.tsx files
function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findPageFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check if file uses UserContext
function usesUserContext(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('useUser') || 
         content.includes('UserContext') || 
         content.includes('from \'@/contexts/UserContext\'');
}

// Add dynamic export if not present
function addDynamicExport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has dynamic export
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    return false;
  }
  
  // Skip if not a client component
  if (!content.includes("'use client'")) {
    return false;
  }
  
  // Add dynamic export after 'use client'
  if (content.includes("'use client'")) {
    content = content.replace(
      /'use client'(\s*\n)/,
      "'use client'$1\nexport const dynamic = 'force-dynamic';\n"
    );
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main execution
console.log('🔍 Finding all page files...');
const pageFiles = findPageFiles(pagesDir);
console.log(`Found ${pageFiles.length} page files`);

let modified = 0;
let skipped = 0;

pageFiles.forEach(file => {
  if (usesUserContext(file)) {
    if (addDynamicExport(file)) {
      console.log(`✅ Added dynamic export to: ${path.relative(pagesDir, file)}`);
      modified++;
    } else {
      console.log(`⏭️  Skipped (already has dynamic or not client): ${path.relative(pagesDir, file)}`);
      skipped++;
    }
  }
});

console.log(`\n✅ Modified ${modified} files`);
console.log(`⏭️  Skipped ${skipped} files`);
console.log('\n✨ Done! Pages that use UserContext are now marked as dynamic.');

