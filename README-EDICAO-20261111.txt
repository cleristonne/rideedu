RIDE EDU — atualização Vale Educa de 7 a 11 de novembro de 2026

CONTEÚDO
- Nova edição do boletim Vale Educa cadastrada como principal na abertura.
- 14 matérias com referências e links; editorial; destaque; indicadores; documento; agenda.
- Arquivo da edição de 31/10 a 06/11 preservado, assim como as de setembro e agosto.
- PDF de seis páginas no diretório newsletters/ e JSON de apoio da edição.
- Destaques visuais e texto responsivo revisados na folha de estilo ride-novo.css.

ALTERAÇÃO SOLICITADA NA ABERTURA
- Removida da exibição a nota de 'Critério editorial' no destaque da newsletter,
  inclusive quando o leitor alterna para edições anteriores.
- A seção 'Leitura temática' exibe temas para acompanhar, sem critérios editoriais.

PRESERVAÇÃO DAS FUNÇÕES
- Menus e navegabilidade entre seções de dados mantidos.
- IDEB 2025, calculadoras, VAAR 2026, séries e arquivos originais preservados.
- Função Netlify /api/vaar mantida.

PUBLICAÇÃO
- O diretório RIDEEDU é a raiz publicável do site, conforme netlify.toml.
- Para implantar manualmente no Netlify, enviar os arquivos *dentro* da pasta
  RIDEEDU (a pasta deve corresponder à raiz de publicação), mantendo as
  subpastas newsletters/, netlify/ e ideb2025-data/.
- O ZIP entregue preserva a pasta RIDEEDU para facilitar a conferência.
- A edição fica na página principal (/) após a publicação do pacote no servidor.

CHECAGENS
- Sintaxe JavaScript verificada com node --check.
- PDF verificado por geração e extração de texto; links de fontes presentes.
- Integridade do ZIP testada.
- Pré-visualização no navegador não pôde ser executada neste ambiente
  por bloqueio de acesso local do navegador automatizado.
