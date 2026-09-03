const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakeFile(name, jsonObj) {
  const text = JSON.stringify(jsonObj);
  return {
    name, type: "application/json",
    text: async () => text,
    arrayBuffer: async () => Buffer.from(text),
  };
}

async function run(scenario) {
  console.log(`\n=== Cenário: ${scenario} ===`);
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;

  const vistoria = {
    id: "v1", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", lojaCd: "CD-teste",
    estruturas: [{ id: "e1", codigo: "E01", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", fotos: ["pho_x"], updatedAt: "2026-01-01T00:00:00Z" }] }
    ] }] }]
  };
  await A.idbSet("vistorias", undefined, vistoria);

  // Blob local: corrompido (size 0) ou ausente, dependendo do cenário.
  if (scenario !== "ambos-invalidos-sem-registro-local") {
    const localBlob = scenario === "local-corrompido" || scenario === "ambos-invalidos"
      ? new Blob([], { type: "image/jpeg" }) // size 0 = corrompido
      : new Blob([new Uint8Array([9,9,9,9,9])], { type: "image/jpeg" }); // válido
    await A.idbSet("photos", undefined, { id: "pho_x", vistoriaId: "v1", occurrenceId: "oc1", blob: localBlob, mimeType: "image/jpeg", size: localBlob.size, createdAt: "2026-01-01T00:00:00Z" });
  }

  const integrityBefore = await A.checkPhotoIntegrity(await A.idbGetAll("vistorias"));
  console.log("Integridade local ANTES de consolidar:", integrityBefore.isClean ? "OK" : `corrompida (${integrityBefore.missing.length})`);

  // Pacote incoming: com foto válida OU também corrompida, dependendo do cenário
  const incomingValida = scenario !== "ambos-invalidos" && scenario !== "ambos-invalidos-sem-registro-local";
  const incomingBlobBytes = incomingValida ? Buffer.from("fotoboaverdadeira-dadosreaisdapecacomtrinca12345").toString("base64") : "";
  const incomingPackage = {
    schemaVersion: A.MERGE_SCHEMA_VERSION, appVersion: "2.18.5-outro-aparelho",
    vistorias: [vistoria],
    photos: incomingValida ? [{ id: "pho_x", vistoriaId: "v1", occurrenceId: "oc1", blobBase64: "data:image/jpeg;base64," + incomingBlobBytes, mimeType: "image/jpeg", size: incomingBlobBytes.length, createdAt: "2026-01-01T00:00:00Z" }] : [],
    deletedVistorias: {},
  };

  const wrap = A.ConfigScreen();
  const inputs = findAll(wrap, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file" && (n.attrs.accept || "").includes(".zip"));
  const mergeInput = inputs[1]; // [0] = Restaurar, [1] = Consolidar (mesmo accept string nos dois, distinguidos só pela ordem de definição no código-fonte)
  if (!mergeInput) { console.log("!!! não encontrei o input de Consolidar na árvore renderizada"); return; }

  const file = fakeFile("backup-outro-aparelho.json", incomingPackage);
  const fakeEvent = { target: { files: [file], value: "" } };

  let threw = null;
  try {
    for (const fn of mergeInput._listeners.change || []) await fn(fakeEvent);
  } catch (e) { threw = e; }

  if (threw) {
    console.log("Consolidação lançou exceção:", threw.message);
  } else {
    console.log("Consolidação concluiu sem lançar exceção.");
  }
  console.log("alert()s emitidos:", A.__ui.alerts);

  const photosAfter = await A.idbGetAll("photos");
  const rec = photosAfter.find((p) => p.id === "pho_x");
  console.log("Blob final de pho_x:", rec ? `size=${rec.blob.size}` : "AUSENTE");
  const integrityAfter = await A.checkPhotoIntegrity(await A.idbGetAll("vistorias"));
  console.log("Integridade DEPOIS de consolidar:", integrityAfter.isClean ? "OK (self-healing funcionou)" : `AINDA corrompida (${integrityAfter.missing.length})`);
}

async function main() {
  await run("local-corrompido");           // local com blob size=0, incoming válido -> deve reparar
  await run("ambos-invalidos");            // local E incoming corrompidos -> não deve fingir que reparou
  await run("ambos-invalidos-sem-registro-local"); // local não tem NENHUM registro de pho_x, incoming também vazio
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
