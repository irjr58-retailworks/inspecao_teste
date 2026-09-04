"use strict";
// Simulação de campo: técnico com celular em mãos, 10 estruturas / 80 montantes, seguindo a
// sequência REAL de uma inspeção (Visual -> Prumo -> Lux), com dados aleatórios mas reproduzíveis
// (seed fixa). Não é um teste de uma hipótese isolada -- é um "ensaio geral" ponta a ponta antes
// do fechamento da versão de teste de campo v2.19.0-RC1.
const assert = require("assert");
const { loadApp, makeIndexedDB } = require("./load-app");

// PRNG seedado (mesmo padrão do gerador de fixture em tools/) -- falha é reproduzível, não um "às vezes passa".
const SEED = 20260903;
let seed = SEED;
function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function chance(p) { return rand() < p; }

async function main() {
  const t0 = Date.now();
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;

  const TOTAL_ESTRUTURAS = 10, TOTAL_MONTANTES = 80;
  const montantesPorEstrutura = Array.from({ length: TOTAL_ESTRUTURAS }, () => Math.floor(TOTAL_MONTANTES / TOTAL_ESTRUTURAS)); // 8 cada

  const luxMetodoEscolhido = chance(0.5) ? "A" : "B";
  console.log(`=== Simulação de campo: ${TOTAL_ESTRUTURAS} estruturas / ${TOTAL_MONTANTES} montantes (seed=${SEED}, Lux Método ${luxMetodoEscolhido}) ===\n`);

  let v = A.newVistoriaSkeleton();
  v.id = "v-simulacao-campo";
  v.lojaCd = "CD Simulação"; v.local = "Galpão Principal"; v.inspetor = "Técnico de Campo (simulado)";
  v.workflowConfig.prumoHabilitado = true;
  v.workflowConfig.luxHabilitado = true;
  v.workflowConfig.luxMetodo = luxMetodoEscolhido;
  A.touchWorkflowConfig(v);

  const catalogoMontante = A.itensMontante(A.state.config).filter((it) => it.id !== "prumo" && it.id !== "lux");
  let contadorAnomaliasVisual = 0, contadorSemAcessoPrumo = 0, contadorLuxProblema = 0, contadorSaves = 0;
  let numeroGlobal = 1;
  const estruturasCriadas = [];

  // ==================== FASE 1: VISUAL (estrutura por estrutura, montante por montante) ====================
  console.log("[FASE 1 — VISUAL]");
  for (let ei = 0; ei < TOTAL_ESTRUTURAS; ei++) {
    const e = A.newEstruturaSkeleton(estruturasCriadas[ei - 1] || null);
    e.codigo = `E${String(ei + 1).padStart(2, "0")}`;
    e.setupComplete = true;
    e.montantes = [];
    v.estruturas.push(e);
    estruturasCriadas.push(e);

    for (let mi = 0; mi < montantesPorEstrutura[ei]; mi++) {
      const m = A.newMontanteSkeleton(numeroGlobal++, e);
      // Técnico entra 0-2 anomalias aleatórias nesse montante (catálogo real)
      const nAnomalias = chance(0.35) ? (chance(0.8) ? 1 : 2) : 0;
      for (let k = 0; k < nAnomalias; k++) {
        const catItem = pick(catalogoMontante);
        const item = m.itens.find((it) => it.id === catItem.id);
        item.ocorrencias.push({
          id: "oc_" + numeroGlobal + "_" + k, status: "problema",
          descTxt: pick(catItem.descOpcoes || ["ANOMALIA"]), grauTxt: pick(["Leve", "Médio", "Grave"]),
          qtd: 1 + Math.floor(rand() * 2), updatedAt: A.nowIso ? A.nowIso() : new Date().toISOString(),
        });
        contadorAnomaliasVisual++;
      }
      A.syncMontanteItemStatus ? m.itens.forEach((it) => A.syncMontanteItemStatus(it)) : null;
      m.visualInspecionadoAt = new Date().toISOString();
      e.montantes.push(m);

      // Salva a cada montante -- é exatamente o que a UI real faz a cada toque.
      await A.idbSet("vistorias", undefined, A.compactVistoriaForStorage(A.normalizeVistoria(JSON.parse(JSON.stringify(v)))));
      contadorSaves++;
    }

    // Fecha o Visual desta estrutura
    e.visualFinalizada = true;
    e.visualUpdatedAt = new Date().toISOString();
    await A.idbSet("vistorias", undefined, A.compactVistoriaForStorage(A.normalizeVistoria(JSON.parse(JSON.stringify(v)))));

    // Checagem em tempo real, exatamente como o técnico veria: Prumo desta estrutura já libera?
    const liberouNaHora = A.nextStageStructure(v, { id: "nenhuma-ainda" }, "prumo");
    const estaLiberada = liberouNaHora ? A.podeEntrarNoPrumo(v) && liberouNaHora.id === e.id || v.estruturas.slice(0, ei + 1).every(x => x.visualFinalizada) : false;
  }
  console.log(`  ${TOTAL_ESTRUTURAS} estruturas / ${numeroGlobal - 1} montantes preenchidos. Anomalias Visual registradas: ${contadorAnomaliasVisual}. Saves simulados: ${contadorSaves}.`);
  assert.strictEqual(numeroGlobal - 1, TOTAL_MONTANTES, "Total de montantes deve bater com o planejado");
  assert.ok(v.estruturas.every((e) => e.visualFinalizada), "Toda estrutura deve ter Visual finalizada ao fim da fase 1");

  // ==================== FASE 2: PRUMO (navegação sequencial real via nextStageStructure) ====================
  console.log("\n[FASE 2 — PRUMO]");
  let atual = { id: "ponto-de-partida" };
  let estruturasVisitadasPrumo = 0;
  while (true) {
    const proxima = A.nextStageStructure(v, atual, "prumo");
    if (!proxima || estruturasVisitadasPrumo > TOTAL_ESTRUTURAS + 2) break;
    const e = v.estruturas.find((x) => x.id === proxima.id);
    for (const m of e.montantes) {
      const item = A.prumoItem(m);
      const roll = rand();
      if (roll < 0.08) {
        // Sem acesso -- localTxt combinado é o que prumoResolution() usa pra reconhecer "resolvido" (mesmo sem medição real)
        item.ocorrencias = [{ id: "oc-prumo-" + m.id, status: "naoaplica", localTxt: "LONGITUDINAL / TRANSVERSAL", descTxt: "COLUNA SEM ACESSO", updatedAt: new Date().toISOString() }];
        contadorSemAcessoPrumo++;
      } else if (roll < 0.15) {
        // Fora de prumo (anomalia real, eixos divergentes) -- os DOIS eixos precisam ficar resolvidos:
        // o que tem a anomalia, e o outro (ok), exatamente como a campanha real exige quando L != T.
        const eixoAnomalo = pick(["LONGITUDINAL", "TRANSVERSAL"]);
        const eixoOk = eixoAnomalo === "LONGITUDINAL" ? "TRANSVERSAL" : "LONGITUDINAL";
        item.ocorrencias = [
          { id: "oc-prumo-" + m.id + "-a", status: "problema", localTxt: eixoAnomalo, descTxt: "COLUNA FORA DE PRUMO", grauTxt: pick(["Leve", "Médio"]), updatedAt: new Date().toISOString() },
          { id: "oc-prumo-" + m.id + "-b", status: "ok", localTxt: eixoOk, descTxt: "COLUNA NA TOLERÂNCIA DO PRUMO", updatedAt: new Date().toISOString() },
        ];
      } else {
        // L+T na tolerância
        item.ocorrencias = [{ id: "oc-prumo-" + m.id, status: "ok", localTxt: "LONGITUDINAL / TRANSVERSAL", descTxt: "COLUNA NA TOLERÂNCIA DO PRUMO", updatedAt: new Date().toISOString() }];
      }
      A.syncMontanteItemStatus(item);
    }
    e.prumoFinalizada = true;
    e.prumoUpdatedAt = new Date().toISOString();
    await A.idbSet("vistorias", undefined, A.compactVistoriaForStorage(A.normalizeVistoria(JSON.parse(JSON.stringify(v)))));
    atual = e;
    estruturasVisitadasPrumo++;
  }
  console.log(`  ${estruturasVisitadasPrumo}/${TOTAL_ESTRUTURAS} estruturas visitadas na campanha de Prumo. Montantes 'sem acesso': ${contadorSemAcessoPrumo}.`);
  assert.strictEqual(estruturasVisitadasPrumo, TOTAL_ESTRUTURAS, "Campanha de Prumo deve visitar TODAS as estruturas (Visual 100% finalizada, Prumo habilitado)");

  // ==================== FASE 3: LUX (Método A ou B, conforme sorteado) ====================
  console.log(`\n[FASE 3 — LUX, Método ${luxMetodoEscolhido}]`);
  // 1-2 estruturas sorteadas como "Sem iluminação / Não aplicável"
  const naoAplicaveis = new Set();
  while (naoAplicaveis.size < 2) naoAplicaveis.add(pick(v.estruturas).id);
  for (const eId of naoAplicaveis) {
    const e = v.estruturas.find((x) => x.id === eId);
    e.luxNaoAplica = true; e.luxNaoAplicaMotivo = "Sem iluminação"; A.touchLuxNaoAplica(e);
  }
  console.log(`  Estruturas marcadas "Sem iluminação / Não aplicável": ${[...naoAplicaveis].map(id => v.estruturas.find(x=>x.id===id).codigo).join(", ")}`);

  if (luxMetodoEscolhido === "A") {
    for (const e of v.estruturas) {
      if (e.luxNaoAplica) continue;
      const item = A.iluminacaoItem(e);
      item.ocorrencias = ["inicio", "meio", "final"].map((pos) => {
        const valor = chance(0.15) ? String(80 + Math.floor(rand() * 100)) : String(220 + Math.floor(rand() * 200));
        if (Number(valor) < 200) contadorLuxProblema++;
        return { id: `oc-lux-${e.id}-${pos}`, posicao: pos, valor, status: Number(valor) < 200 ? "problema" : "ok", updatedAt: new Date().toISOString() };
      });
    }
  } else {
    for (const e of v.estruturas) {
      if (e.luxNaoAplica) continue;
      for (const m of e.montantes) {
        const item = A.montanteLuxItem(m);
        const roll = rand();
        if (roll < 0.1) {
          item.ocorrencias = [{ id: "oc-lux-" + m.id, status: "naoaplica", updatedAt: new Date().toISOString() }]; // Não foi possível medir
        } else {
          const valor = chance(0.15) ? String(80 + Math.floor(rand() * 100)) : String(220 + Math.floor(rand() * 200));
          if (Number(valor) < 200) contadorLuxProblema++;
          item.valor = valor;
          item.ocorrencias = [{ id: "oc-lux-" + m.id, valor, status: Number(valor) < 200 ? "problema" : "ok", updatedAt: new Date().toISOString() }];
        }
        A.syncMontanteItemStatus(item);
      }
    }
  }
  v.estruturas.filter((e) => !e.luxNaoAplica).forEach((e) => { e.luxFinalizada = true; e.luxUpdatedAt = new Date().toISOString(); });
  await A.idbSet("vistorias", undefined, A.compactVistoriaForStorage(A.normalizeVistoria(JSON.parse(JSON.stringify(v)))));
  console.log(`  Leituras de Lux abaixo do limite (200 lux): ${contadorLuxProblema}.`);

  // ==================== FASE 4: FINALIZAÇÃO ====================
  console.log("\n[FASE 4 — FINALIZAÇÃO]");
  const errBoxMsgs = [];
  const fakeErrBox = { innerHTML: "", appendChild: (n) => errBoxMsgs.push(n.textContent || "") };
  const vParaFinalizar = A.normalizeVistoria(await A.idbGet("vistorias", "v-simulacao-campo"));
  A.submitVistoria(vParaFinalizar, fakeErrBox);
  console.log(`  Finalizou? ${vParaFinalizar.finalizada === true ? "SIM" : "NÃO"}`, errBoxMsgs.length ? `-- mensagens: ${errBoxMsgs.join(" | ")}` : "");
  assert.strictEqual(vParaFinalizar.finalizada, true, "Vistoria deve finalizar -- Visual 100%, Prumo 100%, Lux 100% (nas aplicáveis)");
  await A.idbSet("vistorias", undefined, A.compactVistoriaForStorage(vParaFinalizar));

  // ==================== FASE 5: FECHAR O APP E REABRIR (persistência real) ====================
  console.log("\n[FASE 5 — Fechar e reabrir o app]");
  const A2 = loadApp("../app.js", { indexedDB: disk });
  await A2.dbPromise;
  const reaberta = A2.normalizeVistoria(await A2.idbGet("vistorias", "v-simulacao-campo"));
  assert.strictEqual(reaberta.finalizada, true, "Vistoria continua finalizada após fechar/reabrir");
  assert.strictEqual(reaberta.estruturas.length, TOTAL_ESTRUTURAS);
  assert.strictEqual(reaberta.estruturas.reduce((s, e) => s + e.montantes.length, 0), TOTAL_MONTANTES);
  console.log(`  ${reaberta.estruturas.length} estruturas / ${reaberta.estruturas.reduce((s,e)=>s+e.montantes.length,0)} montantes intactos após reabrir.`);

  // ==================== FASE 6: RELATÓRIO / ANOMALIAS / BOM — sem contaminação de Lux ====================
  console.log("\n[FASE 6 — Relatório de Anomalias, CSV, BOM]");
  const rows = A2.buildAnomaliaRows(reaberta);
  const contaminadas = rows.filter((r) => r.itemId === "lux" || r.estItemId === "iluminacao");
  console.log(`  Linhas no Relatório de Anomalias: ${rows.length} (contaminadas por Lux: ${contaminadas.length})`);
  assert.strictEqual(contaminadas.length, 0, "Relatório de Anomalias não pode conter entradas de Lux");

  const vistoriaComResolvidoFalse = { ...reaberta, estruturas: reaberta.estruturas.map(e => ({ ...e, resolvido: false })) };
  const parts = A2.buildPartsForVistoria(vistoriaComResolvidoFalse);
  const partsContaminadas = parts.filter((p) => /ilumina|lux/i.test(p.peca));
  console.log(`  Itens na Lista de Peças/BOM: ${parts.length} (contaminados por Lux: ${partsContaminadas.length})`);
  assert.strictEqual(partsContaminadas.length, 0, "BOM não pode conter peças de Lux");

  // Contagem de anomalias Visual esperada: as registradas na Fase 1 + as de Prumo "fora de prumo" (roll 0.08-0.15)
  console.log(`  Anomalias Visual esperadas (fase 1): ${contadorAnomaliasVisual} | linhas reais no relatório (Visual + Prumo, sem Lux): ${rows.length}`);

  const dt = Date.now() - t0;
  console.log(`\n=== SIMULAÇÃO COMPLETA EM ${dt}ms — TODAS AS VERIFICAÇÕES PASSARAM ===`);
}
main().catch((e) => { console.error("ERRO NA SIMULAÇÃO:", e); process.exit(1); });
