"use strict";
// Auditoria independente v2.19.0-RC1 -- Hipóteses 1 e 2, provadas com código real via harness.
const assert = require("assert");
const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function baseEstrutura(id, codigo, visualFinalizada) {
  return { id, codigo, setupComplete: true, visualFinalizada,
    itensEstrutura: [{ id: "iluminacao", ocorrencias: [] }],
    montantes: [{ id: id+"_m1", numero: 1, itens: [{ id: "prumo", ocorrencias: [] }] }] };
}

async function main() {
  console.log("=== HIPÓTESE 1: decisão pendente de Prumo (prumoHabilitado === null) ===");
  {
    const A = loadApp("../app.js");
    const v = A.newVistoriaSkeleton(); // nasce com prumoHabilitado: null
    assert.strictEqual(v.workflowConfig.prumoHabilitado, null, "pré-condição: vistoria nova nasce com null");

    console.log("isPrumoHabilitado(v) com prumoHabilitado===null:", A.isPrumoHabilitado(v));
    const e1 = baseEstrutura("e1", "E01", true); // Visual finalizada
    v.estruturas = [e1];

    // 1a) nextStageStructure oferece e1 pro Prumo mesmo sem decisão explícita?
    const e0 = baseEstrutura("e0", "E00", true); v.estruturas = [e0, e1];
    const oferecida = A.nextStageStructure(v, e0, "prumo");
    console.log("nextStageStructure oferece E01 pro Prumo sem decisão explícita?", oferecida && oferecida.id === "e1");

    // 1b) countPendingInspection conta Prumo como pendência mesmo indeciso?
    const pend = A.countPendingInspection(v);
    console.log("countPendingInspection.prumo com decisão pendente:", pend.prumo, "(estruturas com Visual ok e prumo vazio:", v.estruturas.length, ")");

    // 1c) PrumoScreen renderiza normalmente (permite trabalhar) sem decisão explícita?
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;
    App.state.draftVistoria = v;
    App.state.activeEstruturaId = "e1";
    App.state.activeMontanteId = "e1_m1";
    const tela = App.PrumoScreen();
    const dump = (n, out=[]) => { out.push(n.textContent||""); (n.children||[]).forEach(c=>dump(c,out)); return out; };
    const textos = dump(tela).join(" ");
    const bloqueada = textos.includes("desabilitad") || textos.includes("pendente") || textos.includes("Defina");
    console.log("PrumoScreen mostra algum aviso de bloqueio/pendência?", bloqueada);
    console.log("PrumoScreen renderiza a interface normal de medição (MONTANTE/L+T)?", textos.includes("MONTANTE") || textos.includes("TOLERÂNCIA"));

    const reproduzido1 = Boolean(oferecida) && !bloqueada;
    console.log("\n>>> HIPÓTESE 1 REPRODUZIDA?", reproduzido1 ? "SIM" : "NÃO");
  }

  console.log("\n=== HIPÓTESE 2: Resume de Prumo desabilitado depois de iniciado ===");
  {
    const disk = makeIndexedDB();
    const App = loadApp("../app.js", { indexedDB: disk });
    await App.dbPromise;

    const v = App.newVistoriaSkeleton();
    v.id = "v-resume-test";
    v.workflowConfig.prumoHabilitado = true; // 1. Prumo habilitado
    v.lojaCd = "CD"; v.inspetor = "Fulano";
    const e1 = baseEstrutura("e1", "E01", true);
    v.estruturas = [e1];
    await App.idbSet("vistorias", undefined, App.compactVistoriaForStorage(v));

    App.state.draftVistoria = v;
    App.state.activeEstruturaId = "e1";
    App.state.activeMontanteId = "e1_m1";
    // 2. iniciar Prumo -> gera resume.mode="prumo" (é o que PrumoScreen faz via setResume ao renderizar)
    App.PrumoScreen();
    assert.ok(v.resume && v.resume.mode === "prumo", "resume.mode deve ficar 'prumo' após abrir a tela");
    console.log("resume após abrir Prumo:", JSON.stringify(v.resume));

    // 3. "voltar à vistoria" (não faz nada estrutural, só navegação)
    // 4. definir Prumo = Não realizar
    v.workflowConfig.prumoHabilitado = false;
    v.workflowConfig.prumoMotivo = "Cliente não autorizou";
    await App.idbSet("vistorias", undefined, App.compactVistoriaForStorage(v));

    // 5. clicar "Continuar de onde parei" -> resumeVistoria(v)
    let telaFinal = null;
    const origGo = App.state.__go;
    // resumeVistoria chama go(...) internamente -- precisamos capturar pra onde foi, mas go() real
    // depende do router da app inteira (fora do nosso harness). Testamos direto o que resumeVistoria
    // FARIA: reproduzimos a lógica de decisão dela (r.mode==="prumo" -> vai pra tela de prumo) e
    // confirmamos se ELA MESMA rejeita ou não antes de navegar.
    const loaded = await App.idbGet("vistorias", "v-resume-test");
    const draftReidratado = App.normalizeVistoria(loaded);
    const r = draftReidratado.resume;
    console.log("resume após desabilitar Prumo e reidratar:", JSON.stringify(r));
    const aindaApontaPraPrumo = Boolean(r && r.mode === "prumo");
    console.log("resume ainda aponta pra modo 'prumo' mesmo com Prumo desabilitado depois?", aindaApontaPraPrumo);

    // Simula o que resumeVistoria() faz: ela NÃO verifica isPrumoHabilitado antes de ir pra tela "prumo".
    // Renderiza a PrumoScreen de verdade com esse estado (Prumo desabilitado) pra confirmar se ela barra.
    App.state.draftVistoria = draftReidratado;
    App.state.activeEstruturaId = "e1";
    App.state.activeMontanteId = "e1_m1";
    const telaPrumo = App.PrumoScreen();
    const dump = (n, out=[]) => { out.push(n.textContent||""); (n.children||[]).forEach(c=>dump(c,out)); return out; };
    const textos = dump(telaPrumo).join(" ");
    const bloqueou = textos.includes("desabilitad") || textos.includes("Defina");
    console.log("PrumoScreen barra a entrada quando Prumo foi desabilitado após o resume ter sido gravado?", bloqueou);
    console.log("Compare: LuxScreen tem esse gate (isLuxHabilitado) -- PrumoScreen tem o equivalente?", bloqueou);

    const reproduzido2 = aindaApontaPraPrumo && !bloqueou;
    console.log("\n>>> HIPÓTESE 2 REPRODUZIDA?", reproduzido2 ? "SIM" : "NÃO");
  }
}
main().catch((e) => { console.error("ERRO NA AUDITORIA:", e); process.exit(1); });
