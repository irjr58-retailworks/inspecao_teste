"use strict";
// Mock mínimo e FIEL ao spec de IndexedDB, só o suficiente pro app.js rodar em Node.
// Pontos fiéis de propósito:
//  1) objectStore com keyPath lança DataError síncrono se put(value, key) receber key explícita.
//  2) get()/getAll() fazem clone estruturado (como o navegador faz) — mutar o objeto retornado
//     NÃO deve afetar o que está persistido.
//  3) Suporte a "chaos": permite forçar uma falha após N put()s, pra simular queda de energia
//     no meio de uma operação de várias escritas (usado no teste de migração interrompida).
//  4) ATOMICIDADE DE VERDADE: put()/delete() dentro de uma transação ficam em buffer (pendentes) e só
//     são aplicados aos stores reais quando a transação completa com sucesso. Se qualquer operação da
//     transação falhar, o buffer inteiro é descartado — nada do que já tinha "funcionado" antes da
//     falha fica persistido. Isso é o que dá sentido real a idbTransactionApply() ser "tudo ou nada".

class DOMExceptionLike extends Error {
  constructor(name, message) { super(message); this.name = name; }
}

function structuredCloneish(value) {
  if (value instanceof Blob) return value; // Blob é imutável — compartilhar a referência equivale ao clone estruturado real
  if (Array.isArray(value)) return value.map(structuredCloneish);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = structuredCloneish(value[k]);
    return out;
  }
  return value;
}

function makeDB(chaos) {
  const stores = new Map(); // name -> { keyPath, data: Map }

  class FakeRequest {
    constructor() { this.onsuccess = null; this.onerror = null; this.result = undefined; this.error = null; }
    _succeed(result) { this.result = result; queueMicrotask(() => { if (this.onsuccess) this.onsuccess({ target: this }); }); }
  }

  class FakeObjectStore {
    constructor(name, tx) { this.name = name; this._store = stores.get(name); this._tx = tx; }
    get(key) {
      const req = new FakeRequest();
      // Lê o estado real MAIS qualquer escrita pendente desta mesma transação ainda não commitada
      // (read-your-own-writes), igual ao IndexedDB de verdade.
      const pending = this._tx._pendingFor(this.name, key);
      queueMicrotask(() => req._succeed(pending !== undefined ? structuredCloneish(pending.value) : structuredCloneish(this._store.data.get(key))));
      return req;
    }
    getAll() {
      const req = new FakeRequest();
      queueMicrotask(() => {
        const merged = new Map(this._store.data);
        this._tx._pendingAllFor(this.name).forEach((op) => {
          if (op.type === "put") merged.set(op.key, op.value);
          else merged.delete(op.key);
        });
        req._succeed([...merged.values()].map(structuredCloneish));
      });
      return req;
    }
    put(value, key) {
      const kp = this._store.keyPath;
      if (kp) {
        if (key !== undefined) { this._tx._fail(); throw new DOMExceptionLike("DataError", "The object store uses in-line keys and the key parameter was provided"); }
        key = value[kp];
        if (key === undefined) { this._tx._fail(); throw new DOMExceptionLike("DataError", "Evaluating the object store's key path did not yield a value"); }
      } else if (key === undefined) {
        this._tx._fail();
        throw new DOMExceptionLike("DataError", "The object store uses out-of-line keys and has no key generator and the key parameter was not provided");
      }
      // Chaos: se armado, simula queda de energia depois de N put()s bem-sucedidos (contagem GLOBAL,
      // entre todos os stores — imita "o app foi fechado no meio da operação", não um store específico).
      if (chaos.failAfterPuts !== null) {
        if (chaos.putCount >= chaos.failAfterPuts) { this._tx._fail(); throw new Error("Falha simulada (app fechado / queda de energia no meio da operação)"); }
        chaos.putCount++;
      }
      const req = new FakeRequest();
      this._tx._stage(this.name, "put", key, structuredCloneish(value));
      queueMicrotask(() => req._succeed(true));
      return req;
    }
    delete(key) {
      const req = new FakeRequest();
      this._tx._stage(this.name, "delete", key, undefined);
      queueMicrotask(() => req._succeed(true));
      return req;
    }
    createIndex() { /* no-op pro nosso propósito */ }
  }

  class FakeTransaction {
    constructor(storeNames) {
      this._storeNames = storeNames;
      this.oncomplete = null; this.onerror = null; this.onabort = null;
      this._done = false; this._aborted = false; this._failed = false;
      this._pending = []; // [{store, type, key, value}] -- só vira realidade se a tx completar com sucesso
    }
    objectStore(name) {
      if (!stores.has(name)) throw new Error("NotFoundError: object store not found: " + name);
      return new FakeObjectStore(name, this);
    }
    _stage(store, type, key, value) { this._pending.push({ store, type, key, value }); }
    _pendingFor(store, key) {
      for (let i = this._pending.length - 1; i >= 0; i--) {
        const op = this._pending[i];
        if (op.store === store && op.key === key) return op.type === "delete" ? { value: undefined } : op;
      }
      return undefined;
    }
    _pendingAllFor(store) { return this._pending.filter((op) => op.store === store); }
    _fail() { this._failed = true; }
    _scheduleComplete() {
      if (this._done || this._aborted) return;
      queueMicrotask(() => {
        if (this._failed) {
          // ROLLBACK: descarta todo o buffer pendente. Nada do que já parecia ter "funcionado" antes
          // da falha é aplicado aos stores reais -- exatamente o comportamento que idbTransactionApply()
          // depende pra "tudo ou nada" ter sentido de verdade.
          this._aborted = true;
          if (this.onabort) this.onabort();
          return;
        }
        // COMMIT: aplica todo o buffer de uma vez.
        for (const op of this._pending) {
          const s = stores.get(op.store);
          if (op.type === "put") s.data.set(op.key, op.value);
          else s.data.delete(op.key);
        }
        this._done = true;
        if (this.oncomplete) this.oncomplete();
      });
    }
  }

  return {
    objectStoreNames: { contains: (n) => stores.has(n) },
    createObjectStore(name, opts) {
      const s = { keyPath: (opts && opts.keyPath) || null, data: new Map() };
      stores.set(name, s);
      return new FakeObjectStore(name, { _stage(){}, _pendingFor(){return undefined;}, _pendingAllFor(){return [];}, _fail(){} });
    },
    transaction(names, mode) {
      const arr = Array.isArray(names) ? names : [names];
      const tx = new FakeTransaction(arr);
      queueMicrotask(() => tx._scheduleComplete());
      return tx;
    },
    _stores: stores,
  };
}

// Cria um "disco" persistente compartilhável entre múltiplas aberturas de indexedDB.open()
// (simula fechar/reabrir o app sem perder o que já foi gravado).
function makeIndexedDB(sharedDb = null) {
  const chaos = { failAfterPuts: null, putCount: 0 };
  const holder = { db: sharedDb };
  const idb = {
    open(name, version) {
      const req = { onupgradeneeded: null, onsuccess: null, onerror: null, result: null };
      queueMicrotask(() => {
        if (!holder.db) holder.db = makeDB(chaos);
        const db = holder.db;
        if (req.onupgradeneeded) req.onupgradeneeded({ target: { result: db } });
        req.result = db;
        if (req.onsuccess) req.onsuccess({ target: req });
      });
      return req;
    },
    __chaos: chaos,
    __getDb: () => holder.db,
  };
  return idb;
}

module.exports = { makeIndexedDB };
