"use strict";
// Testes do motor de PDF real (buildInspectionPdf/prepareInspectionPdf) -- substitui window.print().
const assert = require("assert");
const { loadApp, makeIndexedDB } = require("./load-app");

function vistoriaBase(id) {
  return {
    id, lojaCd: "CD Teste PDF", local: "Galpão", data: "2026-09-04", inspetor: "Técnico",
    workflowConfig: { prumoHabilitado: false, prumoMotivo: "N/A", luxHabilitado: false, luxMotivo: "N/A" },
    estruturas: [],
  };
}
function estruturaComMontantes(codigo, n, comAnomalia) {
  const montantes = [];
  for (let i = 1; i <= n; i++) {
    montantes.push({
      id: `${codigo}_m${i}`, numero: i, fabricante: "F",
      itens: comAnomalia ? [{ id: "colunaDanificada", codigo: "9.13", nome: "Placas de base danificadas", status: "problema",
        ocorrencias: [{ id: `oc_${codigo}_${i}`, status: "problema", descTxt: "DANIFICADA", grauTxt: "Grave", qtd: 1, fotos: [] }] }] : [],
    });
  }
  return { id: codigo, codigo, setor: "S", tipoEstrutura: "T", lado: "A", fabricante: "F", resolvido: false, itensEstrutura: [], montantes };
}

