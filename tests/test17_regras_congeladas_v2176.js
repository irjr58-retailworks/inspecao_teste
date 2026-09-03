const { loadApp } = require("./load-app");
// Replica os 4 cenários do "Teste obrigatório" do CHANGELOG-v2.17.6.md, comportamentalmente (não só diff de código).

function baseVistoria(id) {
  return { id, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T08:00:00Z",
    tombstones: { estruturas:{}, montantes:{}, ocorrencias:{}, photos:{} },
    estruturas: [{ id:"e1", setupComplete:true, codigo:"E01", visualFinalizada:true, prumoFinalizada:true, luxFinalizada:true,
      visualUpdatedAt:"2026-01-01T08:00:00Z", prumoUpdatedAt:"2026-01-01T08:00:00Z", luxUpdatedAt:"2026-01-01T08:00:00Z",
      itensEstrutura: [{ id: "iluminacao", tipo: "medicao", ocorrencias: [{ id: "ocLux", montanteRef: "M1", status: "ok", valor: "250", updatedAt: "2026-01-01T08:00:00Z" }] }],
      montantes: [{ id:"m1", numero:1, updatedAt:"2026-01-01T08:00:00Z", visualInspecionadoAt:"2026-01-01T08:00:00Z",
        itens: [{ id:"prumo", ocorrencias: [{ id: "ocPrumo", status: "ok", descTxt: "COLUNA NA TOLERÂNCIA DO PRUMO", localTxt: "LONGITUDINAL / TRANSVERSAL", updatedAt: "2026-01-01T08:00:00Z" }] }] }] }],
    finalizada: false };
}

async function cenario1() {
  console.log("=== Cenário 1: Finalização × navegação em cópia stale ===");
  const App = loadApp("../app.js");
  const A = baseVistoria("v1");
  A.finalizada = true; A.finalizadaAt = "2026-01-01T09:00:00Z"; A.finalizadaUpdatedAt = "2026-01-01T09:00:00Z"; A.finalizadaDeviceOrigin = "DEV-A";
  A.updatedAt = "2026-01-01T09:00:00Z";

  const B = baseVistoria("v1"); // cópia antiga (não finalizada), mas B só "navegou" DEPOIS (updatedAt mais novo por causa disso)
  B.updatedAt = "2026-01-01T09:30:00Z"; // mais novo que A só por causa de navegação, sem finalizar nada
  B.finalizada = false;

  const merged = App.mergeVistorias(A, B);
  console.log("finalizada no resultado (esperado: true, pois finalizadaUpdatedAt de A é o que manda, não updatedAt geral):", merged.finalizada);
  console.log("PASS?", merged.finalizada === true);
}

async function cenario2() {
  console.log("\n=== Cenário 2: Visual finalizado × alteração posterior só de Fabricante/Tipo/Obs ===");
  const App = loadApp("../app.js");
  const C = baseVistoria("v1");
  C.estruturas[0].montantes[0].fabricante = "Fabricante Original";

  const D = JSON.parse(JSON.stringify(C));
  D.estruturas[0].montantes[0].fabricante = "Fabricante Corrigido";
  D.estruturas[0].montantes[0].tipoMontante = "Reforçado";
  D.estruturas[0].montantes[0].observacoes = "Trocado após inspeção";
  D.estruturas[0].montantes[0].metaUpdatedAt = "2026-01-01T10:00:00Z";
  D.estruturas[0].montantes[0].metaDeviceOrigin = "DEV-D";
  // D NÃO tocou visualInspecionadoAt/updatedAt do montante -- só meta.

  const merged = App.mergeVistorias(C, D);
  const m = merged.estruturas[0].montantes[0];
  console.log("Fabricante (esperado: Corrigido, de D via metaUpdatedAt):", m.fabricante);
  console.log("Visual continua marcado como inspecionado (não foi 'comido' pela mudança de meta)?", Boolean(m.visualInspecionadoAt));
  console.log("PASS?", m.fabricante === "Fabricante Corrigido" && Boolean(m.visualInspecionadoAt));
}

async function cenario3() {
  console.log("\n=== Cenário 3: setupComplete comutativo (true × false, nos dois sentidos) ===");
  const App = loadApp("../app.js");
  const E = baseVistoria("v1"); E.estruturas[0].setupComplete = true;
  const F = baseVistoria("v1"); F.estruturas[0].setupComplete = false;

  const m1 = App.mergeVistorias(E, F).estruturas[0].setupComplete;
  const m2 = App.mergeVistorias(F, E).estruturas[0].setupComplete;
  console.log("E->F setupComplete:", m1, "| F->E setupComplete:", m2);
  console.log("PASS (ambos true, comutativo)?", m1 === true && m2 === true);
}

async function cenario4() {
  console.log("\n=== Cenário 4: exclusão integral da vistoria em transação atômica ===");
  const { makeIndexedDB } = require("./load-app");
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;
  const v = baseVistoria("vDel");
  await App.idbSet("vistorias", undefined, v);
  await App.deleteVistoriaCompletamente("vDel");
  const still = await App.idbGet("vistorias", "vDel");
  const tomb = await App.getDeletedVistoriaIds();
  console.log("Registro sumiu da store 'vistorias'?", still === undefined);
  console.log("Tombstone gravado em config/deletedVistorias?", Boolean(tomb["vDel"]));
  console.log("PASS (as duas coisas juntas, mesma transação)?", still === undefined && Boolean(tomb["vDel"]));
}

async function main() {
  await cenario1();
  await cenario2();
  await cenario3();
  await cenario4();
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
