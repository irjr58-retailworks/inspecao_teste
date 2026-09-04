# v2.19.0-RC2 — Correção do P0 de perda de anomalia + PDF real

**Data:** 04/09/2026
**Base:** v2.19.0-RC1
**Escopo desta rodada:** (1) corrigir o P0 de perda de anomalia real de campo com um draft persistente
isolado; (2) trocar `window.print()` por geração de PDF real no botão "Baixar / PDF"; (3) unificar
"Baixar" e "Compartilhar" no mesmo motor; (4) vendorizar jsPDF localmente (parcialmente concluído — ver
pendência abaixo); (5) detecção reversa de foto órfã em `checkPhotoIntegrity()`.

---

## 1. P0 — Perda de anomalia (foto órfã real de campo)

Ver relatório de auditoria completo na conversa. Resumo:

**Causa raiz:** `state.draftOccurrence` existia só em memória até o clique de "Salvar anomalia". A foto,
por outro lado, já persistia no IndexedDB assim que tirada. Bloqueio de tela / app em segundo plano / reload
— tudo evento normal de uso móvel — descartava a ocorrência em edição, deixando a foto já persistida órfã.

**Correção — draft persistente isolado, sem Object Store novo:** `v.draftOccurrenceRecovery` guarda
`estruturaId`, `montanteId`, `itemId`, a ocorrência completa em edição (mesma referência de objeto que
`state.draftOccurrence.occurrence` — qualquer edição de campo ou foto propaga automaticamente) e
`updatedAt`. Persiste na mesma gravação já usada pra vistoria (nenhum mecanismo novo). Nunca aparece em
relatório/progresso/BOM (nenhuma dessas funções lê esse campo). `mergeVistorias` não precisou de nenhuma
mudança (spread padrão já resolve por "quem tocou por último", aceitável pra dado local/efêmero).

## 2. Funções alteradas

| Função | Mudança |
|---|---|
| `touchDraftRecovery()` | Nova — toca o timestamp do rascunho de recuperação |
| `startNewAnomaly()` | Cria `v.draftOccurrenceRecovery` e persiste ao iniciar a anomalia |
| `NewAnomalyScreen()` | Cada campo toca+persiste (debounced); "Salvar anomalia" limpa o rascunho de recuperação na mesma gravação que confirma a ocorrência oficial |
| `cancelDraftAnomaly()` | Também limpa `v.draftOccurrenceRecovery` e persiste (fotos já eram limpas) |
| `restoreDraftOccurrenceIfAny()` | Nova — restaura a tela/ocorrência sem nunca virar oficial sozinha |
| `resumeVistoria()` | Checa rascunho de recuperação antes da lógica normal de "continuar" |
| `ensureVistoria()` | Checa rascunho de recuperação sempre que uma vistoria é (re)carregada |
| `checkPhotoIntegrity()` | Detecção reversa (`orphaned`) — aditiva, não altera `isClean` |
| `loadJsPdf()` | Tenta `./vendor/jspdf.umd.min.js` primeiro; CDN só como fallback não-obrigatório; detecta placeholder/local ausente e cai pro CDN automaticamente |
| `prepareInspectionPdf()` | Nova — motor único compartilhado por "Baixar" e "Compartilhar" |
| `ReportScreen()` — botão "Baixar / PDF" | Trocado `window.print()` por `prepareInspectionPdf` + `download()`, com UX de carregamento/sucesso/erro e proteção contra duplo clique |
| `ReportScreen()` — botão "Compartilhar" | Trocado texto-só (`shareReport`) por PDF real via `navigator.share`, mesmo motor |

**Nenhuma mudança em:** Evidence Storage, fotos (arquitetura), backup/restore, merge, regras Visual/Prumo/Lux,
classificação de anomalias, layout do relatório.

## 3. Arquivo jsPDF vendorizado — pendência manual não-bloqueante

`vendor/jspdf.umd.min.js` está como **placeholder válido** (script vazio, sem erro de sintaxe — não quebra
a instalação do service worker). Minha ferramenta de busca truncou o arquivo real de 356KB nas duas
tentativas de download automático. `loadJsPdf()` já detecta essa situação (placeholder carregado mas sem
`window.jspdf.jsPDF`) e cai automaticamente pro CDN — **nada quebra hoje**, mas a garantia de "100% offline
desde a instalação limpa" só vale depois que o arquivo real for colocado no lugar do placeholder.
Instruções de 1 comando em `vendor/README.md`.

## 4. Testes novos (35 no total, todos passando)

| Teste | Cobre |
|---|---|
| `test32` (atualizado) | Documenta o bug ORIGINAL como linha de base (não usa a correção de propósito) |
| `test33` | Prova a correção: Cenário A (reload→restauração→Save→relatório correto), Cenário B (Cancelar limpo), + 3 unitários |
| `test34` | Motor de PDF: assinatura `%PDF-`, 0/1/N fotos, múltiplos montantes, conteúdo grande, foto que falha não aborta, offline sem CDN, nome de arquivo seguro, geração repetida sem contaminação |
| `test35` | **Regressão obrigatória do caso de campo**, ponta a ponta até o PDF real |

## 5. Regressão

**35/35 testes passando.**

## P0/P1 abertos após esta rodada

Nenhum.

## GO/NO-GO

**GO** para repetir o teste físico que originalmente encontrou o problema. Recomendo completar o passo
manual do `vendor/jspdf.umd.min.js` antes do teste de campo, pra validar a geração de PDF 100% offline —
embora o fallback pro CDN já torne a funcionalidade utilizável mesmo sem esse passo, caso o teste físico
precise ocorrer antes.
