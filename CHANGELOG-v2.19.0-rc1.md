# CHANGELOG — v2.19.0-RC1 — Inspection Workflow (Revisão 2 + Hardening Auditoria)

**Data:** 03/09/2026  
**Status:** Candidate Release (RC1) para Reauditoria Independente  
**Base:** v2.18.8 intacta (preservada na íntegra)

---

## 1. Resumo Executivo das Implementações

Esta versão implementa a especificação aprovada de **Inspection Workflow (Revisão 2)** e o hardening pontual dos apontamentos P1 da auditoria independente, introduzindo o gerenciamento flexível e auditável das campanhas de inspeção (Visual, Prumo e Iluminação/Lux) com total integridade de merge multiaparelho, persistência compactada e rigor estatístico.

---

## 2. Detalhamento por Módulo

### 2.1 Inspeção Visual (Obrigatória)
- Permanece 100% mandatória em todas as inspeções.
- Sem alterações na rotina de validação ou de conformidade do checklist.
- Itens de nível montante do catálogo excluem explicitamente `prumo` e `lux` da rotina visual (`visualItemsMontante(m, e)` e `montanteAnomalyEntries`).

### 2.2 Campanha de Prumo a Laser
- **Regra Crítica de Liberação Contínua Preservada**:
  - Estrutura com `visualFinalizada = false` não entra no Prumo.
  - Estrutura com `visualFinalizada = true` entra **imediatamente** na fila de Prumo via `nextStageStructure(v, current, "prumo")`, sem aguardar a conclusão visual das demais estruturas da vistoria.
- **Toggle de Campanha & Gate de Entrada (`podeEntrarNoPrumo`)**:
  - `v.workflowConfig.prumoHabilitado`: `true`, `false` ou `null` (pendente em novas vistorias).
  - Gate estrito de entrada: vistorias com decisão pendente (`null`) ou desabilitada (`false`) não acessam a tela de Prumo nem recebem estruturas na fila de avanço. Vistorias legadas sem `workflowConfig` mantêm acesso normal como na v2.18.8.
  - Quando desabilitado (`false`):
    - Não entra em `countPendingInspection(v).prumo` (retorna 0).
    - Não bloqueia a submissão e conclusão da vistoria.
    - Exige preenchimento obrigatório de justificativa (`v.workflowConfig.prumoMotivo`).
    - **Preservação de Dados**: Leituras e anomalias de prumo pré-existentes nunca são excluídas se a campanha for desabilitada.

