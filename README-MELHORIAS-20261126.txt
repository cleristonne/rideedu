RIDE EDU — Melhorias de layout e funcionalidades · 26/11/2026
Base: RIDEEDU_edicao_26-11-2026.zip (Vale Educa de 20 a 26/11/2026),
com as melhorias abaixo aplicadas por cima. Conteúdo editorial, edições
anteriores e fotografias das notícias foram preservados sem alteração.

1. MENU EM TELAS ESTREITAS (até 900 px)
   - O menu horizontal, que no celular ocupava duas linhas (cerca de 150 px),
     foi substituído por um botão "Menu" no cabeçalho, que passa a ter
     uma linha só (cerca de 90 px).
   - O botão abre uma gaveta lateral com Notícias, Sobre e as quatro áreas
     com todas as seções; a seção aberta fica destacada.
   - Fecha com o X, com toque fora da gaveta, com a tecla Esc ou ao escolher
     uma seção. Na página inicial, as seções de dados continuam abrindo em
     nova aba (com o aviso "nova aba").
   - Acessível: aria-expanded, foco preso na gaveta e devolvido ao botão.
   - Em telas largas nada muda.
   Arquivos: ride-novo.js (função buildMobileMenu), ride-novo.css (fim do arquivo).

2. GRÁFICOS DE BARRAS POR MUNICÍPIO
   - Valor escrito no topo de cada barra.
   - Barras ordenadas do maior para o menor valor; as cores especiais
     (ex.: remuneração abaixo de 70% em laranja) acompanham cada município.
   - Quando a barra é estreita, o rótulo usa a forma curta (ex.: "608" em
     vez de "R$ 608 mi"); a unidade continua no eixo.
   - Vale para os 13 gráficos feitos por mkBar (Fundeb, VAAT, VAAR, MDE,
     recursos adicionais, remuneração, creche, pré-escola, Ideb, escolas,
     variação populacional). Para manter a ordem original em algum gráfico,
     passe {sort:false} na chamada de mkBar.
   Arquivos: index.html (barValueLabel e mkBar), ride-novo.js (plugin rnValueLabels).

3. LEGENDAS DOS GRÁFICOS
   - As amostras de cor das séries de linha (ex.: Creche e Pré-escola em
     "Por município") apareciam em cinza-claro; agora usam a cor da linha.
   - Pontos das linhas na cor da própria linha; texto da legenda mais escuro.
   Arquivo: ride-novo.js.

4. FONTES
   - Removido o carregamento de Bitter, Albert Sans e JetBrains Mono, que
     não eram usadas. O site carrega apenas Bricolage Grotesque e Inter,
     agora no início do <head>, com preconnect para fonts.gstatic.com.
   - O gráfico do Ideb 2025 passou a usar Inter.
   Arquivos: index.html, ideb2025-app.js.

5. ÍCONE E PRÉVIA DE COMPARTILHAMENTO
   - favicon.svg (ícone da aba) e apple-touch-icon.png (atalho no celular).
   - og-image.png (1200 x 630) e metadados Open Graph/Twitter: o link
     enviado no WhatsApp, Instagram, LinkedIn ou X mostra cartão com
     título, descrição e imagem.
   - Os metadados apontam para https://rideedu.com.br/og-image.png. Se o
     domínio mudar, atualize og:url, og:image e twitter:image no index.html.
   - Após publicar, o WhatsApp pode manter a prévia antiga em cache por
     algum tempo; o depurador do Facebook (developers.facebook.com/tools/debug)
     força a atualização.

CACHE
   ride-novo.css, ride-novo.js e ideb2025-app.js receberam ?v=20261126-1.

VERIFICAÇÕES
   - node --check em ride-novo.js, ideb2025-app.js e scripts internos do index.html.
   - tests/vaar.test.js: 5 testes aprovados (função VAAR não foi alterada).
   - Testado em navegador local (desktop e celular 375 px): menu, gaveta,
     navegação, rótulos, legendas; sem erros no console.
   - A consulta VAAR (/api/vaar) depende do Netlify e não foi testada localmente.

