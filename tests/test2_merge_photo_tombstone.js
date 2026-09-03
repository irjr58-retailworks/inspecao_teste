const { loadApp } = require("./load-app");

function mkOc(id, fotos, updatedAt, deviceOrigin) {
  return { id, status: "problema", fotos, updatedAt, deviceOrigin, descTxt: "trinca", grauTxt: "Leve", qtd: 1 };
}

async function main() {
  const A = loadApp("../app.js");

  // Estado comum de partida: uma ocorrência com 2 fotos (pho_1, pho_2)
  const base = () => ({
    id: "v1", createdAt: "2026-01-01T00:00:00Z", lojaCd: "CD01",
    tombstones: { estruturas: {}, montantes: {}, ocorrencias: {}, photos: {} },
    estruturas: [{
      id: "e1", setupComplete: true, itensEstrutura: [],
      montantes: [{ id: "m1", numero: 1, itens: [{ id: "item1", ocorrencias: [mkOc("oc1", ["pho_1", "pho_2"], "2026-01-01T10:00:00Z", "DEV-A")] }] }]
    }]
  });

  // Device A: apaga pho_1 às 11h e grava tombstone.
  const localA = base();
  localA.updatedAt = "2026-01-01T11:00:00Z";
  const ocA = localA.estruturas[0].montantes[0].itens[0].ocorrencias[0];
  ocA.fotos = ["pho_2"]; // removeu a referência
  ocA.updatedAt = "2026-01-01T11:00:00Z";
  A.recordTombstone(localA, "photos", "pho_1"); // tombstone genérico (kind="photos") -- ver se bate com o que mergeVistorias espera

  // Device B: nunca viu a exclusão, só mudou o grau às 10h30 (ANTES da exclusão em A)
  const incomingB = base();
  incomingB.updatedAt = "2026-01-01T10:30:00Z";
  const ocB = incomingB.estruturas[0].montantes[0].itens[0].ocorrencias[0];
  ocB.grauTxt = "Médio";
  ocB.updatedAt = "2026-01-01T10:30:00Z";
  // B ainda tem as 2 fotos (não sabe da exclusão)

  const merged = A.mergeVistorias(localA, incomingB);
  const ocMerged = merged.estruturas[0].montantes[0].itens[0].ocorrencias[0];
  console.log("Grau no resultado (esperado: Médio, de B, que é mais recente que a versão-base de A mas não que a exclusão):", ocMerged.grauTxt);
  console.log("Fotos no resultado:", ocMerged.fotos);
  console.log("pho_1 (excluída em A) sumiu do resultado?", !ocMerged.fotos.includes("pho_1"));
  console.log("pho_2 (nunca excluída) permanece?", ocMerged.fotos.includes("pho_2"));

  // Agora o inverso: A->B (comutatividade)
  const merged2 = A.mergeVistorias(incomingB, localA);
  const ocMerged2 = merged2.estruturas[0].montantes[0].itens[0].ocorrencias[0];
  console.log("\n--- merge no sentido invertido (B local, A incoming) ---");
  console.log("Fotos:", ocMerged2.fotos, "-- deveria ser igual ao primeiro merge (comutativo)");
  console.log("Comutativo (mesmo conjunto de fotos nos dois sentidos)?", JSON.stringify([...ocMerged.fotos].sort()) === JSON.stringify([...ocMerged2.fotos].sort()));
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
