# Inspeção Porta-Pallet — v2.18.6 — Validação Adversarial da Evidence Storage

**Data:** 02/09/2026
**Base:** v2.18.5
**Objetivo:** primeira rodada de teste adversarial de verdade (Fase 1) sobre a arquitetura Evidence Storage
(v2.18.0–v2.18.5), rodando o comportamento real de IndexedDB em vez de só ler o fluxo do código. Esta versão
**não é uma "baseline congelada"** — é uma correção pontual de bugs achados por teste, com a mesma arquitetura
de base. Ver seção final sobre por que a linguagem de "frozen" foi abandonada por enquanto.

## Metodologia

Harness em Node.js com um mock de IndexedDB fiel ao spec (inclusive nos detalhes que costumam esconder bugs:
clone estruturado real em get/put, erro síncrono `DataError` ao usar `put(value, key)` num store com
`keyPath`, `atob()` que rejeita base64 inválido como um navegador faz). O `app.js` real foi carregado e
executado nesse ambiente — nenhuma lógica foi reimplementada pra ser testada; os testes chamam as funções e,
onde a lógica mora dentro de um listener de UI (Consolidar/Restaurar), o teste renderiza a tela de verdade e
dispara o evento real.

## 1. Bug crítico corrigido — migração de fotos legadas nunca persistia

`migrateLegacyBase64ToPhotos()` gravava a vistoria migrada com `idbSet("vistorias", v.id, ...)`. O store
`vistorias` usa `keyPath: "id"` — passar uma chave explícita junto de um valor com keyPath é ilegal em
IndexedDB e lança `DataError` na hora. Efeito prático, comprovado por teste: a foto **era** gravada em
`photos` (duplicando dado), mas a vistoria **nunca** era atualizada — ficava com o base64 antigo embutido pra
sempre, repetindo o mesmo trabalho (e o mesmo erro, silenciado por um `try/catch`) em todo boot. A promessa
central do release (~80MB → <400KB por vistoria) não se realizava pra ninguém com dados de antes da v2.18.

**Correção:** `idbSet("vistorias", undefined, ...)`, igual às outras duas chamadas do arquivo que já faziam
certo. Confirmado com teste: fechar/reabrir o app agora realmente reflete a vistoria compactada, sem base64.

## 2. Bug corrigido — Restaurar não migrava fotos legadas na hora

Restaurar um backup antigo (< v2.18, fotos em base64 embutido) deixava a vistoria sem migrar até o **próximo**
boot do app — funcionalmente inofensivo (o próximo boot sempre corrige), mas o usuário ficava com uma
vistoria "inchada" sem saber, por tempo indeterminado, se não reiniciasse o app.

**Correção:** o handler de Restaurar agora chama `migrateLegacyBase64ToPhotos()` explicitamente, na hora, logo
após gravar a transação — antes de checar integridade e mostrar o alerta final.

## 3. Bug corrigido — `checkPhotoIntegrity()` dava falso "100% íntegro" com fotos legadas pendentes

O checador só reconhecia referências que começam com `"pho_"`. Uma foto legada em base64, sentada na
ocorrência esperando migração, não era nem "válida" nem "ausente" — simplesmente invisível. Resultado: logo
após restaurar um backup antigo (antes da correção #2), o alerta dizia "100% de integridade" com uma foto
ainda não convertida pro Object Store.

**Correção:** `checkPhotoIntegrity()` agora reconhece esse formato e reporta em um campo novo e aditivo,
`pendingMigration` — sem redefinir o que `isClean` significa (que continua sendo estritamente "sem Blob
ausente/corrompido", preservando o contrato usado por `downloadZipBackup` e demais chamadores). O alerta de
Restaurar usa essa informação pra nunca mais alegar 100% quando há pendência real.

## Bateria de validação adversarial rodada (10 testes, cobrindo os 12 cenários pedidos)

| Cenário | Resultado |
|---|---|
| Migração base64 → Blob/photoId | 🔴→✅ bug crítico corrigido (item 1) |
| Fechar/reabrir confirma que o base64 some da vistoria persistida | ✅ |
| Migração interrompida no meio (queda simulada) e retomada | ✅ sem duplicatas, idempotente |
| Tombstone de foto entre dois aparelhos (A exclui, B não sabe) | ✅ comutativo (A→B = B→A) |
| Merge resultando em >4 fotos numa ocorrência | ✅ nenhuma evidência descartada |
| Self-healing — Blob local corrompido, incoming válido | ✅ reparado corretamente (testado no handler real da UI) |
| Self-healing — ambos os lados inválidos | ✅ recusa corretamente, não finge reparo, banco local intocado |
| ZIP: round-trip byte a byte (manifest + fotos) | ✅ |
| ZIP corrompido (1 byte invertido) | ✅ rejeitado via CRC-32 |
| Restore de backup antigo (v2.17.x, base64 embutido) | 🟡→✅ 2 bugs corrigidos (itens 2 e 3) |
| Ciclo real completo (compactar→persistir→reidratar→merge→persistir→reidratar) | ✅ |
| Escala: 2.000 montantes, ~800 fotos | ✅ ~1,5s ponta a ponta, 598KB final, sem base64, sem perda |

## Risco residual conhecido (não corrigido nesta rodada — baixa prioridade)

- `occurrencePhotoRefs()` mantém um fallback legado (`obj.foto` singular, formato pré-v2.14) que, em teoria,
  poderia inserir uma string crua no array `fotos` em vez de um `photoId`. Nunca observado em dados reais
  desta base (o formato é anterior a qualquer versão em uso), mas não foi adversarialmente testado.
- A lógica de self-healing/preflight do merge está embutida diretamente no listener de UI da tela de
  Consolidar, não extraída como função nomeada e testável isoladamente — diferente do padrão do resto do
  protocolo de merge (que é todo função pura e testável). Não é um bug, mas dificulta revisão e teste futuros.

## Sobre a linguagem de "frozen"

As versões v2.18.3, v2.18.4 e v2.18.5 se declararam "congeladas e definitivas" e cada uma foi corrigida horas
depois. Por enquanto, a v2.18.x é tratada como **candidate build — validação adversarial em andamento**, não
"frozen". O protocolo de merge herdado da v2.17.6 (estruturas/montantes/ocorrências, `resolveWinner`,
tombstones, transações atômicas) não foi alterado nesta rodada nem em nenhuma das v2.18.x — continua sendo o
único componente com o nível de escrutínio (cinco rodadas de revisão cruzada) que justificaria a palavra
"congelado".
