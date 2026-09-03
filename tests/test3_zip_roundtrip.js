const { loadApp } = require("./load-app");

async function main() {
  const A = loadApp("../app.js");

  const manifestText = JSON.stringify({ hello: "mundo", n: 42 });
  const photoBytes = new Uint8Array(50000);
  for (let i = 0; i < photoBytes.length; i++) photoBytes[i] = (i * 37) % 256;

  const entries = [
    { name: "manifest.json", data: manifestText },
    { name: "photos/pho_abc.jpg", data: photoBytes },
  ];

  const zipBlob = A.createZipBlob(entries);
  console.log("Tamanho do ZIP gerado:", zipBlob.size, "bytes");

  const parsed = await A.parseZipBlob(zipBlob);
  console.log("Arquivos encontrados no ZIP:", [...parsed.keys()]);

  const m = parsed.get("manifest.json");
  console.log("manifest.json bate?", m.text() === manifestText);

  const p = parsed.get("photos/pho_abc.jpg");
  const same = p.data.length === photoBytes.length && p.data.every((b, i) => b === photoBytes[i]);
  console.log("bytes da foto batem exatamente?", same);

  // Teste adversarial: corromper 1 byte no meio do ZIP e confirmar que é rejeitado
  const buf = Buffer.from(await zipBlob.arrayBuffer());
  buf[Math.floor(buf.length / 2)] ^= 0xFF; // inverte 1 byte
  const corrupted = new Blob([buf]);
  try {
    await A.parseZipBlob(corrupted);
    console.log("!!! ZIP corrompido foi aceito sem erro (ruim)");
  } catch (e) {
    console.log("ZIP corrompido foi rejeitado corretamente:", e.message);
  }

  // Teste de escala: 200 arquivos pequenos (bem abaixo do limite de 65535 do Uint16 de contagem)
  const many = Array.from({ length: 200 }, (_, i) => ({ name: `photos/pho_${i}.jpg`, data: new Uint8Array([i, i, i]) }));
  const zip2 = A.createZipBlob(many);
  const parsed2 = await A.parseZipBlob(zip2);
  console.log("200 arquivos: todos recuperados?", parsed2.size === 200);
}
main().catch((e) => { console.error("ERRO NO TESTE:", e); process.exit(1); });
