import fs from "fs";
import path from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (/\.(ts|tsx)$/.test(file)) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

export function compactCode(content: string): string {
  let prev = "";
  let current = content;

  for (let iter = 0; iter < 12; iter++) {
    prev = current;

    // Gộp export const X = { ... } as const;
    current = current.replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=\s*\{\s*\n\s*([^;{}]+)\s*\n\s*\}\s*as\s+const;/g, (match, name, body) => {
      const oneLine = body.split("\n").map((l: string) => l.trim()).filter(Boolean).join(" ");
      return `export const ${name} = { ${oneLine} } as const;`;
    });

    // Gộp const X = { ... } as const;
    current = current.replace(/const\s+([A-Za-z0-9_]+)\s*=\s*\{\s*\n\s*([^;{}]+)\s*\n\s*\}\s*as\s+const;/g, (match, name, body) => {
      const oneLine = body.split("\n").map((l: string) => l.trim()).filter(Boolean).join(" ");
      return `const ${name} = { ${oneLine} } as const;`;
    });

    // Gộp return { ... };
    current = current.replace(/return\s*\{\s*\n\s*([^{}]+)\s*\n\s*\};/g, (match, body) => {
      const oneLine = body.split("\n").map((l: string) => l.trim()).filter(Boolean).join(" ");
      return `return { ${oneLine} };`;
    });

    // Gộp const X = { ... };
    current = current.replace(/const\s+([A-Za-z0-9_]+)\s*=\s*\{\s*\n\s*([^{}]+)\s*\n\s*\};/g, (match, name, body) => {
      const oneLine = body.split("\n").map((l: string) => l.trim()).filter(Boolean).join(" ");
      return `const ${name} = { ${oneLine} };`;
    });

    // Gộp short arrow functions: (args) => {\n return expr;\n} thành (args) => expr;
    current = current.replace(/=>\s*\{\s*\n\s*return\s+([^{};\n]+;)\s*\n\s*\}/g, "=> $1");

    // Gộp if (cond) {\n  stmt;\n} thành if (cond) stmt;
    current = current.replace(/if\s*\(([^()]+)\)\s*\{\s*\n\s*([^{};\n]+;)\s*\n\s*\}/g, "if ($1) $2");

    // Gộp multi-line array literals
    current = current.replace(/\[\s*\n\s*([^;\n\[\]]+(?:,\s*[^;\n\[\]]+)*,?)\s*\n\s*\]/g, "[ $1 ]");

    // Gộp short interface
    current = current.replace(/interface\s+([A-Za-z0-9_]+(?:\s*<[^>]+>)?)\s*\{\s*\n\s*([^;{}]+;\s*(?:[^;{}]+;\s*)*)\s*\}/g, (match, name, body) => {
      const oneLine = body.split("\n").map((l: string) => l.trim()).filter(Boolean).join(" ");
      return `interface ${name} { ${oneLine} }`;
    });

    // Gộp short type object
    current = current.replace(/type\s+([A-Za-z0-9_]+(?:\s*<[^>]+>)?)\s*=\s*\{\s*\n\s*([^;{}]+;\s*(?:[^;{}]+;\s*)*)\s*\};/g, (match, name, body) => {
      const oneLine = body.split("\n").map((l: string) => l.trim()).filter(Boolean).join(" ");
      return `type ${name} = { ${oneLine} };`;
    });

    if (prev === current) break;
  }

  return current;
}

export function formatDirectory(dirPath: string) {
  const files = getAllFiles(dirPath);
  let changedCount = 0;
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      const compacted = compactCode(raw);
      if (compacted !== raw) {
        fs.writeFileSync(file, compacted, "utf8");
        changedCount++;
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
  console.log(`Compacted ${changedCount} / ${files.length} files in ${dirPath}.`);
}

const targetDir = process.argv[2] || "src";
formatDirectory(targetDir);
