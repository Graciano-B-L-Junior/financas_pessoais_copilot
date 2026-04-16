# Referencias de UX/UI

## Objetivo
Consolidar o padrao visual e de experiencia observado na imagem de referencia para orientar qualquer auditoria, recomendacao ou implementacao feita pela skill `especialista-front-end`.

## Direcao geral
- Interface financeira premium, leve e organizada.
- Visual orientado a dashboard com blocos modulares, leitura rapida e baixa carga cognitiva.
- Aparencia amigavel e sofisticada, evitando visual corporativo pesado ou tema escuro agressivo.
- Sensacao de produto confiavel: espacamento amplo, contraste controlado e hierarquia muito clara.

## Principios de UX
- Priorizar escaneabilidade: informacao critica deve aparecer primeiro e em blocos bem delimitados.
- Reduzir friccao visual: poucos elementos competindo entre si por destaque.
- Usar agrupamento por contexto: saldo, cartoes, transacoes, grafico e score em cards distintos.
- Favorecer acoes diretas e legiveis, com botoes curtos e proximos ao contexto de uso.
- Manter navegacao superior simples, com poucos itens principais e campo de busca sempre visivel.
- Preservar sensacao de calma e controle; evitar excesso de alertas, bordas duras ou cores saturadas em massa.

## Layout e composicao
- Estrutura principal em dashboard com grid de cards arredondados.
- Cards grandes para informacao primaria e cards medios/pequenos para modulos secundarios.
- Bordas externas suaves e container principal com aspecto de painel flutuante.
- Muito espaco em branco entre secoes para separar funcoes sem precisar de divisorias pesadas.
- Alinhamento consistente em colunas, com respiro interno generoso.
- Em mobile, empilhar cards mantendo prioridade visual: saldo, transacoes, grafico e acoes.

## Hierarquia visual
- Numeros principais com tipografia grande e contraste alto.
- Labels de contexto discretos e menores que os dados.
- Conteudo secundario em tons frios e dessaturados.
- Acoes de apoio com destaque moderado, sem competir com KPIs.
- Um unico ponto focal por card.

## Linguagem de componentes
- Cards com cantos bem arredondados.
- Botoes em formato capsule ou pill quando forem acoes curtas.
- Inputs de busca compactos, com contorno leve e integracao natural ao header.
- Listas de transacao com avatar/icone circular, descricao, data e valor alinhado a direita.
- Graficos integrados ao card, com aparencia limpa e pouca cromia.
- Indicadores numericos e gauges devem parecer parte do sistema, nao widgets isolados.

## Estilo visual
- Base clara com fundo azul muito suave e cards em off-white, azul gelo e verde menta dessaturado.
- Sombras difusas e discretas, sem profundidade pesada.
- Bordas quase invisiveis ou com contraste minimo.
- Ilustracoes geometricas e linhas curvas podem ser usadas como detalhe decorativo leve.
- Aparencia glassy sutil e fosca quando fizer sentido, sem exagerar blur ou transparencia.

## Paleta sugerida
- Fundo geral: azul muito claro, frio e arejado.
- Superficies primarias: branco quebrado e azul gelo.
- Superficies de destaque: verde menta suave e azul pastel.
- Acentos funcionais: azul medio suave para CTA principal.
- Texto principal: quase preto ou azul marinho muito escuro.
- Texto secundario: cinza azulado.
- Estados negativos e positivos devem existir, mas com saturacao controlada.

## Tipografia
- Preferir sans-serif moderna com personalidade limpa e amigavel.
- Titulo e KPI com peso forte.
- Labels, datas e metadados com peso regular e tamanho reduzido.
- Evitar excesso de variacao de peso e tamanho; a hierarquia deve vir do contexto e do espaco.

## Espacamento e densidade
- Usar espacamento generoso em containers e cards.
- Evitar listas comprimidas e formularios muito densos.
- Priorizar ritmo visual estavel com paddings consistentes.
- Manter respiro entre blocos interativos para favorecer toque e leitura.

## Iconografia e elementos graficos
- Icones simples, finos e arredondados.
- Avatares e badges circulares reforcam o padrao visual.
- Linhas decorativas curvas e formas circulares podem ser usadas para enriquecer cards informacionais.
- Graficos devem ter leitura imediata, com no maximo um destaque forte por visualizacao.

## Motion
- Animacoes leves, curtas e suaves.
- Priorizar fade, slide curto e stagger discreto na entrada dos cards.
- Evitar transicoes chamativas, bounce ou efeitos com excesso de escala.

## Acessibilidade
- Garantir contraste suficiente mesmo com paleta suave.
- Nao depender apenas de cor para indicar saldo positivo, negativo ou estado de selecao.
- Preservar foco visivel em botoes, links, busca e itens interativos.
- Em tabelas e listas de transacoes, manter semantica legivel para leitor de tela.

## Regras praticas para implementacao
- Sempre preferir cards modulares a blocos longos sem separacao.
- Sempre manter a interface clara, arejada e com tons frios suaves.
- Sempre evitar visual generico de template SaaS escuro ou minimalismo seco demais.
- Sempre equilibrar dados e decoracao; ornamentos nunca devem prejudicar leitura.
- Sempre adaptar o padrao ao design system existente quando o projeto ja tiver linguagem consolidada.
- Quando houver conflito entre a referencia e o produto atual, preservar usabilidade, consistencia e acessibilidade.

## Anti-padroes
- Gradientes agressivos ou neon.
- Cartoes com sombra pesada e borda escura.
- Header poluido com muitas acoes concorrentes.
- Tipografia condensada ou fria demais para dados financeiros cotidianos.
- Excesso de elementos simultaneamente destacados.
- Interfaces escuras por padrao quando nao houver exigencia explicita.

## Checklist de aderencia visual
- O layout esta organizado em cards bem definidos?
- O fundo e as superficies usam tons claros e suaves?
- Existe hierarquia nitida entre KPI, label e dado secundario?
- Os componentes parecem leves, arredondados e contemporaneos?
- A navegacao principal esta simples e escaneavel?
- O grafico e a lista de transacoes estao integrados ao restante da interface?
- A tela transmite calma, clareza e confianca?
