const { loadApp, makeIndexedDB } = require("./load-app");

function buildVistoria(id, nMontantes, comFotoEveryN = 5) {
  const montantes = [];
  for (let i = 1; i <= nMontantes; i++) {
    const temFoto = i % comFotoEveryN === 0;
    montantes.push({
      id: `m${i}`, numero: i,
      itens: [{ id: "item_visual", status: "problema", ocorrencias: [{
        id: `oc_${i}`, status: "problema", descTxt: "trinca leve", grauTxt: "Leve",
        fotos: temFoto ? [`pho_${i}_1`, `pho_${i}_2`] : [],
        updatedAt: "2026-01-01T09:00:00Z", deviceOrigin: "DEV-A"
      }]}]
    });
  }
  return { id, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T09:00:00Z", lojaCd: "CD Escala",
    tombstones: { estruturas: {}, montantes: {}, ocorrencias: {}, photos: {} },
    estruturas: [{ id: "e1", setupComplete: true, codigo: "E01", itensEstrutura: [], montantes }] };
}

async function main() {
  const App = loadApp("../app.js");
  const N = 2000;
  const vA = buildVistoria("vEscala", N);

  console.log(`Gerando vistoria com ${N} montantes (foto a cada 5 => ~${Math.floor(N/5)*2} fotos)...`);

  let t0 = Date.now();
  const compacted = App.compactVistoriaForStorage(vA);
  console.log("compactVistoriaForStorage:", Date.now() - t0, "ms");

  t0 = Date.now();
  const json = JSON.stringify(compacted);
  console.log("JSON.stringify:", Date.now() - t0, "ms — tamanho:", (json.length / 1024).toFixed(1), "KB");
  console.log("Contém algum 'data:image' (não deveria, é tudo fotoId agora)?", json.includes("data:image"));

  t0 = Date.now();
  const reidratada = App.normalizeVistoria(JSON.parse(json));
  console.log("normalizeVistoria (reidratar):", Date.now() - t0, "ms");
  console.log("Nº de montantes reidratados:", reidratada.estruturas[0].montantes.length, "(esperado:", N, ")");

  // Dispositivo B: fez o Prumo em paralelo (toca updatedAt de metade dos montantes, sem mexer nas fotos)
  const vB = JSON.parse(JSON.stringify(reidratada));
  vB.updatedAt = "2026-01-01T10:00:00Z";
  for (let i = 0; i < N; i += 2) {
    vB.estruturas[0].montantes[i].updatedAt = "2026-01-01T10:00:00Z";
  }

  t0 = Date.now();
  const merged = App.mergeVistorias(reidratada, vB);
  const mergeMs = Date.now() - t0;
  console.log("mergeVistorias (2000 montantes):", mergeMs, "ms");

  // Verifica que nenhuma foto sumiu no processo
  let totalFotosAntes = 0, totalFotosDepois = 0;
  vA.estruturas[0].montantes.forEach(m => m.itens.find(i=>i.id==="item_visual").ocorrencias[0].fotos.forEach(() => totalFotosAntes++));
  merged.estruturas[0].montantes.forEach(m => {
    const it = m.itens.find(i=>i.id==="item_visual");
    (it.ocorrencias[0] ? it.ocorrencias[0].fotos : []).forEach(() => totalFotosDepois++);
  });
  console.log("Total de fotos antes:", totalFotosAntes, "| depois do merge:", totalFotosDepois, "| bateu?", totalFotosAntes === totalFotosDepois);

  t0 = Date.now();
  const compactedFinal = App.compactVistoriaForStorage(merged);
  const jsonFinal = JSON.stringify(compactedFinal);
  console.log("Compactação final:", Date.now() - t0, "ms — tamanho final:", (jsonFinal.length / 1024).toFixed(1), "KB");
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
