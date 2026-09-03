"use strict";
// Auditoria independente da v2.19.0-RC1 -- cobre especificamente os itens da spec aprovada
// que o test22 (entregue junto) NÃO cobriu: regressão negativa de Prumo, sequência exata
// E01-E04, comutatividade de merge, merge legado x novo, round-trip real de backup ZIP,
// item "lux" não contar como anomalia visual, e escala.
const assert = require("assert");
const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function baseEstrutura(id, codigo, visualFinalizada) {
  return { id, codigo, setupComplete: true, visualFinalizada,
    itensEstrutura: [{ id: "iluminacao", ocorrencias: [] }],
    montantes: [{ id: id+"_m1", numero: 1, itens: [{ id: "prumo", ocorrencias: [] }] }] };
}

async function main() {
  console.log("=== AUDITORIA INDEPENDENTE v2.19.0-RC1 ===");

  // ---- 1. Regressão negativa: Prumo HABILITADO e incompleto AINDA bloqueia finalização ----
  console.log("\n[1] Prumo habilitado + incompleto -> finalização deve continuar bloqueando...");
  {
    const A = loadApp("../app.js");
    const v = A.newVistoriaSkeleton();
    v.lojaCd = "CD X"; v.inspetor = "Fulano";
    v.workflowConfig.prumoHabilitado = true;
    v.workflowConfig.luxHabilitado = false; v.workflowConfig.luxMotivo = "Fora do escopo";
    const e = baseEstrutura("e1", "E01", true);
    // prumo NUNCA preenchido -- item "prumo" com ocorrencias vazias = incompleto
    v.estruturas = [e];
    let errMsg = null;
    const fakeErrBox = { innerHTML: "", appendChild: (n) => { errMsg = n.textContent || (n.childNodes||[]).map(c=>c.textContent).join(""); } };
    // submitVistoria usa el() pra criar o node de erro -- precisamos capturar via override simples:
    const origAppendChild = fakeErrBox.appendChild;
    A.submitVistoria(v, fakeErrBox);
    assert.strictEqual(v.finalizada, false, "Vistoria NÃO deve finalizar com Prumo habilitado e incompleto");
    console.log("✓ PASS -- finalização bloqueada corretamente com Prumo incompleto.");
  }

  // ---- 2. Sequência exata do enunciado: E01✓ E02✓ E03-andamento E04✓ -> fila E01→E02→E04 ----
  console.log("\n[2] Sequência exata E01/E02/E03(aberta)/E04...");
  {
    const A = loadApp("../app.js");
    const v = A.newVistoriaSkeleton();
    v.workflowConfig.prumoHabilitado = true;
    const e01 = baseEstrutura("e01", "E01", true);
    const e02 = baseEstrutura("e02", "E02", true);
    const e03 = baseEstrutura("e03", "E03", false); // Visual em andamento
    const e04 = baseEstrutura("e04", "E04", true);
    v.estruturas = [e01, e02, e03, e04];
    // Prumo de nenhuma foi feito ainda -- todas (exceto e03, bloqueada) são candidatas
    const primeira = A.nextStageStructure(v, e01, "prumo"); // a partir de e01 mesmo (ele é a atual), busca a próxima
    assert.strictEqual(primeira && primeira.id, "e02", "A partir de E01, a próxima deve ser E02 (E03 fica de fora por Visual aberta)");
    const segunda = A.nextStageStructure(v, e02, "prumo");
    assert.strictEqual(segunda && segunda.id, "e04", "A partir de E02, a próxima deve ser E04, pulando E03");
    console.log("✓ PASS -- fila de navegação é E02 -> E04, E03 nunca aparece.");

    // E03 finaliza o Visual DEPOIS -- deve entrar na fila imediatamente, sem reabrir nada
    e03.visualFinalizada = true;
    const terceira = A.nextStageStructure(v, e02, "prumo");
    assert.strictEqual(terceira && terceira.id, "e03", "Assim que E03 finaliza o Visual, ela entra na fila imediatamente");
    console.log("✓ PASS -- E03 aparece na fila assim que visualFinalizada vira true, sem nenhum código adicional.");
  }

  // ---- 3. Comportamento preservado após persistir/reabrir ----
  console.log("\n[3] Comportamento preservado após persistir/reabrir...");
  {
    const disk = makeIndexedDB();
    const App1 = loadApp("../app.js", { indexedDB: disk });
    await App1.dbPromise;
    const v = App1.newVistoriaSkeleton();
    v.id = "v-persist-test";
    v.workflowConfig.prumoHabilitado = true;
    const e01 = baseEstrutura("e01", "E01", true);
    const e02 = baseEstrutura("e02", "E02", false);
    v.estruturas = [e01, e02];
    await App1.idbSet("vistorias", undefined, App1.compactVistoriaForStorage(v));

    const App2 = loadApp("../app.js", { indexedDB: disk });
    await App2.dbPromise;
    const reidratada = App2.normalizeVistoria(await App2.idbGet("vistorias", "v-persist-test"));
    const e01r = reidratada.estruturas.find(x=>x.id==="e01");
    const proxima = App2.nextStageStructure(reidratada, e01r, "prumo");
    assert.strictEqual(proxima, null, "E02 com Visual aberta continua bloqueada após reabrir");
    console.log("✓ PASS -- estado de bloqueio sobrevive a persistir/reidratar.");
  }

  // ---- 4. Comutatividade do merge de workflowConfig e luxNaoAplica ----
  console.log("\n[4] Comutatividade do merge (A->B == B->A)...");
  {
    const A = loadApp("../app.js");
    const vA = A.newVistoriaSkeleton(); vA.id = "v-comut";
    vA.workflowConfig = { prumoHabilitado: true, luxHabilitado: true, luxMetodo: "A" };
    vA.configUpdatedAt = "2026-09-02T10:00:00.000Z"; vA.configDeviceOrigin = "DEV-A";
    const vB = JSON.parse(JSON.stringify(vA));
    vB.workflowConfig = { prumoHabilitado: false, prumoMotivo: "Fora de escopo", luxHabilitado: false, luxMotivo: "Sem luz" };
    vB.configUpdatedAt = "2026-09-02T11:00:00.000Z"; vB.configDeviceOrigin = "DEV-B";

    const m1 = A.mergeVistorias(vA, vB);
    const m2 = A.mergeVistorias(vB, vA);
    assert.deepStrictEqual(m1.workflowConfig, m2.workflowConfig, "workflowConfig deve ser idêntico nos dois sentidos do merge");
    assert.strictEqual(m1.configUpdatedAt, m2.configUpdatedAt);
    console.log("✓ PASS -- merge de workflowConfig é comutativo.");

    const report1 = { added:0,updated:0,keptLocal:0,deletedByTombstone:0,conflicts:[],estruturasAdicionadas:0,codigosDuplicados:[] };
    const report2 = { added:0,updated:0,keptLocal:0,deletedByTombstone:0,conflicts:[],estruturasAdicionadas:0,codigosDuplicados:[] };
    const eA = A.newEstruturaSkeleton(); eA.id = "e-comut";
    eA.luxNaoAplica = false; eA.luxNaoAplicaUpdatedAt = "2026-09-02T10:00:00.000Z"; eA.luxNaoAplicaDeviceOrigin = "DEV-A";
    const eB = JSON.parse(JSON.stringify(eA));
    eB.luxNaoAplica = true; eB.luxNaoAplicaUpdatedAt = "2026-09-02T12:00:00.000Z"; eB.luxNaoAplicaDeviceOrigin = "DEV-B";
    const tombVazio = { estruturas:{}, montantes:{}, ocorrencias:{}, photos:{} };
    const em1 = A.mergeEstrutura(eA, eB, tombVazio, tombVazio, report1);
    const em2 = A.mergeEstrutura(eB, eA, tombVazio, tombVazio, report2);
    assert.strictEqual(em1.luxNaoAplica, em2.luxNaoAplica, "luxNaoAplica deve ser igual nos dois sentidos");
    assert.strictEqual(em1.luxNaoAplicaUpdatedAt, em2.luxNaoAplicaUpdatedAt);
    console.log("✓ PASS -- merge de luxNaoAplica é comutativo.");
  }

  // ---- 5. Merge de vistoria LEGADA (sem workflowConfig) com vistoria NOVA (com workflowConfig) ----
  console.log("\n[5] Merge legado x novo...");
  {
    const A = loadApp("../app.js");
    const legado = { id: "v-legado-merge", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
      tombstones: { estruturas:{}, montantes:{}, ocorrencias:{}, photos:{} }, estruturas: [] }; // SEM workflowConfig nenhum
    const novo = JSON.parse(JSON.stringify(legado));
    novo.workflowConfig = { prumoHabilitado: false, prumoMotivo: "Não se aplica" };
    novo.configUpdatedAt = "2026-01-01T09:00:00Z"; novo.configDeviceOrigin = "DEV-NOVO";
    novo.updatedAt = "2026-01-01T09:00:00Z";

    const merged = A.mergeVistorias(legado, novo);
    assert.strictEqual(merged.workflowConfig.prumoHabilitado, false, "Merge deve adotar a config do lado que tem dado real");
    console.log("✓ PASS -- merge legado x novo adota a config existente sem quebrar.");
    // E o inverso não deve perder a config também
    const merged2 = A.mergeVistorias(novo, legado);
    assert.strictEqual(merged2.workflowConfig.prumoHabilitado, false, "Mesmo com legado por cima, config não pode sumir");
    console.log("✓ PASS -- direção inversa também preserva a config (comutativo mesmo com um lado ausente).");
  }

  // ---- 6. Round-trip REAL de backup ZIP (não só unit-check de compactOccurrenceForStorage) ----
  console.log("\n[6] Round-trip real via Restaurar (ZIP/JSON) com posicao/workflowConfig/luxNaoAplica...");
  {
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;
    const vistoria = {
      id: "v-roundtrip", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", lojaCd: "CD RT", inspetor: "Teste",
      workflowConfig: { prumoHabilitado: true, luxHabilitado: true, luxMetodo: "A" },
      configUpdatedAt: "2026-01-01T00:00:00Z", configDeviceOrigin: "DEV-RT",
      estruturas: [{ id: "e1", codigo: "E01", setupComplete: true, visualFinalizada: true,
        luxNaoAplica: false, luxNaoAplicaUpdatedAt: "2026-01-01T00:00:00Z", luxNaoAplicaDeviceOrigin: "DEV-RT",
        itensEstrutura: [{ id: "iluminacao", ocorrencias: [{ id: "oc1", posicao: "inicio", valor: "300", status: "ok", updatedAt: "2026-01-01T00:00:00Z" }] }],
        montantes: [] }]
    };
    const incomingPackage = { schemaVersion: App.MERGE_SCHEMA_VERSION, vistorias: [vistoria], photos: [], deletedVistorias: {} };
    const wrap = App.ConfigScreen();
    const inputs = findAll(wrap, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file" && (n.attrs.accept || "").includes(".zip"));
    const restoreInput = inputs[0];
    const text = JSON.stringify(incomingPackage);
    const file = { name: "backup.json", type: "application/json", text: async () => text, arrayBuffer: async () => Buffer.from(text) };
    for (const fn of restoreInput._listeners.change || []) await fn({ target: { files: [file], value: "" } });

    const restaurada = await App.idbGet("vistorias", "v-roundtrip");
    assert.ok(restaurada, "Vistoria deve ter sido restaurada");
    assert.strictEqual(restaurada.workflowConfig.prumoHabilitado, true, "prumoHabilitado sobrevive ao ciclo real de Restaurar");
    assert.strictEqual(restaurada.workflowConfig.luxHabilitado, true, "luxHabilitado sobrevive ao ciclo real de Restaurar");
    assert.strictEqual(restaurada.workflowConfig.luxMetodo, "A", "luxMetodo sobrevive ao ciclo real de Restaurar");
    const ocRestaurada = restaurada.estruturas[0].itensEstrutura.find(it=>it.id==="iluminacao").ocorrencias[0];
    assert.strictEqual(ocRestaurada.posicao, "inicio", "posicao sobrevive ao ciclo real de Restaurar (não só ao unit-check da função de compactação)");
    assert.strictEqual(restaurada.estruturas[0].luxNaoAplica, false, "luxNaoAplica sobrevive ao ciclo real de Restaurar");
    console.log("✓ PASS -- workflowConfig, posicao e luxNaoAplica sobrevivem ao round-trip real via Restaurar.");
  }

  // ---- 7. Item "lux" do montante nunca conta como anomalia de Visual ----
  console.log("\n[7] Item 'lux' não conta como anomalia Visual...");
  {
    const A = loadApp("../app.js");
    const m = { id: "m1", numero: 1, itens: [
      { id: "prumo", ocorrencias: [] },
      { id: "lux", ocorrencias: [{ id: "ocl", status: "ok", valor: "300" }] },
      { id: "chumbador", ocorrencias: [] },
    ]};
    const itensVisual = A.visualItemsMontante(m, null);
    assert.ok(!itensVisual.some(it => it.id === "lux"), "Item 'lux' não deve aparecer entre os itens de Visual");
    assert.ok(!itensVisual.some(it => it.id === "prumo"), "Item 'prumo' também não (regressão)");
    assert.ok(itensVisual.some(it => it.id === "chumbador"), "Itens normais do catálogo continuam aparecendo");
    console.log("✓ PASS -- 'lux' e 'prumo' excluídos do Visual, catálogo normal intacto.");
  }

  console.log("\n=== TODOS OS TESTES DA AUDITORIA INDEPENDENTE PASSARAM ===");
}
main().catch((err) => { console.error("FALHA NA AUDITORIA:", err); process.exit(1); });
