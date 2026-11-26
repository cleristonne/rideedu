RIDEedu — atualização de 21/09/2026

1. Novo módulo VAAR 2026
- Página específica no menu Financiamento > VAAR 2026.
- Sem mapa.
- Consulta nacional por município ou código IBGE.
- Filtros por UF, habilitação/beneficiário e Condicionalidade III.
- Paginação dos resultados.
- Detalhe das Condicionalidades I a V, evolução dos indicadores, indicadores de atendimento/aprendizagem, situação de beneficiário, pendência oficial, coeficiente e complementação-VAAR prevista quando disponíveis.
- Dados obtidos sob demanda das bases oficiais do FNDE.

Fontes do módulo VAAR:
- Lista de entes beneficiários e não beneficiários à complementação-VAAR 2026.
- Indicadores de Atendimento e Aprendizagem VAAR 2026.
- 3ª publicação do Fundeb 2026 — Portaria MEC/MF nº 11, de 28/08/2026 — redes beneficiadas, coeficientes e complementação-VAAR prevista.

A consulta nacional é atendida por uma Netlify Function em:
netlify/functions/vaar.js
A rota pública configurada é:
/api/vaar

O arquivo netlify.toml já contém a configuração necessária. Como a consulta depende de função server-side, a publicação deve ser feita como site Netlify com Functions habilitadas (deploy pelo repositório/CLI ou outro fluxo que processe a pasta netlify/functions). Abrir somente o index.html localmente não carrega a base nacional.

2. Notícias / Vale Educa
- Nova edição: 15 a 21 de setembro de 2026.
- A edição anterior existente no pacote, 8 a 14 de agosto de 2026, foi mantida integralmente.
- Um seletor de edições permite alternar entre a edição atual e o arquivo.
- A atualização não sobrescreve o histórico.

3. Validações realizadas
- JavaScript do index.html validado com node --check.
- Netlify Function validada sintaticamente; o parser do arquivo de distribuição foi testado com o cabeçalho oficial da coluna “Complementação da União-VAAR (R$)”.
- IDs HTML verificados, sem duplicidades.

ATUALIZAÇÃO COMPLEMENTAR — 21/09/2026
- VAAR 2026: corrigida a leitura da coluna “Complementação da União-VAAR (R$)” da 3ª publicação do FNDE.
- VAAR 2026: acrescentada nota explicativa sobre habilitação, VAAR-Atendimento, VAAR-Aprendizagem, divisão 50/50, coeficientes e valores previstos.
- Página inicial: novo botão/card de destaque para a consulta nacional do VAAR 2026 e inclusão do tema no seletor “Comece por aqui”.
- Vale Educa: edição 15–21/09/2026 incorporada integralmente ao site, inclusive o editorial “A PND pode melhorar a entrada na carreira...”, assinado por Clériston Andrade.
- Vale Educa: a edição original em PDF foi incluída em /newsletters e as edições anteriores continuam disponíveis no seletor de arquivo.

CORREÇÃO 21/09/2026 — VAAR 2026 / valores previstos
- Diferencia explicitamente municípios não beneficiários ("Sem repasse — não beneficiário em 2026") de falha de carregamento de valor.
- Leitura mais tolerante do Anexo VI da 3ª publicação (Portaria MEC/MF nº 11/2026).
- Adicionado fallback pelo Cronograma de distribuição da complementação-VAAR (Anexo VII) para recuperar o total anual previsto quando o Anexo VI não for interpretado.
- API informa a quantidade de valores efetivamente carregados e o status das fontes.
- Cache reduzido para evitar manutenção de resposta antiga após atualização da publicação.
