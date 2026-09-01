# Inspeção Porta-Pallet — v2.18.0 — Evidence Storage

**Data:** 01/09/2026  
**Base:** v2.17.6  
**Objetivo:** migrar o armazenamento de fotos de Base64 embutido nas ocorrências para um Object Store `photos` dedicado no IndexedDB utilizando `Blob`, `photoId` determinístico, `PhotoUrlManager` e tombstones canônicos de evidência em `v.tombstones.photos`.

---

## 1. Novo Object Store `photos` e Armazenamento em Blob

- **IndexedDB Schema v3**: adicionado o store `photos` com `keyPath: "id"` e índices (`by_vistoriaId`, `by_occurrenceId`, `by_updatedAt`).
- **Formato Binário Nativo**: as fotos são capturadas e comprimidas diretamente para `Blob` binário (`image/jpeg` a 72% e max 1200px) via `canvas.toBlob()`, eliminando o overhead de strings Base64 na memória heap do V8.
- **Estrutura da Evidência (`PhotoRecord`)**:
  - `id`: identificador único da foto (`pho_...`);
  - `vistoriaId`: vínculo com a vistoria;
  - `occurrenceId`: vínculo com a ocorrência;
  - `blob`: binário da imagem JPEG;
  - `mimeType`, `width`, `height`, `size`;
  - `createdAt`, `deviceOrigin`, `updatedAt`, `deletedAt`.

---

## 2. Documentos de Vistoria Ultra-Compactos

- As ocorrências (`oc.fotos`) agora armazenam apenas as referências `photoId` (ex: `["pho_a1b2c3", "pho_d4e5f6"]`).
- O tamanho do documento JSON de uma vistoria com centenas de fotos caiu de **~80 MB** para **menos de 400 KB** (redução de 99,5%), tornando as operações de salvamento e commit no IndexedDB instantâneas.
- `STORAGE_SCHEMA` atualizado para `5`.

---

## 3. Tombstones Canônicos em `v.tombstones.photos` e Merge Multiaparelho

- **Exclusão com Tombstone**: a remoção de uma foto registra seu ID em `v.tombstones.photos[photoId] = { deletedAt, deviceOrigin }`.
- **Merge Comutativo e Conflito Zero**:
  - `unionFotos(local, incoming, tombA, tombB)` verifica se a foto sofreu tombstone em qualquer um dos aparelhos.
  - Se uma foto foi excluída, a exclusão prevalece e ela não é ressuscitada.
  - Se a foto é válida, ela é mantida.
  - **Preservação de >4 fotos**: se a mescla de fotos de múltiplos aparelhos resultar em mais de 4 fotos em uma mesma ocorrência, **nenhuma evidência é descartada** automaticamente. Todas permanecem salvas e acessíveis.

---

## 4. Migração Idempotente e Retomável (v2.17.6 → v2.18)

- **ID Determinístico**: na migração de dados legados, o `photoId` é derivado de forma determinística/idempotente via hash SHA-256 do Base64 legado (`pho_hash`).
- **Validação com Read-Back**: cada `Blob` gerado é gravado no store `photos`, relido do IndexedDB e validado quanto a tamanho e integridade antes de qualquer Base64 ser removido da vistoria.
- **Resiliência a Interrupções**: se o processo for interrompido (ex: desligamento do celular), a próxima inicialização retoma exatamente de onde parou sem duplicar fotos nem perder dados.

---

## 5. Gerenciamento de Memória e URLs (`PhotoUrlManager`)

- Pool controlado de Object URLs (`URL.createObjectURL(blob)`) com cache `photoId -> ObjectURL`.
- Revogação explícita de URLs descartadas para evitar consumo excessivo de RAM em inspeções longas com mais de 2.000 montantes.

---

## 6. Backup, Restore e Relatórios em Lotes

- **Backup Sequencial / Lotes**: serialização de Blobs para Base64 no arquivo JSON de backup realizada em lotes com limite de memória.
- **Restore Atômico**: reconstrução de Blobs e vistorias em transação atômica única (`idbTransactionApply`).
- **Pré-Carregamento em PDF / Relatórios**: `ReportScreen` e `buildInspectionPdf` aguardam o carregamento e decodificação assíncrona das imagens antes de gerar o documento.
- `MERGE_SCHEMA_VERSION` atualizado para `8`.

---

## Compatibilidade e Protocolo de Merge

- Todos os 4 pilares congelados na v2.17.6 (`finalizadaUpdatedAt`, `setupComplete` comutativo, isolamento de `touchMontanteMeta`, transação atômica) foram **100% preservados**.
- Backups da v2.17.6 e anteriores continuam sendo restaurados e migrados automaticamente sem qualquer intervenção manual.
