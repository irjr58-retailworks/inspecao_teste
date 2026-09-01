# Inspeção Porta-Pallet — v2.18.4 — Recovery Path Guard

**Data:** 01/09/2026  
**Base:** v2.18.3  
**Objetivo:** resolução cirúrgica do conflito entre integridade preventiva e caminho de recuperação (disaster recovery), garantindo que backups de segurança não impeçam operações de Restore ou Consolidação com Self-Healing.

---

## 1. Backup de Segurança Não-Bloqueante (`allowDegraded = true`)

- **Exportação Manual**: permanece estritamente protegida. Se o banco local possuir evidências ausentes ou corrompidas, a exportação manual é bloqueada para evitar distribuição de backups defeituosos.
- **Backup Automático Pré-Restore e Pré-Merge**: agora opera com `allowDegraded = true`. Se o banco local estiver com inconsistências, o sistema gera o arquivo com sufixo `-DEGRADADO.zip`, preservando 100% dos dados sobreviventes e registrando `degradedReport` no manifesto, **sem jamais bloquear** a recuperação ou a consolidação com self-healing.

---

## 2. Validação Pré-Commit do Estado Candidato

- Antes de abrir a transação de escrita atômica no IndexedDB durante o Merge, o sistema valida o estado final projetado (dados locais válidos + novas fotos + self-healing + tombstones).
- Se qualquer evidência ativa permanecesse sem Blob válido pós-merge, a operação seria cancelada sem tocar no banco de dados.

---

## 3. Verificação Automática de Integridade Pós-Commit

- Ao concluir a gravação de Restore ou Consolidação, o sistema executa automaticamente `checkPhotoIntegrity()` no banco recém-gravado.
- O feedback ao usuário informa o resultado exato da integridade em tempo real (ex.: `"✓ Integridade pós-merge: 100% íntegro"`).

---

## 🔒 Baseline Oficial Congelada

- A versão **v2.18.4** é a **baseline congelada e definitiva** da arquitetura Evidence Storage.
