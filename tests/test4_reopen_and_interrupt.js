const { loadApp, makeIndexedDB } = require("./load-app");

function b64(seed) {
  // gera um "jpeg" fake distinto por seed pra garantir hashes/photoIds diferentes
  return "data:image/jpeg;base64," + Buffer.from("fakejpegdata-" + seed).toString("base64");
}
function vistoriaComFotos(id, nOcorrencias) {
  const itens = [];
  for (let i = 0; i < nOcorrencias; i++) {
    itens.push({ id: `item${i}`, ocorrencias: [{ id: `oc_${id}_${i}`, status: "problema", fotos: [b64(id + "_" + i)], updatedAt: "2026-01-01T00:00:00Z" }] });
  }
  return { id, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    estruturas: [{ id: "e1", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens }] }] };
}

async function main() {
  console.log("=== TESTE 4a: fechar app / reabrir — base64 realmente some da vistoria persistida ===");
  const disk1 = makeIndexedDB();
  const App1 = loadApp("../app.js", { indexedDB: disk1 });
  await App1.dbPromise;
  await App1.idbSet("vistorias", undefined, vistoriaComFotos("vA", 2));
  await App1.migrateLegacyBase64ToPhotos();

  // "Fecha o app" (App1 vai pro lixo) e "reabre" com uma instância NOVA do app.js, MESMO disco.
  const App2 = loadApp("../app.js", { indexedDB: disk1 });
  await App2.dbPromise;
  const reaberta = await App2.idbGet("vistorias", "vA");
  const dump = JSON.stringify(reaberta);
  console.log("Ainda tem 'data:image' em algum lugar da vistoria persistida?", dump.includes("data:image"));
  console.log("Tamanho do JSON persistido (deve ser pequeno, sem base64):", dump.length, "bytes");
  const fotosCount = await App2.idbGetAll("photos");
  console.log("Fotos no Object Store separado:", fotosCount.length);

  console.log("\n=== TESTE 4b: migração interrompida no meio (2 vistorias, falha após a 1ª) ===");
  const disk2 = makeIndexedDB();
  const AppX = loadApp("../app.js", { indexedDB: disk2 });
  await AppX.dbPromise;
  await AppX.idbSet("vistorias", undefined, vistoriaComFotos("vB1", 1));
  await AppX.idbSet("vistorias", undefined, vistoriaComFotos("vB2", 1));

  // Arma o caos: falha logo depois do 1º put() bem-sucedido de foto (interrompe ANTES da 1ª vistoria
  // terminar de vez, simulando o pior caso: queda no meio da escrita).
  disk2.__chaos.failAfterPuts = 1;
  await AppX.migrateLegacyBase64ToPhotos(); // deve abortar no meio, sem lançar pra fora (try/catch interno)
  disk2.__chaos.failAfterPuts = null; // "liga o aparelho de novo"

  const afterCrash = await AppX.idbGetAll("vistorias");
  const aindaComBase64 = afterCrash.filter(v => JSON.stringify(v).includes("data:image"));
  console.log("Vistorias ainda com base64 logo após a queda simulada:", aindaComBase64.map(v => v.id));

  // "Religa o app" (nova instância, mesmo disco) e deixa rodar de novo — deve TERMINAR o que faltou.
  const AppY = loadApp("../app.js", { indexedDB: disk2 });
  await AppY.dbPromise;
  await AppY.migrateLegacyBase64ToPhotos();
  const afterResume = await AppY.idbGetAll("vistorias");
  const aindaComBase64Depois = afterResume.filter(v => JSON.stringify(v).includes("data:image"));
  console.log("Vistorias ainda com base64 depois de retomar:", aindaComBase64Depois.map(v => v.id), "(esperado: [])");

  const photosFinal = await AppY.idbGetAll("photos");
  console.log("Total de registros em 'photos' após retomada:", photosFinal.length, "(esperado: 2, uma por vistoria, sem duplicatas)");
  const ids = photosFinal.map(p => p.id);
  console.log("IDs de foto duplicados?", new Set(ids).size !== ids.length);
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
