const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakeFile(name, jsonObj) {
  const text = JSON.stringify(jsonObj);
  return { name, type: "application/json", text: async () => text, arrayBuffer: async () => Buffer.from(text) };
}

async function main() {
  const disk = makeIndexedDB();
  const App1 = loadApp("../app.js", { indexedDB: disk });
  await App1.dbPromise;

  const oldBackup = {
    vistorias: [{
      id: "vOld", createdAt: "2025-06-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", lojaCd: "Loja Antiga",
      estruturas: [{ id: "e1", codigo: "E01", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
        { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", fotos: ["data:image/jpeg;base64," + Buffer.from("fotoreal-de-uma-trinca").toString("base64")], updatedAt: "2025-06-01T00:00:00Z" }] }
      ]}]}]
    }],
    deletedVistorias: {},
  };

  const wrap = App1.ConfigScreen();
  const inputs = findAll(wrap, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file" && (n.attrs.accept || "").includes(".zip"));
  const restoreInput = inputs[0];
  const file = fakeFile("backup-antigo.json", oldBackup);
  for (const fn of restoreInput._listeners.change || []) await fn({ target: { files: [file], value: "" } });

  console.log("Logo após Restaurar (app ainda 'aberto', sem reiniciar):");
  let v = await App1.idbGet("vistorias", "vOld");
  console.log("  ainda base64?", JSON.stringify(v).includes("data:image"));

  // "Fecha o app" (App1 descartado) e "abre de novo" -> dispara o que seria boot() -> migração
  const App2 = loadApp("../app.js", { indexedDB: disk });
  await App2.dbPromise;
  await App2.migrateLegacyBase64ToPhotos(); // isto é exatamente o que boot() chamaria sozinho no app real

  console.log("\nDepois de fechar e reabrir o app (próximo boot real):");
  v = await App2.idbGet("vistorias", "vOld");
  console.log("  ainda base64?", JSON.stringify(v).includes("data:image"));
  const photos = await App2.idbGetAll("photos");
  console.log("  fotos migradas:", photos.length);

  console.log("\n=== Checando o 'alerta falso' de checkPhotoIntegrity logo após restaurar (ANTES do 2º boot) ===");
  const App3 = loadApp("../app.js", { indexedDB: makeIndexedDB() });
  await App3.dbPromise;
  const wrap3 = App3.ConfigScreen();
  const inputs3 = findAll(wrap3, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file" && (n.attrs.accept || "").includes(".zip"));
  const file3 = fakeFile("backup-antigo.json", oldBackup);
  for (const fn of inputs3[0]._listeners.change || []) await fn({ target: { files: [file3], value: "" } });
  const integrityRightAfter = await App3.checkPhotoIntegrity(await App3.idbGetAll("vistorias"));
  console.log("checkPhotoIntegrity logo após restaurar backup antigo (SEM reiniciar):", JSON.stringify(integrityRightAfter));
  console.log("=> Isso é enganoso: diz 'isClean', mas a foto em base64 nem é contada (nem 'valid' nem 'missing') porque checkRefs só reconhece IDs que começam com 'pho_'.");
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
