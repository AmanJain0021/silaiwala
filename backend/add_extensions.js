const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function updateRequires(filePath) {
  if (!filePath.endsWith('.js')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Regex to match require("./...") or require("../...")
  const requireRegex = /require\(['"](\.[^'"]+)['"]\)/g;
  
  const newContent = content.replace(requireRegex, (match, requirePath) => {
    // If it already ends with .js or .json, ignore
    if (requirePath.endsWith('.js') || requirePath.endsWith('.json')) {
      return match;
    }
    
    // Resolve the path relative to the current file
    const resolvedPath = path.resolve(path.dirname(filePath), requirePath);
    
    // Check if it's a directory (then it resolves to index.js) or a file (needs .js)
    try {
      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        // If it's a directory, adding index.js might not be strictly necessary, but let's check
        // Often require("./routes") -> require("./routes/index.js") but we don't have many index.js.
        // Actually, let's leave directories alone or append /index.js if needed.
        // Wait, most of these in the screenshot are actual files like `./modules/auth/routes/auth.routes`
        return match; 
      }
    } catch (e) {
      // It likely doesn't exist without extension, so it's a file missing .js
      return `require("${requirePath}.js")`;
    }
    
    return match;
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'src'), updateRequires);
console.log('Done.');
