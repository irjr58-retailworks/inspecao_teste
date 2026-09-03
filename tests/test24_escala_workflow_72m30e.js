"use strict";
// Escala: 72 montantes / 30 estruturas, Lux Método B habilitado, mistura de estruturas com Visual
// aberta/fechada, confirmando que a fila de Prumo ignora as corretas mesmo nessa escala.
const { loadApp } = require("./load-app");

function montante(id, numero) {
  return { id, numero, itens: [{ id: "prumo", ocorrencias: [] }, { id: "lux", ocorrencias: [] }] };
}

async function main() {
  const A = loadApp("../app.js");
  const v = A.newVistoriaSkeleton();
  v.workflowConfig.prumoHabilitado = true;
  v.workflowConfig.luxHabilitado = true;
  v.workflowConfig.luxMetodo = "B";

  const TOTAL_ESTRUTURAS = 30, TOTAL_MONTANTES = 72;
  const distrib = Array.from({ length: TOTAL_ESTRUTURAS }, (_, i) => (i < 12 ? 3 : 2));
  let numeroGlobal = 1;
  const estruturas = [];
  for (let i = 0; i < TOTAL_ESTRUTURAS; i++) {
    const montantes = Array.from({ length: distrib[i] }, () => montante(`m${numeroGlobal}`, numeroGlobal++));
    // 1 a cada 5 estruturas fica com Visual propositalmente aberta (não deve entrar na fila de Prumo/Lux)
    const visualAberta = i % 5 === 0;
    estruturas.push({ id: `e${i}`, codigo: `E${i+1}`, setupComplete: true, visualFinalizada: !visualAberta,
      itensEstrutura: [{ id: "iluminacao", ocorrencias: [] }], montantes });
  }
  v.estruturas = estruturas;

  const t0 = Date.now();
  const compactada = A.compactVistoriaForStorage(A.normalizeVistoria(JSON.parse(JSON.stringify(v))));
  const tCompact = Date.now() - t0;

  const t1 = Date.now();
  const pend = A.countPendingInspection(v);
  const tPend = Date.now() - t1;

  const abertas = estruturas.filter((e, i) => i % 5 === 0);
  const fechadas = estruturas.filter((e, i) => i % 5 !== 0);
  console.log(`Estruturas: ${estruturas.length} (${fechadas.length} com Visual fechada, ${abertas.length} abertas)`);
  console.log(`Montantes totais: ${estruturas.reduce((s,e)=>s+e.montantes.length,0)} (esperado ${TOTAL_MONTANTES})`);
  console.log(`compactVistoriaForStorage + normalizeVistoria: ${tCompact}ms`);
  console.log(`countPendingInspection: ${tPend}ms`);

  // Navegação de Prumo a partir da primeira estrutura fechada -- nunca deve parar numa estrutura aberta
  let atual = fechadas[0];
  let visitas = 0;
  const visitadas = new Set([atual.id]);
  while (visitas < fechadas.length + 5) {
    const prox = A.nextStageStructure(v, atual, "prumo");
    if (!prox || visitadas.has(prox.id)) break;
    if (abertas.some(e => e.id === prox.id)) { console.log("!!! FALHA: navegação ofereceu uma estrutura com Visual aberta:", prox.id); process.exit(1); }
    visitadas.add(prox.id);
    atual = prox;
    visitas++;
  }
  console.log(`Navegação de Prumo visitou ${visitadas.size} estruturas, todas com Visual fechada (esperado: ${fechadas.length})`);
  console.log("PASS (nenhuma estrutura aberta foi oferecida, escala 72m/30e)?", visitadas.size === fechadas.length && tCompact < 500 && tPend < 200);
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
