"use strict";
const assert = require("assert");
const { loadApp } = require("./load-app");

async function main() {
  const A = loadApp("../app.js");
  console.log("=== Seção 6: reordenação em montanteItemStatus() — necessária? cria regressão? ===\n");

  // Teste 1: o estado contraditório É alcançável através do fluxo público normalizeMontanteItem?
  console.log("[1] Tentando construir o estado contraditório via normalizeMontanteItem (fluxo público)...");
  const itemContraditorio = { id: "chumbador", revisado: true, status: "problema", ocorrencias: [] };
  const normalizado = A.normalizeMontanteItem(itemContraditorio);
  console.log("  Após normalizeMontanteItem: ocorrencias.length =", normalizado.ocorrencias.length, "| status =", normalizado.status, "| revisado =", normalizado.revisado);
  console.log("  O estado contraditório sobrevive à normalização (ocorrencias=0 E status direto usado)?", normalizado.ocorrencias.length === 0);
  console.log("  -> Se ocorrencias.length > 0 aqui, a auto-conversão v2.14 SEMPRE roda antes, e a reordenação nunca chega a importar.");

  // Teste 2: mesmo assim, comparando as DUAS ordens diretamente na função crua (sem passar por normalize)
  console.log("\n[2] Comparando as duas ordens diretamente (bypassando normalizeMontanteItem de propósito)...");
  function montanteItemStatusORDEM_ANTIGA(item, ocorrenciaStatusFn) {
    const occ = (item.ocorrencias || []).map((oc) => ocorrenciaStatusFn(oc, item));
    if (occ.includes("problema")) return "problema";
    if (occ.includes("pendente")) return "pendente";
    if (occ.length && occ.every((s) => s === "ok" || s === "naoaplica")) return "ok";
    if (item.status === "naoaplica") return "naoaplica";
    if (item.revisado || item.status === "ok") return "ok";
    if (item.status === "problema") return "problema";
    return "pendente";
  }
  const casoBruto = { id: "chumbador", revisado: true, status: "problema", ocorrencias: [] }; // NUNCA passou por normalize
  const antiga = montanteItemStatusORDEM_ANTIGA(casoBruto, A.ocorrenciaStatus);
  const nova = A.montanteItemStatus(casoBruto);
  console.log("  Ordem antiga (v2.18.8) num item NUNCA normalizado:", antiga);
  console.log("  Ordem nova (v2.19.0-RC1 hardened) no MESMO item cru:", nova);
  console.log("  Diferem?", antiga !== nova, "-- mas só ocorre se ALGUÉM chamar montanteItemStatus sem antes normalizar (fora do fluxo real da UI)");

  // Teste 3: regressão em itens Visual comuns (cenários realistas, todos via fluxo normal)
  console.log("\n[3] Regressão em itens Visual comuns (todos passando por normalizeMontanteItem primeiro)...");
  const cenarios = [
    { nome: "Conforme (implícito, visual fechado)", raw: { id:"chumbador", ocorrencias: [] }, aposNormalize: { revisadoEsperado: false, statusEsperado: "pendente" } },
    { nome: "Anomalia real registrada", raw: { id:"chumbador", ocorrencias: [{status:"problema", descTxt:"X"}] }, aposNormalize: { statusEsperado: "problema" } },
    { nome: "Legado v2.14 (status problema direto, sem ocorrência)", raw: { id:"chumbador", status: "problema", ocorrencias: [] }, aposNormalize: { statusEsperado: "problema" } },
    { nome: "Marcado ok manualmente", raw: { id:"chumbador", status: "ok", ocorrencias: [] }, aposNormalize: { statusEsperado: "ok" } },
  ];
  let algumaDivergencia = false;
  for (const c of cenarios) {
    const n = A.normalizeMontanteItem(JSON.parse(JSON.stringify(c.raw)));
    const bateu = n.status === c.aposNormalize.statusEsperado;
    if (!bateu) algumaDivergencia = true;
    console.log(`  ${bateu ? "✓" : "🔴"} ${c.nome}: status final = "${n.status}" (esperado "${c.aposNormalize.statusEsperado}")`);
  }
  console.log("\n>>> Alguma regressão em cenário realista (via fluxo normal)?", algumaDivergencia ? "SIM" : "NÃO");
  console.log(">>> A reordenação é necessária pra corrigir P1-1/P1-2/P1-3?", "NÃO (só o branch tipo==='medicao' é necessário, e ele é independente da ordem dos outros 2 checks)");
  console.log(">>> Recomendação: reverter a reordenação (não necessária, risco baixo mas evitável, mantém o diff mínimo)");
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
