# Inspeção Porta-Pallet — v2.18.2 — Hardening & Strict Integrity

**Data:** 01/09/2026  
**Base:** v2.18.1  
**Objetivo:** versão exclusiva de estabilização, validação estrita de pacotes ZIP/JSON, preflight atômico com zero tolerância a fotos ausentes e correção de contexto de montantes no PDF/relatório.

---

## 1. Correção no Gerador de PDF (`buildInspectionPdf`)

- **Contexto de Montante sem ReferenceError**: corrigida a referência no loop de `problemEntries` que tentava acessar `it.nome`, substituindo por `${e.codigo} · M${m.numero} · ${i.nome}`.
- **Inserção Garantida de Fotos**: ocorrências com fotos em montantes agora são devidamente decodificadas, carimbadas com marca d'água técnica e inseridas no documento PDF sem interrupções silenciosas.

---

## 2. Preparação de Imagens em Alta Resolução no `ReportScreen`

- **Visualização Rápida vs. Impressão Pericial**: o relatório na tela continua leve utilizando micro-thumbnails (80×80 px), mas ao clicar em **"Baixar / PDF"**, a aplicação substitui assincronamente as imagens da área de impressão pelas versões originais em alta resolução com a marca d'água técnica derivada, aguarda `img.decode()` e só então dispara `window.print()`.
- Impossibilita a impressão de miniaturas pixeladas ou de fotos em branco.

---

## 3. Validação Estrita de Integridade no `parseZipBlob()`

- Validação rigorosa de:
  - Assinaturas mágicas de cabeçalhos Local e Central Directory;
  - Limites de offsets e integridade de bounds do arquivo;
  - Método de compressão exclusivo Store (`0`);
  - **Checagem de CRC-32 bit a bit**: qualquer pacote ZIP com 1 byte corrompido é sumariamente rejeitado antes da extração.

---

## 4. Preflight Atômico para Restore e Consolidação

- **Inspeção Prévia Total**: antes de abrir qualquer transação de escrita no IndexedDB, o motor de importação mapeia 100% das referências `photoId` ativas das vistorias.
- **Validação de Blobs e Paths**: exige que todo `photoId` ativo possua arquivo binário existente no ZIP com `size > 0` (ou dados válidos no JSON/local).
- **Zero Modificação em Caso de Falha**: se qualquer evidência estiver ausente ou corrompida, o processo é abortado imediatamente, mantendo o banco de dados local **100% inalterado**.

---

## 5. Fortalecimento do `checkPhotoIntegrity()`

- Verifica não apenas se o ID existe no store `photos`, mas também se `record.blob` é válido e possui `size > 0`.

---

## 6. Backups de Segurança Automáticos em ZIP

- Os backups automáticos gerados antes de operações de Restore e Consolidação agora são criados no formato nativo `.zip` com preservação binária direta.

---

## 7. Storage Warning Não-Intrusivo na Tela Inicial

- O status da quota concedida pelo navegador (`checkStorageQuota`) agora é monitorado silenciosamente.
- Se o uso da cota ultrapassar 85%, é exibido um card suave de atenção na tela inicial, sem `alert()` repetitivo.

---

## Compatibilidade

- O protocolo de merge multiaparelho da v2.17.6 e a arquitetura Evidence Storage permanecem **100% preservados e comutativos**.
