const { loadApp, makeIndexedDB } = require("./load-app");

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  const vistoria = {
    id: "v1", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
    estruturas: [{ id: "e1", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", fotos: ["data:image/jpeg;base64,***CORROMPIDA***"], updatedAt: "2025-01-01T00:00:00Z" }] }
    ]}]}]
  };
  await App.idbSet("vistorias", undefined, vistoria);
  await App.migrateLegacyBase64ToPhotos(); // essa foto vai falhar e ficar como pendingMigration

  const integrity = await App.checkPhotoIntegrity(await App.idbGetAll("vistorias"));
  console.log("Estado antes de exportar:", JSON.stringify(integrity));
  console.log("(isClean=true mas pendingMigration>0 -- é exatamente o caso que o usuário pediu pra testar)\n");

  console.log("=== Tentativa 1: downloadZipBackup normal (allowDegraded=false, default) ===");
  try {
    await App.downloadZipBackup("backup-normal.zip");
    console.log("!!! Gerou o ZIP normalmente -- NÃO deveria, há foto pendente de migração");
  } catch (e) {
    console.log("Bloqueado corretamente:", e.message);
  }

  console.log("\n=== Tentativa 2: downloadZipBackup com allowDegraded=true (snapshot de emergência explícito) ===");
  try {
    const res = await App.downloadZipBackup("backup-emergencia.zip", null, true);
    console.log("Gerou o ZIP degradado:", JSON.stringify(res));
  } catch (e) {
    console.log("!!! Bloqueou mesmo com allowDegraded=true -- não deveria:", e.message);
  }
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
