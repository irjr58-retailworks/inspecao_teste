const { loadApp, makeIndexedDB } = require("./load-app");

// Simula a ROTINA REAL de preenchimento: o técnico não cria a vistoria inteira de uma vez -- ele vai
// abrindo estrutura por estrutura, montante por montante, salvando a cada toque (saveVistoriaObject
// roda normalizeVistoria + compactVistoriaForStorage + idbSet a cada save). Esse teste mede se o custo
// por save cresce (ou fica achatado) conforme a vistoria acumula estruturas/montantes/anomalias --
// é o risco real de UX em campo: a tela "engasgar" progressivamente depois de várias horas de trabalho.

function novaOcorrencia(id, desc) {
  return { id, status: "problema", descTxt: desc, grauTxt: "Leve", qtd: 1, obs: "", fotoIds: [], fotos: [], updatedAt: new Date().toISOString(), deviceOrigin: "TESTE-ROTINA" };
}

async function main() {
  const disk = makeIndexedDB();
  const App = loadApp("../app.js", { indexedDB: disk });
  await App.dbPromise;

  let vistoria = App.newVistoriaSkeleton ? App.newVistoriaSkeleton() : {
    id: "vRotina", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    lojaCd: "CD Rotina", tombstones: { estruturas:{}, montantes:{}, ocorrencias:{}, photos:{} }, estruturas: [],
  };
  vistoria.id = "vRotina";

  const TOTAL_ESTRUTURAS = 30;
  const TOTAL_MONTANTES = 72;
  const distrib = Array.from({ length: TOTAL_ESTRUTURAS }, (_, i) => (i < 12 ? 3 : 2)); // soma 72

  const tempos = [];
  let montanteGlobalIdx = 0;

  for (let e = 0; e < TOTAL_ESTRUTURAS; e++) {
    vistoria.estruturas.push({
      id: `e${e}`, codigo: `E${e+1}`, setupComplete: true, itensEstrutura: [], montantes: [],
    });
    const estrutura = vistoria.estruturas[vistoria.estruturas.length - 1];

    for (let m = 0; m < distrib[e]; m++) {
      montanteGlobalIdx++;
      estrutura.montantes.push({
        id: `m${montanteGlobalIdx}`, numero: montanteGlobalIdx,
        itens: [{ id: "item_visual", ocorrencias: montanteGlobalIdx % 3 === 0 ? [novaOcorrencia(`oc${montanteGlobalIdx}`, "Anomalia de teste")] : [] }],
      });

      // Este é o passo que a UI real dispara a cada toque: normaliza + compacta + grava.
      const t0 = Date.now();
      const normalizada = App.normalizeVistoria(JSON.parse(JSON.stringify(vistoria)));
      const compactada = App.compactVistoriaForStorage(normalizada);
      await App.idbSet("vistorias", undefined, compactada);
      const dt = Date.now() - t0;
      tempos.push(dt);
      // (Continua mutando o MESMO objeto em memória entre saves -- é assim que state.draftVistoria
      // funciona de verdade no app: fica em memória a sessão toda, não é relido do banco a cada toque.)
    }
  }

  const primeiros10 = tempos.slice(0, 10);
  const ultimos10 = tempos.slice(-10);
  const media = (arr) => arr.reduce((a,b)=>a+b,0) / arr.length;
  console.log(`Total de saves simulados: ${tempos.length} (esperado: 72)`);
  console.log(`Tempo médio dos 10 primeiros saves (vistoria pequena): ${media(primeiros10).toFixed(1)}ms`);
  console.log(`Tempo médio dos 10 últimos saves (vistoria com 72 montantes): ${media(ultimos10).toFixed(1)}ms`);
  console.log(`Tempo máximo observado num único save: ${Math.max(...tempos)}ms`);
  const fatorCrescimento = media(ultimos10) / Math.max(media(primeiros10), 1);
  console.log(`Fator de crescimento (últimos/primeiros): ${fatorCrescimento.toFixed(2)}x (informativo -- crescimento é esperado e aproximadamente linear, já que compactVistoriaForStorage reprocessa a árvore inteira a cada save; o que importa pro técnico em campo é o tempo ABSOLUTO, não essa razão)`);
  console.log(`\nPASS (tempo absoluto imperceptível mesmo no maior save já com 72 montantes: < 100ms)?`,
    Math.max(...tempos) < 100);

  // Confirma que o resultado final está correto (nada se perdeu ao longo dos 72 saves incrementais)
  const final = await App.idbGet("vistorias", "vRotina");
  const totalMontantesFinal = final.estruturas.reduce((s,e)=>s+e.montantes.length, 0);
  const totalAnomaliasFinal = final.estruturas.reduce((s,e)=>s+e.montantes.reduce((s2,m)=>s2+m.itens.reduce((s3,it)=>s3+(it.ocorrencias?it.ocorrencias.length:0),0),0), 0);
  console.log(`\nMontantes no resultado final: ${totalMontantesFinal} (esperado: 72)`);
  console.log(`Anomalias no resultado final: ${totalAnomaliasFinal} (esperado: 24, a cada 3o montante)`);
  console.log("PASS (nada perdido ao longo da rotina incremental)?", totalMontantesFinal === 72 && totalAnomaliasFinal === 24);
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
