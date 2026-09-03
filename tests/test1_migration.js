const { loadApp } = require("./load-app");

async function main() {
  const A = loadApp("../app.js");
  await A.dbPromise; // garante que o "banco" foi aberto

  // 1x1 pixel JPEG em base64 válido (dado real, não estrutura vazia)
  const FAKE_B64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

  const oc = { id: "oc1", status: "problema", fotos: [FAKE_B64], updatedAt: "2026-01-01T00:00:00.000Z", deviceOrigin: "DEV-A" };
  const vistoria = {
    id: "v1", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", deviceOrigin: "DEV-A",
    estruturas: [{
      id: "e1", itensEstrutura: [],
      montantes: [{ id: "m1", numero: 1, itens: [{ id: "item1", ocorrencias: [oc] }] }]
    }]
  };

  // Grava direto no "banco" simulando dado real vindo de um backup restaurado / boot antigo
  await A.idbSet("vistorias", undefined, vistoria);

  console.log("--- ANTES da migração ---");
  const before = await A.idbGet("vistorias", "v1");
  console.log("oc.fotos[0] começa com data:image?", before.estruturas[0].montantes[0].itens[0].ocorrencias[0].fotos[0].startsWith("data:image"));

  await A.migrateLegacyBase64ToPhotos();

  console.log("--- DEPOIS da migração ---");
  const after = await A.idbGet("vistorias", "v1");
  const fotoDepois = after.estruturas[0].montantes[0].itens[0].ocorrencias[0].fotos[0];
  console.log("valor de oc.fotos[0] no banco:", fotoDepois);
  console.log("foi migrado pra photoId (pho_...)?", typeof fotoDepois === "string" && fotoDepois.startsWith("pho_"));

  const photosStore = await A.idbGetAll("photos");
  console.log("registros no store 'photos':", photosStore.length, photosStore.map(p => p.id));
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
