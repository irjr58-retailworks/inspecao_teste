#!/usr/bin/env node
"use strict";
// Gera um backup .json (schema v2.18.x) com 30 estruturas / 72 montantes / anomalias diversas,
// pronto pra restaurar de verdade no app (tela Ajustes -> Restaurar backup) e testar a ergonomia
// do fluxo de preenchimento manualmente no navegador.
//
// Uso: node tools/gerar-fixture-72m-30e.js > fixture-72m-30e.json

const fs = require("fs");
const path = require("path");

// Extrai o catálogo real direto do app.js, pra gerar anomalias com ids/opções que existem de verdade.
const appSrc = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const m = appSrc.match(/const DEFAULT_ITEMS = \[([\s\S]*?)\n\];/);
const CATALOGO = eval("[" + m[1] + "]");
const ITENS_MONTANTE = CATALOGO.filter((i) => i.nivel === "montante" && i.id !== "prumo");

const GRAUS = ["LEVE", "MÉDIO", "GRAVE", "GRAVÍSSIMO"];
const SETORES = ["Recebimento", "Expedição", "Armazém Geral", "Picking", "Devolução", "Estoque Alto Giro"];
const TIPOS_ESTRUTURA = ["PORTA-PALLET CONVENCIONAL", "PORTA-PALLET DRIVE-IN", "PORTA-PALLET SELETIVO"];

let seed = 42;
function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function uid() { return Math.floor(rand() * 1e12).toString(36); }
function isoOffsetMin(min) { return new Date(Date.UTC(2026, 8, 2, 8, 0, 0) + min * 60000).toISOString(); }

function gerarOcorrencia(item, minuto) {
  return {
    id: "oc_" + uid(),
    status: "problema",
    descTxt: pick(item.descOpcoes || ["ANOMALIA IDENTIFICADA"]),
    tipoTxt: pick(item.tipoOpcoes || [""]),
    localTxt: pick(item.localOpcoes || [""]),
    grauTxt: pick(GRAUS),
    qtd: 1 + Math.floor(rand() * 3),
    obs: rand() > 0.7 ? "Observação de campo registrada durante a inspeção." : "",
    correcao: "",
    fotoIds: [],
    fotos: [],
    updatedAt: isoOffsetMin(minuto),
    deviceOrigin: "FIXTURE-GERADOR",
  };
}

function gerarMontante(numero, minutoBase) {
  const itens = ITENS_MONTANTE.map((cat) => ({ id: cat.id, ocorrencias: [] }));
  // ~40% dos montantes têm pelo menos 1 anomalia; alguns têm 2-3 (anomalias diversas, não uniformes)
  const nAnomalias = rand() < 0.4 ? 1 + Math.floor(rand() * 3) : 0;
  for (let i = 0; i < nAnomalias; i++) {
    const catItem = pick(ITENS_MONTANTE);
    const item = itens.find((it) => it.id === catItem.id);
    item.ocorrencias.push(gerarOcorrencia(catItem, minutoBase + i));
  }
  itens.push({
    id: "prumo",
    ocorrencias: rand() > 0.5 ? [{
      id: "oc_" + uid(), status: "ok",
      descTxt: "COLUNA NA TOLERÂNCIA DO PRUMO", localTxt: "LONGITUDINAL / TRANSVERSAL",
      grauTxt: "", qtd: 1, obs: "", correcao: "", fotoIds: [], fotos: [],
      updatedAt: isoOffsetMin(minutoBase), deviceOrigin: "FIXTURE-GERADOR",
    }] : [], // metade dos montantes ainda SEM prumo -- rotina de preenchimento parcial, de propósito
  });
  // ~70% já com o Visual concluído (rotina real: técnico vai finalizando aos poucos, não tudo de uma vez)
  const visualFeito = rand() < 0.7;
  return {
    id: "m_" + uid(), numero,
    fabricante: pick(["Metalfrio", "Bertolini", "Fórmula Estrutural", "Provider Racks"]),
    tipoCorte: pick(["Corte reto", "Corte em bisel"]),
    updatedAt: isoOffsetMin(minutoBase),
    visualInspecionadoAt: visualFeito ? isoOffsetMin(minutoBase) : null,
    itens,
  };
}

