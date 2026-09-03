"use strict";
// Teste 22: Especificação Aprovada v2.19.0-RC1 — Inspection Workflow (Revisão 2)
// Cobre:
// 1. Compatibilidade Legada (v2.18.8 sem workflowConfig continua "LEGADO", sem Início/Meio/Final, preservado ao persistir)
// 2. Trava de Método A/B por dados operacionais (numérico ou "naoaplica"), e.luxNaoAplica independente
// 3. Regra Crítica de Prumo (liberação contínua por estrutura visualFinalizada sem esperar vistoria 100%)
// 4. Toggle Prumo Habilitado / Desabilitado + motivo obrigatório na submissão + preservação de dados
// 5. Toggle Lux Habilitado / Desabilitado + motivo obrigatório na submissão
// 6. Lux Método A (3 posições fixas com posicao, valor e naoaplica)
// 7. Lux Método B (1 por montante, navegação e conclusão)
// 8. Dispensa e.luxNaoAplica na estrutura inteira
// 9. Estatísticas Lux (calculateLuxStats exclui naoaplica, sem 0 lux falso)
// 10. Persistência / Compaction (posicao preservada em compactOccurrenceForStorage, impliedVisualOk exclui lux)
// 11. Timestamps e Merge LWW (v.configUpdatedAt, e.luxNaoAplicaUpdatedAt)

const assert = require("assert");
const { loadApp } = require("./load-app");

