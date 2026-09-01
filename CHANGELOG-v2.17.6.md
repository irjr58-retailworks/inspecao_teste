# Inspeção Porta-Pallet — v2.17.6 — Merge Freeze

**Data:** 01/09/2026
**Base:** v2.17.5
**Objetivo:** fechar os 4 últimos gaps do protocolo de merge, sem nenhuma funcionalidade nova. Depois desta versão, o protocolo multiaparelho fica congelado — a próxima reforma (fotos em Blob) é tratada isoladamente.

## 1. Finalização da vistoria com timestamp próprio

`finalizada` dependia de `vistoria.updatedAt`, que muda em qualquer salvamento — podia voltar a `false` (ou virar `true` incorretamente) num merge sem relação com o estado real da inspeção.

Corrigido: `v.finalizadaUpdatedAt`/`v.finalizadaDeviceOrigin`, tocados só quando a inspeção é de fato concluída (botão "Concluir inspeção"). O merge decide `finalizada` por esse timestamp — e, adicionalmente, **valida o resultado consolidado**: se a mescla introduzir alguma pendência real (usando a mesma checagem que já existia pra liberar o botão de concluir — Visual/Prumo/Lux completos em todas as estruturas), `finalizada` é revertida pra `false` mesmo que um dos lados dissesse `true`, exigindo nova finalização explícita.

## 2. `touchMontanteMeta()` não compete mais com `visualFinalizada`

Removida a chamada a `touchStage(e,"visual")` de dentro de `touchMontanteMeta()`. Editar Fabricante/Tipo/Observação do montante agora só toca `metaUpdatedAt`/`metaDeviceOrigin` — nunca mais interfere, nem de forma indireta, na etapa de inspeção visual.

## 3. `setupComplete` comutativo

Era decidido pela lógica geral de "quem ganha o objeto" — podia dar resultados diferentes dependendo da ordem do merge (A→B ≠ B→A). Corrigido: `setupComplete = local.setupComplete || incoming.setupComplete` — uma vez completo em qualquer aparelho, fica completo pra sempre, nos dois sentidos.

## 4. Exclusão integral da vistoria em transação atômica

Tombstone (`config/deletedVistorias`) e a exclusão do registro (`vistorias`) eram duas escritas separadas. Corrigido: as duas agora acontecem na mesma `idbTransactionApply()` — tudo ou nada.

## Teste obrigatório: ciclo real (salvar → compactar → reabrir → exportar → consolidar)

Diferente de testes anteriores que checavam objetos em memória, esta rodada passou tudo pelo ciclo real de persistência (compactar, gravar num IndexedDB simulado, fechar/reabrir) antes de mesclar, exatamente como pedido:

- **Finalização × navegação em cópia stale**: A finaliza e persiste de verdade; B (com cópia antiga, não finalizada) só navega/salva depois — mesmo com `updatedAt` de B "mais novo" por causa da navegação, a finalização de A prevaleceu corretamente ao consolidar.
- **Visual finalizado × alteração posterior só de Fabricante/Tipo/Obs**: Visual concluído em C preservado; Fabricante e Observação alterados depois em D também preservados — nenhum dos dois "comeu" o outro.
- **`setupComplete` true × false**: confirmado comutativo (resultado idêntico nos dois sentidos de merge).
- **Atomicidade da exclusão completa**: registro sumiu do banco e o tombstone foi gravado na mesma operação.

**Reteste de regressão** (rodadas anteriores: Prumo×Lux, foto×grau, escala de 2.000 montantes): tudo continua correto, sem regressão. **Bateria completa de telas**: sem erros.

## Compatibilidade

- `MERGE_SCHEMA_VERSION` subiu pra 7 (essa rodada adiciona `finalizadaUpdatedAt` e corrige `setupComplete`). Backups da v2.17.5 e anteriores continuam sendo **restaurados** normalmente, mas precisam ser gerados de novo pra **Consolidar**.
- Nenhuma mudança nos object stores do IndexedDB.

## Protocolo de merge: congelado

Com esta versão, considero o protocolo de sincronização/consolidação entre aparelhos fechado — cinco rodadas de revisão (v2.17.2 a v2.17.6), cada uma pegando um problema real e cada vez mais sutil, sem nenhuma regressão nos testes das rodadas anteriores. A próxima etapa (fotos em Object Store separado, com `photoId`, `Blob` e `deletedAt` por foto) é uma reforma isolada, tratada à parte — sem mexer mais no que foi validado aqui.
