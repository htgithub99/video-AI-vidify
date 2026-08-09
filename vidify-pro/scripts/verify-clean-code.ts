import fs from "fs";
import path from "path";

const SOURCE_DIRECTORY = "src";
const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;
const COMMENT_PATTERN = /TODO|FIXME|\/\*\*|(^|[^\S\r\n])\/\//m;
const DIRECT_CONSOLE_PATTERN = /console\.(log|warn|error|info|debug)/;
const LOGGER_FILE = path.normalize("src/utils/logger.ts");

const getSourceFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return getSourceFiles(entryPath);
    return SOURCE_FILE_PATTERN.test(entry.name) ? [entryPath] : [];
  });

const assertNoViolations = (files: string[]): void => {
  const violations = files.flatMap((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const normalizedPath = path.normalize(filePath);
    const reasons = [
      ...(COMMENT_PATTERN.test(source) ? ["comment"] : []),
      ...(normalizedPath !== LOGGER_FILE && DIRECT_CONSOLE_PATTERN.test(source)
        ? ["direct-console"]
        : []),
    ];
    return reasons.map((reason) => `${normalizedPath}: ${reason}`);
  });
  if (violations.length > 0)
    throw new Error(`Clean-code verification failed: ${violations.join(", ")}`);
};

assertNoViolations(getSourceFiles(SOURCE_DIRECTORY));
process.stdout.write("Clean-code source assertions passed\n");
