const { loadApp, makeIndexedDB } = require("./load-app");
const { findAll } = require("./find-dom");

function fakeFile(name, jsonObj) {
  const text = JSON.stringify(jsonObj);
  return { name, type: "application/json", text: async () => text, arrayBuffer: async () => Buffer.from(text) };
}

async function main() {
  const disk = makeIndexedDB();
  const A = loadApp("../app.js", { indexedDB: disk });
  await A.dbPromise;

  const oldBackup = {
    vistorias: [{
      id: "vSync", createdAt: "2025-06-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z", lojaCd: "Loja Sync",
      estruturas: [{ id: "e1", codigo: "E01", itensEstrutura: [], montantes: [{ id: "m1", numero: 1, itens: [
        { id: "item1", ocorrencias: [{ id: "oc1", status: "problema", fotos: ["data:image/jpeg;base64," + Buffer.from("fotoreal").toString("base64")], updatedAt: "2025-06-01T00:00:00Z" }] }
      ]}]}]
    }],
    deletedVistorias: {},
  };

  const wrap = A.ConfigScreen();
  const inputs = findAll(wrap, (n) => n.tagName === "INPUT" && n.attrs && n.attrs.type === "file" && (n.attrs.accept || "").includes(".zip"));
  const restoreInput = inputs[0];
  const file = fakeFile("backup.json", oldBackup);
  for (const fn of restoreInput._listeners.change || []) await fn({ target: { files: [file], value: "" } });

  const emState = A.state.vistorias.find(v => v.id === "vSync");
  const emBanco = await A.idbGet("vistorias", "vSync");

  const fotoEmState = emState.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0].fotos[0];
  const fotoEmBanco = emBanco.estruturas[0].montantes[0].itens.find(i=>i.id==="item1").ocorrencias[0].fotos[0];

  console.log("foto em state.vistorias:", fotoEmState);
  console.log("foto no banco:         ", fotoEmBanco);
  console.log("state.vistorias está sincronizado com o banco (ambos já migrados, mesmo photoId)?", fotoEmState === fotoEmBanco && fotoEmState.startsWith("pho_"));
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
