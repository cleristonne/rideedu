RIDE EDU · Redesign visual e reorganização das seções · 11/11/2026

O QUE MUDOU
1. Página inicial: o site abre nas notícias (boletim Vale Educa), com a manchete
   da semana em destaque. A apresentação institucional passou para a aba "Sobre".
2. Menu em quatro áreas: Orçamento, Aprendizagem, Rede e acesso, Território.
   Nenhuma seção foi removida; só mudaram de grupo.
3. Na página inicial, cada seção de dados abre em uma nova aba do navegador,
   para que as notícias continuem abertas. Dentro de uma seção de dados, a
   navegação acontece na própria aba, e uma barra no topo lista as seções
   irmãs da mesma área.
4. Dois blocos novos na página inicial, depois do boletim: "O orçamento da
   educação na RIDE em 2025" e "Todas as seções de dados".
5. Nova identidade: fundo branco, azul-marinho, azul do rio (#1A3FD6) e
   amarelo-manga (#FFBE1A); fontes Bricolage Grotesque (títulos) e Inter (texto).
6. Gráficos: mesma biblioteca (Chart.js) e mesmos dados, com cores, fontes e
   espessuras novas. Gráficos de uma série usam uma cor só.

ARQUIVOS
- index.html      alterado: menu, painel inicial, roteador (openPanel/rideNavigate),
                  blocos novos da home, cores dos gráficos.
- ride-novo.css   NOVO: folha de estilo do redesign, carregada por último.
- ride-novo.js    NOVO: padrões dos gráficos, barra de área, números da home.
- Os demais arquivos (ideb2025-*, netlify/, newsletters/, PDFs) não mudaram.

COMO PUBLICAR
Substituir os arquivos do site pelo conteúdo da pasta RIDEEDU, como nas edições
anteriores. Os dois arquivos novos precisam ir junto com o index.html.

COMO DESFAZER
Remover do index.html as três linhas que carregam as fontes novas,
ride-novo.css e ride-novo.js (logo antes de </head>) devolve o visual anterior
do conteúdo, mas não o menu nem a ordem das abas. Para voltar por inteiro, use o
zip de 06/11/2026.

ATENÇÃO NAS PRÓXIMAS EDIÇÕES
- Endereços: a raiz do site abre as notícias. "#apresentacao" abre a aba Sobre.
  Os endereços das seções de dados (#financas, #evolucao, #vaar etc.) não mudaram.
- No bloco de orçamento da home, os valores de Fundeb e de educação infantil são
  texto fixo no index.html (ids rnKpiFundeb e rnKpiInfantil). As faixas de MDE e
  de remuneração são lidas da tabela financeira ao carregar a página.
- A consulta do VAAR depende da função do Netlify (/api/vaar) e só funciona no
  site publicado, não ao abrir o index.html direto do computador.
