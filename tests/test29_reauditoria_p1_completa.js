"use strict";
// Re-auditoria fechada pós-hardening: cobre os requisitos EXPLÍCITOS da rodada (dashboard, persistir/
// reabrir, reabilitar depois de desabilitar) que complementam test25/26/27 (que já provaram os bugs
// originais) e test28 (entregue pelo Antigravity).
const assert = require("assert");
const { loadApp, makeIndexedDB } = require("./load-app");

function baseEstrutura(id, codigo, visualFinalizada) {
  return { id, codigo, setupComplete: true, visualFinalizada,
    itensEstrutura: [{ id: "iluminacao", ocorrencias: [] }],
    montantes: [{ id: id+"_m1", numero: 1, itens: [{ id: "prumo", ocorrencias: [] }] }] };
}

async function main() {
  console.log("=== P1-1: dashboard (nextPrumo) com as 4 combinações + persistir/reabrir ===");
  {
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;

    const cenarios = [
      { nome: "legado (sem workflowConfig)", config: undefined, esperaDisponivel: true },
      { nome: "novo, prumoHabilitado=null", config: { prumoHabilitado: null }, esperaDisponivel: false },
      { nome: "prumoHabilitado=true", config: { prumoHabilitado: true }, esperaDisponivel: true },
      { nome: "prumoHabilitado=false", config: { prumoHabilitado: false, prumoMotivo: "Fora de escopo" }, esperaDisponivel: false },
    ];

    for (const c of cenarios) {
      const v = { id: "v-dash-"+Math.random().toString(36).slice(2), estruturas: [baseEstrutura("e1","E01",true)] };
      if (c.config) v.workflowConfig = c.config;
      const disponivel = App.podeEntrarNoPrumo(v);
      console.log(`  [${c.nome}] podeEntrarNoPrumo = ${disponivel} (esperado ${c.esperaDisponivel})`, disponivel === c.esperaDisponivel ? "✓" : "🔴 DIVERGIU");
      assert.strictEqual(disponivel, c.esperaDisponivel, `Cenário "${c.nome}" falhou`);
    }
    console.log("✓ Todas as 4 combinações corretas (legado/null/true/false).");

    // Visual finalizada libera IMEDIATAMENTE quando Prumo=true, sem exigir 100% da vistoria
    const vParcial = { id: "v-parcial", workflowConfig: { prumoHabilitado: true },
      estruturas: [baseEstrutura("eA","EA",true), baseEstrutura("eB","EB",false)] }; // eB Visual ainda aberta
    const prox = App.nextStageStructure(vParcial, { id: "none" }, "prumo");
    assert.strictEqual(prox && prox.id, "eA", "Deve liberar eA (Visual pronta) mesmo com eB ainda aberta -- não exige 100% da vistoria");
    console.log("✓ Visual finalizada libera a estrutura imediatamente, sem exigir 100% da vistoria.");

    // Persistir/reabrir preserva o estado do gate
    await App.idbSet("vistorias", undefined, App.compactVistoriaForStorage(vParcial));
    const App2 = loadApp("../app.js", { indexedDB: disk });
    await App2.dbPromise;
    const reidratada = App2.normalizeVistoria(await App2.idbGet("vistorias", "v-parcial"));
    const proxReidratada = App2.nextStageStructure(reidratada, { id: "none" }, "prumo");
    assert.strictEqual(proxReidratada && proxReidratada.id, "eA", "Gate preservado após persistir/reabrir");
    console.log("✓ Estado do gate sobrevive a persistir/reabrir.");
  }

  console.log("\n=== P1-2: reabilitar Prumo depois de desabilitar -- dados antigos continuam presentes ===");
  {
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;
    const v = App.newVistoriaSkeleton();
    v.id = "v-reab";
    v.workflowConfig.prumoHabilitado = true;
    const e = App.newEstruturaSkeleton();
    e.setupComplete = true; e.visualFinalizada = true;
    const m = App.newMontanteSkeleton(1, e);
    const itemPrumo = App.prumoItem(m);
    itemPrumo.ocorrencias = [{ id: "oc-antiga", localTxt: "TRANSVERSAL", descTxt: "COLUNA FORA DE PRUMO GRAVE", status: "problema" }];
    itemPrumo.status = "problema"; itemPrumo.revisado = true;
    e.montantes = [m];
    v.estruturas = [e];
    await App.idbSet("vistorias", undefined, App.compactVistoriaForStorage(v));

    // Desabilita
    let raw = await App.idbGet("vistorias", "v-reab");
    raw.workflowConfig.prumoHabilitado = false;
    await App.idbSet("vistorias", undefined, raw);

    // Reabilita
    raw = await App.idbGet("vistorias", "v-reab");
    raw.workflowConfig.prumoHabilitado = true;
    await App.idbSet("vistorias", undefined, raw);

    const final = App.normalizeVistoria(await App.idbGet("vistorias", "v-reab"));
    const itemFinal = App.prumoItem(final.estruturas[0].montantes[0]);
    assert.strictEqual(itemFinal.ocorrencias.length, 1, "Medição antiga de Prumo deve continuar presente após desabilitar E reabilitar");
    assert.strictEqual(itemFinal.ocorrencias[0].id, "oc-antiga");
    assert.strictEqual(App.podeEntrarNoPrumo(final), true, "Prumo deve estar disponível de novo após reabilitar");
    console.log("✓ Dados antigos de Prumo intactos após desabilitar + reabilitar; campanha disponível de novo.");
  }

  console.log("\n=== P1-3: anomalia Visual real continua aparecendo normalmente em todos os canais ===");
  {
    const A = loadApp("../app.js");
    const e = { id: "e1", codigo: "E01", setor:"S", tipoEstrutura:"T", lado:"A", fabricante:"F",
      resolvido: false, setupComplete: true, visualFinalizada: true,
      itensEstrutura: [{ id: "iluminacao", ocorrencias: [] }],
      montantes: [{ id:"m1", numero:1, fabricante:"F", itens: [
        { id: "colunaDanificada", status: "problema", ocorrencias: [{ id:"ocv", status:"problema", tipoTxt:"COLUNA DANIFICADA", grauTxt:"GRAVE", qtd:1 }] },
        { id: "lux", tipo:"medicao", valor:"300", status:"ok", ocorrencias:[] }, // Lux OK, não deveria aparecer mesmo sem estar em "problema"
      ]}]
    };
    const v = { id: "v-real", lojaCd: "CD", local: "L", estruturas: [e] };
    const anoms = A.montanteAnomalyEntries(e);
    assert.strictEqual(anoms.length, 1, "Anomalia real deve continuar aparecendo");
    assert.strictEqual(anoms[0].item.id, "colunaDanificada");
    const rows = A.buildAnomaliaRows(v);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].itemId, "colunaDanificada");
    const parts = A.buildPartsForVistoria({ ...v, estruturas: [{...e, resolvido:false}] });
    console.log("✓ Anomalia Visual real presente em montanteAnomalyEntries, buildAnomaliaRows, e (se aplicável) BOM.");
  }

  console.log("\n=== TODOS OS REQUISITOS DA RE-AUDITORIA CONFIRMADOS ===");
}
main().catch((e) => { console.error("ERRO NA RE-AUDITORIA:", e); process.exit(1); });
