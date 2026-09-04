# Suíte de testes adversariais — Evidence Storage (v2.18.x)

Harness em Node.js que carrega o `app.js` real (não uma reimplementação) num mock fiel de IndexedDB,
e testa o comportamento de verdade — não só lê o código. Usado nas rodadas de validação da v2.18.6 até a
Release Readiness Review da v2.18.8.

## Como rodar

```bash
cd tests
node run-all.js
```

Ou individualmente: `node test1_migration.js`, etc.

Sem dependências externas (não usa `npm install` — só Node.js 18+ built-in). Nenhum teste modifica `app.js`.

## Arquitetura do harness

- **`mockdb.js`** — mock de IndexedDB fiel ao spec: clone estruturado real em get/put (mutar o objeto
  retornado não afeta o que está persistido), `DataError` síncrono para uso incorreto de `put(value, key)`
  contra store com `keyPath`, **atomicidade real de transação** (puts/deletes ficam em buffer e só são
  aplicados se a transação inteira completar — uma falha no meio descarta tudo, igual ao navegador),
  e um mecanismo de "chaos" (`disk.__chaos.failAfterPuts = N`) pra simular queda de energia/interrupção
  no meio de uma operação com várias escritas.
- **`load-app.js`** — carrega `../app.js` de verdade num sandbox `vm` do Node, com stubs mínimos de
  `document`/`window`/`navigator`/`Image`/`FileReader`/`fetch`/`atob` (este último fiel ao spec: rejeita
  base64 com caracteres inválidos, como um navegador faz). Remove a auto-invocação de `boot()` do fim do
  arquivo (os testes decidem quando rodar cada etapa). Expõe as funções internas do app via
  `globalThis.__EXPORTS__` (necessário porque `vm.createContext` não expõe `const`/`let` de nível
  superior como propriedades do sandbox — só `function`/`var`).
- **`find-dom.js`** — helper pra navegar a árvore DOM fake construída pelos stubs (usado pra achar e
  disparar de verdade os listeners de `change` dos inputs de Restaurar/Consolidar, em vez de reimplementar
  a lógica deles).

## Mapa dos testes

