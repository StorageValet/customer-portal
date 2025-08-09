#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function countLinesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").length;
  } catch (error) {
    return 0;
  }
}

function analyzeDirectory(dirPath, extensions = [".ts", ".tsx", ".js", ".jsx"]) {
  const results = {
    files: [],
    totalLines: 0,
    totalFiles: 0,
    byExtension: {},
  };

  function walkDir(currentPath) {
    if (
      currentPath.includes("node_modules") ||
      currentPath.includes("dist") ||
      currentPath.includes(".git") ||
      currentPath.includes(".next")
    ) {
      return;
    }

    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            const lines = countLinesInFile(fullPath);
            const relativePath = path.relative(dirPath, fullPath);

            results.files.push({
              path: relativePath,
              lines: lines,
              extension: ext,
            });

            results.totalLines += lines;
            results.totalFiles += 1;

            if (!results.byExtension[ext]) {
              results.byExtension[ext] = { files: 0, lines: 0 };
            }
            results.byExtension[ext].files += 1;
            results.byExtension[ext].lines += lines;
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  walkDir(dirPath);
  return results;
}

// Analyze the current directory
const projectPath = process.cwd();
const analysis = analyzeDirectory(projectPath);

console.log("📊 CODEBASE ANALYSIS REPORT");
console.log("=" * 50);
console.log(`Total Files: ${analysis.totalFiles}`);
console.log(`Total Lines: ${analysis.totalLines.toLocaleString()}`);
console.log("");

console.log("📁 BY FILE TYPE:");
Object.entries(analysis.byExtension).forEach(([ext, data]) => {
  console.log(`${ext}: ${data.files} files, ${data.lines.toLocaleString()} lines`);
});
console.log("");

console.log("📋 LARGEST FILES:");
const largestFiles = analysis.files.sort((a, b) => b.lines - a.lines).slice(0, 15);

largestFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file.path} - ${file.lines} lines`);
});

console.log("");
console.log("🔍 BREAKDOWN BY AREA:");

const areas = {
  Server: analysis.files.filter((f) => f.path.startsWith("server/")),
  "Client Pages": analysis.files.filter((f) => f.path.startsWith("client/src/pages/")),
  "Client Components": analysis.files.filter((f) => f.path.startsWith("client/src/components/")),
  "Shared/Utils": analysis.files.filter(
    (f) => f.path.startsWith("shared/") || f.path.startsWith("client/src/lib/")
  ),
  "Root/Config": analysis.files.filter((f) => !f.path.includes("/")),
};

Object.entries(areas).forEach(([area, files]) => {
  const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
  console.log(`${area}: ${files.length} files, ${totalLines.toLocaleString()} lines`);
});

// Look for potential cleanup opportunities
console.log("");
console.log("🧹 POTENTIAL CLEANUP OPPORTUNITIES:");

const oldFiles = analysis.files.filter(
  (f) =>
    f.path.includes("_old") ||
    f.path.includes("-old") ||
    f.path.includes("test-") ||
    f.path.includes("backup")
);

if (oldFiles.length > 0) {
  console.log(`Found ${oldFiles.length} files that might be legacy/test files:`);
  oldFiles.forEach((f) => console.log(`  - ${f.path} (${f.lines} lines)`));
} else {
  console.log("No obvious legacy files found");
}

const duplicateNames = {};
analysis.files.forEach((f) => {
  const basename = path.basename(f.path, path.extname(f.path));
  if (!duplicateNames[basename]) duplicateNames[basename] = [];
  duplicateNames[basename].push(f);
});

const actualDuplicates = Object.entries(duplicateNames).filter(([name, files]) => files.length > 1);
if (actualDuplicates.length > 0) {
  console.log("");
  console.log("Potential duplicate file names:");
  actualDuplicates.forEach(([name, files]) => {
    console.log(`  ${name}:`);
    files.forEach((f) => console.log(`    - ${f.path} (${f.lines} lines)`));
  });
}
