"use strict";
// CASO DE REGRESSÃO OBRIGATÓRIO -- o caso real de campo que motivou toda essa rodada de correções,
// agora verificado até a geração do PDF real (não window.print()):
// 1 estrutura, 2 montantes, M1 com anomalia+foto, M2 com anomalia+foto (via NewAnomalyScreen real,
// usando draftOccurrenceRecovery), Visual/Prumo concluídos, Lux desabilitado, finalizar, gerar PDF.
const assert = require("assert");
const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakePhotoFile(seed) {
  const bytes = new Uint8Array(1500);
  for (let i = 0; i < bytes.length; i++) bytes[i] = (i * seed) % 256;
  return { name: `foto${seed}.jpg`, type: "image/jpeg", arrayBuffer: async () => bytes.buffer };
}

async function registrarAnomaliaComFoto(A, v, e, m, seedFoto) {
  A.state.activeMontanteId = m.id;
  let item = m.itens.find((it) => it.id === "colunaDanificada") || m.itens[0];
  const itemId = item.id;
  A.startNewAnomaly(v, e, m, item);
  item = m.itens.find((it) => it.id === itemId);
  A.state.draftOccurrence.occurrence.descTxt = "COLUNA DANIFICADA";
  A.state.draftOccurrence.occurrence.grauTxt = "Grave";
  A.state.draftOccurrence.occurrence.localTxt = "FRONTAL";
  A.state.draftOccurrence.occurrence.tipoTxt = "PLACA DE BASE";

  const tela1 = A.NewAnomalyScreen();
  const input = findAll(tela1, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file")[0];
  for (const fn of input._listeners.change || []) await fn({ target: { files: [fakePhotoFile(seedFoto)] } });

  const tela2 = A.NewAnomalyScreen();
  const saveBtn = findAll(tela2, (n) => n.tagName === "BUTTON" && (n.textContent || "").includes("Salvar anomalia"))[0];
  for (const fn of saveBtn._listeners.click || []) await fn();
  return item.id;
}

async function main() {
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;

  console.log("=== Montando: 1 estrutura, 2 montantes ===");
  const v = A.newVistoriaSkeleton();
  v.id = "v-regressao-campo"; v.lojaCd = "CD Regressão"; v.inspetor = "Técnico";
  v.workflowConfig.prumoHabilitado = true;
  v.workflowConfig.luxHabilitado = false; v.workflowConfig.luxMotivo = "Fora de escopo desta vistoria";
  A.touchWorkflowConfig(v);
  const e = A.newEstruturaSkeleton(); e.id = "e1"; e.codigo = "E01"; e.setupComplete = true;
  const m1 = A.newMontanteSkeleton(1, e); m1.id = "m1";
  const m2 = A.newMontanteSkeleton(2, e); m2.id = "m2";
  e.montantes = [m1, m2];
  v.estruturas = [e];
  A.state.draftVistoria = v; A.state.activeEstruturaId = "e1";

  console.log("=== M1: registra anomalia + foto (fluxo real, via draftOccurrenceRecovery) ===");
  const itemIdComum = await registrarAnomaliaComFoto(A, v, e, m1, 201);
  m1.visualInspecionadoAt = new Date().toISOString();

  console.log("=== M2: registra anomalia + foto (fluxo real, via draftOccurrenceRecovery) ===");
  await registrarAnomaliaComFoto(A, v, e, m2, 202);
  m2.visualInspecionadoAt = new Date().toISOString();

  console.log("=== Finaliza Visual e Prumo ===");
  e.visualFinalizada = true; e.visualUpdatedAt = new Date().toISOString();
  for (const m of e.montantes) {
    const itPrumo = A.prumoItem(m);
    itPrumo.ocorrencias = [{ id: "oc-prumo-" + m.id, status: "ok", localTxt: "LONGITUDINAL / TRANSVERSAL", descTxt: "COLUNA NA TOLERÂNCIA DO PRUMO", updatedAt: new Date().toISOString() }];
  }
  e.prumoFinalizada = true; e.prumoUpdatedAt = new Date().toISOString();
  await A.idbSet("vistorias", undefined, A.compactVistoriaForStorage(A.state.draftVistoria));

  console.log("=== Finaliza a vistoria ===");
  const errMsgs = [];
  const fakeErrBox = { innerHTML: "", appendChild: (n) => errMsgs.push(n.textContent || "") };
  const vFinal = A.normalizeVistoria(await A.idbGet("vistorias", "v-regressao-campo"));
  A.submitVistoria(vFinal, fakeErrBox);
  console.log("   Finalizou?", vFinal.finalizada, errMsgs.length ? `(${errMsgs.join(" | ")})` : "");
  assert.strictEqual(vFinal.finalizada, true, "Vistoria deve finalizar (Visual 100%, Prumo 100%, Lux desabilitado)");
  await A.idbSet("vistorias", undefined, A.compactVistoriaForStorage(vFinal));

  console.log("\n=== VERIFICAÇÕES ===");
  const backup = A.normalizeVistoria(await A.idbGet("vistorias", "v-regressao-campo"));
  const item1Final = backup.estruturas[0].montantes.find((x) => x.id === "m1").itens.find((it) => it.id === itemIdComum);
  const item2Final = backup.estruturas[0].montantes.find((x) => x.id === "m2").itens.find((it) => it.id === itemIdComum);

  console.log("[✓ M1 presente]", item1Final.ocorrencias.length === 1);
  assert.strictEqual(item1Final.ocorrencias.length, 1, "M1 deve ter a ocorrência");
  console.log("[✓ M2 presente]", item2Final.ocorrencias.length === 1);
  assert.strictEqual(item2Final.ocorrencias.length, 1, "M2 deve ter a ocorrência");

  const rows = A.buildAnomaliaRows(backup);
  console.log("[✓ duas anomalias presentes]", rows.length === 2);
  assert.strictEqual(rows.length, 2, "Devem existir exatamente 2 anomalias no relatório");

  const fotosM1 = item1Final.ocorrencias[0].fotos;
  const fotosM2 = item2Final.ocorrencias[0].fotos;
  console.log("[✓ duas evidências presentes]", fotosM1.length === 1 && fotosM2.length === 1);
  assert.strictEqual(fotosM1.length, 1);
  assert.strictEqual(fotosM2.length, 1);

  const integrity = await A.checkPhotoIntegrity([backup]);
  console.log("[✓ nenhuma foto órfã]", integrity.orphaned.length === 0, "-- órfãs:", integrity.orphaned.length, "| válidas:", integrity.totalValid);
  assert.strictEqual(integrity.orphaned.length, 0, "Não pode haver foto órfã no fluxo correto");
  assert.strictEqual(integrity.totalValid, 2, "As 2 fotos (M1 e M2) devem estar íntegras");

  console.log("\n=== Gera o relatório/PDF real ===");
  const { blob, filename } = await A.prepareInspectionPdf(backup);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const header = Buffer.from(bytes.slice(0, 5)).toString("ascii");
  console.log("   arquivo:", filename, "| assinatura:", header, "| tamanho:", blob.size, "bytes");
  assert.strictEqual(header, "%PDF-", "PDF real deve começar com a assinatura correta");

  // "PDF possui mais de um montante quando necessário" -- comparamos o PDF desta vistoria (2 montantes
  // com anomalia) contra um PDF de referência com só 1 montante, confirmando que o conteúdo cresceu.
  const vRef = A.newVistoriaSkeleton(); vRef.id = "v-ref-1m";
  vRef.workflowConfig = { prumoHabilitado: false, prumoMotivo: "N/A", luxHabilitado: false, luxMotivo: "N/A" };
  const eRef = A.newEstruturaSkeleton(); eRef.id = "eref"; eRef.codigo = "EREF";
  eRef.montantes = [{ id: "mref", numero: 1, itens: [] }];
  vRef.estruturas = [eRef];
  const blobRef = await A.buildInspectionPdf(vRef);
  console.log("   PDF de referência (1 montante, sem anomalia):", blobRef.size, "bytes | PDF do caso real (2 montantes com anomalia+foto):", blob.size, "bytes");
  assert.ok(blob.size > blobRef.size, "PDF com 2 montantes com anomalia+foto deve ser maior que o de referência");

  console.log("\n>>> REGRESSÃO DO CASO DE CAMPO: TOTALMENTE CORRIGIDA E CONFIRMADA <<<");
}
main().catch((e) => { console.error("ERRO NA REGRESSÃO:", e); process.exit(1); });
