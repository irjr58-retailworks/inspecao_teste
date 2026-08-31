# Inspeção Porta-Pallet — v2.16 beta de campo

Data da revisão: 31/08/2026

Base: v2.15.1 corrigida e validada pelo Claude. A correção da função `pecaDoItem()` foi preservada.

## Mudança principal: fluxo real de campo

A inspeção passou a refletir as três passagens operacionais do técnico:

1. **Inspeção Visual** — revisão detalhada das estruturas e montantes, registrando anomalias.
2. **Prumo** — passagem posterior com equipamento laser, montante por montante.
3. **Iluminação / Lux** — campanha de medições por estrutura, com um ou mais pontos de aferição.

O total de montantes continua sendo descoberto durante a inspeção visual. Depois de finalizada a estrutura, o modo Prumo passa a conhecer o total e mostra `Montante X de Y`.

## Inspeção Visual

- Prumo e Lux foram removidos do fluxo visual.
- Montante conforme continua sendo resolvido com um toque em **Conforme e próximo**.
- O botão confirma somente a inspeção visual; não cria mais resultado de Prumo automaticamente.
- Tipo/Corte e Fabricante foram compactados em chips e continuam herdando contexto.
- Observações ficam dentro da área de edição compacta.
- `Este é o último` saiu da zona de toque repetitivo. O encerramento da estrutura fica em **Opções → Encerrar estrutura neste montante**.
- Checklist completo permanece disponível, mas recolhido.
- Busca rápida de anomalia por código ou nome.
- Sugestões de anomalias recentes.
- **Repetir última anomalia**, copiando os dados técnicos, mas nunca as fotos.
- Uma nova anomalia é criada como **rascunho** e só entra na inspeção após tocar em **Salvar anomalia**. Cancelar não deixa registro vazio.

## Prumo

- Modo dedicado e sem distrações.
- Mostra estrutura, número do montante, total e progresso da etapa.
- Um toque em **L + T na tolerância** registra o resultado conforme e avança.
- Opção de detalhar eixos / fora de prumo.
- Opção `Sem acesso`.
- Resultado pode ser reaberto e editado.
- Progresso da etapa é independente da inspeção visual.

## Iluminação / Lux

- Modo dedicado por estrutura.
- Permite uma ou várias aferições.
- Cada aferição registra posição/montante de referência e valor em lux.
- Classificação automática conforme o limite configurado (atualmente ≥ 200 lux).
- Medições conformes continuam documentadas no relatório.
- Medições abaixo do limite aparecem como anomalia.
- **Aferição de iluminação não entra mais na Lista de Peças**, mesmo quando abaixo do limite.

## Progresso e retomada

- Cada estrutura mostra o progresso separado de **Visual / Prumo / Lux**.
- A inspeção só pode ser concluída quando as etapas obrigatórias estiverem concluídas.
- O app grava o ponto de retomada por modo, estrutura e montante.
- A tela inicial pode oferecer **Continuar de onde parei**.
- A navegação geral é ocultada durante os modos de campo para reduzir toques acidentais.

## Fotos e ergonomia

- Mantido o limite de até **4 fotos por ocorrência**.
- Mantida resolução máxima de **1200 px** e JPEG em **72%**, priorizando evidência técnica legível.
- No celular, as fotos usam uma faixa/grade compacta de quatro posições.
- Áreas de toque, hierarquia de informação, fontes e contraste foram reforçados para uso em campo.
- Não há rolagem horizontal nos modos Visual, Prumo e Lux em viewport de celular testado (390 × 844).

## Compatibilidade

- Inspeções antigas continuam sendo normalizadas ao abrir.
- `finalizada` da estrutura antiga é migrado para os estados Visual/Prumo/Lux quando necessário.
- `inspecionadoAt` antigo é preservado como `visualInspecionadoAt`.
- Anomalias e fotos do modelo anterior continuam compatíveis.
- Backup exportado agora identifica `schemaVersion: 3` e `appVersion: 2.16`.
- Cache do Service Worker atualizado para `inspecao-pp-v2.16`.

## Validação realizada

Foi executado um cenário automatizado em navegador móvel simulado contendo:

- criação de inspeção e estrutura sem total prévio;
- inspeção visual com anomalia 9.16;
- confirmação de que o rascunho não é persistido antes de salvar;
- avanço automático de montantes;
- confirmação de que o Visual não marca Prumo automaticamente;
- repetição de anomalia sem copiar fotos;
- encerramento da estrutura com total descoberto em campo;
- Prumo de 3 montantes com resultado L+T conforme em um toque;
- duas aferições de Lux: 250 lux (conforme) e 180 lux (anomalia);
- conclusão final da inspeção;
- geração do relatório com anomalia;
- Lista de Peças contendo somente o componente físico, sem Lux;
- migração básica de dados legados;
- ausência de erros JavaScript durante o cenário.

**Status:** candidata a teste de campo controlado antes de distribuição ampla.
