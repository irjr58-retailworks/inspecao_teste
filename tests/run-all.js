#!/usr/bin/env node
"use strict";
// Roda toda a suíte adversarial em sequência e imprime um resumo no final.
// Uso: node tests/run-all.js  (a partir da raiz do projeto, ou de dentro de tests/ também funciona)

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter((f) => /^test\d+.*\.js$/.test(f))
  .sort((a, b) => {
    const na = parseInt(a.match(/^test(\d+)/)[1], 10);
    const nb = parseInt(b.match(/^test(\d+)/)[1], 10);
    return na - nb || a.localeCompare(b);
  });

console.log(`Executando ${files.length} testes...\n`);
const results = [];
for (const f of files) {
  process.stdout.write(`→ ${f} ... `);
  try {
    execFileSync("node", [path.join(dir, f)], { stdio: "pipe" });
    console.log("OK");
    results.push({ file: f, ok: true });
  } catch (err) {
    console.log("FALHOU");
    results.push({ file: f, ok: false, output: err.stdout ? err.stdout.toString() : String(err) });
  }
}

const falhas = results.filter((r) => !r.ok);
console.log(`\n=== RESUMO: ${results.length - falhas.length}/${results.length} testes OK ===`);
if (falhas.length) {
  console.log("\nFalharam:");
  falhas.forEach((f) => {
    console.log(`\n--- ${f.file} ---`);
    console.log(f.output.split("\n").slice(-25).join("\n"));
  });
  process.exit(1);
}
