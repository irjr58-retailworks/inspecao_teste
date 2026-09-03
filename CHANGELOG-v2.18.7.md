# Inspeção Porta-Pallet — v2.18.7 — Continuação da Validação Adversarial

**Data:** 02/09/2026
**Base:** v2.18.6
**Objetivo:** dois casos adicionais de teste pedidos após a aprovação da v2.18.6, mais uma correção de
sincronização recomendada junto. Ainda **candidate build — validação adversarial em andamento**, não frozen.

## Caso 1 testado — migração com fotos boas e ruins misturadas no mesmo ciclo

**Cenário:** uma vistoria com 3 ocorrências de fotos válidas e 1 ocorrência com uma foto válida + uma
corrompida (mesma ocorrência), mais uma segunda vistoria inteira só com fotos válidas — tudo no mesmo lote de
migração.

**Resultado ANTES da correção:** 🔴 muito pior do que o documentado na v2.18.6. `checkOccurrence()` não tinha
try/catch por foto — uma única base64 corrompida, em QUALQUER lugar, lançava uma exceção que escapava de toda
a cadeia de loops (`for` de ocorrência → item → montante/estrutura → **vistoria inteira** → **todas as outras
vistorias do lote**) e só era pega no `try/catch` mais externo da função inteira. Na prática: 1 foto ruim
travava a migração de **tudo**, inclusive da 2ª vistoria (totalmente boa, sem nenhum problema).

**Correção:** try/catch em volta do processamento de cada foto individual, dentro de `checkOccurrence()`. Uma
falha agora só deixa aquela foto específica como está (visível depois via `pendingMigration`), sem interromper
o resto da ocorrência, da vistoria ou do lote.

**Confirmado por teste:** as 3 ocorrências boas e a segunda vistoria migraram 100% no mesmo ciclo; só a foto
corrompida ficou pendente, isolada.

## Caso 2 testado — `downloadZipBackup()` com `pendingMigration.length > 0`

**Cenário:** tentar gerar um backup ZIP normal (sem `allowDegraded`) com uma foto legada ainda pendente de
migração (mas sem nenhuma foto "ausente/corrompida" no sentido que `isClean` já cobria).

**Resultado ANTES da correção:** 🔴 o ZIP normal saía sem bloqueio nenhum — `downloadZipBackup()` só olhava
`integrity.isClean`, que nunca considera `pendingMigration`. Pior: mesmo passando `allowDegraded=true`
explicitamente, o resultado voltava `isDegraded:false`, sem o sufixo `EMERGENCIA-DEGRADADO` e sem registrar o
motivo no manifesto — ou seja, um backup com base64 legado escondido saía como se estivesse limpo.

**Correção:** o gate de `downloadZipBackup()` agora bloqueia (`allowDegraded=false`) ou marca como degradado
(`allowDegraded=true`) tanto por `missing.length` quanto por `pendingMigration.length`. A mensagem de erro e o
`degradedReport` do manifesto agora distinguem os dois motivos (evidência ausente/corrompida vs. foto legada
pendente).

**Confirmado por teste:** ZIP normal bloqueado com mensagem clara citando "foto(s) legada(s) ainda não
migrada(s)"; com `allowDegraded=true`, sai como `...-EMERGENCIA-DEGRADADO.zip`, `isDegraded:true`.

## Correção adicional recomendada — `persistVistoriaList()` após migração imediata no Restore

A migração imediata adicionada na v2.18.6 (item 2 daquele changelog) escreve direto no IndexedDB, por fora de
`state.vistorias` — sem recarregar a lista em memória depois, ela ficaria descompassada do banco (mostrando a
forma pré-migração) até algum outro refresh não relacionado acontecer. Adicionado `await persistVistoriaList()`
logo após `await migrateLegacyBase64ToPhotos()` no handler de Restaurar. Confirmado por teste: `state.vistorias`
e o registro no banco mostram o mesmo `photoId` após restaurar.

## Bateria rodada nesta rodada (13 testes no total, cumulativos com a v2.18.6)

| Teste | Resultado |
|---|---|
| Migração mista (fotos boas + 1 corrompida, mesma ocorrência, mesmo lote) | 🔴→✅ bug sério corrigido — blast radius era a migração inteira, não só a foto |
| `downloadZipBackup()` normal com `pendingMigration>0` | 🔴→✅ agora bloqueia corretamente |
| `downloadZipBackup()` com `allowDegraded=true` e `pendingMigration>0` | 🔴→✅ agora marca degradado corretamente |
| Sincronização de `state.vistorias` após migração imediata no Restore | ✅ (após correção aditiva recomendada) |
| Regressão completa (12 testes da v2.18.6) | ✅ todos continuam passando |

## Risco residual conhecido (ainda não corrigido — mesma lista da v2.18.6, sem mudança)

- Fallback `.foto` singular legado (pré-v2.14) em `occurrencePhotoRefs` — não testado adversarialmente.
- Self-healing/preflight do Consolidar continua embutido no listener de UI, não extraído como função
  isolada/testável — não é bug, mas segue dificultando revisão e teste futuros.
- A isolação por-foto agora existe dentro de uma vistoria/lote; ainda não foi testado o caso de uma vistoria
  inteira falhar por outro motivo (não relacionado a foto) durante a migração — o `try/catch` externo por
  vistoria continua sendo o único nível de isolamento pra erros que não sejam de decodificação de foto.
