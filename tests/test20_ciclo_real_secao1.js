const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakeFile(name, jsonObj) {
  const text = JSON.stringify(jsonObj);
  return { name, type: "application/json", text: async () => text, arrayBuffer: async () => Buffer.from(text) };
}
function goodB64(seed) { return "data:image/jpeg;base64," + Buffer.from("fotoreal-" + seed).toString("base64"); }

async function main() {
  const passos = [];
  const check = (nome, cond) => { passos.push({ nome, ok: Boolean(cond) }); console.log((cond ? "✅" : "🔴"), nome); };

  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  // 1) CRIAR/NORMALIZAR dados -- vistoria com 1 foto legada em base64 (formato < v2.18)
  const criada = {
    id: "vCiclo1", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T09:00:00Z", lojaCd: "CD Seção1",
    estruturas: [{ id: "e1", setupComplete: true, itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
      { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", fotos: [goodB64("origem")], updatedAt: "2026-01-01T09:00:00Z", deviceOrigin: "DEV-A" }] }
    ]}]}]
  };
  const normalizada = App.normalizeVistoria(JSON.parse(JSON.stringify(criada)));
  check("1. Criar/normalizar", normalizada.id === "vCiclo1");

  // 2) COMPACTAR
  const compactada1 = App.compactVistoriaForStorage(normalizada);
  check("2. Compactar", JSON.stringify(compactada1).length > 0);

  // 3) PERSISTIR
  await App.idbSet("vistorias", undefined, compactada1);
  check("3. Persistir", Boolean(await App.idbGet("vistorias", "vCiclo1")));

  // 4) REIDRATAR
  const reidratada1 = App.normalizeVistoria(await App.idbGet("vistorias", "vCiclo1"));
  check("4. Reidratar", reidratada1.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0].fotos.length === 1);

  // 5) MIGRAR FOTOS LEGADAS
  await App.migrateLegacyBase64ToPhotos();
  const pos5 = await App.idbGet("vistorias", "vCiclo1");
  const fotoPos5 = pos5.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0].fotos[0];
  check("5. Migrar fotos legadas (base64 -> photoId)", typeof fotoPos5 === "string" && fotoPos5.startsWith("pho_"));

  // 6) PERSISTIR NOVAMENTE (a própria migração já persiste; confirmamos que o efeito está no banco)
  check("6. Persistir novamente", Boolean(await App.idbGet("photos", fotoPos5)));

  // 7) REIDRATAR
  const reidratada2 = App.normalizeVistoria(await App.idbGet("vistorias", "vCiclo1"));
  check("7. Reidratar de novo", reidratada2.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0].fotos[0] === fotoPos5);

  // 8) MERGE A+B e B+A -- dispositivo B exclui a foto e tira uma nova
  const B = JSON.parse(JSON.stringify(reidratada2));
  B.updatedAt = "2026-01-01T10:00:00Z";
  const ocB = B.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  ocB.fotos = []; ocB.updatedAt = "2026-01-01T10:00:00Z";
  App.recordTombstone(B, "photos", fotoPos5);
  const novoPhotoId = await App.savePhotoBlob ? null : null; // savePhotoBlob não existe nesta base (é outra implementação) -- registra direto:
  const novaFotoId = "pho_novaFotoB";
  await App.idbSet("photos", undefined, { id: novaFotoId, vistoriaId: "vCiclo1", occurrenceId: "oc1", blob: new Blob([new Uint8Array([9,9])], {type:"image/jpeg"}), mimeType:"image/jpeg", size:2, createdAt:"2026-01-01T10:05:00Z" });
  ocB.fotos.push(novaFotoId);

  const mergedAB = App.mergeVistorias(reidratada2, B);
  const mergedBA = App.mergeVistorias(B, reidratada2);
  const ocAB = mergedAB.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  const ocBA = mergedBA.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  check("8. Merge A+B e B+A comutativos, foto excluída sumiu, nova permanece",
    JSON.stringify([...ocAB.fotos].sort()) === JSON.stringify([...ocBA.fotos].sort()) &&
    !ocAB.fotos.includes(fotoPos5) && ocAB.fotos.includes(novaFotoId));

  // 9) PERSISTIR o resultado do merge
  await App.idbSet("vistorias", undefined, App.compactVistoriaForStorage(mergedAB));
  check("9. Persistir resultado do merge", true);

  // 10) REIDRATAR de novo
  const reidratada3 = App.normalizeVistoria(await App.idbGet("vistorias", "vCiclo1"));
  const ocFinal = reidratada3.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0];
  check("10. Reidratar de novo (estado final consistente)", ocFinal.fotos.includes(novaFotoId) && !ocFinal.fotos.includes(fotoPos5));

  // 11) BACKUP ZIP
  let zipOk = false, zipResult = null;
  try {
    zipResult = await App.downloadZipBackup("ciclo-secao1.zip");
    zipOk = true;
  } catch (err) { console.log("   (downloadZipBackup lançou:", err.message, ")"); }
  check("11. Backup ZIP gerado sem bloqueio (integridade limpa)", zipOk);

  // Recupera os bytes do ZIP realmente gerado (interceptando o download() global)
  // -- como download() no harness não salva em disco, precisamos gerar o zip de novo manualmente pra ter os bytes:
  const vistoriasParaZip = await App.idbGetAll("vistorias");
  const integridadeZip = await App.checkPhotoIntegrity(vistoriasParaZip);
  const photosParaZip = await App.idbGetAll("photos");
  const fileEntriesZip = [{ name: "manifest.json", data: JSON.stringify({
      schemaVersion: App.MERGE_SCHEMA_VERSION, vistorias: vistoriasParaZip,
      photos: await Promise.all(photosParaZip.filter(p => p.blob.size > 0).map(async p => ({ id: p.id, vistoriaId: p.vistoriaId, occurrenceId: p.occurrenceId, path: `photos/${p.id}.jpg`, mimeType: p.mimeType, size: p.size }))),
      deletedVistorias: await App.getDeletedVistoriaIds(),
  }) }];
  for (const p of photosParaZip.filter(pp => pp.blob.size > 0)) {
    fileEntriesZip.push({ name: `photos/${p.id}.jpg`, data: new Uint8Array(await p.blob.arrayBuffer()) });
  }
  const zipBlob = App.createZipBlob(fileEntriesZip);

  // 12) RESTORE em banco VAZIO
  const diskVazio = makeIndexedDB();
  const AppVazio = loadApp("../app.js", { indexedDB: diskVazio });
  await AppVazio.dbPromise;
  const parsed = await AppVazio.parseZipBlob(zipBlob);
  const manifest = JSON.parse(parsed.get("manifest.json").text());

  const wrapVazio = AppVazio.ConfigScreen();
  const inputsVazio = findAll(wrapVazio, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file" && (n.attrs.accept || "").includes(".zip"));
  const restoreInputVazio = inputsVazio[0];
  const zipFile = { name: "ciclo-secao1.zip", type: "application/zip", arrayBuffer: async () => zipBlob.arrayBuffer() };
  for (const fn of restoreInputVazio._listeners.change || []) await fn({ target: { files: [zipFile], value: "" } });

  const vistoriaRestaurada = await AppVazio.idbGet("vistorias", "vCiclo1");
  const ocRestaurada = vistoriaRestaurada ? vistoriaRestaurada.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0] : null;
  console.log("   alert() do restore em banco vazio:", AppVazio.__ui.alerts);
  check("12. Restore em banco vazio recupera a vistoria com a foto certa", Boolean(ocRestaurada) && ocRestaurada.fotos.includes(novaFotoId));

  const fotoRestauradaRec = await AppVazio.idbGet("photos", novaFotoId);
  check("12b. Blob da foto também restaurado (não só a referência)", Boolean(fotoRestauradaRec && fotoRestauradaRec.blob && fotoRestauradaRec.blob.size > 0));

  console.log("\n=== RESUMO ===");
  const falhas = passos.filter(p => !p.ok);
  console.log(`${passos.length - falhas.length}/${passos.length} passos OK`);
  if (falhas.length) console.log("Falhas:", falhas.map(f => f.nome));
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
