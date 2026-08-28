/* ==========================================================
   Inspeção Porta-Pallet — PWA offline-first
   Hierarquia: INSPEÇÃO (Loja/CD, Local, Data, Inspetor)
             → várias ESTRUTURAS, cada uma com o checklist 9.x
   Tudo salvo em IndexedDB (no aparelho), passo a passo.
   ========================================================== */

/* ---------------- Ícones (SVG inline, sem dependências) ---------------- */
const ICON = {
  home: '<path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  package: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5"/>',
  alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v4M12 17.5v.01"/>',
  xcirc: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  camera: '<path d="M4 8h3l2-2h6l2 2h3v11H4Z"/><circle cx="12" cy="13.5" r="3.5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.7 7.6-4.4M8.2 13.3l7.6 4.4"/>',
  download: '<path d="M12 3v12m0 0 4.5-4.5M12 15 7.5 10.5"/><path d="M4 19h16"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="m5 5 14 14M19 5 5 19"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  minus: '<path d="M5 12h14"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 9h5a1 1 0 0 1 1 1v11"/><path d="M9 21V9M9 13H6M9 9H6M4 21h16"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
};
function svg(name, size = 16, extra = "") {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${extra}">${ICON[name] || ""}</svg>`;
}

/* ---------------- Config padrão / taxonomia 9.x ---------------- */
const FAMILIAS_ORDEM = ["Base e Fixação ao Piso", "Colunas e Prumo", "Longarinas", "Travessas e Diagonais", "Distanciadores", "Proteções e Segurança", "Amarrações e Reforços Estruturais", "Gôndolas", "Acessórios de Movimentação", "Acabamento e Corrosão", "Configuração, Adaptações e Uso", "Ambiente e Iluminação"];
const DEFAULT_ITEMS = [
  { id: "chumbador", codigo: "9.12", categoria: "Estruturais", familia: "Base e Fixação ao Piso", nivel: "montante", nome: "Falta e/ou falha na fixação dos chumbadores", descOpcoes: ["CHUMBADORES FALTANTES", "FALHA NA FIXAÇÃO DOS CHUMBADORES"], tipoOpcoes: ["PLACA DE BASE", "PLACA DE BASE CONTÍNUA"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Falta e/ou falha na fixação dos chumbadores" },
  { id: "placaBaseDanificada", codigo: "9.13", categoria: "Estruturais", familia: "Base e Fixação ao Piso", nivel: "montante", nome: "Placas de base danificadas", descOpcoes: ["DANIFICADA", "TROCADA"], tipoOpcoes: ["PLACA DE BASE", "PLACA DE BASE CONTÍNUA"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Placas de base danificadas" },
  { id: "placaBaseAdaptada", codigo: "9.14", categoria: "Gerais", familia: "Base e Fixação ao Piso", nivel: "montante", nome: "Placas de base adaptadas", descOpcoes: ["ADAPTAÇÃO"], tipoOpcoes: ["PLACA DE BASE", "PLACA DE BASE CONTÍNUA"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Placas de base adaptadas" },
  { id: "calco", codigo: "9.38", categoria: "Estruturais", familia: "Base e Fixação ao Piso", nivel: "montante", nome: "Calços de nivelação adaptados, danificados, faltantes ou desalinhados", descOpcoes: ["CALÇO DE NIVELAÇÃO ADAPTADO", "CALÇO DE NIVELAÇÃO DANIFICADO", "CALÇO DE NIVELAÇÃO FALTANTE", "CALÇO DE NIVELAÇÃO DESALINHADO"], tipoOpcoes: ["PLACA DE BASE", "PLACA DE BASE CONTÍNUA"], localOpcoes: ["FRONTAL", "TRASEIRA"], peca: "Calços de nivelação adaptados, danificados, faltantes ou desalinhados" },
  { id: "colunaSemPlaca", codigo: "9.39", categoria: "Estruturais", familia: "Base e Fixação ao Piso", nivel: "montante", nome: "Coluna sem placa de base", descOpcoes: ["COLUNA SEM PLACA DE BASE"], tipoOpcoes: ["PLACA DE BASE", "PLACA DE BASE CONTÍNUA"], localOpcoes: ["FRONTAL", "TRASEIRA"], peca: "Coluna sem placa de base" },
  { id: "colunaSoltaBase", codigo: "9.15", categoria: "Estruturais", familia: "Colunas e Prumo", nivel: "montante", nome: "Colunas sem fixação e/ou com fixações afrouxadas na placa de base", descOpcoes: ["COLUNA COM FIXAÇÕES AFROUXADAS NA PLACA DE BASE (1/2)", "COLUNA COM FIXAÇÕES AFROUXADAS NA PLACA DE BASE (2/2)", "COLUNA SEM FIXAÇÃO NA PLACA DE BASE (1/2)", "COLUNA SEM FIXAÇÃO NA PLACA DE BASE (2/2)"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Colunas sem fixação e/ou com fixações afrouxadas na placa de base" },
  { id: "colunaDanificada", codigo: "9.16", categoria: "Estruturais", familia: "Colunas e Prumo", nivel: "montante", nome: "Colunas torcidas e/ou com impactos e deformadas", descOpcoes: ["COLUNA DANIFICADA", "COLUNA TORCIDA", "COLUNA TROCADA"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Colunas torcidas e/ou com impactos e deformadas" },
  { id: "prumo", codigo: "9.17", categoria: "Estruturais", familia: "Colunas e Prumo", nivel: "montante", nome: "Colunas com problemas de prumo", descOpcoes: ["COLUNA NO PRUMO", "COLUNA NA TOLERÂNCIA DO PRUMO", "COLUNA FORA DE PRUMO", "COLUNA SEM ACESSO"], localOpcoes: ["LONGITUDINAL", "TRANSVERSAL"], localLabel: "Localização (Longitudinal / Transversal)", peca: "Colunas com problemas de prumo" },
  { id: "juncao", codigo: "9.19", categoria: "Estruturais", familia: "Colunas e Prumo", nivel: "montante", nome: "Emenda das colunas danificada, faltante ou com fixações afrouxadas", descOpcoes: ["EMENDA SEM FIXAÇÃO", "EMENDA COM FIXAÇÕES AFROUXADAS", "EMENDA COM FALHA NA INSTALAÇÃO (VÃO ENTRE COLUNAS)", "FALHA NO CORTE DA COLUNA", "EMENDA DANIFICADA", "EMENDA FALTANTE"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Emenda das colunas danificada, faltante ou com fixações afrouxadas" },
  { id: "desalinh", codigo: "9.20", categoria: "Estruturais", familia: "Colunas e Prumo", nivel: "montante", nome: "Desalinhamento das colunas do montante e/ou da estrutura", descOpcoes: ["COLUNA DESALINHADA", "ESTRUTURA DESALINHADA"], localOpcoes: ["FRONTAL", "TRASEIRA", "GERAL"], peca: "Desalinhamento das colunas do montante e/ou da estrutura" },
  { id: "sobrecarga", codigo: "9.2", categoria: "Estruturais", familia: "Longarinas", nivel: "montante", nome: "Sobrecarga nas longarinas e/ou longarinas com flecha", descOpcoes: ["SOBRECARGA NAS LONGARINAS", "LONGARINA COM FLECHA"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Sobrecarga nas longarinas e/ou longarinas com flecha" },
  { id: "travaSeguranca", codigo: "9.3", categoria: "Segurança", familia: "Longarinas", nivel: "montante", nome: "Longarinas sem trava de segurança e/ou trava com falha/adaptada", descOpcoes: ["SEM TRAVA DE SEGURANÇA", "SEM TRAVA DE SEGURANÇA TIPO C FRONTAL (NSF)", "SEM TRAVA DE SEGURANÇA PARAFUSO + PORCA LATERAL (NSF)", "SEM TRAVA DE SEGURANÇA PARAFUSO + PORCA (AGRA)", "TRAVA DE SEGURANÇA COM MONTAGEM FALHA", "TRAVA DE SEGURANÇA ADAPTADA"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA"], localOpcoes: ["FRONTAL", "TRASEIRA"], peca: "Longarinas sem trava de segurança e/ou trava com falha/adaptada" },
  { id: "longDanificada", codigo: "9.4", categoria: "Estruturais", familia: "Longarinas", nivel: "montante", nome: "Longarinas danificadas por impacto e/ou torção", descOpcoes: ["LONGARINA DANIFICADA", "LONGARINA TORCIDA", "LONGARINA TROCADA"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Longarinas danificadas por impacto e/ou torção" },
  { id: "longDesencaixada", codigo: "9.5", categoria: "Estruturais", familia: "Longarinas", nivel: "montante", nome: "Longarina com garras do conector desencaixadas da coluna", descOpcoes: ["LONGARINA DESENCAIXADA"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Longarina com garras do conector desencaixadas da coluna" },
  { id: "longMalPosicionada", codigo: "9.7", categoria: "Estruturais", familia: "Longarinas", nivel: "montante", nome: "Longarinas mal posicionadas nas colunas do montante", descOpcoes: ["LONGARINA DESNIVELADA", "LONGARINA DESALINHADA"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Longarinas mal posicionadas nas colunas do montante" },
  { id: "travessa", codigo: "9.8 · 9.9 · 9.10 · 9.11", categoria: "Estruturais", familia: "Travessas e Diagonais", nivel: "montante", nome: "Travessas sem fixação, faltantes, danificadas ou mal posicionadas", descOpcoes: ["TRAVESSA SEM FIXAÇÃO (SOLTA)", "TRAVESSA COM FIXAÇÕES AFROUXADAS", "TRAVESSA FALTANTE", "TRAVESSA DANIFICADA", "TRAVESSA TROCADA", "TRAVESSA MAL POSICIONADA"], peca: "Travessas sem fixação, faltantes, danificadas ou mal posicionadas" },
  { id: "diagonal", codigo: "9.8 · 9.9 · 9.10 · 9.11", categoria: "Estruturais", familia: "Travessas e Diagonais", nivel: "montante", nome: "Diagonais sem fixação, faltantes, danificadas ou mal posicionadas", descOpcoes: ["DIAGONAL SEM FIXAÇÃO (SOLTA)", "DIAGONAL COM FIXAÇÕES AFROUXADAS", "DIAGONAL FALTANTE", "DIAGONAL DANIFICADA", "DIAGONAL TROCADA", "DIAGONAL MAL POSICIONADA"], peca: "Diagonais sem fixação, faltantes, danificadas ou mal posicionadas" },
  { id: "distMontAdapt", codigo: "9.22", categoria: "Gerais", familia: "Distanciadores", nivel: "montante", nome: "Distanciadores de montantes adaptados", descOpcoes: ["DISTANCIADORES DE MONTANTES ADAPTADOS"], peca: "Distanciadores de montantes adaptados" },
  { id: "distMontSolto", codigo: "9.23", categoria: "Estruturais", familia: "Distanciadores", nivel: "montante", nome: "Distanciadores de montantes sem fixação ou com fixações afrouxadas", descOpcoes: ["DISTANCIADORES DE MONTANTE SEM FIXAÇÕES", "DISTANCIADORES DE MONTANTE COM FIXAÇÕES AFROUXADAS"], peca: "Distanciadores de montantes sem fixação ou com fixações afrouxadas" },
  { id: "distMontFalta", codigo: "9.24", categoria: "Estruturais", familia: "Distanciadores", nivel: "montante", nome: "Falta de distanciadores de montantes", descOpcoes: ["DISTANCIADORES DE MONTANTES FALTANTE"], peca: "Falta de distanciadores de montantes" },
  { id: "distMontDanif", codigo: "9.25", categoria: "Estruturais", familia: "Distanciadores", nivel: "montante", nome: "Distanciadores de montantes danificados", descOpcoes: ["DISTANCIADORES DE MONTANTES DANIFICADO"], peca: "Distanciadores de montantes danificados" },
  { id: "distParedeAdapt", codigo: "9.26", categoria: "Gerais", familia: "Distanciadores", nivel: "montante", condicional: "mural", nome: "Distanciadores de parede adaptados", descOpcoes: ["DISTANCIADORES DE PAREDE ADAPTADO"], peca: "Distanciadores de parede adaptados" },
  { id: "distParedeSolto", codigo: "9.27", categoria: "Estruturais", familia: "Distanciadores", nivel: "montante", condicional: "mural", nome: "Distanciadores de parede sem fixação ou com fixações afrouxadas", descOpcoes: ["DISTANCIADORES DE PAREDE SEM FIXAÇÕES (SOLTO)", "DISTANCIADORES DE PAREDE COM FIXAÇÕES AFROUXADAS"], peca: "Distanciadores de parede sem fixação ou com fixações afrouxadas" },
  { id: "distParedeFalta", codigo: "9.28", categoria: "Estruturais", familia: "Distanciadores", nivel: "montante", condicional: "mural", nome: "Estrutura ou montante sem distanciadores de parede", descOpcoes: ["ESTRUTURA SEM DISTANCIADORES DE PAREDE", "MONTANTE SEM DISTANCIADORES DE PAREDE"], peca: "Estrutura ou montante sem distanciadores de parede" },
  { id: "protetor", codigo: "9.21", categoria: "Segurança", familia: "Proteções e Segurança", nivel: "montante", nome: "Protetores de coluna, guard rails, protetor trilho e/ou caneleiras com falha", descOpcoes: ["DANIFICADO", "FALHA NA FIXAÇÃO", "FALTANTE", "FALHA DE PROXIMIDADE", "INCLINADO"], localOpcoes: ["PROTETOR DE COLUNA", "PROTETOR DE COLUNA DO GUARD RAIL", "TUBO DO GUARD RAIL SIMPLES", "TUBO DO GUARD RAIL DUPLO", "APOIO CENTRAL DO GUARD RAIL", "CANELEIRA", "PROTETOR TRILHO (DINÂMICO)"], localLabel: "Componente", peca: "Protetores de coluna, guard rails, protetor trilho e/ou caneleiras com falha" },
  { id: "stopper", codigo: "9.43", categoria: "Segurança", familia: "Proteções e Segurança", nivel: "montante", nome: "Perfil de segurança (stopper) danificado, faltante, com falha ou adaptado", descOpcoes: ["DANIFICADO", "FALTANTE", "COM FIXAÇÕES FALHAS", "ADAPTADO"], peca: "Perfil de segurança (stopper) danificado, faltante, com falha ou adaptado" },
  { id: "amarracao", codigo: "9.32", categoria: "Estruturais", familia: "Amarrações e Reforços Estruturais", nivel: "montante", nome: "Amarrações superiores em desacordo com a norma, danificadas, faltantes ou adaptadas", descOpcoes: ["INSTALADAS EM DESACORDO COM A NORMA", "DANIFICADAS", "COM FIXAÇÕES FALHAS", "FALTANTES", "ADAPTADAS"], peca: "Amarrações superiores em desacordo com a norma, danificadas, faltantes ou adaptadas" },
  { id: "suporteCentral", codigo: "9.41", categoria: "Estruturais", familia: "Amarrações e Reforços Estruturais", nivel: "montante", nome: "Suporte rack central faltante, danificado ou com fixações falhas", descOpcoes: ["DANIFICADO", "COM FALHAS NA FIXAÇÃO", "FALTANTE"], peca: "Suporte rack central faltante, danificado ou com fixações falhas" },
  { id: "contravFundo", codigo: "9.44", categoria: "Estruturais", familia: "Amarrações e Reforços Estruturais", nivel: "montante", nome: "Contraventamentos de fundo e/ou horizontais danificados, faltantes ou com falha", descOpcoes: ["CONTRAVENTAMENTOS DE FUNDO DANIFICADOS", "CONTRAVENTAMENTOS DE FUNDO FALTANTES", "CONTRAVENTAMENTOS DE FUNDO COM FIXAÇÕES FALHAS", "CONTRAVENTAMENTOS DE FUNDO COM FALHAS DE MONTAGEM", "CONTRAVENTAMENTOS HORIZONTAIS DANIFICADOS", "CONTRAVENTAMENTOS HORIZONTAIS FALTANTES", "CONTRAVENTAMENTOS HORIZONTAIS COM FIXAÇÕES FALHAS", "CONTRAVENTAMENTOS HORIZONTAIS COM FALHAS DE MONTAGEM"], peca: "Contraventamentos de fundo e/ou horizontais danificados, faltantes ou com falha" },
  { id: "transversina", codigo: "9.46", categoria: "Estruturais", familia: "Amarrações e Reforços Estruturais", nivel: "montante", nome: "Transversina e/ou reforço faltante, danificado, torcido ou com falha", descOpcoes: ["DANIFICADA", "TORCIDA", "FALTANTE", "COM FALHAS NA FIXAÇÃO"], peca: "Transversina e/ou reforço faltante, danificado, torcido ou com falha" },
  { id: "chapaLateral", codigo: "9.47", categoria: "Estruturais", familia: "Amarrações e Reforços Estruturais", nivel: "montante", nome: "Chapa de fechamento lateral do montante danificada, faltante ou com falha", descOpcoes: ["DANIFICADA", "FALTANTE", "COM FALHAS NA FIXAÇÃO"], peca: "Chapa de fechamento lateral do montante danificada, faltante ou com falha" },
  { id: "gondolaDanificada", codigo: "9.29", categoria: "Gerais", familia: "Gôndolas", nivel: "montante", condicional: "gondola", nome: "Componentes da gôndola danificados", descOpcoes: ["DANIFICADO"], tipoOpcoes: ["COLUNA GÔNDOLA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA", "APOIO CENTRAL DA GÔNDOLA", "APOIO DIREITO DA GÔNDOLA", "APOIO ESQUERDO DA GÔNDOLA", "BASE DA GÔNDOLA", "CESTO DA GÔNDOLA", "QUADRO DA GÔNDOLA", "PRATELEIRA BASE DA GÔNDOLA", "PRATELEIRA DA GÔNDOLA", "BRAÇO DA GÔNDOLA INTEGRADA", "BRAÇO DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA INTEGRADA"], peca: "Componentes da gôndola danificados" },
  { id: "gondolaSoldada", codigo: "9.30", categoria: "Gerais", familia: "Gôndolas", nivel: "montante", condicional: "gondola", nome: "Componentes da gôndola soldados", descOpcoes: ["SOLDADO"], tipoOpcoes: ["COLUNA GÔNDOLA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA", "APOIO CENTRAL DA GÔNDOLA", "APOIO DIREITO DA GÔNDOLA", "APOIO ESQUERDO DA GÔNDOLA", "BASE DA GÔNDOLA", "CESTO DA GÔNDOLA", "QUADRO DA GÔNDOLA", "PRATELEIRA BASE DA GÔNDOLA", "PRATELEIRA DA GÔNDOLA", "BRAÇO DA GÔNDOLA INTEGRADA", "BRAÇO DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA INTEGRADA"], peca: "Componentes da gôndola soldados" },
  { id: "posteRack", codigo: "9.31", categoria: "Estruturais", familia: "Gôndolas", nivel: "montante", condicional: "gondola", nome: "Poste rack da gôndola integrada danificado, solto, com falha ou faltante", descOpcoes: ["POSTE RACK DA GÔNDOLA DANIFICADO", "POSTE RACK DA GÔNDOLA SEM FIXAÇÕES (SOLTO)", "POSTE RACK DA GÔNDOLA COM FIXAÇÕES FALHAS", "POSTE RACK DA GÔNDOLA FALTANTE", "POSTE RACK DA GÔNDOLA SEM USO"], peca: "Poste rack da gôndola integrada danificado, solto, com falha ou faltante" },
  { id: "colunaGondola", codigo: "9.42", categoria: "Estruturais", familia: "Gôndolas", nivel: "montante", condicional: "gondola", nome: "Coluna da gôndola integrada danificada, faltante ou com fixações falhas", descOpcoes: ["DANIFICADA", "COM FALHAS NA FIXAÇÃO", "FALTANTE"], peca: "Coluna da gôndola integrada danificada, faltante ou com fixações falhas" },
  { id: "planoMetalico", codigo: "9.40", categoria: "Gerais", familia: "Acessórios de Movimentação", nivel: "montante", nome: "Plano metálico e/ou de madeira danificado, faltante ou com fixações falhas", descOpcoes: ["PLANO METÁLICO DANIFICADO", "PLANO METÁLICO FALTANTE", "PLANO METÁLICO COM FIXAÇÕES FALHAS", "PLANO DE MADEIRA DANIFICADO", "PLANO DE MADEIRA FALTANTE", "PLANO DE MADEIRA COM FIXAÇÕES FALHAS"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA MÓVEL"], peca: "Plano metálico e/ou de madeira danificado, faltante ou com fixações falhas" },
  { id: "roletes", codigo: "9.48", categoria: "Estruturais", familia: "Acessórios de Movimentação", nivel: "montante", condicional: "roletes", nome: "Roletes faltantes, danificados ou com fixações falhas", descOpcoes: ["DANIFICADOS", "FALTANTES", "COM FALHAS NA FIXAÇÃO"], peca: "Roletes faltantes, danificados ou com fixações falhas" },
  { id: "guiaEntrada", codigo: "9.49", categoria: "Estruturais", familia: "Acessórios de Movimentação", nivel: "montante", condicional: "roletes", nome: "Guia de entrada dos paletes faltante, danificada ou com falha", descOpcoes: ["DANIFICADOS", "FALTANTES", "COM FALHAS NA FIXAÇÃO"], peca: "Guia de entrada dos paletes faltante, danificada ou com falha" },
  { id: "trilho", codigo: "9.50", categoria: "Estruturais", familia: "Acessórios de Movimentação", nivel: "montante", condicional: "roletes", nome: "Trilho de entrada e/ou trilho menor de saída faltante, danificado ou com falha", descOpcoes: ["TRILHO DE ENTRADA DANIFICADO", "TRILHO DE ENTRADA FALTANTE", "TRILHO DE ENTRADA COM FALHAS NA FIXAÇÃO", "TRILHO MENOR DE SAÍDA DANIFICADO", "TRILHO MENOR DE SAÍDA FALTANTE", "TRILHO MENOR DE SAÍDA COM FALHAS NA FIXAÇÃO"], peca: "Trilho de entrada e/ou trilho menor de saída faltante, danificado ou com falha" },
  { id: "desplacamento", codigo: "9.35", categoria: "Gerais", familia: "Acabamento e Corrosão", nivel: "montante", nome: "Falha, falta de pintura ou desplacamento nos porta-paletes e/ou gôndolas", descOpcoes: ["DESPLACAMENTO", "FALTA DE PINTURA"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "TRAVESSA", "DIAGONAL", "COLUNA", "CHUMBADOR DA PLACA DE BASE", "PLACA DE BASE", "PLACA DE BASE CONTÍNUA", "DISTANCIADOR DE MONTANTE", "DISTANCIADOR DE PAREDE", "AMARRAÇÃO SUPERIOR", "PROTETOR DE COLUNA", "PROTETOR TRILHO (DINÂMICO)", "PROTETOR DE COLUNA DO GUARD-RAIL", "CANELEIRA", "TUBO DO GUARD RAIL SIMPLES (1X)", "TUBO DO GUARD RAIL SIMPLES (2X)", "TUBO DO GUARD RAIL SIMPLES (3X)", "TUBO DO GUARD RAIL DUPLO (1X)", "TUBO DO GUARD RAIL DUPLO (2X)", "TUBO DO GUARD RAIL DUPLO (3X)", "APOIO CENTRAL DO GUARD RAIL", "JUNÇÃO DE COLUNA", "OUTROS", "TAMPA DA PLACA DE BASE CONTÍNUA", "COLUNA GÔNDOLA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA", "APOIO CENTRAL DA GÔNDOLA", "APOIO DIREITO DA GÔNDOLA", "APOIO ESQUERDO DA GÔNDOLA", "BASE DA GÔNDOLA", "CESTO DA GÔNDOLA", "QUADRO DA GÔNDOLA", "PRATELEIRA BASE DA GÔNDOLA", "PRATELEIRA DA GÔNDOLA", "BRAÇO DA GÔNDOLA INTEGRADA", "BRAÇO DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA INTEGRADA"], localOpcoes: ["FRONTAL", "TRASEIRA"], peca: "Falha, falta de pintura ou desplacamento nos porta-paletes e/ou gôndolas" },
  { id: "corrosao", codigo: "9.36", categoria: "Gerais", familia: "Acabamento e Corrosão", nivel: "montante", nome: "Corrosão em componentes da estrutura porta-paletes e/ou gôndolas", descOpcoes: ["CORROSÃO"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "TRAVESSA", "DIAGONAL", "COLUNA", "CHUMBADOR DA PLACA DE BASE", "PLACA DE BASE", "PLACA DE BASE CONTÍNUA", "DISTANCIADOR DE MONTANTE", "DISTANCIADOR DE PAREDE", "AMARRAÇÃO SUPERIOR", "PROTETOR DE COLUNA", "PROTETOR TRILHO (DINÂMICO)", "PROTETOR DE COLUNA DO GUARD-RAIL", "CANELEIRA", "TUBO DO GUARD RAIL SIMPLES (1X)", "TUBO DO GUARD RAIL SIMPLES (2X)", "TUBO DO GUARD RAIL SIMPLES (3X)", "TUBO DO GUARD RAIL DUPLO (1X)", "TUBO DO GUARD RAIL DUPLO (2X)", "TUBO DO GUARD RAIL DUPLO (3X)", "APOIO CENTRAL DO GUARD RAIL", "JUNÇÃO DE COLUNA", "OUTROS", "TAMPA DA PLACA DE BASE CONTÍNUA", "CHAPA PORTA-PREÇO", "COLUNA GÔNDOLA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA", "APOIO CENTRAL DA GÔNDOLA", "APOIO DIREITO DA GÔNDOLA", "APOIO ESQUERDO DA GÔNDOLA", "BASE DA GÔNDOLA", "CESTO DA GÔNDOLA", "QUADRO DA GÔNDOLA", "PRATELEIRA BASE DA GÔNDOLA", "PRATELEIRA DA GÔNDOLA", "BRAÇO DA GÔNDOLA INTEGRADA", "BRAÇO DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA INTEGRADA"], localOpcoes: ["FRONTAL", "TRASEIRA"], peca: "Corrosão em componentes da estrutura porta-paletes e/ou gôndolas" },
  { id: "layout", codigo: "9.1", categoria: "Gerais", familia: "Configuração, Adaptações e Uso", nivel: "estrutura", nome: "Ausência de layout/projeto ou mudanças de configuração", descOpcoes: ["FALTA DE PROJETO OU LAYOUT", "ALTERAÇÃO DE PROJETO OU LAYOUT", "LONGARINA(S) FALTANTE(S)"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA", "ANOMALIA GERAL"], localOpcoes: ["FRONTAL", "TRASEIRA", "FRONTAL / TRASEIRA"], peca: "Ausência de layout/projeto ou mudanças de configuração" },
  { id: "adaptacoes", codigo: "9.6", categoria: "Gerais", familia: "Configuração, Adaptações e Uso", nivel: "montante", nome: "Adaptações (soldas, enxertos, mescla de fabricantes) nos porta-paletes e/ou gôndolas", descOpcoes: ["ADAPTAÇÃO EM COMPONENTES DO PORTA-PALETES", "ADAPTAÇÃO EM COMPONENTES DA GÔNDOLA"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "TRAVESSA", "DIAGONAL", "COLUNA", "CHUMBADOR DA PLACA DE BASE", "PLACA DE BASE", "PLACA DE BASE CONTÍNUA", "DISTANCIADOR DE MONTANTE", "DISTANCIADOR DE PAREDE", "AMARRAÇÃO SUPERIOR", "PROTETOR DE COLUNA", "PROTETOR TRILHO (DINÂMICO)", "PROTETOR DE COLUNA DO GUARD-RAIL", "CANELEIRA", "TUBO DO GUARD RAIL SIMPLES (1X)", "TUBO DO GUARD RAIL SIMPLES (2X)", "TUBO DO GUARD RAIL SIMPLES (3X)", "TUBO DO GUARD RAIL DUPLO (1X)", "TUBO DO GUARD RAIL DUPLO (2X)", "TUBO DO GUARD RAIL DUPLO (3X)", "APOIO CENTRAL DO GUARD RAIL", "JUNÇÃO DE COLUNA", "OUTROS", "COLUNA GÔNDOLA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA", "APOIO CENTRAL DA GÔNDOLA", "APOIO DIREITO DA GÔNDOLA", "APOIO ESQUERDO DA GÔNDOLA", "BASE DA GÔNDOLA", "CESTO DA GÔNDOLA", "QUADRO DA GÔNDOLA", "PRATELEIRA BASE DA GÔNDOLA", "PRATELEIRA DA GÔNDOLA", "BRAÇO DA GÔNDOLA INTEGRADA", "BRAÇO DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA INTEGRADA"], localOpcoes: ["FRONTAL", "TRASEIRA"], peca: "Adaptações (soldas, enxertos, mescla de fabricantes) nos porta-paletes e/ou gôndolas" },
  { id: "componentesSoldados", codigo: "9.18", categoria: "Gerais", familia: "Configuração, Adaptações e Uso", nivel: "montante", nome: "Componentes soldados nas estruturas porta-paletes e/ou gôndolas", descOpcoes: ["COMPONENTES SOLDADOS NO PORTA-PALETES", "COMPONENTES SOLDADOS NA GÔNDOLA"], tipoOpcoes: ["LONGARINA SUPERIOR", "LONGARINA INFERIOR", "LONGARINA MÓVEL", "LONGARINA PICKING", "LONGARINA BASE", "LONGARINA ESCALONADA", "TRAVESSA", "DIAGONAL", "COLUNA", "CHUMBADOR DA PLACA DE BASE", "PLACA DE BASE", "PLACA DE BASE CONTÍNUA", "DISTANCIADOR DE MONTANTE", "DISTANCIADOR DE PAREDE", "AMARRAÇÃO SUPERIOR", "PROTETOR DE COLUNA", "PROTETOR TRILHO (DINÂMICO)", "PROTETOR DE COLUNA DO GUARD-RAIL", "CANELEIRA", "TUBO DO GUARD RAIL SIMPLES (1X)", "TUBO DO GUARD RAIL SIMPLES (2X)", "TUBO DO GUARD RAIL SIMPLES (3X)", "TUBO DO GUARD RAIL DUPLO (1X)", "TUBO DO GUARD RAIL DUPLO (2X)", "TUBO DO GUARD RAIL DUPLO (3X)", "APOIO CENTRAL DO GUARD RAIL", "JUNÇÃO DE COLUNA", "OUTROS", "TAMPA DA PLACA DE BASE CONTÍNUA", "COLUNA GÔNDOLA", "LONGARINA INFERIOR DA GÔNDOLA", "LONGARINA DA GÔNDOLA DIREITA", "LONGARINA DA GÔNDOLA ESQUERDA", "APOIO CENTRAL DA GÔNDOLA", "APOIO DIREITO DA GÔNDOLA", "APOIO ESQUERDO DA GÔNDOLA", "BASE DA GÔNDOLA", "CESTO DA GÔNDOLA", "QUADRO DA GÔNDOLA", "PRATELEIRA BASE DA GÔNDOLA", "PRATELEIRA DA GÔNDOLA", "BRAÇO DA GÔNDOLA INTEGRADA", "BRAÇO DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA", "BRAÇO RACK DA GÔNDOLA INTEGRADA"], localOpcoes: ["FRONTAL", "TRASEIRA"], peca: "Componentes soldados nas estruturas porta-paletes e/ou gôndolas" },
  { id: "unidadeCarga", codigo: "9.33", categoria: "Gerais", familia: "Configuração, Adaptações e Uso", nivel: "montante", nome: "Folgas mínimas entre unidades de carga e colunas/longarinas/parede", descOpcoes: ["FOLGAS MÍNIMAS ENTRE AS UNIDADES DE CARGA"], peca: "Folgas mínimas entre unidades de carga e colunas/longarinas/parede" },
  { id: "luminaria", codigo: "9.34", categoria: "Iluminação", familia: "Ambiente e Iluminação", nivel: "estrutura", nome: "Altura das luminárias prejudicando operações de carga e descarga", descOpcoes: ["ALTURA DAS LUMINÁRIAS INADEQUADAS"], peca: "Altura das luminárias prejudicando operações de carga e descarga" },
  { id: "piso", codigo: "9.37", categoria: "Gerais", familia: "Ambiente e Iluminação", nivel: "estrutura", nome: "Parede do prédio e/ou piso industrial danificados, água empoçada ou goteiras", descOpcoes: ["PISO INDUSTRIAL DANIFICADO", "PISO INDUSTRIAL DESNIVELADO", "PAREDE DO PRÉDIO DANIFICADA", "COLUNA DO PRÉDIO DANIFICADA", "ÁGUA EMPOÇADA", "GOTEIRA", "OUTROS"], localOpcoes: ["FRONTAL", "TRASEIRA"], peca: "Parede do prédio e/ou piso industrial danificados, água empoçada ou goteiras" },
  { id: "iluminacao", codigo: "9.45", categoria: "Iluminação", familia: "Ambiente e Iluminação", nivel: "estrutura", nome: "Aferição de iluminação nos corredores", tipo: "medicao", unidade: "lux", min: 200, peca: "Aferição de iluminação nos corredores" },
];
const APP_VERSION = "2.13";
const APP_VERSION_DATE = "26/08/2026";
const CATALOG_VERSION = 4;
const DEFAULT_CONFIG = {
  empresa: "Minha Empresa",
  locais: ["Centro de Distribuição 001", "Loja Centro", "Loja Shopping"],
  fabricantes: ["ESMENA 75X78", "ESMENA TÚNEL 100X105", "PROVENÇA", "AGUIA ANTIGA MENOR 76X55", "AGUIA ANTIGA MAIOR 90X65", "AGUIA NOVA 91X70", "ESMENA MENOR 76X70", "ESMENA MEZANINO 50X50", "AGRA", "A. BOLLETI", "AVALTEC", "75X65", "90X80", "FAST", "OUTROS"],
  setores: ["SALÃO DE VENDAS", "DEPÓSITO", "CÂMARAS FRIGORÍFICAS", "OUTROS"],
  tiposEstrutura: ["SIMPLES ENTRADA", "DUPLA ENTRADA"],
  itens: DEFAULT_ITEMS,
  catalogVersion: CATALOG_VERSION,
};
function mergeCatalog(existingItens) {
  const defaultIds = new Set(DEFAULT_ITEMS.map((it) => it.id));
  const customExtra = (existingItens || []).filter((it) => !defaultIds.has(it.id));
  return DEFAULT_ITEMS.concat(customExtra);
}
function mergeLista(existing, defaults) {
  const defaultSet = new Set(defaults);
  const extra = (existing || []).filter((x) => !defaultSet.has(x));
  return defaults.concat(extra);
}
function itensMontante(config) { return (config.itens || []).filter((it) => it.nivel !== "estrutura"); }
function itensEstruturaCatalogo(config) { return (config.itens || []).filter((it) => it.nivel === "estrutura"); }
function itemAplicavel(it, e) {
  // Características condicionais (gôndola/mural/roletes) foram removidas — todos os itens sempre aparecem.
  return true;
}
const STATUS = {
  pendente: { label: "Pendente", short: "PEND", icon: "clock" },
  ok: { label: "Conforme", short: "OK", icon: "check" },
  problema: { label: "Com anomalia", short: "ANOM", icon: "alert" },
  naoaplica: { label: "Não se aplica", short: "N/A", icon: "minus" },
};
const SEVERITY_ORDER = ["problema", "pendente", "ok"];
function isProblem(status) { return status === "problema"; }
const GRAU_OPCOES = ["LEVE", "MÉDIO", "GRAVE", "GRAVÍSSIMO"];

/* ---------------- Utils ---------------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDateOnly(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return d && m && y ? `${d}/${m}/${y}` : isoDate;
}
function fmtDateShort(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return d && m && y ? `${d}/${m}/${y.slice(2)}` : isoDate;
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function overallStatus(itens) {
  for (const s of SEVERITY_ORDER) {
    if (itens.some((i) => i.status === s)) return s;
  }
  return "ok";
}
function vistoriaStatus(vistoria) {
  const all = (vistoria.estruturas || []).flatMap((e) => estruturaItensFlat(e));
  return all.length ? overallStatus(all) : "ok";
}
function statusFromMedicao(valor, min) {
  const v = parseFloat(String(valor).replace(",", "."));
  if (isNaN(v)) return "pendente";
  if (v >= min) return "ok";
  return "problema";
}
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h >= w && h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.55));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------------- IndexedDB ---------------- */
let dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open("inspecaoPP", 2);
  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("config")) db.createObjectStore("config");
    if (!db.objectStoreNames.contains("vistorias")) db.createObjectStore("vistorias", { keyPath: "id" });
    if (!db.objectStoreNames.contains("parts")) db.createObjectStore("parts");
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
async function idbGet(store, key) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly").objectStore(store).get(key);
    tx.onsuccess = () => resolve(tx.result);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbSet(store, key, value) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const os = db.transaction(store, "readwrite").objectStore(store);
    const req = key === undefined ? os.put(value) : os.put(value, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(store, key) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
async function idbGetAll(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/* ---------------- Estado global ---------------- */
const state = {
  config: DEFAULT_CONFIG,
  vistorias: [],
  orderedParts: {},
  screen: "home",
  activeVistoriaId: null,
  activeEstruturaId: null,
  activeMontanteId: null,
  activeEstItemId: null,
  activeChecklistItemId: null,
  draftVistoria: null,
  saveTimer: null,
};

async function boot() {
  const cfg = await idbGet("config", "main");
  if (!cfg) {
    state.config = DEFAULT_CONFIG;
    await idbSet("config", "main", DEFAULT_CONFIG);
  } else if ((cfg.catalogVersion || 0) < CATALOG_VERSION) {
    state.config = { ...cfg, itens: mergeCatalog(cfg.itens), fabricantes: mergeLista(cfg.fabricantes, DEFAULT_CONFIG.fabricantes), catalogVersion: CATALOG_VERSION };
    await idbSet("config", "main", state.config);
  } else {
    state.config = cfg;
  }
  await persistVistoriaList();
  const parts = await idbGet("parts", "main");
  state.orderedParts = parts || {};
  render();
  window.addEventListener("online", updateOfflineBanner);
  window.addEventListener("offline", updateOfflineBanner);
}
function updateOfflineBanner() {
  const b = document.getElementById("offline-banner");
  if (b) b.classList.toggle("show", !navigator.onLine);
}
async function persistVistoriaList() {
  state.vistorias = (await idbGetAll("vistorias")).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function go(screen, vistoriaId = null, estruturaId = null, montanteId = null, estItemId = null, checklistItemId = null) {
  state.screen = screen; state.activeVistoriaId = vistoriaId; state.activeEstruturaId = estruturaId; state.activeMontanteId = montanteId; state.activeEstItemId = estItemId; state.activeChecklistItemId = checklistItemId;
  render();
  window.scrollTo(0, 0);
}

/* ---------------- Render raiz ---------------- */
function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.appendChild(el("div", { id: "offline-banner", class: "offline-banner" + (!navigator.onLine ? " show" : "") }, "Sem conexão — os dados continuam sendo salvos normalmente no aparelho."));

  const estAtual = state.draftVistoria && (state.draftVistoria.estruturas || []).find((e) => e.id === state.activeEstruturaId);
  const montAtual = estAtual && (estAtual.montantes || []).find((m) => m.id === state.activeMontanteId);
  const estItemAtual = estAtual && (estAtual.itensEstrutura || []).find((it) => it.id === state.activeEstItemId);
  const checklistItemAtual = montAtual && montAtual.itens.find((it) => it.id === state.activeChecklistItemId);
  const titles = {
    home: "Início", vistoria: "Inspeção", estrutura: (estAtual && estAtual.codigo) || "Nova estrutura",
    montante: montAtual ? "Montante Nº " + montAtual.numero : "Montante",
    itemDetail: checklistItemAtual ? checklistItemAtual.nome : "Item",
    estItem: estItemAtual ? estItemAtual.nome : "Item da estrutura",
    history: "Histórico", config: "Configurações",
    hub: (state.vistorias.find((v) => v.id === state.activeVistoriaId) || {}).lojaCd || "Inspeção",
    report: (state.vistorias.find((v) => v.id === state.activeVistoriaId) || {}).lojaCd || "Relatório",
    partsInspection: "Lista de peças",
    painel: "Painel de Indicadores",
    anomalias: "Relatório de Anomalias",
  };
  const backTargets = {
    vistoria: () => go("home"),
    estrutura: () => go("vistoria", state.draftVistoria.id),
    montante: () => go("estrutura", state.draftVistoria.id, state.activeEstruturaId),
    itemDetail: () => go("montante", state.draftVistoria.id, state.activeEstruturaId, state.activeMontanteId),
    estItem: () => go("estrutura", state.draftVistoria.id, state.activeEstruturaId),
    history: () => go("home"),
    config: () => go("home"),
    hub: () => go("history"),
    report: () => go("hub", state.activeVistoriaId),
    partsInspection: () => go("hub", state.activeVistoriaId),
    painel: () => go("hub", state.activeVistoriaId),
    anomalias: () => go("report", state.activeVistoriaId),
  };
  app.appendChild(TopBar(titles[state.screen], state.screen !== "home" ? backTargets[state.screen] : null));

  const body = el("div", { style: "flex:1" });
  if (state.screen === "home") body.appendChild(HomeScreen());
  if (state.screen === "vistoria") body.appendChild(VistoriaScreen());
  if (state.screen === "estrutura") body.appendChild(EstruturaScreen());
  if (state.screen === "montante") body.appendChild(MontanteScreen());
  if (state.screen === "itemDetail") body.appendChild(ItemDetailScreen());
  if (state.screen === "estItem") body.appendChild(EstruturaItemScreen());
  if (state.screen === "history") body.appendChild(HistoryScreen());
  if (state.screen === "config") body.appendChild(ConfigScreen());
  if (state.screen === "hub") body.appendChild(InspectionHubScreen());
  if (state.screen === "report") body.appendChild(ReportScreen());
  if (state.screen === "partsInspection") body.appendChild(PartsInspectionScreen());
  if (state.screen === "painel") body.appendChild(PainelScreen());
  if (state.screen === "anomalias") body.appendChild(AnomaliasScreen());
  app.appendChild(body);
  app.appendChild(BottomNav());
}

function TopBar(title, onBack) {
  const bar = el("div", { class: "topbar no-print" });
  bar.appendChild(onBack ? el("button", { onclick: onBack, html: svg("back", 22) }) : el("img", { src: "icon-192.png", style: "width:22px;height:22px;border-radius:5px" }));
  bar.appendChild(el("h1", {}, title));
  return bar;
}
function BottomNav() {
  const items = [
    ["home", "Início", "home"], ["vistoria", "Inspeção", "plusCircle"], ["history", "Histórico", "clock"],
    ["config", "Ajustes", "settings"],
  ];
  const nav = el("div", { class: "bottomnav no-print" });
  items.forEach(([id, label, icon]) => {
    const active = id === state.screen || (id === "vistoria" && ["estrutura", "montante", "estItem", "itemDetail"].includes(state.screen)) || (id === "history" && ["hub", "report", "partsInspection", "anomalias", "painel"].includes(state.screen));
    const btn = el("button", { class: active ? "active" : "", onclick: () => go(id === "vistoria" ? "vistoria" : id) },
      el("span", { html: svg(icon, 20) }), el("span", { class: "label" }, label));
    nav.appendChild(btn);
  });
  return nav;
}
function Tag(status, size, labelOverride) {
  const s = STATUS[status];
  return el("span", { class: "tag " + status + (size === "sm" ? " sm" : "") },
    el("span", { html: svg(s.icon, size === "sm" ? 12 : 14) }), " " + (labelOverride || s.label));
}
function CodeBadge(codigo) {
  return codigo ? el("span", { class: "codebadge" }, codigo) : el("span");
}
function Card(attrs, ...children) { return el("div", { class: "card " + (attrs.class || ""), style: attrs.style || "" }, ...children); }
function Field(label, inputNode) { return el("div", { class: "field" }, el("label", {}, label), inputNode); }
function inputEl(value, onChange, placeholder, type) {
  const input = el("input", { class: "input", value: value || "", placeholder: placeholder || "", type: type || "text" });
  input.addEventListener("input", (e) => onChange(e.target.value));
  return input;
}
function selectEl(options, value, onChange) {
  const select = el("select", { class: "input" });
  (options || []).forEach((o) => select.appendChild(el("option", { value: o }, o)));
  select.value = value;
  select.addEventListener("change", (e) => onChange(e.target.value));
  return select;
}
function suggestInput(value, onChange, placeholder, options) {
  const wrap = el("div", { style: "position:relative" });
  const input = el("input", { class: "input", value: value || "", placeholder: placeholder || "", autocomplete: "off" });
  const list = el("div", { class: "suggest-list" });
  list.style.display = "none";

  function renderList(filterText) {
    const q = (filterText || "").toLowerCase();
    const matches = (options || []).filter((o) => o.toLowerCase().includes(q)).slice(0, 40);
    list.innerHTML = "";
    if (!matches.length) { list.style.display = "none"; return; }
    matches.forEach((opt) => {
      const item = el("div", { class: "suggest-item" }, opt);
      item.addEventListener("mousedown", (ev) => ev.preventDefault());
      item.addEventListener("click", () => {
        input.value = opt;
        onChange(opt);
        list.style.display = "none";
      });
      list.appendChild(item);
    });
    list.style.display = "block";
  }

  input.addEventListener("focus", () => renderList(input.value));
  input.addEventListener("input", (e) => { onChange(e.target.value); renderList(e.target.value); });
  input.addEventListener("blur", () => { setTimeout(() => { list.style.display = "none"; }, 180); });

  wrap.appendChild(input);
  wrap.appendChild(list);
  return wrap;
}

/* ---------------- Home ---------------- */
function HomeScreen() {
  const wrap = el("div", { class: "screen" });
  const finalizadas = state.vistorias.filter((v) => v.finalizada);
  const rascunhos = state.vistorias.filter((v) => !v.finalizada);
  const totalEstruturas = state.vistorias.reduce((sum, v) => sum + (v.estruturas || []).length, 0);

  wrap.appendChild(el("div", { style: "margin-bottom:18px" },
    el("img", { src: "logo-full.png", alt: state.config.empresa, style: "height:34px;display:block;margin-bottom:8px" }),
    el("h2", { style: "font-size:26px;margin-top:2px" }, "Inspeção de Porta-Pallets")));

  wrap.appendChild(el("button", { class: "cta", onclick: () => go("vistoria") },
    el("span", { style: "display:flex;align-items:center;gap:10px" }, el("span", { html: svg("building", 20) }), "Nova inspeção"),
    el("span", { html: svg("chevronRight", 18) })));

  const stats = el("div", { class: "stat-grid" },
    el("div", { class: "card stat-card" }, el("div", { class: "stat-num" }, String(finalizadas.length)), el("div", { class: "stat-label" }, "Concluídas")),
    el("div", { class: "card stat-card" }, el("div", { class: "stat-num" }, String(rascunhos.length)), el("div", { class: "stat-label" }, "Em andamento")),
    el("div", { class: "card stat-card" }, el("div", { class: "stat-num" }, String(totalEstruturas)), el("div", { class: "stat-label" }, "Estruturas inspecionadas")));
  wrap.appendChild(stats);

  if (rascunhos.length) {
    wrap.appendChild(el("h3", { class: "section-title" }, "Inspeções em andamento (salvas no aparelho)"));
    const list = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:18px" });
    rascunhos.forEach((v) => list.appendChild(VistoriaRow(v, true)));
    wrap.appendChild(list);
  }

  const head = el("div", { style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px" },
    el("h3", { class: "section-title", style: "margin:0" }, "Inspeções finalizadas"));
  if (finalizadas.length) head.appendChild(el("button", { style: "background:none;border:none;color:var(--ink-faint);font-size:12.5px", onclick: () => go("history") }, "ver tudo"));
  wrap.appendChild(head);

  const recentes = finalizadas.slice(0, 5);
  if (!recentes.length) {
    wrap.appendChild(el("div", { class: "card empty" }, el("div", { html: svg("clock", 26, "margin:0 auto 8px;opacity:.5;display:block") }), "Nenhuma inspeção concluída ainda."));
  } else {
    const list = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    recentes.forEach((v) => list.appendChild(VistoriaRow(v, false)));
    wrap.appendChild(list);
  }
  wrap.appendChild(el("div", { class: "mono", style: "text-align:center;color:var(--ink-faint);font-size:10.5px;margin-top:20px" }, `v${APP_VERSION} · ${APP_VERSION_DATE}`));
  return wrap;
}
function VistoriaRow(v, isDraft) {
  const nEst = (v.estruturas || []).length;
  const rightSide = isDraft
    ? el("div", { style: "display:flex;align-items:center;gap:8px" },
        el("span", { class: "badge-draft" }, "rascunho"),
        (() => {
          const b = el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("trash", 15) });
          b.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            if (confirm("Excluir este rascunho de inspeção? Essa ação não pode ser desfeita.")) {
              if (state.draftVistoria && state.draftVistoria.id === v.id) state.draftVistoria = null;
              await idbDelete("vistorias", v.id);
              await persistVistoriaList();
              render();
            }
          });
          return b;
        })())
    : Tag(vistoriaStatus(v), "sm");
  const row = el("div", { class: "insp-row", onclick: () => go(isDraft ? "vistoria" : "hub", v.id) },
    el("div", {},
      el("div", { class: "insp-code" }, v.lojaCd || "(sem Loja/CD ainda)"),
      el("div", { class: "insp-sub" }, (v.local ? v.local + " · " : "") + nEst + " estrutura" + (nEst === 1 ? "" : "s") + (v.inspetor ? " · " + v.inspetor : "")),
      el("div", { class: "insp-date" }, isDraft ? fmtDate(v.createdAt) : fmtDate(v.finalizadaAt || v.createdAt))),
    rightSide);
  return Card({ style: "padding:0;cursor:pointer" }, row);
}

/* ---------------- Inspeção (Loja/CD + lista de Estruturas) ---------------- */
function newVistoriaSkeleton() {
  return { id: uid(), lojaCd: "", local: "", data: todayStr(), inspetor: "", createdAt: new Date().toISOString(), finalizada: false, estruturas: [] };
}
function newOcorrencia() {
  return { id: uid(), montanteRef: "", descTxt: "", tipoTxt: "", localTxt: "", grauTxt: "", qtd: 1, correcao: "", obs: "", foto: null, valor: "" };
}
function newEstruturaItemRuntime(base) {
  return { ...base, revisado: false, ocorrencias: [] };
}
function newEstruturaSkeleton() {
  return {
    id: uid(), codigo: "", setor: "", tipoEstrutura: "",
    rua: "", lado: "", modulos: "", fabricante: "", resolvido: false,
    montantes: [],
    itensEstrutura: itensEstruturaCatalogo(state.config).map(newEstruturaItemRuntime),
  };
}
function newMontanteSkeleton(numero) {
  return { id: uid(), numero, itens: itensMontante(state.config).map((it) => ({ ...it, status: "pendente", obs: "", foto: null, valor: "", corte: "", qtd: 1, correcao: "", descTxt: "", tipoTxt: "", localTxt: "", grauTxt: "" })) };
}
function syncMontantes(e) {
  const target = parseInt(e.modulos, 10) || 0;
  e.montantes = e.montantes || [];
  for (let n = e.montantes.length + 1; n <= target; n++) e.montantes.push(newMontanteSkeleton(n));
}
function estruturaEstItemStatus(it) {
  if (it.ocorrencias && it.ocorrencias.length) return "problema";
  if (it.revisado) return "ok";
  return "pendente";
}
function estruturaItensFlat(e) {
  const montanteItens = (e.montantes || []).flatMap((m) => m.itens.filter((it) => itemAplicavel(it, e)));
  const estItens = (e.itensEstrutura || []).map((it) => ({ status: estruturaEstItemStatus(it) }));
  return montanteItens.concat(estItens);
}
function estruturaStatus(e) {
  const all = estruturaItensFlat(e);
  return all.length ? overallStatus(all) : "ok";
}
async function ensureVistoria(id) {
  if (id) {
    const existing = await idbGet("vistorias", id);
    if (existing) { state.draftVistoria = existing; return; }
  }
  if (state.draftVistoria && !state.draftVistoria.finalizada && !id) return;
  state.draftVistoria = newVistoriaSkeleton();
  await idbSet("vistorias", undefined, state.draftVistoria);
  await persistVistoriaList();
}
function saveVistoriaNow() {
  return idbSet("vistorias", undefined, state.draftVistoria).then(persistVistoriaList).then(updateSaveIndicator);
}
function saveVistoriaDebounced() {
  clearTimeout(state.saveTimer);
  showSaving();
  state.saveTimer = setTimeout(saveVistoriaNow, 400);
}
function showSaving() { const ind = document.getElementById("save-indicator"); if (ind) ind.textContent = "Salvando no aparelho…"; }
function updateSaveIndicator() { const ind = document.getElementById("save-indicator"); if (ind) ind.textContent = "✓ Salvo no aparelho"; }

function VistoriaScreen() {
  const wrap = el("div", { style: "padding-bottom:90px" });
  const inner = el("div", { class: "screen", style: "padding-top:16px" });
  wrap.appendChild(inner);

  const needsLoad = !state.draftVistoria || (state.activeVistoriaId && state.draftVistoria.id !== state.activeVistoriaId) || state.draftVistoria.finalizada;
  if (needsLoad) {
    inner.appendChild(el("div", { class: "empty" }, "Carregando…"));
    ensureVistoria(state.activeVistoriaId).then(render);
    return wrap;
  }

  const v = state.draftVistoria;
  const header = Card({ style: "margin-bottom:14px" });
  header.appendChild(el("div", { class: "field" }, el("label", {}, "Loja / CD"),
    (() => {
      const frag = suggestInput(v.lojaCd, (val) => { v.lojaCd = val; saveVistoriaDebounced(); }, "Digite o nome da Loja / CD", state.config.locais);
      const input = frag.querySelector("input");
      input.addEventListener("blur", () => {
        const val = input.value.trim();
        if (val && !state.config.locais.includes(val)) { state.config.locais.push(val); idbSet("config", "main", state.config); }
      });
      return frag;
    })()));
  header.appendChild(Field("Local (cidade/UF)", inputEl(v.local, (val) => { v.local = val; saveVistoriaDebounced(); }, "Ex: Osasco - SP")));
  header.appendChild(el("div", { class: "row2" },
    Field("Data", inputEl(v.data, (val) => { v.data = val; saveVistoriaDebounced(); }, "", "date")),
    Field("Inspetor(es)", inputEl(v.inspetor, (val) => { v.inspetor = val; saveVistoriaDebounced(); }, "Nome(s)"))));
  header.appendChild(el("div", { id: "save-indicator", class: "save-indicator" }, "✓ Salvo no aparelho"));
  inner.appendChild(header);

  const estHead = el("div", { style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px" },
    el("h3", { class: "section-title", style: "margin:0" }, `Estruturas (${(v.estruturas || []).length})`));
  inner.appendChild(estHead);

  const list = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:14px" });
  (v.estruturas || []).forEach((e) => list.appendChild(EstruturaRow(e, v)));
  inner.appendChild(list);

  const addEstBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:12px;display:flex;align-items:center;justify-content:center;gap:6px" },
    el("span", { html: svg("plus", 16) }), "Adicionar estrutura");
  addEstBtn.addEventListener("click", async () => {
    const nova = newEstruturaSkeleton();
    v.estruturas = v.estruturas || [];
    v.estruturas.push(nova);
    await saveVistoriaNow();
    go("estrutura", v.id, nova.id);
  });
  inner.appendChild(addEstBtn);

  const errBox = el("div", { id: "form-error" });
  inner.appendChild(errBox);

  const deleteDraftBtn = el("button", { class: "action-btn no-print", style: "background:#fff;color:var(--red-dark);border:1px solid var(--red-bg);margin-top:14px" },
    el("span", { html: svg("trash", 15) }), " Excluir este rascunho");
  deleteDraftBtn.addEventListener("click", async () => {
    if (confirm("Excluir este rascunho de inspeção? Essa ação não pode ser desfeita.")) {
      const id = v.id;
      state.draftVistoria = null;
      await idbDelete("vistorias", id);
      await persistVistoriaList();
      go("home");
    }
  });
  inner.appendChild(deleteDraftBtn);

  const submitWrap = el("div", { class: "sticky-submit no-print" },
    el("button", { class: "submit-btn", onclick: () => submitVistoria(v, errBox) }, "Concluir inspeção"));
  wrap.appendChild(submitWrap);
  return wrap;
}
function EstruturaRow(e, v) {
  const st = estruturaStatus(e);
  const nMont = (e.montantes || []).length;
  const row = el("div", { class: "insp-row", onclick: () => go("estrutura", v.id, e.id) },
    el("div", {},
      el("div", { class: "insp-code" }, e.codigo || "(sem código ainda)"),
      el("div", { class: "insp-sub" }, [e.rua && "Rua " + e.rua, e.lado && "Lado " + e.lado, nMont + " montante" + (nMont === 1 ? "" : "s")].filter(Boolean).join(" · "))),
    el("div", { style: "display:flex;align-items:center;gap:8px" },
      Tag(st, "sm"),
      (() => { const b = el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("trash", 15) }); b.addEventListener("click", (ev) => { ev.stopPropagation(); if (confirm("Remover esta estrutura da vistoria?")) { v.estruturas = v.estruturas.filter((x) => x.id !== e.id); saveVistoriaNow().then(render); } }); return b; })()));
  return Card({ style: "padding:0;cursor:pointer" }, row);
}
function submitVistoria(v, errBox) {
  errBox.innerHTML = "";
  const showErr = (msg) => errBox.appendChild(el("div", { style: "margin-top:12px;background:var(--red-bg);color:var(--red-dark);padding:10px 12px;border-radius:8px;font-size:13px;font-weight:600" }, msg));
  if (!v.lojaCd || !v.lojaCd.trim()) return showErr("Informe a Loja / CD.");
  if (!v.inspetor || !v.inspetor.trim()) return showErr("Informe o(s) inspetor(es).");
  if (!v.estruturas || !v.estruturas.length) return showErr("Adicione pelo menos uma estrutura antes de concluir.");
  const semCodigo = v.estruturas.find((e) => !e.codigo || !e.codigo.trim());
  if (semCodigo) return showErr("Toda estrutura precisa de um código — falta preencher pelo menos uma.");
  v.finalizada = true;
  v.finalizadaAt = new Date().toISOString();
  idbSet("vistorias", undefined, v).then(async () => {
    await persistVistoriaList();
    const id = v.id;
    state.draftVistoria = null;
    go("report", id);
  });
}

/* ---------------- Estrutura (checklist 9.x) ---------------- */
function EstruturaScreen() {
  const wrap = el("div", { style: "padding-bottom:90px" });
  const inner = el("div", { class: "screen", style: "padding-top:16px" });
  wrap.appendChild(inner);

  const v = state.draftVistoria;
  if (!v) { inner.appendChild(el("div", { class: "empty" }, "Carregando…")); return wrap; }
  const e = (v.estruturas || []).find((x) => x.id === state.activeEstruturaId);
  if (!e) { inner.appendChild(el("div", { class: "empty" }, "Estrutura não encontrada.")); return wrap; }

  const header = Card({ style: "margin-bottom:14px" });
  header.appendChild(Field("Código da estrutura", inputEl(e.codigo, (val) => { e.codigo = val; saveVistoriaDebounced(); }, "Digite a identificação da estrutura")));
  header.appendChild(el("div", { class: "row2" },
    (() => {
      const fieldWrap = el("div", { class: "field" }, el("label", {}, "Setor"));
      const frag = suggestInput(e.setor, (val) => { e.setor = val; saveVistoriaDebounced(); }, "Digite o setor", state.config.setores);
      const input = frag.querySelector("input");
      input.addEventListener("blur", () => {
        const val = input.value.trim();
        if (val && !state.config.setores.includes(val)) { state.config.setores.push(val); idbSet("config", "main", state.config); }
      });
      fieldWrap.appendChild(frag);
      return fieldWrap;
    })(),
    (() => {
      const fieldWrap = el("div", { class: "field" }, el("label", {}, "Tipo de estrutura"));
      const frag = suggestInput(e.tipoEstrutura, (val) => { e.tipoEstrutura = val; saveVistoriaDebounced(); }, "Digite o tipo", state.config.tiposEstrutura);
      const input = frag.querySelector("input");
      input.addEventListener("blur", () => {
        const val = input.value.trim();
        if (val && !state.config.tiposEstrutura.includes(val)) { state.config.tiposEstrutura.push(val); idbSet("config", "main", state.config); }
      });
      fieldWrap.appendChild(frag);
      return fieldWrap;
    })()));
  header.appendChild(el("div", { class: "row2" },
    Field("Rua", inputEl(e.rua, (val) => { e.rua = val; saveVistoriaDebounced(); }, "Ex: 03")),
    Field("Lado", inputEl(e.lado, (val) => { e.lado = val; saveVistoriaDebounced(); }, "Ex: ímpar"))));
  header.appendChild(el("div", { class: "row2" },
    (() => {
      const fieldWrap = el("div", { class: "field" }, el("label", {}, "Qtd. Montantes"));
      const input = inputEl(e.modulos, (val) => { e.modulos = val; saveVistoriaDebounced(); }, "Ex: 32", "number");
      input.addEventListener("blur", () => { syncMontantes(e); saveVistoriaNow().then(render); });
      fieldWrap.appendChild(input);
      return fieldWrap;
    })(),
    (() => {
      const fieldWrap = el("div", { class: "field" }, el("label", {}, "Fabricante"));
      const frag = suggestInput(e.fabricante, (val) => { e.fabricante = val; saveVistoriaDebounced(); }, "Digite o fabricante", state.config.fabricantes);
      const input = frag.querySelector("input");
      input.addEventListener("blur", () => {
        const val = input.value.trim();
        if (val && !state.config.fabricantes.includes(val)) { state.config.fabricantes.push(val); idbSet("config", "main", state.config); }
      });
      fieldWrap.appendChild(frag);
      return fieldWrap;
    })()));
  header.appendChild(el("div", { id: "save-indicator", class: "save-indicator" }, "✓ Salvo no aparelho"));
  inner.appendChild(header);

  if ((e.itensEstrutura || []).length) {
    if (!(e.id in estItemsCollapseState)) estItemsCollapseState[e.id] = true;
    const collapsed = estItemsCollapseState[e.id];
    const estHeader = el("div", { class: "card", style: "padding:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px" },
      el("div", { style: "font-weight:700;font-size:13.5px" }, "Itens da estrutura (avaliados uma vez)"),
      el("span", { html: svg("chevronRight", 16, collapsed ? "" : "transform:rotate(90deg)"), style: "color:var(--ink-faint);flex-shrink:0" }));
    estHeader.addEventListener("click", () => { estItemsCollapseState[e.id] = !estItemsCollapseState[e.id]; render(); });
    inner.appendChild(estHeader);

    if (!collapsed) {
      const estList = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:18px" });
      e.itensEstrutura.forEach((it) => estList.appendChild(EstruturaItemRow(it, e, v)));
      inner.appendChild(estList);
    }
  }

  const montHead = el("div", { style: "display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px" },
    el("h3", { class: "section-title", style: "margin:0" }, `Montantes (${(e.montantes || []).length})`));
  inner.appendChild(montHead);

  const totalM = (e.montantes || []).length;

  const target = parseInt(e.modulos, 10) || 0;
  if (target > (e.montantes || []).length) {
    const syncBar = el("div", { style: "display:flex;align-items:center;justify-content:space-between;background:var(--amber-bg);color:var(--amber-dark);padding:8px 12px;border-radius:8px;font-size:12.5px;margin-bottom:10px" },
      el("span", {}, `Faltam ${target - (e.montantes || []).length} montante(s) para bater com a Qtd. Montantes.`));
    const syncBtn = el("button", { class: "ghost-btn", style: "background:#fff" }, "Gerar agora");
    syncBtn.addEventListener("click", async () => { syncMontantes(e); await saveVistoriaNow(); render(); });
    syncBar.appendChild(syncBtn);
    inner.appendChild(syncBar);
  }

  if (totalM) {
    const jumpRow = el("div", { class: "row", style: "margin-bottom:10px" });
    const jumpInput = el("input", { class: "input", type: "number", placeholder: "Ir para o Nº..." });
    const jumpBtn = el("button", { class: "ghost-btn" }, "Ir");
    const doJump = () => {
      const n = parseInt(jumpInput.value, 10);
      const alvo = (e.montantes || []).find((m) => m.numero === n);
      if (alvo) go("montante", v.id, e.id, alvo.id);
      else alert("Montante Nº " + n + " não encontrado nesta estrutura.");
    };
    jumpBtn.addEventListener("click", doJump);
    jumpInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") doJump(); });
    jumpRow.appendChild(jumpInput); jumpRow.appendChild(jumpBtn);
    inner.appendChild(jumpRow);

    let filtro = "todos";
    let visivel = 100;
    const filterRow = el("div", { class: "chip-row" });
    const montList = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    const loadMoreWrap = el("div", { style: "margin-top:10px" });
    const filtros = [["todos", "Todos"], ["pendente", "Pendentes"], ["problema", "Com anomalia"], ["ok", "Conforme"]];

    function passaFiltro(m) {
      const itensAplic = m.itens.filter((it) => itemAplicavel(it, e));
      if (filtro === "todos") return true;
      if (filtro === "pendente") return itensAplic.some((i) => i.status === "pendente");
      if (filtro === "problema") return itensAplic.some((i) => isProblem(i.status));
      if (filtro === "ok") return itensAplic.length > 0 && itensAplic.every((i) => i.status === "ok" || i.status === "naoaplica");
      return true;
    }
    function refreshList() {
      filterRow.innerHTML = "";
      filtros.forEach(([key, label]) => {
        const chip = el("button", { class: "chip" + (filtro === key ? " active" : "") }, label);
        chip.addEventListener("click", () => { filtro = key; visivel = 100; refreshList(); });
        filterRow.appendChild(chip);
      });
      const filtrados = (e.montantes || []).filter(passaFiltro);
      montList.innerHTML = "";
      filtrados.slice(0, visivel).forEach((m) => montList.appendChild(MontanteRow(m, e, v)));
      loadMoreWrap.innerHTML = "";
      if (filtrados.length > visivel) {
        const moreBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:12px" }, `Carregar mais (${Math.min(visivel, filtrados.length)} de ${filtrados.length})`);
        moreBtn.addEventListener("click", () => { visivel += 100; refreshList(); });
        loadMoreWrap.appendChild(moreBtn);
      }
      if (!filtrados.length) montList.appendChild(el("div", { class: "card empty" }, "Nenhum montante nesse filtro."));
    }
    refreshList();
    inner.appendChild(filterRow);
    inner.appendChild(montList);
    inner.appendChild(loadMoreWrap);
  } else {
    inner.appendChild(el("div", { class: "card empty" }, "Informe a Qtd. Montantes acima para gerar os montantes automaticamente."));
  }

  const submitWrap = el("div", { class: "sticky-submit no-print" },
    el("button", { class: "submit-btn" }, "Voltar para a inspeção"));
  submitWrap.querySelector("button").addEventListener("click", async () => { clearTimeout(state.saveTimer); await saveVistoriaNow(); go("vistoria", v.id); });
  wrap.appendChild(submitWrap);
  return wrap;
}
function EstruturaItemRow(it, e, v) {
  const st = estruturaEstItemStatus(it);
  const n = (it.ocorrencias || []).length;
  const row = el("div", { class: "insp-row", onclick: () => go("estItem", v.id, e.id, null, it.id) },
    el("div", {},
      el("div", { class: "insp-code" }, CodeBadge(it.codigo), it.nome),
      el("div", { class: "insp-sub" }, n ? n + " ocorrência" + (n === 1 ? "" : "s") : (it.revisado ? "Conforme" : "Ainda não avaliado"))),
    Tag(st, "sm"));
  return Card({ style: "padding:0;cursor:pointer" }, row);
}
function EstruturaItemScreen() {
  const wrap = el("div", { class: "screen", style: "padding-bottom:30px" });
  const v = state.draftVistoria;
  if (!v) { wrap.appendChild(el("div", { class: "empty" }, "Carregando…")); return wrap; }
  const e = (v.estruturas || []).find((x) => x.id === state.activeEstruturaId);
  if (!e) { wrap.appendChild(el("div", { class: "empty" }, "Estrutura não encontrada.")); return wrap; }
  const it = (e.itensEstrutura || []).find((x) => x.id === state.activeEstItemId);
  if (!it) { wrap.appendChild(el("div", { class: "empty" }, "Item não encontrado.")); return wrap; }

  wrap.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-faint);margin-bottom:10px" }, `Estrutura ${e.codigo || "—"}`));
  wrap.appendChild(el("div", { id: "save-indicator", class: "save-indicator", style: "margin-bottom:14px" }, "✓ Salvo no aparelho"));

  if (!it.ocorrencias.length) {
    const okBtn = el("button", { class: "submit-btn", style: "width:100%;margin-bottom:14px" }, "✓ Conforme (nenhuma ocorrência)");
    okBtn.addEventListener("click", async () => { it.revisado = true; await saveVistoriaNow(); go("estrutura", v.id, e.id); });
    wrap.appendChild(okBtn);
  }

  const list = el("div", { style: "display:flex;flex-direction:column;gap:10px;margin-bottom:14px" });
  it.ocorrencias.forEach((oc, idx) => list.appendChild(OcorrenciaCard(oc, idx, it)));
  wrap.appendChild(list);

  const addBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:12px;display:flex;align-items:center;justify-content:center;gap:6px" },
    el("span", { html: svg("plus", 16) }), "Adicionar ocorrência");
  addBtn.addEventListener("click", async () => { it.ocorrencias.push(newOcorrencia()); await saveVistoriaNow(); render(); });
  wrap.appendChild(addBtn);

  const backBtn = el("button", { class: "submit-btn", style: "width:100%;margin-top:16px" }, "Voltar para a estrutura");
  backBtn.addEventListener("click", async () => { await saveVistoriaNow(); go("estrutura", v.id, e.id); });
  wrap.appendChild(backBtn);
  return wrap;
}
function OcorrenciaCard(oc, idx, it) {
  const card = Card({ style: "padding:12px" });
  card.appendChild(el("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px" },
    el("div", { style: "font-weight:700;font-size:13px" }, "Ocorrência " + (idx + 1)),
    (() => { const b = el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("trash", 15) }); b.addEventListener("click", async () => { if (confirm("Remover esta ocorrência?")) { it.ocorrencias.splice(idx, 1); await saveVistoriaNow(); render(); } }); return b; })()));

  card.appendChild(Field("Montante(s) de referência", inputEl(oc.montanteRef, (val) => { oc.montanteRef = val; saveVistoriaDebounced(); }, "Ex: Montante 5, ou 12 e 27")));

  if (it.tipo === "medicao") {
    card.appendChild(Field(`Valor medido (${it.unidade})`, inputEl(oc.valor, (val) => { oc.valor = val; saveVistoriaDebounced(); }, `Mínimo ${it.min}`, "number")));
  }
  if (it.descOpcoes) card.appendChild(Field("Descrição", suggestInput(oc.descTxt, (val) => { oc.descTxt = val; saveVistoriaDebounced(); }, "Digite a descrição", it.descOpcoes)));
  if (it.tipoOpcoes) card.appendChild(Field("Tipo", suggestInput(oc.tipoTxt, (val) => { oc.tipoTxt = val; saveVistoriaDebounced(); }, "Digite o tipo/componente", it.tipoOpcoes)));
  if (it.localOpcoes) card.appendChild(Field(it.localLabel || "Localização", suggestInput(oc.localTxt, (val) => { oc.localTxt = val; saveVistoriaDebounced(); }, "Digite a localização", it.localOpcoes)));
  card.appendChild(Field("Grau", suggestInput(oc.grauTxt, (val) => { oc.grauTxt = val; saveVistoriaDebounced(); }, "Leve, Médio, Grave, Gravíssimo", GRAU_OPCOES)));
  card.appendChild(Field("Quantidade", inputEl(oc.qtd == null ? 1 : oc.qtd, (val) => { oc.qtd = val; saveVistoriaDebounced(); }, "1", "number")));

  const obsBox = el("textarea", { class: "input", rows: 2, placeholder: "Observação (opcional)", style: "resize:vertical" });
  obsBox.value = oc.obs || "";
  obsBox.addEventListener("input", (ev) => { oc.obs = ev.target.value; saveVistoriaDebounced(); });
  card.appendChild(el("div", { class: "field" }, el("label", {}, "Observações"), obsBox));

  const photoWrap = el("div", { style: "margin-top:4px" });
  renderPhotoArea(photoWrap, oc);
  card.appendChild(photoWrap);
  return card;
}

function MontanteRow(m, e, v) {
  const itensAplic = m.itens.filter((it) => itemAplicavel(it, e));
  const st = overallStatus(itensAplic);
  const apontamentos = itensAplic.filter((i) => isProblem(i.status)).length;
  const naoInspecionados = itensAplic.filter((i) => i.status === "pendente").length;
  let sub = "Conforme";
  if (apontamentos) sub = apontamentos + " com apontamento";
  else if (naoInspecionados) sub = naoInspecionados + " item(ns) ainda não inspecionado(s)";
  const row = el("div", { class: "insp-row", onclick: () => go("montante", v.id, e.id, m.id) },
    el("div", {},
      el("div", { class: "insp-code" }, "Montante Nº " + m.numero),
      el("div", { class: "insp-sub" }, sub)),
    Tag(st, "sm"));
  return Card({ style: "padding:0;cursor:pointer" }, row);
}

/* ---------------- Montante (checklist 9.x) ---------------- */
const familyCollapseState = {};
const estItemsCollapseState = {};
function FamilySection(familia, itensFamilia, e, m) {
  if (!(familia in familyCollapseState)) familyCollapseState[familia] = true;
  const st = overallStatus(itensFamilia);
  const pendentes = itensFamilia.filter((i) => i.status === "pendente").length;
  const apontamentos = itensFamilia.filter((i) => isProblem(i.status)).length;

  const section = el("div", { style: "margin-bottom:12px" });
  const header = el("div", { class: "card", style: "padding:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px" });
  header.appendChild(el("div", {},
    el("div", { style: "font-weight:700;font-size:13.5px" }, familia),
    el("div", { style: "font-size:11.5px;color:var(--ink-faint);margin-top:2px" }, `${itensFamilia.length} itens` + (apontamentos ? ` · ${apontamentos} com apontamento` : pendentes ? ` · ${pendentes} pendente(s)` : " · conforme"))));
  header.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px" }, Tag(st, "sm"), el("span", { html: svg("chevronRight", 16, familyCollapseState[familia] ? "" : "transform:rotate(90deg)"), style: "color:var(--ink-faint)" })));
  section.appendChild(header);

  const body = el("div", { style: "margin-top:8px;display:" + (familyCollapseState[familia] ? "none" : "block") });
  if (pendentes > 0) {
    const btnFam = el("button", { class: "ghost-btn", style: "width:100%;padding:9px;margin-bottom:8px" }, "✓ Marcar família conforme");
    btnFam.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      itensFamilia.forEach((it) => { it.status = "ok"; it.obs = ""; it.descTxt = ""; it.tipoTxt = ""; it.localTxt = ""; it.grauTxt = ""; it.foto = null; it.uiCollapsed = false; });
      await saveVistoriaNow();
      render();
    });
    body.appendChild(btnFam);
  }
  itensFamilia.forEach((it) => body.appendChild(ChecklistItemRow(it, e, m)));
  section.appendChild(body);

  header.addEventListener("click", () => { familyCollapseState[familia] = !familyCollapseState[familia]; render(); });
  return section;
}
function ChecklistItemRow(item, e, m) {
  const row = el("div", { class: "insp-row", onclick: () => go("itemDetail", state.draftVistoria.id, e.id, m.id, null, item.id) },
    el("div", {}, el("div", { class: "insp-code" }, CodeBadge(item.codigo), item.nome)),
    el("div", { style: "display:flex;align-items:center;gap:8px" }, Tag(item.status, "sm"), el("span", { html: svg("chevronRight", 16), style: "color:var(--ink-faint)" })));
  return Card({ style: "padding:0;margin-bottom:8px;cursor:pointer" }, row);
}

function MontanteScreen() {
  const wrap = el("div", { style: "padding-bottom:90px" });
  const inner = el("div", { class: "screen", style: "padding-top:16px" });
  wrap.appendChild(inner);

  const v = state.draftVistoria;
  if (!v) { inner.appendChild(el("div", { class: "empty" }, "Carregando…")); return wrap; }
  const e = (v.estruturas || []).find((x) => x.id === state.activeEstruturaId);
  if (!e) { inner.appendChild(el("div", { class: "empty" }, "Estrutura não encontrada.")); return wrap; }
  const m = (e.montantes || []).find((x) => x.id === state.activeMontanteId);
  if (!m) { inner.appendChild(el("div", { class: "empty" }, "Montante não encontrado.")); return wrap; }

  inner.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-faint);margin-bottom:10px" }, `Estrutura ${e.codigo || "—"} · Montante Nº ${m.numero}`));
  inner.appendChild(el("div", { id: "save-indicator", class: "save-indicator", style: "margin-bottom:10px" }, "✓ Salvo no aparelho"));

  const quickRow = el("div", { class: "row", style: "margin-bottom:14px" });
  const btnTudoConforme = el("button", { class: "ghost-btn", style: "flex:1;padding:10px" }, "✓ Marcar tudo conforme");
  btnTudoConforme.addEventListener("click", async () => {
    m.itens.forEach((it) => { it.status = "ok"; it.obs = ""; it.descTxt = ""; it.tipoTxt = ""; it.localTxt = ""; it.grauTxt = ""; it.foto = null; it.uiCollapsed = false; });
    await saveVistoriaNow();
    render();
  });
  const btnReplicar = el("button", { class: "ghost-btn", style: "flex:1;padding:10px" }, "⧉ Replicar p/ pendentes");
  btnReplicar.addEventListener("click", async () => {
    const alvos = (e.montantes || []).filter((x) => x.id !== m.id && x.itens.every((i) => i.status === "pendente"));
    if (!alvos.length) { alert("Não há montantes pendentes (ainda não tocados) nesta estrutura para replicar."); return; }
    if (!confirm(`Isso vai copiar o resultado do Montante Nº ${m.numero} para ${alvos.length} montante(s) ainda pendente(s) nesta estrutura (fotos não são copiadas). Continuar?`)) return;
    alvos.forEach((x) => { x.itens = m.itens.map((it) => ({ ...JSON.parse(JSON.stringify(it)), foto: null })); });
    await saveVistoriaNow();
    go("estrutura", v.id, e.id);
  });
  quickRow.appendChild(btnTudoConforme); quickRow.appendChild(btnReplicar);
  inner.appendChild(quickRow);

  const ordenadosParaCopia = (e.montantes || []).slice().sort((a, b) => a.numero - b.numero);
  const idxAtual = ordenadosParaCopia.findIndex((x) => x.id === m.id);
  const proximoParaCopia = ordenadosParaCopia[idxAtual + 1];
  const copyRow = el("div", { style: "margin-bottom:14px" });
  const btnCopiarProximo = el("button", { class: "ghost-btn", style: "width:100%;padding:10px" }, "→ Copiar pro próximo montante");
  if (!proximoParaCopia) { btnCopiarProximo.disabled = true; btnCopiarProximo.style.opacity = "0.4"; }
  btnCopiarProximo.addEventListener("click", async () => {
    if (!proximoParaCopia) return;
    const jaTemDados = proximoParaCopia.itens.some((i) => i.status !== "pendente");
    if (jaTemDados && !confirm(`O Montante Nº ${proximoParaCopia.numero} já tem dados preenchidos. Sobrescrever com o resultado deste montante (Nº ${m.numero})?`)) return;
    proximoParaCopia.itens = m.itens.map((it) => ({ ...JSON.parse(JSON.stringify(it)), foto: null }));
    await saveVistoriaNow();
    go("montante", v.id, e.id, proximoParaCopia.id);
  });
  copyRow.appendChild(btnCopiarProximo);
  inner.appendChild(copyRow);

  const itensAplicaveis = m.itens.filter((it) => itemAplicavel(it, e));
  const pending = itensAplicaveis.filter((i) => isProblem(i.status)).length;
  const headRow = el("div", { style: "display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px" },
    el("h3", { class: "section-title", style: "margin:0" }, `Checklist (${itensAplicaveis.length} itens)`));
  if (pending) headRow.appendChild(el("span", { style: "font-size:12px;color:var(--amber-dark);font-weight:600" }, pending + " com apontamento"));
  inner.appendChild(headRow);

  const list = el("div", {});
  FAMILIAS_ORDEM.forEach((familia) => {
    const itensFamilia = itensAplicaveis.filter((it) => it.familia === familia);
    if (!itensFamilia.length) return;
    list.appendChild(FamilySection(familia, itensFamilia, e, m));
  });
  inner.appendChild(list);

  const ordenados = (e.montantes || []).slice().sort((a, b) => a.numero - b.numero);
  const idx = ordenados.findIndex((x) => x.id === m.id);
  const prevM = ordenados[idx - 1];
  const nextM = ordenados[idx + 1];
  const navRow = el("div", { class: "row no-print", style: "margin-top:14px" });
  const btnPrev = el("button", { class: "ghost-btn", style: "flex:1;padding:12px" }, "◀ Anterior");
  btnPrev.disabled = !prevM;
  if (!prevM) btnPrev.style.opacity = "0.4";
  btnPrev.addEventListener("click", async () => { clearTimeout(state.saveTimer); await saveVistoriaNow(); if (prevM) go("montante", v.id, e.id, prevM.id); });
  const btnNext = el("button", { class: "ghost-btn", style: "flex:1;padding:12px" }, "Próximo ▶");
  btnNext.disabled = !nextM;
  if (!nextM) btnNext.style.opacity = "0.4";
  btnNext.addEventListener("click", async () => { clearTimeout(state.saveTimer); await saveVistoriaNow(); if (nextM) go("montante", v.id, e.id, nextM.id); });
  navRow.appendChild(btnPrev); navRow.appendChild(btnNext);
  inner.appendChild(navRow);

  const submitWrap = el("div", { class: "sticky-submit no-print" },
    el("button", { class: "submit-btn" }, "Voltar para a estrutura"));
  submitWrap.querySelector("button").addEventListener("click", async () => { clearTimeout(state.saveTimer); await saveVistoriaNow(); go("estrutura", v.id, e.id); });
  wrap.appendChild(submitWrap);
  return wrap;
}

function statusSelect(item) {
  const sel = el("select", { class: "status-select status-select-" + item.status });
  [["pendente", "Pendente"], ["ok", "Conforme"], ["problema", "Com anomalia"], ["naoaplica", "Não se aplica"]].forEach(([val, label]) => {
    sel.appendChild(el("option", { value: val }, label));
  });
  sel.value = item.status;
  sel.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "ok") { item.status = "ok"; item.obs = ""; item.descTxt = ""; item.tipoTxt = ""; item.localTxt = ""; item.grauTxt = ""; item.uiCollapsed = false; }
    else if (val === "problema") { item.status = "problema"; item.uiCollapsed = false; }
    else if (val === "naoaplica") { item.status = "naoaplica"; item.obs = ""; item.descTxt = ""; item.tipoTxt = ""; item.localTxt = ""; item.grauTxt = ""; item.uiCollapsed = false; }
    else { item.status = "pendente"; }
    saveVistoriaDebounced();
    render();
  });
  return sel;
}
function ItemDetailScreen() {
  const wrap = el("div", { class: "screen", style: "padding-bottom:30px" });
  const v = state.draftVistoria;
  if (!v) { wrap.appendChild(el("div", { class: "empty" }, "Carregando…")); return wrap; }
  const e = (v.estruturas || []).find((x) => x.id === state.activeEstruturaId);
  if (!e) { wrap.appendChild(el("div", { class: "empty" }, "Estrutura não encontrada.")); return wrap; }
  const m = (e.montantes || []).find((x) => x.id === state.activeMontanteId);
  if (!m) { wrap.appendChild(el("div", { class: "empty" }, "Montante não encontrado.")); return wrap; }
  const item = m.itens.find((x) => x.id === state.activeChecklistItemId);
  if (!item) { wrap.appendChild(el("div", { class: "empty" }, "Item não encontrado.")); return wrap; }

  wrap.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-faint);margin-bottom:4px" }, `Estrutura ${e.codigo || "—"} · Montante Nº ${m.numero}`));
  wrap.appendChild(el("div", { class: "item-name", style: "font-size:16px;margin-bottom:14px" }, CodeBadge(item.codigo), item.nome));

  if (item.tipo === "medicao") {
    const row = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:14px" });
    const input = el("input", { class: "input", type: "number", inputmode: "decimal", value: item.valor || "", placeholder: `Valor em ${item.unidade} (mínimo ${item.min})`, style: "flex:1" });
    input.addEventListener("input", (e2) => {
      item.valor = e2.target.value;
      item.status = item.valor === "" ? "pendente" : statusFromMedicao(item.valor, item.min);
      saveVistoriaDebounced();
      render();
    });
    row.appendChild(input);
    row.appendChild(Tag(item.status, "sm"));
    wrap.appendChild(row);
  } else {
    const btnRow = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:16px" });
    const opcoes = [["ok", "Conforme", "check"], ["problema", "Com anomalia", "alert"], ["naoaplica", "Não se aplica", "minus"]];
    opcoes.forEach(([val, label, icon]) => {
      const active = item.status === val;
      const btn = el("button", { class: "status-btn" + (active ? " active-" + val : ""), style: "width:100%;padding:13px;font-size:13px" },
        el("span", { html: svg(icon, 16) }), label);
      btn.addEventListener("click", () => {
        if (val === "ok" || val === "naoaplica") { item.status = val; item.obs = ""; item.descTxt = ""; item.tipoTxt = ""; item.localTxt = ""; item.grauTxt = ""; }
        else { item.status = "problema"; }
        saveVistoriaDebounced();
        render();
      });
      btnRow.appendChild(btn);
    });
    wrap.appendChild(btnRow);

    if (isProblem(item.status)) {
      if (item.descOpcoes) wrap.appendChild(Field("Descrição", suggestInput(item.descTxt, (val) => { item.descTxt = val; saveVistoriaDebounced(); }, "Digite a descrição da anomalia", item.descOpcoes)));
      if (item.tipoOpcoes) wrap.appendChild(Field("Tipo", suggestInput(item.tipoTxt, (val) => { item.tipoTxt = val; saveVistoriaDebounced(); }, "Digite o tipo/componente", item.tipoOpcoes)));
      wrap.appendChild(Field("Nível", inputEl(item.corte || "", (val) => { item.corte = val; saveVistoriaDebounced(); }, "Ex: 1, 3, 18")));
      if (item.localOpcoes) wrap.appendChild(Field(item.localLabel || "Localização", suggestInput(item.localTxt, (val) => { item.localTxt = val; saveVistoriaDebounced(); }, "Digite a localização", item.localOpcoes)));
      wrap.appendChild(Field("Grau", suggestInput(item.grauTxt, (val) => { item.grauTxt = val; saveVistoriaDebounced(); }, "Digite o grau (Leve, Médio, Grave, Gravíssimo)", GRAU_OPCOES)));

      const obsBox = el("textarea", { class: "input", rows: 2, placeholder: "Observação (opcional)", style: "resize:vertical" });
      obsBox.value = item.obs || "";
      obsBox.addEventListener("input", (e2) => { item.obs = e2.target.value; saveVistoriaDebounced(); });
      wrap.appendChild(el("div", { class: "field" }, el("label", {}, "Observações"), obsBox));

      wrap.appendChild(Field("Quantidade", inputEl(item.qtd == null ? 1 : item.qtd, (val) => { item.qtd = val; saveVistoriaDebounced(); }, "1", "number")));

      const photoWrap = el("div", { style: "margin-bottom:8px" });
      renderPhotoArea(photoWrap, item);
      wrap.appendChild(photoWrap);
    }
  }

  const backBtn = el("button", { class: "submit-btn", style: "width:100%;margin-top:14px" }, "Voltar para o montante");
  backBtn.addEventListener("click", async () => { await saveVistoriaNow(); go("montante", v.id, e.id, m.id); });
  wrap.appendChild(backBtn);
  return wrap;
}
function ChipMultiSelect(label, options, selectedArr, onChange) {
  const wrap = el("div", { class: "field" }, el("label", {}, label + (selectedArr.length ? ` (${selectedArr.length} selecionada${selectedArr.length > 1 ? "s" : ""})` : "")));
  const chipWrap = el("div", { class: "chip-select-wrap" });
  options.forEach((opt) => {
    const active = selectedArr.includes(opt);
    const chip = el("button", { class: "chip-select" + (active ? " active" : "") }, opt);
    chip.addEventListener("click", () => {
      const idx = selectedArr.indexOf(opt);
      if (idx >= 0) selectedArr.splice(idx, 1); else selectedArr.push(opt);
      onChange();
      chip.classList.toggle("active");
      const lbl = wrap.querySelector("label");
      lbl.textContent = label + (selectedArr.length ? ` (${selectedArr.length} selecionada${selectedArr.length > 1 ? "s" : ""})` : "");
    });
    chipWrap.appendChild(chip);
  });
  wrap.appendChild(chipWrap);
  return wrap;
}
function renderPhotoArea(container, item) {
  container.innerHTML = "";
  if (item.foto) {
    const wrap = el("div", { class: "photo-wrap" },
      el("img", { class: "photo-thumb", src: item.foto }),
      el("button", { class: "photo-remove", html: svg("x", 12) }));
    wrap.querySelector(".photo-remove").addEventListener("click", () => { item.foto = null; saveVistoriaNow(); renderPhotoArea(container, item); });
    container.appendChild(wrap);
  } else {
    const btn = el("button", { class: "photo-add-btn" }, el("span", { html: svg("camera", 15) }), "Anexar foto");
    const input = el("input", { type: "file", accept: "image/*", capture: "environment", style: "display:none" });
    input.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const b64 = await resizeImage(file);
      item.foto = b64;
      saveVistoriaNow();
      renderPhotoArea(container, item);
    });
    btn.addEventListener("click", () => input.click());
    container.appendChild(btn);
    container.appendChild(input);
  }
}

/* ---------------- Histórico ---------------- */
function HistoryScreen() {
  const wrap = el("div", { class: "screen" });
  let query = "", filter = "todos";
  const searchWrap = el("div", { style: "position:relative;margin-bottom:10px" });
  searchWrap.appendChild(el("span", { html: svg("search", 16, "position:absolute;left:11px;top:11px;color:var(--ink-faint)") }));
  const searchInput = el("input", { class: "input", style: "padding-left:34px", placeholder: "Buscar por Loja/CD, local, inspetor..." });
  searchWrap.appendChild(searchInput);
  wrap.appendChild(searchWrap);

  const chipRow = el("div", { class: "chip-row" });
  const resultsBox = el("div", {});
  const filters = [["todos", "Todos"], ["ok", "Conforme"], ["pendente", "Pendente"], ["problema", "Com anomalia"]];
  function refresh() {
    chipRow.innerHTML = "";
    filters.forEach(([key, label]) => {
      const chip = el("button", { class: "chip" + (filter === key ? " active" : "") }, label);
      chip.addEventListener("click", () => { filter = key; refresh(); });
      chipRow.appendChild(chip);
    });
    const finalizadas = state.vistorias.filter((v) => v.finalizada);
    const filtered = finalizadas.filter((v) => {
      const st = vistoriaStatus(v);
      if (filter !== "todos" && st !== filter) return false;
      const q = query.toLowerCase();
      if (!q) return true;
      return (v.lojaCd || "").toLowerCase().includes(q) || (v.local || "").toLowerCase().includes(q) || (v.inspetor || "").toLowerCase().includes(q);
    });
    resultsBox.innerHTML = "";
    if (!filtered.length) { resultsBox.appendChild(el("div", { class: "card empty" }, "Nenhuma inspeção encontrada.")); return; }
    const list = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    filtered.forEach((v) => list.appendChild(VistoriaRow(v, false)));
    resultsBox.appendChild(list);
  }
  searchInput.addEventListener("input", (e) => { query = e.target.value; refresh(); });
  refresh();
  wrap.appendChild(chipRow);
  wrap.appendChild(resultsBox);
  return wrap;
}

/* ---------------- Relatório ---------------- */
/* ---------------- Geração de PDF sob demanda (para o envio por e-mail) ---------------- */
let jsPdfLoadPromise = null;
function loadJsPdf() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPdfLoadPromise) return jsPdfLoadPromise;
  jsPdfLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = () => reject(new Error("Não foi possível carregar o gerador de PDF (precisa de internet na primeira vez)."));
    document.head.appendChild(script);
  });
  return jsPdfLoadPromise;
}
function imageUrlToDataUrl(url) {
  return fetch(url).then((r) => r.blob()).then((blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  }));
}
async function buildInspectionPdf(v) {
  const jsPDF = await loadJsPdf();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 40;
  let y = 40;

  function ensureSpace(h) {
    if (y + h > pageH - 40) { doc.addPage(); y = 40; }
  }
  function text(str, size, opts) {
    opts = opts || {};
    doc.setFontSize(size);
    doc.setFont(undefined, opts.bold ? "bold" : "normal");
    doc.setTextColor(opts.color || "#1C2128");
    const maxWidth = pageW - marginX * 2;
    const lines = doc.splitTextToSize(String(str), maxWidth);
    ensureSpace(lines.length * (size * 1.3));
    doc.text(lines, marginX, y);
    y += lines.length * (size * 1.3) + (opts.gap || 4);
  }

  try {
    const logoData = await imageUrlToDataUrl("logo-full.png");
    doc.addImage(logoData, "PNG", marginX, y, 110, 110 * (192 / 545));
    y += 110 * (192 / 545) + 14;
  } catch (e) { /* segue sem logo se não conseguir carregar */ }

  text(v.lojaCd || "Inspeção", 18, { bold: true, gap: 2 });
  text([v.local, (v.estruturas || []).length + " estrutura(s)", "Inspetor(es): " + (v.inspetor || "—"), fmtDateOnly(v.data)].filter(Boolean).join("  ·  "), 10, { color: "#5B6470", gap: 16 });

  (v.estruturas || []).forEach((e) => {
    ensureSpace(30);
    text(`Estrutura ${e.codigo || "—"}`, 13, { bold: true, gap: 2 });
    const sub = [e.setor, e.tipoEstrutura, e.rua && "Rua " + e.rua, e.lado && "Lado " + e.lado, e.fabricante].filter(Boolean).join("  ·  ");
    if (sub) text(sub, 9, { color: "#9AA2AC", gap: 8 });

    const problemEntries = (e.montantes || []).flatMap((m) => m.itens.filter((it) => itemAplicavel(it, e) && isProblem(it.status)).map((i) => ({ m, i })));
    const estOcorrencias = (e.itensEstrutura || []).flatMap((it) => (it.ocorrencias || []).map((oc) => ({ it, oc })));

    if (!problemEntries.length && !estOcorrencias.length) {
      text("Nenhum apontamento — todos os montantes conformes.", 10, { color: "#5B6470", gap: 12 });
      return;
    }

    for (const { it, oc } of estOcorrencias) {
      ensureSpace(50);
      text(`${it.codigo ? "[" + it.codigo + "] " : ""}${it.nome}  —  ${oc.montanteRef || "Estrutura (geral)"}`, 10.5, { bold: true, gap: 2 });
      const detailsEst = [oc.descTxt && "Descrição: " + oc.descTxt, oc.tipoTxt && "Tipo: " + oc.tipoTxt, oc.localTxt && "Localização: " + oc.localTxt, oc.grauTxt && "Grau: " + oc.grauTxt, it.tipo === "medicao" && oc.valor && "Medição: " + oc.valor + " " + it.unidade, oc.qtd && "Qtd: " + oc.qtd].filter(Boolean).join("  ·  ");
      if (detailsEst) text(detailsEst, 9, { color: "#5B6470", gap: 2 });
      if (oc.obs) text("Obs: " + oc.obs, 9, { color: "#5B6470", gap: 4 });
      if (oc.foto) {
        try { ensureSpace(110); doc.addImage(oc.foto, "JPEG", marginX, y, 100, 100); y += 108; } catch (err) { /* ignora foto que falhar */ }
      }
      y += 6;
    }

    for (const { m, i } of problemEntries) {
      ensureSpace(50);
      text(`${i.codigo ? "[" + i.codigo + "] " : ""}${i.nome}  —  Montante Nº ${m.numero}`, 10.5, { bold: true, gap: 2 });
      const details = [i.descTxt && "Descrição: " + i.descTxt, i.tipoTxt && "Tipo: " + i.tipoTxt, i.localTxt && "Localização: " + i.localTxt, i.grauTxt && "Grau: " + i.grauTxt, i.corte && "Nível: " + i.corte, i.qtd && "Qtd: " + i.qtd].filter(Boolean).join("  ·  ");
      if (details) text(details, 9, { color: "#5B6470", gap: 2 });
      if (i.obs) text("Obs: " + i.obs, 9, { color: "#5B6470", gap: 4 });
      if (i.foto) {
        try {
          ensureSpace(110);
          doc.addImage(i.foto, "JPEG", marginX, y, 100, 100);
          y += 108;
        } catch (e) { /* ignora foto que falhar */ }
      }
      y += 6;
    }
  });

  const partsRows = buildPartsForVistoria(v);
  if (partsRows.length) {
    ensureSpace(30);
    text("Lista de peças", 13, { bold: true, gap: 6 });
    partsRows.forEach((r) => {
      ensureSpace(16);
      text(`${r.peca}  —  x${r.qtd}${r.graus.size ? "  (" + [...r.graus].join(", ") + ")" : ""}`, 10, { gap: 2 });
    });
  }

  return doc.output("blob");
}


function InspectionHubScreen() {
  const wrap = el("div", { class: "screen" });
  const v = state.vistorias.find((x) => x.id === state.activeVistoriaId);
  if (!v) { wrap.appendChild(el("div", { class: "empty" }, "Inspeção não encontrada.")); return wrap; }
  const st = vistoriaStatus(v);

  wrap.appendChild(el("div", { style: "margin-bottom:16px" },
    el("div", { style: "font-family:'Oswald',sans-serif;font-size:22px;font-weight:700" }, v.lojaCd),
    el("div", { style: "font-size:13px;color:var(--ink-soft);margin-top:2px" }, [v.local, (v.estruturas || []).length + " estrutura(s)", fmtDateOnly(v.data)].filter(Boolean).join(" · ")),
    el("div", { style: "margin-top:8px" }, Tag(st))));

  function hubCard(icon, title, subtitle, onClick) {
    const card = Card({ style: "padding:16px;cursor:pointer;margin-bottom:10px", class: "" });
    card.addEventListener("click", onClick);
    card.appendChild(el("div", { style: "display:flex;align-items:center;gap:12px" },
      el("div", { style: "background:var(--bg);border-radius:10px;padding:10px;display:flex", html: svg(icon, 22) }),
      el("div", { style: "flex:1" },
        el("div", { style: "font-weight:700;font-size:15px" }, title),
        el("div", { style: "font-size:12px;color:var(--ink-faint);margin-top:2px" }, subtitle)),
      el("span", { html: svg("chevronRight", 18), style: "color:var(--ink-faint)" })));
    return card;
  }

  wrap.appendChild(hubCard("download", "Relatório da inspeção", "Detalhado, com fotos — baixar em PDF", () => go("report", v.id)));
  wrap.appendChild(hubCard("package", "Lista de peças", "Peças necessárias desta inspeção, por local", () => go("partsInspection", v.id)));
  wrap.appendChild(hubCard("wrench", "Painel de indicadores", "Números, anomalias e peças mais frequentes", () => go("painel", v.id)));
  wrap.appendChild(hubCard("share", "Enviar por e-mail", "Monta os arquivos e abre o compartilhar do celular", () => sendInspectionByEmail(v)));

  return wrap;
}
async function sendInspectionByEmail(v) {
  try {
    const files = [];
    const anomaliaRows = buildAnomaliaRows(v);
    if (anomaliaRows.length) {
      const csvAnom = buildAnomaliasCsvContent(v, anomaliaRows);
      files.push(new File([csvAnom], `relatorio-anomalias-${slug(v.lojaCd)}.csv`, { type: "text/csv" }));
    }
    const partsRows = buildPartsForVistoria(v);
    if (partsRows.length) {
      const csvParts = buildPartsCsvContent(v, partsRows);
      files.push(new File([csvParts], `lista-pecas-${slug(v.lojaCd)}.csv`, { type: "text/csv" }));
    }
    let pdfOk = false;
    try {
      const pdfBlob = await buildInspectionPdf(v);
      files.push(new File([pdfBlob], `relatorio-${slug(v.lojaCd)}.pdf`, { type: "application/pdf" }));
      pdfOk = true;
    } catch (e) { console.error("Falha ao gerar PDF", e); }

    const shareData = { title: `Relatório — ${v.lojaCd}`, text: `Relatório de inspeção — ${v.lojaCd}${v.local ? ", " + v.local : ""} — ${fmtDateOnly(v.data)}`, files };
    if (navigator.canShare && navigator.canShare({ files }) ) {
      await navigator.share(shareData);
    } else if (navigator.share) {
      // sem suporte a arquivos: baixa tudo e compartilha só o texto
      files.forEach((f) => download(f.name, f, f.type));
      await navigator.share({ title: shareData.title, text: shareData.text + "\n\n(Os arquivos foram baixados no aparelho — anexe manualmente ao e-mail.)" });
    } else {
      files.forEach((f) => download(f.name, f, f.type));
      alert("Os arquivos foram baixados no aparelho. Anexe-os manualmente no seu app de e-mail.");
    }
    if (!pdfOk) alert("O PDF não pôde ser gerado agora (precisa de internet na primeira vez, para carregar o gerador). Os CSVs foram incluídos normalmente.");
  } catch (e) {
    if (e && e.name === "AbortError") return; // usuário cancelou o compartilhamento
    console.error(e);
    alert("Não foi possível preparar os arquivos para envio.");
  }
}
function slug(s) { return String(s || "inspecao").toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

function ReportScreen() {
  const wrap = el("div", {});
  const v = state.vistorias.find((x) => x.id === state.activeVistoriaId);
  if (!v) { wrap.appendChild(el("div", { class: "screen empty" }, "Inspeção não encontrada.")); return wrap; }
  const st = vistoriaStatus(v);

  const printable = el("div", { class: "screen printable" });
  const bannerColor = { ok: "green", pendente: "gray", problema: "amber" }[st];
  const banner = el("div", { class: "card", style: `border:2px solid var(--${bannerColor});background:var(--${bannerColor}-bg);margin-bottom:16px` });
  banner.appendChild(el("img", { src: "logo-full.png", alt: state.config.empresa, style: "height:22px;display:block;margin-bottom:4px" }));
  banner.appendChild(el("div", { style: "font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;margin-top:2px" }, v.lojaCd));
  banner.appendChild(el("div", { style: "font-size:13px;color:var(--ink-soft);margin-top:2px" }, [v.local, (v.estruturas || []).length + " estrutura(s)"].filter(Boolean).join(" · ")));
  const infoRow = el("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-top:12px" },
    el("div", { style: "font-size:12.5px;color:var(--ink-soft)" }, el("div", {}, "Inspetor(es): ", el("b", {}, v.inspetor)), el("div", {}, fmtDateOnly(v.data))),
    Tag(st));
  banner.appendChild(infoRow);
  printable.appendChild(banner);

  const topActions = el("div", { class: "no-print", style: "display:flex;flex-direction:column;gap:8px;margin-bottom:18px" });
  const btnAnomalias = el("button", { class: "action-btn", style: "background:var(--amber-bg);color:var(--amber-dark);border:1px solid var(--line)" }, el("span", { html: svg("wrench", 15) }), " Relatório de Anomalias (tabela / CSV)");
  btnAnomalias.addEventListener("click", () => go("anomalias", v.id));
  topActions.appendChild(btnAnomalias);
  const row1 = el("div", { class: "row" });
  const btnPdf = el("button", { class: "action-btn", style: "background:var(--ink);color:#fff" }, el("span", { html: svg("download", 16) }), " Baixar / PDF");
  btnPdf.addEventListener("click", () => window.print());
  const btnShare = el("button", { class: "action-btn", style: "background:#fff;color:var(--ink);border:1px solid var(--line)" }, el("span", { html: svg("share", 16) }), " Compartilhar");
  btnShare.addEventListener("click", () => shareReport(v, st));
  row1.appendChild(btnPdf); row1.appendChild(btnShare);
  topActions.appendChild(row1);
  printable.appendChild(topActions);

  (v.estruturas || []).forEach((e) => {
    const est = estruturaStatus(e);
    const problemEntries = (e.montantes || []).flatMap((m) => m.itens.filter((it) => itemAplicavel(it, e) && isProblem(it.status)).map((i) => ({ m, i })));
    const estOcorrencias = (e.itensEstrutura || []).flatMap((it) => (it.ocorrencias || []).map((oc) => ({ it, oc })));
    printable.appendChild(el("h3", { class: "section-title", style: "display:flex;align-items:center;justify-content:space-between" },
      el("span", {}, "Estrutura ", e.codigo || "—"), Tag(est, "sm")));
    const sub = [e.rua && "Rua " + e.rua, e.lado && "Lado " + e.lado, (e.montantes || []).length + " montante(s)", e.fabricante].filter(Boolean).join(" · ");
    if (sub) printable.appendChild(el("div", { style: "font-size:12px;color:var(--ink-faint);margin:-4px 0 8px" }, sub));

    if (!problemEntries.length && !estOcorrencias.length) {
      printable.appendChild(el("div", { class: "card", style: "padding:10px 12px;margin-bottom:10px;color:var(--ink-soft);font-size:13px" }, "Nenhum apontamento — todos os montantes conformes."));
    } else {
      const itemsList = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:10px" });
      estOcorrencias.forEach(({ it, oc }) => {
        const c = Card({ style: "padding:10px 12px" });
        c.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
          el("div", { style: "font-weight:600;font-size:13.5px" }, CodeBadge(it.codigo), it.nome),
          Tag("problema", "sm")));
        c.appendChild(el("div", { class: "mono", style: "font-size:11px;color:var(--ink-faint);margin-top:3px" }, oc.montanteRef || "Estrutura (geral)"));
        const detalhes = [oc.descTxt, oc.tipoTxt, oc.localTxt, oc.grauTxt].filter(Boolean).join(" · ");
        if (detalhes) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, detalhes));
        if (it.tipo === "medicao" && oc.valor) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, `Medição: ${oc.valor} ${it.unidade}`));
        if (oc.obs) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, oc.obs));
        if (oc.foto) c.appendChild(el("img", { src: oc.foto, style: "margin-top:8px;width:110px;height:110px;object-fit:cover;border-radius:6px" }));
        itemsList.appendChild(c);
      });
      problemEntries.forEach(({ m, i }) => {
        const c = Card({ style: "padding:10px 12px" });
        c.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
          el("div", { style: "font-weight:600;font-size:13.5px" }, CodeBadge(i.codigo), i.nome),
          Tag(i.status, "sm")));
        c.appendChild(el("div", { class: "mono", style: "font-size:11px;color:var(--ink-faint);margin-top:3px" }, "Montante Nº " + m.numero));
        if (i.valor) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, `Medição: ${i.valor} ${i.unidade}`));
        if (i.obs) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, i.obs));
        if (i.foto) c.appendChild(el("img", { src: i.foto, style: "margin-top:8px;width:110px;height:110px;object-fit:cover;border-radius:6px" }));
        itemsList.appendChild(c);
      });
      printable.appendChild(itemsList);
    }

    const agg = {};
    problemEntries.forEach(({ i }) => { const q = Number(i.qtd) > 0 ? Number(i.qtd) : 1; const p = pecaDoItem(i); agg[p] = (agg[p] || 0) + q; });
    estOcorrencias.forEach(({ it, oc }) => { const q = Number(oc.qtd) > 0 ? Number(oc.qtd) : 1; const p = oc.tipoTxt || it.peca; agg[p] = (agg[p] || 0) + q; });
    if (Object.keys(agg).length) {
      const partsCard = Card({ style: "padding:4px;margin-bottom:8px" });
      Object.entries(agg).forEach(([peca, qtd], idx, arr) => {
        partsCard.appendChild(el("div", { style: "display:flex;justify-content:space-between;padding:8px 10px" + (idx < arr.length - 1 ? ";border-bottom:1px solid var(--line)" : "") },
          el("span", { style: "font-size:13px" }, peca), el("span", { class: "mono", style: "font-size:12.5px;color:var(--ink-soft)" }, "x" + qtd)));
      });
      printable.appendChild(partsCard);
    }

    const resolveBtn = el("button", { class: "action-btn no-print", style: (e.resolvido ? "background:#fff;color:var(--ink-soft);border:1px solid var(--line)" : "background:var(--green-bg);color:var(--green-dark);border:1px solid var(--line)") + ";margin-bottom:18px" },
      el("span", { html: svg("check", 14) }), " " + (e.resolvido ? "Reabrir pendência desta estrutura" : "Marcar peças desta estrutura como resolvidas"));
    resolveBtn.addEventListener("click", async () => { e.resolvido = !e.resolvido; await idbSet("vistorias", undefined, v); await persistVistoriaList(); render(); });
    printable.appendChild(resolveBtn);
  });
  wrap.appendChild(printable);

  const actions = el("div", { class: "no-print", style: "padding:0 16px 20px;display:flex;flex-direction:column;gap:8px" });
  const btnDelete = el("button", { class: "action-btn", style: "background:#fff;color:var(--red-dark);border:1px solid var(--red-bg)" }, el("span", { html: svg("trash", 15) }), " Excluir inspeção inteira");
  btnDelete.addEventListener("click", async () => { if (confirm("Excluir esta inspeção e todas as estruturas dela?")) { await idbDelete("vistorias", v.id); await persistVistoriaList(); go("history"); } });
  actions.appendChild(btnDelete);

  wrap.appendChild(actions);
  return wrap;
}
async function shareReport(v, st) {
  let text = `Relatório de Inspeção — ${state.config.empresa}\nLoja/CD: ${v.lojaCd}${v.local ? " · " + v.local : ""}\nInspetor(es): ${v.inspetor}\nData: ${fmtDateOnly(v.data)}\nResultado geral: ${STATUS[st].label}\n`;
  (v.estruturas || []).forEach((e) => {
    const problemEntries = (e.montantes || []).flatMap((m) => m.itens.filter((it) => itemAplicavel(it, e) && isProblem(it.status)).map((i) => ({ m, i })));
    const estOcorrencias = (e.itensEstrutura || []).flatMap((it) => (it.ocorrencias || []).map((oc) => ({ it, oc })));
    text += `\n— Estrutura ${e.codigo} [${STATUS[estruturaStatus(e)].label}] —\n`;
    const linhas = [];
    problemEntries.forEach(({ m, i }) => linhas.push(`  - Montante ${m.numero}: ${i.codigo ? "[" + i.codigo + "] " : ""}${i.nome} [${STATUS[i.status].label}]${i.obs ? ": " + i.obs : ""}`));
    estOcorrencias.forEach(({ it, oc }) => linhas.push(`  - ${oc.montanteRef || "Estrutura"}: ${it.codigo ? "[" + it.codigo + "] " : ""}${it.nome}${oc.grauTxt ? " [" + oc.grauTxt + "]" : ""}${oc.obs ? ": " + oc.obs : ""}`));
    text += linhas.length ? linhas.join("\n") : "  Nenhum apontamento — conforme.";
    text += "\n";
  });
  if (navigator.share) {
    try { await navigator.share({ title: `Inspeção ${v.lojaCd}`, text }); } catch (e) { /* cancelado */ }
  } else {
    await navigator.clipboard.writeText(text);
    alert("Resumo copiado para a área de transferência.");
  }
}

