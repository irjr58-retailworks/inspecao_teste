# Inspeção Porta-Pallet — v2.17 beta de campo

Data: 31/08/2026
Base: v2.16, mantendo a correção `pecaDoItem()` incorporada na v2.15.1.

## Objetivo desta versão

Reduzir confusão entre cadastro da estrutura e início da inspeção e tornar a interface **touch-first / keyboard-aware** para uso prolongado em celular no campo.

## Nova estrutura

- Nova estrutura agora tem uma tela própria de preparação, separada do painel de uma estrutura já existente.
- Código seguinte é sugerido automaticamente quando o anterior termina em número (ex.: E-017 → E-018).
- Setor, lado, tipo e fabricante usam seleção nativa sempre que possível, evitando abrir o teclado.
- Dados recorrentes são herdados da estrutura anterior.
- Observações gerais ficam em "Mais detalhes (opcional)".
- Um único CTA principal: **CRIAR E INICIAR INSPEÇÃO →**.
- Ao confirmar, o app cria/abre o Montante 001 diretamente; não passa pelo painel de Visual/Prumo/Lux.

## Inspeção visual do montante

- Removido da tela normal o cartão grande "Checklist visual completo / pendente".
- Mantidos apenas os comandos operacionais principais:
  - Registrar anomalia
  - Buscar checklist
  - Repetir última anomalia
  - Anterior
  - Opções
  - Próximo
- CTA do montante sem problema: **✓ SEM ANOMALIAS → PRÓXIMO**.
- CTA com apontamento: **✓ SALVAR E IR PARA O PRÓXIMO**.
- Checklist completo permanece acessível por busca, sem ocupar a tela permanentemente.

## Anomalias e teclado

- "Registrar anomalia" não abre o teclado automaticamente.
- Primeiro são oferecidos componentes recentes; a busca textual só abre quando o técnico solicita "Buscar outro item".
- Descrição, tipo/componente, localização e grau passaram a priorizar selects com opção "Outro / digitar".
- Observação fica recolhida como campo opcional.
- Quantidade usa teclado numérico quando necessário.
- Selecionar uma sugestão fecha o teclado automaticamente.

## Lux

- A referência pode ser escolhida entre os montantes já conhecidos, sem digitação.
- Permanece a opção de informar outra posição manualmente.
- O valor de Lux usa teclado numérico.
- Ao adicionar uma aferição, o foco vai para o valor numérico, porque nesse ponto o teclado é intencional.

## Comportamento do teclado

- Campos focados são trazidos para a região visível da tela quando o teclado abre.
- Em telas de cadastro da estrutura, Enter/Próximo avança entre os campos visíveis.
- Durante teclado aberto, barra inferior e botões fixos são temporariamente ocultados para liberar área útil.
- Ao salvar/avançar, o campo ativo perde foco e o teclado é fechado.

## Navegação operacional

- A tela da inspeção passou a destacar Visual / Prumo / Lux como trabalhos da loja, em vez de obrigar o técnico a escolher as três etapas dentro de cada estrutura nova.
- A tela da estrutura em andamento prioriza **Continuar inspeção visual**.
- Depois de encerrar a visual da estrutura, a ação principal vira **Criar próxima estrutura**.
- Prumo e Lux continuam disponíveis para revisão/medição, preservando toda a lógica da v2.16.
- Pontos de retomada concluídos são limpos para não reabrir acidentalmente a última tela já finalizada.

## Compatibilidade

- Estruturas criadas em versões anteriores são tratadas como já cadastradas (`setupComplete=true`).
- O modelo de dados de anomalias, fotos, Prumo, Lux, relatórios, backup e lista de peças da v2.16 foi preservado.
- Até 4 fotos por ocorrência e resolução de até 1200 px / JPEG 72% permanecem inalteradas.

## Validação técnica realizada

- `app.js` validado com `node --check` após as alterações.
- Verificada a presença da correção `pecaDoItem()` da v2.15.1.
- Service Worker versionado para `inspecao-pp-v2.17`.
- Núcleo de dados de Visual / Prumo / Lux não foi reescrito nesta versão; as mudanças concentram-se no fluxo de interface e entrada de dados.

## Teste de campo recomendado

Antes de liberar para a equipe inteira, simular no celular:

1. Criar 3 estruturas consecutivas, observando quanto é necessário digitar.
2. Fazer 10–20 montantes por estrutura.
3. Registrar montantes sem anomalia e alguns com anomalias repetidas.
4. Testar busca de checklist com o teclado aberto.
5. Registrar uma anomalia usando apenas as listas de seleção.
6. Fechar e reabrir o app no meio da inspeção.
7. Encerrar a visual e criar a estrutura seguinte.
8. Depois executar Prumo e Lux para confirmar que o fluxo separado continua íntegro.
