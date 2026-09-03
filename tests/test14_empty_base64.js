const { loadApp, makeIndexedDB } = require("./load-app");

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  const vistoria = {
    id: "v1", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
    estruturas: [{ id: "e1", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{
        id: "oc1", status: "problema",
        fotos: [
          "data:image/jpeg;base64,",                 // sintaticamente "válida", mas vazia
          "data:image/jpeg;base64," + Buffer.from("fotoboa-de-verdade").toString("base64"), // boa, no mesmo array
        ],
        updatedAt: "2025-01-01T00:00:00Z"
      }] }
    ]}]}]
  };
  await App.idbSet("vistorias", undefined, vistoria);
  await App.migrateLegacyBase64ToPhotos();

  const after = await App.idbGet("vistorias", "v1");
  const oc = after.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  console.log("oc.fotos após migração:", oc.fotos);

  const photos = await App.idbGetAll("photos");
  console.log("\nRegistros no store 'photos':", photos.map(p => ({ id: p.id, size: p.blob.size })));

  const integrity = await App.checkPhotoIntegrity(await App.idbGetAll("vistorias"));
  console.log("\ncheckPhotoIntegrity:", JSON.stringify(integrity, null, 2));

  console.log("\n--- Diagnóstico ---");
  const vazia = oc.fotos[0];
  console.log("A foto vazia ainda está como base64 (não virou pho_ inválido)?", typeof vazia === "string" && vazia.startsWith("data:image"));
  console.log("A foto vazia foi contabilizada como pendingMigration?", integrity.pendingMigration.some(p => p.occurrenceId === "oc1"));
  const registroVazio = photos.find(p => p.vistoriaId === "v1" && p.blob.size === 0);
  console.log("Existe algum registro de Blob size=0 gravado no store 'photos' (vazamento)?", Boolean(registroVazio));
  const boa = oc.fotos.find(f => f.startsWith("pho_"));
  console.log("A foto boa (mesma ocorrência) migrou normalmente?", Boolean(boa));
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