PUBLICAÇÃO
   Como nas edições anteriores: enviar o conteúdo desta pasta para o projeto
   Netlify existente. Arquivos novos que precisam ir junto:
   favicon.svg, apple-touch-icon.png, og-image.png e ride-extras.js.

══════════════════════════════════════════════════════════════
SEGUNDA ETAPA — FERRAMENTAS PARA USAR OS DADOS (arquivo novo ride-extras.js)
══════════════════════════════════════════════════════════════

6. BAIXAR DADOS
   - Todo gráfico das seções de dados tem, no rodapé do cartão, o botão
     "Baixar imagem": gera PNG com título, gráfico, fonte, endereço do
     site e data.
   - Toda tabela tem o botão "Baixar CSV" (separador ";" e acentos
     compatíveis com o Excel em português). Tabelas com cabeçalho duplo
     (Educação infantil) saem com colunas nomeadas, ex.:
     "Creche — 0 a 3 anos (%) · 2020".

7. TABELAS ORDENÁVEIS
   - Clique (ou Enter) no cabeçalho ordena a coluna; novo clique inverte.
     Números do maior para o menor na primeira vez; "—" fica no fim;
     linhas de total/RIDE ficam fixas embaixo.
   - Não se aplica ao ranking do Ideb 2025 (já tem ordem própria), à
     tabela paginada do VAAR, ao Comparativo e à tabela de cabeçalho duplo.

8. FICHA DO MUNICÍPIO E IMPRESSÃO
   - Cada seção de dados tem "Imprimir / PDF"; em "Por município" o botão
     é "Gerar ficha em PDF". A impressão mostra só a seção aberta, sem
     menus nem botões, com cabeçalho "RIDE EDU · Ficha do município ·
     <nome> · gerado em <data> · <link>". Para PDF, escolher "Salvar como
     PDF" na janela de impressão do navegador.

9. COMPARAR DOIS MUNICÍPIOS
   - Já existia (Território > Comparativo). Agora a escolha vai no link
     e pode ser compartilhada (item 11).

10. BUSCA GERAL
   - Lupa no cabeçalho (e atalho "/" ou Ctrl+K). Aceita município, tema
     ou os dois: "Juazeiro", "creche", "Curaçá VAAR", "Petrolina
     Juazeiro" (abre o comparativo). Nome de município fora da RIDE leva
     à consulta nacional do VAAR.