function gerarEstrutura(indice, montantesDestaEstrutura, minutoBase) {
  const montantes = montantesDestaEstrutura.map((numero, i) => gerarMontante(numero, minutoBase + i * 2));
  const visualFinalizada = montantes.every((m) => m.visualInspecionadoAt);
  return {
    id: "e_" + uid(),
    codigo: `E${String(indice + 1).padStart(2, "0")}`,
    setor: pick(SETORES),
    tipo: pick(TIPOS_ESTRUTURA),
    rua: `Rua ${1 + (indice % 12)}`,
    lado: indice % 2 === 0 ? "A" : "B",
    fabricante: pick(["Metalfrio", "Bertolini", "Fórmula Estrutural"]),
    observacoesGerais: "",
    setupComplete: true,
    visualFinalizada,
    prumoFinalizada: false, // deixado pendente de propósito -- ver ponto do LUX/Prumo opcional
    luxFinalizada: false,
    visualUpdatedAt: isoOffsetMin(minutoBase),
    prumoUpdatedAt: null,
    luxUpdatedAt: null,
    itensEstrutura: [
      { id: "layout", ocorrencias: [] },
      { id: "luminaria", ocorrencias: [] },
      { id: "piso", ocorrencias: [] },
      { id: "iluminacao", ocorrencias: [] }, // SEM medição -- ver observação sobre LUX obrigatório no README
    ],
    montantes,
  };
}

function main() {
  const TOTAL_MONTANTES = 72;
  const TOTAL_ESTRUTURAS = 30;
  // Distribui 72 montantes em 30 estruturas de forma NÃO uniforme (2 ou 3 por estrutura, refletindo
  // ruas reais com quantidades diferentes de porta-pallet) -- 72 = 30*2 + 12, então 12 estruturas
  // ficam com 3 montantes e 18 ficam com 2.
  const distrib = [];
  for (let i = 0; i < TOTAL_ESTRUTURAS; i++) distrib.push(i < 12 ? 3 : 2);

  let numeroGlobal = 1;
  const estruturas = [];
  let minutoBase = 0;
  for (let i = 0; i < TOTAL_ESTRUTURAS; i++) {
    const qtd = distrib[i];
    const numeros = Array.from({ length: qtd }, () => numeroGlobal++);
    estruturas.push(gerarEstrutura(i, numeros, minutoBase));
    minutoBase += qtd * 3 + 5;
  }

  const totalMontantesGerados = estruturas.reduce((s, e) => s + e.montantes.length, 0);
  if (totalMontantesGerados !== TOTAL_MONTANTES) throw new Error(`Esperado ${TOTAL_MONTANTES} montantes, gerou ${totalMontantesGerados}`);

  const vistoria = {
    id: "vFixture72m30e",
    lojaCd: "CD Teste — Fixture 72m/30e",
    local: "Galpão 3",
    data: "2026-09-02",
    inspetor: "Fixture de Teste",
    createdAt: isoOffsetMin(0),
    updatedAt: isoOffsetMin(minutoBase),
    finalizada: false,
    tombstones: { estruturas: {}, montantes: {}, ocorrencias: {}, photos: {} },
    estruturas,
  };

  const backup = {
    schemaVersion: 8,
    appVersion: "2.18.8",
    deviceId: "FIXTURE-GERADOR",
    vistorias: [vistoria],
    photos: [],
    deletedVistorias: {},
    orderedParts: {},
    exportadoEm: new Date().toISOString(),
  };

  process.stdout.write(JSON.stringify(backup, null, 2));
  process.stderr.write(`\nGerado: ${TOTAL_ESTRUTURAS} estruturas, ${totalMontantesGerados} montantes.\n`);
  const totalAnomalias = estruturas.reduce((s, e) => s + e.montantes.reduce((s2, m) => s2 + m.itens.reduce((s3, it) => s3 + it.ocorrencias.length, 0), 0), 0);
  process.stderr.write(`Total de anomalias geradas: ${totalAnomalias}\n`);
}
main();
