# Inspeção Porta-Pallet — v2.18.8 — Continuação da Validação Adversarial (T14/T15)

**Data:** 02/09/2026
**Base:** v2.18.7
**Objetivo:** dois cenários adversariais adicionais (T14, T15) mais um teste exploratório, todos pedidos após
a aprovação da v2.18.7. Ainda **candidate build — validação adversarial em andamento**.

## T14 — base64 sintaticamente válida mas vazia (`data:image/jpeg;base64,`)

**Resultado ANTES da correção:** 🔴 confirmado. `atob("")` não lança erro (string vazia é base64 válida), então
o try/catch por-foto do v2.18.7 não pegava esse caso. Consequência: criava um `photoId` de verdade, gravava um
**Blob de tamanho 0** no store `photos` (ficaria lá pra sempre, sem nenhuma rotina de limpeza), e `oc.fotos[idx]`
passava a apontar pra esse registro vazio como se tivesse migrado com sucesso. Não virava `pendingMigration` —
virava `missing` (categoria errada: "Blob nulo ou de tamanho 0", como se fosse um Blob perdido, não uma foto
de origem já vazia).

**Correção:** `if (!blob || blob.size <= 0) throw new Error(...)` logo após `base64ToBlob()`, tanto no caminho
do array `oc.fotos[]` quanto no novo caminho do formato singular (ver T15). Cai no mesmo try/catch já existente
— a foto fica como `pendingMigration`, sem gerar Blob fantasma.

**Confirmado por teste:** foto vazia permanece em base64, aparece em `pendingMigration`; a foto boa na mesma
ocorrência migra normalmente; nenhum registro de Blob size=0 é criado.

## T15 — legado pré-v2.14: `oc.foto` singular, sem `oc.fotos`

**Resultado ANTES da correção:** 🔴 bug real e diferente do T14. `normalizeVistoria()`/`occurrencePhotoRefs()`
já reconheciam corretamente o campo singular na hora de reidratar em memória — mas `migrateLegacyBase64ToPhotos()`
lê o registro CRU do IndexedDB, sem passar por `normalizeVistoria()` antes, e sua guarda
`if (!oc || !Array.isArray(oc.fotos)) return;` descartava a ocorrência inteira sem processar nada. Resultado:
a foto ficava presa em `oc.foto` (nunca convertida pra `oc.fotos`/`photoId`) indefinidamente — mesmo fechando e
reabrindo o app repetidas vezes, mesmo rodando a migração de novo. `checkPhotoIntegrity()` detectava isso
corretamente como `pendingMigration` (via `occurrencePhotoRefs`), criando uma inconsistência entre o que a
migração via e o que o checador de integridade via.

**Correção:** `migrateLegacyBase64ToPhotos()` agora reconhece esse formato diretamente — decodifica `oc.foto`,
cria o registro de foto (com a mesma checagem de blob vazio do T14), e no sucesso substitui por
`oc.fotos = [photoId]; delete oc.foto;` (equivalente ao que `normalizeOccurrence` já fazia em memória, agora
também acontece na migração de fato, persistindo).

**Confirmado por teste — ciclo real completo:** evidência preservada durante todo o processo; após migração,
`oc.fotos` = `[pho_...]` e `oc.foto` foi removido; exatamente 1 registro em `photos` (sem duplicar); depois de
fechar/reabrir, nenhum `data:image` remanescente; rodando a migração de novo, ainda exatamente 1 registro
(idempotente); `checkPhotoIntegrity` final: `isClean: true`, `pendingMigration: []`.

## Exploratório — base64 válida em sintaxe, mas não representa uma imagem decodificável

**Comportamento observado (reportado, não corrigido — conforme pedido):** `base64ToBlob()` só decodifica bytes
e embrulha num `Blob` com o `type` declarado; nunca tenta abrir/decodificar como imagem de verdade.
`checkPhotoIntegrity()` só verifica `blob.size > 0` — um Blob de bytes arbitrários (não-JPEG) passa como
`"totalValid"`, `isClean: true`. Resultado: a "migração" é bem-sucedida para um Blob que, ao ser efetivamente
renderizado como `<img>` no app, provavelmente dispara `onerror` silenciosamente (esse comportamento específico
de renderização não foi testado nesta rodada). **Não implementada nenhuma validação de decodificação de imagem
— é uma decisão de custo/benefício em aberto, não um bug isolado, conforme instrução recebida.**

## Bateria rodada nesta rodada (16 testes no total, cumulativos)

| Teste | Resultado |
|---|---|
| T14 — base64 vazia sintaticamente válida | 🔴→✅ corrigido |
| T15 — `oc.foto` singular pré-v2.14, ciclo real completo | 🔴→✅ corrigido |
| Exploratório — base64 válida não-imagem | 🟡 reportado, sem correção (por instrução explícita) |
| Regressão completa (13 testes anteriores) | ✅ todos continuam passando |

## Risco residual conhecido (atualizado)

- Fallback de decodificação de imagem: nenhuma validação de que os bytes migrados formam um JPEG real e
  renderizável — apenas que `blob.size > 0`. Uma foto "migrada com sucesso" pode ainda falhar ao exibir no
  app. Custo de corrigir (decodificar a imagem de verdade, ex. via `Image.onerror`) ainda não foi medido.
- Self-healing/preflight do Consolidar continua embutido no listener de UI, não extraído como função isolada
  testável — sem mudança desde a v2.18.6.
- A isolação por-foto e por-formato-singular cobre erros de decodificação/conteúdo vazio; erros de outra
  natureza durante a migração de uma vistoria (não relacionados a foto) ainda dependem só do try/catch externo
  por vistoria — sem mudança desde a v2.18.7.