/* ---------------- Relatório de Anomalias (tabela / CSV) ---------------- */
function buildAnomaliaRows(v) {
  const rows = [];
  (v.estruturas || []).forEach((e) => {
    (e.montantes || []).forEach((m) => {
      m.itens.filter((it) => itemAplicavel(it, e) && isProblem(it.status)).forEach((i) => {
        rows.push({
          estruturaId: e.id, montanteId: m.id, itemId: i.id,
          setor: e.setor || "", tipoEstrutura: e.tipoEstrutura || "", numeroEstrutura: e.codigo || "",
          lado: e.lado || "", montante: m.numero, corte: i.corte || "",
          codigoAnomalia: i.codigo || "", nomeAnomalia: i.nome || "",
          descricao: i.descTxt || "", tipo: i.tipoTxt || "", localizacao: i.localTxt || "",
          grau: i.grauTxt || "",
          categoria: i.categoria || "", correcao: i.correcao || "", qtd: i.qtd == null ? 1 : i.qtd,
          fabricante: e.fabricante || "",
        });
      });
    });
    (e.itensEstrutura || []).forEach((it) => {
      (it.ocorrencias || []).forEach((oc) => {
        rows.push({
          estruturaId: e.id, estItemId: it.id, ocorrenciaId: oc.id,
          setor: e.setor || "", tipoEstrutura: e.tipoEstrutura || "", numeroEstrutura: e.codigo || "",
          lado: e.lado || "", montante: oc.montanteRef || "(estrutura)", corte: "",
          codigoAnomalia: it.codigo || "", nomeAnomalia: it.nome || "",
          descricao: oc.descTxt || "", tipo: oc.tipoTxt || "", localizacao: oc.localTxt || "",
          grau: oc.grauTxt || (it.tipo === "medicao" && oc.valor ? `Medição: ${oc.valor} ${it.unidade}` : ""),
          categoria: it.categoria || "", correcao: oc.correcao || "", qtd: oc.qtd == null ? 1 : oc.qtd,
          fabricante: e.fabricante || "",
        });
      });
    });
  });
  return rows;
}
function pecaDoItem(i) {
  if (i.tipoTxt) return i.tipoTxt;
  return i.peca;
}
function csvEscape(val) {
  const s = String(val === null || val === undefined ? "" : val);
  return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function buildAnomaliasCsvContent(v, rows) {
  const header = ["SETOR", "TIPO ESTRUTURA", "Nº ESTRUTURA", "LADO/POSIÇÃO", "MONTANTE", "NÍVEL", "ANOMALIA (CÓD.)", "ANOMALIA (DESCRIÇÃO)", "DESCRIÇÃO", "TIPO", "LOCALIZAÇÃO", "GRAU", "CATEGORIA", "CORREÇÃO", "QTD.", "FABRICANTE"];
  const lines = [
    "RELATÓRIO DE ANOMALIAS",
    `${v.lojaCd}${v.local ? ", " + v.local : ""}`,
    `${fmtDateShort(v.data)}`,
    "",
    header.join(";"),
    ...rows.map((r) => [r.setor, r.tipoEstrutura, r.numeroEstrutura, r.lado, r.montante, r.corte, r.codigoAnomalia, r.nomeAnomalia, r.descricao, r.tipo, r.localizacao, r.grau, r.categoria, r.correcao, r.qtd, r.fabricante].map(csvEscape).join(";")),
  ];
  return "\uFEFF" + lines.join("\n");
}
function exportAnomaliasCsv(v) {
  const rows = buildAnomaliaRows(v);
  const content = buildAnomaliasCsvContent(v, rows);
  download(`relatorio-anomalias-${slug(v.lojaCd)}-${todayStr()}.csv`, content, "text/csv;charset=utf-8");
}
function AnomaliasScreen() {
  const wrap = el("div", { class: "screen" });
  const v = state.vistorias.find((x) => x.id === state.activeVistoriaId);
  if (!v) { wrap.appendChild(el("div", { class: "empty" }, "Inspeção não encontrada.")); return wrap; }

  const headerCard = Card({ style: "margin-bottom:14px" });
  headerCard.appendChild(el("img", { src: "logo-full.png", alt: state.config.empresa, style: "height:22px;display:block;margin-bottom:4px" }));
  headerCard.appendChild(el("div", { style: "font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;margin-top:2px" }, "RELATÓRIO DE ANOMALIAS"));
  headerCard.appendChild(el("div", { style: "font-size:13px;color:var(--ink-soft);margin-top:2px" }, v.lojaCd + (v.local ? ", " + v.local : "")));
  headerCard.appendChild(el("div", { class: "mono", style: "font-size:11.5px;color:var(--ink-faint);margin-top:2px" }, fmtDateShort(v.data)));
  wrap.appendChild(headerCard);

  const exportBtn = el("button", { class: "ghost-btn no-print", style: "width:100%;padding:12px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:6px" },
    el("span", { html: svg("download", 16) }), "Exportar CSV (abre no Excel)");
  exportBtn.addEventListener("click", () => exportAnomaliasCsv(v));
  wrap.appendChild(exportBtn);

  const rows = buildAnomaliaRows(v);
  if (!rows.length) {
    wrap.appendChild(el("div", { class: "card empty" }, "Nenhuma anomalia registrada nesta inspeção."));
    return wrap;
  }

  const cols = [
    ["Setor", "setor"], ["Tipo estrutura", "tipoEstrutura"], ["Nº estrutura", "numeroEstrutura"], ["Lado", "lado"],
    ["Montante", "montante"], ["Nível", "corte"], ["Cód.", "codigoAnomalia"], ["Anomalia", "nomeAnomalia"],
    ["Descrição", "descricao"], ["Tipo", "tipo"], ["Localização", "localizacao"],
    ["Grau", "grau"], ["Categoria", "categoria"], ["Correção", "correcao"], ["Qtd.", "qtd"], ["Fabricante", "fabricante"],
  ];
  const scrollWrap = el("div", { style: "overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);border-radius:10px;background:#fff" });
  const table = el("table", { style: "border-collapse:collapse;font-size:12.5px;white-space:nowrap" });
  const thead = el("thead", {}, el("tr", {}, ...cols.map(([label]) => el("th", { style: "text-align:left;padding:8px 10px;background:var(--steel);color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.3px;position:sticky;top:0" }, label))));
  table.appendChild(thead);
  const tbody = el("tbody", {});
  rows.forEach((r, idx) => {
    const tr = el("tr", { style: idx % 2 ? "background:var(--bg)" : "" });
    cols.forEach(([label, key]) => {
      if (key === "correcao") {
        const td = el("td", { style: "padding:4px 6px" });
        const input = el("input", { class: "input", style: "min-width:160px;padding:6px 8px;font-size:12.5px", value: r.correcao, placeholder: "Ex: Elaborar, Substituir..." });
        input.addEventListener("input", (e) => {
          r.correcao = e.target.value;
          const est = v.estruturas.find((x) => x.id === r.estruturaId);
          if (r.ocorrenciaId) {
            const estItem = est && (est.itensEstrutura || []).find((x) => x.id === r.estItemId);
            const oc = estItem && estItem.ocorrencias.find((x) => x.id === r.ocorrenciaId);
            if (oc) { oc.correcao = e.target.value; clearTimeout(state.saveTimer); state.saveTimer = setTimeout(() => idbSet("vistorias", undefined, v), 400); }
          } else {
            const mont = est && (est.montantes || []).find((x) => x.id === r.montanteId);
            const item = mont && mont.itens.find((x) => x.id === r.itemId);
            if (item) { item.correcao = e.target.value; clearTimeout(state.saveTimer); state.saveTimer = setTimeout(() => idbSet("vistorias", undefined, v), 400); }
          }
        });
        td.appendChild(input);
        tr.appendChild(td);
      } else {
        tr.appendChild(el("td", { style: "padding:8px 10px;color:var(--ink)" }, String(r[key] ?? "")));
      }
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scrollWrap.appendChild(table);
  wrap.appendChild(scrollWrap);
  wrap.appendChild(el("p", { style: "font-size:11.5px;color:var(--ink-faint);margin-top:10px" }, "Arraste a tabela para o lado para ver todas as colunas. A coluna Correção é editada aqui e salva automaticamente."));
  return wrap;
}

/* ---------------- Peças ---------------- */
function buildPartsForVistoria(v) {
  const bucket = {};
  (v.estruturas || []).filter((e) => !e.resolvido && isProblem(estruturaStatus(e))).forEach((e) => {
    (e.montantes || []).forEach((m) => {
      m.itens.filter((it) => itemAplicavel(it, e) && isProblem(it.status)).forEach((i) => {
        const q = Number(i.qtd) > 0 ? Number(i.qtd) : 1;
        const peca = pecaDoItem(i);
        if (!bucket[peca]) bucket[peca] = { peca, qtd: 0, graus: new Set(), refs: new Set() };
        bucket[peca].qtd += q;
        if (i.grauTxt) bucket[peca].graus.add(i.grauTxt);
        bucket[peca].refs.add(`${e.codigo} · Montante ${m.numero}`);
      });
    });
    (e.itensEstrutura || []).forEach((it) => {
      (it.ocorrencias || []).forEach((oc) => {
        const q = Number(oc.qtd) > 0 ? Number(oc.qtd) : 1;
        const peca = oc.tipoTxt || it.peca;
        if (!bucket[peca]) bucket[peca] = { peca, qtd: 0, graus: new Set(), refs: new Set() };
        bucket[peca].qtd += q;
        if (oc.grauTxt) bucket[peca].graus.add(oc.grauTxt);
        bucket[peca].refs.add(`${e.codigo} · ${oc.montanteRef || "estrutura"}`);
      });
    });
  });
  return Object.values(bucket);
}
function buildPartsCsvContent(v, rows) {
  const header = ["LOJA/CD", "LOCAL", "PEÇA", "QUANTIDADE", "GRAU", "ESTRUTURAS / MONTANTES"];
  const lines = ["LISTA DE PEÇAS", `${v.lojaCd}${v.local ? ", " + v.local : ""}`, "", header.join(";")];
  rows.forEach((r) => {
    lines.push([v.lojaCd, v.local || "", r.peca, r.qtd, [...r.graus].join(" · "), [...r.refs].join(" · ")].map(csvEscape).join(";"));
  });
  return "\uFEFF" + lines.join("\n");
}
/* ---------------- Painel de Indicadores ---------------- */
function buildIndicadores(v) {
  const estruturas = v.estruturas || [];
  const totalEstruturas = estruturas.length;
  const totalMontantes = estruturas.reduce((s, e) => s + (e.montantes || []).length, 0);

  const anomaliaCount = {};
  const grauCount = {};
  let totalApontamentos = 0;
  let totalFotos = 0;
  let totalItensAplicaveis = 0;
  let totalItensConformes = 0;

  estruturas.forEach((e) => {
    (e.montantes || []).forEach((m) => {
      m.itens.filter((it) => itemAplicavel(it, e)).forEach((it) => {
        totalItensAplicaveis++;
        if (it.status === "ok" || it.status === "naoaplica") totalItensConformes++;
        if (isProblem(it.status)) {
          totalApontamentos++;
          const key = (it.codigo ? it.codigo + " — " : "") + it.nome;
          anomaliaCount[key] = (anomaliaCount[key] || 0) + 1;
          if (it.grauTxt) { const g = it.grauTxt.trim().toUpperCase(); grauCount[g] = (grauCount[g] || 0) + 1; }
          if (it.foto) totalFotos++;
        }
      });
    });
    (e.itensEstrutura || []).forEach((it) => {
      (it.ocorrencias || []).forEach((oc) => {
        totalApontamentos++;
        const key = (it.codigo ? it.codigo + " — " : "") + it.nome;
        anomaliaCount[key] = (anomaliaCount[key] || 0) + 1;
        if (oc.grauTxt) { const g = oc.grauTxt.trim().toUpperCase(); grauCount[g] = (grauCount[g] || 0) + 1; }
        if (oc.foto) totalFotos++;
      });
    });
  });

  const topAnomalias = Object.entries(anomaliaCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const distribGrau = Object.entries(grauCount).sort((a, b) => b[1] - a[1]);
  const pecas = buildPartsForVistoria(v).slice().sort((a, b) => b.qtd - a.qtd).slice(0, 10);
  const pctConforme = totalItensAplicaveis ? Math.round((totalItensConformes / totalItensAplicaveis) * 100) : 0;

  let duracao = null;
  if (v.createdAt && v.finalizadaAt) {
    const ms = new Date(v.finalizadaAt) - new Date(v.createdAt);
    const horas = ms / 1000 / 60 / 60;
    duracao = horas < 24 ? horas.toFixed(1) + " hora(s)" : (horas / 24).toFixed(1) + " dia(s)";
  }

  return { totalEstruturas, totalMontantes, totalApontamentos, totalFotos, pctConforme, topAnomalias, distribGrau, pecas, duracao };
}
function statBox(num, label) {
  return el("div", { class: "card stat-card" }, el("div", { class: "stat-num" }, String(num)), el("div", { class: "stat-label" }, label));
}
function PainelScreen() {
  const wrap = el("div", { class: "screen" });
  try {
  const v = state.vistorias.find((x) => x.id === state.activeVistoriaId);
  if (!v) { wrap.appendChild(el("div", { class: "empty" }, "Inspeção não encontrada.")); return wrap; }
  const ind = buildIndicadores(v);

  wrap.appendChild(el("div", { style: "margin-bottom:16px" },
    el("div", { style: "font-family:'Oswald',sans-serif;font-size:18px;font-weight:700" }, v.lojaCd),
    el("div", { style: "font-size:13px;color:var(--ink-soft);margin-top:2px" }, [v.local, fmtDateOnly(v.data)].filter(Boolean).join(" · "))));

  const datasCard = Card({ style: "padding:14px;margin-bottom:14px" });
  datasCard.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
    el("div", {}, el("div", { style: "color:var(--ink-faint);font-size:11px;text-transform:uppercase" }, "Início"), el("div", { style: "font-weight:600;margin-top:2px;font-size:12.5px" }, fmtDate(v.createdAt))),
    el("div", { style: "text-align:right" }, el("div", { style: "color:var(--ink-faint);font-size:11px;text-transform:uppercase" }, "Finalização"), el("div", { style: "font-weight:600;margin-top:2px;font-size:12.5px" }, v.finalizadaAt ? fmtDate(v.finalizadaAt) : "—"))));
  if (ind.duracao) datasCard.appendChild(el("div", { style: "margin-top:8px;font-size:12px;color:var(--ink-faint)" }, "Duração da inspeção: " + ind.duracao));
  wrap.appendChild(datasCard);

  wrap.appendChild(el("div", { class: "stat-grid" },
    statBox(ind.totalEstruturas, "Estruturas"),
    statBox(ind.totalMontantes, "Montantes"),
    statBox(ind.totalApontamentos, "Apontamentos")));

  wrap.appendChild(el("h3", { class: "section-title" }, "Índice de conformidade"));
  const pctCard = Card({ style: "padding:14px;margin-bottom:18px" });
  pctCard.appendChild(el("div", { style: "display:flex;justify-content:space-between;margin-bottom:6px" },
    el("span", { style: "font-size:13px;font-weight:700" }, ind.pctConforme + "% conforme"),
    el("span", { style: "font-size:11px;color:var(--ink-faint)" }, ind.totalFotos + " foto(s) anexada(s)")));
  pctCard.appendChild(el("div", { style: "background:var(--bg);border-radius:6px;height:10px;overflow:hidden" },
    el("div", { style: `background:var(--green);height:100%;width:${ind.pctConforme}%` })));
  wrap.appendChild(pctCard);

  if (ind.topAnomalias.length) {
    wrap.appendChild(el("h3", { class: "section-title" }, "Anomalias mais frequentes"));
    const list = el("div", { style: "display:flex;flex-direction:column;gap:6px;margin-bottom:18px" });
    const max = ind.topAnomalias[0][1];
    ind.topAnomalias.forEach(([nome, qtd]) => {
      const card = Card({ style: "padding:10px 12px" });
      card.appendChild(el("div", { style: "display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px;gap:8px" }, el("span", {}, nome), el("span", { class: "mono", style: "font-weight:700" }, String(qtd))));
      card.appendChild(el("div", { style: "background:var(--bg);border-radius:5px;height:6px;overflow:hidden" }, el("div", { style: `background:var(--amber);height:100%;width:${Math.max(6, (qtd / max) * 100)}%` })));
      list.appendChild(card);
    });
    wrap.appendChild(list);
  }

  if (ind.distribGrau.length) {
    wrap.appendChild(el("h3", { class: "section-title" }, "Distribuição por grau"));
    const row = el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px" });
    ind.distribGrau.forEach(([grau, qtd]) => {
      row.appendChild(Card({ style: "padding:10px 14px;flex:1;min-width:90px;text-align:center" },
        el("div", { style: "font-size:18px;font-weight:700" }, String(qtd)),
        el("div", { style: "font-size:10.5px;color:var(--ink-faint);text-transform:uppercase" }, grau)));
    });
    wrap.appendChild(row);
  }

  if (ind.pecas.length) {
    wrap.appendChild(el("h3", { class: "section-title" }, "Peças mais recorrentes"));
    const list = el("div", { style: "display:flex;flex-direction:column;gap:6px" });
    ind.pecas.forEach((p) => {
      const card = Card({ style: "padding:10px 12px;display:flex;justify-content:space-between;gap:8px" });
      card.appendChild(el("span", { style: "font-size:13px" }, p.peca));
      card.appendChild(el("span", { class: "mono", style: "font-weight:700;font-size:13px" }, "x" + p.qtd));
      list.appendChild(card);
    });
    wrap.appendChild(list);
  }

  if (!ind.totalApontamentos) {
    wrap.appendChild(el("div", { class: "card empty" }, "Nenhum apontamento registrado nesta inspeção."));
  }
  } catch (err) {
    console.error("Erro no Painel de Indicadores:", err);
    wrap.innerHTML = "";
    wrap.appendChild(el("div", { class: "card empty" }, "Não foi possível carregar o painel desta inspeção. Um erro técnico foi registrado no console do navegador — se puder, me mande um print disso (F12 → Console)."));
  }
  return wrap;
}

function PartsInspectionScreen() {
  const wrap = el("div", { class: "screen" });
  const v = state.vistorias.find((x) => x.id === state.activeVistoriaId);
  if (!v) { wrap.appendChild(el("div", { class: "empty" }, "Inspeção não encontrada.")); return wrap; }

  wrap.appendChild(el("div", { style: "margin-bottom:14px" },
    el("div", { style: "font-family:'Oswald',sans-serif;font-size:18px;font-weight:700" }, v.lojaCd),
    el("div", { style: "font-size:13px;color:var(--ink-soft);margin-top:2px" }, [v.local, fmtDateOnly(v.data)].filter(Boolean).join(" · "))));

  const rows = buildPartsForVistoria(v);
  if (!rows.length) {
    wrap.appendChild(el("div", { class: "card empty" }, el("div", { html: svg("package", 26, "margin:0 auto 8px;opacity:.5;display:block") }), "Nenhuma peça pendente nesta inspeção."));
    return wrap;
  }

  let view = "detalhado";
  const tabRow = el("div", { class: "chip-row" });
  const contentBox = el("div", {});
  const tabs = [["detalhado", "Detalhado"], ["resumo", "Resumo"]];

  function renderContent() {
    contentBox.innerHTML = "";

    const exportBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:12px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:6px" },
      el("span", { html: svg("download", 16) }), "Exportar CSV");
    contentBox.appendChild(exportBtn);

    const list = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    if (view === "detalhado") {
      exportBtn.addEventListener("click", () => download(`lista-pecas-${slug(v.lojaCd)}.csv`, buildPartsCsvContent(v, rows), "text/csv;charset=utf-8"));
      rows.forEach((r) => {
        const card = Card({ style: "padding:12px" });
        card.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
          el("div", {}, el("div", { style: "font-weight:700;font-size:14px" }, r.peca), el("div", { style: "font-size:11.5px;color:var(--ink-faint);margin-top:2px" }, [...r.refs].join(" · "))),
          el("div", { style: "display:flex;flex-direction:column;align-items:flex-end;gap:4px" },
            el("span", { class: "mono", style: "font-size:13px;font-weight:700" }, "x" + r.qtd),
            r.graus.size ? el("span", { style: "font-size:11px;color:var(--amber-dark);font-weight:600" }, [...r.graus].join(" · ")) : null)));
        list.appendChild(card);
      });
    } else {
      const resumoRows = rows.slice().sort((a, b) => b.qtd - a.qtd);
      exportBtn.addEventListener("click", () => {
        const lines = ["RESUMO DE PEÇAS", `${v.lojaCd}${v.local ? ", " + v.local : ""}`, "", ["PEÇA", "QUANTIDADE"].join(";"), ...resumoRows.map((r) => [r.peca, r.qtd].map(csvEscape).join(";"))];
        download(`resumo-pecas-${slug(v.lojaCd)}.csv`, "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
      });
      resumoRows.forEach((r) => {
        const card = Card({ style: "padding:12px" });
        card.appendChild(el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px" },
          el("div", { style: "font-weight:700;font-size:14px" }, r.peca),
          el("span", { class: "mono", style: "font-size:14px;font-weight:700" }, "x" + r.qtd)));
        list.appendChild(card);
      });
    }
    contentBox.appendChild(list);
  }

  function renderTabs() {
    tabRow.innerHTML = "";
    tabs.forEach(([key, label]) => {
      const chip = el("button", { class: "chip" + (view === key ? " active" : "") }, label);
      chip.addEventListener("click", () => { view = key; renderTabs(); renderContent(); });
      tabRow.appendChild(chip);
    });
  }
  renderTabs();
  renderContent();
  wrap.appendChild(tabRow);
  wrap.appendChild(contentBox);
  return wrap;
}

function buildPartsByLocation() {
  const locations = {};
  state.vistorias.filter((v) => v.finalizada).forEach((v) => {
    const key = v.lojaCd || "(sem Loja/CD)";
    (v.estruturas || []).filter((e) => !e.resolvido && isProblem(estruturaStatus(e))).forEach((e) => {
      (e.montantes || []).forEach((m) => {
        m.itens.filter((i) => isProblem(i.status)).forEach((i) => {
          const q = Number(i.qtd) > 0 ? Number(i.qtd) : 1;
          const peca = pecaDoItem(i);
          if (!locations[key]) locations[key] = { local: v.local, itens: {} };
          const bucket = locations[key].itens;
          if (!bucket[peca]) bucket[peca] = { qtd: 0, graus: new Set(), refs: new Set() };
          bucket[peca].qtd += q;
          if (i.grauTxt) bucket[peca].graus.add(i.grauTxt);
          bucket[peca].refs.add(`${e.codigo} · Montante ${m.numero}`);
        });
      });
    });
  });
  return locations;
}
function exportPartsCsv(locations) {
  const header = ["LOJA/CD", "LOCAL", "PEÇA", "QUANTIDADE", "GRAU", "ESTRUTURAS / MONTANTES"];
  const lines = ["LISTA GERAL DE PEÇAS", state.config.empresa, "", header.join(";")];
  Object.entries(locations).forEach(([lojaCd, data]) => {
    Object.entries(data.itens).forEach(([peca, info]) => {
      lines.push([lojaCd, data.local || "", peca, info.qtd, [...info.graus].join(" · "), [...info.refs].join(" · ")].map(csvEscape).join(";"));
    });
  });
  download(`lista-pecas-${todayStr()}.csv`, "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
}
function PartsScreen() {
  const wrap = el("div", { class: "screen" });
  wrap.appendChild(el("p", { style: "font-size:13px;color:var(--ink-soft);margin-bottom:14px;line-height:1.5" }, "Lista geral de peças, agrupada por local inspecionado — pronta para emitir ao cliente."));

  const locations = buildPartsByLocation();
  const locEntries = Object.entries(locations);
  if (!locEntries.length) {
    wrap.appendChild(el("div", { class: "card empty" }, el("div", { html: svg("package", 26, "margin:0 auto 8px;opacity:.5;display:block") }), "Nenhuma peça pendente. Tudo em dia."));
    return wrap;
  }

  const exportBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:12px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:6px" },
    el("span", { html: svg("download", 16) }), "Exportar CSV (para o cliente)");
  exportBtn.addEventListener("click", () => exportPartsCsv(locations));
  wrap.appendChild(exportBtn);

  locEntries.forEach(([lojaCd, data]) => {
    wrap.appendChild(el("h3", { class: "section-title" }, lojaCd + (data.local ? " · " + data.local : "")));
    const list = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:18px" });
    Object.entries(data.itens).forEach(([peca, info]) => {
      const card = Card({ style: "padding:12px" });
      card.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
        el("div", {}, el("div", { style: "font-weight:700;font-size:14px" }, peca), el("div", { style: "font-size:11.5px;color:var(--ink-faint);margin-top:2px" }, [...info.refs].join(" · "))),
        el("div", { style: "display:flex;flex-direction:column;align-items:flex-end;gap:4px" },
          el("span", { class: "mono", style: "font-size:13px;font-weight:700" }, "x" + info.qtd),
          info.graus.size ? el("span", { style: "font-size:11px;color:var(--amber-dark);font-weight:600" }, [...info.graus].join(" · ")) : null)));
      list.appendChild(card);
    });
    wrap.appendChild(list);
  });
  return wrap;
}

