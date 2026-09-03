"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const { makeIndexedDB } = require("./mockdb");
const { webcrypto } = require("crypto");

function loadApp(appJsPath, opts = {}) {
  const resolvedPath = path.isAbsolute(appJsPath) ? appJsPath : path.resolve(__dirname, appJsPath);
  let src = fs.readFileSync(resolvedPath, "utf8");
  // Remove a auto-invocação de boot() no fim do arquivo original — no harness de teste, quem decide
  // quando (e se) rodar boot()/migração é o próprio teste, pra não correr em paralelo com asserts.
  src = src.replace(/\/\*[^*]*Start[^*]*\*\/\s*boot\(\);\s*$/, "/* boot() removido pelo harness de teste */");

  // Stub mínimo de document/window/navigator só pra permitir a execução top-level
  // (boot() dispara no fim do arquivo, mas como as funções são "function" declarations,
  // ficam disponíveis via hoisting mesmo que boot()/render() falhem depois).
  function matches(node, sel) {
    if (sel.startsWith(".")) return (node.className || "").split(/\s+/).includes(sel.slice(1));
    return node.tagName === sel.toUpperCase();
  }
  function matchDescendant(node, sel, stopAtFirst) {
    const out = [];
    (node.children || []).forEach((c) => {
      if (stopAtFirst && out.length) return;
      if (matches(c, sel)) out.push(c);
      if (stopAtFirst && out.length) return;
      out.push(...matchDescendant(c, sel, stopAtFirst));
    });
    return out;
  }
  function stubEl(tag) {
    const node = {
      tagName: (tag || "div").toUpperCase(),
      style: {}, className: "", innerHTML: "", children: [], attrs: {}, _listeners: {},
      appendChild(child) { node.children.push(child); child.parentNode = node; return child; },
      insertBefore(child) { node.children.push(child); child.parentNode = node; return child; },
      addEventListener(type, fn) { (node._listeners[type] = node._listeners[type] || []).push(fn); },
      setAttribute(k, v) { node.attrs[k] = v; },
      querySelector(sel) { return matchDescendant(node, sel, true)[0] || null; },
      querySelectorAll(sel) { return matchDescendant(node, sel, false); },
      classList: { add(){}, remove(){}, toggle(){} },
      remove() {},
      click() { (node._listeners.click || []).forEach((fn) => fn({ target: node })); },
      getContext() { return { drawImage(){} }; },
      toBlob(cb) { cb(new Blob([new Uint8Array([1,2,3])], { type: "image/jpeg" })); },
      set src(v) { this._src = v; if (this.onload) queueMicrotask(this.onload); },
      get src() { return this._src; },
      set width(v){ this._w = v; },
      get width(){ return this._w; },
      set height(v){ this._h = v; },
      get height(){ return this._h; },
      set textContent(v) { this._text = v; },
      get textContent() { return this._text !== undefined ? this._text : (this.children || []).map(c => c.textContent || "").join(""); },
      get lastChild() { return node.children[node.children.length - 1]; },
      get firstChild() { return node.children[0]; },
    };
    return node;
  }
  const documentStub = {
    getElementById() { return stubEl("div"); },
    createElement(tag) { return stubEl(tag); },
    createTextNode(text) { return { nodeType: 3, textContent: text }; },
    addEventListener() {},
    body: stubEl("body"),
  };
  const idbMock = opts.indexedDB || makeIndexedDB();
  const sandbox = {
    console,
    Blob, TextEncoder, TextDecoder, Uint8Array, Uint32Array, Uint16Array, DataView,
    atob: (s) => {
      const cleaned = String(s).replace(/[\t\n\f\r ]/g, "");
      if (!/^[A-Za-z0-9+/]*=*$/.test(cleaned) || cleaned.length % 4 === 1) {
        const err = new Error("Failed to execute 'atob': The string to be decoded is not correctly encoded.");
        err.name = "InvalidCharacterError";
        throw err;
      }
      return Buffer.from(cleaned, "base64").toString("binary");
    },
    btoa: (s) => Buffer.from(s, "binary").toString("base64"),
    fetch: () => Promise.reject(new Error("fetch indisponível no harness de teste")),
    URL: { createObjectURL: () => "blob:mock", revokeObjectURL: () => {} },
    Image: class { set src(v) { this._src = v; if (this.onload) queueMicrotask(this.onload); } },
    FileReader: class {
      readAsDataURL(blob) { queueMicrotask(() => { this.result = "data:image/jpeg;base64,AAA="; if (this.onload) this.onload(); }); }
    },
    document: documentStub,
    navigator: { storage: { estimate: async () => ({ usage: 0, quota: 0 }), persist: async () => true, persisted: async () => true }, onLine: true },
    indexedDB: idbMock,
    setTimeout, clearTimeout, queueMicrotask, Promise, Map, Set, JSON, Math, Date, Array, Object, String, Number, Boolean,
  };
  sandbox.window = sandbox;
  sandbox.crypto = webcrypto;
  sandbox.self = sandbox;
  sandbox.global = sandbox;
  sandbox.__ui = { confirmReturn: true, alerts: [] };
  sandbox.confirm = () => sandbox.__ui.confirmReturn;
  sandbox.alert = (msg) => { sandbox.__ui.alerts.push(msg); };
  const context = vm.createContext(sandbox);

  // boot()/render() rodam de verdade (é async, dispara no fim do arquivo) mas nosso stub de DOM não
  // cobre 100% dos casos de uso da tela — isso é esperado e não nos interessa: só queremos a LÓGICA
  // pura (merge, compactação, migração, zip). Suprime qualquer rejeição não tratada vinda dessa parte.
  process.removeAllListeners("unhandledRejection");
  process.on("unhandledRejection", () => {});

  // vm.createContext NÃO expõe `const`/`let` de nível superior como propriedades do objeto sandbox
  // (só `var`/function declarations viram propriedades do global object, por spec). Como o app.js usa
  // `const` para quase tudo que precisamos inspecionar/chamar nos testes (uid, DEFAULT_CONFIG, state,
  // dbPromise, etc.), anexamos um pequeno "shim" que roda no MESMO escopo léxico do arquivo (mesma
  // vm.Script) e copia esses nomes pra globalThis.__EXPORTS__, sem alterar uma linha do app.js original.
  const exportNames = [
    "uid", "DEFAULT_CONFIG", "CATALOG_VERSION", "state", "dbPromise", "APP_VERSION", "MERGE_SCHEMA_VERSION", "DB_VERSION",
    "idbGet", "idbSet", "idbGetAll", "idbDelete", "idbTransactionApply", "ensureDeviceId", "getDeviceId",
    "migrateLegacyBase64ToPhotos", "deterministicPhotoIdFromBase64", "base64ToBlob", "blobToBase64",
    "mergeVistorias", "mergeEstrutura", "mergeMontante", "mergeMontanteItem", "mergeOccurrenceArrays",
    "resolveWinner", "isTombstoned", "mergeTombstoneMap", "unionFotos", "ensureTombstones", "recordTombstone",
    "normalizeVistoria", "normalizeOccurrence", "normalizeMontanteItem",
    "compactVistoriaForStorage", "compactOccurrenceForStorage", "compactRuntimeItemForStorage", "compactStructureItemForStorage",
    "occurrencePhotoRefs", "occurrencePhotos",
    "createZipBlob", "parseZipBlob", "crc32",
    "checkPhotoIntegrity", "persistVistoriaList", "getDeletedVistoriaIds", "deleteVistoriaCompletamente",
    "newVistoriaSkeleton", "newEstruturaSkeleton", "newMontanteSkeleton", "newOcorrencia",
    "itensMontante", "itensEstruturaCatalogo", "savePhotoBlob", "idbGetPhoto", "PhotoUrlManager",
    "ConfigScreen", "downloadZipBackup", "showProgressModal", "preflightImportPackage", "createMicroThumbBlob",
    "isPrumoHabilitado", "isLuxHabilitado", "getLuxMetodo", "luxTemDados", "calculateLuxStats", "montanteLuxItem",
    "prumoProgress", "luxProgress", "visualProgress", "countPendingInspection", "nextStageStructure",
    "touchWorkflowConfig", "touchLuxNaoAplica", "submitVistoria", "iluminacaoItem", "prumoItem", "prumoDone",
    "podeEntrarNoPrumo", "montanteAnomalyEntries", "estruturaAnomalyOccurrences",
    "buildPartsForVistoria", "buildPartsByLocation", "buildAnomaliaRows", "resumeVistoria", "PrumoScreen",
    "saveVistoriaObject", "montanteItemStatus", "ocorrenciaStatus", "statusFromMedicao", "context",
    "estruturaMedicoesInformativas", "visualItemsMontante", "LuxScreen",
    "montanteProblemEntries", "estruturaProblemOccurrences",
  ];
  const shim = "\n;globalThis.__EXPORTS__ = {};\n" + exportNames.map((n) =>
    `try { globalThis.__EXPORTS__[${JSON.stringify(n)}] = ${n}; } catch (e) {}`
  ).join("\n");

  try {
    vm.runInContext(src + shim, context, { filename: resolvedPath });
  } catch (err) {
    console.log("[loadApp] aviso: execução top-level lançou (esperado no harness):", err.message);
  }
  const exp = context.__EXPORTS__ || {};
  exp.__idb = idbMock;
  exp.__ui = sandbox.__ui;
  exp.context = context;
  exp.sandbox = sandbox;
  return exp;
}

module.exports = { loadApp, makeIndexedDB };
