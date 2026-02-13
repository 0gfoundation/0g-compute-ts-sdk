#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

function renameCjsToJs(dirs) {
  // Step 1: Update imports in all .cjs and .js files
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;

    walkDir(dir, (filePath) => {
      if (filePath.endsWith('.cjs') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace .cjs' with .js'
        content = content.replace(/\.cjs'/g, ".js'");
        // Replace .cjs" with .js"
        content = content.replace(/\.cjs"/g, '.js"');

        fs.writeFileSync(filePath, content, 'utf8');
      }
    });
  });

  // Step 2: Rename all .cjs files to .js and .cjs.map to .js.map
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;

    const filesToRename = [];
    walkDir(dir, (filePath) => {
      if (filePath.endsWith('.cjs') || filePath.endsWith('.cjs.map')) {
        filesToRename.push(filePath);
      }
    });

    // Rename files
    filesToRename.forEach(oldPath => {
      let newPath;
      if (oldPath.endsWith('.cjs.map')) {
        newPath = oldPath.replace(/\.cjs\.map$/, '.js.map');
      } else {
        newPath = oldPath.replace(/\.cjs$/, '.js');
      }

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${oldPath} -> ${newPath}`);
      }
    });
  });
}

// Run the rename process
renameCjsToJs(['lib.commonjs', 'cli.commonjs']);

console.log('✓ Successfully renamed all .cjs files to .js');