/* ---------------- Configurações ---------------- */
function ConfigScreen() {
  const wrap = el("div", { class: "screen", style: "padding-bottom:40px" });
  const local = JSON.parse(JSON.stringify(state.config));
  if (!local.locais) local.locais = [];
  if (!local.fabricantes) local.fabricantes = [];
  if (!local.setores) local.setores = [];
  if (!local.tiposEstrutura) local.tiposEstrutura = [];

  const empresaCard = Card({ style: "margin-bottom:14px" });
  empresaCard.appendChild(Field("Nome da empresa", inputEl(local.empresa, (v) => { local.empresa = v; })));
  wrap.appendChild(empresaCard);

  const locaisCard = Card({ style: "margin-bottom:14px" });
  locaisCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Lojas / CDs sugeridos"));
  const locaisList = el("div", {});
  function renderLocais() {
    locaisList.innerHTML = "";
    local.locais.forEach((s, idx) => {
      const row = el("div", { style: "display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)" },
        el("span", { style: "font-size:13.5px" }, s), el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("x", 15) }));
      row.lastChild.addEventListener("click", () => { local.locais.splice(idx, 1); renderLocais(); });
      locaisList.appendChild(row);
    });
  }
  renderLocais();
  locaisCard.appendChild(locaisList);
  const novoLocalRow = el("div", { class: "row", style: "margin-top:10px" });
  const novoLocalInput = el("input", { class: "input", placeholder: "Nova Loja / CD" });
  const novoLocalBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  novoLocalBtn.addEventListener("click", () => { if (novoLocalInput.value.trim()) { local.locais.push(novoLocalInput.value.trim()); novoLocalInput.value = ""; renderLocais(); } });
  novoLocalRow.appendChild(novoLocalInput); novoLocalRow.appendChild(novoLocalBtn);
  locaisCard.appendChild(novoLocalRow);
  wrap.appendChild(locaisCard);

  const fabCard = Card({ style: "margin-bottom:14px" });
  fabCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Fabricantes de porta-pallet"));
  const fabList = el("div", {});
  function renderFabs() {
    fabList.innerHTML = "";
    local.fabricantes.forEach((f, idx) => {
      const row = el("div", { style: "display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)" },
        el("span", { style: "font-size:13.5px" }, f), el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("x", 15) }));
      row.lastChild.addEventListener("click", () => { local.fabricantes.splice(idx, 1); renderFabs(); });
      fabList.appendChild(row);
    });
  }
  renderFabs();
  fabCard.appendChild(fabList);
  const novoFabRow = el("div", { class: "row", style: "margin-top:10px" });
  const novoFabInput = el("input", { class: "input", placeholder: "Novo fabricante / modelo" });
  const novoFabBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  novoFabBtn.addEventListener("click", () => { if (novoFabInput.value.trim()) { local.fabricantes.push(novoFabInput.value.trim()); novoFabInput.value = ""; renderFabs(); } });
  novoFabRow.appendChild(novoFabInput); novoFabRow.appendChild(novoFabBtn);
  fabCard.appendChild(novoFabRow);
  wrap.appendChild(fabCard);

  const setoresCard = Card({ style: "margin-bottom:14px" });
  setoresCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Setores da loja/CD"));
  const setoresList = el("div", {});
  function renderSetores() {
    setoresList.innerHTML = "";
    (local.setores || []).forEach((s, idx) => {
      const row = el("div", { style: "display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)" },
        el("span", { style: "font-size:13.5px" }, s), el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("x", 15) }));
      row.lastChild.addEventListener("click", () => { local.setores.splice(idx, 1); renderSetores(); });
      setoresList.appendChild(row);
    });
  }
  renderSetores();
  setoresCard.appendChild(setoresList);
  const novoSetorRow = el("div", { class: "row", style: "margin-top:10px" });
  const novoSetorInput = el("input", { class: "input", placeholder: "Ex: FARMÁCIA" });
  const novoSetorBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  novoSetorBtn.addEventListener("click", () => { if (novoSetorInput.value.trim()) { local.setores = local.setores || []; local.setores.push(novoSetorInput.value.trim().toUpperCase()); novoSetorInput.value = ""; renderSetores(); } });
  novoSetorRow.appendChild(novoSetorInput); novoSetorRow.appendChild(novoSetorBtn);
  setoresCard.appendChild(novoSetorRow);
  wrap.appendChild(setoresCard);

  const tiposCard = Card({ style: "margin-bottom:14px" });
  tiposCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Tipos de estrutura"));
  const tiposList = el("div", {});
  function renderTipos() {
    tiposList.innerHTML = "";
    (local.tiposEstrutura || []).forEach((s, idx) => {
      const row = el("div", { style: "display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)" },
        el("span", { style: "font-size:13.5px" }, s), el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("x", 15) }));
      row.lastChild.addEventListener("click", () => { local.tiposEstrutura.splice(idx, 1); renderTipos(); });
      tiposList.appendChild(row);
    });
  }
  renderTipos();
  tiposCard.appendChild(tiposList);
  const novoTipoRow = el("div", { class: "row", style: "margin-top:10px" });
  const novoTipoInput = el("input", { class: "input", placeholder: "Ex: TRIPLA ENTRADA" });
  const novoTipoBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  novoTipoBtn.addEventListener("click", () => { if (novoTipoInput.value.trim()) { local.tiposEstrutura = local.tiposEstrutura || []; local.tiposEstrutura.push(novoTipoInput.value.trim().toUpperCase()); novoTipoInput.value = ""; renderTipos(); } });
  novoTipoRow.appendChild(novoTipoInput); novoTipoRow.appendChild(novoTipoBtn);
  tiposCard.appendChild(novoTipoRow);
  wrap.appendChild(tiposCard);

  const itensCard = Card({ style: "margin-bottom:14px" });
  itensCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Itens do checklist"));
  const itensList = el("div", {});
  function renderItens() {
    itensList.innerHTML = "";
    local.itens.forEach((it, idx) => {
      const row = el("div", { style: "padding:8px 0;border-bottom:1px solid var(--line)" },
        el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
          el("div", {}, el("div", { style: "font-size:13.5px;font-weight:600" }, CodeBadge(it.codigo), it.nome), el("div", { style: "font-size:11.5px;color:var(--ink-faint)" }, "Peça: " + it.peca + (it.categoria ? " · Categoria: " + it.categoria : ""))),
          el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("trash", 15) })));
      row.querySelector("button").addEventListener("click", () => { local.itens.splice(idx, 1); renderItens(); });
      itensList.appendChild(row);
    });
  }
  renderItens();
  itensCard.appendChild(itensList);
  const codigoInput = el("input", { class: "input", placeholder: "Código interno (ex: 9.47) — opcional" });
  const nomeInput = el("input", { class: "input", placeholder: "Nome do item (ex: Guarda-corpo)" });
  const descInput = el("input", { class: "input", placeholder: "Descrição da anomalia (ex: Danificado, Faltante...)" });
  const categoriaInput = el("input", { class: "input", placeholder: "Categoria (ex: Estruturais, Segurança, Gerais, Iluminação)" });
  const pecaInput = el("input", { class: "input" });
  const addRow = el("div", { class: "row" });
  const addBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  addBtn.addEventListener("click", () => {
    if (nomeInput.value.trim() && pecaInput.value.trim()) {
      local.itens.push({ id: uid(), codigo: codigoInput.value.trim(), nome: nomeInput.value.trim(), descOpcoes: descInput.value.trim() ? [descInput.value.trim()] : undefined, categoria: categoriaInput.value.trim(), peca: pecaInput.value.trim() });
      codigoInput.value = ""; nomeInput.value = ""; descInput.value = ""; categoriaInput.value = ""; pecaInput.value = "";
      renderItens();
    }
  });
  addRow.appendChild(pecaInput); addRow.appendChild(addBtn);
  itensCard.appendChild(el("div", { style: "margin-top:10px;display:flex;flex-direction:column;gap:6px" }, codigoInput, nomeInput, descInput, categoriaInput, addRow));
  wrap.appendChild(itensCard);

  const backupCard = Card({ style: "margin-bottom:14px" });
  backupCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Backup / consolidação entre aparelhos"));
  backupCard.appendChild(el("p", { style: "font-size:12.5px;color:var(--ink-soft);margin:0 0 10px;line-height:1.5" }, "Como cada celular guarda os dados localmente, use estes botões para juntar o trabalho de vários técnicos em um único aparelho, ou para ter uma cópia de segurança."));
  const backupRow = el("div", { class: "row" });
  const exportBtn = el("button", { class: "ghost-btn", style: "flex:1;padding:10px" }, "Exportar backup (.json)");
  exportBtn.addEventListener("click", async () => {
    const all = { config: state.config, vistorias: await idbGetAll("vistorias"), orderedParts: state.orderedParts, exportadoEm: new Date().toISOString() };
    download(`backup-inspecoes-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(all), "application/json");
  });
  const importInput = el("input", { type: "file", accept: "application/json", style: "display:none" });
  const importBtn = el("button", { class: "ghost-btn", style: "flex:1;padding:10px" }, "Importar backup");
  importBtn.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.vistorias)) { for (const v of data.vistorias) await idbSet("vistorias", undefined, v); }
      await persistVistoriaList();
      alert(`Importado: ${(data.vistorias || []).length} inspeção(ões).`);
      render();
    } catch (err) { alert("Arquivo inválido."); }
  });
  backupRow.appendChild(exportBtn); backupRow.appendChild(importBtn);
  backupCard.appendChild(backupRow);
  backupCard.appendChild(importInput);
  wrap.appendChild(backupCard);

  const saveBtn = el("button", { class: "submit-btn", style: "width:100%" }, "Salvar configurações");
  saveBtn.addEventListener("click", async () => {
    state.config = local;
    await idbSet("config", "main", local);
    saveBtn.textContent = "Salvo ✓";
    saveBtn.style.background = "var(--green)";
    setTimeout(() => { saveBtn.textContent = "Salvar configurações"; saveBtn.style.background = "var(--ink)"; }, 1600);
  });
  wrap.appendChild(saveBtn);
  wrap.appendChild(el("div", { class: "mono", style: "text-align:center;color:var(--ink-faint);font-size:11px;margin-top:18px" }, `Versão do app: ${APP_VERSION} · Revisão: ${APP_VERSION_DATE}`));
  return wrap;
}

/* ---------------- Start ---------------- */
boot();
