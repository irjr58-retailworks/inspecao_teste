# Backlog de Requisitos — Inspeção Porta-Pallet

Requisitos levantados pelo usuário, registrados para implementação futura. **Nada aqui foi codado ainda.**

---

## REQ-001 — Prumo e Lux não podem ser obrigatórios por estrutura

**Levantado em:** 02/09/2026, durante a validação da Evidence Storage (v2.18.8).

**Problema relatado pelo usuário:** hoje os "3 grandes trabalhos" (Visual, Prumo, Lux) tratam Prumo e Lux
como etapas que toda estrutura precisa cumprir. Na prática, existem locais sem iluminação nenhuma (Lux não
tem o que medir) e situações em que não é possível ou não faz sentido medir o Prumo de uma estrutura
específica (ex: sem acesso, estrutura interditada, fora de escopo daquela vistoria). O técnico precisa de uma
opção explícita de **"Não fazer Prumo"** / **"Não fazer Lux"** por estrutura, distinta de "ainda não fiz".

**Por que isso não é uma mudança trivial (motivo de não ter sido codado na hora):**

- `luxProgress(e).complete` hoje exige `validOccs.length > 0` — ou seja, uma estrutura sem NENHUMA medição
  de Lux nunca pode ser marcada como completa. Um "não se aplica" explícito precisa de um caminho que
  contorne essa exigência sem abrir brecha pra alguém marcar "não se aplica" só pra pular o trabalho.
- `prumoFinalizada`/`luxFinalizada` são campos de **estrutura**, e estruturas participam do protocolo de
  merge congelado (`mergeEstrutura`, com seus próprios timestamps `prumoUpdatedAt`/`luxUpdatedAt` separados).
  Um novo estado "não aplicável" (`prumoNaoAplica`/`luxNaoAplica`, ou similar) precisa de:
  - Seu próprio timestamp granular (`prumoNaoAplicaUpdatedAt`?), pro merge saber decidir quem venceu se um
    aparelho marcar "não aplica" e outro registrar uma medição de verdade depois.
  - Uma regra clara de precedência: se um aparelho mede o Prumo de verdade DEPOIS de outro ter marcado "não
    aplica", a medição real deveria vencer (evitar que "não aplica" fique "grudado" para sempre).
  - Impacto em `countPendingInspection()` (não deve mais contar como pendência) e em qualquer relatório/PDF
    que hoje trata Prumo/Lux ausente como "pendente".
- Esse tipo de mudança — nova regra de precedência dentro do protocolo de merge — é exatamente a categoria
  de alteração que, historicamente neste projeto, levou 5 rodadas de revisão adversarial antes de ser
  confiável (ver `CHANGELOG-v2.17.6.md`). Não deve ser feita apressadamente.

**Próximo passo sugerido (quando for priorizado):** desenhar o novo campo/estado a dois, revisar como ele se
encaixa no merge ANTES de codar (mesmo processo usado pra Evidence Storage), e só então implementar com o
mesmo rigor de teste da suíte em `/tests`.

---

## REQ-002 — Backlog técnico carregado das rodadas de validação da Evidence Storage

Itens já identificados, classificados como P2/P3 (não bloqueiam release), sem correção ainda:

- **P2** — Nenhuma validação de que os bytes migrados de uma foto legada formam uma imagem decodificável de
  verdade (só se checa `blob.size > 0`). Uma foto pode "migrar com sucesso" e ainda falhar ao renderizar.
- **P3** — Não existe rotina de limpeza (GC) de Blob órfão quando uma foto é excluída individualmente (a
  vistoria continua viva) — o store `photos` só cresce ao longo do tempo.
- **P3** — Self-healing/preflight do Consolidar está embutido no listener de UI, não extraído como função
  isolada testável (diferente do resto do protocolo de merge, que é todo função pura).

## REQ-003 — Achado da auditoria independente da v2.19.0-RC1 (não-bloqueante)

O bloco de merge de `e.luxNaoAplica*` em `mergeEstrutura` tem 2 branches `else if` adicionais, além do
padrão de 1 branch já usado por `metaUpdatedAt`/`resolvidoUpdatedAt`. Pela leitura de `resolveWinner`/
`newer()` (que já tratam corretamente o caso de timestamp ausente de um dos lados), esses branches extras
parecem nunca ser alcançados de forma distinta do que o branch principal já resolve — código a mais que não
causa bug, mas também não agrega. **P3, baixa prioridade** — simplificar de volta ao padrão de 1 branch na
próxima vez que essa função for tocada por outro motivo (não vale abrir uma mudança só para isso).

## REQ-004 — Achados da re-auditoria pós-hardening dos 3 P1 (02-03/09/2026)

- **P2 ainda pendente (confirmado, não regrediu, não foi escopo desta rodada):** `luxNaoAplicaMotivo` segue
  ausente do modelo/UI/merge/relatório — ver REQ anterior sobre H4.
- **P3 — reordenação em `montanteItemStatus()` não necessária:** o hardening dos P1 trocou a ordem entre o
  check de `item.status==="problema"` e `item.revisado||item.status==="ok"`, além de adicionar o branch
  `tipo==="medicao"` (esse sim necessário pro Lux). A reordenação, por si só, não é necessária pra nenhum dos
  3 P1 e só produz resultado diferente num item que NUNCA passou por `normalizeMontanteItem()` — o que não
  acontece no fluxo real do app (confirmado por teste: a auto-conversão de status legado v2.14 sempre roda
  antes, tornando o estado contraditório inalcançável). Zero regressão confirmada em cenários Visual comuns.
  Recomendação: reverter a reordenação (mantém só o branch `tipo==="medicao"`) na próxima vez que a função for
  tocada, por disciplina de diff mínimo — não é bug ativo, não bloqueia nada.
- **P3 — mecanismo de risco do parâmetro default em `prumoProgress`/`luxProgress` (H5):** sem mudança desde a
  rodada anterior. Nenhum call site ativo afetado; risco latente pra código futuro, documentado, sem ação
  necessária agora.