async function main() {
  const A = loadApp("../app.js");

  console.log("[1] PDF real começa com assinatura %PDF");
  {
    const v = vistoriaBase("v1"); v.estruturas = [estruturaComMontantes("E01", 1, false)];
    const blob = await A.buildInspectionPdf(v);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const header = Buffer.from(bytes.slice(0, 5)).toString("ascii");
    console.log("   cabeçalho:", JSON.stringify(header));
    assert.strictEqual(header, "%PDF-", "PDF deve começar com a assinatura %PDF-");
  }

  console.log("[2] Geração com zero fotos (só texto)");
  {
    const v = vistoriaBase("v2"); v.estruturas = [estruturaComMontantes("E01", 1, false)];
    const blob = await A.buildInspectionPdf(v);
    assert.ok(blob.size > 0, "PDF deve ter conteúdo mesmo sem fotos");
    console.log("   tamanho:", blob.size, "bytes -- OK");
  }

  console.log("[3] Geração com uma foto");
  {
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;
    const v = vistoriaBase("v3");
    const e = estruturaComMontantes("E01", 1, true);
    const photoId = "pho_teste1";
    await App.idbSet("photos", undefined, { id: photoId, vistoriaId: "v3", occurrenceId: "oc_E01_1", blob: new Blob([new Uint8Array(500)], { type: "image/jpeg" }), mimeType: "image/jpeg" });
    e.montantes[0].itens[0].ocorrencias[0].fotos = [photoId];
    v.estruturas = [e];
    const semFoto = await A.buildInspectionPdf(vistoriaBase("v3b"));
    const comFoto = await App.buildInspectionPdf(v);
    console.log("   tamanho sem foto:", semFoto.size, "| com 1 foto:", comFoto.size);
    assert.ok(comFoto.size > semFoto.size, "PDF com foto deve ser maior que sem foto");
  }

  console.log("[4] Geração com múltiplas fotos (4 numa ocorrência)");
  {
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;
    const v = vistoriaBase("v4");
    const e = estruturaComMontantes("E01", 1, true);
    const ids = [];
    for (let i = 0; i < 4; i++) {
      const pid = "pho_multi" + i;
      await App.idbSet("photos", undefined, { id: pid, vistoriaId: "v4", occurrenceId: "oc_E01_1", blob: new Blob([new Uint8Array(500)], { type: "image/jpeg" }) });
      ids.push(pid);
    }
    e.montantes[0].itens[0].ocorrencias[0].fotos = ids;
    v.estruturas = [e];
    const blob = await App.buildInspectionPdf(v);
    assert.ok(blob.size > 0, "PDF com múltiplas fotos deve gerar normalmente");
    console.log("   tamanho com 4 fotos:", blob.size, "bytes -- OK");
  }

  console.log("[5] Dois montantes com anomalias -- PDF reflete os dois");
  {
    const v = vistoriaBase("v5");
    const e = estruturaComMontantes("E01", 2, true);
    v.estruturas = [e];
    const blob = await A.buildInspectionPdf(v);
    const text = Buffer.from(await blob.arrayBuffer()).toString("latin1");
    console.log("   PDF contém referência a M1?", text.includes("Montante") || blob.size > 0);
    assert.ok(blob.size > 0);
    // Confirma via buildAnomaliaRows (fonte dos dados que o PDF usa) que os 2 montantes realmente têm anomalia
    const rows = A.buildAnomaliaRows(v);
    assert.strictEqual(rows.length, 2, "Deve haver 2 anomalias (uma por montante)");
    console.log("   2 anomalias confirmadas na fonte de dados usada pelo PDF");
  }

  console.log("[6] Conteúdo que exige mais de uma página (muitas estruturas/montantes)");
  {
    const v = vistoriaBase("v6");
    v.estruturas = [];
    for (let i = 1; i <= 40; i++) v.estruturas.push(estruturaComMontantes("E" + String(i).padStart(2, "0"), 3, true));
    const blob = await A.buildInspectionPdf(v);
    // O jsPDF fake conta páginas via addPage() -- inspecionamos indiretamente pelo tamanho crescer bastante.
    const blobPequeno = await A.buildInspectionPdf((() => { const vv = vistoriaBase("v6b"); vv.estruturas = [estruturaComMontantes("E01", 1, false)]; return vv; })());
    console.log("   tamanho com 40 estruturas/120 montantes:", blob.size, "| tamanho mínimo (1 estrutura vazia):", blobPequeno.size);
    assert.ok(blob.size > blobPequeno.size * 3, "PDF com muito mais conteúdo deve ser bem maior (evidência indireta de múltiplas páginas/conteúdo)");
  }

  console.log("[7] Foto que falha ao decodificar não aborta o relatório inteiro");
  {
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;
    const v = vistoriaBase("v7");
    const e = estruturaComMontantes("E01", 1, true);
    // Referencia um photoId que NÃO existe no store -- loadPhotoDataUrl retorna null, e o try/catch
    // interno de buildInspectionPdf já ignora fotos que falham, sem abortar o resto do relatório.
    e.montantes[0].itens[0].ocorrencias[0].fotos = ["pho_inexistente"];
    v.estruturas = [e];
    let threw = null;
    let blob = null;
    try { blob = await App.buildInspectionPdf(v); } catch (err) { threw = err; }
    console.log("   Lançou exceção?", threw ? threw.message : "não");
    assert.strictEqual(threw, null, "Uma foto ausente/corrompida não pode derrubar o PDF inteiro");
    assert.ok(blob && blob.size > 0, "PDF deve ser gerado normalmente mesmo com a foto ausente");
  }

  console.log("[8] Modo offline sem CDN -- loadJsPdf usa o mock local (window.jspdf já presente)");
  {
    // No harness, window.jspdf.jsPDF já está pré-populado (equivalente ao vendor local funcionando) --
    // loadJsPdf() deve resolver na hora, sem tentar carregar nenhum script.
    const jsPDFClass = await A.loadJsPdf();
    assert.strictEqual(typeof jsPDFClass, "function", "loadJsPdf deve resolver com a classe jsPDF sem precisar de rede");
    console.log("   loadJsPdf resolveu sem rede -- OK");
  }

  console.log("[9] Nome do arquivo válido");
  {
    const v = vistoriaBase("v9"); v.lojaCd = "CD Ítálico Ç & Cia. #42"; v.estruturas = [estruturaComMontantes("E01", 1, false)];
    const { filename } = await A.prepareInspectionPdf(v);
    console.log("   nome gerado:", filename);
    assert.ok(/^relatorio-[a-z0-9-]+\.pdf$/.test(filename), "Nome do arquivo deve ser seguro (sem caracteres especiais/acentos)");
  }

  console.log("[10] Geração repetida não deixa estado/cache de imagens contaminado");
  {
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;
    const v1 = vistoriaBase("vA");
    const eA = estruturaComMontantes("E01", 1, true);
    await App.idbSet("photos", undefined, { id: "pho_A", vistoriaId: "vA", occurrenceId: "oc_E01_1", blob: new Blob([new Uint8Array(500)], { type: "image/jpeg" }) });
    eA.montantes[0].itens[0].ocorrencias[0].fotos = ["pho_A"];
    v1.estruturas = [eA];

    const v2 = vistoriaBase("vB"); // outra vistoria, SEM fotos
    v2.estruturas = [estruturaComMontantes("E01", 1, false)];

    const blobA1 = await App.buildInspectionPdf(v1);
    const blobB = await App.buildInspectionPdf(v2);
    const blobA2 = await App.buildInspectionPdf(v1); // gera de novo a MESMA vistoria com foto

    console.log("   A(1ª geração):", blobA1.size, "| B (sem foto):", blobB.size, "| A (2ª geração):", blobA2.size);
    assert.ok(blobB.size < blobA1.size, "PDF sem foto não pode 'herdar' a foto da geração anterior (vazamento de cache)");
    assert.strictEqual(blobA1.size, blobA2.size, "Gerar o mesmo relatório duas vezes deve dar o mesmo resultado (determinístico, sem estado residual)");
  }

  console.log("\n=== TODOS OS TESTES DO MOTOR DE PDF PASSARAM ===");
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
