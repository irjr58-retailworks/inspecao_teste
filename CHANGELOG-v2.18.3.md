# Inspeção Porta-Pallet — v2.18.3 — Final Evidence Guard

**Data:** 01/09/2026  
**Base:** v2.18.2  
**Objetivo:** congelamento definitivo da arquitetura Evidence Storage, introduzindo self-healing de evidências corrompidas no merge, autossuficiência estrita de pacotes ZIP no preflight, integridade pré-exportação e watermark pericial anti-overflow.

---

## 1. Self-Healing de Evidências na Consolidação (Merge)

- **Reparação Automática de Blobs Corrompidos**: se o aparelho receptor possuir um registro de `photoId` localmente, mas com Blob nulo ou vazio (`size === 0`), e o pacote de consolidação trouxer a cópia íntegra dessa mesma foto, a consolidação **substitui e repara** o Blob local automaticamente.
- O `checkPhotoIntegrity()` pós-merge zera inconsistências pré-existentes.

---

## 2. Regra Oficial de Autossuficiência de Pacotes ZIP no Preflight

- **Pacotes 100% Autônomos**: qualquer vistoria exportada deve conter a totalidade de suas evidências ativas dentro do próprio pacote ZIP.
- O preflight de Restore e Consolidação rejeita imediatamente pacotes incompletos, impedindo a dependência de fotos pré-existentes no receptor.

---

## 3. Verificação de Integridade Pré-Exportação (Zero Silent Corrupt Backups)

- Antes de gerar um arquivo ZIP de backup (`downloadZipBackup`), o sistema executa um `checkPhotoIntegrity` rápido no banco local.
- Se houver fotos ativas corrompidas ou ausentes, a exportação é bloqueada com mensagem clara, impedindo a geração silenciosa de backups defeituosos.

---

## 4. Watermark Pericial em Duas Linhas (Anti-Overflow)

- Reformatação da marca d'água técnica derivada para um padrão pericial conciso:
  - **Linha 1 (Contexto)**: `[Empresa] · [Estrutura] · M[Nº]` ou `[Empresa] · [Estrutura] · ESTRUTURA`
  - **Linha 2 (Timestamp)**: `[Data/Hora original formatada]`
- Elimina qualquer risco de corte lateral de texto em fotografias verticais (900×1200 px).

---

## 🔒 Congelamento da Arquitetura Evidence Storage

- A arquitetura de Evidence Storage (Blob + IndexedDB store `photos` + `photoThumbs` + `PhotoUrlManager` + PKZIP + Protocolo de Merge v2.17.6) está **oficialmente congelada e blindada** contra casos adversariais de rede, memória e integridade.
