# v2.19.0-RC1 — Fechamento para Teste de Campo

**Data:** 03/09/2026
**Status:** ✅ **GO — liberado para teste de campo**

## Histórico da validação

| Rodada | O que foi feito | Resultado |
|---|---|---|
| Revisão inicial da entrega do Antigravity | Auditoria de arquitetura, escopo, riscos | Aprovado com ressalvas de escopo |
| Fase 1 — validação adversarial Evidence Storage | Migração de fotos, merge, ZIP, atomicidade | 1 bug crítico + vários P2/P3 corrigidos ao longo de v2.18.6→v2.18.8 |
| Especificação do Inspection Workflow | Prumo/Lux opcionais, revisão 1 e 2 | Aprovada antes de codar |
| Auditoria independente da v2.19.0-RC1 (H1-H5) | 5 hipóteses, todas reproduzidas com harness antes de classificar | 3 P1 encontrados, NO-GO |
| Re-auditoria pós-hardening dos 3 P1 | Reexecução independente + novos testes de regressão | 3 P1 confirmados corrigidos, GO |
| Correção de path relativo no harness | `test27` tinha `fs.readFileSync` cwd-relativo | Corrigido, sem impacto no app |
| Avaliação da reordenação em `montanteItemStatus()` | Risco funcional avaliado e comprovadamente zero | Mantida como está (P3, sem urgência) |
| **Simulação de campo ponta a ponta** | 10 estruturas / 80 montantes, sequência real Visual→Prumo→Lux | ✅ Passou em 5 seeds diferentes |

## Estado final

- **`app.js`:** idêntico ao entregue pelo Antigravity após o hardening dos 3 P1 — nenhuma alteração adicional
  foi necessária nas rodadas seguintes de auditoria.
- **Núcleo do Evidence Storage e protocolo de merge (v2.17.6/v2.18.8):** intacto, byte a byte, confirmado em
  toda rodada de auditoria desde a v2.18.6.
- **`/tests`:** 31 testes, todos passando, robustos a partir de qualquer diretório de invocação.

## P0 abertos
Nenhum.

## P1 abertos
Nenhum.

## P2 conhecido
- `luxNaoAplicaMotivo` (motivo individual por estrutura para "Sem iluminação / Não aplicável") ausente do
  modelo/UI/merge/relatório. Registrado, não bloqueia campo.

## P3 aceitos (backlog, sem ação necessária agora)
- Branches redundantes no merge de `luxNaoAplica*` em `mergeEstrutura`.
- Reordenação em `montanteItemStatus()` não necessária, mas sem risco comprovado — reverter na próxima vez
  que a função for tocada por outro motivo.
- Mecanismo de risco do parâmetro default (`state.draftVistoria`) em `prumoProgress`/`luxProgress` — nenhum
  call site ativo afetado hoje.

## Simulação de campo — o que foi exercitado de verdade, tudo junto

Diferente dos testes anteriores (que isolam uma regra por vez), a simulação (`test31`) roda o fluxo completo
de uma inspeção de porta-pallet de tamanho real, na ordem em que um técnico realmente trabalha:

1. **Visual** — 10 estruturas, 80 montantes, anomalias aleatórias do catálogo real, salvando a cada montante
   (como a UI faz a cada toque).
2. **Prumo** — navegação sequencial real via `nextStageStructure`, incluindo "Sem acesso" e eixos L/T
   divergentes (que exigem os dois eixos resolvidos, não só o que teve a anomalia).
3. **Lux** — método sorteado (A ou B), incluindo estruturas marcadas "Sem iluminação/Não aplicável" e
   leituras abaixo do limite de 200 lux.
4. **Finalização** — só passa se Visual 100%, Prumo 100% e Lux 100% (nas estruturas aplicáveis).
5. **Fechar e reabrir o app** — persistência real confirmada.
6. **Relatório/CSV/BOM** — confirmado, na escala real da simulação, que nenhuma entrada de Lux contamina
   esses canais.

Rodada com sucesso em 5 seeds diferentes antes de fixar a seed de referência (`20260903`) usada na versão
comitada do teste — qualquer falha futura é reproduzível exatamente, não "as vezes passa".

**Nota:** dois bugs foram encontrados e corrigidos durante a construção desta simulação — ambos na própria
fixture de teste (campos `localTxt` incompletos na simulação de Prumo), não no `app.js`. Documentado aqui
para transparência do processo.
