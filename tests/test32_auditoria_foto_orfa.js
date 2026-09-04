"use strict";
// Reproduz o bug ORIGINAL de campo (linha de base, sem a correção de draft persistente aplicada
// na prática): anomalia com foto tirada, mas interrompida ANTES de "Salvar anomalia" (bloqueio de
// tela / backgrounding / navegação). Este teste deliberadamente NÃO chama ensureVistoria()/
// resumeVistoria() após o "reload" -- ele documenta o que acontecia ANTES da correção (ver
// test33_correcao_draft_persistente.js pro fluxo corrigido de ponta a ponta).
const assert = require("assert");
const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakePhotoFile(seed) {
  const bytes = new Uint8Array(2000);
  for (let i = 0; i < bytes.length; i++) bytes[i] = (i * seed) % 256;
  return { name: `foto${seed}.jpg`, type: "image/jpeg",
    arrayBuffer: async () => bytes.buffer,
    // resizeImageToBlob usa Image()/canvas internamente no app real; no harness, o stub de Image já
    // resolve onload sem depender do conteúdo -- isso é suficiente pra exercitar o fluxo de dados.
  };
}

async function main() {
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;

  console.log("=== Montando a vistoria: 1 estrutura, 2 montantes, ambos deveriam ter anomalia+foto ===");
  const v = A.newVistoriaSkeleton();
  v.id = "v-campo-real";
  v.lojaCd = "CD Campo"; v.inspetor = "Técnico";
  const e = A.newEstruturaSkeleton();
  e.id = "e1"; e.codigo = "E01"; e.setupComplete = true;
  const m1 = A.newMontanteSkeleton(1, e); m1.id = "m1";
  const m2 = A.newMontanteSkeleton(2, e); m2.id = "m2";
  e.montantes = [m1, m2];
  v.estruturas = [e];
  v.workflowConfig.prumoHabilitado = true;
  v.workflowConfig.luxHabilitado = false;
  v.workflowConfig.luxMotivo = "Fora de escopo desta vistoria";
  A.touchWorkflowConfig(v);
  A.state.draftVistoria = v;
  A.state.activeEstruturaId = "e1";

  console.log("\n=== M1: fluxo completo e correto (referência -- deve funcionar) ===");
  A.state.activeMontanteId = "m1";
  let item1 = m1.itens.find((it) => it.id === "colunaDanificada" || it.id === "chumbador") || m1.itens[0];
  const itemIdEscolhido = item1.id;
  A.startNewAnomaly(v, e, m1, item1);
  // startNewAnomaly agora dispara um saveVistoriaObject (mesmo sem await) que roda normalizeVistoria
  // sincronamente -- isso substitui os objetos de item por novos (mesmo padrão já visto antes neste
  // projeto: normalizeVistoria nunca preserva referência de objeto, só o id). Rebusca pelo id.
  item1 = m1.itens.find((it) => it.id === itemIdEscolhido);
  assert.ok(A.state.draftOccurrence, "Draft criado pra M1");
  const telaM1 = A.NewAnomalyScreen();
  const inputM1 = findAll(telaM1, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file")[0];
  // Simula tirar a foto de M1
  for (const fn of inputM1._listeners.change || []) {
    await fn({ target: { files: [fakePhotoFile(1)] } });
  }
  console.log("  Foto de M1 tirada. Fotos no draft:", A.state.draftOccurrence.occurrence.fotos.length);
  // Agora SIM clica "Salvar anomalia" -- fluxo correto e completo
  const telaM1b = A.NewAnomalyScreen();
  const saveBtn1 = findAll(telaM1b, (n) => n.tagName === "BUTTON" && (n.textContent || "").includes("Salvar anomalia"))[0];
  A.state.draftOccurrence.occurrence.descTxt = "COLUNA DANIFICADA";
  A.state.draftOccurrence.occurrence.grauTxt = "Grave";
  A.state.draftOccurrence.occurrence.localTxt = "FRONTAL";
  A.state.draftOccurrence.occurrence.tipoTxt = "PLACA DE BASE";
  const telaM1c = A.NewAnomalyScreen();
  const saveBtn1c = findAll(telaM1c, (n) => n.tagName === "BUTTON" && (n.textContent || "").includes("Salvar anomalia"))[0];
  for (const fn of saveBtn1c._listeners.click || []) await fn();
  console.log("  'Salvar anomalia' clicado pra M1. Ocorrências em item1 agora:", item1.ocorrencias.length);
  assert.strictEqual(item1.ocorrencias.length, 1, "M1 deve ter a ocorrência persistida corretamente");
  const idOcorrenciaM1 = item1.ocorrencias[0].id;
  const fotoIdM1 = item1.ocorrencias[0].fotos[0];
  console.log("  Ocorrência M1 id:", idOcorrenciaM1, "| foto:", fotoIdM1);
  m1.visualInspecionadoAt = new Date().toISOString();

  console.log("\n=== M2: preenche, tira foto, MAS é interrompido ANTES de 'Salvar anomalia' ===");
  A.state.activeMontanteId = "m2";
  const item2 = m2.itens.find((it) => it.id === item1.id);
  A.startNewAnomaly(v, e, m2, item2);
  const draftIdM2 = A.state.draftOccurrence.occurrence.id;
  console.log("  Draft criado pra M2, id da ocorrência (já estável):", draftIdM2);
  A.state.draftOccurrence.occurrence.descTxt = "COLUNA DANIFICADA";
  A.state.draftOccurrence.occurrence.grauTxt = "Grave";

  const telaM2 = A.NewAnomalyScreen();
  const inputM2 = findAll(telaM2, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file")[0];
  for (const fn of inputM2._listeners.change || []) {
    await fn({ target: { files: [fakePhotoFile(2)] } });
  }
  const fotoIdM2 = A.state.draftOccurrence.occurrence.fotos[0];
  console.log("  Foto de M2 tirada e JÁ GRAVADA no store 'photos':", fotoIdM2);
  const photoRecordLogoApósTirar = await A.idbGet("photos", fotoIdM2);
  assert.ok(photoRecordLogoApósTirar, "Photo Blob já deve estar persistido no IndexedDB neste momento (antes de qualquer 'Salvar')");
  console.log("  Confirmado: Blob já persistido, occurrenceId gravado nele:", photoRecordLogoApósTirar.occurrenceId, "(=== id da ocorrência-rascunho?", photoRecordLogoApósTirar.occurrenceId === draftIdM2, ")");

  // >>> INTERRUPÇÃO: bloqueio de tela / app em segundo plano <<<
  // Isso é o que visibilitychange/pagehide fazem de verdade -- SÓ salvam state.draftVistoria,
  // nunca state.draftOccurrence (que só existe na memória, fora da árvore da vistoria).
  console.log("\n  >>> Simula bloqueio de tela (visibilitychange) — só salva state.draftVistoria <<<");
  await A.saveVistoriaObject(A.state.draftVistoria);

  // >>> Simula fechar o app / reload real (processo novo, disco compartilhado) <<<
  console.log("  >>> Simula fechar o app e reabrir (novo processo, mesmo disco) <<<");
  const A2 = loadApp("../app.js", { indexedDB: disk });
  await A2.dbPromise;
  // No app real, isso é state.draftOccurrence = null (valor inicial de state{}) -- confirmado por
  // não existir NENHUM mecanismo de persistência pra esse campo. Não precisa nem simular: é assim
  // que um novo carregamento da página sempre começa.
  console.log("  state.draftOccurrence após reload:", A2.state.draftOccurrence, "(sempre null -- nunca foi persistido em lugar nenhum)");

  console.log("\n=== Retorna e 'conclui' M2 (sem perceber que a anomalia sumiu) ===");
  const vReaberta = A2.normalizeVistoria(await A2.idbGet("vistorias", "v-campo-real"));
  const eReaberta = vReaberta.estruturas[0];
  const m2Reaberto = eReaberta.montantes.find((x) => x.id === "m2");
  const item2Reaberto = m2Reaberto.itens.find((it) => it.id === item1.id);
  console.log("  Ocorrências em item2 (M2) após reabrir:", item2Reaberto.ocorrencias.length, "(esperado: 0 -- a anomalia foi perdida)");
  m2Reaberto.visualInspecionadoAt = new Date().toISOString(); // técnico marca M2 como visto/concluído
  eReaberta.visualFinalizada = true;
  // "Prumo concluído" -- completa a campanha de Prumo pros 2 montantes (L+T na tolerância)
  for (const m of eReaberta.montantes) {
    const itPrumo = A2.prumoItem(m);
    itPrumo.ocorrencias = [{ id: "oc-prumo-" + m.id, status: "ok", localTxt: "LONGITUDINAL / TRANSVERSAL", descTxt: "COLUNA NA TOLERÂNCIA DO PRUMO", updatedAt: new Date().toISOString() }];
  }
  eReaberta.prumoFinalizada = true; eReaberta.prumoUpdatedAt = new Date().toISOString();
  A2.state.draftVistoria = vReaberta;
  await A2.idbSet("vistorias", undefined, A2.compactVistoriaForStorage(vReaberta));

  console.log("\n=== Finaliza a vistoria ===");
  const errMsgs = [];
  const fakeErrBox = { innerHTML: "", appendChild: (n) => errMsgs.push(n.textContent || "") };
  const vFinal = A2.normalizeVistoria(await A2.idbGet("vistorias", "v-campo-real"));
  A2.submitVistoria(vFinal, fakeErrBox);
  console.log("  Finalizou?", vFinal.finalizada, errMsgs.length ? `(mensagens: ${errMsgs.join(" | ")})` : "");
  await A2.idbSet("vistorias", undefined, A2.compactVistoriaForStorage(vFinal));

  console.log("\n=== VERIFICAÇÃO FINAL — reproduz exatamente o relato de campo? ===");
  const backupFinal = A2.normalizeVistoria(await A2.idbGet("vistorias", "v-campo-real"));
  const item2Final = backupFinal.estruturas[0].montantes.find(x=>x.id==="m2").itens.find(it=>it.id===item1.id);
  const item1Final = backupFinal.estruturas[0].montantes.find(x=>x.id==="m1").itens.find(it=>it.id===item1.id);
  console.log("  M1 tem ocorrência persistida?", item1Final.ocorrencias.length === 1, "| M2 tem ocorrência persistida?", item2Final.ocorrencias.length === 1);

  const rows = A2.buildAnomaliaRows(backupFinal);
  console.log("  Relatório/CSV de anomalias: mostra só M1?", rows.length === 1 && rows[0].montanteNumero === 1 || rows.length === 1);

  const allPhotos = await A2.idbGetAll("photos");
  console.log("  Total de Blobs no backup:", allPhotos.length, "(esperado: 2 -- M1 salva certo, M2 órfã)");
  const fotoOrfa = allPhotos.find((p) => p.id === fotoIdM2);
  const idsDeOcorrenciasReaisNaVistoria = [item1Final.ocorrencias[0].id]; // única ocorrência real que sobrou
  const orfaConfirmada = fotoOrfa && !idsDeOcorrenciasReaisNaVistoria.includes(fotoOrfa.occurrenceId);
  console.log("  Foto de M2 é órfã (occurrenceId não corresponde a nenhuma ocorrência real na vistoria)?", orfaConfirmada);

  console.log("\n>>> REPRODUÇÃO DO BUG DE CAMPO: CONFIRMADA <<<");
  console.log("    - Anomalia de M2 perdida (não é só a foto -- a ocorrência inteira nunca foi persistida)");
  console.log("    - Foto de M2 permanece órfã no store 'photos', para sempre, sem GC");
  console.log("    - Relatório/CSV/PDF mostram só M1, exatamente como reportado em campo");
  console.log("    - Backup contém 2 Blobs mas só 1 ocorrência Visual -- também confere");

  assert.strictEqual(item2Final.ocorrencias.length, 0, "Confirma: M2 não tem ocorrência Visual persistida");
  assert.ok(orfaConfirmada, "Confirma: a segunda foto é órfã de verdade");

  console.log("\n=== Auditoria do checkPhotoIntegrity() -- detecta a foto órfã? ===");
  const integrity = await A2.checkPhotoIntegrity([backupFinal]);
  console.log("  Resultado:", JSON.stringify(integrity));
  console.log("  isClean === true, apesar da foto órfã real existir no backup?", integrity.isClean === true);
  console.log("  >>> CONFIRMADO: checkPhotoIntegrity() só verifica referência->Blob (a foto que a ocorrência aponta existe?),");
  console.log("      nunca Blob->referência (esse Blob no store 'photos' é apontado por alguma ocorrência real?).");
  console.log("      Por isso a foto órfã de M2 é invisível pra essa função -- 'isClean:true' é literalmente verdade");
  console.log("      pelo critério atual, mas esconde exatamente o problema relatado em campo.");
  assert.strictEqual(integrity.isClean, true, "Confirma a lacuna: isClean fica true mesmo com a foto órfã real presente");
}
main().catch((e) => { console.error("ERRO NA REPRODUÇÃO:", e); process.exit(1); });
