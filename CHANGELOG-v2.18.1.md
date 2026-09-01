# Inspeção Porta-Pallet — v2.18.1 — Evidence Storage Hardened & Offline ZIP

**Data:** 01/09/2026  
**Base:** v2.18.0  
**Objetivo:** enriquecer a experiência de campo com feedback de progresso em tempo real, suporte a pacote de backup ZIP offline com binários diretos, store de micro-thumbnails como cache derivável e marca d'água técnica não-destrutiva para relatórios.

---

## 1. Store `photoThumbs` no IndexedDB (Schema v4)

- **Cache 100% Derivável**: adicionado o store `photoThumbs` (`keyPath: "id"`).
- **Sem Interferência em Merge ou Sincronização**: `photoThumbs` **não participa de merge**, **não possui tombstones** e **não entra em backups**.
- **Derivação sob Demanda**: se um thumbnail (80×80 px, ~2 KB) não existir, ele é gerado automaticamente a partir do Blob original em `photos` e armazenado no cache local.
- **Fluidez na Rolagem**: acelera a rolagem de checklists e listas de anomalias em celulares modestos com centenas de evidências.

---

## 2. Motor PKZIP Offline Nativo (Zero Dependências)

- **Preservação Binária Direta**: exportação de backups em formato `.zip` com estrutura `manifest.json` + `photos/pho_*.jpg`.
- **Zero Overhead de CPU**: utiliza método Store (sem compressão redundante para JPEGs que já são comprimidos), economizando bateria e tempo do técnico em campo.
- **Tabela CRC-32 Nativa**: validação de integridade padrão IEEE 802.3 em JavaScript puro.
- **Compatibilidade Dupla**: telas de Restauração e Consolidação aceitam tanto arquivos `.zip` quanto `.json`.

---

## 3. ProgressModal (Feedback Real por Etapas e Itens)

- Modal com barra de progresso animada e contagem real (`X / Y fotos (Z%)`) durante exportação ZIP/JSON, restauração e consolidação de aparelhos.
- Execução com *yield* assíncrono para garantir renderização fluida a 60 FPS sem congelamento da interface.

---

## 4. Watermark Técnica Derivada para Laudo/PDF

- **Não-Destrutiva**: o `Blob` original da foto no store `photos` **permanece 100% puro e inalterado**.
- **Carimbo sob Demanda**: ao gerar o laudo PDF ou relatório impresso, a imagem é renderizada offscreen com uma tarja técnica no rodapé contendo `[Empresa] · Estrutura [Código] · M[Número] · [createdAt original formatado]`.

---

## 5. Storage Warning por Quota Concedida à Origem PWA

- Métricas baseadas estritamente em `navigator.storage.estimate()`.
- Informa o percentual de uso em relação à **quota de armazenamento concedida pelo navegador à PWA** (ex: *"Quota da PWA: 82 MB usados de ~1.200 MB concedidos pelo navegador (6.8%)"*), sem fazer afirmações sobre o disco físico geral do dispositivo.
- Alerta preventivo caso a cota exceda 85%.

---

## Compatibilidade e Protocolo de Merge

- O protocolo de merge multiaparelho da v2.17.6 e o Evidence Storage da v2.18.0 permanecem **100% intactos**.
