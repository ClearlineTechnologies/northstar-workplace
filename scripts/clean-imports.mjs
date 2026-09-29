import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".");
const files = parsed.fileNames;
const host = {
  getScriptFileNames: () => files,
  getScriptVersion: () => "0",
  getScriptSnapshot: (name) => {
    if (fs.existsSync(name))
      return ts.ScriptSnapshot.fromString(fs.readFileSync(name, "utf8"));
  },
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
};
const service = ts.createLanguageService(host);
for (const file of files.filter(
  (f) => f.startsWith("src/") || f.startsWith("scripts/"),
)) {
  for (const change of service.organizeImports(
    { type: "file", fileName: path.resolve(file) },
    {},
    {},
  )) {
    let source = fs.readFileSync(change.fileName, "utf8");
    for (const edit of [...change.textChanges].sort(
      (a, b) => b.span.start - a.span.start,
    ))
      source =
        source.slice(0, edit.span.start) +
        edit.newText +
        source.slice(edit.span.start + edit.span.length);
    fs.writeFileSync(change.fileName, source);
  }
}
