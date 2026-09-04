# vendor/jspdf.umd.min.js — passo manual pendente

O `app.js` (função `loadJsPdf()`) já está preparado para carregar o jsPDF **localmente**, deste arquivo,
antes de qualquer tentativa de CDN. Isso é o que garante que a geração de PDF funcione **offline, em modo
avião, logo na primeira vez que o app for instalado** — sem depender de internet.

**Falta um passo manual, de ~30 segundos, numa máquina com internet normal** (minha ferramenta de busca
truncou o arquivo de 356KB ao tentar baixá-lo automaticamente — é uma limitação real da minha ferramenta
pra esse arquivo específico, não algo que eu consegui contornar nesta rodada):

```bash
curl -o vendor/jspdf.umd.min.js https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
```

Ou baixe direto do navegador:
https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
→ salvar como `vendor/jspdf.umd.min.js` (exatamente esse nome, nesta pasta).

**Depois de colocar o arquivo aqui:**
1. Nada mais precisa mudar no código — `loadJsPdf()` e o `sw.js` já apontam pra esse caminho.
2. Rode `node tests/test34_pdf_engine.js` (ou a suíte completa) — os testes que dependem do arquivo real
   detectam a ausência dele e avisam claramente, em vez de falhar de forma confusa.
3. Publique a nova versão do PWA — o service worker vai cachear esse arquivo no próximo `install` (já está
   listado no `APP_SHELL`), tornando a geração de PDF garantidamente offline a partir da primeira instalação.

**Até esse arquivo ser adicionado:** `loadJsPdf()` cai automaticamente pro CDN como fallback (não travou nada
nesta entrega) — mas a garantia de "funciona sem internet desde a primeira instalação" só vale depois que
este arquivo estiver aqui de verdade.