| Arquivo | O que valida |
|---|---|
| `test1_migration.js` | Migração base64 → Blob/photoId persiste de verdade no IndexedDB |
| `test2_merge_photo_tombstone.js` | Tombstone de foto entre dois aparelhos, comutatividade |
| `test3_zip_roundtrip.js` | ZIP: round-trip byte a byte, detecção de corrupção via CRC-32, escala (200 arquivos) |
| `test4_reopen_and_interrupt.js` | Fechar/reabrir persiste migração; migração interrompida e retomada sem duplicar |
| `test5_self_healing.js` | Self-healing de Blob corrompido no Consolidar (via handler real da UI), inclusive "ambos inválidos" |
| `test6_more_than_4.js` | Merge resultando em >4 fotos numa ocorrência — nenhuma evidência descartada |
| `test7b_restore_then_reboot.js` | Restaurar backup antigo (base64 embutido) migra na hora; detecção de `pendingMigration` |
| `test8_ciclo_real.js` | Ciclo compactar→persistir→reidratar→merge→persistir→reidratar (versão inicial, foco em fotos) |
| `test9_escala.js` | 2.000 montantes, ~800 fotos — performance e integridade em escala |
| `test10_pending_migration_detection.js` | `checkPhotoIntegrity` detecta foto legada presa corretamente |
| `test11_mixed_corrupt.js` | 1 foto corrompida não trava a migração das demais (mesma ocorrência/vistoria/lote) |
| `test12_export_gate.js` | `downloadZipBackup()` bloqueia com `pendingMigration>0`; libera com `allowDegraded=true` |
| `test13_state_sync.js` | `state.vistorias` sincronizado com o banco após migração imediata no Restore |
| `test14_empty_base64.js` | Base64 sintaticamente válida mas vazia → `pendingMigration`, sem Blob fantasma |
| `test15_legacy_foto_singular.js` | Formato pré-v2.14 (`oc.foto` singular) migra corretamente, sem duplicar |
| `test16_exploratorio_nao_imagem.js` | Base64 válida mas não-imagem — comportamento reportado (sem validação de conteúdo) |
| `test17_regras_congeladas_v2176.js` | Os 4 cenários do protocolo de merge congelado da v2.17.6, validados comportamentalmente |
| `test18_restore_atomic.js` | Restaurar é atômico: falha no meio da transação não deixa nada parcialmente escrito |
| `test19_consolidate_atomic.js` | Consolidar é atômico: mesma garantia |
| `test20_ciclo_real_secao1.js` | Ciclo real completo ponta a ponta (12 passos), incluindo ZIP e restore em banco vazio |
| `test21_rotina_preenchimento_72m30e.js` | Rotina real de preenchimento incremental: 72 montantes / 30 estruturas, um save por vez — mede se o custo por save cresce de forma controlada (tempo absoluto, não só razão) conforme a vistoria acumula dados |
| `test22_workflow_prumo_lux.js` | v2.19.0-RC1 Inspection Workflow: compatibilidade legada do Lux, trava de método A/B, regra de liberação de Prumo, toggles com motivo, estatísticas de Lux, Métodos A/B, merge LWW de `workflowConfig`/`luxNaoAplica` |
| `test23_auditoria_independente.js` | Auditoria independente da v2.19.0-RC1 pré-hardening: regressão negativa de Prumo, sequência exata E01→E02→E04, persistência/reidratação, comutatividade de merge, merge vistoria legada×nova, round-trip real via Restaurar, item `"lux"` fora do Visual |
| `test24_escala_workflow_72m30e.js` | Escala: 72 montantes / 30 estruturas, Lux Método B, mistura de estruturas com Visual aberta/fechada — confirma que a navegação de Prumo nunca oferece uma estrutura com Visual em aberto, mesmo nessa escala |
| `test25_auditoria_h1_h2.js` | Auditoria independente (H1/H2) que **provou os bugs originais** antes do hardening — reexecutado depois pra confirmar a correção de forma independente do teste do Antigravity |
| `test26_auditoria_h3.js` | Auditoria independente (H3, contaminação Lux→anomalia/BOM) que **provou o bug original** — reexecutado depois pra confirmar a correção |
| `test27_auditoria_h5.js` | Auditoria independente (H5, mecanismo de risco de `state.draftVistoria` como default) — não reproduzido como bug ativo, P3 aceito, sem mudança nesta rodada |
| `test28_audit_fixes_p1_antigravity.js` | Teste de correção entregue pelo Antigravity pra P1-1/P1-2/P1-3 (arquivo original `test23_audit_fixes_p1.js`, renomeado aqui só pra não colidir com o `test23` já existente da auditoria independente — nenhum teste foi descartado na reconciliação) |
| `test29_reauditoria_p1_completa.js` | Re-auditoria fechada pós-hardening: as 4 combinações de `podeEntrarNoPrumo` (legado/null/true/false) via dashboard, persistir/reabrir, reabilitar Prumo depois de desabilitar com dados antigos intactos, anomalia Visual real preservada em todos os canais |
| `test30_auditoria_h6_montanteItemStatus.js` | Auditoria da reordenação em `montanteItemStatus()`: prova que o estado contraditório é inalcançável via `normalizeMontanteItem` no fluxo real, zero regressão em cenários Visual comuns, mudança não necessária pros P1 (recomendação: reverter por disciplina de diff mínimo, não por bug ativo) |
| `test31_simulacao_campo_10e_80m.js` | **Simulação de campo ponta a ponta:** 10 estruturas / 80 montantes, seed reproduzível, seguindo a sequência real de um técnico (Visual → Prumo → Lux → Finalizar → fechar/reabrir → Relatório/CSV/BOM). Exercita, tudo junto e na ordem real, todas as regras validadas isoladamente nos testes anteriores: liberação de Prumo por estrutura, "Sem acesso", eixos divergentes L/T, Lux Método A/B, estruturas "Sem iluminação", finalização condicionada, persistência, e ausência de contaminação Lux→anomalia/BOM. Robusto testado em 5 seeds diferentes antes de fixar a seed de referência. |

## Gerador de dados pra teste manual no navegador

`../tools/gerar-fixture-72m-30e.js` gera um backup `.json` válido (30 estruturas, 72 montantes, ~108
anomalias diversas usando o catálogo real de 44 itens, progresso parcial e realista — nem tudo finalizado)
pronto pra restaurar de verdade no app rodando num navegador, pra testar a ergonomia do fluxo de
preenchimento manualmente:

