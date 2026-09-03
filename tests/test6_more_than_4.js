const { loadApp } = require("./load-app");

async function main() {
  const A = loadApp("../app.js");
  const mk = (id, fotos, updatedAt) => ({ id, status: "problema", fotos, updatedAt, descTxt: "trinca" });

  const local = { id: "v1", updatedAt: "2026-01-01T10:00:00Z", tombstones: { estruturas:{}, montantes:{}, ocorrencias:{}, photos:{} },
    estruturas: [{ id: "e1", setupComplete: true, itensEstrutura: [], montantes: [{ id: "m1", numero:1, itens: [{ id:"item1", ocorrencias: [
      mk("oc1", ["pho_1","pho_2","pho_3"], "2026-01-01T10:00:00Z")
    ]}]}]}] };
  const incoming = { id: "v1", updatedAt: "2026-01-01T11:00:00Z", tombstones: { estruturas:{}, montantes:{}, ocorrencias:{}, photos:{} },
    estruturas: [{ id: "e1", setupComplete: true, itensEstrutura: [], montantes: [{ id: "m1", numero:1, itens: [{ id:"item1", ocorrencias: [
      mk("oc1", ["pho_3","pho_4","pho_5","pho_6"], "2026-01-01T11:00:00Z")
    ]}]}]}] };

  const merged = A.mergeVistorias(local, incoming);
  const oc = merged.estruturas[0].montantes[0].itens[0].ocorrencias[0];
  console.log("Fotos no resultado (esperado: união de tudo, pho_1..pho_6, sem duplicar pho_3):", oc.fotos);
  console.log("Total:", oc.fotos.length, "(esperado: 6)");
  console.log("Nenhuma foto foi descartada por causa do limite de 4?", oc.fotos.length === 6);
  console.log("Sem duplicatas?", new Set(oc.fotos).size === oc.fotos.length);
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
