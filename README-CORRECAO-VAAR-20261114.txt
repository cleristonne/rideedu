RIDE EDU — CORREÇÃO DO MÓDULO VAAR 2026 — 14/11/2026

DIAGNÓSTICO
A rota pública /api/vaar estava retornando HTTP 502 na publicação do
rideedu.com.br (quatro solicitações observadas em 14/11/2026). A função
consultava os endereços dos arquivos .csv no portal FNDE/Plone como se
estes fossem endereços de download direto, embora possam fornecer a
página HTML de apresentação do arquivo. O parser então não localiza o
cabeçalho do CSV.

ALTERAÇÕES
1. netlify/functions/vaar.js
   - Consulta direta aos bytes CSV usando /@@download/file, com segunda
     tentativa em /@@display-file/file e, por último, acesso legado.
   - Rejeita conteúdo HTML com HTTP 200 e arquivos sem estrutura CSV.
   - Decodificação UTF-8 ou Windows-1252, conforme a codificação válida.
   - Checa integridade mínima da relação nacional (ao menos 5.000 municípios).
   - Mantém a distribuição do 3º levantamento de 2026, com indicador de
     disponibilidade de cada fonte e contagens para conferência.
   - Não transforma ausência de valor oficial em zero.
2. index.html / ride-novo.css
   - Mensagem de indisponibilidade legível e botão “Tentar novamente”.
   - Validação de carga completa e distinção de indicadores ou valores ausentes.
   - Bloqueio de chamadas simultâneas duplicadas ao endpoint.
   - Tratamento de conteúdo textual exibido na tabela e no detalhamento.
3. tests/vaar.test.js
   - Cinco testes de comportamento com respostas HTTP simuladas, incluindo
     arquivo correto, resposta HTML, erro 502, carga parcial e Windows-1252.

FONTES OFICIAIS
https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026
Os quatro arquivos utilizados pelo backend estão declarados em SOURCES
no início de netlify/functions/vaar.js. Os arquivos oficiais são obtidos
pela rota de download do portal, sem alteração dos dados publicados.

PUBLICAÇÃO NO NETLIFY
O ZIP de entrega tem os arquivos na RAIZ (index.html, netlify.toml,
ride-novo.css, netlify/functions/vaar.js etc.), preparados para publicar
no projeto Netlify EXISTENTE "rideeducacao" (https://rideedu.com.br).
Publique a pasta descompactada/arquivos no projeto existente. Não publique
somente o index.html: o endpoint /api/vaar depende da Netlify Function.
Não crie outro site no Netlify; será necessário um novo deploy no atual.

VALIDAÇÃO APÓS A PUBLICAÇÃO
1. Abrir https://rideedu.com.br/api/vaar . O retorno esperado é JSON
   com exercise=2026, count>=5000, records e sourceStatus.
2. Na seção "VAAR 2026", consultar Juazeiro e Petrolina. Conferir
   condicionalidades e valores com os anexos oficiais da 3ª publicação.
3. Conferir sourceStatus; se um arquivo secundário estiver ausente,
   os campos correspondentes serão informados como indisponíveis.
4. Se persistir erro 502, consultar Logs > Functions > vaar no Netlify:
   bloqueios externos do FNDE ou alterações no formato do CSV exigem
   nova verificação em ambiente de produção.

OBSERVAÇÃO SOBRE TESTES
Sintaxe JavaScript e cinco testes com arquivos simulados aprovados.
Os downloads externos reais não puderam ser executados no ambiente local
de testes; portanto, a efetiva correção em produção só pode ser confirmada
após publicar o pacote e consultar /api/vaar no site.
