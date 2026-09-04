"use strict";
// Prova a CORREÇÃO do P0 de perda de anomalia: draft persistente separado da ocorrência oficial.
// Exercita exatamente os dois cenários pedidos:
//  A) M2 -> iniciar anomalia -> preencher -> tirar foto -> bloquear tela/reload -> abrir PWA ->
//     draft reaparece -> Salvar anomalia -> M2 aparece no relatório com a foto correta.
//  B) criar anomalia + foto -> Cancelar -> nenhuma ocorrência oficial -> nenhuma foto órfã.
// Mais os testes unitários pedidos: foto legítima não órfã, foto órfã detectada, draft preservado
// após background, save remove recovery draft, cancel remove recovery draft, nenhuma perda de foto,
// e o cenário real completo (1 estrutura / 2 montantes / ambos com anomalia+foto).
const assert = require("assert");
const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakePhotoFile(seed) {
  const bytes = new Uint8Array(2000);
  for (let i = 0; i < bytes.length; i++) bytes[i] = (i * seed) % 256;
  return { name: `foto${seed}.jpg`, type: "image/jpeg", arrayBuffer: async () => bytes.buffer };
}
function montarVistoriaBase() {
  return null; // placeholder -- construído por cenário, ver abaixo
}

async function cenarioA_reloadERestauracao() {
  console.log("=== CENÁRIO A: M2 interrompido -> reload -> draft reaparece -> Salvar -> aparece no relatório ===");
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;

  const v = A.newVistoriaSkeleton();
  v.id = "v-cenario-a"; v.lojaCd = "CD A"; v.inspetor = "Técnico";
  v.workflowConfig.prumoHabilitado = false; v.workflowConfig.prumoMotivo = "Fora de escopo";
  v.workflowConfig.luxHabilitado = false; v.workflowConfig.luxMotivo = "Fora de escopo";
  A.touchWorkflowConfig(v);
  const e = A.newEstruturaSkeleton(); e.id = "e1"; e.codigo = "E01"; e.setupComplete = true;
  const m2 = A.newMontanteSkeleton(2, e); m2.id = "m2";
  e.montantes = [m2];
  v.estruturas = [e];
  A.state.draftVistoria = v; A.state.activeEstruturaId = "e1"; A.state.activeMontanteId = "m2";

  const itemId = "colunaDanificada";
  let item2 = m2.itens.find((it) => it.id === itemId) || m2.itens[0];
  const itemIdEscolhido = item2.id;
  A.startNewAnomaly(v, e, m2, item2);
  item2 = m2.itens.find((it) => it.id === itemIdEscolhido);
  console.log("  Draft iniciado. v.draftOccurrenceRecovery existe?", Boolean(v.draftOccurrenceRecovery));
  assert.ok(v.draftOccurrenceRecovery, "draftOccurrenceRecovery deve ser criado ao iniciar a anomalia");

  A.state.draftOccurrence.occurrence.descTxt = "COLUNA DANIFICADA";
  A.state.draftOccurrence.occurrence.grauTxt = "Grave";
  A.state.draftOccurrence.occurrence.localTxt = "FRONTAL";
  A.state.draftOccurrence.occurrence.tipoTxt = "PLACA DE BASE";
  A.touchDraftRecovery();

  const tela = A.NewAnomalyScreen();
  const input = findAll(tela, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file")[0];
  for (const fn of input._listeners.change || []) await fn({ target: { files: [fakePhotoFile(1)] } });
  const fotoId = A.state.draftOccurrence.occurrence.fotos[0];
  console.log("  Foto tirada:", fotoId, "-- já persistida no store 'photos'?", Boolean(await A.idbGet("photos", fotoId)));
  assert.ok(await A.idbGet("photos", fotoId), "Foto já deve estar persistida");

  // Bloqueio de tela / reload -- persiste o que já está em v.draftOccurrenceRecovery (que, por
  // referência compartilhada com state.draftOccurrence.occurrence, já tem os campos e a foto).
  await A.saveVistoriaObject(A.state.draftVistoria);
  const recNoBanco = (await A.idbGet("vistorias", "v-cenario-a")).draftOccurrenceRecovery;
  console.log("  draftOccurrenceRecovery persistido no banco (após 'bloqueio de tela')?", Boolean(recNoBanco));
  assert.ok(recNoBanco, "O rascunho de recuperação deve estar persistido no IndexedDB, não só na memória");
  assert.ok(recNoBanco.occurrence.fotos.includes(fotoId), "A foto deve estar referenciada no rascunho persistido");

  // "Abrir o PWA" -- processo novo, mesmo disco. ensureVistoria() é o gancho real de restauração.
  const A2 = loadApp("../app.js", { indexedDB: disk });
  await A2.dbPromise;
  await A2.ensureVistoria("v-cenario-a");
  console.log("  Após reabrir: state.screen =", A2.state.screen, "| state.draftOccurrence existe?", Boolean(A2.state.draftOccurrence));
  assert.strictEqual(A2.state.screen, "newAnomaly", "Deve navegar direto pra tela de rascunho da anomalia");
  assert.ok(A2.state.draftOccurrence, "O draft deve reaparecer em memória");
  assert.strictEqual(A2.state.draftOccurrence.occurrence.descTxt, "COLUNA DANIFICADA", "Os campos preenchidos devem estar intactos");
  assert.ok(A2.state.draftOccurrence.occurrence.fotos.includes(fotoId), "A foto deve estar referenciada no draft restaurado");

  // Confirma que a tela de fato renderiza o rascunho (não "nada encontrado")
  const telaRestaurada = A2.NewAnomalyScreen();
  const dump = (n, out=[]) => { out.push(n.textContent||""); (n.children||[]).forEach(c=>dump(c,out)); return out; };
  const textoTela = dump(telaRestaurada).join(" ");
  console.log("  Tela restaurada mostra 'Registro temporário não encontrado'?", textoTela.includes("não encontrado"));
  assert.ok(!textoTela.includes("não encontrado"), "A tela deve renderizar o rascunho normalmente, não um erro");

  // NUNCA vira anomalia oficial sozinho
  const item2AntesDoSave = A2.state.draftVistoria.estruturas[0].montantes[0].itens.find(it=>it.id===itemIdEscolhido);
  console.log("  Ocorrências oficiais ANTES de clicar Salvar:", item2AntesDoSave.ocorrencias.length, "(esperado: 0 -- draft nunca vira oficial sozinho)");
  assert.strictEqual(item2AntesDoSave.ocorrencias.length, 0, "O draft restaurado não pode virar ocorrência oficial automaticamente");

  // Agora sim, "Salvar anomalia"
  const saveBtn = findAll(telaRestaurada, (n) => n.tagName === "BUTTON" && (n.textContent||"").includes("Salvar anomalia"))[0];
  for (const fn of saveBtn._listeners.click || []) await fn();

  const vFinal = A2.normalizeVistoria(await A2.idbGet("vistorias", "v-cenario-a"));
  const item2Final = vFinal.estruturas[0].montantes[0].itens.find(it=>it.id===itemIdEscolhido);
  console.log("  Ocorrências oficiais DEPOIS de Salvar:", item2Final.ocorrencias.length);
  assert.strictEqual(item2Final.ocorrencias.length, 1, "M2 deve ter a ocorrência oficial persistida após Salvar");
  assert.ok(item2Final.ocorrencias[0].fotos.includes(fotoId), "A foto correta deve estar na ocorrência oficial");
  console.log("  draftOccurrenceRecovery removido após Salvar?", !vFinal.draftOccurrenceRecovery);
  assert.ok(!vFinal.draftOccurrenceRecovery, "O rascunho de recuperação deve ser limpo após salvar com sucesso");

  const rows = A2.buildAnomaliaRows(vFinal);
  console.log("  M2 aparece no Relatório de Anomalias com a foto correta?", rows.length === 1 && rows[0].itemId === itemIdEscolhido);
  assert.strictEqual(rows.length, 1, "M2 deve aparecer no relatório de anomalias");

  const integrity = await A2.checkPhotoIntegrity([vFinal]);
  console.log("  checkPhotoIntegrity: órfãs =", integrity.orphaned.length, "(esperado: 0)");
  assert.strictEqual(integrity.orphaned.length, 0, "Nenhuma foto órfã deve restar após o fluxo corrigido");
  console.log("✓ CENÁRIO A CONFIRMADO — draft sobrevive a bloqueio de tela/reload, e ao Salvar, M2 aparece corretamente.\n");
}

async function cenarioB_cancelar() {
  console.log("=== CENÁRIO B: criar anomalia + foto -> Cancelar -> nenhuma ocorrência oficial, nenhuma foto órfã ===");
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;
  const v = A.newVistoriaSkeleton(); v.id = "v-cenario-b";
  const e = A.newEstruturaSkeleton(); e.id = "e1"; e.setupComplete = true;
  const m = A.newMontanteSkeleton(1, e); m.id = "m1";
  e.montantes = [m]; v.estruturas = [e];
  A.state.draftVistoria = v; A.state.activeEstruturaId = "e1"; A.state.activeMontanteId = "m1";

  let item = m.itens.find((it) => it.id === "colunaDanificada") || m.itens[0];
  const itemId = item.id;
  A.startNewAnomaly(v, e, m, item);
  item = m.itens.find((it) => it.id === itemId);

  const tela = A.NewAnomalyScreen();
  const input = findAll(tela, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file")[0];
  for (const fn of input._listeners.change || []) await fn({ target: { files: [fakePhotoFile(9)] } });
  const fotoId = A.state.draftOccurrence.occurrence.fotos[0];
  console.log("  Foto do rascunho tirada e persistida:", fotoId, Boolean(await A.idbGet("photos", fotoId)));

  // Cancelar -- occurrenceHasMeaningfulData(oc) provavelmente é true (tem foto+campos), então o
  // fluxo real pede confirm(); no harness, confirm() sempre retorna true (ver __ui.confirmReturn).
  A.__ui.confirmReturn = true;
  const telaAntesDoCancel = A.NewAnomalyScreen();
  const cancelBtn = findAll(telaAntesDoCancel, (n) => n.tagName === "BUTTON" && (n.textContent||"").includes("Cancelar"))[0];
  for (const fn of cancelBtn._listeners.click || []) await fn();

  console.log("  state.draftOccurrence após Cancelar:", A.state.draftOccurrence);
  assert.strictEqual(A.state.draftOccurrence, null, "Draft deve ser limpo após Cancelar");

  const vFinal = A.normalizeVistoria(await A.idbGet("vistorias", "v-cenario-b"));
  console.log("  draftOccurrenceRecovery removido do banco?", !vFinal.draftOccurrenceRecovery);
  assert.ok(!vFinal.draftOccurrenceRecovery, "O rascunho de recuperação deve ser removido do banco após Cancelar");
  const itemFinal = vFinal.estruturas[0].montantes[0].itens.find(it=>it.id===itemId);
  console.log("  Ocorrências oficiais após Cancelar:", itemFinal.ocorrencias.length, "(esperado: 0)");
  assert.strictEqual(itemFinal.ocorrencias.length, 0, "Nenhuma ocorrência oficial deve existir após Cancelar");

  const fotoAindaExiste = await (async () => { try { return Boolean(await A.idbGet("photos", fotoId)); } catch { return false; } })();
  console.log("  Blob da foto ainda existe no store 'photos' após Cancelar?", fotoAindaExiste, "(esperado: false -- cancelDraftAnomaly já apaga o Blob)");
  assert.strictEqual(fotoAindaExiste, false, "O Blob da foto do rascunho cancelado deve ser removido, não ficar órfão");

  const integrity = await A.checkPhotoIntegrity([vFinal]);
  console.log("  checkPhotoIntegrity: órfãs =", integrity.orphaned.length, "(esperado: 0)");
  assert.strictEqual(integrity.orphaned.length, 0, "Nenhuma foto órfã após Cancelar");
  console.log("✓ CENÁRIO B CONFIRMADO — Cancelar não deixa ocorrência oficial nem foto órfã.\n");
}

async function testesUnitarios() {
  console.log("=== Testes unitários adicionais ===");
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;

  // Foto legítima não marcada órfã
  const v = { id: "v-unit", estruturas: [{ id: "e1", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
    { id: "chumbador", ocorrencias: [{ id: "oc1", status: "problema", fotos: ["pho_legit"] }] }
  ]}]}]};
  await A.idbSet("photos", undefined, { id: "pho_legit", vistoriaId: "v-unit", occurrenceId: "oc1", blob: new Blob([new Uint8Array([1,2,3])],{type:"image/jpeg"}) });
  let integ = await A.checkPhotoIntegrity([v]);
  console.log("[1] Foto legítima marcada como órfã?", integ.orphaned.some(o=>o.photoId==="pho_legit"), "(esperado: false)");
  assert.ok(!integ.orphaned.some(o=>o.photoId==="pho_legit"), "Foto legítima não pode ser marcada órfã");

  // Foto órfã detectada
  await A.idbSet("photos", undefined, { id: "pho_orfa", vistoriaId: "v-unit", occurrenceId: "oc-inexistente", blob: new Blob([new Uint8Array([4,5,6])],{type:"image/jpeg"}) });
  integ = await A.checkPhotoIntegrity([v]);
  console.log("[2] Foto órfã detectada?", integ.orphaned.some(o=>o.photoId==="pho_orfa"), "| isClean permanece true (órfã não bloqueia backup)?", integ.isClean === true);
  assert.ok(integ.orphaned.some(o=>o.photoId==="pho_orfa"), "Foto órfã deve ser detectada");
  assert.strictEqual(integ.isClean, true, "orphaned não deve alterar isClean (é warning, não bloqueio)");

  // Draft preservado após "background" (visibilitychange/pagehide -- mesmo saveVistoriaObject)
  const A2 = loadApp("../app.js", { indexedDB: makeIndexedDB() });
  await A2.dbPromise;
  const v2 = A2.newVistoriaSkeleton(); v2.id = "v-bg";
  const e2 = A2.newEstruturaSkeleton(); e2.id="e1"; e2.setupComplete=true;
  const m2 = A2.newMontanteSkeleton(1, e2); m2.id="m1"; e2.montantes=[m2]; v2.estruturas=[e2];
  A2.state.draftVistoria = v2; A2.state.activeEstruturaId="e1"; A2.state.activeMontanteId="m1";
  const item2 = m2.itens.find(it=>it.id==="chumbador")||m2.itens[0];
  A2.startNewAnomaly(v2, e2, m2, item2);
  await A2.saveVistoriaObject(A2.state.draftVistoria); // simula visibilitychange
  const persistido = await A2.idbGet("vistorias", "v-bg");
  console.log("[3] Draft preservado após simular background (visibilitychange)?", Boolean(persistido.draftOccurrenceRecovery));
  assert.ok(persistido.draftOccurrenceRecovery, "Draft deve sobreviver ao evento de background");

  console.log("✓ Testes unitários OK.\n");
}