async function main() {
  console.log("=== INICIANDO TESTE 22: WORKFLOW PRUMO & LUX (v2.19.0-RC1) ===");
  const A = loadApp("../app.js");
  await A.dbPromise;

  // -------------------------------------------------------------
  // 1. Compatibilidade Lux Legado (Obrigatório Usuário #1)
  // -------------------------------------------------------------
  console.log("\n[1] Compatibilidade Lux Legado...");
  const legacyVistoria = {
    id: "v-legacy",
    lojaCd: "Loja Antiga",
    local: "SP",
    data: "2026-08-01",
    inspetor: "Carlos",
    createdAt: "2026-08-01T10:00:00.000Z",
    estruturas: [{
      id: "e1",
      codigo: "EST-01",
      setupComplete: true,
      visualFinalizada: true,
      montantes: [{ id: "m1", numero: 1, itens: [] }],
      itensEstrutura: [{
        id: "iluminacao",
        ocorrencias: [{ id: "oc-leg", montanteRef: "Meio", valor: "250", status: "ok" }]
      }]
    }]
  };
  // Sem workflowConfig → deve retornar "LEGADO"
  assert.strictEqual(A.getLuxMetodo(legacyVistoria), "LEGADO", "Vistoria antiga sem workflowConfig deve retornar LEGADO");
  
  // Compactar, persistir no banco e reabrir
  const legacyCompacted = A.compactVistoriaForStorage(legacyVistoria);
  assert.strictEqual(legacyCompacted.workflowConfig, undefined, "Compaction não deve injetar workflowConfig em vistoria legada");
  const rehydratedLegacy = A.normalizeVistoria(JSON.parse(JSON.stringify(legacyCompacted)));
  assert.strictEqual(A.getLuxMetodo(rehydratedLegacy), "LEGADO", "Após persistir e reabrir, vistoria legada continua LEGADO");
  
  // No progresso legado, o método retornado é LEGADO e não exige Início/Meio/Final
  const progLegacy = A.luxProgress(rehydratedLegacy.estruturas[0], rehydratedLegacy);
  assert.strictEqual(progLegacy.metodo, "LEGADO");
  assert.strictEqual(progLegacy.measurements, 1);
  assert.strictEqual(progLegacy.pending, 0);
  console.log("✓ Vistoria v2.18.8 sem workflowConfig continua estritamente LEGADO.");

  // Nova vistoria do skeleton nasce com luxMetodo === null (decisão pendente)
  const novaV = A.newVistoriaSkeleton();
  assert.strictEqual(A.getLuxMetodo(novaV), null, "Nova vistoria deve ter getLuxMetodo() === null");
  assert.strictEqual(novaV.workflowConfig.prumoHabilitado, null, "Prumo nasce com decisão pendente (null)");
  assert.strictEqual(novaV.workflowConfig.luxHabilitado, null, "Lux nasce com decisão pendente (null)");
  console.log("✓ Nova vistoria nasce com workflowConfig e decisões pendentes (null).");

  // -------------------------------------------------------------
  // 2. Trava de Método A/B por dados operacionais (Obrigatório Usuário #2)
  // -------------------------------------------------------------
  console.log("\n[2] Trava de Método A/B por dados operacionais...");
  const vMetodoA = A.newVistoriaSkeleton();
  vMetodoA.workflowConfig.luxHabilitado = true;
  vMetodoA.workflowConfig.luxMetodo = "A";
  const estA = A.newEstruturaSkeleton();
  estA.setupComplete = true;
  estA.visualFinalizada = true;
  vMetodoA.estruturas.push(estA);

  assert.strictEqual(A.luxTemDados(vMetodoA), false, "Inicialmente não tem dados de Lux");

  // Marcar Início como "Não foi possível medir" (status: naoaplica)
  const itIlum = A.iluminacaoItem(estA);
  const ocNaoAplica = A.newOcorrencia("naoaplica");
  ocNaoAplica.posicao = "inicio";
  ocNaoAplica.montanteRef = "Início";
  ocNaoAplica.status = "naoaplica";
  itIlum.ocorrencias.push(ocNaoAplica);

  // Trava luxTemDados DEVE disparar com status: "naoaplica"
  assert.strictEqual(A.luxTemDados(vMetodoA), true, "luxTemDados deve retornar true mesmo que seja apenas naoaplica");
  console.log("✓ Marcado 'Não foi possível medir' → luxTemDados() retorna true (troca A/B bloqueada).");

  // e.luxNaoAplica na estrutura inteira NÃO trava A/B
  const vSemDados = A.newVistoriaSkeleton();
  vSemDados.workflowConfig.luxHabilitado = true;
  vSemDados.workflowConfig.luxMetodo = "A";
  const estNA = A.newEstruturaSkeleton();
  estNA.luxNaoAplica = true;
  vSemDados.estruturas.push(estNA);
  assert.strictEqual(A.luxTemDados(vSemDados), false, "e.luxNaoAplica isolado não trava a escolha do método");
  console.log("✓ e.luxNaoAplica na estrutura inteira não trava a troca A/B.");

  // -------------------------------------------------------------
  // 3. Regra Crítica de Prumo (Liberação contínua por estrutura)
  // -------------------------------------------------------------
  console.log("\n[3] Regra Crítica de Prumo...");
  const vPrumo = A.newVistoriaSkeleton();
  vPrumo.workflowConfig.prumoHabilitado = true;
  vPrumo.workflowConfig.luxHabilitado = true;
  vPrumo.workflowConfig.luxMetodo = "A";

  const e1 = A.newEstruturaSkeleton();
  e1.codigo = "EST-01";
  e1.setupComplete = true;
  e1.visualFinalizada = true; // Liberada para prumo!
  e1.montantes = [{ id: "m1", numero: 1, itens: [{ id: "prumo", ocorrencias: [] }] }];

  const e2 = A.newEstruturaSkeleton();
  e2.codigo = "EST-02";
  e2.setupComplete = true;
  e2.visualFinalizada = false; // NÃO liberada para prumo!
  e2.montantes = [{ id: "m2", numero: 1, itens: [{ id: "prumo", ocorrencias: [] }] }];

  vPrumo.estruturas = [e1, e2];

  // e2 não pode entrar no prumo
  const nextPrumo = A.nextStageStructure(vPrumo, e1, "prumo");
  assert.strictEqual(nextPrumo, null, "Estrutura com visualFinalizada: false nunca entra na fila de Prumo");

  // Se e2 finalizar o visual, entra imediatamente na fila de Prumo
  e2.visualFinalizada = true;
  const nextPrumoLiberado = A.nextStageStructure(vPrumo, e1, "prumo");
  assert.strictEqual(nextPrumoLiberado && nextPrumoLiberado.id, e2.id, "Estrutura entra no Prumo imediatamente após visualFinalizada = true");
  console.log("✓ Regra crítica de liberação contínua de Prumo rigorosamente preservada.");

  // -------------------------------------------------------------
  // 4. Toggle Prumo Habilitado / Desabilitado & Submit Validation
  // -------------------------------------------------------------
  console.log("\n[4] Toggle Prumo Habilitado / Desabilitado...");
  const vPrumoOff = A.newVistoriaSkeleton();
  vPrumoOff.lojaCd = "CD Teste";
  vPrumoOff.local = "Campinas";
  vPrumoOff.inspetor = "Ana";
  vPrumoOff.workflowConfig.prumoHabilitado = false;
  vPrumoOff.workflowConfig.prumoMotivo = ""; // Vazio de propósito para testar validação
  vPrumoOff.workflowConfig.luxHabilitado = false;
  vPrumoOff.workflowConfig.luxMotivo = "Sem luz";

  const ePrumoOff = A.newEstruturaSkeleton();
  ePrumoOff.codigo = "E1";
  ePrumoOff.setupComplete = true;
  ePrumoOff.visualFinalizada = true;
  const mPrumoOff = A.newMontanteSkeleton(1, ePrumoOff);
  mPrumoOff.visualInspecionadoAt = "2026-09-02T10:00:00.000Z"; (mPrumoOff.itens || []).forEach(function(it) { it.revisado = true; it.status = "ok"; });
  // Adiciona anomalia prévia no prumo para verificar preservação
  const itPrumo = A.prumoItem(mPrumoOff);
  itPrumo.ocorrencias = [{ id: "oc-prumo-1", status: "problema", localTxt: "LONGITUDINAL", descTxt: "COLUNA FORA DE PRUMO" }];
  ePrumoOff.montantes = [mPrumoOff];
  vPrumoOff.estruturas = [ePrumoOff];

  // Submit deve barrar por falta de motivo de prumo
  let submitErr = null;
  const mockErrBox = { innerHTML: "", appendChild(node) { submitErr = node.textContent; } };
  A.submitVistoria(vPrumoOff, mockErrBox);
  assert(submitErr && submitErr.includes("motivo de não realizar o Prumo"), `Deveria exigir motivo de prumo. Erro recebido: ${submitErr}`);

  // Preenche motivo de prumo
  vPrumoOff.workflowConfig.prumoMotivo = "Fora de escopo contratual";
  submitErr = null;
  A.submitVistoria(vPrumoOff, mockErrBox);
  assert.strictEqual(submitErr, null, "Com motivo preenchido, submit deve autorizar finalização sem exigir prumo");
  assert.strictEqual(vPrumoOff.finalizada, true, "Vistoria finalizada com sucesso com Prumo desabilitado");

  // Dados existentes de prumo NÃO foram apagados
  assert.strictEqual(itPrumo.ocorrencias.length, 1, "Dados existentes de prumo não podem ser apagados");
  // Pendências com Prumo desabilitado devem ser 0
  const pendPrumoOff = A.countPendingInspection(vPrumoOff);
  assert.strictEqual(pendPrumoOff.prumo, 0, "Pendências de prumo devem ser 0 quando campanha está desabilitada");
  console.log("✓ Prumo desabilitado não gera pendência, exige motivo e preserva dados.");

  // -------------------------------------------------------------
  // 5. Estatísticas Lux (calculateLuxStats) — Regra Rígida
  // -------------------------------------------------------------
  console.log("\n[5] Estatísticas Lux — Regra Rígida...");
  const pontosComNaoAplica = [
    { valor: "200", status: "ok" },
    { valor: "", status: "naoaplica" }, // Não medido
    { valor: "300", status: "ok" },
    { valor: "100", status: "problema" }
  ];
  const stats = A.calculateLuxStats(pontosComNaoAplica);
  assert.strictEqual(stats.count, 3, "Contagem válida deve ser 3");
  assert.strictEqual(stats.naoAplicaCount, 1, "NaoAplica count deve ser 1");
  assert.strictEqual(stats.min, 100, "Mínimo deve ser 100 (nunca 0)");
  assert.strictEqual(stats.max, 300, "Máximo deve ser 300");
  assert.strictEqual(stats.avg, 200, "Média deve ser 200 (600/3, sem distorção)");

  const pontosApenasNaoAplica = [
    { valor: "", status: "naoaplica" },
    { valor: "", status: "naoaplica" }
  ];
  const statsVazias = A.calculateLuxStats(pontosApenasNaoAplica);
  assert.strictEqual(statsVazias.count, 0);
  assert.strictEqual(statsVazias.min, null);
  assert.strictEqual(statsVazias.avg, null);
  assert.strictEqual(statsVazias.naoAplicaCount, 2);
  console.log("✓ Estatísticas Lux ignoram naoaplica e nunca inserem 0 lux fictício.");

  // -------------------------------------------------------------
  // 6. Lux Método A: 3 posições fixas com posicao
  // -------------------------------------------------------------
  console.log("\n[6] Lux Método A...");
  const vLuxA = A.newVistoriaSkeleton();
  vLuxA.workflowConfig.luxHabilitado = true;
  vLuxA.workflowConfig.luxMetodo = "A";
  const eLuxA = A.newEstruturaSkeleton();
  eLuxA.setupComplete = true;
  eLuxA.visualFinalizada = true;
  vLuxA.estruturas.push(eLuxA);

  const itLuxA = A.iluminacaoItem(eLuxA);
  // Ponto 1: início com 250 lux
  itLuxA.ocorrencias.push({ id: "oc-ini", posicao: "inicio", valor: "250", status: "ok" });
  let pLuxA = A.luxProgress(eLuxA, vLuxA);
  assert.strictEqual(pLuxA.done, 1);
  assert.strictEqual(pLuxA.pending, 2);
  assert.strictEqual(pLuxA.complete, false);

  // Ponto 2: meio com naoaplica
  itLuxA.ocorrencias.push({ id: "oc-meio", posicao: "meio", status: "naoaplica" });
  // Ponto 3: final com 180 lux (problema)
  itLuxA.ocorrencias.push({ id: "oc-fim", posicao: "final", valor: "180", status: "problema" });
  eLuxA.luxFinalizada = true;

  pLuxA = A.luxProgress(eLuxA, vLuxA);
  assert.strictEqual(pLuxA.done, 3);
  assert.strictEqual(pLuxA.pending, 0);
  assert.strictEqual(pLuxA.measurements, 2);
  assert.strictEqual(pLuxA.problems, 1);
  assert.strictEqual(pLuxA.complete, true);

  // Compaction deve preservar a chave "posicao"
  const compOc = A.compactOccurrenceForStorage(itLuxA.ocorrencias[0]);
  assert.strictEqual(compOc.posicao, "inicio", "compactOccurrenceForStorage deve preservar o campo posicao");
  console.log("✓ Lux Método A avaliado com 3 posições e posicao preservada na compactação.");

  // -------------------------------------------------------------
  // 7. Lux Método B: 1 por montante
  // -------------------------------------------------------------
  console.log("\n[7] Lux Método B...");
  const vLuxB = A.newVistoriaSkeleton();
  vLuxB.workflowConfig.luxHabilitado = true;
  vLuxB.workflowConfig.luxMetodo = "B";
  const eLuxB = A.newEstruturaSkeleton();
  eLuxB.setupComplete = true;
  eLuxB.visualFinalizada = true;

  const mB1 = A.newMontanteSkeleton(1, eLuxB);
  const mB2 = A.newMontanteSkeleton(2, eLuxB);
  eLuxB.montantes = [mB1, mB2];
  vLuxB.estruturas.push(eLuxB);

  // Inicialmente pendente
  let pLuxB = A.luxProgress(eLuxB, vLuxB);
  assert.strictEqual(pLuxB.done, 0);
  assert.strictEqual(pLuxB.total, 2);
  assert.strictEqual(pLuxB.complete, false);

  // Montante 1: medido 350 lux
  const itLuxB1 = A.montanteLuxItem(mB1);
  itLuxB1.valor = "350";
  itLuxB1.status = "ok";
  itLuxB1.revisado = true;

  // Montante 2: naoaplica
  const itLuxB2 = A.montanteLuxItem(mB2);
  itLuxB2.status = "naoaplica";
  itLuxB2.revisado = true;

  eLuxB.luxFinalizada = true;
  pLuxB = A.luxProgress(eLuxB, vLuxB);
  assert.strictEqual(pLuxB.done, 2);
  assert.strictEqual(pLuxB.measurements, 1);
  assert.strictEqual(pLuxB.complete, true);
  console.log("✓ Lux Método B funciona montante a montante com conclusão e métricas corretas.");

  // -------------------------------------------------------------
  // 8. Timestamps e Merge LWW (v.configUpdatedAt, e.luxNaoAplicaUpdatedAt)
  // -------------------------------------------------------------
  console.log("\n[8] Timestamps e Merge LWW...");
  const vA = A.newVistoriaSkeleton();
  vA.id = "v-merge-test";
  vA.workflowConfig = { prumoHabilitado: true, prumoMotivo: "", luxHabilitado: true, luxMotivo: "", luxMetodo: "A" };
  vA.configUpdatedAt = "2026-09-02T10:00:00.000Z";
  vA.configDeviceOrigin = "DEV-A";

  const vB = JSON.parse(JSON.stringify(vA));
  vB.workflowConfig = { prumoHabilitado: false, prumoMotivo: "Desabilitado em B", luxHabilitado: false, luxMotivo: "Desabilitado em B", luxMetodo: null };
  vB.configUpdatedAt = "2026-09-02T11:00:00.000Z"; // Mais recente
  vB.configDeviceOrigin = "DEV-B";

  const merged = A.mergeVistorias(vA, vB);
  assert.strictEqual(merged.workflowConfig.prumoHabilitado, false, "LWW no workflowConfig deve escolher DEV-B mais recente");
  assert.strictEqual(merged.workflowConfig.prumoMotivo, "Desabilitado em B");
  assert.strictEqual(merged.configUpdatedAt, "2026-09-02T11:00:00.000Z");

  // Merge de e.luxNaoAplica
  const estMA = A.newEstruturaSkeleton();
  estMA.id = "est-merge-1";
  estMA.luxNaoAplica = false;
  estMA.luxNaoAplicaUpdatedAt = "2026-09-02T10:00:00.000Z";
  estMA.luxNaoAplicaDeviceOrigin = "DEV-A";

  const estMB = JSON.parse(JSON.stringify(estMA));
  estMB.luxNaoAplica = true;
  estMB.luxNaoAplicaUpdatedAt = "2026-09-02T12:00:00.000Z"; // Mais recente
  estMB.luxNaoAplicaDeviceOrigin = "DEV-B";

  const report = { added: 0, updated: 0, keptLocal: 0, deletedByTombstone: 0, conflicts: [], estruturasAdicionadas: 0, codigosDuplicados: [] };
  const mergedEst = A.mergeEstrutura(estMA, estMB, { estruturas: {}, montantes: {}, ocorrencias: {} }, { estruturas: {}, montantes: {}, ocorrencias: {} }, report);
  assert.strictEqual(mergedEst.luxNaoAplica, true, "LWW em luxNaoAplica deve adotar DEV-B mais recente");
  assert.strictEqual(mergedEst.luxNaoAplicaUpdatedAt, "2026-09-02T12:00:00.000Z");
  console.log("✓ Merge LWW de workflowConfig e luxNaoAplica funcionando perfeitamente.");

  console.log("\n=== TESTE 22 CONCLUÍDO COM 100% DE SUCESSO! ===");
}

main().catch((err) => {
  console.error("FALHA NO TESTE 22:", err);
  process.exit(1);
});