11. LINKS QUE GUARDAM OS FILTROS
   - #municipio?m=Juazeiro, #comparativo?a=Petrolina&b=Juazeiro,
     #vaar?q=Campina Grande. O endereço se atualiza ao trocar a seleção,
     e o botão "Copiar link" de cada seção copia o endereço com os filtros.
   - Alteração no index.html: getPanelFromHash() ignora o que vem depois
     de "?" (os endereços antigos, como #financas, continuam valendo).

12. SELO DE FONTE
   - Gráficos e tabelas ganham "Fonte: ..." quando o cartão ainda não
     citava a fonte. Só foram usadas fontes que o próprio site já declara:
     Recursos e Evolução (RREO/Siope), VAAR (FNDE), Ideb (MEC/Inep),
     Alfabetização (MEC/Inep), Educação infantil (Observatório da
     Criança e do Adolescente/Unicef), Censo (QEdu/Inep) e População
     (IBGE). Visão geral, Por município, Comparativo e Desigualdades
     reúnem várias bases e ficaram sem selo automático.
   - Para mudar um texto de fonte: objeto SECTIONS no início de ride-extras.js.

VERIFICAÇÕES DA SEGUNDA ETAPA
   - Testado em navegador local (desktop e 375 px): CSV, imagem PNG,
     ordenação, links com filtros (município e comparativo), busca,
     atalhos, ficha impressa (simulada na tela). Sem erros no console.
   - O link do VAAR com filtro (#vaar?q=...) depende do /api/vaar do
     Netlify e só pode ser conferido no site publicado.

══════════════════════════════════════════════════════════════
TERCEIRA ETAPA — ORGANIZAÇÃO DOS ARQUIVOS (itens 13 e 14)
══════════════════════════════════════════════════════════════

13. CÓDIGO SEPARADO DO index.html (540 KB → 138 KB)
   - Estilos internos → css/ride-base.css (mesma ordem; ride-novo.css
     continua por cima) e css/noticias-fotos.css.
   - Script principal → js/ride-dados.js (bases municipais),
     js/ride-app.js (lógica) e js/ride-init.js (inicialização).
   - Nenhum dado, texto ou regra foi alterado: só mudou de lugar.
   - Os navegadores guardam esses arquivos em cache: visitas seguintes
     carregam mais rápido.

14. EDIÇÕES DO VALE EDUCA EM ARQUIVOS PRÓPRIOS
   - Cada edição é um arquivo em newsletters/edicoes/<id>.js com o
     conteúdo em JSON; newsletters/edicoes.js faz o registro.
   - A ordem das linhas no index.html define a edição atual (a primeira)
     e o arquivo. O seletor de edições é montado sozinho.
   - Publicar edição nova: ver COMO-PUBLICAR-EDICAO.txt.
   - Verificador: node ferramentas/validar-edicoes.js
     (hoje: 0 erros; 9 avisos de matérias da edição de setembro sem link
     de fonte dentro da matéria; já era assim no conteúdo original).
   - Escolhido .js em vez de .json para o site continuar funcionando
     também ao abrir o index.html direto do computador.
   - Correção: o cartão "Vale Educa" da aba Sobre era texto fixo e ainda
     anunciava a edição de 7 a 11/11; agora mostra sempre a edição atual.

VERIFICAÇÕES DA TERCEIRA ETAPA
   - Comparação lado a lado com a versão anterior, no navegador: as 5
     edições geram HTML idêntico; o texto e os estilos calculados das
     16 seções e do cabeçalho são idênticos; o seletor é idêntico.
   - Simulação de nova edição (arquivo + linha no index.html): virou a
     edição atual, as anteriores foram para o arquivo, o cartão da aba
     Sobre acompanhou.
   - Conversão das edições conferida sem perdas (nenhuma função, data ou
     valor indefinido nos objetos).
   - node --check em todos os .js; 5 testes do VAAR aprovados.

══════════════════════════════════════════════════════════════
QUARTA ETAPA — PÁGINA DE ABERTURA EM PADRÃO DE JORNAL
══════════════════════════════════════════════════════════════

15. CAPA NO ESTILO DE GRANDES JORNAIS (referência: Folha de S.Paulo)
   - Fundo branco, sem cartões arredondados nem blocos coloridos.
   - Nome "VALE EDUCA" centralizado, em serifa, com fios finos e linha
     de data, como o cabeçalho de um jornal.
   - Manchete à esquerda, em serifa grande, com chapéu em caixa alta
     cinza e linha fina; "números da semana" em coluna à direita.
   - Seções do noticiário com título azul em minúsculas (ex.:
     "na ride petrolina–juazeiro"), fio azul acima e colunas separadas
     por fios verticais. A primeira matéria de cada seção ocupa duas
     colunas, com foto e título maiores.
   - Cada matéria mostra o início do texto e o botão "Continuar lendo"
     (o texto completo continua na página; na impressão sai inteiro).
   - Editorial com título em itálico e texto em duas colunas com fio.
   - Agenda, leitura temática, documento, fontes, orçamento e índice
     das seções de dados no mesmo padrão.
   - A linha do cartão "Vale Educa · edição atual" passou a mostrar a
     edição escolhida (antes estava fixa em 7 a 11/11).
   - Fontes: Newsreader (serifa gratuita, desenhada para jornalismo)
     nos títulos e textos; Inter nos chapéus, legendas e botões. A Folha
     usa fontes próprias, que não podem ser usadas por outros sites.
   - Só a aba Notícias mudou; as seções de dados seguem como estavam.
   Arquivos novos: css/noticioso.css e js/noticioso.js.
   index.html: fonte Newsreader no link do Google Fonts e as duas
   linhas que carregam os arquivos novos.

VERIFICAÇÕES DA QUARTA ETAPA
   - Navegador local em 1366 px e 375 px (celular): sem rolagem lateral,
     sem erros no console.
   - "Continuar lendo"/"Recolher" e troca de edição testados (o botão é
     reaplicado nas 5 edições).

══════════════════════════════════════════════════════════════
QUINTA ETAPA — MARGENS E REPORTAGEM EM PÁGINA PRÓPRIA
══════════════════════════════════════════════════════════════

16. NOVO NOME: "Margens: educação no Vale do São Francisco"
   - Cabeçalho da capa (MARGENS + subtítulo), cartão do arquivo de
     edições, cartão da aba Sobre, rodapé da edição, busca e
     descrição de compartilhamento.
   - Na edição atual (20 a 26/11), "Vale Educa" virou "Margens" na
     assinatura do editorial e na fonte editorial. As edições
     anteriores foram mantidas como publicadas (com Vale Educa).

17. MANCHETES ABREM A REPORTAGEM COMPLETA EM NOVA ABA
   - Títulos, fotos e "Ler reportagem completa" da capa abrem
     materia.html em nova aba. A manchete do topo abre a reportagem
     de mesmo título; o editorial tem página própria.
   - Na capa fica só o começo de cada texto, como em portal de jornal.
   - A página da reportagem tem o mesmo cabeçalho e menu do site,
     chapéu, título grande, linha da edição e da fonte, foto com
     crédito, texto completo, "Para a gestão", link para a fonte
     original, botões Copiar link / WhatsApp / Imprimir e a lista
     "mais desta edição".
   - Funciona para as 5 edições (inclusive a de agosto, no formato
     antigo). Endereço inválido mostra "Reportagem não encontrada".
   - A lupa da página da reportagem abre a busca na página principal.
   - Limite: a prévia do link no WhatsApp mostra o cartão geral do
     Margens, não o título da matéria (o site é estático e os robôs
     de prévia não executam JavaScript).

18. LOGO DO CABEÇALHO VOLTA À PÁGINA DE ABERTURA
   - Em qualquer seção ou na página da reportagem, clicar no selo
     RIDE EDU leva às notícias (Ctrl/Cmd+clique abre em nova aba).

   Arquivos novos: materia.html, css/materia.css, js/materia.js,
   logo-ride-edu.png (selo extraído do index.html).
   Alterados: index.html, js/noticioso.js, css/noticioso.css,
   js/ride-init.js, ride-novo.css, ride-extras.js,
   newsletters/edicoes.js, newsletters/edicoes/2026-11-20_26.js.

VERIFICAÇÕES DA QUINTA ETAPA
   - Todos os links das 5 edições conferidos (60 links, nenhum
     quebrado, todos em nova aba); títulos únicos em cada edição.
   - Página da reportagem em 1366 px e 375 px, sem rolagem lateral;
     menu, gaveta do celular, busca e logo testados; sem erros.
   - node ferramentas/validar-edicoes.js: 0 erros; teste do VAAR aprovado.

══════════════════════════════════════════════════════════════
SEXTA ETAPA — REPORTAGENS COMPLETAS DA EDIÇÃO DE 20 A 26/11
══════════════════════════════════════════════════════════════

19. AS 10 MATÉRIAS DA EDIÇÃO ATUAL REESCRITAS COMO REPORTAGENS
   - Cada uma tem linha fina, assinatura "Redação Margens", 9 a 11
     parágrafos e 3 intertítulos (cerca de 4.400 palavras no total).
   - Texto original, escrito a partir da leitura das fontes: CNN
     Brasil, Secom/MEC, Blog do Farnésio (Seduc Juazeiro), Blog do
     Elielson (Seduce Petrolina), SEC Bahia (4 comunicados), SEE
     Pernambuco e FGM. Falas de autoridades em discurso indireto.
   - Contexto acrescentado só com dados verificáveis: dados do próprio
     RIDE EDU (Censo Escolar 2025, RREO 2025, população do IBGE) e
     legislação (EC 108/2020, Lei 14.113/2020, Lei 14.640/2023,
     Lei 13.146/2015, Lei 10.639/2003, Lei 11.645/2008, Nota Técnica
     MEC 4/2014).
   - O site da CNM recusou acesso automático; a matéria do VAAR passou
     a citar a FGM, que publicou as mesmas informações. O link da CNM
     continua em "Fontes consultadas".
   - Títulos mantidos (os endereços das páginas dependem deles).
   - Edições anteriores não foram alteradas.
   Arquivos: newsletters/edicoes/2026-11-20_26.js (textos),
   js/materia.js e css/materia.css (linha fina, assinatura e
   intertítulos), js/noticioso.js (linha fina na capa).

══════════════════════════════════════════════════════════════
SÉTIMA ETAPA — PAINEL DE EDIÇÃO (/admin)
══════════════════════════════════════════════════════════════

20. ATUALIZAR O NOTICIÁRIO SEM ENVIAR A PASTA AO NETLIFY
   - Painel em https://rideedu.com.br/admin/ (Decap CMS, gratuito):
     formulários para todas as partes da edição, envio de fotos,
     rascunho que não aparece no site e histórico de alterações.
   - Depende de configuração única (GitHub + Netlify): passo a passo
     em COMO-USAR-O-PAINEL.txt. Até lá, tudo continua funcionando como
     antes (envio da pasta).
   - A lista de edições deixou de ficar no index.html: é gerada
     sozinha em newsletters/lista.js (ferramentas/gerar-lista.js) e
     carregada por newsletters/carregar.js. A mais recente vira a capa.
   - netlify.toml: a cada publicação, o Netlify gera a lista e roda o
     verificador; com erro, a publicação é recusada e o site fica como
     estava.
   - As edições com seções ganharam "formato": "secoes" (identifica as
     que o painel edita). A de agosto, no formato antigo, segue só à mão.
   - Testado com o servidor local do Decap numa cópia do site: abrir,
     editar e publicar uma edição grava o arquivo sem perder conteúdo
     (só campos vazios deixam de ser gravados); edição nova como
     rascunho fica fora do site e, publicada, vira a capa; reportagem
     com intertítulo e link abre normalmente.
   Arquivos novos: admin/index.html, admin/config.yml,
   admin/formato-margens.js, newsletters/lista.js,
   newsletters/carregar.js, newsletters/fotos/, ferramentas/gerar-lista.js,
   COMO-USAR-O-PAINEL.txt, .gitignore.

21. LOGOTIPO DO MARGENS (27/11/2026)
   - Símbolo: o rio São Francisco (faixa azul) entre as duas margens,
     grafite e ocre, dentro de um círculo. Nome em Newsreader; linha de
     apoio "Educação no Vale do São Francisco" em Inter, caixa alta azul.
   - Aplicado no cabeçalho do noticiário (index.html, css/noticioso.css),
     na página da reportagem (ícone da aba e "Margens" no topo) e no
     painel de edição (tela de entrada e ícone).
   - O ícone geral do site (favicon.svg) continua o do RIDE EDU.
   - Arquivos em marca/: margens-simbolo.svg, margens-logo.svg,
     apresentacao.html (versões, cores e tipografia) e marca/png/
     (logo 2240x480, símbolo 512 e 1024, ícone 180). Fora do site,
     use os PNGs: o SVG do logotipo depende das fontes da internet.
   - Cores: grafite #1F2A33, azul #0A6E99, ocre #D99A2B, areia #F6F1E7.
