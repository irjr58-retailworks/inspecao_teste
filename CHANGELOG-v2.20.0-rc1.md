# CHANGELOG — v2.20.0-RC1 — Hardening Operacional & Dependência Offline Completa

**Data:** 04/09/2026  
**Status:** Candidate Release 1 (RC1) para Teste de Campo  
**Base Funcional:** v2.19.0-RC2  

---

## 1. Resumo da Versão

A versão **v2.20.0-RC1** consolida as correções arquiteturais e operacionais desenvolvidas a partir da v2.19.0-RC2, promovendo o app ao marco 2.20 com funcionamento 100% autônomo e offline desde a primeira instalação.

### Principais Entregas Incorporadas:

1. **Correção P0 do Draft Persistente (`v.draftOccurrenceRecovery`)**:
   - Eliminação da perda de anomalias em andamento em caso de suspensão do app pelo sistema operacional, bloqueio de tela, reload involuntário ou navegação acidental.
   - O rascunho da ocorrência em edição é persistido transacionalmente com os dados da vistoria, sem necessidade de novo Object Store no IndexedDB.
   - Restauração automática via `restoreDraftOccurrenceIfAny()`, `resumeVistoria()` e `ensureVistoria()`.
   - Limpeza transacional atômica ao clicar em "Salvar anomalia" ou "Cancelar".

2. **Detecção de Fotos Órfãs em `checkPhotoIntegrity()`**:
   - Varredura bidirecional no Evidence Storage que detecta e contabiliza fotos persistidas no IndexedDB sem referência ativa no checklist estrutural (`orphaned`).
   - Mecanismo aditivo e seguro que não quebra vistorias válidas (`isClean` mantido).

3. **Geração de PDF Real Unificada (`prepareInspectionPdf`)**:
   - Substituição de `window.print()` por renderização direta em documento binário PDF via motor integrado `buildInspectionPdf()` / `prepareInspectionPdf()`.
   - Unificação dos fluxos de "Baixar / PDF" e "Compartilhar" com o mesmo arquivo PDF e nome padronizado.
   - Proteção de interface com feedback visual e bloqueio de duplo clique.

4. **jsPDF 2.5.1 Vendorizado Localmente (100% Offline)**:
   - Substituição definitiva do placeholder pelo arquivo oficial minificado do **jsPDF 2.5.1 UMD** (`vendor/jspdf.umd.min.js`, 364.463 bytes, SHA-256: `98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875`).
   - Incluso no `APP_SHELL` do Service Worker (`CACHE_NAME = "inspecao-pp-v2.20.0-rc1"`).
   - Carregamento prioritário local via `loadJsPdf()`, garantindo geração de PDF sem qualquer dependência de internet ou CDN.

5. **Validação E2E em Navegador Real (Modo Offline / Modo Avião)**:
   - Teste automatizado de ponta a ponta (`test36_pwa_offline_jspdf_browser.js`) executado no Chrome headless via Chrome DevTools Protocol (CDP).
   - Validação da instalação limpa do Service Worker, pré-cache do `vendor/jspdf.umd.min.js`, corte total de rede (`offline: true`) e geração do primeiro PDF no ambiente offline comprovada com sucesso.

---

## 2. Parâmetros de Versão

- **`APP_VERSION`:** `"2.20.0-RC1"`
- **`CACHE_NAME`:** `"inspecao-pp-v2.20.0-rc1"`
- **Total de Testes Automatizados:** 36/36 PASS (100%)

---

## 3. Preservação de Integridade

Permanecem 100% intactos e sem alterações em relação à especificação aprovada:
- `draftOccurrenceRecovery`
- `checkPhotoIntegrity`
- `prepareInspectionPdf` e `buildInspectionPdf`
- Regras de Inspeção Visual, Prumo a Laser e Iluminação/Lux
- Evidence Storage, backup/restore ZIP e protocolo de merge multiaparelho
