const { loadApp, makeIndexedDB } = require("./load-app");

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  // Base64 deliberadamente corrompida (não decodifica) — simula dado de origem já quebrado no backup antigo.
  const vistoria = {
    id: "vCorrupt", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
    estruturas: [{ id: "e1", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", fotos: ["data:image/jpeg;base64,***corrompido***"], updatedAt: "2025-01-01T00:00:00Z" }] }
    ]}]}]
  };
  await App.idbSet("vistorias", undefined, vistoria);
  await App.migrateLegacyBase64ToPhotos(); // deve falhar em decodificar essa foto especificamente, sem travar as outras

  const integrity = await App.checkPhotoIntegrity(await App.idbGetAll("vistorias"));
  console.log("Resultado:", JSON.stringify(integrity, null, 2));
  console.log("\npendingMigration detectou a foto presa?", integrity.pendingMigration.length === 1);
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
