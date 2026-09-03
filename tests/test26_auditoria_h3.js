"use strict";
// Hipótese 3: Lux contaminando anomalias Visual / Relatório / CSV / BOM. Provado ponta a ponta.
const assert = require("assert");
const { loadApp } = require("./load-app");

async function main() {
  const A = loadApp("../app.js");

  console.log("=== HIPÓTESE 3a: Lux Método B (item 'lux' no montante) ===");
  const e = {
    id: "e1", codigo: "E01", setor: "S1", tipoEstrutura: "T1", lado: "A", fabricante: "F1",
    resolvido: false, setupComplete: true, visualFinalizada: true,
    itensEstrutura: [{ id: "iluminacao", ocorrencias: [] }],
    montantes: [{
      id: "m1", numero: 1, fabricante: "F1",
      itens: [
        { id: "prumo", ocorrencias: [] },
        { id: "lux", codigo: "9.45", tipo: "medicao", peca: "Aferição de iluminação no montante", unidade: "lux", min: 200,
          status: "problema", valor: "80", ocorrencias: [{ id: "ocl", status: "problema", valor: "80" }] },
        { id: "chumbador", ocorrencias: [] },
      ]
    }]
  };
  const v = { id: "v1", lojaCd: "CD", local: "L", estruturas: [e] };

  // 1. montanteProblemEntries -- contamina?
  const entries = A.montanteProblemEntries(e);
  const luxEntry = entries.find(({item}) => item.id === "lux");
  console.log("Item 'lux' com status problema aparece em montanteProblemEntries()?", Boolean(luxEntry));

  // 2. Relatório de Anomalias / CSV
  const rows = A.buildAnomaliaRows(v);
  const luxRow = rows.find(r => r.itemId === "lux");
  console.log("Linha de 'lux' aparece no Relatório de Anomalias / CSV (buildAnomaliaRows)?", Boolean(luxRow));
  if (luxRow) console.log("   conteúdo da linha:", JSON.stringify(luxRow));

  // 3. BOM / Lista de Peças
  const parts = A.buildPartsForVistoria(v);
  const luxPart = parts.find(p => p.peca && p.peca.includes("iluminação"));
  console.log("Lux Método B aparece na Lista de Peças / BOM (buildPartsForVistoria)?", Boolean(luxPart));
  if (luxPart) console.log("   peça registrada:", JSON.stringify({peca: luxPart.peca, qtd: luxPart.qtd, refs: [...luxPart.refs]}));

  const reproduzido3a = Boolean(luxEntry) && Boolean(luxRow) && Boolean(luxPart);
  console.log("\n>>> HIPÓTESE 3a (Método B) REPRODUZIDA?", reproduzido3a ? "SIM" : "NÃO");

  console.log("\n=== HIPÓTESE 3b: Lux Método A (item 'iluminacao' na estrutura) ===");
  const e2 = {
    id: "e2", codigo: "E02", setor: "S1", tipoEstrutura: "T1", lado: "A", fabricante: "F1",
    resolvido: false, setupComplete: true, visualFinalizada: true,
    itensEstrutura: [{ id: "iluminacao", codigo: "9.45", tipo: "medicao", peca: "Aferição de iluminação nos corredores", unidade: "lux", min: 200,
      ocorrencias: [{ id: "oc-a", posicao: "inicio", status: "problema", valor: "80", montanteRef: "Início" }] }],
    montantes: []
  };
  const v2 = { id: "v2", lojaCd: "CD", local: "L", estruturas: [e2] };

  const estEntries = A.estruturaProblemOccurrences(e2);
  console.log("Ocorrência 'iluminacao' com status problema aparece em estruturaProblemOccurrences()?", estEntries.length > 0);
  const rows2 = A.buildAnomaliaRows(v2);
  const luxRow2 = rows2.find(r => r.estItemId === "iluminacao");
  console.log("Linha de 'iluminacao' (Método A) aparece no Relatório de Anomalias / CSV?", Boolean(luxRow2));
  const parts2 = A.buildPartsForVistoria(v2);
  console.log("Lux Método A aparece na Lista de Peças / BOM (deveria ser filtrado por tipo==='medicao')?", parts2.length > 0);
  console.log("PASS -- Método A é protegido do BOM pelo filtro tipo==='medicao' (correto, diferente do Método B)?", parts2.length === 0);

  console.log("\n>>> HIPÓTESE 3b (Método A): relatório contaminado?", Boolean(luxRow2) ? "SIM" : "NÃO", "| BOM contaminado?", parts2.length > 0 ? "SIM" : "NÃO (protegido)");
}
main().catch((e) => { console.error("ERRO NA AUDITORIA:", e); process.exit(1); });
