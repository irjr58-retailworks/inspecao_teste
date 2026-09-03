const { loadApp, makeIndexedDB } = require("./load-app");

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  // Dispositivo A cria a vistoria com 1 foto, salva (compacta+persiste).
  const vA = {
    id: "vCiclo", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T09:00:00Z", lojaCd: "CD Ciclo",
    tombstones: { estruturas: {}, montantes: {}, ocorrencias: {}, photos: {} },
    estruturas: [{ id: "e1", setupComplete: true, codigo: "E01", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", fotos: ["pho_a"], updatedAt: "2026-01-01T09:00:00Z", deviceOrigin: "DEV-A" }] }
    ]}]}]
  };
  await App.idbSet("photos", undefined, { id: "pho_a", vistoriaId: "vCiclo", occurrenceId: "oc1", blob: new Blob([new Uint8Array([1,1,1])], {type:"image/jpeg"}), mimeType: "image/jpeg", size: 3, createdAt: "2026-01-01T09:00:00Z" });
  await App.idbSet("vistorias", undefined, App.compactVistoriaForStorage(vA));

  // 1. Reidrata (simulando reabrir a tela desta vistoria)
  const raw1 = await App.idbGet("vistorias", "vCiclo");
  const reidratada1 = App.normalizeVistoria(raw1);
  console.log("1) Reidratada após 1º save — foto presente?", reidratada1.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0].fotos.includes("pho_a"));

  // Dispositivo B, a partir do MESMO ponto de partida, exclui a foto às 10h.
  const vB = JSON.parse(JSON.stringify(reidratada1));
  vB.updatedAt = "2026-01-01T10:00:00Z";
  const ocB = vB.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  ocB.fotos = [];
  ocB.updatedAt = "2026-01-01T10:00:00Z";
  App.recordTombstone(vB, "photos", "pho_a");
  await App.idbSet("photos", undefined, { id: "pho_b_new", vistoriaId: "vCiclo", occurrenceId: "oc1", blob: new Blob([new Uint8Array([2,2])], {type:"image/jpeg"}), mimeType:"image/jpeg", size:2, createdAt:"2026-01-01T10:05:00Z" });
  ocB.fotos.push("pho_b_new"); // B tira uma foto nova depois de excluir a antiga

  // 2. Merge local(A) x incoming(B), depois compacta e persiste o resultado.
  const merged = App.mergeVistorias(reidratada1, vB);
  await App.idbSet("vistorias", undefined, App.compactVistoriaForStorage(merged));

  // 3. Reidrata de novo, do zero, do banco.
  const raw2 = await App.idbGet("vistorias", "vCiclo");
  const reidratada2 = App.normalizeVistoria(raw2);
  const ocFinal = reidratada2.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  console.log("2) Após merge + persistir + reidratar de novo:");
  console.log("   fotos finais:", ocFinal.fotos);
  console.log("   pho_a (excluída) sumiu?", !ocFinal.fotos.includes("pho_a"));
  console.log("   pho_b_new (nova, pós-exclusão) está lá?", ocFinal.fotos.includes("pho_b_new"));
  console.log("   tombstone de pho_a sobreviveu à compactação/reidratação?", Boolean(reidratada2.tombstones.photos["pho_a"]));
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