async function cenarioReal_1e_2m() {
  console.log("=== Cenário real: 1 estrutura / 2 montantes, ambos com anomalia+foto, sem interrupção ===");
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;
  const v = A.newVistoriaSkeleton(); v.id = "v-real-2m";
  v.workflowConfig.prumoHabilitado = false; v.workflowConfig.prumoMotivo = "N/A";
  v.workflowConfig.luxHabilitado = false; v.workflowConfig.luxMotivo = "N/A";
  const e = A.newEstruturaSkeleton(); e.id="e1"; e.codigo="E01"; e.setupComplete=true;
  const m1 = A.newMontanteSkeleton(1, e); m1.id="m1";
  const m2 = A.newMontanteSkeleton(2, e); m2.id="m2";
  e.montantes=[m1,m2]; v.estruturas=[e];
  A.state.draftVistoria = v; A.state.activeEstruturaId="e1";

  for (const [mId, seed] of [["m1",101],["m2",102]]) {
    A.state.activeMontanteId = mId;
    const m = e.montantes.find(x=>x.id===mId);
    let item = m.itens.find(it=>it.id==="colunaDanificada") || m.itens[0];
    const itemId = item.id;
    A.startNewAnomaly(v, e, m, item);
    item = m.itens.find(it=>it.id===itemId);
    A.state.draftOccurrence.occurrence.descTxt = "COLUNA DANIFICADA";
    A.state.draftOccurrence.occurrence.grauTxt = "Grave";
    A.state.draftOccurrence.occurrence.localTxt = "FRONTAL";
    A.state.draftOccurrence.occurrence.tipoTxt = "PLACA DE BASE";
    const t1 = A.NewAnomalyScreen();
    const inp = findAll(t1, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file")[0];
    for (const fn of inp._listeners.change || []) await fn({ target: { files: [fakePhotoFile(seed)] } });
    const t2 = A.NewAnomalyScreen();
    const btn = findAll(t2, (n) => n.tagName === "BUTTON" && (n.textContent||"").includes("Salvar anomalia"))[0];
    for (const fn of btn._listeners.click || []) await fn();
  }

  const vFinal = A.normalizeVistoria(await A.idbGet("vistorias", "v-real-2m"));
  const totalOcorrencias = vFinal.estruturas[0].montantes.reduce((s,m)=>s+m.itens.reduce((s2,it)=>s2+it.ocorrencias.length,0),0);
  console.log("  Total de ocorrências oficiais (esperado: 2):", totalOcorrencias);
  assert.strictEqual(totalOcorrencias, 2, "Ambos M1 e M2 devem ter ocorrência oficial");
  const integrity = await A.checkPhotoIntegrity([vFinal]);
  console.log("  Fotos órfãs (esperado: 0):", integrity.orphaned.length, "| Fotos válidas (esperado: 2):", integrity.totalValid);
  assert.strictEqual(integrity.orphaned.length, 0);
  assert.strictEqual(integrity.totalValid, 2);
  const rows = A.buildAnomaliaRows(vFinal);
  console.log("  Linhas no relatório (esperado: 2):", rows.length);
  assert.strictEqual(rows.length, 2);
  console.log("✓ Cenário real (1e/2m, sem interrupção) confirmado -- nenhuma perda de foto.\n");
}

async function main() {
  await cenarioA_reloadERestauracao();
  await cenarioB_cancelar();
  await testesUnitarios();
  await cenarioReal_1e_2m();
  console.log("=== TODOS OS CENÁRIOS DA CORREÇÃO CONFIRMADOS ===");
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
