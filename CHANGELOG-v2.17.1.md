# Inspeção Porta-Pallet — v2.17.1

**Data:** 31/08/2026  
**Base:** v2.17  
**Objetivo:** robustez operacional, proteção contra perda de dados e desempenho em inspeções de grande escala.

## Correções críticas

### Prumo exige os dois eixos
- Um único resultado Longitudinal ou Transversal não conclui mais o montante.
- O Prumo só é resolvido quando existe:
  - um registro combinado Longitudinal + Transversal; ou
  - um resultado Longitudinal **e** um resultado Transversal.
- A tela mostra claramente qual eixo ainda falta.
- O botão de próximo montante não aparece enquanto o Prumo estiver incompleto.
- O atalho genérico `Conforme` foi removido do detalhe de Prumo para evitar resultados ambíguos.
- `Sem acesso` continua sendo uma condição resolvida operacionalmente, mas o progresso distingue **concluídos**, **medidos** e **sem acesso**.

### Proteção das anomalias existentes
- Um item que já possui ocorrências não oferece mais `Conforme` ou `N/A` como ações que apagam tudo silenciosamente.
- Para mudar o item para conforme/N/A, as ocorrências precisam ser removidas explicitamente.
- Isso protege descrições, evidências e fotos contra exclusão acidental.

### Anomalia vazia não é salva
- `Salvar anomalia` agora valida o conteúdo do rascunho.
- Exige dados mínimos coerentes, incluindo descrição e localização quando esses campos existem no catálogo.
- Quantidade precisa ser válida.
- Cancelar/voltar de um rascunho preenchido pede confirmação antes de descartar dados/fotos.

## Fluxo de campo

### Anomalias de estrutura dentro do Montante
- `Registrar anomalia` agora pesquisa tanto itens de **Montante** quanto itens gerais de **Estrutura**.
- Exemplos: 9.1 Layout, 9.34 Luminárias e 9.37 Piso podem ser registrados sem sair do Modo Campo.
- Quando a anomalia geral é aberta durante um montante, a referência é pré-preenchida com aquele montante.
- Ocorrências gerais também usam rascunho e só entram definitivamente depois de `Salvar anomalia`.

### Anomalias já registradas ficam visíveis
- A tela principal do montante mostra um bloco compacto com os componentes que já têm anomalias.
- Um toque abre o detalhe do item para revisão/edição.

### Recuperação do último montante
- Se o técnico avançar por hábito para um montante que fisicamente não existe, aparece:
  `A ESTRUTURA TERMINOU NO MONTANTE ANTERIOR`.
- A ação remove o montante extra e encerra a inspeção visual no montante anterior.

### Prumo entre estruturas
- Ao terminar o último montante de uma estrutura, o app segue diretamente para a próxima estrutura pendente de Prumo.
- Exemplo: `E-01 concluída → E-02`.
- Ao terminar a última estrutura, retorna ao painel da inspeção.

### Lux entre estruturas
- Ao finalizar Lux de uma estrutura, o app abre automaticamente a próxima estrutura pendente de Lux.
- Ao terminar a campanha, retorna ao painel da inspeção.

## Lux

- Toda aferição precisa ter **Montante / posição de referência** e **valor válido**.
- Não é mais possível finalizar Lux apenas com o número da medição.
- Ao adicionar nova aferição, o foco lógico fica primeiro na referência; o teclado numérico não abre automaticamente no valor.
- Aferição sem referência permanece `Pendente`.
- Valor abaixo do limite continua sendo anomalia técnica, mas não entra como peça de reposição.

## Desempenho e IndexedDB

### Persistência compacta — schema 4
A v2.17 gravava o catálogo completo dos ~44 itens dentro de cada montante. Em uma inspeção de 2.000 montantes isso gerava dezenas de MB de informação estática repetida.

Na v2.17.1:
- o catálogo permanece centralizado nas configurações;
- no IndexedDB são gravados somente dados de execução: status especial, N/A, ocorrências, Prumo, medições, fotos e campos alterados;
- itens visuais simplesmente conformes de um montante concluído são implícitos e não são duplicados no banco;
- ao reabrir a inspeção, os 44 itens são reconstruídos automaticamente a partir do catálogo;
- dados antigos continuam sendo normalizados e migrados automaticamente.

### Autosave
- O autosave não executa mais `getAll()` de todas as inspeções após cada salvamento.
- A inspeção atual é gravada e a lista em memória é sincronizada diretamente.

### Teste de escala
Cenário sintético: **80 estruturas / 2.000 montantes**, sem fotos/anomalias.

- modelo expandido em memória/JSON: ~54,6 MB;
- formato persistido v2.17.1: ~0,32 MB;
- redução de conteúdo estático repetido: >99%;
- salvamento completo no navegador de teste: ~150 ms no cenário extremo, antes de fotos.

> Fotos continuam sendo o principal fator de crescimento real do backup, como esperado.

## Compatibilidade

- Migração testada com modelo legado v2.14/v2.15: anomalia e foto preservadas.
- Correção `pecaDoItem()` da v2.15.1 permanece presente.
- Backup atualizado para `schemaVersion: 4`.
- Service Worker atualizado para cache `inspecao-pp-v2.17.1`.

## Cenário funcional validado

Teste em viewport móvel 390 × 844:

1. nova inspeção;
2. criação de estrutura;
3. anomalia de montante;
4. bloqueio de anomalia vazia;
5. anomalia geral de Piso registrada dentro do Modo Campo;
6. avanço acidental e recuperação do último montante;
7. segunda estrutura;
8. Prumo com apenas Longitudinal — bloqueado;
9. inclusão do Transversal — Prumo concluído;
10. transição automática de Prumo entre estruturas;
11. Lux sem referência — bloqueado;
12. Lux com referência/valor — concluído;
13. transição automática de Lux entre estruturas;
14. conclusão da inspeção;
15. relatório com anomalias;
16. lista de peças sem Lux como peça;
17. compactação/reidratação do banco;
18. migração de dado antigo com foto.

**Resultado:** PASS, sem erro JavaScript no cenário testado.
