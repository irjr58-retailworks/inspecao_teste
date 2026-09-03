const { loadApp, makeIndexedDB } = require("./load-app");

function goodB64(seed) {
  return "data:image/jpeg;base64," + Buffer.from("fotoreal-" + seed + "-dados-de-verdade").toString("base64");
}

function vistoriaComVariasOcorrencias(id, especificacoes) {
  // especificacoes: array de { ocId, fotos: [base64 ou corrompido] }
  const itens = especificacoes.map((spec, i) => ({
    id: `item${i}`,
    ocorrencias: [{ id: spec.ocId, status: "problema", fotos: spec.fotos, updatedAt: "2025-01-01T00:00:00Z" }]
  }));
  return { id, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
    estruturas: [{ id: "e1", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens }] }] };
}

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  // 1 vistoria com 4 ocorrências: 3 fotos boas, 1 corrompida, mais uma 2ª vistoria inteira totalmente boa
  // (pra confirmar que o problema fica isolado na ÚNICA foto ruim, sem contaminar as outras vistorias/ocorrências).
  const v1 = vistoriaComVariasOcorrencias("v1", [
    { ocId: "oc1", fotos: [goodB64("a")] },
    { ocId: "oc2", fotos: [goodB64("b"), "data:image/jpeg;base64,***CORROMPIDA***"] }, // uma boa + uma ruim na MESMA ocorrência
    { ocId: "oc3", fotos: [goodB64("c")] },
  ]);
  const v2 = vistoriaComVariasOcorrencias("v2", [
    { ocId: "oc4", fotos: [goodB64("d"), goodB64("e")] },
  ]);
  await App.idbSet("vistorias", undefined, v1);
  await App.idbSet("vistorias", undefined, v2);

  await App.migrateLegacyBase64ToPhotos();

  const after1 = await App.idbGet("vistorias", "v1");
  const after2 = await App.idbGet("vistorias", "v2");
  const oc1 = after1.estruturas[0].montantes[0].itens.find(i => i.id === "item0").ocorrencias[0];
  const oc2 = after1.estruturas[0].montantes[0].itens.find(i => i.id === "item1").ocorrencias[0];
  const oc3 = after1.estruturas[0].montantes[0].itens.find(i => i.id === "item2").ocorrencias[0];
  const oc4 = after2.estruturas[0].montantes[0].itens.find(i => i.id === "item0").ocorrencias[0];

  console.log("oc1.fotos (deveria ter migrado p/ pho_...):", oc1.fotos);
  console.log("oc2.fotos (1 boa migrada + 1 ainda base64 corrompida):", oc2.fotos);
  console.log("oc3.fotos (deveria ter migrado p/ pho_...):", oc3.fotos);
  console.log("oc4.fotos (outra vistoria inteira, ambas deveriam migrar):", oc4.fotos);

  const okOc1 = oc1.fotos.every(f => f.startsWith("pho_"));
  const okOc2 = oc2.fotos.some(f => f.startsWith("pho_")) && oc2.fotos.some(f => f.startsWith("data:image"));
  const okOc3 = oc3.fotos.every(f => f.startsWith("pho_"));
  const okOc4 = oc4.fotos.every(f => f.startsWith("pho_"));

  console.log("\noc1 migrou 100%?", okOc1);
  console.log("oc2 migrou a boa E manteve a ruim como pendente (não travou nem descartou)?", okOc2);
  console.log("oc3 migrou 100% (não foi contaminada pela vizinha oc2)?", okOc3);
  console.log("oc4 (outra vistoria) migrou 100% no MESMO ciclo?", okOc4);

  const integrity = await App.checkPhotoIntegrity(await App.idbGetAll("vistorias"));
  console.log("\ncheckPhotoIntegrity:", JSON.stringify(integrity, null, 2));
  console.log("pendingMigration tem exatamente 1 entrada (a foto corrompida de oc2)?", integrity.pendingMigration.length === 1 && integrity.pendingMigration[0].occurrenceId === "oc2");
  console.log("totalValid = 4 (oc1 + a boa de oc2 + oc3 + as 2 de oc4)?", integrity.totalValid === 5); // a,b,c,d,e = 5 fotos boas no total
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
