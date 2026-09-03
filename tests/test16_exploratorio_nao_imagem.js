const { loadApp, makeIndexedDB } = require("./load-app");

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  // Base64 sintaticamente perfeita, decodifica sem erro -- mas os bytes NÃO formam um JPEG de verdade.
  const naoImagem = "data:image/jpeg;base64," + Buffer.from("isto e apenas um texto qualquer, nao e uma imagem de verdade, so pra ocupar espaco e simular bytes arbitrarios que nao formam JPEG valido").toString("base64");

  const vistoria = {
    id: "vNaoImagem", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
    estruturas: [{ id: "e1", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", fotos: [naoImagem], updatedAt: "2025-01-01T00:00:00Z" }] }
    ]}]}]
  };
  await App.idbSet("vistorias", undefined, vistoria);
  await App.migrateLegacyBase64ToPhotos();

  const after = await App.idbGet("vistorias", "vNaoImagem");
  const oc = after.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  console.log("oc.fotos após migração:", oc.fotos);
  console.log("Foi tratada como 'migrada com sucesso' (virou pho_...)?", oc.fotos[0] && oc.fotos[0].startsWith("pho_"));

  const photos = await App.idbGetAll("photos");
  console.log("Registro no store 'photos':", photos.map(p => ({ id: p.id, size: p.blob.size, mimeType: p.mimeType })));

  const integrity = await App.checkPhotoIntegrity(await App.idbGetAll("vistorias"));
  console.log("checkPhotoIntegrity:", JSON.stringify(integrity));
  console.log("\n--- Diagnóstico ---");
  console.log("O sistema tem QUALQUER mecanismo que detectaria que isso não é uma imagem de verdade?");
  console.log("-> base64ToBlob() só decodifica bytes e embrulha num Blob com type declarado; nunca abre/decodifica como imagem.");
  console.log("-> checkPhotoIntegrity() só olha blob.size > 0; um blob de lixo com bytes > 0 passa como 'válido'.");
  console.log("-> Resultado: 'migração' bem-sucedida de um Blob que, se abrir no app, vai falhar ao renderizar como <img> (onerror).");
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