### 2.3 Campanha de Iluminação / Lux (Opcional, Métodos A/B e Compatibilidade Legada)
- **Compatibilidade Legada (Regra Obrigatória #1)**:
  - `getLuxMetodo(v)` retorna `"LEGADO"` se a vistoria não possuir `workflowConfig` (vistorias legadas da v2.18.8).
  - Vistorias antigas mantêm exatamente a interface, o comportamento e a reidratação original, sem inclusão automática dos pontos Início/Meio/Final.
  - Em novas vistorias, `workflowConfig.luxMetodo` nasce `null` (decisão pendente).
- **Trava Operacional de Método (Regra Obrigatória #2)**:
  - `luxTemDados(v)` monitora qualquer dado operacional inserido:
    - Leituras numéricas de Lux.
    - Ocorrências resolvidas como `"naoaplica"` ("Não foi possível medir").
  - Havendo qualquer dado registrado, a troca entre Método A e Método B é bloqueada.
  - A dispensa da estrutura inteira (`e.luxNaoAplica`) não trava a seleção A/B.
- **Método A (3 Posições Fixas por Estrutura)**:
  - Pontos: Início, Meio e Final do corredor via chave `posicao` na ocorrência.
  - Cada posição pode receber medição em lux ou registro "Não foi possível medir" (`status: "naoaplica"`).
  - Conclusão da etapa exige que as 3 posições estejam resolvidas.
- **Método B (1 Medição por Montante)**:
  - Item `lux` integrado aos montantes (`montanteLuxItem(m)`).
  - Cada montante pode registrar valor em lux ou marcação de "Não foi possível medir".
  - Conclusão da etapa exige todos os montantes da estrutura resolvidos.
- **Dispensa por Estrutura (`e.luxNaoAplica`)**:
  - Opção no topo da tela para estruturas sem iluminação ou não aplicáveis.
  - Conclui a etapa da estrutura sem gerar registros artificiais no banco de dados.
- **Regra Rígida de Estatísticas Lux**:
  - `calculateLuxStats(points)` ignora categoricamente registros `"naoaplica"`.
  - Registros não medidos nunca são computados como `0 lux` nem afetam média, mínimo ou máximo.
  - Apresentação no Laudo/PDF discrimina pontos não medidos e estruturas dispensadas.

### 2.4 Persistência Compacta e Reidratação
- `compactOccurrenceForStorage(oc)` inclui `"posicao"` na lista de chaves serializadas.
- `compactRuntimeItemForStorage` e `normalizeVistoria`: `"lux"` é explicitamente excluído de `impliedVisualOk` (junto com `"prumo"`).

### 2.5 Merge Multiaparelho & Timestamps / Origins (Regra Obrigatória #3)
- `touchWorkflowConfig(v)`: gera `configUpdatedAt` e `configDeviceOrigin`.
- `touchLuxNaoAplica(e)`: gera `luxNaoAplicaUpdatedAt` e `luxNaoAplicaDeviceOrigin`.
- `mergeVistorias` e `mergeEstrutura`: resolução LWW estrita com desempate determinístico por `deviceOrigin` e `id`.

### 2.6 Hardening Auditoria Independente (Correções P1)
- **P1-1 (Prumo Decisão Pendente)**:
  - Adicionada função gate `podeEntrarNoPrumo(v)`.
  - Impede início do Prumo no Dashboard, botão "Continuar Prumo", `nextStageStructure` e bloqueia acesso em `PrumoScreen()` enquanto `prumoHabilitado === null`.
- **P1-2 (Defesa em Profundidade no Resume do Prumo)**:
  - `resumeVistoria(v)` valida `podeEntrarNoPrumo(v)` antes de navegar; neutraliza resume obsoleto caso o Prumo tenha sido desabilitado após navegação anterior.
  - Ao desabilitar Prumo em `VistoriaScreen` (`btnNao`), remove o resume ativo de prumo sem alterar nenhuma medição já gravada.
  - `ResumeCard` na HomeScreen e botão no dashboard não exibem atalho para Prumo desabilitado.
- **P1-3 (Segregação Rigorosa entre Medições Lux e Anomalias Visuais / BOM)**:
  - Criados helpers `montanteAnomalyEntries(e)` e `estruturaAnomalyOccurrences(e)` que filtram rigorosamente itens de `tipo === "medicao"`.
  - Lux abaixo do limite nunca entra nos relatórios/CSV de anomalias, no contador "anom.", na lista de anomalias da experiência visual, nem como peça a repor no BOM ou consolidação por local.
  - As leituras de Lux abaixo do limite continuam ativas e exibidas exclusivamente na seção da campanha Lux e nas estatísticas correspondentes.

---

## 3. Matriz de Testes Automatizados

Suíte completa executada com **23/23 testes aprovados (100%)**:
- Testes 1 a 21: Regressão total das proteções de migração, merge, PKZIP, CRC-32, self-healing e atomicidade da v2.18.8.
- Teste 22: Bateria cobrindo os cenários de Workflow, métodos A/B, compatibilidade legada, travas e merge.
- Teste 23: Teste adversarial dedicado aos apontamentos P1 da auditoria independente (gate `podeEntrarNoPrumo`, resume seguro, preservação de dados e isolamento completo de Lux no BOM/CSV/Anomalias).
