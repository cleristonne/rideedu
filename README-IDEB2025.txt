RIDEEDU — Consulta nacional do Ideb 2025

Funcionalidade atualizada
- Página “Veja o Ideb 2025 da sua escola, município ou estado”.
- Consulta nacional por unidade da Federação, município e escola.
- Consulta municipal: anos iniciais, anos finais e ensino médio.
- Consulta escolar: anos iniciais, anos finais e ensino médio, conforme as bases escolares oficiais fornecidas.
- Filtros por recorte, UF, etapa, município, rede e nome/código da escola.
- Acessos rápidos para Brasil, Nordeste, Bahia, Pernambuco, RIDE e Vale do São Francisco.
- Série histórica, variação 2023–2025, componentes, posições e rankings.
- Valores ausentes são exibidos como “sem resultado” e não como nota zero.

Arquitetura dos dados
- ideb2025-data/index.js: índice nacional, municípios, territórios e resumos estaduais.
- ideb2025-data/ufs/UF.js: dados municipais e escolares carregados sob demanda por UF.
- A separação por UF reduz o carregamento inicial e funciona tanto em site publicado quanto na abertura local do index.html.

Nota sobre o modo Estado
O painel apresenta média simples dos resultados municipais válidos da UF e do recorte escolhidos. Essa medida é um panorama comparativo e não substitui o Ideb oficial da unidade da Federação.

Publicação
Publique todo o conteúdo desta pasta, preservando os nomes e a estrutura de subpastas.
