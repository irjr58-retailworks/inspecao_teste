"use strict";
// Teste 23: Validação das Correções da Auditoria Independente (P1-1, P1-2, P1-3)
// 1. P1-1: Prumo com decisão pendente (null) bloqueado no dashboard, nextStageStructure e PrumoScreen
// 2. P1-2: Resume não reabre Prumo desabilitado e dados antigos são preservados
// 3. P1-3: Lux B e Método A abaixo do limite não contaminam anomalias visual, contadores, CSV, BOM e consolidação por local; anomalias visuais reais preservadas; Lux continua correto nas estatísticas

const assert = require("assert");
const { loadApp } = require("./load-app");

async function main() {
  console.log("=== INICIANDO TESTE 23: CORREÇÕES DA AUDITORIA (P1-1, P1-2, P1-3) ===");
  const A = loadApp("../app.js");
  await A.dbPromise;

  // =============================================================
  // P1-1: Prumo com decisão pendente (null)
  // =============================================================
  console.log("\n[P1-1] Prumo com decisão pendente (null)...");
  
  // Vistoria nova nasce com prumoHabilitado: null
  const novaV = A.newVistoriaSkeleton();
  assert.strictEqual(novaV.workflowConfig.prumoHabilitado, null, "Nova vistoria deve ter prumoHabilitado === null");
  assert.strictEqual(A.podeEntrarNoPrumo(novaV), false, "podeEntrarNoPrumo(v) deve ser false quando prumoHabilitado é null");

  const est1 = A.newEstruturaSkeleton();
  est1.codigo = "EST-01";
  est1.setupComplete = true;
  est1.visualFinalizada = true; // Visual finalizada!
  const m1 = A.newMontanteSkeleton(1, est1);
  est1.montantes = [m1];
  novaV.estruturas = [est1];

  // nextStageStructure("prumo") NÃO deve oferecer estrutura se Prumo for null
  const nextPrumoNull = A.nextStageStructure(novaV, est1, "prumo");
  assert.strictEqual(nextPrumoNull, null, "nextStageStructure não deve oferecer estrutura quando Prumo está com decisão pendente (null)");

  // Entrada direta em PrumoScreen deve ser bloqueada quando Prumo for null
  A.state.draftVistoria = novaV;
  A.state.activeEstruturaId = est1.id;
  A.state.activeMontanteId = m1.id;
  const prumoScreenNull = A.PrumoScreen();
  assert(prumoScreenNull.textContent.includes("decisão pendente"), "PrumoScreen deve exibir aviso de decisão pendente");
  assert(!prumoScreenNull.querySelector(".measure-hero"), "PrumoScreen não deve renderizar interface de medição quando decisão pendente");

  // Vistoria legada sem workflowConfig -> Prumo liberado (comportamento v2.18.8 preservado)
  const legacyV = {
    id: "v-leg-p1",
    estruturas: [{
      id: "el1",
      codigo: "LEG-01",
      setupComplete: true,
      visualFinalizada: true,
      montantes: [{ id: "ml1", numero: 1, itens: [{ id: "prumo", ocorrencias: [] }] }]
    }]
  };
  assert.strictEqual(A.podeEntrarNoPrumo(legacyV), true, "Vistoria legada sem workflowConfig deve ter podeEntrarNoPrumo() === true");
  const nextPrumoLeg = A.nextStageStructure(legacyV, { id: "none" }, "prumo");
  assert.strictEqual(nextPrumoLeg && nextPrumoLeg.id, "el1", "Vistoria legada deve liberar Prumo normalmente");

  // Prumo habilitado (true) + Visual finalizada -> liberado imediatamente
  novaV.workflowConfig.prumoHabilitado = true;
  assert.strictEqual(A.podeEntrarNoPrumo(novaV), true, "podeEntrarNoPrumo deve ser true quando prumoHabilitado === true");
  const nextPrumoTrue = A.nextStageStructure(novaV, { id: "none" }, "prumo");
  assert.strictEqual(nextPrumoTrue && nextPrumoTrue.id, est1.id, "Prumo true com visualFinalizada deve liberar estrutura imediatamente");

  // Prumo desabilitado (false) -> bloqueado
  novaV.workflowConfig.prumoHabilitado = false;
  assert.strictEqual(A.podeEntrarNoPrumo(novaV), false, "podeEntrarNoPrumo deve ser false quando prumoHabilitado === false");
  const nextPrumoFalse = A.nextStageStructure(novaV, est1, "prumo");
  assert.strictEqual(nextPrumoFalse, null, "nextStageStructure deve retornar null quando Prumo estiver desabilitado (false)");

  // Entrada direta em PrumoScreen bloqueada quando Prumo for false
  const prumoScreenFalse = A.PrumoScreen();
  assert(prumoScreenFalse.textContent.includes("desabilitada"), "PrumoScreen deve avisar que campanha de Prumo está desabilitada");
  console.log("✓ P1-1: Gate de entrada podeEntrarNoPrumo validado com sucesso.");

  // =============================================================
  // P1-2: Resume reabre Prumo desabilitado & Preservação de dados
  // =============================================================
  console.log("\n[P1-2] Resume reabre Prumo desabilitado & Preservação de dados...");
  const vResume = A.newVistoriaSkeleton();
  vResume.workflowConfig.prumoHabilitado = true;
  const eRes = A.newEstruturaSkeleton();
  eRes.setupComplete = true;
  eRes.visualFinalizada = true;
  const mRes = A.newMontanteSkeleton(1, eRes);
  // Adiciona medição real prévia de Prumo
  const itemPrumo = A.prumoItem(mRes);
  itemPrumo.ocorrencias = [{ id: "oc-prumo-antigo", localTxt: "LONGITUDINAL", descTxt: "COLUNA FORA DE PRUMO", status: "problema" }];
  itemPrumo.status = "problema";
  itemPrumo.revisado = true;
  eRes.montantes = [mRes];
  vResume.estruturas = [eRes];

  // Simula estado onde usuário estava no Prumo
  vResume.resume = { mode: "prumo", estruturaId: eRes.id, montanteId: mRes.id };
  await A.saveVistoriaObject(vResume);

  // Agora usuário desabilita Prumo
  vResume.workflowConfig.prumoHabilitado = false;
  await A.saveVistoriaObject(vResume);

  // Testa defesa de resumeVistoria: não pode navegar para 'prumo'
  let navigatedRoute = null;
  A.context.go = (screen, ...args) => { navigatedRoute = { screen, args }; };
  await A.resumeVistoria(vResume);
  assert.notStrictEqual(navigatedRoute && navigatedRoute.screen, "prumo", "resumeVistoria NUNCA deve navegar para prumo se campanha estiver desabilitada");
  assert.strictEqual(navigatedRoute && navigatedRoute.screen, "vistoria", "resumeVistoria deve redirecionar para tela da vistoria");

  // Verifica que dados prévios de Prumo permanecem intactos no montante
  assert.strictEqual(itemPrumo.ocorrencias.length, 1, "Medições existentes de Prumo NÃO devem ser apagadas ao desabilitar campanha");
  assert.strictEqual(itemPrumo.ocorrencias[0].id, "oc-prumo-antigo");
  console.log("✓ P1-2: Resume defendido em profundidade e dados prévios rigorosamente preservados.");

  // =============================================================
  // P1-3: Lux contaminando anomalias Visual / relatório / CSV / BOM
  // =============================================================
  console.log("\n[P1-3] Lux contaminando anomalias Visual / relatório / CSV / BOM...");
  const vLuxContam = A.newVistoriaSkeleton();
  vLuxContam.lojaCd = "CD Contaminação Teste";
  vLuxContam.workflowConfig.luxHabilitado = true;
  vLuxContam.workflowConfig.luxMetodo = "B";

  const eContam = A.newEstruturaSkeleton();
  eContam.codigo = "EST-CONTAM";
  eContam.setupComplete = true;
  eContam.visualFinalizada = true;

  const mContam = A.newMontanteSkeleton(1, eContam);
  
  // 1. Anomalia Visual REAL no montante: Coluna Danificada
  const itVisualCol = (mContam.itens || []).find((it) => it.id === "colunaDanificada");
  assert(itVisualCol, "Deve encontrar item colunaDanificada");
  itVisualCol.status = "problema";
  itVisualCol.ocorrencias = [{
    id: "oc-col-dan",
    tipoTxt: "COLUNA DANIFICADA",
    localTxt: "FRONTAL",
    grauTxt: "GRAVE",
    status: "problema",
    qtd: 1
  }];

  // 2. Medição Lux Método B ABAIXO DO LIMITE no montante (120 lux < 200)
  const itLuxMont = A.montanteLuxItem(mContam);
  itLuxMont.valor = "120";
  itLuxMont.status = "problema";
  itLuxMont.revisado = true;

  // 3. Anomalia Visual REAL de estrutura: Contraventamento
  const itContra = (eContam.itensEstrutura || []).find((it) => it.id === "piso");
  assert(itContra, "Deve encontrar piso");
  itContra.status = "problema";
  itContra.ocorrencias = [{
    id: "oc-contra",
    descTxt: "PISO INDUSTRIAL DANIFICADO",
    tipoTxt: "PISO INDUSTRIAL DANIFICADO",
    grauTxt: "GRAVE",
    status: "problema",
    qtd: 2
  }];

  // 4. Medição Lux Método A ABAIXO DO LIMITE na estrutura (150 lux < 200)
  const itIlum = A.iluminacaoItem(eContam);
  itIlum.ocorrencias = [{
    id: "oc-ilum-baixo",
    posicao: "inicio",
    valor: "150",
    status: "problema"
  }];

  eContam.montantes = [mContam];
  vLuxContam.estruturas = [eContam];

  // A) montanteAnomalyEntries e estruturaAnomalyOccurrences
  const mAnoms = A.montanteAnomalyEntries(eContam);
  assert.strictEqual(mAnoms.length, 1, "montanteAnomalyEntries deve conter APENAS 1 anomalia visual (colunaDanificada)");
  assert.strictEqual(mAnoms[0].item.id, "colunaDanificada", "montanteAnomalyEntries não deve conter o item lux");

  const eAnoms = A.estruturaAnomalyOccurrences(eContam);
  assert.strictEqual(eAnoms.length, 1, "estruturaAnomalyOccurrences deve conter APENAS 1 anomalia visual (contraventamento)");
  assert.strictEqual(eAnoms[0].it.id, "piso", "estruturaAnomalyOccurrences não deve conter iluminacao");

  // B) Contador 'totalAnom' da estrutura
  const totalAnom = mAnoms.length + eAnoms.length;
  assert.strictEqual(totalAnom, 2, "Contador total de anomalias da estrutura deve ser exatamente 2 (não inflado por Lux)");

  // C) Linhas de anomalia (Tabela / CSV)
  const anomRows = A.buildAnomaliaRows(vLuxContam);
  assert.strictEqual(anomRows.length, 2, "buildAnomaliaRows deve conter apenas as 2 anomalias visuais");
  assert(!anomRows.some((r) => r.itemId === "lux" || r.estItemId === "iluminacao"), "CSV/tabela de anomalias NUNCA deve conter itens de lux");
  assert(!anomRows.some((r) => r.nomeAnomalia.toLowerCase().includes("iluminação")), "Nenhuma linha deve mencionar aferição de iluminação como anomalia visual");

  // D) BOM / Lista de Peças (buildPartsForVistoria)
  const parts = A.buildPartsForVistoria(vLuxContam);
  assert(!parts.some((p) => p.peca.toLowerCase().includes("iluminação")), "BOM NUNCA deve incluir Aferição de iluminação como peça de reposição!");
  assert(!parts.some((p) => p.peca.toLowerCase().includes("lux")), "BOM não deve conter itens de lux");
  assert(parts.some((p) => p.peca === "COLUNA DANIFICADA"), "BOM deve incluir peças visuais legítimas");
  console.log("✓ BOM sem falsa peça de reposição de Lux.");

  // E) Consolidação de peças por local (buildPartsByLocation)
  vLuxContam.finalizada = true;
  A.state.vistorias = [vLuxContam];
  const locParts = A.buildPartsByLocation();
  const cdBucket = locParts[vLuxContam.lojaCd];
  assert(cdBucket, "Deve encontrar bucket da loja");
  assert(!Object.keys(cdBucket.itens).some((peca) => peca.toLowerCase().includes("iluminação")), "Consolidação por local NUNCA deve incluir iluminação/lux");
  assert(cdBucket.itens["COLUNA DANIFICADA"], "Consolidação por local deve preservar peças visuais legítimas");
  console.log("✓ Consolidação por local livre de contaminação de Lux.");

  // F) Lux continua correto na seção e nas estatísticas da campanha Lux
  const statsLux = A.calculateLuxStats([{ valor: "120", status: "problema" }]);
  assert.strictEqual(statsLux.count, 1, "Estatística de lux deve contabilizar leitura de 120");
  assert.strictEqual(statsLux.avg, 120, "Média deve ser 120");
  assert.strictEqual(statsLux.min, 120, "Mínimo deve ser 120");

  const progLux = A.luxProgress(eContam, vLuxContam);
  assert.strictEqual(progLux.measurements, 1, "luxProgress deve registrar 1 medição");
  assert.strictEqual(progLux.problems, 1, "luxProgress deve registrar 1 medição com problema (abaixo de 200)");
  console.log("✓ Estatísticas e progresso de Lux continuam perfeitamente funcionais.");

  console.log("\n=== TESTE 23 CONCLUÍDO COM 100% DE SUCESSO! ===");
}

main().catch((err) => {
  console.error("FALHA NO TESTE 23:", err);
  process.exit(1);
});