```bash
node tools/gerar-fixture-72m-30e.js > tools/fixture-72m-30e.json
# depois: abrir o app -> Ajustes -> Restaurar backup -> escolher esse arquivo
```

Validado neste harness antes de entregar (restaura sem erro, reidrata corretamente, catálogo de 44 itens por
montante intacto, integridade 100%).

## Testes 31-35 (simulação de campo, correção do P0 de anomalia perdida, motor de PDF)

| Arquivo | O que valida |
|---|---|
| `test31_simulacao_campo_10e_80m.js` | Simulação de campo ponta a ponta: 10 estruturas / 80 montantes, sequência real Visual→Prumo→Lux→Finalizar→fechar/reabrir→Relatório/CSV/BOM, seed reproduzível |
| `test32_auditoria_foto_orfa.js` | **Documenta o bug ORIGINAL** de campo (linha de base, sem a correção do draft persistente): foto tirada + interrupção antes de "Salvar anomalia" = ocorrência perdida + foto órfã. Não invoca a restauração de propósito — é o "antes" |
| `test33_correcao_draft_persistente.js` | **Prova a correção do P0**: Cenário A (reload/restauração/Save → M2 aparece certo no relatório), Cenário B (Cancelar → nem ocorrência oficial nem foto órfã), + unitários (foto legítima, foto órfã, draft sobrevive a background, save/cancel limpam o rascunho) |
| `test34_pdf_engine.js` | Motor de PDF real (`buildInspectionPdf`/`prepareInspectionPdf`): assinatura `%PDF-`, zero/uma/múltiplas fotos, múltiplos montantes, conteúdo grande (várias páginas), foto que falha não aborta o relatório, `loadJsPdf()` sem rede, nome de arquivo seguro, geração repetida sem contaminação de estado |
| `test35_regressao_pdf_campo_real.js` | **Teste de regressão obrigatório**: reproduz o caso real de campo inteiro (1 estrutura/2 montantes, ambos com anomalia+foto via fluxo real de `NewAnomalyScreen`, Visual+Prumo concluídos, Lux desabilitado, finalizar) até gerar o PDF real, confirmando M1/M2/2 anomalias/2 evidências/zero órfãs/PDF válido |

## Convenções importantes pra escrever novos testes

- **Reconciliação de catálogo:** `normalizeVistoria()` intercala itens sintéticos de teste com o catálogo
  real de 44 itens — nunca assuma `itens[0]`; procure por id (`itens.find(i => i.id === "meuId")`).
- **`File`/`Blob` reais, não `Buffer` do Node:** o método `arrayBuffer()` de um arquivo fake precisa
  devolver um `ArrayBuffer` de verdade (`Blob.arrayBuffer()` do Node já faz isso certo; não envolva em
  `Buffer.from()` sem converter de volta).
- **Dois inputs de arquivo idênticos:** as telas de Restaurar e Consolidar usam o mesmo `accept` — para
  distinguir, use a ordem de definição no DOM (`findAll(...)[0]` = Restaurar, `[1]` = Consolidar), não o
  atributo.
- **Chaos é global por disco:** `disk.__chaos.failAfterPuts` conta puts em qualquer store, de qualquer
  transação, desde a criação daquele `indexedDB` mock — sempre desarme (`= null`) depois do teste.
- **Referências ficam obsoletas depois de `normalizeVistoria`/`saveVistoriaObject`:** qualquer chamada que
  rode `normalizeVistoria` (inclusive em background, como `startNewAnomaly` agora faz) substitui os objetos
  de item por clones novos — nunca segure uma referência de `item`/`oc` através dessas chamadas; rebusque
  por id depois.
- **`window.jspdf.jsPDF` já vem pré-populado no harness** (`load-app.js`) com um jsPDF falso mas fiel —
  gera bytes de PDF genuinamente válidos (`%PDF-...%%EOF`), suficiente pra testar a orquestração real de
  `buildInspectionPdf` sem precisar de um navegador de verdade. Não é o jsPDF real — não use pra validar
  layout/renderização visual, só estrutura/conteúdo/resiliência a erro.
