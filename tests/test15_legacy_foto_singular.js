const { loadApp, makeIndexedDB } = require("./load-app");

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  // Formato pré-v2.14: oc.foto (singular, string), SEM oc.fotos (array) nenhum.
  const vistoria = {
    id: "vLegado", createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z",
    estruturas: [{ id: "e1", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{
        id: "oc1", status: "problema",
        foto: "data:image/jpeg;base64," + Buffer.from("fotoreal-pre-v214").toString("base64"), // singular, sem "fotos"
        updatedAt: "2023-01-01T00:00:00Z"
      }] }
    ]}]}]
  };
  await App.idbSet("vistorias", undefined, vistoria);

  console.log("=== 1) Estado bruto no banco, ANTES de qualquer normalize/migração ===");
  const raw = await App.idbGet("vistorias", "vLegado");
  const ocRaw = raw.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  console.log("oc.foto (singular):", ocRaw.foto ? "presente" : "ausente");
  console.log("oc.fotos (array):", ocRaw.fotos);

  console.log("\n=== 2) Ciclo real: reidratar (normalizeVistoria) ===");
  const reidratada = App.normalizeVistoria(JSON.parse(JSON.stringify(raw)));
  const ocNorm = reidratada.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  console.log("oc.fotos após normalizeVistoria:", ocNorm.fotos);
  console.log("A foto singular apareceu dentro do array fotos?", Array.isArray(ocNorm.fotos) && ocNorm.fotos.length > 0);
  console.log("occurrencePhotoRefs(oc) reconhece?", App.occurrencePhotoRefs(ocNorm));

  console.log("\n=== 3) Rodar a migração de fotos legadas ===");
  await App.migrateLegacyBase64ToPhotos();
  const afterMigration = await App.idbGet("vistorias", "vLegado");
  const ocMig = afterMigration.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  console.log("oc.fotos após migração:", ocMig.fotos);
  console.log("oc.foto (singular) ainda existe (deveria ter sido limpo)?", ocMig.foto !== undefined);

  const photos = await App.idbGetAll("photos");
  console.log("\nRegistros no store 'photos':", photos.map(p => ({ id: p.id, size: p.blob.size })));
  console.log("Exatamente 1 registro (sem duplicar)?", photos.length === 1);

  console.log("\n=== 4) Fechar/reabrir (persistência real através de uma nova instância, mesmo disco) ===");
  const App2 = loadApp("../app.js", { indexedDB: disk });
  await App2.dbPromise;
  const reaberta = await App2.idbGet("vistorias", "vLegado");
  const dump = JSON.stringify(reaberta);
  console.log("Ainda tem 'data:image' em algum lugar?", dump.includes("data:image"));

  console.log("\n=== 5) Rodar a migração de novo (idempotência) ===");
  await App2.migrateLegacyBase64ToPhotos();
  const photos2 = await App2.idbGetAll("photos");
  console.log("Ainda exatamente 1 registro (sem duplicar na 2ª rodada)?", photos2.length === 1, "-- ids:", photos2.map(p=>p.id));

  const integrity = await App2.checkPhotoIntegrity(await App2.idbGetAll("vistorias"));
  console.log("\ncheckPhotoIntegrity final:", JSON.stringify(integrity));
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
