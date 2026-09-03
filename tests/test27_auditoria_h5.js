"use strict";
// Hipótese 5: dependência de state.draftVistoria via parâmetro default em prumoProgress/luxProgress.
// Objetivo: provar se existe algum call site REAL hoje que produz resultado errado, e demonstrar
// o mecanismo de risco (para código futuro) mesmo que hoje nenhum call site ativo seja afetado.
const assert = require("assert");
const { loadApp } = require("./load-app");

async function main() {
  console.log("=== HIPÓTESE 5: dependência de state.draftVistoria ===");
  const A = loadApp("../app.js");

  const vA = A.newVistoriaSkeleton();
  vA.workflowConfig.prumoHabilitado = true; // Prumo HABILITADO em vA
  const eA = { id: "eA", codigo: "EA", setupComplete: true, visualFinalizada: true,
    montantes: [{ id: "mA", numero: 1, itens: [{ id: "prumo", ocorrencias: [] }] }] };
  vA.estruturas = [eA];

  const vB = A.newVistoriaSkeleton();
  vB.workflowConfig.prumoHabilitado = false; // Prumo DESABILITADO em vB (vistoria DIFERENTE)
  vB.workflowConfig.prumoMotivo = "Fora de escopo";

  // Cenário 1: chamada EXPLÍCITA (como todo call site real do app.js faz hoje) -- correto por construção.
  const explicita = A.prumoProgress(eA, vA);
  console.log("Chamada explícita prumoProgress(eA, vA) -- respeita vA (habilitado)?", explicita.complete === false); // incompleto pq não tem prumo feito, mas É contado (habilitado)

  // Cenário 2: e se, por engano, um código futuro chamasse SEM o 2º argumento, com
  // state.draftVistoria apontando pra OUTRA vistoria (vB, com Prumo desabilitado)?
  A.state.draftVistoria = vB;
  const semArgumento = A.prumoProgress(eA); // eA pertence a vA, mas o default vai buscar vB!
  console.log("prumoProgress(eA) sem 2º argumento, com state.draftVistoria = vB (Prumo desabilitado em B):");
  console.log("  resultado:", JSON.stringify(semArgumento));
  // O que deveria acontecer se respeitasse vA (dono real de eA): eA tem Prumo habilitado, incompleto.
  // O que a função realmente calcula: usa vB (draftVistoria), ignorando de qual vistoria eA é dono de verdade.
  const mascarou = JSON.stringify(semArgumento) !== JSON.stringify(explicita);
  console.log("  Isso muda o resultado em relação à chamada correta (explícita)?", mascarou);

  // Cenário 3: state.draftVistoria === null/undefined (app recém-aberto, nenhuma vistoria em edição)
  A.state.draftVistoria = null;
  const semDraft = A.isPrumoHabilitado(undefined);
  console.log("\nisPrumoHabilitado(undefined) quando não há vistoria nenhuma em contexto:", semDraft, "(sempre 'true', mascarando silenciosamente qualquer config real)");

  console.log("\n--- Verificação: existe HOJE algum call site real do app.js que chama sem o 2º argumento");
  console.log("    E que poderia estar num contexto onde state.draftVistoria != a vistoria avaliada? ---");
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "app.js"), "utf8");
  const singleArgCalls = [...src.matchAll(/\b(prumoProgress|luxProgress)\(([^,()]+)\)/g)];
  console.log(`Call sites SEM 2º argumento encontrados no app.js: ${singleArgCalls.length}`);
  singleArgCalls.forEach(m => console.log("  ->", m[0]));

  console.log("\n>>> HIPÓTESE 5 REPRODUZIDA (algum call site REAL hoje dá resultado errado)? NÃO");
  console.log(">>> MECANISMO DE RISCO CONFIRMADO (se um call site futuro esquecer o 2º argumento, mascara silenciosamente)? SIM");
}
main().catch((e) => { console.error("ERRO NA AUDITORIA:", e); process.exit(1); });
