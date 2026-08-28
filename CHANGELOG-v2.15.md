# Inspeção Porta-Pallet — v2.15

Revisão: 28/08/2026

## Modo Campo
- Montantes são criados conforme o técnico avança; não é necessário conhecer o total antecipadamente.
- Ação principal **Conforme e próximo** marca apenas itens ainda pendentes, preservando anomalias já registradas.
- Ação **Este é o último** conclui o montante atual sem criar um montante vazio no final da estrutura.
- Busca rápida de anomalia por código, componente ou família.
- Checklist completo permanece recolhido por padrão para reduzir carga visual.
- Continuação automática pelo primeiro montante pendente.
- Possibilidade de excluir o último montante criado por engano.

## Modelo técnico
- Múltiplas ocorrências para o mesmo código no mesmo montante.
- Prumo 9.17 aceita resultados separados por eixo ou L+T combinado.
- Resultados de prumo conformes não são tratados como anomalia.
- Iluminação 9.45 calcula automaticamente conforme/anomalia pelo limite de 200 lux.
- Medições conformes de iluminação permanecem registradas no relatório técnico.
- Fabricante pode variar por montante, herdando o fabricante padrão da estrutura.
- Campo Tipo/Corte por montante: Gôndola, Chão, Longarina Móvel, Último Montante ou texto livre.
- Observações gerais da estrutura e observações do montante.

## Fotos
- Até 4 fotos por ocorrência/anomalia.
- Redimensionamento para até 1200 px no maior lado.
- JPEG com qualidade 72%, buscando equilíbrio entre detalhe técnico e armazenamento.
- Migração automática da foto única das inspeções v2.14.
- Relatório/PDF exibe todas as fotos da ocorrência.

## Integridade e segurança dos dados
- Compatibilidade com inspeções salvas na v2.14.
- Conclusão da inspeção bloqueada enquanto existirem itens pendentes.
- Autosave captura a inspeção correta e tenta efetuar flush ao ocultar/fechar a PWA.
- Indicador visual de falha de armazenamento.
- Backup agora restaura inspeções, configurações e lista de peças.
- Backup inclui schemaVersion e appVersion.
- Data padrão calculada no horário local, evitando mudança de dia por UTC.

## PWA / interface
- Service Worker atualizado para v2.15 com rede-primeiro para arquivos principais e fallback offline.
- `updateViaCache: none` para reduzir risco de versão antiga ficar presa no aparelho.
- Zoom do navegador voltou a ser permitido para acessibilidade.
- Botões maiores e hierarquia visual específica para trabalho em campo com uma mão.
