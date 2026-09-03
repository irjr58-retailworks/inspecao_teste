const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakeFile(name, jsonObj) {
  const text = JSON.stringify(jsonObj);
  return { name, type: "application/json", text: async () => text, arrayBuffer: async () => Buffer.from(text) };
}

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  // Vistoria local que VAI ser tocada pelo merge (grau muda de "Leve" pra "Médio" no incoming, mais recente).
  const localOriginal = {
    id: "vCompartilhada", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T09:00:00Z", lojaCd: "CD Compartilhado",
    tombstones: { estruturas: {}, montantes: {}, ocorrencias: {}, photos: {} },
    estruturas: [{ id: "e1", setupComplete: true, itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", grauTxt: "Leve", fotos: [], updatedAt: "2026-01-01T09:00:00Z" }] }
    ]}]}]
  };
  await App.idbSet("vistorias", undefined, localOriginal);

  const incomingModificada = JSON.parse(JSON.stringify(localOriginal));
  incomingModificada.updatedAt = "2026-01-01T10:00:00Z";
  incomingModificada.estruturas[0].montantes[0].itens[0].ocorrencias[0].grauTxt = "Médio";
  incomingModificada.estruturas[0].montantes[0].itens[0].ocorrencias[0].updatedAt = "2026-01-01T10:00:00Z";

  const incomingNova = { id: "vTotalmenteNova", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", lojaCd: "CD Novo",
    tombstones: { estruturas: {}, montantes: {}, ocorrencias: {}, photos: {} }, estruturas: [] };

  const incomingPackage = {
    schemaVersion: App.MERGE_SCHEMA_VERSION,
    vistorias: [incomingModificada, incomingNova],
    photos: [],
    deletedVistorias: {},
  };

  const wrap = App.ConfigScreen();
  const inputs = findAll(wrap, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file" && (n.attrs.accept || "").includes(".zip"));
  const mergeInput = inputs[1];

  disk.__chaos.failAfterPuts = 1; // deixa 1 put passar, falha no 2º -- dentro da transação final do Consolidar

  const file = fakeFile("outro-aparelho.json", incomingPackage);
  for (const fn of mergeInput._listeners.change || []) await fn({ target: { files: [file], value: "" } });
  disk.__chaos.failAfterPuts = null;

  console.log("alert()s emitidos:", App.__ui.alerts);

  const vistoriasFinal = await App.idbGetAll("vistorias");
  console.log("\nVistorias no banco APÓS a tentativa (falha no meio):", vistoriasFinal.map(v => v.id));
  console.log("PASS (vTotalmenteNova NÃO deveria ter sido adicionada)?", !vistoriasFinal.some(v => v.id === "vTotalmenteNova"));

  const compartilhadaFinal = vistoriasFinal.find(v => v.id === "vCompartilhada");
  const grauFinal = compartilhadaFinal.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0].grauTxt;
  console.log("Grau da ocorrência compartilhada após a tentativa:", grauFinal, "(esperado: 'Leve', o merge NÃO deve ter sido aplicado nem parcialmente)");
  console.log("PASS (nenhuma alteração parcial vazou)?", grauFinal === "Leve");
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
