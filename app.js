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
  { id: "prumo", codigo: "9.17", categoria: "Estruturais", familia: "Colunas e Prumo", nivel: "montante", nome: "Colunas com problemas de prumo", descOpcoes: ["COLUNA NO PRUMO", "COLUNA NA TOLERÂNCIA DO PRUMO", "COLUNA FORA DE PRUMO", "COLUNA FORA DE PRUMO GRAVE", "COLUNA FORA DE PRUMO GRAVÍSSIMO", "COLUNA SEM ACESSO"], localOpcoes: ["LONGITUDINAL", "TRANSVERSAL"], localLabel: "Localização (Longitudinal / Transversal)", peca: "Colunas com problemas de prumo" },
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
  { id: "lux", codigo: "9.45", categoria: "Iluminação", familia: "Ambiente e Iluminação", nivel: "montante", nome: "Aferição de iluminação no montante", tipo: "medicao", unidade: "lux", min: 200, peca: "Aferição de iluminação no montante" },
];
const APP_VERSION = "2.20.0-RC1";
const APP_VERSION_DATE = "04/09/2026";
const CATALOG_VERSION = 5;
const DEFAULT_CONFIG = {
  empresa: "Minha Empresa",
  locais: ["Centro de Distribuição 001", "Loja Centro", "Loja Shopping"],
  fabricantes: ["ESMENA 75X78", "ESMENA TÚNEL 100X105", "PROVENÇA", "AGUIA ANTIGA MENOR 76X55", "AGUIA ANTIGA MAIOR 90X65", "AGUIA NOVA 91X70", "ESMENA MENOR 76X70", "ESMENA MEZANINO 50X50", "AGRA", "A. BOLLETI", "AVALTEC", "75X65", "90X80", "FAST", "OUTROS"],
  setores: ["SALÃO DE VENDAS", "DEPÓSITO", "CÂMARAS FRIGORÍFICAS RESFRIADOS", "CÂMARAS FRIGORÍFICAS CONGELADOS", "CÂMARAS FRIGORÍFICAS", "OUTROS"],
  tiposEstrutura: ["SIMPLES ENTRADA", "DUPLA ENTRADA"],
  itens: DEFAULT_ITEMS,
  catalogVersion: CATALOG_VERSION,
};
function mergeCatalog(existingItens) {
  const defaultIds = new Set(DEFAULT_ITEMS.map((it) => it.id));
  const customExtra = (existingItens || []).filter((it) => !defaultIds.has(it.id)).map((it) => ({
    ...it,
    nivel: it.nivel || "montante",
    familia: it.familia || "Configuração, Adaptações e Uso",
  }));
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
function nowIso() { return new Date().toISOString(); }
let _deviceId = null;
function getDeviceId() { return _deviceId || "device-desconhecido"; }
async function ensureDeviceId() {
  if (_deviceId) return _deviceId;
  let stored = await idbGet("config", "deviceId");
  if (!stored) { stored = "DEV-" + uid().toUpperCase(); await idbSet("config", "deviceId", stored); }
  _deviceId = stored;
  return _deviceId;
}
function touchMeta(obj) { if (obj) { obj.metaUpdatedAt = nowIso(); obj.metaDeviceOrigin = getDeviceId(); } return obj; }
function touchMontante(m, e) { if (m) { m.updatedAt = nowIso(); m.deviceOrigin = getDeviceId(); } if (e) touchStage(e, "visual"); }
function touchMontanteMeta(m, e) { if (m) { m.metaUpdatedAt = nowIso(); m.metaDeviceOrigin = getDeviceId(); } }
function touchResolvido(e) { if (e) { e.resolvidoUpdatedAt = nowIso(); e.resolvidoDeviceOrigin = getDeviceId(); } }
function touchWorkflowConfig(v) { if (v) { v.configUpdatedAt = nowIso(); v.configDeviceOrigin = getDeviceId(); } return v; }
function touchLuxNaoAplica(e) { if (e) { e.luxNaoAplicaUpdatedAt = nowIso(); e.luxNaoAplicaDeviceOrigin = getDeviceId(); } return e; }
function stageForItem(item) {
  if (!item) return "visual";
  if (item.id === "prumo") return "prumo";
  if (item.id === "iluminacao" || item.id === "lux") return "lux";
  return "visual";
}
function touchOccurrence(oc) { if (oc) { oc.updatedAt = nowIso(); oc.deviceOrigin = getDeviceId(); } return oc; }
function touchOccurrenceFull(oc, item, e) {
  touchOccurrence(oc);
  if (item) touchItem(item);
  if (e) touchStage(e, stageForItem(item));
}
function touchItem(it) { if (it) { it.updatedAt = nowIso(); it.deviceOrigin = getDeviceId(); } return it; }
// v2.19.1: atualiza o timestamp do rascunho de recuperação (não do conteúdo — esse já é a MESMA
// referência de objeto usada em state.draftOccurrence, então já muda sozinho). Só marca "quando foi
// a última vez que este rascunho recebeu atenção", útil pra debug/auditoria futura.
function touchDraftRecovery() { if (state.draftVistoria && state.draftVistoria.draftOccurrenceRecovery) state.draftVistoria.draftOccurrenceRecovery.updatedAt = nowIso(); }
function touchStage(e, stage) { if (e) { e[stage + "UpdatedAt"] = nowIso(); e[stage + "DeviceOrigin"] = getDeviceId(); } return e; }
function ensureTombstones(v) {
  v.tombstones = v.tombstones || { estruturas: {}, montantes: {}, ocorrencias: {}, photos: {} };
  v.tombstones.estruturas = v.tombstones.estruturas || {};
  v.tombstones.montantes = v.tombstones.montantes || {};
  v.tombstones.ocorrencias = v.tombstones.ocorrencias || {};
  v.tombstones.photos = v.tombstones.photos || {};
  return v.tombstones;
}
function recordTombstone(v, kind, id) {
  const t = ensureTombstones(v);
  t[kind][id] = { deletedAt: nowIso(), deviceOrigin: getDeviceId() };
}
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
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
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
function prumoStatusFromDesc(desc) {
  const t = String(desc || "").trim().toUpperCase();
  if (!t) return "pendente";
  if (t.includes("SEM ACESSO")) return "naoaplica";
  if (t.includes("FORA DE PRUMO")) return "problema";
  if (t.includes("NO PRUMO") || t.includes("NA TOLERÂNCIA")) return "ok";
  return "pendente";
}
function isPrumoHabilitado(v) {
  if (!v || !v.workflowConfig) return true; // legado
  return v.workflowConfig.prumoHabilitado !== false;
}
function podeEntrarNoPrumo(v) {
  if (!v || !v.workflowConfig) return true; // legado sem workflowConfig
  return v.workflowConfig.prumoHabilitado === true;
}
function isLuxHabilitado(v) {
  if (!v || !v.workflowConfig) return true; // legado
  return v.workflowConfig.luxHabilitado !== false;
}
function getLuxMetodo(v) {
  if (!v || !v.workflowConfig) return "LEGADO";
  if (!v.workflowConfig.luxMetodo) return null;
  return v.workflowConfig.luxMetodo === "B" ? "B" : "A";
}
function luxTemDados(v) {
  if (!v || !v.estruturas) return false;
  for (const e of v.estruturas) {
    const it = iluminacaoItem(e);
    if (it && Array.isArray(it.ocorrencias)) {
      for (const oc of it.ocorrencias) {
        if (oc.status === "naoaplica" || (oc.valor !== undefined && oc.valor !== null && String(oc.valor).trim() !== "")) {
          return true;
        }
      }
    }
    for (const m of (e.montantes || [])) {
      const lIt = (m.itens || []).find((x) => x.id === "lux");
      if (lIt) {
        if (lIt.status === "naoaplica" || (lIt.valor !== undefined && lIt.valor !== null && String(lIt.valor).trim() !== "")) {
          return true;
        }
        for (const oc of (lIt.ocorrencias || [])) {
          if (oc.status === "naoaplica" || (oc.valor !== undefined && oc.valor !== null && String(oc.valor).trim() !== "")) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
function calculateLuxStats(points) {
  const validNumbers = [];
  let naoAplicaCount = 0;
  (points || []).forEach((p) => {
    if (!p) return;
    if (p.status === "naoaplica") {
      naoAplicaCount++;
      return;
    }
    const rawVal = p.valor !== undefined && p.valor !== null ? String(p.valor).trim() : "";
    if (rawVal === "") return;
    const num = parseFloat(rawVal.replace(",", "."));
    if (!isNaN(num)) {
      validNumbers.push(num);
    }
  });
  if (!validNumbers.length) {
    return { count: 0, min: null, max: null, avg: null, naoAplicaCount };
  }
  const min = Math.min(...validNumbers);
  const max = Math.max(...validNumbers);
  const sum = validNumbers.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / validNumbers.length) * 10) / 10;
  return { count: validNumbers.length, min, max, avg, naoAplicaCount };
}
function montanteLuxItem(m) { return (m.itens || []).find((it) => it.id === "lux") || null; }

function ocorrenciaStatus(oc, item) {
  if (oc && oc.status === "naoaplica") return "naoaplica";
  if (item && item.tipo === "medicao") return statusFromMedicao(oc && oc.valor, item.min);
  if (item && item.id === "prumo") return prumoStatusFromDesc(oc && oc.descTxt);
  return (oc && oc.status) || "problema";
}
function occurrencePhotoRefs(obj) {
  if (!obj) return [];
  const arr = Array.isArray(obj.fotos) ? obj.fotos.filter(Boolean) : [];
  if (!arr.length && obj.foto) arr.push(obj.foto);
  return arr;
}
function occurrencePhotos(obj) {
  return occurrencePhotoRefs(obj);
}
function normalizeOccurrence(oc, item, defaultStatus = "problema") {
  oc = oc || {};
  oc.id = oc.id || uid();
  oc.fotos = occurrencePhotoRefs(oc);
  delete oc.foto;
  if (!oc.status) oc.status = item && (item.tipo === "medicao" || item.id === "prumo") ? ocorrenciaStatus(oc, item) : defaultStatus;
  if (oc.qtd == null) oc.qtd = 1;
  return oc;
}
function montanteItemStatus(item) {
  const occ = (item.ocorrencias || []).map((oc) => ocorrenciaStatus(oc, item));
  if (occ.includes("problema")) return "problema";
  if (occ.includes("pendente")) return "pendente";
  if (occ.length && occ.every((s) => s === "ok" || s === "naoaplica")) return "ok";
  if (item.status === "naoaplica") return "naoaplica";
  if (item.tipo === "medicao") {
    if (item.valor !== undefined && item.valor !== null && String(item.valor).trim() !== "") {
      return statusFromMedicao(item.valor, item.min);
    }
    return "pendente";
  }
  if (item.status === "problema") return "problema"; // compatibilidade com v2.14
  if (item.revisado || item.status === "ok") return "ok";
  return "pendente";
}
function syncMontanteItemStatus(item) { item.status = montanteItemStatus(item); return item.status; }
function normalizeMontanteItem(item) {
  item = item || {};
  item.ocorrencias = Array.isArray(item.ocorrencias) ? item.ocorrencias : [];
  // Converte uma anomalia v2.14 em uma ocorrência sem perder os dados existentes.
  if (!item.ocorrencias.length && item.status === "problema") {
    item.ocorrencias.push(normalizeOccurrence({
      descTxt: item.descTxt || "", tipoTxt: item.tipoTxt || "", localTxt: item.localTxt || "",
      grauTxt: item.grauTxt || "", corte: item.corte || "", qtd: item.qtd == null ? 1 : item.qtd,
      correcao: item.correcao || "", obs: item.obs || "", foto: item.foto || null,
      valor: item.valor || "", status: "problema"
    }, item));
  }
  item.ocorrencias = item.ocorrencias.map((oc) => normalizeOccurrence(oc, item));
  item.revisado = Boolean(item.revisado || item.status === "ok" || item.status === "naoaplica");
  delete item.foto;
  syncMontanteItemStatus(item);
  return item;
}
function normalizeVistoria(v) {
  if (!v) return v;
  if (v.workflowConfig) {
    v.workflowConfig = {
      prumoHabilitado: v.workflowConfig.prumoHabilitado === false ? false : (v.workflowConfig.prumoHabilitado === true ? true : null),
      prumoMotivo: v.workflowConfig.prumoMotivo || "",
      luxHabilitado: v.workflowConfig.luxHabilitado === false ? false : (v.workflowConfig.luxHabilitado === true ? true : null),
      luxMotivo: v.workflowConfig.luxMotivo || "",
      luxMetodo: v.workflowConfig.luxMetodo === "B" ? "B" : (v.workflowConfig.luxMetodo === "A" ? "A" : null)
    };
  }
  const estCatalog = itensEstruturaCatalogo(state.config);
  const montCatalog = itensMontante(state.config);
  (v.estruturas || []).forEach((e) => {
    e.montantes = e.montantes || [];
    e.observacoesGerais = e.observacoesGerais || "";
    if (e.setupComplete == null) e.setupComplete = true;
    if (e.qtdEstimada == null) e.qtdEstimada = e.modulos || "";
    if (e.visualFinalizada == null) e.visualFinalizada = Boolean(e.finalizada);
    if (e.prumoFinalizada == null) e.prumoFinalizada = Boolean(e.finalizada);
    if (e.luxFinalizada == null) e.luxFinalizada = Boolean(e.finalizada);
    if (e.luxNaoAplica == null) e.luxNaoAplica = false;

    // v2.17.1: reidrata os itens estáticos do catálogo. No banco ficam apenas os dados de execução.
    const storedEst = Array.isArray(e.itensEstrutura) ? e.itensEstrutura : [];
    const estById = new Map(storedEst.map((it) => [it.id, it]));
    e.itensEstrutura = estCatalog.map((base) => {
      const runtime = estById.get(base.id);
      const it = { ...base, ...(runtime || {}), ocorrencias: runtime && Array.isArray(runtime.ocorrencias) ? runtime.ocorrencias : [] };
      if (!runtime && e.visualFinalizada && base.id !== "iluminacao") it.revisado = true;
      it.ocorrencias = it.ocorrencias.map((oc) => normalizeOccurrence(oc, it, it.tipo === "medicao" ? "pendente" : "problema"));
      return it;
    });
    // Preserva item legado/customizado que por algum motivo não esteja mais no catálogo.
    storedEst.filter((it) => !estCatalog.some((b) => b.id === it.id)).forEach((it) => e.itensEstrutura.push(it));

    e.montantes.forEach((m) => {
      m.fabricante = m.fabricante == null ? (e.fabricante || "") : m.fabricante;
      m.tipoMontante = m.tipoMontante || "";
      m.observacoes = m.observacoes || "";
      if (!m.visualInspecionadoAt && m.inspecionadoAt) m.visualInspecionadoAt = m.inspecionadoAt;
      const stored = Array.isArray(m.itens) ? m.itens : [];
      const byId = new Map(stored.map((it) => [it.id, it]));
      m.itens = montCatalog.map((base) => {
        const runtime = byId.get(base.id);
        const it = { ...base, ...(runtime || {}), status: runtime && runtime.status ? runtime.status : "pendente", revisado: Boolean(runtime && runtime.revisado), ocorrencias: runtime && Array.isArray(runtime.ocorrencias) ? runtime.ocorrencias : [], valor: runtime && runtime.valor || "", qtd: runtime && runtime.qtd != null ? runtime.qtd : 1, correcao: runtime && runtime.correcao || "" };
        // Itens visuais conformes não precisam ser gravados individualmente quando o montante já foi concluído.
        if (!runtime && m.visualInspecionadoAt && base.id !== "prumo" && base.id !== "lux") { it.revisado = true; it.status = "ok"; }
        return normalizeMontanteItem(it);
      });
      stored.filter((it) => !montCatalog.some((b) => b.id === it.id)).forEach((it) => m.itens.push(normalizeMontanteItem(it)));
    });
  });
  return v;
}
function montanteProblemEntries(e) {
  return (e.montantes || []).flatMap((m) => (m.itens || []).flatMap((item) => {
    const occs = (item.ocorrencias || []).filter((oc) => ocorrenciaStatus(oc, item) === "problema");
    if (occs.length) return occs.map((oc) => ({ m, item, oc, i: { ...item, ...oc, status: "problema", fotos: occurrencePhotos(oc), fabricante: m.fabricante || e.fabricante || "" } }));
    if (isProblem(item.status)) return [{ m, item, oc: null, i: { ...item, fotos: occurrencePhotos(item), fabricante: m.fabricante || e.fabricante || "" } }];
    return [];
  }));
}
function montanteAnomalyEntries(e) {
  return montanteProblemEntries(e).filter(({item}) => item.tipo !== "medicao");
}
function estruturaProblemOccurrences(e) {
  return (e.itensEstrutura || []).flatMap((it) => (it.ocorrencias || [])
    .filter((oc) => ocorrenciaStatus(oc, it) === "problema")
    .map((oc) => ({ it, oc })));
}
function estruturaAnomalyOccurrences(e) {
  return estruturaProblemOccurrences(e).filter(({it}) => it.tipo !== "medicao");
}
function estruturaMedicoesInformativas(e) {
  return (e.itensEstrutura || []).flatMap((it) => it.tipo === "medicao" ? (it.ocorrencias || [])
    .map((oc) => ({ it, oc })) : []);
}
function visualItemsMontante(m, e) {
  return (m.itens || []).filter((it) => it.id !== "prumo" && it.id !== "lux" && (!e || itemAplicavel(it, e)));
}
function visualStructureItems(e) {
  return (e.itensEstrutura || []).filter((it) => it.id !== "iluminacao");
}
function visualMontanteStatus(m, e) {
  const itens = visualItemsMontante(m, e);
  if (!itens.length) return m.visualInspecionadoAt ? "ok" : "pendente";
  const statuses = itens.map(montanteItemStatus);
  if (statuses.includes("problema")) return "problema";
  if (statuses.includes("pendente") && !m.visualInspecionadoAt) return "pendente";
  if (statuses.includes("pendente")) return "pendente";
  return "ok";
}
function visualMontanteDone(m, e) {
  return Boolean(m.visualInspecionadoAt) && visualItemsMontante(m, e).every((it) => montanteItemStatus(it) !== "pendente");
}
function prumoItem(m) { return (m.itens || []).find((it) => it.id === "prumo") || null; }
function prumoResolution(m) {
  const it = prumoItem(m);
  if (!it) return { resolved:false, measured:false, noAccess:false, longitudinal:false, transversal:false, combined:false };
  const occs = (it.ocorrencias || []).filter((oc) => ocorrenciaStatus(oc, it) !== "pendente");
  const norm = (v) => String(v || "").trim().toUpperCase();
  const isNoAccess = (oc) => norm(oc.descTxt).includes("SEM ACESSO") || ocorrenciaStatus(oc,it) === "naoaplica";
  const combinedOcc = occs.find((oc) => { const l=norm(oc.localTxt); return l.includes("LONGITUDINAL") && l.includes("TRANSVERSAL"); });
  if (combinedOcc) {
    const noAccess = isNoAccess(combinedOcc);
    return { resolved:true, measured:!noAccess, noAccess, longitudinal:true, transversal:true, combined:true };
  }
  const longOcc = occs.find((oc) => norm(oc.localTxt) === "LONGITUDINAL");
  const transOcc = occs.find((oc) => norm(oc.localTxt) === "TRANSVERSAL");
  const longitudinal = Boolean(longOcc), transversal = Boolean(transOcc);
  const resolved = longitudinal && transversal;
  const noAccess = resolved && (isNoAccess(longOcc) || isNoAccess(transOcc));
  return { resolved, measured:resolved && !noAccess, noAccess, longitudinal, transversal, combined:false };
}
function prumoDone(m) { return prumoResolution(m).resolved; }
function iluminacaoItem(e) { return (e.itensEstrutura || []).find((it) => it.id === "iluminacao") || null; }
function visualProgress(e) {
  const total = (e.montantes || []).length;
  const done = (e.montantes || []).filter((m) => visualMontanteDone(m, e)).length;
  return { total, done, pending: Math.max(total - done, 0), complete: Boolean(e.visualFinalizada) && total > 0 && done === total };
}
function prumoProgress(e, v = (typeof state !== "undefined" ? state.draftVistoria : null)) {
  if (v && !isPrumoHabilitado(v)) {
    const total = (e && e.montantes || []).length;
    return { total, done: total, measured: 0, noAccess: 0, pending: 0, problems: 0, complete: true, disabled: true };
  }
  const total = (e && e.montantes || []).length;
  const states = (e && e.montantes || []).map(prumoResolution);
  const done = states.filter((x) => x.resolved).length;
  const measured = states.filter((x) => x.measured).length;
  const noAccess = states.filter((x) => x.noAccess).length;
  const problems = (e && e.montantes || []).filter((m) => { const it=prumoItem(m); return it && montanteItemStatus(it)==="problema"; }).length;
  return { total, done, measured, noAccess, pending: Math.max(total - done, 0), problems, complete: total > 0 && done === total };
}
function luxProgress(e, v = (typeof state !== "undefined" ? state.draftVistoria : null)) {
  if (v && !isLuxHabilitado(v)) {
    return { measurements: 0, pending: 0, problems: 0, complete: true, disabled: true };
  }
  if (e && e.luxNaoAplica) {
    return { measurements: 0, pending: 0, problems: 0, complete: true, naoAplica: true };
  }
  const metodo = getLuxMetodo(v);
  if (metodo === "B") {
    const montantes = (e && e.montantes) || [];
    const total = montantes.length;
    let resolvedCount = 0;
    let measurements = 0;
    let problems = 0;
    montantes.forEach((m) => {
      const it = montanteLuxItem(m);
      if (!it) return;
      const occs = it.ocorrencias || [];
      const occNaoAplica = occs.some((oc) => oc.status === "naoaplica");
      const occValid = occs.some((oc) => oc.status !== "naoaplica" && oc.valor !== undefined && oc.valor !== null && String(oc.valor).trim() !== "");
      const itNaoAplica = it.status === "naoaplica" || occNaoAplica;
      const itValid = (it.valor !== undefined && it.valor !== null && String(it.valor).trim() !== "") || occValid;
      if (itNaoAplica || itValid) {
        resolvedCount++;
        if (itValid && !itNaoAplica) {
          measurements++;
          if (montanteItemStatus(it) === "problema") problems++;
        }
      }
    });
    const complete = Boolean(e && e.luxFinalizada) && total > 0 && resolvedCount === total;
    return { total, done: resolvedCount, measurements, pending: Math.max(total - resolvedCount, 0), problems, complete, metodo: "B" };
  }
  if (metodo === "A") {
    const it = iluminacaoItem(e);
    const occs = it ? (it.ocorrencias || []) : [];
    const POSICOES = ["inicio", "meio", "final"];
    let resolvedCount = 0;
    let measurements = 0;
    let problems = 0;
    POSICOES.forEach((pos) => {
      const oc = occs.find((o) => (o.posicao || "").toLowerCase() === pos);
      if (!oc) return;
      if (oc.status === "naoaplica") {
        resolvedCount++;
      } else if (oc.valor !== undefined && oc.valor !== null && String(oc.valor).trim() !== "") {
        resolvedCount++;
        measurements++;
        if (ocorrenciaStatus(oc, it) === "problema") problems++;
      }
    });
    const complete = Boolean(e && e.luxFinalizada) && resolvedCount === 3;
    return { total: 3, done: resolvedCount, measurements, pending: Math.max(3 - resolvedCount, 0), problems, complete, metodo: "A" };
  }
  // LEGADO (v2.18.8 mantido intacto)
  const it = iluminacaoItem(e);
  const occs = it ? (it.ocorrencias || []) : [];
  const isValid = (oc) => Boolean(String(oc.montanteRef || "").trim()) && ocorrenciaStatus(oc, it) !== "pendente";
  const validOccs = occs.filter(isValid);
  const problems = validOccs.filter((oc) => ocorrenciaStatus(oc, it) === "problema").length;
  return { measurements: validOccs.length, pending: occs.length - validOccs.length, problems, complete: Boolean(e && e.luxFinalizada) && validOccs.length > 0 && occs.length === validOccs.length, metodo: "LEGADO" };
}
function completeMontanteVisualAsInspected(m, e) {
  visualItemsMontante(m, e).forEach((it) => {
    if (montanteItemStatus(it) !== "pendente") return;
    it.revisado = true;
    it.status = "ok";
    syncMontanteItemStatus(it);
    // Não toca updatedAt/deviceOrigin item a item aqui: m.updatedAt + m.deviceOrigin já provam
    // que o montante foi revisado. Timestamp individual só quando o técnico mexe NAQUELE item específico
    // (ver touchItem() nos handlers de edição) — senão a compactação perde efeito em escala.
  });
  m.visualInspecionadoAt = new Date().toISOString();
  m.updatedAt = nowIso(); m.deviceOrigin = getDeviceId();
  if (e) touchStage(e, "visual");
}
function completeStructureVisualAsInspected(e) {
  visualStructureItems(e).forEach((it) => {
    if (estruturaEstItemStatus(it) === "pendente") it.revisado = true;
    // idem: e.visualUpdatedAt (tocado abaixo) já é prova suficiente pros itens implicitamente conformes.
  });
  e.visualFinalizada = true;
  e.visualFinalizadaAt = new Date().toISOString();
  touchStage(e, "visual");
}
function inspectionStageSummary(v) {
  const estruturas = v.estruturas || [];
  const montantes = estruturas.flatMap((e) => e.montantes || []);
  const visualDone = estruturas.reduce((sum,e)=>sum + visualProgress(e).done,0);
  const prumoDoneCount = isPrumoHabilitado(v) ? estruturas.reduce((sum,e)=>sum + prumoProgress(e, v).done,0) : montantes.length;
  const luxDone = isLuxHabilitado(v) ? estruturas.filter((e)=>luxProgress(e, v).complete).length : estruturas.length;
  return { estruturas: estruturas.length, montantes: montantes.length, visualDone, prumoDone: prumoDoneCount, luxDone };
}
function countPendingInspection(v) {
  let visualMontantes = 0, visualItens = 0, estruturaItens = 0, prumo = 0, luxEstruturas = 0;
  const prumoHab = isPrumoHabilitado(v);
  const luxHab = isLuxHabilitado(v);
  (v.estruturas || []).forEach((e) => {
    (e.montantes || []).forEach((m) => {
      const p = visualItemsMontante(m,e).filter((it) => montanteItemStatus(it) === "pendente").length;
      if (p || !m.visualInspecionadoAt) { visualMontantes++; visualItens += p; }
      if (prumoHab && !prumoDone(m)) prumo++;
    });
    estruturaItens += visualStructureItems(e).filter((it) => estruturaEstItemStatus(it) === "pendente").length;
    if (luxHab && !luxProgress(e, v).complete) luxEstruturas++;
  });
  return { visualMontantes, visualItens, estruturaItens, prumo, luxEstruturas, total: visualItens + estruturaItens + prumo + luxEstruturas };
}

function nextStageStructure(v, current, mode) {
  const list = (v.estruturas || []).filter((e) => e.setupComplete && e.visualFinalizada);
  const currentIdx = list.findIndex((e) => e.id === current.id);
  const pending = (e) => mode === "prumo" ? (podeEntrarNoPrumo(v) && !prumoProgress(e, v).complete) : (isLuxHabilitado(v) && !luxProgress(e, v).complete);
  for (let i = currentIdx + 1; i < list.length; i++) if (pending(list[i])) return list[i];
  for (let i = 0; i < currentIdx; i++) if (pending(list[i])) return list[i];
  return null;
}
function occurrenceHasMeaningfulData(oc) {
  return Boolean(oc && ([oc.descTxt,oc.tipoTxt,oc.localTxt,oc.grauTxt,oc.corte,oc.obs,oc.valor].some((v)=>String(v||"").trim()) || occurrencePhotos(oc).length));
}
function validateAnomalyOccurrence(oc, item) {
  if (!occurrenceHasMeaningfulData(oc)) return "Preencha os dados da anomalia antes de salvar.";
  if (item && item.descOpcoes && !String(oc.descTxt || "").trim()) return "Informe a descrição / resultado da anomalia.";
  if (item && item.localOpcoes && !String(oc.localTxt || "").trim()) return "Informe a localização da anomalia.";
  if (!(Number(oc.qtd || 1) > 0)) return "Informe uma quantidade válida.";
  return "";
}
async function cancelDraftAnomaly() {
  const d = state.draftOccurrence;
  if (!d) return go("montante", state.draftVistoria && state.draftVistoria.id, state.activeEstruturaId, state.activeMontanteId);
  if (occurrenceHasMeaningfulData(d.occurrence) && !confirm("Descartar esta anomalia em rascunho? Fotos e dados ainda não salvos serão perdidos.")) return;
  const draftPhotos = occurrencePhotoRefs(d.occurrence);
  if (draftPhotos.length) {
    const toDeletePhotos = draftPhotos.map((pid) => {
      PhotoUrlManager.revoke(pid);
      return { store: "photos", key: pid };
    });
    try {
      await idbTransactionApply([], toDeletePhotos);
    } catch (err) {
      console.error("Erro ao limpar fotos do rascunho descartado:", err);
    }
  }
  const level = d.level || "montante";
  state.draftOccurrence = null;
  if (state.draftVistoria && state.draftVistoria.draftOccurrenceRecovery) {
    delete state.draftVistoria.draftOccurrenceRecovery;
    await saveVistoriaNow();
  }
  if (level === "estrutura" && !state.activeMontanteId) return go("estrutura", state.draftVistoria.id, state.activeEstruturaId);
  go("montante", state.draftVistoria.id, state.activeEstruturaId, state.activeMontanteId);
}
function montanteHasInspectionActivity(m) {
  return Boolean(m.visualInspecionadoAt || String(m.observacoes||"").trim() || (m.itens||[]).some((it)=> (it.ocorrencias||[]).length || (it.id!=="prumo" && montanteItemStatus(it)!=="pendente") || (it.id==="prumo" && prumoResolution({itens:[it]}).resolved)));
}

function setResume(v, mode, e, m = null) {
  if (!v) return;
  v.resume = { mode, estruturaId: e && e.id || null, montanteId: m && m.id || null, updatedAt: new Date().toISOString() };
}
function recentAnomalyChoices(v, limit = 5) {
  const seen = new Set(), out = [];
  const estruturas = (v.estruturas || []).slice().reverse();
  for (const e of estruturas) {
    const montantes = (e.montantes || []).slice().sort((a,b)=>b.numero-a.numero);
    for (const m of montantes) {
      for (const item of (m.itens || [])) {
        if (item.id === "prumo" || item.id === "lux") continue;
        if (!(item.ocorrencias || []).some((oc)=>ocorrenciaStatus(oc,item)==="problema")) continue;
        if (seen.has(item.id)) continue;
        seen.add(item.id); out.push(item);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}
function lastVisualAnomalyBefore(e, currentM) {
  const montantes=(e.montantes||[]).filter((m)=>m.numero < currentM.numero).sort((a,b)=>b.numero-a.numero);
  for (const m of montantes) {
    for (const item of (m.itens||[]).slice().reverse()) {
      if (item.id === "prumo" || item.id === "lux") continue;
      const occ=(item.ocorrencias||[]).slice().reverse().find((oc)=>ocorrenciaStatus(oc,item)==="problema");
      if (occ) return { item, oc: occ, sourceMontante:m };
    }
  }
  return null;
}
/* ---------------- Motor PKZIP Offline Nativo (Zero Dependências) ---------------- */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(uint8Arr) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < uint8Arr.length; i++) {
    c = CRC32_TABLE[(c ^ uint8Arr[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function createZipBlob(fileEntries) {
  const encoder = new TextEncoder();
  const chunks = [];
  const centralRecords = [];
  let offset = 0;

  for (const file of fileEntries) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = file.data instanceof Uint8Array ? file.data : encoder.encode(file.data);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034B50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true);
    view.setUint32(22, size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cView = new DataView(centralHeader.buffer);
    cView.setUint32(0, 0x02014B50, true);
    cView.setUint16(4, 20, true);
    cView.setUint16(6, 20, true);
    cView.setUint16(8, 0x0800, true);
    cView.setUint16(10, 0, true);
    cView.setUint16(12, 0, true);
    cView.setUint16(14, 0, true);
    cView.setUint32(16, crc, true);
    cView.setUint32(20, size, true);
    cView.setUint32(24, size, true);
    cView.setUint16(28, nameBytes.length, true);
    cView.setUint16(30, 0, true);
    cView.setUint16(32, 0, true);
    cView.setUint16(34, 0, true);
    cView.setUint16(36, 0, true);
    cView.setUint32(38, 0, true);
    cView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralRecords.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const c of centralRecords) {
    chunks.push(c);
    centralDirSize += c.length;
  }

  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054B50, true);
  eView.setUint16(4, 0, true);
  eView.setUint16(6, 0, true);
  eView.setUint16(8, fileEntries.length, true);
  eView.setUint16(10, fileEntries.length, true);
  eView.setUint32(12, centralDirSize, true);
  eView.setUint32(16, centralDirOffset, true);
  eView.setUint16(20, 0, true);
  chunks.push(eocd);

  return new Blob(chunks, { type: "application/zip" });
}

async function parseZipBlob(zipBlob) {
  const arrayBuffer = await zipBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder();
  const files = new Map();

  if (bytes.length < 22) throw new Error("Arquivo ZIP corrompido: tamanho menor que o cabeçalho mínimo");

  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65536); i--) {
    if (view.getUint32(i, true) === 0x06054B50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("Arquivo ZIP inválido ou corrompido: assinatura EOCD não encontrada");

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirSize = view.getUint32(eocdOffset + 12, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  if (centralDirOffset + centralDirSize > eocdOffset || centralDirOffset >= bytes.length) {
    throw new Error("Arquivo ZIP corrompido: limites do diretório central inválidos");
  }

  let cOffset = centralDirOffset;
  for (let idx = 0; idx < totalEntries; idx++) {
    if (cOffset + 46 > bytes.length) throw new Error("Arquivo ZIP corrompido: cabeçalho de entrada truncado");
    if (view.getUint32(cOffset, true) !== 0x02014B50) throw new Error("Arquivo ZIP corrompido: assinatura central header inválida");

    const compression = view.getUint16(cOffset + 10, true);
    if (compression !== 0) throw new Error(`Método de compressão não suportado (${compression}). Somente Store (0) é aceito.`);

    const expectedCrc = view.getUint32(cOffset + 16, true);
    const compressedSize = view.getUint32(cOffset + 20, true);
    const uncompressedSize = view.getUint32(cOffset + 24, true);
    if (compressedSize !== uncompressedSize) throw new Error("Arquivo ZIP corrompido: tamanhos comprimido e descomprimido divergem para Store");

    const nameLen = view.getUint16(cOffset + 28, true);
    const extraLen = view.getUint16(cOffset + 30, true);
    const commentLen = view.getUint16(cOffset + 32, true);
    const localHeaderOffset = view.getUint32(cOffset + 42, true);

    if (cOffset + 46 + nameLen > bytes.length) throw new Error("Arquivo ZIP corrompido: nome do arquivo além dos limites");
    const nameBytes = bytes.subarray(cOffset + 46, cOffset + 46 + nameLen);
    const fileName = decoder.decode(nameBytes);

    if (localHeaderOffset + 30 > bytes.length) throw new Error(`Arquivo ZIP corrompido: local header além dos limites para ${fileName}`);
    if (view.getUint32(localHeaderOffset, true) !== 0x04034B50) throw new Error(`Arquivo ZIP corrompido: assinatura local header inválida para ${fileName}`);

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + uncompressedSize;

    if (dataEnd > bytes.length) throw new Error(`Arquivo ZIP corrompido: dados de ${fileName} ultrapassam o final do arquivo`);
    const fileData = bytes.subarray(dataStart, dataEnd);

    const actualCrc = crc32(fileData);
    if (actualCrc !== expectedCrc) {
      throw new Error(`Arquivo ZIP corrompido: falha de CRC-32 em ${fileName} (esperado 0x${expectedCrc.toString(16)}, obtido 0x${actualCrc.toString(16)})`);
    }

    files.set(fileName, {
      name: fileName,
      data: fileData,
      text: () => decoder.decode(fileData),
      blob: (mime = "image/jpeg") => new Blob([fileData], { type: mime })
    });

    cOffset += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/* ---------------- Preflight & Validação de Pacotes v2.18.2 ---------------- */
async function preflightImportPackage(data, zipPhotosMap = null) {
  if (!data || !Array.isArray(data.vistorias)) {
    throw new Error("Preflight falhou: pacote não contém lista de vistorias válida.");
  }

  const packagePhotosMap = new Map((data.photos || []).map((p) => [p.id, p]));

  const requiredPhotoIds = new Set();
  for (const v of data.vistorias) {
    for (const e of (v.estruturas || [])) {
      for (const it of (e.itensEstrutura || [])) {
        for (const oc of (it.ocorrencias || [])) {
          for (const pid of occurrencePhotoRefs(oc)) {
            if (pid && pid.startsWith("pho_")) requiredPhotoIds.add(pid);
          }
        }
      }
      for (const m of (e.montantes || [])) {
        for (const it of (m.itens || [])) {
          for (const oc of (it.ocorrencias || [])) {
            for (const pid of occurrencePhotoRefs(oc)) {
              if (pid && pid.startsWith("pho_")) requiredPhotoIds.add(pid);
            }
          }
        }
      }
    }
  }

  // Regra de Autossuficiência: todo pacote DEVE conter todas as fotos ativas das vistorias nele declaradas
  for (const pid of requiredPhotoIds) {
    const pEntry = packagePhotosMap.get(pid);
    if (!pEntry) {
      throw new Error(`Preflight falhou: pacote incompleto. A evidência '${pid}' está referenciada na vistoria mas não existe no pacote.`);
    }

    if (zipPhotosMap) {
      if (!pEntry.path || !zipPhotosMap.has(pEntry.path)) {
        throw new Error(`Preflight falhou: foto '${pid}' aponta para o caminho '${pEntry.path || "indefinido"}' inexistente no ZIP.`);
      }
      const fileObj = zipPhotosMap.get(pEntry.path);
      if (!fileObj || !fileObj.data || fileObj.data.length === 0) {
        throw new Error(`Preflight falhou: arquivo de evidência '${pEntry.path}' está vazio no ZIP.`);
      }
    } else if (pEntry.blobBase64) {
      if (typeof pEntry.blobBase64 !== "string" || pEntry.blobBase64.length < 50) {
        throw new Error(`Preflight falhou: foto '${pid}' possui Base64 vazio ou corrompido no JSON.`);
      }
    } else {
      throw new Error(`Preflight falhou: foto '${pid}' sem dados binários válidos no pacote.`);
    }
  }
  return true;
}

/* ---------------- ProgressModal (Feedback de Etapas e Itens) ---------------- */
function showProgressModal(title, initialStep = "") {
  let closed = false;
  const overlay = el("div", { class: "modal-overlay", style: "z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);position:fixed;inset:0" });
  const card = el("div", { class: "card", style: "width:90%;max-width:380px;padding:20px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.3)" });
  const titleEl = el("div", { style: "font-weight:700;font-size:16px;margin-bottom:8px" }, title);
  const stepEl = el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-bottom:12px;min-height:18px" }, initialStep);
  const barWrap = el("div", { style: "background:var(--bg);height:10px;border-radius:5px;overflow:hidden;margin-bottom:10px;border:1px solid var(--line)" });
  const barFill = el("div", { style: "background:var(--green);height:100%;width:0%;transition:width .2s ease" });
  barWrap.appendChild(barFill);
  const countEl = el("div", { class: "mono", style: "font-size:11.5px;color:var(--ink-faint)" }, "0%");
  card.appendChild(titleEl);
  card.appendChild(stepEl);
  card.appendChild(barWrap);
  card.appendChild(countEl);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  return {
    setStep(stepText) {
      if (closed) return;
      stepEl.textContent = stepText;
    },
    update(current, total, detail = "") {
      if (closed) return;
      const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
      barFill.style.width = pct + "%";
      countEl.textContent = `${current} / ${total} (${pct}%)` + (detail ? ` · ${detail}` : "");
    },
    close() {
      if (closed) return;
      closed = true;
      overlay.remove();
    }
  };
}

/* ---------------- Micro-Thumbnail Derivável (80x80 px) ---------------- */
function createMicroThumbBlob(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      const size = 80;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { alpha: false });
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.60);
    };
    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      resolve(null);
    };
    img.src = tempUrl;
  });
}

/* ---------------- Watermark Derivada para Laudo/PDF (Não-Destrutiva) ---------------- */
function renderWatermarkedDataUrl(originalBlob, line1 = "", line2 = "") {
  return new Promise((resolve) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(originalBlob);
    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.drawImage(img, 0, 0);

      if (line1 || line2) {
        const hasTwoLines = Boolean(line1 && line2);
        const barHeight = Math.max(hasTwoLines ? 44 : 28, Math.round(img.height * (hasTwoLines ? 0.055 : 0.038)));
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, img.height - barHeight, img.width, barHeight);
        ctx.fillStyle = "#FFFFFF";
        const fontSize = Math.max(12, Math.round(barHeight * (hasTwoLines ? 0.36 : 0.55)));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = "middle";

        if (hasTwoLines) {
          ctx.fillText(line1, 14, img.height - barHeight + (barHeight * 0.32));
          ctx.font = `normal ${Math.max(11, Math.round(fontSize * 0.9))}px sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.fillText(line2, 14, img.height - barHeight + (barHeight * 0.72));
        } else {
          ctx.fillText(line1 || line2, 14, img.height - (barHeight / 2));
        }
      }

      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      resolve(null);
    };
    img.src = tempUrl;
  });
}

/* ---------------- Storage Warning por Quota Concedida à PWA ---------------- */
async function checkStorageQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const usageMb = (est.usage / 1024 / 1024).toFixed(1);
      const quotaMb = (est.quota / 1024 / 1024).toFixed(0);
      const pct = est.quota > 0 ? (est.usage / est.quota) * 100 : 0;
      const isWarning = pct > 85;
      return {
        usageMb,
        quotaMb,
        pct: pct.toFixed(1),
        isWarning,
        message: `Quota da PWA: ${usageMb} MB usados de ~${quotaMb} MB concedidos pelo navegador (${pct.toFixed(1)}%).`
      };
    } catch (e) {}
  }
  return null;
}

function copyOccurrenceWithoutPhotos(oc) {
  return normalizeOccurrence({ ...oc, id: uid(), fotos: [], foto: null, obs: oc.obs || "", status: "problema" }, null, "problema");
}
function base64ToBlob(base64Data, contentType = "image/jpeg") {
  const parts = base64Data.split(",");
  const rawBase64 = parts.length > 1 ? parts[1] : parts[0];
  const mime = parts.length > 1 ? (parts[0].match(/:(.*?);/)?.[1] || contentType) : contentType;
  const binaryStr = atob(rawBase64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
async function deterministicPhotoIdFromBase64(b64, occurrenceId = "", index = 0) {
  const seed = (occurrenceId ? `${occurrenceId}_${index}:` : "") + String(b64 || "");
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(seed);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
      return "pho_" + hashHex;
    } catch (e) { /* fallback */ }
  }
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  return "pho_" + hex;
}
function resizeImageToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h >= w && h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (blob) resolve({ blob, width: w, height: h, size: blob.size, mimeType: "image/jpeg" });
          else reject(new Error("Falha ao gerar Blob da imagem"));
        }, "image/jpeg", 0.72);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function resizeImage(file) {
  const res = await resizeImageToBlob(file);
  return blobToBase64(res.blob);
}
const PhotoUrlManager = {
  _cache: new Map(),
  _maxCache: 150,
  getUrl(photoId) {
    const cached = this._cache.get(photoId);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.url;
    }
    return null;
  },
  async resolveUrl(photoId) {
    if (!photoId) return null;
    if (typeof photoId === "string" && photoId.startsWith("data:image")) return photoId;
    const cached = this._cache.get(photoId);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.url;
    }
    const record = await idbGet("photos", photoId);
    if (record && record.blob) {
      this._evictIfFull();
      const url = URL.createObjectURL(record.blob);
      this._cache.set(photoId, { url, blob: record.blob, lastUsed: Date.now() });
      return url;
    }
    return null;
  },
  async resolveThumbUrl(photoId) {
    if (!photoId) return null;
    if (typeof photoId === "string" && photoId.startsWith("data:image")) return photoId;
    const thumbKey = "thumb_" + photoId;
    const cached = this._cache.get(thumbKey);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.url;
    }
    try {
      const record = await idbGet("photoThumbs", photoId);
      if (record && record.thumbBlob) {
        this._evictIfFull();
        const url = URL.createObjectURL(record.thumbBlob);
        this._cache.set(thumbKey, { url, blob: record.thumbBlob, lastUsed: Date.now() });
        return url;
      }
    } catch (e) {}
    const origRecord = await idbGet("photos", photoId);
    if (!origRecord || !origRecord.blob) return null;
    try {
      const thumbBlob = await createMicroThumbBlob(origRecord.blob);
      if (thumbBlob) {
        await idbSet("photoThumbs", photoId, { id: photoId, thumbBlob, updatedAt: nowIso() });
        this._evictIfFull();
        const url = URL.createObjectURL(thumbBlob);
        this._cache.set(thumbKey, { url, blob: thumbBlob, lastUsed: Date.now() });
        return url;
      }
    } catch (err) {}
    return this.resolveUrl(photoId);
  },
  async resolveBlob(photoId) {
    if (!photoId) return null;
    if (typeof photoId === "string" && photoId.startsWith("data:image")) return base64ToBlob(photoId);
    const cached = this._cache.get(photoId);
    if (cached && cached.blob) {
      cached.lastUsed = Date.now();
      return cached.blob;
    }
    const record = await idbGet("photos", photoId);
    if (record && record.blob) {
      this._evictIfFull();
      if (!this._cache.has(photoId)) {
        const url = URL.createObjectURL(record.blob);
        this._cache.set(photoId, { url, blob: record.blob, lastUsed: Date.now() });
      }
      return record.blob;
    }
    return null;
  },
  registerBlob(photoId, blob) {
    if (!photoId || !blob) return null;
    this.revoke(photoId);
    this._evictIfFull();
    const url = URL.createObjectURL(blob);
    this._cache.set(photoId, { url, blob, lastUsed: Date.now() });
    return url;
  },
  _evictIfFull() {
    if (this._cache.size >= this._maxCache) {
      let oldestId = null, oldestTime = Infinity;
      for (const [id, item] of this._cache.entries()) {
        if (item.lastUsed < oldestTime) {
          oldestTime = item.lastUsed;
          oldestId = id;
        }
      }
      if (oldestId) this.revoke(oldestId);
    }
  },
  revoke(photoId) {
    const cached = this._cache.get(photoId);
    if (cached) {
      try { URL.revokeObjectURL(cached.url); } catch (e) {}
      this._cache.delete(photoId);
    }
    const thumbCached = this._cache.get("thumb_" + photoId);
    if (thumbCached) {
      try { URL.revokeObjectURL(thumbCached.url); } catch (e) {}
      this._cache.delete("thumb_" + photoId);
    }
  },
  revokeAll() {
    for (const [id, item] of this._cache.entries()) {
      try { URL.revokeObjectURL(item.url); } catch (e) {}
    }
    this._cache.clear();
  }
};
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
const MERGE_SCHEMA_VERSION = 8; // v2.18.0: + photos object store, Blob storage, photo tombstones
async function downloadZipBackup(filename, onProgress, allowDegraded = false) {
  const vistorias = await idbGetAll("vistorias");
  const integrity = await checkPhotoIntegrity(vistorias);
  let isDegraded = false;
  let finalFilename = filename;
  // pendingMigration (fotos legadas ainda em base64, não convertidas pra Blob/photoId) precisa do mesmo
  // gate que missing/corrompida: um ZIP "normal" não pode sair com esse pacote incompleto, só um
  // snapshot degradado explícito. Sem isto, a foto pendente seria embutida em base64 dentro do próprio
  // manifest.json (voltando ao formato antigo pra aquele registro) sem qualquer aviso ao usuário.
  const needsDegraded = !integrity.isClean || integrity.pendingMigration.length > 0;

  if (needsDegraded) {
    if (!allowDegraded) {
      const motivos = [];
      if (integrity.missing.length) motivos.push(`${integrity.missing.length} evidência(s) ausente(s)/corrompida(s)`);
      if (integrity.pendingMigration.length) motivos.push(`${integrity.pendingMigration.length} foto(s) legada(s) ainda não migrada(s) (base64 pendente)`);
      throw new Error(`Exportação abortada: ${motivos.join(" e ")} no banco local. Execute "Saúde dos dados" antes de exportar.`);
    } else {
      isDegraded = true;
      if (!finalFilename.includes("EMERGENCIA-DEGRADADO")) {
        finalFilename = finalFilename.replace(/(\.zip)$/i, "-EMERGENCIA-DEGRADADO$1");
      }
    }
  }

  const allPhotosRaw = await idbGetAll("photos");
  const fileEntries = [];
  const manifestPhotos = [];

  const totalPhotos = allPhotosRaw.length;
  const batchSize = 15;
  for (let i = 0; i < totalPhotos; i += batchSize) {
    const batch = allPhotosRaw.slice(i, i + batchSize);
    for (const p of batch) {
      if (p.blob && (p.blob.size > 0 || (p.blob.byteLength && p.blob.byteLength > 0))) {
        const arrayBuffer = await p.blob.arrayBuffer();
        const fName = `photos/${p.id}.jpg`;
        fileEntries.push({ name: fName, data: new Uint8Array(arrayBuffer) });
        manifestPhotos.push({
          id: p.id,
          vistoriaId: p.vistoriaId,
          occurrenceId: p.occurrenceId,
          path: fName,
          mimeType: p.mimeType || "image/jpeg",
          width: p.width,
          height: p.height,
          size: p.size || p.blob.size,
          createdAt: p.createdAt,
          deviceOrigin: p.deviceOrigin,
          updatedAt: p.updatedAt,
          deletedAt: p.deletedAt || null
        });
      }
    }
    if (onProgress) onProgress(Math.min(i + batchSize, totalPhotos), totalPhotos, isDegraded ? "Empacotando backup degradado" : "Empacotando fotos");
    await new Promise((r) => setTimeout(r, 0));
  }

  const manifest = {
    schemaVersion: MERGE_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    deviceId: await ensureDeviceId(),
    config: state.config,
    vistorias: await idbGetAll("vistorias"),
    photos: manifestPhotos,
    deletedVistorias: await getDeletedVistoriaIds(),
    orderedParts: state.orderedParts,
    exportadoEm: new Date().toISOString(),
    isDegradedBackup: isDegraded,
    emergencySnapshotNotice: isDegraded ? "Snapshot de emergência prévio (estado local degradado)" : undefined,
    degradedReport: isDegraded ? { missing: integrity.missing, pendingMigration: integrity.pendingMigration } : undefined
  };

  fileEntries.unshift({ name: "manifest.json", data: JSON.stringify(manifest, null, 2) });
  const zipBlob = createZipBlob(fileEntries);
  download(finalFilename, zipBlob, "application/zip");
  return { isDegraded, filename: finalFilename };
}

async function downloadFullBackup(filename) {
  const allPhotosRaw = await idbGetAll("photos");
  const serializedPhotos = [];
  const batchSize = 10;
  for (let i = 0; i < allPhotosRaw.length; i += batchSize) {
    const batch = allPhotosRaw.slice(i, i + batchSize);
    for (const p of batch) {
      const b64 = p.blob ? await blobToBase64(p.blob) : null;
      serializedPhotos.push({
        id: p.id,
        vistoriaId: p.vistoriaId,
        occurrenceId: p.occurrenceId,
        blobBase64: b64,
        mimeType: p.mimeType || "image/jpeg",
        width: p.width,
        height: p.height,
        size: p.size,
        createdAt: p.createdAt,
        deviceOrigin: p.deviceOrigin,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt || null
      });
    }
  }
  const all = {
    schemaVersion: MERGE_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    deviceId: await ensureDeviceId(),
    config: state.config,
    vistorias: await idbGetAll("vistorias"),
    photos: serializedPhotos,
    deletedVistorias: await getDeletedVistoriaIds(),
    orderedParts: state.orderedParts,
    exportadoEm: new Date().toISOString()
  };
  download(filename, JSON.stringify(all), "application/json");
}


/* ---------------- Persistência compacta v2.17.1 ---------------- */
function compactOccurrenceForStorage(oc) {
  const out = {};
  ["id","status","posicao","montanteRef","descTxt","tipoTxt","localTxt","grauTxt","corte","qtd","correcao","obs","valor","updatedAt","deviceOrigin"].forEach((k) => {
    const val = oc && oc[k];
    if (val !== undefined && val !== null && val !== "" && !(k === "qtd" && Number(val) === 1)) out[k] = val;
  });
  const fotos = occurrencePhotoRefs(oc);
  if (fotos.length) out.fotos = fotos;
  return out;
}
function compactRuntimeItemForStorage(it, impliedVisualOk = false) {
  const occs = (it.ocorrencias || []).map(compactOccurrenceForStorage);
  const st = montanteItemStatus(it);
  // Se o montante visual já foi fechado, um item visual simplesmente conforme é implícito e pode ser omitido —
  // MAS só quando não há metadado de toque a preservar (senão perderíamos updatedAt/deviceOrigin do merge).
  if (impliedVisualOk && !occs.length && st === "ok" && it.status !== "naoaplica" && !it.updatedAt) return null;
  const out = { id: it.id };
  if (st !== "pendente") out.status = st;
  if (it.revisado) out.revisado = true;
  if (occs.length) out.ocorrencias = occs;
  ["valor","qtd","correcao","obs","descTxt","tipoTxt","localTxt","grauTxt","corte","updatedAt","deviceOrigin"].forEach((k) => {
    const val = it[k];
    if (val !== undefined && val !== null && val !== "" && !(k === "qtd" && Number(val) === 1)) out[k] = val;
  });
  return Object.keys(out).length > 1 ? out : null;
}
function compactStructureItemForStorage(it, impliedVisualOk = false) {
  const occs = (it.ocorrencias || []).map(compactOccurrenceForStorage);
  if (impliedVisualOk && !occs.length && it.revisado && !it.updatedAt) return null;
  const out = { id: it.id };
  if (it.revisado) out.revisado = true;
  if (occs.length) out.ocorrencias = occs;
  if (it.updatedAt) out.updatedAt = it.updatedAt;
  if (it.deviceOrigin) out.deviceOrigin = it.deviceOrigin;
  return Object.keys(out).length > 1 ? out : null;
}
/* ---------------- Merge / Consolidação entre aparelhos ---------------- */
function montanteLatestTouch(m) {
  if (!m) return null;
  const candidates = [m.updatedAt, m.metaUpdatedAt];
  (m.itens || []).forEach((it) => { candidates.push(it.updatedAt); (it.ocorrencias || []).forEach((oc) => candidates.push(oc.updatedAt)); });
  return candidates.filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
}
function estruturaLatestTouch(e) {
  if (!e) return null;
  const candidates = [e.visualUpdatedAt, e.prumoUpdatedAt, e.luxUpdatedAt, e.metaUpdatedAt, e.resolvidoUpdatedAt];
  (e.itensEstrutura || []).forEach((it) => { candidates.push(it.updatedAt); (it.ocorrencias || []).forEach((oc) => candidates.push(oc.updatedAt)); });
  (e.montantes || []).forEach((m) => { candidates.push(m.updatedAt, m.metaUpdatedAt); (m.itens || []).forEach((it) => { candidates.push(it.updatedAt); (it.ocorrencias || []).forEach((oc) => candidates.push(oc.updatedAt)); }); });
  return candidates.filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
}
function maisRecente(...isos) {
  return isos.filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
}
function isTombstoned(tombMapA, tombMapB, id, referenceIso) {
  const a = tombMapA && tombMapA[id];
  const b = tombMapB && tombMapB[id];
  const tomb = [a, b].filter(Boolean).sort((x, y) => new Date(y.deletedAt) - new Date(x.deletedAt))[0];
  if (!tomb) return false;
  if (!referenceIso) return true; // sem timestamp pra contestar a exclusão: respeita o tombstone
  return new Date(tomb.deletedAt) >= new Date(referenceIso);
}
function newer(aIso, bIso) {
  if (!aIso && !bIso) return 0;
  if (!aIso) return -1;
  if (!bIso) return 1;
  return new Date(aIso) - new Date(bIso);
}
function tieKeyOf(obj) {
  return (obj && obj.deviceOrigin || "") + "|" + (obj && obj.id || "") + "|" + (obj && obj.updatedAt || "");
}
// Decide local x incoming de forma determinística: quem tem updatedAt mais recente vence;
// em empate exato, o desempate usa uma chave de conteúdo (não depende de qual lado é "local"),
// garantindo que mesclar A->B ou B->A dê sempre o mesmo resultado.
function resolveWinner(localUpdatedAt, incomingUpdatedAt, localTieObj, incomingTieObj) {
  const cmp = newer(incomingUpdatedAt, localUpdatedAt);
  if (cmp > 0) return "incoming";
  if (cmp < 0) return "local";
  const lKey = tieKeyOf(localTieObj), iKey = tieKeyOf(incomingTieObj);
  if (lKey === iKey) return "local";
  return iKey > lKey ? "incoming" : "local";
}
function mergeTombstoneMap(mapA, mapB) {
  const out = {};
  const ids = new Set([...Object.keys(mapA || {}), ...Object.keys(mapB || {})]);
  ids.forEach((id) => {
    const a = mapA && mapA[id], b = mapB && mapB[id];
    if (a && b) out[id] = new Date(a.deletedAt) >= new Date(b.deletedAt) ? a : b;
    else out[id] = a || b;
  });
  return out;
}
function unionFotos(localFotos, incomingFotos, tombA, tombB) {
  const tombPhotosA = (tombA && tombA.photos) || {};
  const tombPhotosB = (tombB && tombB.photos) || {};
  const seen = new Set();
  const out = [];
  const allIds = [...(localFotos || []), ...(incomingFotos || [])];

  for (const pid of allIds) {
    if (!pid || seen.has(pid)) continue;
    const tomb = [tombPhotosA[pid], tombPhotosB[pid]].filter(Boolean).sort((x, y) => new Date(y.deletedAt) - new Date(x.deletedAt))[0];
    if (tomb) {
      continue;
    }
    seen.add(pid);
    out.push(pid);
  }
  return out;
}
function occurrenceSnapshot(oc) {
  return { descTxt: oc.descTxt || "", tipoTxt: oc.tipoTxt || "", localTxt: oc.localTxt || "", grauTxt: oc.grauTxt || "", obs: oc.obs || "", corte: oc.corte || "", qtd: oc.qtd == null ? 1 : oc.qtd, fotos: occurrencePhotoRefs(oc).length, deviceOrigin: oc.deviceOrigin || "", updatedAt: oc.updatedAt || "" };
}
function mergeOccurrenceArrays(localOccs, incomingOccs, tombA, tombB) {
  const byId = new Map();
  (localOccs || []).forEach((oc) => byId.set(oc.id, { local: oc }));
  (incomingOccs || []).forEach((oc) => { const cur = byId.get(oc.id) || {}; cur.incoming = oc; byId.set(oc.id, cur); });
  const result = [];
  const report = { added: 0, updated: 0, keptLocal: 0, deletedByTombstone: 0, conflicts: [] };
  for (const [id, pair] of byId) {
    const ref = maisRecente(pair.local && pair.local.updatedAt, pair.incoming && pair.incoming.updatedAt);
    if (isTombstoned(tombA && tombA.ocorrencias, tombB && tombB.ocorrencias, id, ref)) { report.deletedByTombstone++; continue; }
    if (pair.local && pair.incoming) {
      const winner = resolveWinner(pair.local.updatedAt, pair.incoming.updatedAt, pair.local, pair.incoming);
      const winnerObj = winner === "incoming" ? pair.incoming : pair.local;
      // Fotos NUNCA são "vencidas" por inteiro — são sempre UNIDAS, respeitando tombstones de foto.
      // Se A anexou uma foto e B mudou o grau depois, o resultado tem o grau de B E a foto de A.
      // Se uma foto foi excluída com tombstone, a exclusão prevalece.
      const fotosUnidas = unionFotos(occurrencePhotoRefs(pair.local), occurrencePhotoRefs(pair.incoming), tombA, tombB);
      const merged = { ...winnerObj, fotos: fotosUnidas };
      result.push(merged);
      const iguais = JSON.stringify(occurrenceSnapshot(pair.local)) === JSON.stringify(occurrenceSnapshot(pair.incoming));
      if (winner === "incoming") report.updated++; else report.keptLocal++;
      if (!iguais) {
        report.conflicts.push({
          id, tipo: "ocorrencia", resolvido: winner,
          versaoA: occurrenceSnapshot(pair.local), versaoB: occurrenceSnapshot(pair.incoming),
          fotosUnificadas: fotosUnidas.length,
        });
      }
    } else if (pair.incoming) { result.push(pair.incoming); report.added++; }
    else { result.push(pair.local); report.keptLocal++; }
  }
  return { occs: result, report };
}
function mergeMontanteItem(localIt, incomingIt, tombA, tombB, report) {
  if (!localIt) return incomingIt;
  if (!incomingIt) return localIt;
  const { occs, report: r } = mergeOccurrenceArrays(localIt.ocorrencias, incomingIt.ocorrencias, tombA, tombB);
  report.added += r.added; report.updated += r.updated; report.deletedByTombstone += r.deletedByTombstone; report.conflicts.push(...r.conflicts);
  const winner = resolveWinner(localIt.updatedAt, incomingIt.updatedAt, localIt, incomingIt);
  const base = winner === "incoming" ? { ...localIt, ...incomingIt } : { ...incomingIt, ...localIt };
  return { ...base, ocorrencias: occs };
}
function mergeMontante(localM, incomingM, tombA, tombB, report) {
  if (!localM) return incomingM;
  if (!incomingM) return localM;
  const winner = resolveWinner(localM.updatedAt, incomingM.updatedAt, localM, incomingM);
  let rootBase = winner === "incoming" ? { ...localM, ...incomingM } : { ...incomingM, ...localM };
  // Fabricante/Tipo-Corte/Observação do montante têm timestamp PRÓPRIO — não competem com
  // "concluí a inspeção visual deste montante" (que só toca m.updatedAt).
  {
    const la = localM.metaUpdatedAt, ia = incomingM.metaUpdatedAt;
    const localTie = { deviceOrigin: localM.metaDeviceOrigin, id: localM.id, updatedAt: la };
    const incomingTie = { deviceOrigin: incomingM.metaDeviceOrigin, id: incomingM.id, updatedAt: ia };
    if ((la || ia) && resolveWinner(la, ia, localTie, incomingTie) === "incoming") {
      rootBase = { ...rootBase, fabricante: incomingM.fabricante, tipoMontante: incomingM.tipoMontante, observacoes: incomingM.observacoes, metaUpdatedAt: ia, metaDeviceOrigin: incomingM.metaDeviceOrigin };
    } else {
      rootBase = { ...rootBase, fabricante: localM.fabricante, tipoMontante: localM.tipoMontante, observacoes: localM.observacoes, metaUpdatedAt: la, metaDeviceOrigin: localM.metaDeviceOrigin };
    }
  }
  const idsSet = new Set([...(localM.itens || []).map((it) => it.id), ...(incomingM.itens || []).map((it) => it.id)]);
  const localById = new Map((localM.itens || []).map((it) => [it.id, it]));
  const incomingById = new Map((incomingM.itens || []).map((it) => [it.id, it]));
  const itens = [...idsSet].map((id) => mergeMontanteItem(localById.get(id), incomingById.get(id), tombA, tombB, report));
  return { ...rootBase, itens };
}
function mergeEstruturaItem(localIt, incomingIt, tombA, tombB, report) {
  return mergeMontanteItem(localIt, incomingIt, tombA, tombB, report);
}
function mergeEstrutura(localE, incomingE, tombA, tombB, report) {
  if (!localE) return incomingE;
  if (!incomingE) return localE;
  let base = { ...localE };
  // Uma vez que a estrutura passou pela tela de criação (em qualquer um dos dois aparelhos), fica assim
  // pra sempre — não existe "des-completar" o setup, então é uma simples soma lógica (OR), comutativa por natureza.
  base.setupComplete = Boolean(localE.setupComplete) || Boolean(incomingE.setupComplete);
  // Cabeçalho (código/setor/tipo/rua/lado/fabricante/observações) tem timestamp PRÓPRIO,
  // separado de visualUpdatedAt — editar o fabricante não deve competir com "fiz uma anomalia visual".
  {
    const la = localE.metaUpdatedAt, ia = incomingE.metaUpdatedAt;
    const localTie = { deviceOrigin: localE.metaDeviceOrigin, id: localE.id, updatedAt: la };
    const incomingTie = { deviceOrigin: incomingE.metaDeviceOrigin, id: incomingE.id, updatedAt: ia };
    if ((la || ia) && resolveWinner(la, ia, localTie, incomingTie) === "incoming") {
      base.metaUpdatedAt = ia; base.metaDeviceOrigin = incomingE.metaDeviceOrigin;
      base.setor = incomingE.setor; base.tipoEstrutura = incomingE.tipoEstrutura; base.rua = incomingE.rua; base.lado = incomingE.lado; base.fabricante = incomingE.fabricante; base.observacoesGerais = incomingE.observacoesGerais; base.codigo = incomingE.codigo;
    }
  }
  {
    const la = localE.resolvidoUpdatedAt, ia = incomingE.resolvidoUpdatedAt;
    const localTie = { deviceOrigin: localE.resolvidoDeviceOrigin, id: localE.id, updatedAt: la };
    const incomingTie = { deviceOrigin: incomingE.resolvidoDeviceOrigin, id: incomingE.id, updatedAt: ia };
    if ((la || ia) && resolveWinner(la, ia, localTie, incomingTie) === "incoming") {
      base.resolvido = incomingE.resolvido; base.resolvidoUpdatedAt = ia; base.resolvidoDeviceOrigin = incomingE.resolvidoDeviceOrigin;
    }
  }
  const stages = ["visual", "prumo", "lux"];
  stages.forEach((stage) => {
    const la = localE[stage + "UpdatedAt"], ia = incomingE[stage + "UpdatedAt"];
    const localTie = { deviceOrigin: localE[stage + "DeviceOrigin"], id: localE.id, updatedAt: la };
    const incomingTie = { deviceOrigin: incomingE[stage + "DeviceOrigin"], id: incomingE.id, updatedAt: ia };
    if ((la || ia) && resolveWinner(la, ia, localTie, incomingTie) === "incoming") {
      base[stage + "UpdatedAt"] = ia; base[stage + "DeviceOrigin"] = incomingE[stage + "DeviceOrigin"];
      if (stage === "visual") { base.visualFinalizada = incomingE.visualFinalizada; base.visualFinalizadaAt = incomingE.visualFinalizadaAt; }
      if (stage === "prumo") { base.prumoFinalizada = incomingE.prumoFinalizada; }
      if (stage === "lux") { base.luxFinalizada = incomingE.luxFinalizada; base.luxFinalizadaAt = incomingE.luxFinalizadaAt; }
    }
  });
  {
    const la = localE.luxNaoAplicaUpdatedAt, ia = incomingE.luxNaoAplicaUpdatedAt;
    const localTie = { deviceOrigin: localE.luxNaoAplicaDeviceOrigin, id: localE.id, updatedAt: la };
    const incomingTie = { deviceOrigin: incomingE.luxNaoAplicaDeviceOrigin, id: incomingE.id, updatedAt: ia };
    if ((la || ia) && resolveWinner(la, ia, localTie, incomingTie) === "incoming") {
      base.luxNaoAplica = incomingE.luxNaoAplica;
      base.luxNaoAplicaUpdatedAt = ia;
      base.luxNaoAplicaDeviceOrigin = incomingE.luxNaoAplicaDeviceOrigin;
    } else if (la || (!ia && localE.luxNaoAplica != null)) {
      base.luxNaoAplica = localE.luxNaoAplica;
      base.luxNaoAplicaUpdatedAt = la;
      base.luxNaoAplicaDeviceOrigin = localE.luxNaoAplicaDeviceOrigin;
    } else if (incomingE.luxNaoAplica != null) {
      base.luxNaoAplica = incomingE.luxNaoAplica;
      base.luxNaoAplicaUpdatedAt = ia;
      base.luxNaoAplicaDeviceOrigin = incomingE.luxNaoAplicaDeviceOrigin;
    }
  }
  const montIdsSet = new Set([...(localE.montantes || []).map((m) => m.id), ...(incomingE.montantes || []).map((m) => m.id)]);
  const localMById = new Map((localE.montantes || []).map((m) => [m.id, m]));
  const incomingMById = new Map((incomingE.montantes || []).map((m) => [m.id, m]));
  base.montantes = [...montIdsSet].filter((id) => {
    const refM = maisRecente(montanteLatestTouch(localMById.get(id)), montanteLatestTouch(incomingMById.get(id)));
    if (isTombstoned(tombA && tombA.montantes, tombB && tombB.montantes, id, refM)) { report.deletedByTombstone++; return false; }
    return true;
  }).map((id) => mergeMontante(localMById.get(id), incomingMById.get(id), tombA, tombB, report)).sort((a, b) => a.numero - b.numero);

  const estItemIdsSet = new Set([...(localE.itensEstrutura || []).map((it) => it.id), ...(incomingE.itensEstrutura || []).map((it) => it.id)]);
  const localEById = new Map((localE.itensEstrutura || []).map((it) => [it.id, it]));
  const incomingEById = new Map((incomingE.itensEstrutura || []).map((it) => [it.id, it]));
  base.itensEstrutura = [...estItemIdsSet].map((id) => mergeEstruturaItem(localEById.get(id), incomingEById.get(id), tombA, tombB, report));
  return base;
}
function detectDuplicateCodigos(estruturas) {
  const byCodigo = {};
  (estruturas || []).forEach((e) => { const c = String(e.codigo || "").trim().toUpperCase(); if (!c) return; (byCodigo[c] = byCodigo[c] || []).push(e.id); });
  return Object.entries(byCodigo).filter(([, ids]) => ids.length > 1).map(([codigo, ids]) => ({ codigo, ids }));
}
function vistoriaLatestMeaningfulTouch(v) {
  if (!v) return null;
  const candidates = [v.metaUpdatedAt, v.finalizadaAt];
  (v.estruturas || []).forEach((e) => candidates.push(estruturaLatestTouch(e)));
  return candidates.filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
}
function mergeVistorias(local, incoming) {
  const tombA = ensureTombstones(local), tombB = ensureTombstones(incoming);
  const report = { added: 0, updated: 0, keptLocal: 0, deletedByTombstone: 0, conflicts: [], estruturasAdicionadas: 0, codigosDuplicados: [] };
  const mergedTombstones = { estruturas: mergeTombstoneMap(tombA.estruturas, tombB.estruturas), montantes: mergeTombstoneMap(tombA.montantes, tombB.montantes), ocorrencias: mergeTombstoneMap(tombA.ocorrencias, tombB.ocorrencias), photos: mergeTombstoneMap(tombA.photos, tombB.photos) };
  const winnerRoot = resolveWinner(local.updatedAt, incoming.updatedAt, local, incoming);
  let rootBase = winnerRoot === "incoming" ? { ...local, ...incoming } : { ...incoming, ...local };
  // Loja/CD, Local, Data, Inspetor têm timestamp PRÓPRIO — não competem com "salvei o Prumo às 15h".
  {
    const la = local.metaUpdatedAt, ia = incoming.metaUpdatedAt;
    const localTie = { deviceOrigin: local.metaDeviceOrigin, id: local.id, updatedAt: la };
    const incomingTie = { deviceOrigin: incoming.metaDeviceOrigin, id: incoming.id, updatedAt: ia };
    if ((la || ia) && resolveWinner(la, ia, localTie, incomingTie) === "incoming") {
      rootBase = { ...rootBase, lojaCd: incoming.lojaCd, local: incoming.local, data: incoming.data, inspetor: incoming.inspetor, metaUpdatedAt: ia, metaDeviceOrigin: incoming.metaDeviceOrigin };
    } else {
      rootBase = { ...rootBase, lojaCd: local.lojaCd, local: local.local, data: local.data, inspetor: local.inspetor, metaUpdatedAt: la, metaDeviceOrigin: local.metaDeviceOrigin };
    }
  }
  {
    const la = local.configUpdatedAt, ia = incoming.configUpdatedAt;
    const localTie = { deviceOrigin: local.configDeviceOrigin, id: local.id, updatedAt: la };
    const incomingTie = { deviceOrigin: incoming.configDeviceOrigin, id: incoming.id, updatedAt: ia };
    if ((la || ia) && resolveWinner(la, ia, localTie, incomingTie) === "incoming") {
      rootBase = { ...rootBase, workflowConfig: incoming.workflowConfig, configUpdatedAt: ia, configDeviceOrigin: incoming.configDeviceOrigin };
    } else if (la || (!ia && local.workflowConfig)) {
      rootBase = { ...rootBase, workflowConfig: local.workflowConfig, configUpdatedAt: la, configDeviceOrigin: local.configDeviceOrigin };
    } else if (incoming.workflowConfig) {
      rootBase = { ...rootBase, workflowConfig: incoming.workflowConfig, configUpdatedAt: ia, configDeviceOrigin: incoming.configDeviceOrigin };
    }
  }
  const idsSet = new Set([...(local.estruturas || []).map((e) => e.id), ...(incoming.estruturas || []).map((e) => e.id)]);
  const localById = new Map((local.estruturas || []).map((e) => [e.id, e]));
  const incomingById = new Map((incoming.estruturas || []).map((e) => [e.id, e]));
  const estruturas = [...idsSet].filter((id) => {
    const refE = maisRecente(estruturaLatestTouch(localById.get(id)), estruturaLatestTouch(incomingById.get(id)));
    if (isTombstoned(tombA.estruturas, tombB.estruturas, id, refE)) { report.deletedByTombstone++; return false; }
    if (!localById.has(id)) report.estruturasAdicionadas++;
    return true;
  }).map((id) => mergeEstrutura(localById.get(id), incomingById.get(id), tombA, tombB, report));
  report.codigosDuplicados = detectDuplicateCodigos(estruturas);

  // "finalizada" tem timestamp próprio — não compete com nenhum salvamento genérico.
  {
    const la = local.finalizadaUpdatedAt, ia = incoming.finalizadaUpdatedAt;
    const localTie = { deviceOrigin: local.finalizadaDeviceOrigin, id: local.id, updatedAt: la };
    const incomingTie = { deviceOrigin: incoming.finalizadaDeviceOrigin, id: incoming.id, updatedAt: ia };
    if ((la || ia) && resolveWinner(la, ia, localTie, incomingTie) === "incoming") {
      rootBase.finalizada = incoming.finalizada; rootBase.finalizadaAt = incoming.finalizadaAt; rootBase.finalizadaUpdatedAt = ia; rootBase.finalizadaDeviceOrigin = incoming.finalizadaDeviceOrigin;
    } else {
      rootBase.finalizada = local.finalizada; rootBase.finalizadaAt = local.finalizadaAt; rootBase.finalizadaUpdatedAt = la; rootBase.finalizadaDeviceOrigin = local.finalizadaDeviceOrigin;
    }
  }
  // Se o resultado consolidado ficou com pendência real (uma estrutura trazida pelo merge que não estava
  // completa, por exemplo), "finalizada=true" deixa de ser verdade — exige nova finalização explícita.
  if (rootBase.finalizada) {
    const vistoriaProvisoria = { ...rootBase, estruturas };
    const pend = countPendingInspection(vistoriaProvisoria);
    if (pend.total > 0) { rootBase.finalizada = false; report.finalizadaRevertidaPorPendencia = true; }
  }

  return { ...rootBase, estruturas, tombstones: mergedTombstones, updatedAt: nowIso(), lastMergeAt: nowIso(), lastMergeReport: report };
}

function compactVistoriaForStorage(v) {
  const { estruturas = [], ...root } = v;
  return {
    ...root,
    storageSchema: 5,
    estruturas: estruturas.map((e) => {
      const { montantes = [], itensEstrutura = [], ...erest } = e;
      const estCompact = itensEstrutura.map((it) => compactStructureItemForStorage(it, Boolean(e.visualFinalizada && it.id !== "iluminacao"))).filter(Boolean);
      return {
        ...erest,
        itensEstrutura: estCompact,
        montantes: montantes.map((m) => {
          const { itens = [], ...mrest } = m;
          const itemCompact = itens.map((it) => compactRuntimeItemForStorage(it, Boolean(m.visualInspecionadoAt && it.id !== "prumo" && it.id !== "lux"))).filter(Boolean);
          return { ...mrest, itens: itemCompact };
        })
      };
    })
  };
}
function syncVistoriaListEntry(target) {
  const idx = state.vistorias.findIndex((v) => v.id === target.id);
  if (idx >= 0) state.vistorias[idx] = target;
  else state.vistorias.push(target);
  state.vistorias.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/* ---------------- Verificação de Integridade de Evidências v2.18 ---------------- */
async function checkPhotoIntegrity(vistorias) {
  const allPhotos = await idbGetAll("photos");
  const photoMap = new Map(allPhotos.map((p) => [p.id, p]));
  const missing = [];
  const valid = [];
  const pendingMigration = [];
  const referencedIds = new Set(); // v2.19.1: acumula todo photoId realmente referenciado por alguma ocorrência viva, pra detecção reversa (Blob->referência) logo abaixo.

  const checkRefs = (oc, vId, context) => {
    for (const pid of occurrencePhotoRefs(oc)) {
      if (typeof pid === "string" && pid.startsWith("data:image")) {
        // Foto legada (< v2.18), ainda em base64 embutido — não é corrupção, mas a migração pra
        // Blob/photoId ainda não terminou pra esta ocorrência. Antes, isto era simplesmente ignorado
        // aqui (nem "válido" nem "ausente"), o que fazia o checador reportar "100% íntegro" de forma
        // enganosa logo após um Restaurar de backup antigo, mesmo com fotos ainda não migradas.
        pendingMigration.push({ vistoriaId: vId, occurrenceId: oc.id, context });
        continue;
      }
      if (pid && pid.startsWith("pho_")) {
        referencedIds.add(pid);
        const rec = photoMap.get(pid);
        const hasValidBlob = rec && rec.blob && (rec.blob.size > 0 || (rec.blob.byteLength && rec.blob.byteLength > 0));
        if (hasValidBlob) {
          valid.push(pid);
        } else {
          missing.push({
            vistoriaId: vId,
            occurrenceId: oc.id,
            photoId: pid,
            context,
            reason: !rec ? "Registro não encontrado no store photos" : "Blob nulo ou de tamanho 0"
          });
        }
      }
    }
  };

  for (const v of vistorias) {
    for (const e of (v.estruturas || [])) {
      for (const it of (e.itensEstrutura || [])) {
        for (const oc of (it.ocorrencias || [])) {
          checkRefs(oc, v.id, `Estrutura ${e.codigo || "—"}`);
        }
      }
      for (const m of (e.montantes || [])) {
        for (const it of (m.itens || [])) {
          for (const oc of (it.ocorrencias || [])) {
            checkRefs(oc, v.id, `Estrutura ${e.codigo || "—"} · M${m.numero}`);
          }
        }
      }
    }
  }

  // v2.19.1 — detecção reversa (Blob -> referência): um Blob ativo no store "photos" que NENHUMA
  // ocorrência viva referencia é uma foto órfã (ex: rascunho de anomalia interrompido antes de
  // "Salvar anomalia" — ver draftOccurrenceRecovery). Só chega aqui com segurança porque todo call
  // site real desta função sempre passa o conjunto COMPLETO de vistorias (idbGetAll("vistorias")) —
  // uma chamada com um subconjunto geraria falso positivo aqui.
  // Propositalmente ADITIVO: não apaga nada (sem GC automático nesta fase) e NÃO altera isClean —
  // isClean continua significando estritamente "sem evidência referenciada ausente/corrompida"
  // (o que de fato bloqueia downloadZipBackup); uma foto órfã é dado extra não referenciado, não
  // evidência perdida, então não faz sentido bloquear backup por causa dela.
  const orphaned = [];
  for (const rec of allPhotos) {
    if (!referencedIds.has(rec.id)) {
      orphaned.push({ photoId: rec.id, vistoriaId: rec.vistoriaId, occurrenceId: rec.occurrenceId });
    }
  }

  return { totalValid: valid.length, missing, pendingMigration, orphaned, isClean: missing.length === 0 };
}

/* ---------------- IndexedDB v4 ---------------- */
const DB_VERSION = 4;
let dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open("inspecaoPP", DB_VERSION);
  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("config")) db.createObjectStore("config");
    if (!db.objectStoreNames.contains("vistorias")) db.createObjectStore("vistorias", { keyPath: "id" });
    if (!db.objectStoreNames.contains("parts")) db.createObjectStore("parts");
    if (!db.objectStoreNames.contains("photos")) {
      const pStore = db.createObjectStore("photos", { keyPath: "id" });
      pStore.createIndex("by_vistoriaId", "vistoriaId", { unique: false });
      pStore.createIndex("by_occurrenceId", "occurrenceId", { unique: false });
      pStore.createIndex("by_updatedAt", "updatedAt", { unique: false });
    }
    // photoThumbs é exclusivamente cache derivável: não participa de merge/backup/tombstones
    if (!db.objectStoreNames.contains("photoThumbs")) {
      db.createObjectStore("photoThumbs", { keyPath: "id" });
    }
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
// Grava vários registros numa ÚNICA transação do IndexedDB: ou tudo é gravado, ou nada é
// (se qualquer put() falhar, a transação inteira é abortada automaticamente pelo navegador).
// items: [{ store, key, value }] — key pode ser undefined quando o store tem keyPath.
// toDelete: [{ store, key }] — excluídos na mesma transação.
async function idbTransactionApply(items, toDelete = []) {
  const db = await dbPromise;
  const stores = [...new Set([...items.map((i) => i.store), ...toDelete.map((i) => i.store)])];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, "readwrite");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transação abortada"));
    items.forEach(({ store, key, value }) => { const os = tx.objectStore(store); key === undefined ? os.put(value) : os.put(value, key); });
    toDelete.forEach(({ store, key }) => tx.objectStore(store).delete(key));
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
async function getDeletedVistoriaIds() {
  return (await idbGet("config", "deletedVistorias")) || {};
}
async function deleteVistoriaCompletamente(id) {
  const map = await getDeletedVistoriaIds();
  map[id] = { deletedAt: nowIso(), deviceOrigin: getDeviceId() };
  if (state.draftVistoria && state.draftVistoria.id === id) state.draftVistoria = null;
  const allPhotos = await idbGetAll("photos");
  const photosToDelete = allPhotos.filter((p) => p.vistoriaId === id).map((p) => ({ store: "photos", key: p.id }));
  await idbTransactionApply(
    [{ store: "config", key: "deletedVistorias", value: map }],
    [{ store: "vistorias", key: id }, ...photosToDelete]
  );
  await persistVistoriaList();
}
async function idbGetAll(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/* ---------------- Migração Determinística e Retomável v2.17.6 -> v2.18 ---------------- */
async function migrateLegacyBase64ToPhotos() {
  try {
    const vistorias = await idbGetAll("vistorias");
    for (const v of vistorias) {
      let vistoriaChanged = false;
      const photosToPut = [];
      const photoValidations = [];
      
      const checkOccurrence = async (oc) => {
        if (!oc) return;
        // T15: formato ainda mais antigo (pré-v2.14) — oc.foto (singular), sem oc.fotos (array) nenhum.
        // Antes, a guarda abaixo (`!Array.isArray(oc.fotos)`) descartava a ocorrência inteira sem processar
        // nada: a foto ficava presa em oc.foto pra sempre, nunca migrava, mesmo rodando de novo em todo boot.
        // checkPhotoIntegrity() já reconhecia esse formato (via occurrencePhotoRefs), mas a migração não —
        // agora os dois enxergam a mesma coisa.
        if (!Array.isArray(oc.fotos) && typeof oc.foto === "string" && oc.foto.startsWith("data:image")) {
          try {
            const photoId = await deterministicPhotoIdFromBase64(oc.foto, oc.id, 0);
            const blob = base64ToBlob(oc.foto);
            // T14: base64 sintaticamente válida mas vazia ("data:image/jpeg;base64,") decodifica sem erro
            // e gera Blob de tamanho 0 — sem esta checagem, isso virava um "photoId" fantasma apontando
            // pra um Blob vazio no store, sem nunca aparecer como pendingMigration.
            if (!blob || blob.size <= 0) throw new Error("Blob legado vazio (base64 sintaticamente válida, sem conteúdo)");
            const record = {
              id: photoId, vistoriaId: v.id, occurrenceId: oc.id, blob, mimeType: "image/jpeg", size: blob.size,
              createdAt: oc.updatedAt || v.createdAt || nowIso(), deviceOrigin: oc.deviceOrigin || v.deviceOrigin || getDeviceId(),
              updatedAt: oc.updatedAt || nowIso(), deletedAt: null
            };
            photosToPut.push({ store: "photos", key: undefined, value: record });
            photoValidations.push({ photoId, expectedSize: blob.size, oc, idx: null, singular: true });
            vistoriaChanged = true;
          } catch (err) {
            console.error(`Aviso: falha ao migrar foto legada (formato singular pré-v2.14) da ocorrência ${oc.id} — mantida como está:`, err);
          }
          return;
        }
        if (!Array.isArray(oc.fotos)) return;
        for (let idx = 0; idx < oc.fotos.length; idx++) {
          const foto = oc.fotos[idx];
          if (typeof foto === "string" && foto.startsWith("data:image")) {
            // Isola erro POR FOTO — uma base64 corrompida não pode abortar a migração das demais fotos
            // desta ocorrência, de outras ocorrências, ou de outras vistorias no mesmo ciclo. A foto que
            // falhar aqui simplesmente permanece em base64 (fica visível como "pendingMigration" em
            // checkPhotoIntegrity), sem travar o resto do lote.
            try {
              const photoId = await deterministicPhotoIdFromBase64(foto, oc.id, idx);
              const blob = base64ToBlob(foto);
              // T14: ver comentário equivalente acima.
              if (!blob || blob.size <= 0) throw new Error("Blob legado vazio (base64 sintaticamente válida, sem conteúdo)");
              const record = {
                id: photoId,
                vistoriaId: v.id,
                occurrenceId: oc.id,
                blob: blob,
                mimeType: "image/jpeg",
                size: blob.size,
                createdAt: oc.updatedAt || v.createdAt || nowIso(),
                deviceOrigin: oc.deviceOrigin || v.deviceOrigin || getDeviceId(),
                updatedAt: oc.updatedAt || nowIso(),
                deletedAt: null
              };
              photosToPut.push({ store: "photos", key: undefined, value: record });
              photoValidations.push({ photoId, expectedSize: blob.size, oc, idx });
              vistoriaChanged = true;
            } catch (err) {
              console.error(`Aviso: falha ao migrar 1 foto da ocorrência ${oc.id} (base64 corrompida) — mantida como está, demais fotos seguem normalmente:`, err);
            }
          }
        }
      };

      for (const e of (v.estruturas || [])) {
        for (const it of (e.itensEstrutura || [])) {
          for (const oc of (it.ocorrencias || [])) {
            await checkOccurrence(oc);
          }
        }
        for (const m of (e.montantes || [])) {
          for (const it of (m.itens || [])) {
            for (const oc of (it.ocorrencias || [])) {
              await checkOccurrence(oc);
            }
          }
        }
      }

      if (vistoriaChanged && photosToPut.length) {
        // 1. Grava os Blobs no store photos
        await idbTransactionApply(photosToPut);
        // 2. Valida a leitura de cada Blob gravado
        let allValid = true;
        for (const val of photoValidations) {
          const readBack = await idbGet("photos", val.photoId);
          if (!readBack || !readBack.blob || readBack.blob.size !== val.expectedSize) {
            allValid = false;
            break;
          }
        }
        // 3. Atualiza a vistoria somente após validação 100%
        if (allValid) {
          for (const val of photoValidations) {
            if (val.singular) { val.oc.fotos = [val.photoId]; delete val.oc.foto; }
            else val.oc.fotos[val.idx] = val.photoId;
          }
          await idbSet("vistorias", undefined, compactVistoriaForStorage(v));
        }
      }
    }
  } catch (err) {
    console.error("Aviso na migração de fotos:", err);
  }
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
  itemDetailReturn: null,
  draftOccurrence: null,
  draftVistoria: null,
  saveTimer: null,
};

async function boot() {
  await ensureDeviceId();
  await migrateLegacyBase64ToPhotos();
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (err) { /* segue mesmo se o navegador não suportar */ }
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
  installKeyboardUX();
  window.addEventListener("online", updateOfflineBanner);
  window.addEventListener("offline", updateOfflineBanner);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && state.draftVistoria) {
      clearTimeout(state.saveTimer);
      saveVistoriaObject(state.draftVistoria).catch(() => {});
    }
  });
  window.addEventListener("pagehide", () => {
    if (state.draftVistoria) { clearTimeout(state.saveTimer); saveVistoriaObject(state.draftVistoria).catch(() => {}); }
  });
}
function updateOfflineBanner() {
  const b = document.getElementById("offline-banner");
  if (b) b.classList.toggle("show", !navigator.onLine);
}
async function persistVistoriaList() {
  state.vistorias = (await idbGetAll("vistorias")).map(normalizeVistoria).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function go(screen, vistoriaId = null, estruturaId = null, montanteId = null, estItemId = null, checklistItemId = null) {
  if (screen !== "newAnomaly") state.draftOccurrence = null;
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
    montante: montAtual ? "Inspeção visual · Montante " + montAtual.numero : "Inspeção visual",
    prumo: montAtual ? "Prumo · Montante " + montAtual.numero : "Prumo",
    lux: "Iluminação / Lux",
    newAnomaly: "Nova anomalia",
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
    prumo: () => go("estrutura", state.draftVistoria.id, state.activeEstruturaId),
    lux: () => go("estrutura", state.draftVistoria.id, state.activeEstruturaId),
    newAnomaly: () => cancelDraftAnomaly(),
    itemDetail: () => state.itemDetailReturn === "prumo" ? go("prumo", state.draftVistoria.id, state.activeEstruturaId, state.activeMontanteId) : go("montante", state.draftVistoria.id, state.activeEstruturaId, state.activeMontanteId),
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
  if (state.screen === "prumo") body.appendChild(PrumoScreen());
  if (state.screen === "lux") body.appendChild(LuxScreen());
  if (state.screen === "newAnomaly") body.appendChild(NewAnomalyScreen());
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
  const fieldScreens = ["montante", "prumo", "lux", "newAnomaly", "itemDetail"];
  if (!fieldScreens.includes(state.screen)) app.appendChild(BottomNav());
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
    const active = id === state.screen || (id === "vistoria" && ["estrutura", "montante", "prumo", "lux", "newAnomaly", "estItem", "itemDetail"].includes(state.screen)) || (id === "history" && ["hub", "report", "partsInspection", "anomalias", "painel"].includes(state.screen));
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
  const actualType = type || "text";
  const attrs = { class: "input", value: value || "", placeholder: placeholder || "", type: actualType };
  if (actualType === "number") { attrs.inputmode = "decimal"; attrs.enterkeyhint = "done"; }
  const input = el("input", attrs);
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
        input.blur();
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


function uniqueOptions(values) {
  return [...new Set((values || []).filter(Boolean).map((x) => String(x).trim()).filter(Boolean))];
}
function choiceOrCustomField(label, value, options, onChange, customPlaceholder = "Digite aqui") {
  const box = el("div", { class: "field smart-choice-field" });
  box.appendChild(el("label", {}, label));
  const opts = uniqueOptions(options);
  const customKey = "__custom__";
  const select = el("select", { class: "input smart-select" });
  select.appendChild(el("option", { value: "" }, "Selecione…"));
  opts.forEach((o) => select.appendChild(el("option", { value: o }, o)));
  select.appendChild(el("option", { value: customKey }, "Outro / digitar…"));
  const custom = el("input", { class: "input smart-custom-input", value: "", placeholder: customPlaceholder, autocomplete: "off" });
  custom.style.display = "none";
  const current = String(value || "");
  if (current && opts.includes(current)) select.value = current;
  else if (current) { select.value = customKey; custom.value = current; custom.style.display = "block"; }
  const openCustom = (focus = false) => {
    const customMode = select.value === customKey;
    custom.style.display = customMode ? "block" : "none";
    if (customMode && focus) setTimeout(() => custom.focus(), 40);
  };
  select.addEventListener("change", () => {
    if (select.value === customKey) { openCustom(true); onChange(custom.value || ""); }
    else { custom.style.display = "none"; onChange(select.value); }
  });
  custom.addEventListener("input", () => onChange(custom.value));
  box.appendChild(select); box.appendChild(custom);
  return box;
}
function installKeyboardUX() {
  if (document.documentElement.dataset.keyboardUx === "1") return;
  document.documentElement.dataset.keyboardUx = "1";
  document.addEventListener("focusin", (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
    setTimeout(() => { try { t.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {} }, 260);
  });
  document.addEventListener("keydown", (ev) => {
    const t = ev.target;
    if (ev.key !== "Enter" || !(t instanceof HTMLInputElement) || t.type === "date") return;
    if (!t.closest(".structure-setup-card")) return;
    const fields = [...t.closest(".structure-setup-card").querySelectorAll("input:not([type=hidden]):not([disabled]), select:not([disabled])")]
      .filter((x) => x.offsetParent !== null);
    const i = fields.indexOf(t);
    if (i >= 0 && i < fields.length - 1) { ev.preventDefault(); fields[i + 1].focus(); }
    else { t.blur(); }
  });
  if (window.visualViewport) {
    let baselineHeight = Math.max(window.innerHeight, window.visualViewport.height);
    const syncKeyboard = () => {
      const h = window.visualViewport.height;
      if (h > baselineHeight * 0.92) baselineHeight = Math.max(baselineHeight, h);
      const open = h < baselineHeight * 0.74;
      document.body.classList.toggle("keyboard-open", open);
    };
    window.visualViewport.addEventListener("resize", syncKeyboard);
    window.visualViewport.addEventListener("scroll", syncKeyboard);
    window.addEventListener("orientationchange", () => setTimeout(() => { baselineHeight = Math.max(window.innerHeight, window.visualViewport.height); syncKeyboard(); }, 350));
    syncKeyboard();
  }
}
function startFirstVisualMontante(v, e) {
  let m = (e.montantes || []).slice().sort((a,b)=>a.numero-b.numero).find((x)=>!visualMontanteDone(x,e));
  if (!m) { const ordered=(e.montantes||[]).slice().sort((a,b)=>a.numero-b.numero); m=ordered.length?ordered[ordered.length-1]:addNextMontante(e); }
  setResume(v, "visual", e, m);
  return m;
}


// v2.19.1 — restaura um rascunho de anomalia interrompido, se existir, ao (re)carregar a vistoria.
// NUNCA vira anomalia oficial sozinho — só reabre a MESMA tela (NewAnomalyScreen) com os dados e fotos
// já preenchidos, pro técnico revisar e decidir (Salvar anomalia ou Cancelar). Retorna true se restaurou.
function restoreDraftOccurrenceIfAny(v) {
  const rec = v && v.draftOccurrenceRecovery;
  if (!rec) return false;
  const e = (v.estruturas || []).find((x) => x.id === rec.estruturaId);
  if (!e) { delete v.draftOccurrenceRecovery; return false; } // estrutura sumiu (ex: excluída em outro aparelho) -- descarta com segurança, sem tentar restaurar
  const m = rec.montanteId ? (e.montantes || []).find((x) => x.id === rec.montanteId) : null;
  state.draftOccurrence = { level: rec.level, itemId: rec.itemId, occurrence: rec.occurrence };
  state.screen = "newAnomaly";
  state.activeVistoriaId = v.id;
  state.activeEstruturaId = e.id;
  state.activeMontanteId = m ? m.id : null;
  state.activeEstItemId = rec.level === "estrutura" ? rec.itemId : null;
  state.activeChecklistItemId = rec.level === "montante" ? rec.itemId : null;
  return true;
}
async function resumeVistoria(v) {
  const loaded = await idbGet("vistorias", v.id);
  state.draftVistoria = normalizeVistoria(loaded || v);
  if (restoreDraftOccurrenceIfAny(state.draftVistoria)) { render(); return; }
  const r = state.draftVistoria.resume;
  if (!r || !r.estruturaId) return go("vistoria", v.id);
  const e = (state.draftVistoria.estruturas || []).find((x)=>x.id===r.estruturaId);
  if (!e) return go("vistoria", v.id);
  if (r.mode === "visual") {
    let m=(e.montantes||[]).find((x)=>x.id===r.montanteId);
    if (!m) m=(e.montantes||[]).slice().sort((a,b)=>a.numero-b.numero).find((x)=>!visualMontanteDone(x,e));
    if (!m && !e.visualFinalizada) m=addNextMontante(e);
    if (m) { await saveVistoriaNow(); return go("montante",v.id,e.id,m.id); }
  }
  if (r.mode === "prumo") {
    if (!podeEntrarNoPrumo(state.draftVistoria)) {
      delete state.draftVistoria.resume;
      await saveVistoriaNow();
      return go("vistoria", v.id);
    }
    let m=(e.montantes||[]).find((x)=>x.id===r.montanteId) || (e.montantes||[]).find((x)=>!prumoDone(x));
    if (m) return go("prumo",v.id,e.id,m.id);
  }
  if (r.mode === "lux") return go("lux",v.id,e.id);
  go("estrutura",v.id,e.id);
}
function ResumeCard(v) {
  const r=v.resume || {};
  if (r.mode === "prumo" && !podeEntrarNoPrumo(v)) return null;
  const e=(v.estruturas||[]).find((x)=>x.id===r.estruturaId);
  if (!e) return null;
  const m=(e.montantes||[]).find((x)=>x.id===r.montanteId);
  const labels={visual:"Inspeção visual",prumo:"Prumo",lux:"Iluminação / Lux"};
  const card=Card({class:"resume-card",style:"margin-bottom:14px"});
  card.appendChild(el("div",{class:"resume-kicker"},"CONTINUAR DE ONDE PAROU"));
  card.appendChild(el("div",{class:"resume-title"},v.lojaCd||"Inspeção em andamento"));
  card.appendChild(el("div",{class:"resume-sub"},[labels[r.mode]||"Inspeção",`Estrutura ${e.codigo||"—"}`,m&&`Montante ${m.numero}`].filter(Boolean).join(" · ")));
  const b=el("button",{class:"field-primary-btn"},"▶ Continuar"); b.addEventListener("click",()=>resumeVistoria(v)); card.appendChild(b);
  return card;
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

  const quotaWrap = el("div", { id: "storage-warning-wrap", style: "display:none;margin-bottom:14px" });
  wrap.appendChild(quotaWrap);
  checkStorageQuota().then((res) => {
    if (res && res.isWarning) {
      quotaWrap.style.display = "block";
      quotaWrap.replaceChildren(
        el("div", { class: "card", style: "background:#FFFBEB;border:1px solid #FCD34D;color:#92400E;padding:10px 14px;font-size:12.5px;line-height:1.4;display:flex;align-items:center;gap:10px" },
          el("span", { html: svg("alert", 20, "color:#B45309;flex-shrink:0") }),
          el("div", {},
            el("div", { style: "font-weight:700" }, "Atenção: Quota de armazenamento concedida elevada"),
            el("div", {}, res.message, " Recomendamos exportar backups para manter o navegador seguro.")
          )
        )
      );
    }
  });

  const latestResume = rascunhos.find((v)=>v.resume && v.resume.estruturaId);
  if (latestResume) { const rc=ResumeCard(latestResume); if(rc) wrap.appendChild(rc); }

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
              await deleteVistoriaCompletamente(v.id);
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
  return {
    id: uid(),
    lojaCd: "",
    local: "",
    data: todayStr(),
    inspetor: "",
    createdAt: new Date().toISOString(),
    finalizada: false,
    estruturas: [],
    workflowConfig: {
      prumoHabilitado: null,
      prumoMotivo: "",
      luxHabilitado: null,
      luxMotivo: "",
      luxMetodo: null
    },
    configUpdatedAt: nowIso(),
    configDeviceOrigin: getDeviceId()
  };
}
function newOcorrencia(status = "problema") {
  return { id: uid(), status, montanteRef: "", descTxt: "", tipoTxt: "", localTxt: "", grauTxt: "", corte: "", qtd: 1, correcao: "", obs: "", fotos: [], valor: "" };
}
function newEstruturaItemRuntime(base) {
  return { ...base, revisado: false, ocorrencias: [] };
}
function suggestNextStructureCode(previous = null) {
  const code = previous && String(previous.codigo || "").trim();
  if (!code) return "";
  const m = code.match(/^(.*?)(\d+)([^\d]*)$/);
  if (!m) return "";
  const next = String(Number(m[2]) + 1).padStart(m[2].length, "0");
  return `${m[1]}${next}${m[3]}`;
}
function newEstruturaSkeleton(previous = null) {
  return {
    id: uid(), codigo: suggestNextStructureCode(previous), setupComplete: false,
    setor: previous ? previous.setor || "" : "", tipoEstrutura: previous ? previous.tipoEstrutura || "" : "",
    rua: previous ? previous.rua || "" : "", lado: previous ? previous.lado || "" : "", modulos: "",
    fabricante: previous ? previous.fabricante || "" : "", observacoesGerais: "", finalizada: false, visualFinalizada: false, prumoFinalizada: false, luxFinalizada: false, resolvido: false,
    luxNaoAplica: false,
    montantes: [], itensEstrutura: itensEstruturaCatalogo(state.config).map(newEstruturaItemRuntime),
  };
}
function newMontanteSkeleton(numero, estrutura = null, previous = null) {
  return {
    id: uid(), numero,
    fabricante: previous ? previous.fabricante || "" : (estrutura ? estrutura.fabricante || "" : ""),
    tipoMontante: previous ? previous.tipoMontante || "" : "",
    observacoes: "",
    itens: itensMontante(state.config).map((it) => ({ ...it, status: "pendente", revisado: false, ocorrencias: [], valor: "", qtd: 1, correcao: "" }))
  };
}
function addNextMontante(e) {
  e.montantes = e.montantes || [];
  const orderedExisting = e.montantes.slice().sort((a,b) => a.numero - b.numero);
  const previous = orderedExisting.length ? orderedExisting[orderedExisting.length - 1] : null;
  const numero = previous ? previous.numero + 1 : 1;
  const m = newMontanteSkeleton(numero, e, previous);
  e.montantes.push(m);
  return m;
}
function completeMontanteAsInspected(m, e = null) {
  // Compatibilidade interna: a partir da v2.16, “inspecionado” nesta etapa significa somente inspeção visual.
  completeMontanteVisualAsInspected(m, e);
}
function montanteHasActivity(m) {
  return Boolean((m.tipoMontante || "").trim() || (m.observacoes || "").trim() || (m.itens || []).some((it) => montanteItemStatus(it) !== "pendente" || (it.ocorrencias || []).length));
}
function syncMontantes(e) {
  // Compatibilidade: a quantidade passou a ser apenas estimativa. Se o usuário optar por pré-gerar,
  // esta função ainda cria montantes faltantes, mas nunca remove montantes já inspecionados.
  const target = parseInt(e.modulos, 10) || 0;
  e.montantes = e.montantes || [];
  while (e.montantes.length < target) addNextMontante(e);
}
function estruturaEstItemStatus(it) {
  const statuses = (it.ocorrencias || []).map((oc) => ocorrenciaStatus(oc, it));
  if (statuses.includes("problema")) return "problema";
  if (statuses.includes("pendente")) return "pendente";
  if (statuses.length && statuses.every((x) => x === "ok" || x === "naoaplica")) return "ok";
  if (it.revisado) return "ok";
  return "pendente";
}
function estruturaItensFlat(e) {
  const montanteItens = (e.montantes || []).flatMap((m) => (m.itens || []).filter((it) => itemAplicavel(it, e)).map((it) => ({ status: montanteItemStatus(it) })));
  const estItens = (e.itensEstrutura || []).map((it) => ({ status: estruturaEstItemStatus(it) }));
  return montanteItens.concat(estItens);
}
function estruturaStatus(e) {
  const all = estruturaItensFlat(e);
  return all.length ? overallStatus(all) : "pendente";
}
async function ensureVistoria(id) {
  if (id) {
    const existing = await idbGet("vistorias", id);
    if (existing) { state.draftVistoria = normalizeVistoria(existing); restoreDraftOccurrenceIfAny(state.draftVistoria); return; }
  }
  if (state.draftVistoria && !state.draftVistoria.finalizada && !id) return;
  state.draftVistoria = newVistoriaSkeleton();
  await idbSet("vistorias", undefined, compactVistoriaForStorage(state.draftVistoria));
  syncVistoriaListEntry(state.draftVistoria);
}
async function saveVistoriaObject(target) {
  if (!target) return;
  try {
    target.updatedAt = nowIso();
    target.deviceOrigin = target.deviceOrigin || getDeviceId();
    normalizeVistoria(target);
    await idbSet("vistorias", undefined, compactVistoriaForStorage(target));
    // Não relê todo o IndexedDB a cada toque. Mantém a lista em memória sincronizada.
    syncVistoriaListEntry(target);
    updateSaveIndicator();
  } catch (err) {
    showSaveError(err);
    throw err;
  }
}
function saveVistoriaNow() { return saveVistoriaObject(state.draftVistoria); }
function saveVistoriaDebounced() {
  clearTimeout(state.saveTimer);
  showSaving();
  const target = state.draftVistoria;
  state.saveTimer = setTimeout(() => saveVistoriaObject(target).catch(() => {}), 400);
}
function showSaving() { const ind = document.getElementById("save-indicator"); if (ind) { ind.textContent = "Salvando no aparelho…"; ind.classList.remove("save-error"); } }
function updateSaveIndicator() { const ind = document.getElementById("save-indicator"); if (ind) { ind.textContent = "✓ Salvo no aparelho"; ind.classList.remove("save-error"); } }
function showSaveError(err) {
  const ind = document.getElementById("save-indicator");
  if (ind) { ind.textContent = "⚠ Não foi possível salvar — verifique o armazenamento"; ind.classList.add("save-error"); }
  console.error("Falha ao salvar inspeção", err);
}

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
      const frag = suggestInput(v.lojaCd, (val) => { v.lojaCd = val; touchMeta(v); saveVistoriaDebounced(); }, "Digite o nome da Loja / CD", state.config.locais);
      const input = frag.querySelector("input");
      input.addEventListener("blur", () => {
        const val = input.value.trim();
        if (val && !state.config.locais.includes(val)) { state.config.locais.push(val); idbSet("config", "main", state.config); }
      });
      return frag;
    })()));
  header.appendChild(Field("Local (cidade/UF)", inputEl(v.local, (val) => { v.local = val; touchMeta(v); saveVistoriaDebounced(); }, "Ex: Osasco - SP")));
  header.appendChild(el("div", { class: "row2" },
    Field("Data", inputEl(v.data, (val) => { v.data = val; touchMeta(v); saveVistoriaDebounced(); }, "", "date")),
    Field("Inspetor(es)", inputEl(v.inspetor, (val) => { v.inspetor = val; touchMeta(v); saveVistoriaDebounced(); }, "Nome(s)"))));
  header.appendChild(el("div", { id: "save-indicator", class: "save-indicator" }, "✓ Salvo no aparelho"));
  inner.appendChild(header);

  // Workflow Config Card (quando v.workflowConfig está presente)
  if (v.workflowConfig) {
    const wfCard = Card({ class: "workflow-config-card", style: "margin-bottom:14px;border-left:4px solid var(--primary);padding:14px" });
    const head = el("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:12px" },
      el("div", {},
        el("div", { class: "overview-kicker", style: "color:var(--primary);font-weight:700" }, "CAMPANHAS DA INSPEÇÃO"),
        el("div", { style: "font-size:15px;font-weight:700" }, "Definição de Escopo de Trabalho")
      )
    );
    wfCard.appendChild(head);

    // 1. Visual
    const visRow = el("div", { style: "display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light, #eee)" },
      el("div", {}, el("strong", {}, "1 · Inspeção Visual"), el("div", { style: "font-size:12px;color:var(--ink-soft)" }, "Checklist geral de estruturas e montantes")),
      Tag("ok", "sm", "Obrigatória")
    );
    wfCard.appendChild(visRow);

    // 2. Prumo
    const prumoSection = el("div", { style: "padding:10px 0;border-bottom:1px solid var(--border-light, #eee)" });
    const prumoTop = el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px" },
      el("div", {}, el("strong", {}, "2 · Prumo a Laser"), el("div", { style: "font-size:12px;color:var(--ink-soft)" }, "Desvios longitudinal e transversal")),
      el("div", { style: "display:flex;gap:6px" },
        (() => {
          const btnSim = el("button", { class: `ghost-btn touch-btn ${v.workflowConfig.prumoHabilitado === true ? "active-choice" : ""}`, style: v.workflowConfig.prumoHabilitado === true ? "background:var(--primary);color:#fff;font-weight:700" : "" }, "Realizar");
          btnSim.addEventListener("click", async () => {
            v.workflowConfig.prumoHabilitado = true;
            touchWorkflowConfig(v);
            await saveVistoriaNow();
            render();
          });
          const btnNao = el("button", { class: `ghost-btn touch-btn ${v.workflowConfig.prumoHabilitado === false ? "active-choice" : ""}`, style: v.workflowConfig.prumoHabilitado === false ? "background:var(--amber, #d97706);color:#fff;font-weight:700" : "" }, "Não realizar");
          btnNao.addEventListener("click", async () => {
            v.workflowConfig.prumoHabilitado = false;
            if (v.resume && v.resume.mode === "prumo") {
              delete v.resume;
            }
            touchWorkflowConfig(v);
            await saveVistoriaNow();
            render();
          });
          return el("div", { style: "display:flex;gap:4px" }, btnSim, btnNao);
        })()
      )
    );
    prumoSection.appendChild(prumoTop);
    if (v.workflowConfig.prumoHabilitado === false) {
      const mot = inputEl(v.workflowConfig.prumoMotivo || "", (val) => {
        v.workflowConfig.prumoMotivo = val;
        touchWorkflowConfig(v);
        saveVistoriaDebounced();
      }, "Ex: Fora de escopo contratual / sem autorização para laser");
      prumoSection.appendChild(el("div", { style: "margin-top:8px" }, Field("Motivo para não realizar o Prumo (obrigatório)", mot)));
    }
    wfCard.appendChild(prumoSection);

    // 3. Lux
    const luxSection = el("div", { style: "padding:10px 0" });
    const luxTop = el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px" },
      el("div", {}, el("strong", {}, "3 · Iluminação / Lux"), el("div", { style: "font-size:12px;color:var(--ink-soft)" }, "Nível de iluminamento nos corredores")),
      el("div", { style: "display:flex;gap:6px" },
        (() => {
          const btnSim = el("button", { class: `ghost-btn touch-btn ${v.workflowConfig.luxHabilitado === true ? "active-choice" : ""}`, style: v.workflowConfig.luxHabilitado === true ? "background:var(--primary);color:#fff;font-weight:700" : "" }, "Realizar");
          btnSim.addEventListener("click", async () => {
            v.workflowConfig.luxHabilitado = true;
            touchWorkflowConfig(v);
            await saveVistoriaNow();
            render();
          });
          const btnNao = el("button", { class: `ghost-btn touch-btn ${v.workflowConfig.luxHabilitado === false ? "active-choice" : ""}`, style: v.workflowConfig.luxHabilitado === false ? "background:var(--amber, #d97706);color:#fff;font-weight:700" : "" }, "Não realizar");
          btnNao.addEventListener("click", async () => {
            v.workflowConfig.luxHabilitado = false;
            touchWorkflowConfig(v);
            await saveVistoriaNow();
            render();
          });
          return el("div", { style: "display:flex;gap:4px" }, btnSim, btnNao);
        })()
      )
    );
    luxSection.appendChild(luxTop);

    if (v.workflowConfig.luxHabilitado === false) {
      const mot = inputEl(v.workflowConfig.luxMotivo || "", (val) => {
        v.workflowConfig.luxMotivo = val;
        touchWorkflowConfig(v);
        saveVistoriaDebounced();
      }, "Ex: Galpão sem iluminação / avaliação dispensada pelo cliente");
      luxSection.appendChild(el("div", { style: "margin-top:8px" }, Field("Motivo para não realizar a Iluminação (obrigatório)", mot)));
    } else if (v.workflowConfig.luxHabilitado === true) {
      const temDados = luxTemDados(v);
      const selMetodo = el("div", { style: "margin-top:10px;background:var(--bg-subtle, #f5f7fa);padding:10px;border-radius:6px" });
      selMetodo.appendChild(el("div", { style: "font-size:12.5px;font-weight:700;margin-bottom:6px" }, "Método de Aferição de Lux:"));

      const radA = el("button", { class: `ghost-btn touch-btn ${v.workflowConfig.luxMetodo === "A" ? "active-choice" : ""}`, style: `margin-right:6px;margin-bottom:6px;${v.workflowConfig.luxMetodo === "A" ? "background:var(--primary);color:#fff;font-weight:700" : ""}` }, "Método A (Início, Meio e Final)");
      radA.disabled = temDados && v.workflowConfig.luxMetodo !== "A";
      radA.addEventListener("click", async () => {
        if (temDados && v.workflowConfig.luxMetodo !== "A") return;
        v.workflowConfig.luxMetodo = "A";
        touchWorkflowConfig(v);
        await saveVistoriaNow();
        render();
      });

      const radB = el("button", { class: `ghost-btn touch-btn ${v.workflowConfig.luxMetodo === "B" ? "active-choice" : ""}`, style: `${v.workflowConfig.luxMetodo === "B" ? "background:var(--primary);color:#fff;font-weight:700" : ""}` }, "Método B (1 por Montante)");
      radB.disabled = temDados && v.workflowConfig.luxMetodo !== "B";
      radB.addEventListener("click", async () => {
        if (temDados && v.workflowConfig.luxMetodo !== "B") return;
        v.workflowConfig.luxMetodo = "B";
        touchWorkflowConfig(v);
        await saveVistoriaNow();
        render();
      });

      selMetodo.appendChild(el("div", { style: "display:flex;flex-wrap:wrap" }, radA, radB));
      if (temDados) {
        selMetodo.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);margin-top:4px" }, "🔒 O método não pode ser alterado pois já existem medições ou registros operacionais salvos."));
      } else if (!v.workflowConfig.luxMetodo) {
        selMetodo.appendChild(el("div", { style: "font-size:11.5px;color:var(--amber-dark, #b45309);margin-top:4px" }, "⚠ Escolha o Método A ou B antes de iniciar as medições de Lux."));
      }
      luxSection.appendChild(selMetodo);
    }
    wfCard.appendChild(luxSection);
    inner.appendChild(wfCard);
  }

  const sum=inspectionStageSummary(v);
  const visualStructures=(v.estruturas||[]).filter((e)=>visualProgress(e).complete).length;
  const prumoStructures=(v.estruturas||[]).filter((e)=>prumoProgress(e, v).complete).length;
  const luxStructures=(v.estruturas||[]).filter((e)=>luxProgress(e, v).complete).length;
  const overview=Card({class:"inspection-stage-overview",style:"margin-bottom:14px"});
  overview.appendChild(el("div",{class:"overview-head"},el("div",{},el("div",{class:"overview-kicker"},"ANDAMENTO DA INSPEÇÃO"),el("div",{class:"overview-title"},`${sum.estruturas} estrutura${sum.estruturas===1?"":"s"} · ${sum.montantes} montantes conhecidos`))));
  const stageMini=el("div",{class:"stage-mini-grid"});
  const prumoLabelMini = isPrumoHabilitado(v) ? `${prumoStructures}/${sum.estruturas||0}` : "N/A";
  const luxLabelMini = isLuxHabilitado(v) ? `${luxStructures}/${sum.estruturas||0}` : "N/A";
  [["Visual", `${visualStructures}/${sum.estruturas||0}`], ["Prumo", prumoLabelMini], ["Lux", luxLabelMini]].forEach(([label, countStr]) => {
    stageMini.appendChild(el("div", { class: "stage-mini" }, el("strong", {}, countStr), el("span", {}, label)));
  });
  overview.appendChild(stageMini);
  if(v.resume&&v.resume.estruturaId){
    if (v.resume.mode === "prumo" && !podeEntrarNoPrumo(v)) {
      delete v.resume;
    } else {
      const b=el("button",{class:"overview-resume-btn"},"▶ Continuar de onde parei");
      b.addEventListener("click",()=>resumeVistoria(v));
      overview.appendChild(b);
    }
  }
  inner.appendChild(overview);

  // v2.17: o trabalho é escolhido no nível da loja, refletindo a sequência física real.
  const work=el("div",{class:"inspection-work-grid"});
  const openVisual=async()=>{
    let e=null;
    if(v.resume&&v.resume.mode==="visual") e=(v.estruturas||[]).find((x)=>x.id===v.resume.estruturaId&&!x.visualFinalizada);
    if(!e) e=(v.estruturas||[]).slice().reverse().find((x)=>!x.setupComplete || !x.visualFinalizada);
    if(!e){
      const previous=(v.estruturas||[]).length ? v.estruturas[v.estruturas.length-1] : null;
      e=newEstruturaSkeleton(previous); v.estruturas.push(e); await saveVistoriaNow(); return go("estrutura",v.id,e.id);
    }
    if(!e.setupComplete) return go("estrutura",v.id,e.id);
    const m=startFirstVisualMontante(v,e); await saveVistoriaNow(); go("montante",v.id,e.id,m.id);
  };
  const nextPrumo = podeEntrarNoPrumo(v) ? (v.estruturas||[]).find((e)=>e.setupComplete&&e.visualFinalizada&&!prumoProgress(e, v).complete) : null;
  const nextLux = isLuxHabilitado(v) && getLuxMetodo(v) !== null ? (v.estruturas||[]).find((e)=>e.setupComplete&&e.visualFinalizada&&!luxProgress(e, v).complete) : null;

  const prumoPendenteDecisao = Boolean(v.workflowConfig && v.workflowConfig.prumoHabilitado === null);
  const prumoMain = !isPrumoHabilitado(v) ? "Campanha não realizada" : (prumoPendenteDecisao ? "Decisão pendente" : `${prumoStructures}/${sum.estruturas||0} estruturas`);
  const prumoSub = !isPrumoHabilitado(v) ? (v.workflowConfig && v.workflowConfig.prumoMotivo ? "Motivo: " + v.workflowConfig.prumoMotivo : "Desabilitado na inspeção") : (prumoPendenteDecisao ? "Escolha Realizar ou Não realizar nas Campanhas acima" : "Use depois da passagem visual, com o laser.");
  const prumoLabel = !isPrumoHabilitado(v) ? "Não aplicável" : (prumoPendenteDecisao ? "Definir campanha" : (nextPrumo ? "▶ Continuar prumo" : "Prumo em dia"));
  const prumoDisabled = !podeEntrarNoPrumo(v) || !nextPrumo;

  const luxMet = getLuxMetodo(v);
  const luxMain = !isLuxHabilitado(v) ? "Campanha não realizada" : (luxMet === null ? "Método não definido" : `${luxStructures}/${sum.estruturas||0} estruturas`);
  const luxSub = !isLuxHabilitado(v) ? (v.workflowConfig && v.workflowConfig.luxMotivo ? "Motivo: " + v.workflowConfig.luxMotivo : "Desabilitado na inspeção") : (luxMet === null ? "Defina Método A ou B nas Campanhas acima" : (luxMet === "A" ? "Método A: 3 pontos por estrutura" : (luxMet === "B" ? "Método B: 1 por montante" : "Registre os pontos em passagem própria.")));
  const luxLabel = !isLuxHabilitado(v) ? "Não aplicável" : (luxMet === null ? "Definir método" : (nextLux ? "▶ Continuar Lux" : "Lux em dia"));
  const luxDisabled = !isLuxHabilitado(v) || luxMet === null || !nextLux;

  const makeWork=(kind,title,main,sub,label,handler,disabled=false)=>{const c=Card({class:`inspection-work-card ${kind}${disabled?" disabled":""}`});c.appendChild(el("div",{class:"inspection-work-title"},title));c.appendChild(el("div",{class:"inspection-work-main"},main));c.appendChild(el("div",{class:"inspection-work-sub"},sub));const b=el("button",{class:"inspection-work-btn"},label);b.disabled=disabled;b.addEventListener("click",()=>{if(!disabled)handler();});c.appendChild(b);return c;};
  work.appendChild(makeWork("visual","1 · INSPEÇÃO VISUAL",`${visualStructures}/${sum.estruturas||0} estruturas concluídas`,"Cadastre as estruturas conforme avança. O total só é conhecido no fim.",visualStructures&&visualStructures===sum.estruturas?"＋ Nova estrutura / continuar visual":"▶ Continuar visual",openVisual));
  work.appendChild(makeWork("prumo","2 · PRUMO", prumoMain, prumoSub, prumoLabel, async()=>{ if(!podeEntrarNoPrumo(v)) { if(prumoPendenteDecisao) alert("Defina a campanha de Prumo (Realizar ou Não realizar) na seção Campanhas acima."); return; } let m=(nextPrumo.montantes||[]).find((x)=>!prumoDone(x))||(nextPrumo.montantes||[])[0];if(m){setResume(v,"prumo",nextPrumo,m);await saveVistoriaNow();go("prumo",v.id,nextPrumo.id,m.id);}}, prumoDisabled));
  work.appendChild(makeWork("lux","3 · ILUMINAÇÃO / LUX", luxMain, luxSub, luxLabel, async()=>{ if(!isLuxHabilitado(v)) return; if(luxMet === null){ alert("Defina o Método A ou B na seção Campanhas antes de iniciar o Lux."); return; } setResume(v,"lux",nextLux);await saveVistoriaNow();go("lux",v.id,nextLux.id);}, luxDisabled));
  inner.appendChild(work);

  const estHead = el("div", { style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px" },
    el("h3", { class: "section-title", style: "margin:0" }, `Estruturas (${(v.estruturas || []).length})`));
  inner.appendChild(estHead);

  const list = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:14px" });
  (v.estruturas || []).forEach((e) => list.appendChild(EstruturaRow(e, v)));
  inner.appendChild(list);

  const addEstBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:12px;display:flex;align-items:center;justify-content:center;gap:6px" },
    el("span", { html: svg("plus", 16) }), "Adicionar estrutura");
  addEstBtn.addEventListener("click", async () => {
    v.estruturas = v.estruturas || [];
    const previous = v.estruturas.length ? v.estruturas[v.estruturas.length - 1] : null;
    const nova = newEstruturaSkeleton(previous);
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
      await deleteVistoriaCompletamente(v.id);
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
  const st=estruturaStatus(e);const nMont=(e.montantes||[]).length;const vp=visualProgress(e),pp=prumoProgress(e, v),lp=luxProgress(e, v);
  const prumoStep = !isPrumoHabilitado(v) ? "Prumo (N/A)" : (pp.complete ? "Prumo ✓" : `Prumo ${pp.done}/${pp.total}`);
  const luxStep = !isLuxHabilitado(v) ? "Lux (N/A)" : (e.luxNaoAplica ? "Lux (Sem ilum.)" : (lp.complete ? "Lux ✓" : (lp.measurements ? `Lux ${lp.measurements} med.` : "Lux —")));
  const steps=[vp.complete?"Visual ✓":`Visual ${vp.done}/${vp.total}`, prumoStep, luxStep];
  const row=el("div",{class:"insp-row",onclick:()=>go("estrutura",v.id,e.id)},
    el("div",{},el("div",{class:"insp-code"},e.codigo||"(sem código ainda)"),el("div",{class:"insp-sub"},[e.rua&&"Rua "+e.rua,e.lado&&"Lado "+e.lado,nMont+" montante"+(nMont===1?"":"s")].filter(Boolean).join(" · ")),el("div",{class:"stage-inline"},steps.join("  ·  "))),
    el("div",{style:"display:flex;align-items:center;gap:8px"},Tag(st,"sm"),(()=>{const b=el("button",{style:"background:none;border:none;color:var(--ink-faint)",html:svg("trash",15)});b.addEventListener("click",(ev)=>{ev.stopPropagation();if(confirm("Remover esta estrutura da vistoria?")){recordTombstone(v,"estruturas",e.id);v.estruturas=v.estruturas.filter((x)=>x.id!==e.id);saveVistoriaNow().then(render);}});return b;})()));
  return Card({style:"padding:0;cursor:pointer"},row);
}
function submitVistoria(v, errBox) {
  errBox.innerHTML = "";
  const showErr = (msg) => errBox.appendChild(el("div", { style: "margin-top:12px;background:var(--red-bg);color:var(--red-dark);padding:10px 12px;border-radius:8px;font-size:13px;font-weight:600" }, msg));
  if (!v.lojaCd || !v.lojaCd.trim()) return showErr("Informe a Loja / CD.");
  if (!v.inspetor || !v.inspetor.trim()) return showErr("Informe o(s) inspetor(es).");
  if (!v.estruturas || !v.estruturas.length) return showErr("Adicione pelo menos uma estrutura antes de concluir.");
  const semCodigo = v.estruturas.find((e) => !e.codigo || !e.codigo.trim());
  if (semCodigo) return showErr("Toda estrutura precisa de um código — falta preencher pelo menos uma.");
  const semMontante = v.estruturas.find((e) => !(e.montantes || []).length);
  if (semMontante) return showErr(`A estrutura ${semMontante.codigo || "sem código"} ainda não possui montantes inspecionados.`);

  if (v.workflowConfig) {
    if (v.workflowConfig.prumoHabilitado === null) return showErr("Defina na seção Campanhas se a campanha de Prumo será realizada.");
    if (v.workflowConfig.prumoHabilitado === false && !String(v.workflowConfig.prumoMotivo || "").trim()) return showErr("Informe o motivo de não realizar o Prumo.");
    if (v.workflowConfig.luxHabilitado === null) return showErr("Defina na seção Campanhas se a campanha de Iluminação / Lux será realizada.");
    if (v.workflowConfig.luxHabilitado === false && !String(v.workflowConfig.luxMotivo || "").trim()) return showErr("Informe o motivo de não realizar a Iluminação / Lux.");
    if (v.workflowConfig.luxHabilitado === true && !v.workflowConfig.luxMetodo) return showErr("Selecione o Método A ou Método B de Iluminação / Lux antes de concluir a inspeção.");
  }

  const visualAberta = v.estruturas.find((e)=>!visualProgress(e).complete);
  if (visualAberta) return showErr(`A inspeção visual da estrutura ${visualAberta.codigo || "—"} ainda não foi encerrada.`);

  if (isPrumoHabilitado(v)) {
    const prumoPendente = v.estruturas.find((e)=>!prumoProgress(e, v).complete);
    if (prumoPendente) { const p=prumoProgress(prumoPendente, v); return showErr(`Prumo pendente na estrutura ${prumoPendente.codigo || "—"}: ${p.done}/${p.total} montantes concluídos.`); }
  }

  if (isLuxHabilitado(v)) {
    const luxPendente = v.estruturas.find((e)=>!luxProgress(e, v).complete);
    if (luxPendente) return showErr(`A etapa de iluminação/Lux da estrutura ${luxPendente.codigo || "—"} ainda não foi finalizada.`);
  }
  v.finalizada = true;
  v.finalizadaAt = new Date().toISOString();
  v.finalizadaUpdatedAt = nowIso(); v.finalizadaDeviceOrigin = getDeviceId();
  delete v.resume;
  saveVistoriaObject(v).then(() => {
    const id = v.id;
    state.draftVistoria = null;
    go("report", id);
  });
}

/* ---------------- Estrutura (checklist 9.x) ---------------- */
function StageWorkflowCard(kind, title, main, sub, buttonLabel, onClick, opts = {}) {
  const card=Card({class:`workflow-card workflow-${kind}${opts.complete?" is-complete":""}${opts.disabled?" is-disabled":""}`});
  const head=el("div",{class:"workflow-head"},
    el("div",{},el("div",{class:"workflow-kicker"},opts.kicker||"ETAPA"),el("div",{class:"workflow-title"},title)),
    opts.complete ? Tag("ok","sm","Concluída") : opts.problem ? Tag("problema","sm",opts.problem) : Tag("pendente","sm",opts.statusLabel||"Em andamento"));
  card.appendChild(head);
  card.appendChild(el("div",{class:"workflow-main"},main));
  card.appendChild(el("div",{class:"workflow-sub"},sub));
  const b=el("button",{class:"workflow-btn"+(opts.primary?" primary":"")},buttonLabel);
  b.disabled=Boolean(opts.disabled); if(opts.disabled)b.setAttribute("aria-disabled","true");
  b.addEventListener("click",()=>{if(!opts.disabled)onClick();}); card.appendChild(b);
  return card;
}
function EstruturaSetupScreen(v, e) {
  const wrap=el("div",{class:"screen structure-setup-screen",style:"padding-top:12px;padding-bottom:30px"});
  const previous=(v.estruturas||[]).filter((x)=>x.id!==e.id&&x.setupComplete).slice(-1)[0]||null;
  const intro=el("div",{class:"setup-intro"},el("div",{class:"setup-kicker"},"NOVA ESTRUTURA"),el("h2",{},"Identifique e comece"),el("p",{},"Use as sugestões herdadas da estrutura anterior. Digite somente o que realmente mudou."));wrap.appendChild(intro);
  const card=Card({class:"structure-setup-card"});
  const code=inputEl(e.codigo,(val)=>{e.codigo=val;touchMeta(e);saveVistoriaDebounced();},"Ex: E-018");code.autocapitalize="characters";code.enterKeyHint="next";card.appendChild(Field("Código da estrutura",code));
  card.appendChild(choiceOrCustomField("Setor",e.setor,state.config.setores,(val)=>{e.setor=val;touchMeta(e);saveVistoriaDebounced();},"Digite o setor"));
  const loc=el("div",{class:"setup-location-grid"});const rua=inputEl(e.rua,(val)=>{e.rua=val;touchMeta(e);saveVistoriaDebounced();},"Ex: 08");rua.enterKeyHint="done";loc.appendChild(Field("Rua / corredor",rua));loc.appendChild(choiceOrCustomField("Lado",e.lado,["DIREITO","ESQUERDO","AMBOS","ÍMPAR","PAR"],(val)=>{e.lado=val;touchMeta(e);saveVistoriaDebounced();},"Digite o lado"));card.appendChild(loc);
  card.appendChild(choiceOrCustomField("Tipo de estrutura",e.tipoEstrutura,state.config.tiposEstrutura,(val)=>{e.tipoEstrutura=val;touchMeta(e);saveVistoriaDebounced();},"Digite o tipo"));
  card.appendChild(choiceOrCustomField("Fabricante padrão",e.fabricante,state.config.fabricantes,(val)=>{e.fabricante=val;touchMeta(e);saveVistoriaDebounced();},"Digite o fabricante"));
  const more=el("details",{class:"setup-more"});more.appendChild(el("summary",{},"＋ Mais detalhes (opcional)"));const moreBody=el("div",{class:"setup-more-body"});const obs=el("textarea",{class:"input",rows:2,placeholder:"Altura, adaptações, interferências…"});obs.value=e.observacoesGerais||"";obs.addEventListener("input",()=>{e.observacoesGerais=obs.value;touchMeta(e);saveVistoriaDebounced();});moreBody.appendChild(Field("Observações gerais",obs));more.appendChild(moreBody);card.appendChild(more);
  card.appendChild(el("div",{id:"save-indicator",class:"save-indicator"},"✓ Salvo no aparelho"));wrap.appendChild(card);
  if(previous){wrap.appendChild(el("div",{class:"setup-inherited-note"},"Dados sugeridos com base em ",el("strong",{},previous.codigo||"estrutura anterior"),". Você pode alterar qualquer campo."));}
  const err=el("div",{class:"setup-error"});wrap.appendChild(err);
  const startBtn=el("button",{class:"setup-start-btn"},"CRIAR E INICIAR INSPEÇÃO →");startBtn.addEventListener("click",async()=>{err.textContent="";if(!String(e.codigo||"").trim()){err.textContent="Informe o código da estrutura.";code.focus();return;}e.setupComplete=true;let m=(e.montantes||[])[0]||addNextMontante(e);setResume(v,"visual",e,m);if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();await saveVistoriaNow();go("montante",v.id,e.id,m.id);});wrap.appendChild(startBtn);
  const cancel=el("button",{class:"setup-cancel-btn"},"Cancelar nova estrutura");cancel.addEventListener("click",async()=>{if((e.montantes||[]).length||montanteAnomalyEntries(e).length||estruturaAnomalyOccurrences(e).length)return go("vistoria",v.id);if(!confirm("Cancelar e remover esta nova estrutura?"))return;recordTombstone(v,"estruturas",e.id);v.estruturas=(v.estruturas||[]).filter((x)=>x.id!==e.id);await saveVistoriaNow();go("vistoria",v.id);});wrap.appendChild(cancel);
  return wrap;
}
function EstruturaScreen() {
  const v=state.draftVistoria;
  if(!v)return el("div",{class:"screen"},el("div",{class:"empty"},"Carregando…"));
  const e=(v.estruturas||[]).find((x)=>x.id===state.activeEstruturaId);
  if(!e)return el("div",{class:"screen"},el("div",{class:"empty"},"Estrutura não encontrada."));
  if(!e.setupComplete)return EstruturaSetupScreen(v,e);

  const wrap=el("div",{style:"padding-bottom:86px"});const inner=el("div",{class:"screen structure-screen",style:"padding-top:14px"});wrap.appendChild(inner);
  const totalAnom=montanteAnomalyEntries(e).length+estruturaAnomalyOccurrences(e).length;const vp=visualProgress(e),pp=prumoProgress(e),lp=luxProgress(e);
  const summary=Card({class:"structure-summary",style:"margin-bottom:10px"});summary.appendChild(el("div",{class:"structure-summary-row"},el("div",{},el("div",{class:"structure-code"},e.codigo||"Estrutura"),el("div",{class:"structure-sub"},[e.rua&&`Rua ${e.rua}`,e.lado,e.setor,e.tipoEstrutura,e.fabricante].filter(Boolean).join(" · "))),el("div",{class:"structure-anom"},el("strong",{},String(totalAnom)),el("span",{},"anom."))));
  const details=el("details",{class:"structure-details"});details.appendChild(el("summary",{},"Editar dados da estrutura"));const edit=el("div",{class:"structure-edit-body"});edit.appendChild(Field("Código",inputEl(e.codigo,(val)=>{e.codigo=val;touchMeta(e);saveVistoriaDebounced();},"Código")));edit.appendChild(el("div",{class:"row2"},choiceOrCustomField("Setor",e.setor,state.config.setores,(val)=>{e.setor=val;touchMeta(e);saveVistoriaDebounced();}),choiceOrCustomField("Tipo",e.tipoEstrutura,state.config.tiposEstrutura,(val)=>{e.tipoEstrutura=val;touchMeta(e);saveVistoriaDebounced();})));edit.appendChild(el("div",{class:"row2"},Field("Rua",inputEl(e.rua,(val)=>{e.rua=val;touchMeta(e);saveVistoriaDebounced();},"Rua")),choiceOrCustomField("Lado",e.lado,["DIREITO","ESQUERDO","AMBOS","ÍMPAR","PAR"],(val)=>{e.lado=val;touchMeta(e);saveVistoriaDebounced();})));edit.appendChild(choiceOrCustomField("Fabricante",e.fabricante,state.config.fabricantes,(val)=>{e.fabricante=val;touchMeta(e);saveVistoriaDebounced();}));const obs=el("textarea",{class:"input",rows:2,placeholder:"Observações gerais"});obs.value=e.observacoesGerais||"";obs.addEventListener("input",()=>{e.observacoesGerais=obs.value;touchMeta(e);saveVistoriaDebounced();});edit.appendChild(Field("Observações",obs));edit.appendChild(el("div",{id:"save-indicator",class:"save-indicator"},"✓ Salvo no aparelho"));details.appendChild(edit);summary.appendChild(details);inner.appendChild(summary);

  if(!e.visualFinalizada){
    const action=Card({class:"visual-continue-card"});action.appendChild(el("div",{class:"visual-continue-kicker"},"INSPEÇÃO VISUAL"));action.appendChild(el("div",{class:"visual-continue-main"},vp.total?`${vp.done} de ${vp.total} montantes revisados`:"Pronto para começar"));action.appendChild(el("div",{class:"visual-continue-sub"},"O próximo montante é criado automaticamente. Não é necessário informar o total."));const b=el("button",{class:"visual-continue-btn"},vp.total?"▶ CONTINUAR INSPEÇÃO VISUAL":"▶ INICIAR NO MONTANTE 001");b.addEventListener("click",async()=>{const m=startFirstVisualMontante(v,e);await saveVistoriaNow();go("montante",v.id,e.id,m.id);});action.appendChild(b);inner.appendChild(action);
  } else {
    const done=Card({class:"visual-done-card"});done.appendChild(el("div",{class:"visual-done-icon"},"✓"));done.appendChild(el("div",{},el("div",{class:"visual-done-title"},"Inspeção visual concluída"),el("div",{class:"visual-done-sub"},`${vp.total} montantes · ${totalAnom} anomalia${totalAnom===1?"":"s"}`)));inner.appendChild(done);
    const next=el("button",{class:"next-structure-btn"},"＋ CRIAR PRÓXIMA ESTRUTURA");next.addEventListener("click",async()=>{const nova=newEstruturaSkeleton(e);v.estruturas.push(nova);await saveVistoriaNow();go("estrutura",v.id,nova.id);});inner.appendChild(next);
    const measures=el("div",{class:"structure-measure-row"});
    const prumoBtnText = !isPrumoHabilitado(v) ? "Prumo (N/A)" : (!podeEntrarNoPrumo(v) ? "Prumo (Pendente)" : (pp.complete ? "Prumo ✓" : `Prumo ${pp.done}/${pp.total}`));
    const pb=el("button",{class:"ghost-btn touch-btn"}, prumoBtnText);
    pb.addEventListener("click",async()=>{
      if (!podeEntrarNoPrumo(v)) {
        return alert(v.workflowConfig && v.workflowConfig.prumoHabilitado === false ? "Campanha de Prumo desabilitada nesta inspeção." : "Defina se a campanha de Prumo será realizada na tela da inspeção antes de iniciar.");
      }
      let m=(e.montantes||[]).find((x)=>!prumoDone(x))||(e.montantes||[])[0];
      if(m){setResume(v,"prumo",e,m);await saveVistoriaNow();go("prumo",v.id,e.id,m.id);}
    });

    const luxBtnText = !isLuxHabilitado(v) ? "Lux (N/A)" : (e.luxNaoAplica ? "Lux (Sem ilum.)" : (lp.complete ? "Lux ✓" : (lp.measurements ? `Lux ${lp.measurements} med.` : "Lux —")));
    const lb=el("button",{class:"ghost-btn touch-btn"}, luxBtnText);
    lb.addEventListener("click",async()=>{
      if (!isLuxHabilitado(v)) return alert("Campanha de Iluminação/Lux desabilitada nesta inspeção.");
      if (getLuxMetodo(v) === null) return alert("Defina o Método de Lux (A ou B) na tela da inspeção antes de iniciar.");
      setResume(v,"lux",e);await saveVistoriaNow();go("lux",v.id,e.id);
    });
    measures.appendChild(pb);measures.appendChild(lb);inner.appendChild(measures);
  }

  const visEstItems=visualStructureItems(e);if(visEstItems.length){if(!(e.id in estItemsCollapseState))estItemsCollapseState[e.id]=true;const collapsed=estItemsCollapseState[e.id];const estOverall=overallStatus(visEstItems.map((it)=>({status:estruturaEstItemStatus(it)})));const estHeader=el("div",{class:"card section-toggle",style:"margin-top:12px"},el("div",{},el("div",{style:"font-weight:700;font-size:14px"},"Condições gerais da estrutura"),el("div",{class:"insp-sub"},"Layout, luminárias, piso e demais itens gerais")),el("div",{style:"display:flex;align-items:center;gap:8px"},Tag(estOverall,"sm"),el("span",{html:svg("chevronRight",16,collapsed?"":"transform:rotate(90deg)")})));estHeader.addEventListener("click",()=>{estItemsCollapseState[e.id]=!estItemsCollapseState[e.id];render();});inner.appendChild(estHeader);if(!collapsed){const list=el("div",{style:"display:flex;flex-direction:column;gap:8px;margin:8px 0 12px"});visEstItems.forEach((it)=>list.appendChild(EstruturaItemRow(it,e,v)));inner.appendChild(list);}}

  if(vp.total){const montDetails=el("details",{class:"montantes-details"});montDetails.appendChild(el("summary",{},`Ver montantes (${vp.total})`));const montList=el("div",{style:"display:flex;flex-direction:column;gap:7px;margin-top:8px"});(e.montantes||[]).slice().sort((a,b)=>a.numero-b.numero).forEach((m)=>montList.appendChild(MontanteRow(m,e,v)));montDetails.appendChild(montList);inner.appendChild(montDetails);}
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
  const it = e && (e.itensEstrutura || []).find((x) => x.id === state.activeEstItemId);
  if (!e || !it) { wrap.appendChild(el("div", { class: "empty" }, "Item não encontrado.")); return wrap; }
  wrap.appendChild(el("div", { class: "field-context" }, `Estrutura ${e.codigo || "—"}`));
  wrap.appendChild(el("div", { class: "item-title-large" }, CodeBadge(it.codigo), it.nome));
  wrap.appendChild(el("div", { id: "save-indicator", class: "save-indicator", style: "margin-bottom:14px" }, "✓ Salvo no aparelho"));
  if (it.tipo !== "medicao" && !(it.ocorrencias || []).length) {
    const okBtn = el("button", { class: "field-ok-btn", style: "width:100%;margin-bottom:14px" }, "✓ Conforme — sem ocorrência");
    okBtn.addEventListener("click", async () => { it.revisado = true; touchItem(it); touchStage(e,"visual"); await saveVistoriaNow(); go("estrutura", v.id, e.id); }); wrap.appendChild(okBtn);
  }
  const list = el("div", { style: "display:flex;flex-direction:column;gap:10px;margin-bottom:14px" });
  (it.ocorrencias || []).forEach((oc, idx) => list.appendChild(OcorrenciaCard(oc, idx, it, e))); wrap.appendChild(list);
  const addBtn = el("button", { class: "ghost-btn touch-btn", style: "width:100%;display:flex;align-items:center;justify-content:center;gap:6px" }, el("span", { html: svg("plus", 16) }), it.tipo === "medicao" ? "Adicionar aferição" : "Adicionar ocorrência");
  addBtn.addEventListener("click", async () => {
    if (it.tipo !== "medicao") return startNewAnomaly(v,e,null,it,null,"estrutura");
    const novaOc = touchOccurrence(newOcorrencia("pendente"));
    it.ocorrencias = it.ocorrencias || []; it.ocorrencias.push(novaOc); touchItem(it); touchStage(e,"lux"); await saveVistoriaNow(); render();
  }); wrap.appendChild(addBtn);
  if (it.tipo === "medicao" && !(it.ocorrencias || []).length) wrap.appendChild(el("div", { class: "field-mode-hint", style: "margin-top:8px" }, "Registre pelo menos uma aferição. O status será calculado automaticamente pelo limite configurado."));
  const backBtn = el("button", { class: "submit-btn", style: "width:100%;margin-top:16px" }, "Voltar para a estrutura"); backBtn.addEventListener("click", async () => { await saveVistoriaNow(); go("estrutura", v.id, e.id); }); wrap.appendChild(backBtn); return wrap;
}
function OcorrenciaCard(oc, idx, it, e) {
  normalizeOccurrence(oc, it, it.tipo === "medicao" ? "pendente" : "problema");
  const card = Card({ class: "occurrence-card", style: "padding:12px" });
  const st = ocorrenciaStatus(oc, it);
  card.appendChild(el("div", { class: "occurrence-head" },
    el("div", {}, el("div", { style: "font-weight:700;font-size:13px" }, it.tipo === "medicao" ? `Aferição ${idx + 1}` : `Ocorrência ${idx + 1}`), Tag(st, "sm")),
    (() => { const b=el("button",{class:"icon-btn",html:svg("trash",15)}); b.addEventListener("click",async()=>{if(confirm("Remover este registro?")){recordTombstone(state.draftVistoria,"ocorrencias",oc.id);it.ocorrencias.splice(idx,1);touchItem(it);touchStage(e,stageForItem(it));await saveVistoriaNow();render();}});return b; })()));
  card.appendChild(Field("Montante / posição de referência", inputEl(oc.montanteRef, (val) => { oc.montanteRef = val; touchOccurrenceFull(oc,it,e); saveVistoriaDebounced(); }, "Ex: Montante 5")));
  if (it.tipo === "medicao") {
    const inp=inputEl(oc.valor,(val)=>{oc.valor=val;oc.status=statusFromMedicao(val,it.min);touchOccurrenceFull(oc,it,e);saveVistoriaDebounced();},`Mínimo ${it.min}`,"number");
    card.appendChild(Field(`Valor medido (${it.unidade})`, inp));
    card.appendChild(el("div",{class:"measurement-hint"},oc.valor ? (statusFromMedicao(oc.valor,it.min)==="ok" ? `✓ Dentro do limite (≥ ${it.min} ${it.unidade})` : `⚠ Abaixo do limite (${it.min} ${it.unidade})`) : `Limite mínimo: ${it.min} ${it.unidade}`));
  }
  if (it.descOpcoes) card.appendChild(Field("Descrição", suggestInput(oc.descTxt, (val) => { oc.descTxt = val; oc.status = ocorrenciaStatus(oc,it); touchOccurrenceFull(oc,it,e); saveVistoriaDebounced(); }, "Digite a descrição", it.descOpcoes)));
  if (it.tipoOpcoes) card.appendChild(Field("Tipo", suggestInput(oc.tipoTxt, (val) => { oc.tipoTxt = val; touchOccurrenceFull(oc,it,e); saveVistoriaDebounced(); }, "Digite o tipo/componente", it.tipoOpcoes)));
  if (it.localOpcoes) card.appendChild(Field(it.localLabel || "Localização", suggestInput(oc.localTxt, (val) => { oc.localTxt = val; touchOccurrenceFull(oc,it,e); saveVistoriaDebounced(); }, "Digite a localização", it.localOpcoes)));
  if (it.tipo !== "medicao") card.appendChild(Field("Grau", suggestInput(oc.grauTxt, (val) => { oc.grauTxt = val; touchOccurrenceFull(oc,it,e); saveVistoriaDebounced(); }, "Leve, Médio, Grave, Gravíssimo", GRAU_OPCOES)));
  card.appendChild(Field("Quantidade", inputEl(oc.qtd == null ? 1 : oc.qtd, (val) => { oc.qtd = val; touchOccurrenceFull(oc,it,e); saveVistoriaDebounced(); }, "1", "number")));
  const obsBox=el("textarea",{class:"input",rows:2,placeholder:"Observação (opcional)"}); obsBox.value=oc.obs||""; obsBox.addEventListener("input",(ev)=>{oc.obs=ev.target.value;touchOccurrenceFull(oc,it,e);saveVistoriaDebounced();}); card.appendChild(el("div",{class:"field"},el("label",{},"Observações"),obsBox));
  const photoWrap=el("div",{style:"margin-top:4px"}); renderPhotoArea(photoWrap,oc,()=>touchOccurrenceFull(oc,it,e)); card.appendChild(photoWrap);
  return card;
}
function MontanteRow(m, e, v) {
  const st=visualMontanteStatus(m,e);
  const nAnom=montanteAnomalyEntries({ ...e, montantes:[m] }).filter(({item})=>item.id!=="prumo").length;
  const row=el("div",{class:"insp-row",onclick:()=>{setResume(v,"visual",e,m);saveVistoriaNow().then(()=>go("montante",v.id,e.id,m.id));}},
    el("div",{},el("div",{class:"insp-code"},`Montante Nº ${m.numero}`),el("div",{class:"insp-sub"},[m.tipoMontante,m.fabricante,nAnom?`${nAnom} anomalia(s)`:""].filter(Boolean).join(" · "))),
    el("div",{style:"display:flex;align-items:center;gap:8px"},Tag(st,"sm"),el("span",{html:svg("chevronRight",16),style:"color:var(--ink-faint)"})));
  return Card({style:"padding:0;cursor:pointer"},row);
}
const familyCollapseState = {};
const estItemsCollapseState = {};
const fieldChecklistCollapseState = {};
function FamilySection(familia, itensFamilia, e, m) {
  if (!(familia in familyCollapseState)) familyCollapseState[familia] = true;
  const st = overallStatus(itensFamilia.map((i) => ({ status: montanteItemStatus(i) })));
  const pendentes = itensFamilia.filter((i) => montanteItemStatus(i) === "pendente").length;
  const apontamentos = itensFamilia.filter((i) => montanteItemStatus(i) === "problema").length;

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
      itensFamilia.forEach((it) => {
        if (montanteItemStatus(it) !== "pendente") return;
        it.revisado = true; it.status = "ok"; syncMontanteItemStatus(it); touchItem(it);
      });
      touchMontante(m, e);
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
    el("div", { style: "display:flex;align-items:center;gap:8px" }, Tag(montanteItemStatus(item), "sm"), el("span", { html: svg("chevronRight", 16), style: "color:var(--ink-faint)" })));
  return Card({ style: "padding:0;margin-bottom:8px;cursor:pointer" }, row);
}

function startNewAnomaly(v,e,m,item,seed=null,level="montante") {
  const occurrence = normalizeOccurrence(seed ? copyOccurrenceWithoutPhotos(seed) : newOcorrencia("problema"), item, "problema");
  occurrence.status = "problema";
  if (level === "estrutura" && m && !occurrence.montanteRef) occurrence.montanteRef = `Montante ${m.numero}`;
  state.draftOccurrence = { level, itemId:item.id, occurrence };
  // v2.19.1: rascunho de RECUPERAÇÃO, persistido junto da vistoria (mesma persistência já existente —
  // sem Object Store novo). "occurrence" é a MESMA referência de objeto usada em state.draftOccurrence,
  // então qualquer edição de campo ou foto adicionada/removida já fica refletida aqui automaticamente,
  // sem precisar duplicar lógica de propagação em cada callback. Isolado de item.ocorrencias — nunca
  // aparece em progresso/relatório/BOM/CSV, porque nenhuma dessas funções lê este campo.
  v.draftOccurrenceRecovery = { estruturaId: e.id, montanteId: m ? m.id : null, itemId: item.id, level, occurrence, updatedAt: nowIso() };
  saveVistoriaObject(v).catch(() => {});
  state.itemDetailReturn = null;
  go("newAnomaly",v.id,e.id,m ? m.id : null,level === "estrutura" ? item.id : null,level === "montante" ? item.id : null);
}
function NewAnomalyScreen() {
  const wrap=el("div",{class:"screen field-form-screen",style:"padding-bottom:30px"});
  const v=state.draftVistoria; const e=v&&(v.estruturas||[]).find((x)=>x.id===state.activeEstruturaId); const m=e&&(e.montantes||[]).find((x)=>x.id===state.activeMontanteId);
  const draft=state.draftOccurrence; const level=draft&&(draft.level||"montante");
  const item=e&&draft ? (level==="estrutura" ? (e.itensEstrutura||[]).find((x)=>x.id===draft.itemId) : m&&(m.itens||[]).find((x)=>x.id===draft.itemId)) : null;
  if(!v||!e||!item||!draft){wrap.appendChild(el("div",{class:"empty"},"Registro temporário não encontrado."));return wrap;}
  const oc=draft.occurrence;
  wrap.appendChild(el("div",{class:"field-context"},level==="estrutura"?`Estrutura ${e.codigo||"—"}${m?` · referência Montante ${m.numero}`:""}`:`Estrutura ${e.codigo||"—"} · Montante ${m.numero}`));
  wrap.appendChild(el("div",{class:"item-title-large"},CodeBadge(item.codigo),item.nome));
  wrap.appendChild(el("div",{class:"draft-banner"},"Rascunho — só entra na inspeção depois de Salvar anomalia."));
  const err=el("div",{class:"form-error",style:"display:none;margin-top:10px"}); wrap.appendChild(err);
  const card=Card({class:"occurrence-card touch-anomaly-card",style:"margin-top:12px"});
  if(level==="estrutura") card.appendChild(choiceOrCustomField("Montante / posição de referência",oc.montanteRef||"",(e.montantes||[]).slice().sort((a,b)=>a.numero-b.numero).map((x)=>`Montante ${x.numero}`),(val)=>{oc.montanteRef=val;touchDraftRecovery();saveVistoriaDebounced();},"Ex: Centro do corredor"));
  if(item.descOpcoes)card.appendChild(choiceOrCustomField("Descrição",oc.descTxt,item.descOpcoes,(val)=>{oc.descTxt=val;touchDraftRecovery();saveVistoriaDebounced();},"Digite a descrição"));
  if(item.tipoOpcoes)card.appendChild(choiceOrCustomField("Tipo / componente",oc.tipoTxt,item.tipoOpcoes,(val)=>{oc.tipoTxt=val;touchDraftRecovery();saveVistoriaDebounced();},"Digite o tipo"));
  if(item.localOpcoes)card.appendChild(choiceOrCustomField(item.localLabel||"Localização",oc.localTxt,item.localOpcoes,(val)=>{oc.localTxt=val;touchDraftRecovery();saveVistoriaDebounced();},"Digite a localização"));
  card.appendChild(choiceOrCustomField("Grau",oc.grauTxt,GRAU_OPCOES,(val)=>{oc.grauTxt=val;touchDraftRecovery();saveVistoriaDebounced();},"Digite o grau"));
  const compact=el("div",{class:"anomaly-number-grid"}); const nivel=inputEl(oc.corte||"",(val)=>{oc.corte=val;touchDraftRecovery();saveVistoriaDebounced();},"Ex: 1 / 3 / 18"); nivel.enterKeyHint="next"; compact.appendChild(Field("Nível / posição",nivel)); compact.appendChild(Field("Quantidade",inputEl(oc.qtd==null?1:oc.qtd,(val)=>{oc.qtd=val;touchDraftRecovery();saveVistoriaDebounced();},"1","number"))); card.appendChild(compact);
  const optional=el("details",{class:"anomaly-optional"}); optional.appendChild(el("summary",{},"＋ Observação (opcional)")); const obs=el("textarea",{class:"input",rows:2,placeholder:"Observação adicional"}); obs.value=oc.obs||""; obs.addEventListener("input",()=>{oc.obs=obs.value;touchDraftRecovery();saveVistoriaDebounced();}); optional.appendChild(obs); card.appendChild(optional);
  const photos=el("div",{style:"margin-top:10px"}); renderPhotoArea(photos,oc); card.appendChild(photos); wrap.appendChild(card);
  const actions=el("div",{class:"draft-actions"}); const cancel=el("button",{class:"ghost-btn touch-btn"},"Cancelar"); cancel.addEventListener("click",cancelDraftAnomaly);
  const save=el("button",{class:"field-next-btn"},"✓ Salvar anomalia"); save.addEventListener("click",async()=>{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();const msg=validateAnomalyOccurrence(oc,item);if(msg){err.textContent=msg;err.style.display="block";err.scrollIntoView({block:"center"});return;}item.ocorrencias=item.ocorrencias||[];item.ocorrencias.push(touchOccurrence(normalizeOccurrence(oc,item,"problema")));if(level==="montante"){item.status="problema";syncMontanteItemStatus(item);touchItem(item);touchStage(e,"visual");}else{item.revisado=true;touchItem(item);touchStage(e,"visual");}state.draftOccurrence=null;delete v.draftOccurrenceRecovery;await saveVistoriaNow();if(level==="estrutura"&&!m)return go("estrutura",v.id,e.id);go("montante",v.id,e.id,m.id);});
  actions.appendChild(cancel); actions.appendChild(save); wrap.appendChild(actions); return wrap;
}
function MontanteScreen() {
  const wrap=el("div",{class:"field-screen visual-field-screen",style:"padding-bottom:92px"});const inner=el("div",{class:"screen",style:"padding-top:10px"});wrap.appendChild(inner);
  const v=state.draftVistoria;const e=v&&(v.estruturas||[]).find((x)=>x.id===state.activeEstruturaId);const m=e&&(e.montantes||[]).find((x)=>x.id===state.activeMontanteId);if(!v||!e||!m){inner.appendChild(el("div",{class:"empty"},"Montante não encontrado."));return wrap;}
  (m.itens||[]).forEach(normalizeMontanteItem);setResume(v,"visual",e,m);const visualItems=visualItemsMontante(m,e);const visualAnoms=montanteAnomalyEntries({...e,montantes:[m]}).filter(({item})=>item.id!=="prumo");const anom=visualAnoms.length;const done=visualMontanteDone(m,e);const ord=(e.montantes||[]).slice().sort((a,b)=>a.numero-b.numero);const idx=ord.findIndex((x)=>x.id===m.id);const prev=ord[idx-1];const isLast=idx===ord.length-1;
  const hero=Card({class:"montante-hero compact"});hero.appendChild(el("div",{class:"montante-context"},`VISUAL · ${e.codigo||"—"}${e.rua?" · Rua "+e.rua:""}${e.lado?" · "+e.lado:""}`));hero.appendChild(el("div",{class:"montante-number"},"MONTANTE ",el("strong",{},String(m.numero).padStart(3,"0"))));hero.appendChild(el("div",{class:"montante-meta"},el("span",{},anom?`${anom} anomalia${anom===1?"":"s"}`:"sem anomalias"),el("span",{},done?"✓ visual concluído":"em revisão"),el("span",{id:"save-indicator",class:"save-indicator"},"✓ salvo")));inner.appendChild(hero);

  const context=el("details",{class:"card compact-details",style:"margin-top:8px"});const chips=el("div",{class:"context-chips"},el("span",{class:"context-chip"},m.tipoMontante||"Tipo não informado"),el("span",{class:"context-chip"},m.fabricante||e.fabricante||"Fabricante não informado"));context.appendChild(el("summary",{},chips,el("span",{class:"edit-hint"},"alterar")));const body=el("div",{class:"compact-details-body"});body.appendChild(choiceOrCustomField("Tipo / corte",m.tipoMontante,["GÔNDOLA","CHÃO","LONGARINA MÓVEL","ÚLTIMO MONTANTE"],(val)=>{m.tipoMontante=val;touchMontanteMeta(m,e);saveVistoriaDebounced();},"Digite o tipo"));body.appendChild(choiceOrCustomField("Fabricante",m.fabricante||e.fabricante,state.config.fabricantes,(val)=>{m.fabricante=val;touchMontanteMeta(m,e);saveVistoriaDebounced();},"Digite o fabricante"));const obs=el("textarea",{class:"input",rows:2,placeholder:"Observação deste montante (opcional)"});obs.value=m.observacoes||"";obs.addEventListener("input",()=>{m.observacoes=obs.value;touchMontanteMeta(m,e);saveVistoriaDebounced();});body.appendChild(Field("Observação",obs));context.appendChild(body);inner.appendChild(context);

  const quick=el("div",{class:"quick-action-grid visual-actions"});const btnAnom=el("button",{class:"quick-anomaly-btn"},el("span",{html:svg("alert",20)}),el("span",{},"Registrar anomalia"));const btnChecklist=el("button",{class:"quick-secondary-btn"},el("span",{html:svg("search",19)}),el("span",{},"Buscar checklist"));quick.appendChild(btnAnom);quick.appendChild(btnChecklist);inner.appendChild(quick);
  const last=lastVisualAnomalyBefore(e,m);if(last){const repeat=el("button",{class:"repeat-anomaly-btn"},el("span",{html:svg("clock",17)}),el("span",{},`Repetir última: ${last.item.codigo} · ${last.item.nome}`));repeat.addEventListener("click",()=>{const current=(m.itens||[]).find((it)=>it.id===last.item.id);if(current)startNewAnomaly(v,e,m,current,last.oc);});inner.appendChild(repeat);}

  const picker=Card({class:"anomaly-picker",style:"display:none;margin-top:9px"});const pickerTitle=el("div",{class:"picker-title"},"Selecione o componente com anomalia");picker.appendChild(pickerTitle);const recentWrap=el("div");const recent=recentAnomalyChoices(v,5);if(recent.length){recentWrap.appendChild(el("div",{class:"picker-recent-label"},"Recentes"));const row=el("div",{class:"picker-recent"});recent.forEach((it)=>{const b=el("button",{class:"recent-chip"},`${it.codigo} · ${it.nome}`);b.addEventListener("click",()=>{const current=(m.itens||[]).find((x)=>x.id===it.id);if(current)startNewAnomaly(v,e,m,current);});row.appendChild(b);});recentWrap.appendChild(row);}picker.appendChild(recentWrap);
  const searchToggle=el("button",{class:"picker-search-toggle"},"⌕ Buscar outro item");picker.appendChild(searchToggle);const searchWrap=el("div",{class:"picker-search-wrap",style:"display:none"});const search=el("input",{class:"input",placeholder:"Código ou componente…",enterkeyhint:"search"});const results=el("div",{class:"picker-results"});searchWrap.appendChild(search);searchWrap.appendChild(results);picker.appendChild(searchWrap);let pickerMode="anomaly";
  const renderPicker=()=>{const q=(search.value||"").trim().toLowerCase();results.innerHTML="";if(!q){results.appendChild(el("div",{class:"picker-search-help"},"Digite parte do código ou nome para procurar."));return;}const searchable=[...visualItems.map((it)=>({it,level:"montante"})),...visualStructureItems(e).map((it)=>({it,level:"estrutura"}))];searchable.filter(({it})=>`${it.codigo} ${it.nome} ${it.familia}`.toLowerCase().includes(q)).slice(0,30).forEach(({it,level})=>{const st=level==="montante"?montanteItemStatus(it):estruturaEstItemStatus(it);const b=el("button",{class:"picker-item"},el("span",{},CodeBadge(it.codigo),it.nome,level==="estrutura"?el("small",{style:"display:block;color:var(--ink-faint);margin-top:2px"},"Estrutura / condição geral"):null),Tag(st,"sm"));b.addEventListener("click",()=>{search.blur();if(pickerMode==="anomaly")startNewAnomaly(v,e,m,it,null,level);else if(level==="estrutura")go("estItem",v.id,e.id,null,it.id);else{state.itemDetailReturn="montante";go("itemDetail",v.id,e.id,m.id,null,it.id);}});results.appendChild(b);});};search.addEventListener("input",renderPicker);renderPicker();searchToggle.addEventListener("click",()=>{searchWrap.style.display="block";searchToggle.style.display="none";setTimeout(()=>search.focus(),80);});inner.appendChild(picker);
  const openPicker=(mode)=>{pickerMode=mode;pickerTitle.textContent=mode==="anomaly"?"Selecione o componente com anomalia":"Buscar item do checklist";picker.style.display="block";search.value="";results.innerHTML="";searchWrap.style.display=mode==="detail"?"block":"none";searchToggle.style.display=mode==="detail"?"none":"block";renderPicker();if(mode==="detail")setTimeout(()=>search.focus(),80);};btnAnom.addEventListener("click",()=>openPicker("anomaly"));btnChecklist.addEventListener("click",()=>openPicker("detail"));

  if(anom){const existing=Card({class:"field-existing-anomalies",style:"margin-top:10px"});existing.appendChild(el("div",{class:"picker-title"},`Anomalias registradas neste montante (${anom})`));const seen=new Set();visualAnoms.forEach(({item})=>{if(seen.has(item.id))return;seen.add(item.id);const b=el("button",{class:"picker-item"},el("span",{},CodeBadge(item.codigo),item.nome),el("span",{html:svg("chevronRight",15)}));b.addEventListener("click",()=>{state.itemDetailReturn="montante";go("itemDetail",v.id,e.id,m.id,null,item.id);});existing.appendChild(b);});inner.appendChild(existing);}

  if(isLast&&prev&&!montanteHasInspectionActivity(m)&&!e.visualFinalizada){const recover=el("button",{class:"last-montante-recovery"},"← A ESTRUTURA TERMINOU NO MONTANTE ANTERIOR");recover.addEventListener("click",async()=>{if(!confirm(`Remover o Montante ${m.numero} e finalizar a estrutura ${e.codigo||"—"} no Montante ${prev.numero}?`))return;recordTombstone(v,"montantes",m.id);e.montantes=e.montantes.filter((x)=>x.id!==m.id);completeMontanteVisualAsInspected(prev,e);const faltantes=(e.montantes||[]).filter((x)=>!visualMontanteDone(x,e));if(faltantes.length){alert(`Ainda há ${faltantes.length} montante(s) não concluído(s).`);return;}completeStructureVisualAsInspected(e);e.ultimoMontante=prev.numero;delete v.resume;await saveVistoriaNow();go("estrutura",v.id,e.id);});inner.appendChild(recover);}

  const nav=el("div",{class:"field-secondary-row"});const bprev=el("button",{class:"ghost-btn touch-btn"},"◀ Anterior");bprev.disabled=!prev;if(!prev)bprev.style.opacity=".4";bprev.addEventListener("click",async()=>{if(prev){setResume(v,"visual",e,prev);await saveVistoriaNow();go("montante",v.id,e.id,prev.id);}});nav.appendChild(bprev);const options=el("details",{class:"field-options"});options.appendChild(el("summary",{},"⋯ Opções"));const menu=el("div",{class:"field-options-menu"});if(isLast&&!e.visualFinalizada){const finish=el("button",{},"Encerrar estrutura neste montante");finish.addEventListener("click",async()=>{if(!confirm(`Finalizar a inspeção visual da estrutura ${e.codigo||"—"} com ${m.numero} montante(s)?`))return;completeMontanteVisualAsInspected(m,e);const faltantes=(e.montantes||[]).filter((x)=>!visualMontanteDone(x,e));if(faltantes.length){alert(`Ainda há ${faltantes.length} montante(s) não concluído(s).`);return;}completeStructureVisualAsInspected(e);e.ultimoMontante=m.numero;delete v.resume;await saveVistoriaNow();go("estrutura",v.id,e.id);});menu.appendChild(finish);const del=el("button",{class:"danger-option"},"Excluir este montante");del.addEventListener("click",async()=>{if(!confirm(montanteHasActivity(m)?"Este montante possui dados. Excluir mesmo assim?":"Excluir este montante vazio?"))return;recordTombstone(v,"montantes",m.id);e.montantes=e.montantes.filter((x)=>x.id!==m.id);await saveVistoriaNow();if(prev)go("montante",v.id,e.id,prev.id);else go("estrutura",v.id,e.id);});menu.appendChild(del);}options.appendChild(menu);nav.appendChild(options);inner.appendChild(nav);
  const sticky=el("div",{class:"field-sticky no-print"});const nextBtn=el("button",{class:"field-next-btn"},e.visualFinalizada?"✓ VOLTAR À ESTRUTURA":(anom?"✓ SALVAR E IR PARA O PRÓXIMO":"✓ SEM ANOMALIAS → PRÓXIMO"));nextBtn.addEventListener("click",async()=>{if(e.visualFinalizada){await saveVistoriaNow();return go("estrutura",v.id,e.id);}if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();completeMontanteVisualAsInspected(m,e);let next=ord[idx+1];if(!next)next=addNextMontante(e);setResume(v,"visual",e,next);await saveVistoriaNow();go("montante",v.id,e.id,next.id);});sticky.appendChild(nextBtn);wrap.appendChild(sticky);return wrap;
}
function PrumoScreen() {
  const wrap=el("div",{class:"field-screen measure-screen",style:"padding-bottom:104px"});const inner=el("div",{class:"screen",style:"padding-top:10px"});wrap.appendChild(inner);
  const v=state.draftVistoria;const e=v&&(v.estruturas||[]).find((x)=>x.id===state.activeEstruturaId);let m=e&&(e.montantes||[]).find((x)=>x.id===state.activeMontanteId);
  if(!v||!e){inner.appendChild(el("div",{class:"empty"},"Estrutura não encontrada."));return wrap;}
  if(!podeEntrarNoPrumo(v)){
    inner.appendChild(el("div",{class:"card empty"},(!v.workflowConfig||v.workflowConfig.prumoHabilitado===null)?"A campanha de Prumo está com decisão pendente. Escolha 'Realizar' na tela da inspeção antes de iniciar.":"A campanha de Prumo está desabilitada para esta inspeção."));
    const bVoltar=el("button",{class:"submit-btn",style:"margin-top:14px"},"Voltar para a inspeção");
    bVoltar.addEventListener("click",()=>go("vistoria",v.id));
    inner.appendChild(bVoltar);
    return wrap;
  }
  if(!e.visualFinalizada){inner.appendChild(el("div",{class:"card empty"},"Finalize primeiro a inspeção visual desta estrutura."));return wrap;}
  const ord=(e.montantes||[]).slice().sort((a,b)=>a.numero-b.numero);if(!m)m=ord.find((x)=>!prumoDone(x))||ord[0];if(!m){inner.appendChild(el("div",{class:"empty"},"Nenhum montante cadastrado."));return wrap;}
  setResume(v,"prumo",e,m);const idx=ord.findIndex((x)=>x.id===m.id);const prev=ord[idx-1],next=ord[idx+1];const item=prumoItem(m);normalizeMontanteItem(item);const st=montanteItemStatus(item);const resolution=prumoResolution(m);const prog=prumoProgress(e);
  const hero=Card({class:"measure-hero"});hero.appendChild(el("div",{class:"measure-kicker"},`PRUMO · Estrutura ${e.codigo||"—"}`));hero.appendChild(el("div",{class:"measure-number"},"MONTANTE ",el("strong",{},String(m.numero).padStart(3,"0")),el("span",{},` de ${ord.length}`)));hero.appendChild(el("div",{class:"measure-progress"},el("div",{class:"progress-track"},el("div",{class:"progress-fill",style:`width:${ord.length?Math.round(prog.done/ord.length*100):0}%` })),el("span",{},`${prog.done}/${ord.length} concluídos${prog.noAccess?` · ${prog.noAccess} sem acesso`:""}`)));hero.appendChild(el("div",{class:"measure-status"},Tag(resolution.resolved?st:"pendente","sm"),el("span",{id:"save-indicator",class:"save-indicator"},"✓ salvo")));inner.appendChild(hero);
  const advance=async()=>{if(!prumoDone(m)){alert("Prumo incompleto. Registre Longitudinal e Transversal antes de avançar.");return;}const p=prumoProgress(e);if(next){setResume(v,"prumo",e,next);await saveVistoriaNow();return go("prumo",v.id,e.id,next.id);}e.prumoFinalizada=p.complete;const nextE=nextStageStructure(v,e,"prumo");if(nextE){const nm=(nextE.montantes||[]).find((x)=>!prumoDone(x))||(nextE.montantes||[])[0];setResume(v,"prumo",nextE,nm);await saveVistoriaNow();return go("prumo",v.id,nextE.id,nm&&nm.id);}delete v.resume;await saveVistoriaNow();go("vistoria",v.id);};
  if(!resolution.resolved){
    if(!(item.ocorrencias||[]).length){const ok=el("button",{class:"measure-ok-btn"},"✓ L + T NA TOLERÂNCIA →");ok.addEventListener("click",async()=>{item.ocorrencias=[touchOccurrence(normalizeOccurrence({...newOcorrencia("ok"),descTxt:"COLUNA NA TOLERÂNCIA DO PRUMO",localTxt:"LONGITUDINAL / TRANSVERSAL",status:"ok"},item,"ok"))];item.revisado=true;syncMontanteItemStatus(item);touchItem(item);touchStage(e,"prumo");e.prumoFinalizada=false;await advance();});inner.appendChild(ok);}
    else inner.appendChild(el("div",{class:"draft-banner",style:"margin-top:10px"},`Resultado incompleto: ${!resolution.longitudinal?"falta Longitudinal":""}${!resolution.longitudinal&&!resolution.transversal?" e ":""}${!resolution.transversal?"falta Transversal":""}.`));
    const alt=el("div",{class:"measure-alt-grid"});const det=el("button",{class:"quick-secondary-btn"},(item.ocorrencias||[]).length?"Completar / editar eixos":"Detalhar eixos / fora de prumo");det.addEventListener("click",()=>{state.itemDetailReturn="prumo";go("itemDetail",v.id,e.id,m.id,null,item.id);});const no=el("button",{class:"quick-secondary-btn"},"Sem acesso");no.addEventListener("click",async()=>{item.ocorrencias=[touchOccurrence(normalizeOccurrence({...newOcorrencia("naoaplica"),descTxt:"COLUNA SEM ACESSO",localTxt:"LONGITUDINAL / TRANSVERSAL",status:"naoaplica"},item,"naoaplica"))];item.revisado=true;syncMontanteItemStatus(item);touchItem(item);touchStage(e,"prumo");await advance();});alt.appendChild(det);alt.appendChild(no);inner.appendChild(alt);
  } else {
    const result=Card({class:"measure-result",style:"margin-top:10px"});result.appendChild(el("div",{class:"measure-result-title"},resolution.noAccess?"Resultado: sem acesso":"Resultado registrado"));(item.ocorrencias||[]).forEach((oc)=>result.appendChild(el("div",{class:"measure-result-line"},el("strong",{},oc.localTxt||"Resultado"),el("span",{},oc.descTxt||"—"))));const edit=el("button",{class:"ghost-btn touch-btn",style:"width:100%;margin-top:8px"},"Editar resultado");edit.addEventListener("click",()=>{state.itemDetailReturn="prumo";e.prumoFinalizada=false;go("itemDetail",v.id,e.id,m.id,null,item.id);});result.appendChild(edit);inner.appendChild(result);
  }
  const nav=el("div",{class:"field-secondary-row"});const bp=el("button",{class:"ghost-btn touch-btn"},"◀ Anterior");bp.disabled=!prev;if(!prev)bp.style.opacity=".4";bp.addEventListener("click",async()=>{if(prev){setResume(v,"prumo",e,prev);await saveVistoriaNow();go("prumo",v.id,e.id,prev.id);}});nav.appendChild(bp);const exit=el("button",{class:"ghost-btn touch-btn"},"Sair do Prumo");exit.addEventListener("click",async()=>{e.prumoFinalizada=prumoProgress(e).complete;await saveVistoriaNow();go("vistoria",v.id);});nav.appendChild(exit);inner.appendChild(nav);
  if(resolution.resolved){const sticky=el("div",{class:"field-sticky no-print"});const nextE=!next?nextStageStructure(v,e,"prumo"):null;const b=el("button",{class:"field-next-btn"},next?"PRÓXIMO MONTANTE →":nextE?`✓ ${e.codigo||"ESTRUTURA"} CONCLUÍDA → ${nextE.codigo||"PRÓXIMA"}`:"✓ FINALIZAR CAMPANHA DE PRUMO");b.addEventListener("click",advance);sticky.appendChild(b);wrap.appendChild(sticky);}return wrap;
}
function LuxScreen() {
  const wrap=el("div",{class:"field-screen measure-screen",style:"padding-bottom:30px"});const inner=el("div",{class:"screen",style:"padding-top:10px"});wrap.appendChild(inner);
  const v=state.draftVistoria;const e=v&&(v.estruturas||[]).find((x)=>x.id===state.activeEstruturaId);
  if(!v||!e){inner.appendChild(el("div",{class:"empty"},"Estrutura não encontrada."));return wrap;}
  if(!e.visualFinalizada){inner.appendChild(el("div",{class:"card empty"},"Finalize primeiro a inspeção visual desta estrutura."));return wrap;}
  if(!isLuxHabilitado(v)){
    inner.appendChild(el("div",{class:"card empty"},"A campanha de Iluminação / Lux está desabilitada para esta inspeção."));
    const bVoltar = el("button", { class: "submit-btn", style: "margin-top:14px" }, "Voltar para a inspeção");
    bVoltar.addEventListener("click", () => go("vistoria", v.id));
    inner.appendChild(bVoltar);
    return wrap;
  }

  // Topo: Toggle de Estrutura sem iluminação / Não aplicável
  const naCard = Card({ style: "margin-bottom:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:8px" });
  naCard.appendChild(el("div", {},
    el("strong", {}, "Estrutura sem iluminação / Não aplicável"),
    el("div", { style: "font-size:12px;color:var(--ink-soft)" }, "Dispensa aferições de lux nesta estrutura")
  ));
  const naBtn = el("button", { class: `ghost-btn touch-btn ${e.luxNaoAplica ? "active-choice" : ""}`, style: e.luxNaoAplica ? "background:var(--primary);color:#fff;font-weight:700" : "" }, e.luxNaoAplica ? "✓ Marcada como N/A" : "Marcar como N/A");
  naBtn.addEventListener("click", async () => {
    e.luxNaoAplica = !e.luxNaoAplica;
    if (e.luxNaoAplica) {
      e.luxFinalizada = true;
      e.luxFinalizadaAt = new Date().toISOString();
    } else {
      e.luxFinalizada = false;
    }
    touchLuxNaoAplica(e);
    touchStage(e, "lux");
    await saveVistoriaNow();
    render();
  });
  naCard.appendChild(naBtn);
  inner.appendChild(naCard);

  if (e.luxNaoAplica) {
    const naNotice = Card({ class: "measure-hero lux-hero", style: "margin-bottom:14px" });
    naNotice.appendChild(el("div", { class: "measure-kicker" }, `ILUMINAÇÃO · Estrutura ${e.codigo||"—"}`));
    naNotice.appendChild(el("div", { style: "font-size:16px;font-weight:700;margin:10px 0" }, "Estrutura dispensada de medição de Lux."));
    naNotice.appendChild(el("div", { style: "font-size:13px;color:var(--ink-soft)" }, "Nenhuma medição é exigida para concluir esta estrutura."));
    inner.appendChild(naNotice);

    const finishNA = el("button", { class: "field-next-btn", style: "margin-top:14px" }, "✓ CONTINUAR PARA PRÓXIMA ESTRUTURA");
    finishNA.addEventListener("click", async () => {
      const nextE = nextStageStructure(v, e, "lux");
      if (nextE) {
        setResume(v, "lux", nextE);
        await saveVistoriaNow();
        return go("lux", v.id, nextE.id);
      }
      delete v.resume;
      await saveVistoriaNow();
      go("vistoria", v.id);
    });
    inner.appendChild(finishNA);
    return wrap;
  }

  const metodo = getLuxMetodo(v);

  // Se MÉTODO B: 1 medição por montante
  if (metodo === "B") {
    const ord = (e.montantes || []).slice().sort((a,b) => a.numero - b.numero);
    if (!ord.length) {
      inner.appendChild(el("div", { class: "card empty" }, "Nenhum montante cadastrado para esta estrutura."));
      return wrap;
    }
    let m = ord.find((x) => x.id === state.activeMontanteId);
    if (!m) m = ord.find((x) => {
      const it = montanteLuxItem(x);
      return !it || (!it.status || it.status === "pendente");
    }) || ord[0];

    setResume(v, "lux", e, m);
    const idx = ord.findIndex((x) => x.id === m.id);
    const prev = ord[idx - 1], next = ord[idx + 1];
    let item = montanteLuxItem(m);
    if (!item) {
      item = { id: "lux", codigo: "9.45", categoria: "Iluminação", familia: "Ambiente e Iluminação", nivel: "montante", nome: "Aferição de iluminação no montante", tipo: "medicao", unidade: "lux", min: 200, peca: "Aferição de iluminação no montante", status: "pendente", revisado: false, ocorrencias: [], valor: "" };
      m.itens = m.itens || [];
      m.itens.push(item);
    }
    normalizeMontanteItem(item);

    const prog = luxProgress(e, v);
    const hero = Card({ class: "measure-hero lux-hero" });
    hero.appendChild(el("div", { class: "measure-kicker" }, `ILUMINAÇÃO (MÉTODO B) · Estrutura ${e.codigo||"—"}`));
    hero.appendChild(el("div", { class: "measure-number" }, "MONTANTE ", el("strong", {}, String(m.numero).padStart(3, "0")), el("span", {}, ` de ${ord.length}`)));
    hero.appendChild(el("div", { class: "measure-progress" },
      el("div", { class: "progress-track" }, el("div", { class: "progress-fill", style: `width:${ord.length ? Math.round(prog.done / ord.length * 100) : 0}%` })),
      el("span", {}, `${prog.done}/${ord.length} avaliados · limite ≥ ${item.min} lux`)
    ));
    hero.appendChild(el("div", { class: "measure-status" },
      prog.problems ? Tag("problema", "sm", `${prog.problems} abaixo`) : (prog.complete ? Tag("ok", "sm", "Concluída") : Tag("pendente", "sm", "Em andamento")),
      el("span", { id: "save-indicator", class: "save-indicator" }, "✓ salvo")
    ));
    inner.appendChild(hero);

    const isResolved = item.status === "naoaplica" || (item.valor !== undefined && item.valor !== null && String(item.valor).trim() !== "");
    const cardM = Card({ class: "lux-measure-card", style: "margin-top:12px" });
    cardM.appendChild(el("div", { class: "occurrence-head" },
      el("div", { style: "font-weight:700" }, `Medição Montante Nº ${m.numero}`),
      Tag(item.status === "naoaplica" ? "naoaplica" : (item.valor ? statusFromMedicao(item.valor, item.min) : "pendente"), "sm", item.status === "naoaplica" ? "Não foi possível medir" : undefined)
    ));

    if (item.status === "naoaplica") {
      cardM.appendChild(el("div", { style: "padding:8px 0;font-size:13px;color:var(--ink-soft)" }, "Marcado como: Não foi possível medir neste montante."));
      const bAlt = el("button", { class: "ghost-btn touch-btn", style: "margin-top:6px" }, "Informar valor medido");
      bAlt.addEventListener("click", async () => {
        item.status = "pendente";
        item.valor = "";
        item.revisado = false;
        e.luxFinalizada = false;
        touchItem(item);
        touchStage(e, "lux");
        await saveVistoriaNow();
        render();
      });
      cardM.appendChild(bAlt);
    } else {
      const inp = inputEl(item.valor || "", (val) => {
        item.valor = val;
        item.status = statusFromMedicao(val, item.min);
        item.revisado = true;
        e.luxFinalizada = false;
        touchItem(item);
        touchStage(e, "lux");
        saveVistoriaDebounced();
      }, `Mínimo ${item.min}`, "number");
      inp.classList.add("lux-value-input");
      cardM.appendChild(Field(`Valor medido (${item.unidade})`, inp));

      const st = statusFromMedicao(item.valor, item.min);
      cardM.appendChild(el("div", { class: "measurement-hint" },
        !item.valor ? `Digite o valor medido · mínimo ${item.min} ${item.unidade}` : (st === "ok" ? `✓ Dentro do limite (≥ ${item.min} ${item.unidade})` : `⚠ Abaixo do limite (${item.min} ${item.unidade})`)
      ));

      const bNA = el("button", { class: "quick-secondary-btn", style: "margin-top:8px" }, "Não foi possível medir");
      bNA.addEventListener("click", async () => {
        item.status = "naoaplica";
        item.valor = "";
        item.revisado = true;
        e.luxFinalizada = false;
        touchItem(item);
        touchStage(e, "lux");
        await saveVistoriaNow();
        render();
      });
      cardM.appendChild(bNA);
    }

    const photoWrap = el("div", { style: "margin-top:8px" });
    renderPhotoArea(photoWrap, item, () => { touchItem(item); touchStage(e, "lux"); });
    cardM.appendChild(photoWrap);
    inner.appendChild(cardM);

    const advance = async () => {
      const currentResolved = item.status === "naoaplica" || (item.valor !== undefined && item.valor !== null && String(item.valor).trim() !== "");
      if (!currentResolved) {
        alert("Preencha o valor ou marque 'Não foi possível medir' antes de avançar.");
        return;
      }
      if (next) {
        setResume(v, "lux", e, next);
        state.activeMontanteId = next.id;
        await saveVistoriaNow();
        return render();
      }
      const p = luxProgress(e, v);
      if (!p.complete) {
        e.luxFinalizada = true;
        e.luxFinalizadaAt = new Date().toISOString();
        touchStage(e, "lux");
      }
      const nextE = nextStageStructure(v, e, "lux");
      if (nextE) {
        setResume(v, "lux", nextE);
        await saveVistoriaNow();
        return go("lux", v.id, nextE.id);
      }
      delete v.resume;
      await saveVistoriaNow();
      go("vistoria", v.id);
    };

    const nav = el("div", { class: "field-secondary-row", style: "margin-top:14px" });
    const bp = el("button", { class: "ghost-btn touch-btn" }, "◀ Anterior");
    bp.disabled = !prev;
    if (!prev) bp.style.opacity = ".4";
    bp.addEventListener("click", async () => {
      if (prev) {
        setResume(v, "lux", e, prev);
        state.activeMontanteId = prev.id;
        await saveVistoriaNow();
        render();
      }
    });
    nav.appendChild(bp);

    const exit = el("button", { class: "ghost-btn touch-btn" }, "Sair do Lux");
    exit.addEventListener("click", async () => {
      e.luxFinalizada = luxProgress(e, v).complete;
      await saveVistoriaNow();
      go("vistoria", v.id);
    });
    nav.appendChild(exit);
    inner.appendChild(nav);

    if (isResolved) {
      const sticky = el("div", { class: "field-sticky no-print" });
      const nextE = !next ? nextStageStructure(v, e, "lux") : null;
      const b = el("button", { class: "field-next-btn" }, next ? "PRÓXIMO MONTANTE →" : (nextE ? `✓ ${e.codigo||"ESTRUTURA"} CONCLUÍDA → ${nextE.codigo||"PRÓXIMA"}` : "✓ FINALIZAR CAMPANHA DE LUX"));
      b.addEventListener("click", advance);
      sticky.appendChild(b);
      wrap.appendChild(sticky);
    }
    return wrap;
  }

  // Se MÉTODO A: 3 posições fixas (Início, Meio, Final)
  if (metodo === "A") {
    const item = iluminacaoItem(e);
    if (!item) { inner.appendChild(el("div", { class: "empty" }, "Item de iluminação não encontrado no catálogo.")); return wrap; }
    item.ocorrencias = item.ocorrencias || [];
    setResume(v, "lux", e);

    const prog = luxProgress(e, v);
    const hero = Card({ class: "measure-hero lux-hero" });
    hero.appendChild(el("div", { class: "measure-kicker" }, `ILUMINAÇÃO (MÉTODO A) · Estrutura ${e.codigo||"—"}`));
    hero.appendChild(el("div", { class: "lux-main" }, el("strong", {}, `${prog.done}/3`), el("span", {}, "pontos avaliados")));
    hero.appendChild(el("div", { class: "lux-limit" }, `Limite configurado: ≥ ${item.min} ${item.unidade}`));
    hero.appendChild(el("div", { class: "measure-status" },
      prog.problems ? Tag("problema", "sm", `${prog.problems} abaixo`) : (prog.complete ? Tag("ok", "sm", "Concluída") : Tag("pendente", "sm", "Em andamento")),
      el("span", { id: "save-indicator", class: "save-indicator" }, "✓ salvo")
    ));
    inner.appendChild(hero);

    const POSICOES = [
      { id: "inicio", label: "Início do corredor" },
      { id: "meio", label: "Meio do corredor" },
      { id: "final", label: "Final do corredor" }
    ];

    const list = el("div", { class: "lux-list", style: "display:flex;flex-direction:column;gap:10px;margin-top:12px" });

    POSICOES.forEach(({ id: posId, label: posLabel }) => {
      let oc = item.ocorrencias.find((o) => (o.posicao || "").toLowerCase() === posId);
      const cardP = Card({ class: "lux-measure-card" });
      const head = el("div", { class: "occurrence-head" },
        el("div", { style: "font-weight:700" }, posLabel),
        Tag(oc ? (oc.status === "naoaplica" ? "naoaplica" : (oc.valor ? statusFromMedicao(oc.valor, item.min) : "pendente")) : "pendente", "sm", oc && oc.status === "naoaplica" ? "Não foi possível medir" : undefined)
      );
      cardP.appendChild(head);

      if (!oc) {
        const emptyState = el("div", { style: "padding:8px 0;display:flex;gap:8px;flex-wrap:wrap" });
        const bMed = el("button", { class: "ghost-btn touch-btn primary" }, "＋ Informar medição");
        bMed.addEventListener("click", async () => {
          const novaOc = touchOccurrence(newOcorrencia("pendente"));
          novaOc.posicao = posId;
          novaOc.montanteRef = posLabel;
          item.ocorrencias.push(novaOc);
          e.luxFinalizada = false;
          touchStage(e, "lux");
          await saveVistoriaNow();
          render();
        });
        const bNA = el("button", { class: "quick-secondary-btn" }, "Não foi possível medir");
        bNA.addEventListener("click", async () => {
          const novaOc = touchOccurrence(newOcorrencia("naoaplica"));
          novaOc.posicao = posId;
          novaOc.montanteRef = posLabel;
          novaOc.status = "naoaplica";
          novaOc.descTxt = "Não foi possível medir";
          item.ocorrencias.push(novaOc);
          e.luxFinalizada = false;
          touchStage(e, "lux");
          await saveVistoriaNow();
          render();
        });
        emptyState.appendChild(bMed);
        emptyState.appendChild(bNA);
        cardP.appendChild(emptyState);
      } else if (oc.status === "naoaplica") {
        cardP.appendChild(el("div", { style: "padding:6px 0;font-size:13px;color:var(--ink-soft)" }, "Ponto marcado como: Não foi possível medir."));
        const btnRow = el("div", { style: "display:flex;gap:8px;align-items:center;margin-top:6px" });
        const bMudar = el("button", { class: "ghost-btn touch-btn" }, "Informar valor numérico");
        bMudar.addEventListener("click", async () => {
          oc.status = "pendente";
          oc.valor = "";
          oc.descTxt = "";
          e.luxFinalizada = false;
          touchOccurrenceFull(oc, item, e);
          await saveVistoriaNow();
          render();
        });
        const bDel = el("button", { class: "icon-btn", html: svg("trash", 15) });
        bDel.addEventListener("click", async () => {
          recordTombstone(v, "ocorrencias", oc.id);
          const idx = item.ocorrencias.indexOf(oc);
          if (idx >= 0) item.ocorrencias.splice(idx, 1);
          e.luxFinalizada = false;
          touchStage(e, "lux");
          await saveVistoriaNow();
          render();
        });
        btnRow.appendChild(bMudar);
        btnRow.appendChild(bDel);
        cardP.appendChild(btnRow);

        const photoWrap = el("div", { style: "margin-top:6px" });
        renderPhotoArea(photoWrap, oc, () => touchOccurrenceFull(oc, item, e));
        cardP.appendChild(photoWrap);
      } else {
        const inp = inputEl(oc.valor || "", (val) => {
          oc.valor = val;
          oc.status = statusFromMedicao(val, item.min);
          e.luxFinalizada = false;
          touchOccurrenceFull(oc, item, e);
          saveVistoriaDebounced();
        }, `Mínimo ${item.min}`, "number");
        inp.classList.add("lux-value-input");
        cardP.appendChild(Field(`Valor medido (${item.unidade})`, inp));

        const st = statusFromMedicao(oc.valor, item.min);
        cardP.appendChild(el("div", { class: "measurement-hint" },
          !oc.valor ? `Digite o valor medido · mínimo ${item.min} ${item.unidade}` : (st === "ok" ? `✓ Dentro do limite (≥ ${item.min} ${item.unidade})` : `⚠ Abaixo do limite (${item.min} ${item.unidade})`)
        ));

        const btnRow = el("div", { style: "display:flex;gap:8px;align-items:center;margin-top:6px" });
        const bNA = el("button", { class: "quick-secondary-btn" }, "Não foi possível medir");
        bNA.addEventListener("click", async () => {
          oc.status = "naoaplica";
          oc.valor = "";
          oc.descTxt = "Não foi possível medir";
          e.luxFinalizada = false;
          touchOccurrenceFull(oc, item, e);
          await saveVistoriaNow();
          render();
        });
        const bDel = el("button", { class: "icon-btn", html: svg("trash", 15) });
        bDel.addEventListener("click", async () => {
          recordTombstone(v, "ocorrencias", oc.id);
          const idx = item.ocorrencias.indexOf(oc);
          if (idx >= 0) item.ocorrencias.splice(idx, 1);
          e.luxFinalizada = false;
          touchStage(e, "lux");
          await saveVistoriaNow();
          render();
        });
        btnRow.appendChild(bNA);
        btnRow.appendChild(bDel);
        cardP.appendChild(btnRow);

        const photoWrap = el("div", { style: "margin-top:6px" });
        renderPhotoArea(photoWrap, oc, () => touchOccurrenceFull(oc, item, e));
        cardP.appendChild(photoWrap);
      }
      list.appendChild(cardP);
    });

    inner.appendChild(list);

    const finish = el("button", { class: "field-next-btn", style: "margin-top:16px" }, e.luxFinalizada ? "✓ ETAPA LUX CONCLUÍDA — CONTINUAR" : "✓ FINALIZAR LUX DESTA ESTRUTURA");
    finish.addEventListener("click", async () => {
      const p = luxProgress(e, v);
      if (!p.complete && !e.luxFinalizada) {
        if (p.done < 3) return alert(`Preencha ou justifique os 3 pontos (Início, Meio e Final) antes de finalizar a etapa de Lux (faltam ${3 - p.done}).`);
        e.luxFinalizada = true;
        e.luxFinalizadaAt = new Date().toISOString();
        touchStage(e, "lux");
      }
      const nextE = nextStageStructure(v, e, "lux");
      if (nextE) {
        setResume(v, "lux", nextE);
        await saveVistoriaNow();
        return go("lux", v.id, nextE.id);
      }
      delete v.resume;
      await saveVistoriaNow();
      go("vistoria", v.id);
    });
    inner.appendChild(finish);
    return wrap;
  }

  // Se MÉTODO LEGADO (v2.18.8 intacto):
  const item = iluminacaoItem(e);
  if (!item) { inner.appendChild(el("div", { class: "empty" }, "Item 9.45 de iluminação não encontrado no catálogo.")); return wrap; }
  item.ocorrencias = item.ocorrencias || [];
  setResume(v, "lux", e);
  const prog = luxProgress(e, v);
  const hero = Card({ class: "measure-hero lux-hero" });
  hero.appendChild(el("div", { class: "measure-kicker" }, `ILUMINAÇÃO (LEGADO) · Estrutura ${e.codigo||"—"}`));
  hero.appendChild(el("div", { class: "lux-main" }, el("strong", {}, String(prog.measurements)), el("span", {}, prog.measurements === 1 ? "aferição válida" : "aferições válidas")));
  hero.appendChild(el("div", { class: "lux-limit" }, `Limite configurado: ≥ ${item.min} ${item.unidade}`));
  hero.appendChild(el("div", { class: "measure-status" },
    prog.problems ? Tag("problema", "sm", `${prog.problems} abaixo`) : (prog.complete ? Tag("ok", "sm", "Concluída") : Tag("pendente", "sm", "Em andamento")),
    el("span", { id: "save-indicator", class: "save-indicator" }, "✓ salvo")
  ));
  inner.appendChild(hero);

  const list = el("div", { class: "lux-list" });
  const renderLuxCard = (oc, idx) => {
    normalizeOccurrence(oc, item, "pendente");
    const c = Card({ class: "lux-measure-card" });
    c.appendChild(el("div", { class: "occurrence-head" },
      el("div", {}, el("div", { style: "font-weight:700" }, `Aferição ${idx + 1}`), Tag(Boolean(String(oc.montanteRef || "").trim()) ? ocorrenciaStatus(oc, item) : "pendente", "sm")),
      (() => {
        const b = el("button", { class: "icon-btn", html: svg("trash", 15) });
        b.addEventListener("click", async () => {
          if (confirm("Remover esta aferição?")) {
            recordTombstone(v, "ocorrencias", oc.id);
            item.ocorrencias.splice(idx, 1);
            e.luxFinalizada = false;
            touchStage(e, "lux");
            await saveVistoriaNow();
            render();
          }
        });
        return b;
      })()
    ));
    const montanteRefs = (e.montantes || []).slice().sort((a, b) => a.numero - b.numero).map((m) => `Montante ${m.numero}`);
    const refField = choiceOrCustomField("Montante / posição de referência", oc.montanteRef || "", montanteRefs, (val) => {
      oc.montanteRef = val;
      e.luxFinalizada = false;
      touchOccurrenceFull(oc, item, e);
      saveVistoriaDebounced();
    }, "Ex: Centro do corredor");
    refField.classList.add("lux-ref-field");
    c.appendChild(refField);

    const inp = inputEl(oc.valor || "", (val) => {
      oc.valor = val;
      oc.status = statusFromMedicao(val, item.min);
      e.luxFinalizada = false;
      touchOccurrenceFull(oc, item, e);
      saveVistoriaDebounced();
    }, `Mínimo ${item.min}`, "number");
    inp.classList.add("lux-value-input");
    c.appendChild(Field(`Valor medido (${item.unidade})`, inp));

    const st = statusFromMedicao(oc.valor, item.min);
    const hasRef = Boolean(String(oc.montanteRef || "").trim());
    c.appendChild(el("div", { class: "measurement-hint" },
      !hasRef ? "Selecione primeiro o montante / posição de referência." : (!oc.valor ? `Digite o valor medido · mínimo ${item.min} ${item.unidade}` : (st === "ok" ? `✓ Dentro do limite (≥ ${item.min} ${item.unidade})` : `⚠ Abaixo do limite (${item.min} ${item.unidade})`))
    ));
    const photoWrap = el("div", { style: "margin-top:6px" });
    renderPhotoArea(photoWrap, oc, () => touchOccurrenceFull(oc, item, e));
    c.appendChild(photoWrap);
    return c;
  };

  item.ocorrencias.forEach((oc, idx) => list.appendChild(renderLuxCard(oc, idx)));
  if (!item.ocorrencias.length) list.appendChild(el("div", { class: "card empty" }, "Nenhuma aferição ainda. Registre os pontos definidos pelo técnico para esta estrutura."));
  inner.appendChild(list);

  const add = el("button", { class: "measure-add-btn" }, "＋ Adicionar aferição");
  add.addEventListener("click", async () => {
    item.ocorrencias.push(touchOccurrence(newOcorrencia("pendente")));
    e.luxFinalizada = false;
    touchStage(e, "lux");
    await saveVistoriaNow();
    render();
    setTimeout(() => {
      const cards = [...document.querySelectorAll(".lux-measure-card")];
      const last = cards[cards.length - 1];
      const select = last && last.querySelector(".lux-ref-field select");
      if (select) select.focus();
    }, 120);
  });
  inner.appendChild(add);

  const finish = el("button", { class: "field-next-btn", style: "margin-top:12px" }, e.luxFinalizada ? "✓ ETAPA LUX CONCLUÍDA — CONTINUAR" : "✓ FINALIZAR LUX DESTA ESTRUTURA");
  finish.addEventListener("click", async () => {
    const p = luxProgress(e, v);
    if (!e.luxFinalizada) {
      if (!item.ocorrencias.length) return alert("Registre pelo menos uma aferição antes de finalizar a etapa de Lux.");
      const noRef = item.ocorrencias.filter((oc) => !String(oc.montanteRef || "").trim()).length;
      if (noRef) return alert(`Há ${noRef} aferição(ões) sem montante / posição de referência.`);
      if (p.pending) return alert(`Há ${p.pending} aferição(ões) sem valor válido.`);
      e.luxFinalizada = true;
      e.luxFinalizadaAt = new Date().toISOString();
      touchStage(e, "lux");
    }
    const nextE = nextStageStructure(v, e, "lux");
    if (nextE) {
      setResume(v, "lux", nextE);
      await saveVistoriaNow();
      return go("lux", v.id, nextE.id);
    }
    delete v.resume;
    await saveVistoriaNow();
    go("vistoria", v.id);
  });
  inner.appendChild(finish);
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
  const wrap=el("div",{class:"screen",style:"padding-bottom:30px"}); const v=state.draftVistoria; const e=v&&(v.estruturas||[]).find((x)=>x.id===state.activeEstruturaId); const m=e&&(e.montantes||[]).find((x)=>x.id===state.activeMontanteId); const item=m&&(m.itens||[]).find((x)=>x.id===state.activeChecklistItemId);
  if(!v||!e||!m||!item){wrap.appendChild(el("div",{class:"empty"},"Item não encontrado."));return wrap;}
  normalizeMontanteItem(item);
  wrap.appendChild(el("div",{class:"field-context"},`Estrutura ${e.codigo||"—"} · Montante ${m.numero}`)); wrap.appendChild(el("div",{class:"item-title-large"},CodeBadge(item.codigo),item.nome)); wrap.appendChild(el("div",{style:"display:flex;align-items:center;justify-content:space-between;margin:8px 0 14px"},Tag(montanteItemStatus(item)),el("span",{id:"save-indicator",class:"save-indicator"},"✓ Salvo")));
  if(item.id!=="prumo"){
    if(!(item.ocorrencias||[]).length){const actions=el("div",{class:"item-action-grid"});const ok=el("button",{class:"field-ok-btn"},"✓ Conforme");ok.addEventListener("click",async()=>{item.revisado=true;item.status="ok";touchItem(item);touchStage(e,"visual");await saveVistoriaNow();render();});const na=el("button",{class:"quick-secondary-btn"},"N/A");na.addEventListener("click",async()=>{item.revisado=true;item.status="naoaplica";touchItem(item);touchStage(e,"visual");await saveVistoriaNow();render();});actions.appendChild(ok);actions.appendChild(na);wrap.appendChild(actions);}
    else wrap.appendChild(el("div",{class:"draft-banner"},`Este item possui ${(item.ocorrencias||[]).length} ocorrência(s). Para marcá-lo Conforme/N/A, remova explicitamente as ocorrências primeiro.`));
  } else {
    const r=prumoResolution(m); if(!r.resolved && (item.ocorrencias||[]).length) wrap.appendChild(el("div",{class:"draft-banner"},`Prumo incompleto: ${!r.longitudinal?"falta Longitudinal":""}${!r.longitudinal&&!r.transversal?" e ":""}${!r.transversal?"falta Transversal":""}.`));
    const q=el("button",{class:"field-ok-btn",style:"width:100%;margin:10px 0"},"✓ Longitudinal + Transversal na tolerância");q.addEventListener("click",async()=>{if((item.ocorrencias||[]).length&&!confirm("Substituir os resultados atuais por L + T na tolerância?"))return;item.ocorrencias=[touchOccurrence(normalizeOccurrence({...newOcorrencia("ok"),descTxt:"COLUNA NA TOLERÂNCIA DO PRUMO",localTxt:"LONGITUDINAL / TRANSVERSAL",status:"ok"},item,"ok"))];item.revisado=true;syncMontanteItemStatus(item);touchItem(item);touchStage(e,"prumo");await saveVistoriaNow();render();});wrap.appendChild(q);
  }
  const list=el("div",{style:"display:flex;flex-direction:column;gap:10px;margin-top:10px"}); (item.ocorrencias||[]).forEach((oc,idx)=>list.appendChild(MontanteOcorrenciaCard(oc,idx,item,e))); wrap.appendChild(list);
  const add=el("button",{class:"quick-anomaly-btn",style:"width:100%;margin-top:12px"},el("span",{html:svg("plus",18)}),item.id==="prumo"?"Adicionar resultado / eixo":"Adicionar outra ocorrência");
  add.addEventListener("click",async()=>{if(item.id!=="prumo")return startNewAnomaly(v,e,m,item);const novaOc=touchOccurrence(newOcorrencia("pendente"));item.ocorrencias=item.ocorrencias||[];item.ocorrencias.push(novaOc);item.status="pendente";touchItem(item);touchStage(e,"prumo");e.prumoFinalizada=false;await saveVistoriaNow();render();});wrap.appendChild(add);
  wrap.appendChild(el("div",{class:"field-mode-hint",style:"margin-top:8px"},item.id==="prumo"?"Para concluir o montante, registre os dois eixos (Longitudinal e Transversal), ou use L + T na tolerância.":"O mesmo código pode ter vários registros no mesmo montante. Cada registro pode ter até 4 fotos."));
  const returnToPrumo=state.itemDetailReturn==="prumo"; const back=el("button",{class:"submit-btn",style:"width:100%;margin-top:16px"},returnToPrumo?"Voltar para o modo Prumo":"Voltar para o montante"); back.addEventListener("click",async()=>{if(item.id==="prumo"){item.ocorrencias=(item.ocorrencias||[]).filter((oc)=>occurrenceHasMeaningfulData(oc));syncMontanteItemStatus(item);e.prumoFinalizada=prumoProgress(e).complete;}await saveVistoriaNow();go(returnToPrumo?"prumo":"montante",v.id,e.id,m.id);});wrap.appendChild(back);return wrap;
}
function MontanteOcorrenciaCard(oc,idx,item,e){
  normalizeOccurrence(oc,item,item.id==="prumo"?"pendente":"problema");
  const card=Card({class:"occurrence-card",style:"padding:12px"}); const st=ocorrenciaStatus(oc,item);
  card.appendChild(el("div",{class:"occurrence-head"},el("div",{},el("div",{style:"font-weight:700"},item.id==="prumo"?`Resultado ${idx+1}`:`Ocorrência ${idx+1}`),Tag(st,"sm")),(()=>{const b=el("button",{class:"icon-btn",html:svg("trash",15)});b.addEventListener("click",async()=>{if(confirm("Remover este registro?")){recordTombstone(state.draftVistoria,"ocorrencias",oc.id);item.ocorrencias.splice(idx,1);syncMontanteItemStatus(item);touchItem(item);touchStage(e,stageForItem(item));await saveVistoriaNow();render();}});return b;})()));
  if(item.descOpcoes)card.appendChild(Field("Descrição / resultado",suggestInput(oc.descTxt,(val)=>{oc.descTxt=val;oc.status=ocorrenciaStatus(oc,item);syncMontanteItemStatus(item);touchOccurrenceFull(oc,item,e);saveVistoriaDebounced();},"Selecione ou digite",item.descOpcoes)));
  if(item.tipoOpcoes)card.appendChild(Field("Tipo / componente",suggestInput(oc.tipoTxt,(val)=>{oc.tipoTxt=val;touchOccurrenceFull(oc,item,e);saveVistoriaDebounced();},"Tipo",item.tipoOpcoes)));
  card.appendChild(Field("Nível",inputEl(oc.corte||"",(val)=>{oc.corte=val;touchOccurrenceFull(oc,item,e);saveVistoriaDebounced();},"Ex: 1, 3, 18")));
  if(item.localOpcoes)card.appendChild(Field(item.localLabel||"Localização",suggestInput(oc.localTxt,(val)=>{oc.localTxt=val;oc.status=ocorrenciaStatus(oc,item);syncMontanteItemStatus(item);touchOccurrenceFull(oc,item,e);saveVistoriaDebounced();},"Localização",item.localOpcoes)));
  if(item.id!=="prumo")card.appendChild(Field("Grau",suggestInput(oc.grauTxt,(val)=>{oc.grauTxt=val;touchOccurrenceFull(oc,item,e);saveVistoriaDebounced();},"Leve, Médio, Grave, Gravíssimo",GRAU_OPCOES)));
  const obs=el("textarea",{class:"input",rows:2,placeholder:"Observação (opcional)"});obs.value=oc.obs||"";obs.addEventListener("input",(ev)=>{oc.obs=ev.target.value;touchOccurrenceFull(oc,item,e);saveVistoriaDebounced();});card.appendChild(el("div",{class:"field"},el("label",{},"Observações"),obs));
  card.appendChild(Field("Quantidade",inputEl(oc.qtd==null?1:oc.qtd,(val)=>{oc.qtd=val;touchOccurrenceFull(oc,item,e);saveVistoriaDebounced();},"1","number")));
  const photos=el("div",{});renderPhotoArea(photos,oc,()=>touchOccurrenceFull(oc,item,e));card.appendChild(photos);return card;
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
function renderPhotoArea(container, item, onTouch) {
  container.innerHTML = "";
  item.fotos = occurrencePhotoRefs(item);
  const label = el("div", { class: "photo-label" }, `Fotos (${item.fotos.length})`, el("span", {}, "até 1200 px · JPEG 72%"));
  container.appendChild(label);
  const grid = el("div", { class: "photo-grid" });

  item.fotos.forEach((photoId, idx) => {
    const wrap = el("div", { class: "photo-wrap" });
    const img = el("img", { class: "photo-thumb", alt: "Evidência" });
    const btnRemove = el("button", { class: "photo-remove", html: svg("x", 12) });

    PhotoUrlManager.resolveThumbUrl(photoId).then((url) => {
      if (url) img.src = url;
    });

    btnRemove.addEventListener("click", async () => {
      const removedId = item.fotos[idx];
      item.fotos.splice(idx, 1);
      if (state.draftVistoria && removedId) {
        recordTombstone(state.draftVistoria, "photos", removedId);
      }
      if (onTouch) onTouch();
      await saveVistoriaNow();
      renderPhotoArea(container, item, onTouch);
    });

    wrap.appendChild(img);
    wrap.appendChild(btnRemove);
    grid.appendChild(wrap);
  });

  if (item.fotos.length < 4) {
    const btn = el("button", { class: "photo-add-btn photo-tile" }, el("span", { html: svg("camera", 20) }), item.fotos.length ? "Outra foto" : "Anexar foto");
    const input = el("input", { type: "file", accept: "image/*", capture: "environment", style: "display:none" });
    input.addEventListener("change", async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      try {
        const { blob, width, height, size, mimeType } = await resizeImageToBlob(file);
        const photoId = "pho_" + uid();
        const vistoriaId = (state.draftVistoria && state.draftVistoria.id) || state.activeVistoriaId || "temp";
        const occurrenceId = item.id || uid();
        const record = {
          id: photoId,
          vistoriaId,
          occurrenceId,
          blob,
          mimeType,
          width,
          height,
          size,
          createdAt: nowIso(),
          deviceOrigin: getDeviceId(),
          updatedAt: nowIso(),
          deletedAt: null
        };
        PhotoUrlManager.registerBlob(photoId, blob);
        item.fotos = occurrencePhotoRefs(item);
        item.fotos.push(photoId);
        if (onTouch) onTouch();
        if (state.draftVistoria) {
          syncVistoriaListEntry(state.draftVistoria);
          const items = [
            { store: "photos", key: undefined, value: record },
            { store: "vistorias", key: undefined, value: compactVistoriaForStorage(state.draftVistoria) }
          ];
          await idbTransactionApply(items);
          await persistVistoriaList();
          updateSaveIndicator();
        } else {
          await idbSet("photos", photoId, record);
        }
        renderPhotoArea(container, item, onTouch);
      } catch (err) {
        console.error(err);
        alert("Não foi possível processar a foto.");
      }
    });
    btn.addEventListener("click", () => input.click());
    grid.appendChild(btn);
    grid.appendChild(input);
  }
  container.appendChild(grid);
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
/* ---------------- Geração de PDF sob demanda (Baixar/PDF e Compartilhar usam o mesmo motor) ---------------- */
let jsPdfLoadPromise = null;
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar " + src));
    document.head.appendChild(script);
  });
}
// v2.19.2: tenta o jsPDF vendorizado localmente (./vendor/jspdf.umd.min.js — pré-cacheado no APP_SHELL
// do service worker, funciona offline/modo avião desde a primeira instalação). O CDN só entra como
// fallback de última instância (ex: arquivo local ainda não foi vendorizado, ou instalação antiga do
// app antes deste arquivo existir no cache) — nunca é necessário pro funcionamento normal.
function loadJsPdf() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPdfLoadPromise) return jsPdfLoadPromise;
  jsPdfLoadPromise = (async () => {
    try { await loadScriptOnce("./vendor/jspdf.umd.min.js"); } catch (e) { /* segue pro CDN abaixo */ }
    if (!(window.jspdf && window.jspdf.jsPDF)) {
      // Local não carregou OU carregou mas não definiu jsPDF (ex: placeholder ainda não substituído).
      await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    }
    if (!(window.jspdf && window.jspdf.jsPDF)) throw new Error("Gerador de PDF carregado, mas jsPDF não ficou disponível.");
    return window.jspdf.jsPDF;
  })().catch((err) => { jsPdfLoadPromise = null; throw new Error("Não foi possível carregar o gerador de PDF: " + (err && err.message || "sem internet e o arquivo local ainda não foi instalado")); });
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
async function loadPhotoDataUrl(photoId, contextText = "") {
  if (!photoId) return null;
  if (typeof photoId === "string" && photoId.startsWith("data:image")) return photoId;
  const record = await idbGet("photos", photoId);
  if (!record || !record.blob) return null;
  const createdFormatted = record.createdAt ? fmtDate(record.createdAt) : "";
  const line1 = [state.config.empresa, contextText].filter(Boolean).join(" · ");
  const line2 = createdFormatted;
  return renderWatermarkedDataUrl(record.blob, line1, line2);
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
  text([v.local, (v.estruturas || []).length + " estrutura(s)", "Inspetor(es): " + (v.inspetor || "—"), fmtDateOnly(v.data)].filter(Boolean).join("  ·  "), 10, { color: "#5B6470", gap: 12 });

  // Seção de Campanhas no Laudo PDF
  ensureSpace(40);
  text("CAMPANHAS DA INSPEÇÃO", 11, { bold: true, gap: 4 });
  text("• Inspeção Visual: Concluída", 9.5, { color: "#374151", gap: 3 });
  if (!isPrumoHabilitado(v)) {
    text(`• Prumo a Laser: Não realizado — Motivo: ${v.workflowConfig && v.workflowConfig.prumoMotivo || "Não informado"}`, 9.5, { color: "#374151", gap: 3 });
  } else {
    text("• Prumo a Laser: Realizado", 9.5, { color: "#374151", gap: 3 });
  }

  if (!isLuxHabilitado(v)) {
    text(`• Iluminação / Lux: Não realizada — Motivo: ${v.workflowConfig && v.workflowConfig.luxMotivo || "Não informado"}`, 9.5, { color: "#374151", gap: 10 });
  } else {
    const met = getLuxMetodo(v);
    const metNome = met === "A" ? "Método A (3 pontos fixos: Início, Meio e Final)" : (met === "B" ? "Método B (1 medição por montante)" : "Legado");
    const allLuxPoints = [];
    let estruturasDispensadas = 0;
    (v.estruturas || []).forEach((e) => {
      if (e.luxNaoAplica) { estruturasDispensadas++; return; }
      if (met === "B") {
        (e.montantes || []).forEach((m) => {
          const it = montanteLuxItem(m);
          if (it) allLuxPoints.push(it);
        });
      } else {
        const it = iluminacaoItem(e);
        if (it && Array.isArray(it.ocorrencias)) allLuxPoints.push(...it.ocorrencias);
      }
    });
    const stats = calculateLuxStats(allLuxPoints);
    let statText = `• Iluminação / Lux: Realizada — ${metNome}`;
    if (stats.count > 0) statText += ` · Média: ${stats.avg} lux · Mínimo: ${stats.min} lux · Máximo: ${stats.max} lux`;
    if (stats.naoAplicaCount > 0) statText += ` · ${stats.naoAplicaCount} ponto(s) não foi possível medir`;
    if (estruturasDispensadas > 0) statText += ` · ${estruturasDispensadas} estrutura(s) dispensada(s)`;
    text(statText, 9.5, { color: "#374151", gap: 10 });
  }

  for (const e of (v.estruturas || [])) {
    ensureSpace(30);
    text(`Estrutura ${e.codigo || "—"}`, 13, { bold: true, gap: 2 });
    const sub = [e.setor, e.tipoEstrutura, e.rua && "Rua " + e.rua, e.lado && "Lado " + e.lado, e.fabricante].filter(Boolean).join("  ·  ");
    if (sub) text(sub, 9, { color: "#9AA2AC", gap: 4 });
    if (e.observacoesGerais) text("Observações da estrutura: " + e.observacoesGerais, 9, { color: "#5B6470", gap: 8 });

    const problemEntries = montanteAnomalyEntries(e);
    const estOcorrencias = estruturaAnomalyOccurrences(e);
    const estMedicoes = estruturaMedicoesInformativas(e);

    if (!problemEntries.length && !estOcorrencias.length) {
      text("Nenhum apontamento de anomalia registrado.", 10, { color: "#5B6470", gap: 8 });
    }
    if (e.luxNaoAplica) {
      text("Iluminação / Lux: Estrutura sem iluminação / Não aplicável.", 9.5, { color: "#5B6470", gap: 4 });
    }
    for (const { it, oc } of estMedicoes) {
      if (oc.status === "naoaplica") {
        text(`${it.codigo ? "[" + it.codigo + "] " : ""}${it.nome} — ${oc.posicao || oc.montanteRef || "Ponto"}: Não foi possível medir`, 9.5, { color: "#5B6470", gap: 4 });
      } else {
        text(`${it.codigo ? "[" + it.codigo + "] " : ""}${it.nome} — ${oc.posicao || oc.montanteRef || "Ponto"}: ${oc.valor} ${it.unidade}`, 9.5, { color: "#476B55", gap: 4 });
      }
    }
    if (!problemEntries.length && !estOcorrencias.length) continue;

    for (const { it, oc } of estOcorrencias) {
      ensureSpace(50);
      text(`${it.codigo ? "[" + it.codigo + "] " : ""}${it.nome}  —  ${oc.montanteRef || "Estrutura (geral)"}`, 10.5, { bold: true, gap: 2 });
      const detailsEst = [oc.descTxt && "Descrição: " + oc.descTxt, oc.tipoTxt && "Tipo: " + oc.tipoTxt, oc.localTxt && "Localização: " + oc.localTxt, oc.grauTxt && "Grau: " + oc.grauTxt, it.tipo === "medicao" && oc.valor && "Medição: " + oc.valor + " " + it.unidade, oc.qtd && "Qtd: " + oc.qtd].filter(Boolean).join("  ·  ");
      if (detailsEst) text(detailsEst, 9, { color: "#5B6470", gap: 2 });
      if (oc.obs) text("Obs: " + oc.obs, 9, { color: "#5B6470", gap: 4 });
      for (const photoId of occurrencePhotoRefs(oc)) {
        try {
          const foto = await loadPhotoDataUrl(photoId, `${e.codigo || "EST"} · ESTRUTURA`);
          if (foto) {
            ensureSpace(110);
            doc.addImage(foto, "JPEG", marginX, y, 100, 100);
            y += 108;
          }
        } catch (err) { /* ignora foto que falhar */ }
      }
      y += 6;
    }

    for (const { m, i } of problemEntries) {
      ensureSpace(50);
      text(`${i.codigo ? "[" + i.codigo + "] " : ""}${i.nome}  —  Montante Nº ${m.numero}`, 10.5, { bold: true, gap: 2 });
      const details = [i.descTxt && "Descrição: " + i.descTxt, i.tipoTxt && "Tipo: " + i.tipoTxt, i.localTxt && "Localização: " + i.localTxt, i.grauTxt && "Grau: " + i.grauTxt, i.corte && "Nível: " + i.corte, i.qtd && "Qtd: " + i.qtd].filter(Boolean).join("  ·  ");
      if (details) text(details, 9, { color: "#5B6470", gap: 2 });
      if (m.observacoes) text("Obs. montante: " + m.observacoes, 9, { color: "#5B6470", gap: 2 });
      if (i.obs) text("Obs. ocorrência: " + i.obs, 9, { color: "#5B6470", gap: 4 });
      for (const photoId of occurrencePhotoRefs(i)) {
        try {
          const foto = await loadPhotoDataUrl(photoId, `${e.codigo || "EST"} · M${m.numero}`);
          if (foto) {
            ensureSpace(110);
            doc.addImage(foto, "JPEG", marginX, y, 100, 100);
            y += 108;
          }
        } catch (err) { /* ignora foto que falhar */ }
      }
      y += 6;
    }
  }

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
// v2.19.2: motor único compartilhado por "Baixar / PDF" e "Compartilhar" — os dois pedem exatamente o
// mesmo Blob PDF real (via buildInspectionPdf) e o mesmo nome de arquivo, em vez de cada botão ter sua
// própria implementação. Lança se a geração falhar — quem chama decide como mostrar o erro.
async function prepareInspectionPdf(v) {
  const blob = await buildInspectionPdf(v);
  const filename = `relatorio-${slug(v.lojaCd)}.pdf`;
  return { blob, filename };
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

  const wfReportCard = el("div", { class: "card", style: "margin-bottom:16px;border-left:4px solid var(--primary);padding:12px 14px" });
  wfReportCard.appendChild(el("div", { style: "font-weight:700;font-size:13.5px;margin-bottom:6px" }, "Campanhas da Inspeção"));
  wfReportCard.appendChild(el("div", { style: "font-size:12.5px;margin-bottom:3px" }, "• Inspeção Visual: Concluída"));
  if (!isPrumoHabilitado(v)) {
    wfReportCard.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-bottom:3px" }, `• Prumo a Laser: Não realizado — Motivo: ${v.workflowConfig && v.workflowConfig.prumoMotivo || "Não informado"}`));
  } else {
    wfReportCard.appendChild(el("div", { style: "font-size:12.5px;margin-bottom:3px" }, "• Prumo a Laser: Realizado"));
  }
  if (!isLuxHabilitado(v)) {
    wfReportCard.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft)" }, `• Iluminação / Lux: Não realizada — Motivo: ${v.workflowConfig && v.workflowConfig.luxMotivo || "Não informado"}`));
  } else {
    const met = getLuxMetodo(v);
    const metNome = met === "A" ? "Método A (3 pontos fixos: Início, Meio e Final)" : (met === "B" ? "Método B (1 medição por montante)" : "Legado");
    const allLuxPoints = [];
    let estruturasDispensadas = 0;
    (v.estruturas || []).forEach((e) => {
      if (e.luxNaoAplica) { estruturasDispensadas++; return; }
      if (met === "B") {
        (e.montantes || []).forEach((m) => {
          const it = montanteLuxItem(m);
          if (it) allLuxPoints.push(it);
        });
      } else {
        const it = iluminacaoItem(e);
        if (it && Array.isArray(it.ocorrencias)) allLuxPoints.push(...it.ocorrencias);
      }
    });
    const stats = calculateLuxStats(allLuxPoints);
    let statText = `• Iluminação / Lux: Realizada — ${metNome}`;
    if (stats.count > 0) statText += ` · Média: ${stats.avg} lux · Mínimo: ${stats.min} lux · Máximo: ${stats.max} lux`;
    if (stats.naoAplicaCount > 0) statText += ` · ${stats.naoAplicaCount} ponto(s) não foi possível medir`;
    if (estruturasDispensadas > 0) statText += ` · ${estruturasDispensadas} estrutura(s) dispensada(s)`;
    wfReportCard.appendChild(el("div", { style: "font-size:12.5px" }, statText));
  }
  printable.appendChild(wfReportCard);

  const topActions = el("div", { class: "no-print", style: "display:flex;flex-direction:column;gap:8px;margin-bottom:18px" });
  const btnAnomalias = el("button", { class: "action-btn", style: "background:var(--amber-bg);color:var(--amber-dark);border:1px solid var(--line)" }, el("span", { html: svg("wrench", 15) }), " Relatório de Anomalias (tabela / CSV)");
  btnAnomalias.addEventListener("click", () => go("anomalias", v.id));
  topActions.appendChild(btnAnomalias);
  const row1 = el("div", { class: "row" });
  const btnPdf = el("button", { class: "action-btn", style: "background:var(--ink);color:#fff" }, el("span", { html: svg("download", 16) }), " Baixar / PDF");
  btnPdf.addEventListener("click", async () => {
    if (btnPdf.disabled) return; // impede duplo clique
    btnPdf.disabled = true;
    const oldHtml = btnPdf.innerHTML;
    btnPdf.innerHTML = "Gerando PDF...<br><small style=\"font-weight:400\">Preparando evidências</small>";
    try {
      const { blob, filename } = await prepareInspectionPdf(v);
      download(filename, blob, "application/pdf");
      btnPdf.innerHTML = "✓ PDF gerado com sucesso";
      setTimeout(() => { btnPdf.innerHTML = oldHtml; btnPdf.disabled = false; }, 1800);
    } catch (err) {
      console.error("Falha ao gerar PDF", err);
      btnPdf.innerHTML = oldHtml;
      btnPdf.disabled = false;
      alert("Não foi possível gerar o PDF. " + (err && err.message ? err.message : "Tente novamente.") + "\nToque em \"Baixar / PDF\" novamente para tentar de novo.");
    }
  });
  const btnShare = el("button", { class: "action-btn", style: "background:#fff;color:var(--ink);border:1px solid var(--line)" }, el("span", { html: svg("share", 16) }), " Compartilhar");
  btnShare.addEventListener("click", async () => {
    if (btnShare.disabled) return;
    btnShare.disabled = true;
    const oldHtml = btnShare.innerHTML;
    btnShare.innerHTML = "Gerando PDF...<br><small style=\"font-weight:400\">Preparando evidências</small>";
    try {
      const { blob, filename } = await prepareInspectionPdf(v);
      const file = new File([blob], filename, { type: "application/pdf" });
      const shareData = { title: `Relatório — ${v.lojaCd}`, text: `Relatório de inspeção — ${v.lojaCd}${v.local ? ", " + v.local : ""} — ${fmtDateOnly(v.data)}`, files: [file] };
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        download(filename, blob, "application/pdf");
        await navigator.share({ title: shareData.title, text: shareData.text + "\n\n(O PDF foi baixado no aparelho — anexe manualmente.)" });
      } else {
        download(filename, blob, "application/pdf");
        alert("O PDF foi baixado no aparelho. Anexe-o manualmente no seu app de mensagens/e-mail.");
      }
      btnShare.innerHTML = "✓ PDF gerado com sucesso";
      setTimeout(() => { btnShare.innerHTML = oldHtml; btnShare.disabled = false; }, 1800);
    } catch (err) {
      if (err && err.name === "AbortError") { btnShare.innerHTML = oldHtml; btnShare.disabled = false; return; } // usuário cancelou o compartilhamento nativo
      console.error("Falha ao preparar compartilhamento", err);
      btnShare.innerHTML = oldHtml;
      btnShare.disabled = false;
      alert("Não foi possível gerar o PDF para compartilhar. " + (err && err.message ? err.message : "Tente novamente."));
    }
  });
  row1.appendChild(btnPdf); row1.appendChild(btnShare);
  topActions.appendChild(row1);
  printable.appendChild(topActions);

  (v.estruturas || []).forEach((e) => {
    const est = estruturaStatus(e);
    const problemEntries = montanteAnomalyEntries(e);
    const estOcorrencias = estruturaAnomalyOccurrences(e);
    const estMedicoes = estruturaMedicoesInformativas(e);
    printable.appendChild(el("h3", { class: "section-title", style: "display:flex;align-items:center;justify-content:space-between" },
      el("span", {}, "Estrutura ", e.codigo || "—"), Tag(est, "sm")));
    const sub = [e.rua && "Rua " + e.rua, e.lado && "Lado " + e.lado, (e.montantes || []).length + " montante(s)", e.fabricante].filter(Boolean).join(" · ");
    if (sub) printable.appendChild(el("div", { style: "font-size:12px;color:var(--ink-faint);margin:-4px 0 8px" }, sub));
    if (e.observacoesGerais) printable.appendChild(el("div", { style: "font-size:12px;color:var(--ink-soft);margin:0 0 8px" }, "Observações: " + e.observacoesGerais));

    if (!problemEntries.length && !estOcorrencias.length) {
      printable.appendChild(el("div", { class: "card", style: "padding:10px 12px;margin-bottom:10px;color:var(--ink-soft);font-size:13px" }, "Nenhum apontamento de anomalia registrado."));
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
        const photoGrid = el("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin-top:8px" });
        c.appendChild(photoGrid);
        occurrencePhotoRefs(oc).forEach((photoId) => {
          const img = el("img", { style: "width:110px;height:110px;object-fit:cover;border-radius:6px" });
          img.dataset.photoId = photoId;
          img.dataset.context = `${e.codigo || "EST"} · ESTRUTURA`;
          PhotoUrlManager.resolveThumbUrl(photoId).then((url) => {
            if (url) {
              img.src = url;
              if (img.decode) img.decode().catch(() => {});
            }
          });
          photoGrid.appendChild(img);
        });
        itemsList.appendChild(c);
      });
      problemEntries.forEach(({ m, i }) => {
        const c = Card({ style: "padding:10px 12px" });
        c.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
          el("div", { style: "font-weight:600;font-size:13.5px" }, CodeBadge(i.codigo), i.nome),
          Tag(i.status, "sm")));
        c.appendChild(el("div", { class: "mono", style: "font-size:11px;color:var(--ink-faint);margin-top:3px" }, "Montante Nº " + m.numero));
        const detalhesMont = [i.descTxt, i.tipoTxt, i.localTxt, i.grauTxt, i.corte && "Nível " + i.corte].filter(Boolean).join(" · ");
        if (detalhesMont) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, detalhesMont));
        if (i.valor) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, `Medição: ${i.valor} ${i.unidade}`));
        if (m.observacoes) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, "Obs. montante: " + m.observacoes));
        if (i.obs) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, "Obs. ocorrência: " + i.obs));
        const photoGridM = el("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin-top:8px" });
        c.appendChild(photoGridM);
        occurrencePhotoRefs(i).forEach((photoId) => {
          const img = el("img", { style: "width:110px;height:110px;object-fit:cover;border-radius:6px" });
          img.dataset.photoId = photoId;
          img.dataset.context = `${e.codigo || "EST"} · M${m.numero}`;
          PhotoUrlManager.resolveThumbUrl(photoId).then((url) => {
            if (url) {
              img.src = url;
              if (img.decode) img.decode().catch(() => {});
            }
          });
          photoGridM.appendChild(img);
        });
        itemsList.appendChild(c);
      });
      printable.appendChild(itemsList);
    }
    if (estMedicoes.length) {
      const medCard = Card({ style: "padding:10px 12px;margin-bottom:10px" });
      medCard.appendChild(el("div", { style: "font-weight:700;font-size:12.5px;margin-bottom:5px" }, "Medições conformes registradas"));
      estMedicoes.forEach(({it,oc}) => medCard.appendChild(el("div", { style: "font-size:12px;color:var(--ink-soft);padding:3px 0" }, `${it.codigo ? "["+it.codigo+"] " : ""}${oc.montanteRef || "Estrutura"}: ${oc.valor} ${it.unidade}`)));
      printable.appendChild(medCard);
    }

    const agg = {};
    problemEntries.forEach(({ i }) => { const q = Number(i.qtd) > 0 ? Number(i.qtd) : 1; const p = pecaDoItem(i); agg[p] = (agg[p] || 0) + q; });
    estOcorrencias.forEach(({ it, oc }) => { if (it.tipo === "medicao") return; const q = Number(oc.qtd) > 0 ? Number(oc.qtd) : 1; const p = oc.tipoTxt || it.peca; agg[p] = (agg[p] || 0) + q; });
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
    resolveBtn.addEventListener("click", async () => { e.resolvido = !e.resolvido; touchResolvido(e); await saveVistoriaObject(v); render(); });
    printable.appendChild(resolveBtn);
  });
  wrap.appendChild(printable);

  const actions = el("div", { class: "no-print", style: "padding:0 16px 20px;display:flex;flex-direction:column;gap:8px" });
  const btnDelete = el("button", { class: "action-btn", style: "background:#fff;color:var(--red-dark);border:1px solid var(--red-bg)" }, el("span", { html: svg("trash", 15) }), " Excluir inspeção inteira");
  btnDelete.addEventListener("click", async () => { if (confirm("Excluir esta inspeção e todas as estruturas dela?")) { await deleteVistoriaCompletamente(v.id); go("history"); } });
  actions.appendChild(btnDelete);

  wrap.appendChild(actions);
  return wrap;
}
async function shareReport(v, st) {
  let text = `Relatório de Inspeção — ${state.config.empresa}\nLoja/CD: ${v.lojaCd}${v.local ? " · " + v.local : ""}\nInspetor(es): ${v.inspetor}\nData: ${fmtDateOnly(v.data)}\nResultado geral: ${STATUS[st].label}\n`;
  (v.estruturas || []).forEach((e) => {
    const problemEntries = montanteAnomalyEntries(e);
    const estOcorrencias = estruturaAnomalyOccurrences(e);
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
  const rows=[];
  (v.estruturas||[]).forEach((e)=>{
    montanteAnomalyEntries(e).forEach(({m,item,oc,i})=>rows.push({
      estruturaId:e.id,montanteId:m.id,itemId:item.id,ocorrenciaId:oc&&oc.id,
      setor:e.setor||"",tipoEstrutura:e.tipoEstrutura||"",numeroEstrutura:e.codigo||"",lado:e.lado||"",montante:m.numero,corte:i.corte||"",
      codigoAnomalia:item.codigo||"",nomeAnomalia:item.nome||"",descricao:i.descTxt||"",tipo:i.tipoTxt||"",localizacao:i.localTxt||"",grau:i.grauTxt||"",
      categoria:item.categoria||"",correcao:i.correcao||"",qtd:i.qtd==null?1:i.qtd,fabricante:m.fabricante||e.fabricante||""
    }));
    estruturaAnomalyOccurrences(e).forEach(({it,oc})=>rows.push({
      estruturaId:e.id,estItemId:it.id,ocorrenciaId:oc.id,setor:e.setor||"",tipoEstrutura:e.tipoEstrutura||"",numeroEstrutura:e.codigo||"",lado:e.lado||"",montante:oc.montanteRef||"(estrutura)",corte:"",
      codigoAnomalia:it.codigo||"",nomeAnomalia:it.nome||"",descricao:oc.descTxt||"",tipo:oc.tipoTxt||"",localizacao:oc.localTxt||"",grau:oc.grauTxt||"",categoria:it.categoria||"",correcao:oc.correcao||"",qtd:oc.qtd==null?1:oc.qtd,fabricante:e.fabricante||""
    }));
  });
  return rows;
}
function pecaDoItem(it) { return it.peca; }
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
          if (r.estItemId) {
            const estItem = est && (est.itensEstrutura || []).find((x) => x.id === r.estItemId);
            const oc = estItem && (estItem.ocorrencias || []).find((x) => x.id === r.ocorrenciaId);
            if (oc) oc.correcao = e.target.value;
          } else {
            const mont = est && (est.montantes || []).find((x) => x.id === r.montanteId);
            const item = mont && (mont.itens || []).find((x) => x.id === r.itemId);
            const occ = item && r.ocorrenciaId && (item.ocorrencias || []).find((x) => x.id === r.ocorrenciaId);
            if (occ) occ.correcao = e.target.value; else if (item) item.correcao = e.target.value;
          }
          clearTimeout(state.saveTimer); state.saveTimer = setTimeout(() => saveVistoriaObject(v).catch(()=>{}), 400);
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
  const bucket={};
  (v.estruturas||[]).filter((e)=>!e.resolvido&&isProblem(estruturaStatus(e))).forEach((e)=>{
    montanteAnomalyEntries(e).forEach(({m,item,i})=>{const q=Number(i.qtd)>0?Number(i.qtd):1;const peca=i.tipoTxt||pecaDoItem(item);if(!bucket[peca])bucket[peca]={peca,qtd:0,graus:new Set(),refs:new Set()};bucket[peca].qtd+=q;if(i.grauTxt)bucket[peca].graus.add(i.grauTxt);bucket[peca].refs.add(`${e.codigo} · Montante ${m.numero}`);});
    estruturaAnomalyOccurrences(e).forEach(({it,oc})=>{const q=Number(oc.qtd)>0?Number(oc.qtd):1;const peca=oc.tipoTxt||it.peca;if(!bucket[peca])bucket[peca]={peca,qtd:0,graus:new Set(),refs:new Set()};bucket[peca].qtd+=q;if(oc.grauTxt)bucket[peca].graus.add(oc.grauTxt);bucket[peca].refs.add(`${e.codigo} · ${oc.montanteRef||"estrutura"}`);});
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
      visualItemsMontante(m, e).forEach((it) => {
        totalItensAplicaveis++;
        const stItem = montanteItemStatus(it);
        if (stItem === "ok" || stItem === "naoaplica") totalItensConformes++;
      });
    });
    montanteAnomalyEntries(e).forEach(({ item, oc, i }) => {
      totalApontamentos++;
      const key = (item.codigo ? item.codigo + " — " : "") + item.nome;
      anomaliaCount[key] = (anomaliaCount[key] || 0) + 1;
      if (i.grauTxt) { const g = i.grauTxt.trim().toUpperCase(); grauCount[g] = (grauCount[g] || 0) + 1; }
      totalFotos += occurrencePhotos(oc || item).length;
    });
    estruturaAnomalyOccurrences(e).forEach(({ it, oc }) => {
      totalApontamentos++;
      const key = (it.codigo ? it.codigo + " — " : "") + it.nome;
      anomaliaCount[key] = (anomaliaCount[key] || 0) + 1;
      if (oc.grauTxt) { const g = oc.grauTxt.trim().toUpperCase(); grauCount[g] = (grauCount[g] || 0) + 1; }
      totalFotos += occurrencePhotos(oc).length;
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
      montanteAnomalyEntries(e).forEach(({m,item,i}) => {
        const q = Number(i.qtd) > 0 ? Number(i.qtd) : 1;
        const peca = i.tipoTxt || pecaDoItem(item);
        if (!locations[key]) locations[key] = { local: v.local, itens: {} };
        const bucket = locations[key].itens;
        if (!bucket[peca]) bucket[peca] = { qtd: 0, graus: new Set(), refs: new Set() };
        bucket[peca].qtd += q;
        if (i.grauTxt) bucket[peca].graus.add(i.grauTxt);
        bucket[peca].refs.add(`${e.codigo} · Montante ${m.numero}`);
      });
      estruturaAnomalyOccurrences(e).forEach(({it,oc}) => {
        const q = Number(oc.qtd) > 0 ? Number(oc.qtd) : 1;
        const peca = oc.tipoTxt || it.peca;
        if (!locations[key]) locations[key] = { local: v.local, itens: {} };
        const bucket = locations[key].itens;
        if (!bucket[peca]) bucket[peca] = { qtd: 0, graus: new Set(), refs: new Set() };
        bucket[peca].qtd += q;
        if (oc.grauTxt) bucket[peca].graus.add(oc.grauTxt);
        bucket[peca].refs.add(`${e.codigo} · ${oc.montanteRef || "estrutura"}`);
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
  const familiaSelect = el("select", { class: "input" });
  FAMILIAS_ORDEM.forEach((f) => familiaSelect.appendChild(el("option", { value: f }, f)));
  const nivelSelect = el("select", { class: "input" });
  [["montante","Montante"],["estrutura","Estrutura"]].forEach(([v,l]) => nivelSelect.appendChild(el("option", { value: v }, l)));
  const pecaInput = el("input", { class: "input", placeholder: "Peça / componente associado" });
  const addRow = el("div", { class: "row" });
  const addBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  addBtn.addEventListener("click", () => {
    if (nomeInput.value.trim() && pecaInput.value.trim()) {
      local.itens.push({ id: uid(), codigo: codigoInput.value.trim(), nome: nomeInput.value.trim(), descOpcoes: descInput.value.trim() ? [descInput.value.trim()] : undefined, categoria: categoriaInput.value.trim(), familia: familiaSelect.value, nivel: nivelSelect.value, peca: pecaInput.value.trim() });
      codigoInput.value = ""; nomeInput.value = ""; descInput.value = ""; categoriaInput.value = ""; pecaInput.value = "";
      renderItens();
    }
  });
  addRow.appendChild(pecaInput); addRow.appendChild(addBtn);
  itensCard.appendChild(el("div", { style: "margin-top:10px;display:flex;flex-direction:column;gap:6px" }, codigoInput, nomeInput, descInput, categoriaInput, familiaSelect, nivelSelect, addRow));
  wrap.appendChild(itensCard);

  const backupCard = Card({ style: "margin-bottom:14px" });
  backupCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Backup"));
  backupCard.appendChild(el("p", { style: "font-size:12.5px;color:var(--ink-soft);margin:0 0 10px;line-height:1.5" }, "Guarde uma cópia de segurança deste aparelho, ou restaure um backup feito neste mesmo aparelho."));
  const exportZipBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:10px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px" }, el("span", { html: svg("download", 16) }), "Exportar pacote ZIP completo (.zip)");
  exportZipBtn.addEventListener("click", async () => {
    const modal = showProgressModal("Exportando Pacote ZIP", "Iniciando empacotamento...");
    try {
      await downloadZipBackup(`backup-inspecoes-${new Date().toISOString().slice(0, 10)}.zip`, (cur, tot, detail) => {
        modal.update(cur, tot, detail);
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar ZIP: " + err.message);
    } finally {
      modal.close();
    }
  });
  backupCard.appendChild(exportZipBtn);
  const exportBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:8px;margin-bottom:8px;font-size:12px;color:var(--ink-soft)" }, "Exportar em JSON legado (.json)");
  exportBtn.addEventListener("click", async () => {
    const modal = showProgressModal("Exportando Backup JSON", "Processando fotos...");
    try {
      await downloadFullBackup(`backup-inspecoes-${new Date().toISOString().slice(0, 10)}.json`);
    } finally {
      modal.close();
    }
  });
  backupCard.appendChild(exportBtn);
  const restoreInput = el("input", { type: "file", accept: ".zip,.json,application/zip,application/json", style: "display:none" });
  const restoreBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:10px" }, "Restaurar backup (.zip ou .json)");
  restoreBtn.addEventListener("click", () => restoreInput.click());
  restoreInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (!confirm("Isso vai SUBSTITUIR TODOS os dados deste aparelho pelos do arquivo. Um backup de segurança do estado atual será baixado antes. Continuar?")) { e.target.value = ""; return; }
    const modal = showProgressModal("Restaurando Backup", "Lendo arquivo...");
    try {
      let data = null;
      let zipPhotosMap = null;
      if (file.name.endsWith(".zip") || file.type.includes("zip")) {
        modal.setStep("Descompactando pacote ZIP...");
        const filesMap = await parseZipBlob(file);
        const manifestEntry = filesMap.get("manifest.json");
        if (!manifestEntry) throw new Error("Pacote ZIP não contém manifest.json");
        data = JSON.parse(manifestEntry.text());
        zipPhotosMap = filesMap;
      } else {
        data = JSON.parse(await file.text());
      }

      modal.setStep("Executando preflight de integridade do pacote...");
      await preflightImportPackage(data, zipPhotosMap);

      modal.setStep("Gerando backup de segurança do estado local...");
      await downloadZipBackup(`backup-seguranca-antes-restaurar-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`, null, true);

      const localAll = await idbGetAll("vistorias");
      const incomingIds = new Set(data.vistorias.map((v) => v.id));
      const toDelete = localAll.filter((v) => !incomingIds.has(v.id)).map((v) => ({ store: "vistorias", key: v.id }));
      const localAllPhotos = await idbGetAll("photos");
      const incomingPhotoIds = new Set((data.photos || []).map((p) => p.id));
      const photosToDelete = localAllPhotos.filter((p) => !incomingPhotoIds.has(p.id)).map((p) => ({ store: "photos", key: p.id }));
      const allToDelete = [...toDelete, ...photosToDelete];

      modal.setStep("Processando vistorias e evidências...");
      const items = data.vistorias.map((raw) => ({ store: "vistorias", key: undefined, value: compactVistoriaForStorage(normalizeVistoria(raw)) }));

      if (Array.isArray(data.photos)) {
        const totalP = data.photos.length;
        for (let idx = 0; idx < totalP; idx++) {
          const rawP = data.photos[idx];
          if (!rawP.id) continue;
          let blob = null;
          if (zipPhotosMap && rawP.path && zipPhotosMap.has(rawP.path)) {
            blob = zipPhotosMap.get(rawP.path).blob(rawP.mimeType || "image/jpeg");
          } else if (rawP.blobBase64) {
            blob = base64ToBlob(rawP.blobBase64, rawP.mimeType || "image/jpeg");
          }
          if (blob) {
            items.push({
              store: "photos",
              key: undefined,
              value: {
                id: rawP.id,
                vistoriaId: rawP.vistoriaId,
                occurrenceId: rawP.occurrenceId,
                blob: blob,
                mimeType: rawP.mimeType || "image/jpeg",
                width: rawP.width,
                height: rawP.height,
                size: rawP.size || blob.size,
                createdAt: rawP.createdAt || nowIso(),
                deviceOrigin: rawP.deviceOrigin || getDeviceId(),
                updatedAt: rawP.updatedAt || nowIso(),
                deletedAt: rawP.deletedAt || null
              }
            });
          }
          if (idx % 10 === 0) {
            modal.update(idx, totalP, "Reconstituindo fotos");
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      }

      if (data.config && typeof data.config === "object") { state.config = { ...DEFAULT_CONFIG, ...data.config, itens: mergeCatalog(data.config.itens || []) }; items.push({ store: "config", key: "main", value: state.config }); }
      if (data.orderedParts && typeof data.orderedParts === "object") { state.orderedParts = data.orderedParts; items.push({ store: "parts", key: "main", value: state.orderedParts }); }
      items.push({ store: "config", key: "deletedVistorias", value: data.deletedVistorias && typeof data.deletedVistorias === "object" ? data.deletedVistorias : {} });

      modal.setStep("Gravando transação no IndexedDB...");
      await idbTransactionApply(items, allToDelete);
      await persistVistoriaList();
      // Backups pré-v2.18 trazem fotos em base64 embutido (sem "photos" no manifesto). Antes, isso só
      // era convertido no PRÓXIMO boot do app — até lá, a vistoria restaurada ficava com o JSON inchado
      // de base64 mesmo sem o usuário perceber. Agora a migração roda aqui mesmo, na hora.
      modal.setStep("Migrando fotos legadas (base64 -> Blob), se houver...");
      await migrateLegacyBase64ToPhotos();
      // migrateLegacyBase64ToPhotos() escreve direto no IndexedDB, por fora de state.vistorias — sem
      // recarregar aqui, a lista em memória ficaria descompassada do banco (ainda mostrando as fotos
      // pré-migração) até algum outro refresh não relacionado acontecer.
      await persistVistoriaList();
      modal.setStep("Verificando integridade pós-restauração...");
      const postInteg = await checkPhotoIntegrity(await idbGetAll("vistorias"));
      modal.close();
      if (postInteg.isClean && !postInteg.pendingMigration.length) {
        alert(`Backup restaurado com sucesso! ${data.vistorias.length} inspeção(ões) restaurada(s) com 100% de integridade.\nO backup de segurança do estado anterior foi baixado.`);
      } else if (postInteg.isClean && postInteg.pendingMigration.length) {
        alert(`Backup restaurado com sucesso! ${data.vistorias.length} inspeção(ões) restaurada(s).\n${postInteg.pendingMigration.length} foto(s) legada(s) ainda não puderam ser migradas automaticamente (dado corrompido no arquivo de origem) — a inspeção continua utilizável, mas verifique a tela Saúde dos dados.\nO backup de segurança do estado anterior foi baixado.`);
      } else {
        alert(`Backup restaurado com atenção: ${postInteg.missing.length} inconsistência(s) detectada(s). Verifique a tela Saúde dos dados.`);
      }
      render();
    } catch (err) {
      console.error(err);
      modal.close();
      alert("Não foi possível restaurar: " + err.message);
    } finally {
      e.target.value = "";
    }
  });
  backupCard.appendChild(restoreBtn); backupCard.appendChild(restoreInput);
  wrap.appendChild(backupCard);

  const mergeCard = Card({ style: "margin-bottom:14px" });
  mergeCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Consolidar aparelhos"));
  mergeCard.appendChild(el("p", { style: "font-size:12.5px;color:var(--ink-soft);margin:0 0 10px;line-height:1.5" }, "Use quando técnicos diferentes trabalharam na MESMA inspeção em celulares diferentes (ex: um fez o Visual, outro fez o Prumo). Isso MESCLA os dados por data de alteração — não apaga nada às cegas. Um backup de segurança é baixado antes."));
  mergeCard.appendChild(el("p", { style: "font-size:12px;color:var(--amber-dark);background:var(--amber-bg);border-radius:8px;padding:8px 10px;margin:0 0 10px;line-height:1.5" }, "⚠ Importante: os dois aparelhos precisam ter partido da MESMA inspeção (um cria, exporta, o outro importa esse arquivo antes de começar). Se cada um criar a inspeção separadamente — mesmo com o mesmo nome de loja — o app não tem como saber que é o mesmo trabalho, e elas ficam como duas inspeções distintas."));
  const mergeInput = el("input", { type: "file", accept: ".zip,.json,application/zip,application/json", style: "display:none" });
  const mergeBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:10px" }, "＋ Consolidar com arquivo de outro aparelho");
  mergeBtn.addEventListener("click", () => mergeInput.click());
  mergeInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const modal = showProgressModal("Consolidando Aparelhos", "Lendo arquivo...");
    try {
      let data = null;
      let zipPhotosMap = null;
      if (file.name.endsWith(".zip") || file.type.includes("zip")) {
        modal.setStep("Descompactando pacote ZIP...");
        const filesMap = await parseZipBlob(file);
        const manifestEntry = filesMap.get("manifest.json");
        if (!manifestEntry) throw new Error("Pacote ZIP não contém manifest.json");
        data = JSON.parse(manifestEntry.text());
        zipPhotosMap = filesMap;
      } else {
        data = JSON.parse(await file.text());
      }
      if (!Array.isArray(data.vistorias)) { modal.close(); alert("Arquivo não contém inspeções."); return; }
      modal.setStep("Executando preflight de integridade do pacote...");
      await preflightImportPackage(data, zipPhotosMap);
      const schemaOk = typeof data.schemaVersion === "number" && data.schemaVersion >= MERGE_SCHEMA_VERSION;
      if (!schemaOk) {
        alert(`Este backup foi criado por uma versão mais antiga do app (versão do arquivo: ${data.schemaVersion || "desconhecida"}, mínima exigida: ${MERGE_SCHEMA_VERSION}) e não tem os metadados necessários pra mesclar com segurança.\n\nRestaurar esse arquivo continua funcionando normalmente. Pra Consolidar, gere um backup novo neste e no outro aparelho (Ajustes → Exportar backup, depois de atualizar os dois pra esta versão) e tente de novo.`);
        e.target.value = ""; return;
      }

      const localDeleted = await getDeletedVistoriaIds();
      const incomingDeleted = data.deletedVistorias && typeof data.deletedVistorias === "object" ? data.deletedVistorias : {};
      const mergedDeleted = mergeTombstoneMap(localDeleted, incomingDeleted); // funciona nos dois sentidos, não só quando quem recebe já tinha o tombstone

      const localAll = await idbGetAll("vistorias");
      const localById = new Map(localAll.map((v) => [v.id, normalizeVistoria(v)]));
      const toWrite = [];
      const toDelete = [];
      const reports = [];
      const duplicados = [];
      let novas = 0, resucitadasBloqueadas = 0, excluidasPorTombstoneDoArquivo = 0;

      // vistorias que o arquivo diz terem sido excluídas em outro aparelho, mas que ainda existem aqui
      for (const [id, tomb] of Object.entries(incomingDeleted)) {
        const local = localById.get(id);
        if (local && newer(tomb.deletedAt, vistoriaLatestMeaningfulTouch(local)) >= 0) { toDelete.push({ store: "vistorias", key: id }); excluidasPorTombstoneDoArquivo++; }
      }

      for (const raw of data.vistorias) {
        const incoming = normalizeVistoria(raw);
        const local = localById.get(incoming.id);
        if (!local) {
          const tomb = mergedDeleted[incoming.id];
          if (tomb && newer(tomb.deletedAt, vistoriaLatestMeaningfulTouch(incoming)) >= 0) { resucitadasBloqueadas++; continue; }
          toWrite.push(incoming); novas++; continue;
        }
        const merged = mergeVistorias(local, incoming);
        toWrite.push(merged);
        reports.push({ lojaCd: merged.lojaCd, ...merged.lastMergeReport });
        if (merged.lastMergeReport.codigosDuplicados.length) duplicados.push({ lojaCd: merged.lojaCd, itens: merged.lastMergeReport.codigosDuplicados });
      }

      // Preflight: se houver duplicidade de código, avisa ANTES de gravar qualquer coisa (nada foi escrito ainda).
      if (duplicados.length) {
        const msg = `⚠ A consolidação encontrou estrutura(s) com código duplicado:\n` + duplicados.map((d) => `• ${d.lojaCd}: ${d.itens.map((i) => i.codigo).join(", ")}`).join("\n") + `\n\nIsso não é perda de dados — as duas estruturas serão mantidas — mas você vai precisar renomear uma delas manualmente depois.\n\nConsolidar mesmo assim?`;
        if (!confirm(msg)) { e.target.value = ""; return; }
      }

      modal.setStep("Gerando backup de segurança do estado local...");
      const safetyBackupRes = await downloadZipBackup(`backup-seguranca-antes-consolidar-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`, null, true);

      // Declarado no escopo da função para garantir disponibilidade no pre-commit validation
      const localPhotos = await idbGetAll("photos");
      const localPhotoMap = new Map(localPhotos.map((p) => [p.id, p]));

      // Todo o merge já foi calculado com sucesso. Só agora grava tudo numa única transação (tudo ou nada).
      const items = toWrite.map((v) => ({ store: "vistorias", key: undefined, value: compactVistoriaForStorage(v) }));
      if (Array.isArray(data.photos)) {
        const totalP = data.photos.length;
        for (let idx = 0; idx < totalP; idx++) {
          const rawP = data.photos[idx];
          if (!rawP.id) continue;
          const existing = localPhotoMap.get(rawP.id);
          const existingIsValid = existing && existing.blob && (existing.blob.size > 0 || (existing.blob.byteLength && existing.blob.byteLength > 0));

          // Self-Healing: Importa se não existe localmente OU se o registro local possui Blob vazio/inválido
          if (!existingIsValid) {
            let blob = null;
            if (zipPhotosMap && rawP.path && zipPhotosMap.has(rawP.path)) {
              blob = zipPhotosMap.get(rawP.path).blob(rawP.mimeType || "image/jpeg");
            } else if (rawP.blobBase64) {
              blob = base64ToBlob(rawP.blobBase64, rawP.mimeType || "image/jpeg");
            }
            if (blob && (blob.size > 0 || (blob.byteLength && blob.byteLength > 0))) {
              items.push({
                store: "photos",
                key: undefined,
                value: {
                  id: rawP.id,
                  vistoriaId: rawP.vistoriaId,
                  occurrenceId: rawP.occurrenceId,
                  blob: blob,
                  mimeType: rawP.mimeType || "image/jpeg",
                  width: rawP.width,
                  height: rawP.height,
                  size: rawP.size || blob.size,
                  createdAt: rawP.createdAt || (existing && existing.createdAt) || nowIso(),
                  deviceOrigin: rawP.deviceOrigin || (existing && existing.deviceOrigin) || getDeviceId(),
                  updatedAt: rawP.updatedAt || nowIso(),
                  deletedAt: rawP.deletedAt || null
                }
              });
            }
          }
          if (idx % 10 === 0) {
            modal.update(idx, totalP, "Mesclando/Reparando evidências");
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      }

      // Validação pré-commit do estado candidato: todas as fotos ativas pós-merge devem estar satisfeitas
      const candidatePhotoIds = new Set();
      for (const item of items) {
        if (item.store === "photos" && item.value && item.value.id) candidatePhotoIds.add(item.value.id);
      }
      for (const p of localPhotos) {
        if (p.blob && (p.blob.size > 0 || (p.blob.byteLength && p.blob.byteLength > 0))) candidatePhotoIds.add(p.id);
      }

      for (const v of toWrite) {
        for (const e of (v.estruturas || [])) {
          for (const it of (e.itensEstrutura || [])) {
            for (const oc of (it.ocorrencias || [])) {
              for (const pid of occurrencePhotoRefs(oc)) {
                if (pid && pid.startsWith("pho_") && !candidatePhotoIds.has(pid)) {
                  throw new Error(`Commit abortado: a evidência '${pid}' permaneceria sem Blob válido após o merge.`);
                }
              }
            }
          }
          for (const m of (e.montantes || [])) {
            for (const it of (m.itens || [])) {
              for (const oc of (it.ocorrencias || [])) {
                for (const pid of occurrencePhotoRefs(oc)) {
                  if (pid && pid.startsWith("pho_") && !candidatePhotoIds.has(pid)) {
                    throw new Error(`Commit abortado: a evidência '${pid}' permaneceria sem Blob válido após o merge.`);
                  }
                }
              }
            }
          }
        }
      }

      items.push({ store: "config", key: "deletedVistorias", value: mergedDeleted });
      modal.setStep("Gravando transação atômica...");
      await idbTransactionApply(items, toDelete);
      await persistVistoriaList();

      modal.setStep("Verificando integridade pós-consolidação...");
      const postInteg = await checkPhotoIntegrity(await idbGetAll("vistorias"));
      const resumo = reports.map((r) => `• ${r.lojaCd || "(sem nome)"}: +${r.added} novo(s), ${r.updated} atualizado(s), ${r.keptLocal} mantido(s) local, ${r.deletedByTombstone} exclusão(ões) respeitada(s)${r.conflicts.length ? `, ${r.conflicts.length} conflito(s)` : ""}`).join("\n");
      const detalhesConflitos = reports.flatMap((r) => r.conflicts.filter((c) => c.tipo === "ocorrencia").map((c) =>
        `  ⚠ Ocorrência em conflito (venceu ${c.resolvido === "incoming" ? "a do arquivo" : "a local"}, fotos unidas: ${c.fotosUnificadas}):\n    Versão local: ${c.versaoA.grauTxt || "—"} · ${c.versaoA.descTxt || "—"} · ${c.versaoA.fotos} foto(s)\n    Versão do arquivo: ${c.versaoB.grauTxt || "—"} · ${c.versaoB.descTxt || "—"} · ${c.versaoB.fotos} foto(s)`
      ));
      const avisoConflitos = detalhesConflitos.length ? `\n\n${detalhesConflitos.join("\n")}` : "";
      const avisoResucitadas = resucitadasBloqueadas ? `\n${resucitadasBloqueadas} inspeção(ões) do arquivo não foram adicionadas por já terem sido excluídas neste aparelho.` : "";
      const avisoExcluidasPeloArquivo = excluidasPorTombstoneDoArquivo ? `\n${excluidasPorTombstoneDoArquivo} inspeção(ões) foram removidas daqui por terem sido excluídas no outro aparelho.` : "";

      let statusIntegridade = "";
      if (postInteg.isClean) {
        statusIntegridade = `\n\n✓ Integridade pós-merge: 100% íntegro (${postInteg.totalValid} evidências vinculadas e válidas no aparelho).`;
      } else {
        statusIntegridade = `\n\n⚠ Atenção pós-merge: ${postInteg.missing.length} evidência(s) com inconsistência detectada.`;
      }

      let statusBackup = "";
      if (safetyBackupRes && safetyBackupRes.isDegraded) {
        statusBackup = `\nNota: Foi salvo um snapshot de emergência prévio (estado local degradado).`;
      } else {
        statusBackup = `\nO backup de segurança do estado anterior foi baixado.`;
      }

      modal.close();
      alert(`Consolidação concluída com sucesso!\n${novas} inspeção(ões) nova(s) adicionada(s).\n${reports.length} inspeção(ões) mescladas:\n${resumo || "—"}${avisoResucitadas}${avisoExcluidasPeloArquivo}${avisoConflitos}${statusIntegridade}\n\n${statusBackup}`);
      render();
    } catch (err) { console.error(err); modal.close(); alert("Não foi possível consolidar este arquivo: " + err.message); } finally { e.target.value = ""; }
  });
  mergeCard.appendChild(mergeBtn); mergeCard.appendChild(mergeInput);
  wrap.appendChild(mergeCard);

  const healthCard = Card({ style: "margin-bottom:14px" });
  healthCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Saúde dos dados"));
  const healthBody = el("div", { style: "font-size:12.5px;color:var(--ink-soft);line-height:1.7" }, "Verificando…");
  healthCard.appendChild(healthBody);
  wrap.appendChild(healthCard);
  (async () => {
    const lines = [];
    lines.push(`ID deste aparelho: ${await ensureDeviceId()}`);
    try {
      if (navigator.storage && navigator.storage.persisted) {
        let persisted = await navigator.storage.persisted();
        if (!persisted && navigator.storage.persist) persisted = await navigator.storage.persist();
        lines.push(persisted ? "✓ Armazenamento persistente concedido (o sistema evita apagar os dados sob pouco espaço)." : "⚠ Armazenamento persistente NÃO concedido — o sistema pode limpar os dados sob pouco espaço.");
      } else lines.push("Este navegador não informa o status de armazenamento persistente.");
    } catch (err) { lines.push("Não foi possível verificar armazenamento persistente."); }
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        const usedMb = (est.usage / 1024 / 1024).toFixed(1), quotaMb = (est.quota / 1024 / 1024).toFixed(0);
        lines.push(`Uso estimado: ${usedMb} MB de ~${quotaMb} MB disponíveis.`);
      }
    } catch (err) { /* segue sem essa info */ }
    try {
      const integrity = await checkPhotoIntegrity(await idbGetAll("vistorias"));
      lines.push(integrity.isClean ? `✓ Integridade de fotos: ${integrity.totalValid} evidência(s) vinculadas e válidas.` : `⚠ Atenção: ${integrity.missing.length} foto(s) com referência pendente.`);
    } catch (err) { /* segue */ }
    healthBody.innerHTML = ""; lines.forEach((l) => healthBody.appendChild(el("div", {}, l)));
  })();

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
