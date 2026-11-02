# V2.2 — Mapa, Atlas de Edifícios e Ambientação Urbana

**Projeto:** Cidade dos Negócios — Edição 2  
**Data:** 02/11/2026  
**Estado:** PLANEJAMENTO APROVADO E CANDIDATA IMPLANTADA NA MAIN — CI PASS, QA DE NAVEGADOR/WINDOWS E HOMOLOGAÇÃO PENDENTES  
**Baseline de produto:** V2.1.0-rc.1, homologada por aceite expresso do titular em 02/11/2026, branch de recuperação releases/v2.1.0-homologada, commit 645467b0a87d037a049976a4d75e09c008894316.  
**Versão de destino proposta:** 2.2.0-rc.1. **Save schema:** 9, sem migração.  
**Escopo autorizado:** execução da implantação V2.2 em branch isolada, por ordem expressa do titular em 02/11/2026. Preservar V2.1 homologada e não declarar V2.2 homologada antes dos gates. A execução e pendências estão registradas em [V22_IMPLANTACAO.md](V22_IMPLANTACAO.md).

## 1. Objetivo do produto e fronteira vinculante

Transformar o distrito SVG existente em uma cidade isométrica **mais legível, rica e convincente como jogo de gestão empresarial**, preservando o protagonismo do mapa e a capacidade de administrar as empresas já existentes.

**Regra de roadmap aprovada:** toda a linha V2.x trata exclusivamente de arte, apresentação e experiência sobre sistemas já existentes; a V3.x é a primeira linha autorizada a incluir novas mecânicas. V2.2 concentra-se em MAPA + EDIFÍCIOS + AMBIENTAÇÃO. Efeitos de movimento e transições sofisticadas ficam em V2.3.

**Proibido na V2.2:** criar sistemas de nível de edifício, sedes evolutivas com bônus, indústria, banco, porto, logística, transporte, pessoas, clientes, reputação, empréstimos, novos impostos, imóveis negociáveis, novos negócios, crescimento de terrenos, recursos, renda, transações, clima simulado ou quaisquer efeitos econômicos. Imagem de banco, fábrica, centro de distribuição ou porto em referência conceitual NÃO equivale a mecânica existente. Nenhuma decoração pode sugerir controle jogável ou dado oficial inexistente.

**Preservação rígida:** 30 cidades (27 capitais + Tianguá, Sobral e Ubajara), 18 lotes selecionáveis por cidade, até cinco unidades do jogador por carreira, quatro áreas de navegação (Cidade, Empresas, Mercado, Finanças; Fiscal dentro de Finanças), interface V2.1, HTML único offline, valores de caixa/estoque/vendas/tributos, cronologia, ledger, calendário, RNG, comandos, importação/exportação, autosave e schemaVersion 9.

## 2. Baseline verificável e diagnóstico técnico

- O mapa atual reside em src/visual/city-scene.js, renderiza SVG por CidadeVisual.svgMap(city, ownedLots, lot), com grade 3 x 6, 18 grupos interativos identificados por data-lot e labels de acessibilidade. É apresentação independente do motor.
- O desenho atual usa contornos isométricos, telhados genéricos, volume variável por porte urbano local/regional/grande/metropole, pequeno skyline ao fundo e destaque do lote selecionado.
- A V2.1 já resolveu identidade de marca, abertura, HUD, inspetor, cartões e responsividade; não redesenhar esses componentes na V2.2, exceto ajustes diretamente exigidos pela integração ao mapa.
- O core em src/core/game.js só pode receber, se indispensável, o identificador de versão para a candidata. Não alterar regras, constantes, tabelas econômicas ou modelo de dados.
- Seleção e posse de lote são dados do jogo; texturas, cenário, câmera visual fixa, sombras e decoração são somente apresentação. O renderer não chama dispatch, não altera save e não consome RNG.

**Lacuna material:** o contrato atual recebe somente city, ownedLots e lote selecionado. Setor/arquétipo específico de uma empresa NÃO está presente nessa assinatura. Um edifício que represente uma atividade identificável só poderá ser desenhado como tal se um view-model SOMENTE LEITURA com dado existente, verificável e testado for provido pela UI. Caso contrário, usar arquitetura neutra, sem inventar setor, valor ou progresso.

## 3. Direção de arte

### 3.1 Identidade visual
- Continuidade da V2.1: azul-marinho, azul financeiro, dourado de seleção/ação, luz quente moderada e interfaces sóbrias.
- Cena isométrica 2D/2.5D em SVG; materiais estilizados, sombras contidas, leitura dos telhados e volumes. Não prometer mapa 3D livre, cartografia GIS, imagens aéreas ou reconstrução real de municípios.
- Separar visualmente **terreno livre/ocupação**, edifício do jogador, seleção e decoração pública. Posse e seleção precisam ser distinguíveis sem depender somente de cor.
- Organização em camadas: fundo ilustrativo → solo e ruas → vegetação e mobiliário → parcelas → edifícios → seleção/foco → rótulos. Itens decorativos não interceptam clique ou teclado.

### 3.2 Atlas visual de edifícios
- Definir um catálogo de formas SVG reutilizáveis: loja térrea, comércio de esquina, prédio comercial baixo, edifício de escritórios médio, galpão neutro e edifício urbano de fundo.
- Esse atlas é **gráfico**, não catálogo de tipos de empresa jogáveis: formas de banco, fábrica e logística da REF-03 são apenas referência estilística até que a V3 crie sistema correspondente.
- Volumetria e fachada consistentes (base, paredes, portas, vitrines, cobertura, sombra, iluminação de leitura). Manter qualidade em telas estreitas.
- Para terrenos com empresa existente, evidenciar **propriedade do jogador**, não evolução econômica inventada. Nunca construir sede nível 1/2/3 como regra sem evento do motor.
- Se a UI já fornecer setor confirmado, permitir um detalhe cosmético específico; caso contrário, genérico. Não inferir setor de cidade, tamanho ou número do lote.

### 3.3 Cenário e identidade por porte
- Quatro famílias gráficas compatíveis com city.sizeTier já disponível: local, regional, grande e metropole. Variar densidade de skyline, volume de construções de fundo e proporção de áreas verdes **sem alterar quantidade de lotes nem seus estados**.
- As 30 cidades devem ser reconhecíveis pelo nome, UF e perfil já registrado; diferenciação artística simbólica por city.id pode ser proposta, mas não pode atribuir geografia, porto, altitude, fluxo, bioma ou renda específicos sem referência apropriada. Não afirmar que o desenho replica Tianguá, Sobral, Ubajara, Fortaleza etc.
- Utilizar composição estável e determinística por identificadores visuais (sem Math.random/Date.now no desenho). Evitar colisões grosseiras do seed atual baseado apenas em comprimento de nomes.
- Ruas, calçadas, canteiros, iluminação fixa e alguns elementos decorativos de ambiente. Nada representa veículos operacionais ou pessoas reais com consequências no estado.
- Preservar horizonte e atmosfera da REF-04 como inspiração artística, NÃO utilizar sua composição portuária como geografia cartográfica de todas as cidades.

### 3.4 Leitura, navegação e acessibilidade
- Lotes 1–18 mantêm número, coordenada lógica, data-lot, ativação por mouse, toque, Enter/Espaço e feedback de foco; toda modificação de geometria precisa manter o contrato de clique.
- Retorno do inspetor à cidade não pode causar seleção incorreta nem perder o acesso à ação principal.
- Destaques de hover, foco, seleção e posse não podem ficar ocultos sob decoração nem usar apenas cor.
- Descrições acessíveis de elemento interativo devem refletir somente o estado realmente conhecido. Objetos de fundo ficam aria-hidden e pointer-events=none.
- Em mobile, a cidade e a escolha dos lotes continuam utilizáveis sem zoom obrigatório e sem rolagem horizontal global. Para cenas mais densas, priorizar legibilidade, não quantidade de objetos.

## 4. Patches previstos — ordem proposta

### V22-P01 — Auditoria visual e protótipo do mapa
**Objetivo:** fechar inventário e composição antes de refatorar SVG.  
**Trabalho futuro:** capturas de baseline V2.1 nas seis larguras; mapa vazio, lote selecionado e unidade própria; conferir área clicável dos 18 lotes, ordem de camadas, assinatura do renderer e custos do DOM; protótipo estático de cena com três níveis de densidade.  
**Saída:** wireframes e contrato de cena/atlas aprováveis.  
**Gate:** a proposta mantém 18 posições e ações, sem botão ou dado novo.

### V22-P02 — Solo, ruas e estrutura espacial
**Objetivo:** fazer o distrito parecer um espaço urbano coerente.  
**Trabalho futuro:** redesenhar malha isométrica, quadras, calçadas, ruas, áreas verdes, sombras de contato e elementos de fundo sem intervenção no modelo econômico.  
**Gate:** 18 áreas interativas equivalentes; nenhuma decoração captura clique; ausência de sobreposição crítica em 320/390/1280 px.

### V22-P03 — Atlas de construções
**Objetivo:** estabelecer linguagem arquitetônica consistente e identificável.  
**Trabalho futuro:** implementar peças geométricas reutilizáveis, variações de altura/fachada, construções de fundo e sinalização de posse. Avaliar view-model de UI somente leitura para ramo já conhecido, sem forçar alteração da assinatura se não necessário.  
**Gate:** nenhuma aparência inventa o setor, o status ou o nível; highlight e foco permanecem legíveis nos 18 lotes.

### V22-P04 — Ambientação das quatro escalas urbanas
**Objetivo:** diferenciar cidades por porte sem falsificar dados geográficos.  
**Trabalho futuro:** densidade de skyline, vegetação e fachadas por sizeTier já existente; variação cosmética estável por city.id, preservando 30 cidades e nome/UF na cena.  
**Gate:** todas as 30 cidades renderizam, inclusive as três cearenses não capitais; fundo é descrito como ilustrativo, sem novos cálculos ou declarações factuais.

### V22-P05 — Integração com HUD, inspetor e mobile
**Objetivo:** tornar mapa detalhado útil e jogável, não apenas bonito.  
**Trabalho futuro:** ajustar enquadramento, contraste, pontos de seleção, contornos e leitura com HUD V2.1 e inspetor aberto; preservar a navegação única; testar teclado, toque, zoom 200% e movimento reduzido.  
**Gate:** selecionar terreno → executar ação existente dentro do fluxo atual; interação funcional em todas as larguras, sem hover obrigatório e sem perda do foco.

### V22-P06 — Otimização, regressões e candidata
**Objetivo:** comprovar evolução artística sem regressão.  
**Trabalho futuro:** medir peso total do index.html, tempo de render, número de nós SVG e responsividade versus V2.1; otimizar <defs>, reuso de geometria e camadas sem dependências externas; registrar diferenças visuais e executar regressões.  
**Gate:** npm run check, comparação determinística V2.1×V2.2, GitHub CI, QA de navegador, pacote HTML + ZIP/BAT offline, validação Windows e aceite explícito do jogador. Versão sincronizada em package, abertura, HUD, rodapé e downloads.

**Nota de execução:** patches são unidades propostas de trabalho, não alterações realizadas. Agrupar P02–P04 em menos commits é permitido se os gates individuais continuarem auditáveis; evitar mudanças estruturais sem benefício verificado.

## 5. Contratos de implementação futura

- **Superfície prioritária:** src/visual/city-scene.js e folha de estilos visual dedicada à V2.2, incorporada por tools/build.mjs apenas após plano aceito.
- **Alterações condicionais:** src/ui/app.js somente para leitura/passe de dados já existentes ou foco/seleção; src/shell/index.template.html somente para apresentação; tools/build.mjs para empacotamento.
- **NÃO ALTERAR:** lógica econômica/fiscal de src/core/game.js; migrações de save, RNG, ledger, comandos, preços, estoque, estoque em trânsito, produtividade, tributos ou calendário. Atualização de VERSION é a única exceção planejada no core.
- **Dados geográficos:** população e PIB de versões anteriores podem servir de contexto somente se já expostos por API confiável; a V2.2 não reclassifica municípios nem aplica novos efeitos sobre demanda.
- **Assets:** preferir SVG original e pequenos símbolos gráficos; reutilizar a identidade V2.1, com orçamento de peso documentado. Não incorporar integralmente os JPGs de referência; verificar direitos de qualquer recurso redistribuído.
- **Segurança e qualidade:** manter escape de textos dinâmicos em SVG e evitar injeção via nomes, atributos ou HTML. Sem serviços externos ou download de fontes em runtime. Sem dependência de execução constante de animação para permitir interação.
- **Origem:** index.html é gerado pelo build a partir de src; não editar simultaneamente artefato gerado e fonte.

## 6. Matriz de testes e critérios de aceitação

**T01 — Contrato do mapa:** exatamente 18 lotes com data-lot 1–18, posição lógica inequívoca, mesmo fluxo de seleção, 0 controles cenográficos acionáveis.  
**T02 — Estados visuais:** cidade sem empresa, lote selecionado, unidade própria, múltiplas unidades em cidades diferentes, lote não próprio; seleção, hover, teclado e status são distintos.  
**T03 — Escala territorial:** renderização em todas as 30 cidades e quatro tiers. Conferir nomes e UFs sem alucinar mapa real.  
**T04 — Economias idênticas:** mesmo save + seed + sequência de comandos, comparando V2.1 e V2.2, produz mesmo ledger, caixa, produto, estoque, eventos, impostos didáticos, data e RNG; mera renderização não altera dados.  
**T05 — Save e backups:** schema 9 imutável, import/export JSON, persistência local, reinício e restauração de backup quando testáveis; não declarar Windows PASS por teste simulado.  
**T06 — Responsividade:** 320, 360, 390, 768, 1280 e 1920 px; sem rolagem horizontal, áreas de toque acessíveis e HUD não obstrui lotes.  
**T07 — Acessibilidade:** foco visível, nome acessível dos lotes, Enter/Espaço, contraste e zoom 200%, preferências reduced-motion respeitadas.  
**T08 — Distribuição:** HTML único offline, nenhum asset HTTP obrigatório, tamanho e render mensurados contra baseline V2.1; build reproduzível; atualização sem regressão de versão.  
**T09 — QA prático:** abrir carreira, trocar cidade, selecionar e inaugurar unidade, encomendar estoque, avançar dias, verificar DRE/Fiscal, exportar/importar, fechar e reabrir no Windows, sem perda de dados.  
**T10 — Governaça de release:** CI remoto PASS, documentação atualizada, snapshot recuperável e homologação expressa depois da experiência real. Nenhuma evidência futura é presumida antecipadamente.

## 7. Riscos principais e mitigação

1. **Mapa pesado** → medir baseline HTML/DOM/frame; reduzir detalhes no mobile; reusar símbolos SVG.
2. **Clique quebrado por geometria** → manter hit areas e testes automatizados 1–18; camadas decorativas sem interceptação.
3. **Gameplay falso pelo visual** → só exibir estados derivados do motor; arte genérica quando faltarem dados.
4. **Regressão econômica silenciosa** → core congelado e golden tests binários/determinísticos.
5. **Cidades descaracterizadas ou inventadas** → usar quatro perfis artísticos fictícios, com rótulo claro; sem simular cartografia real.
6. **Overengineering** → shader/3D livre, pathfinding, câmera complexa, sprites animados e mudanças de motor ficam fora da V2.2.

## 8. Referências e rastreabilidade

- [Interface original — fonte de direção visual no Drive](https://drive.google.com/file/d/1sjRvvWY0qd1GQLbMQrQ9bFali0RVw6nj/view)
- [REF-03 — Concept Arts (Drive)](https://drive.google.com/file/d/1apM7XiPPdVwHtqM_ZMmP-4SqPB_tYD_v/view)
- [REF-04 — Key Art (Drive)](https://drive.google.com/file/d/119whj7wEdJLlvvjJByJx34lCEecaCJzn/view)
- [V2.1 — implantação](V21_IMPLANTACAO.md)
- [V2.1 — plano visual](PLANO_V21_VISUAL.md)
- [V2.0 — consolidação](V20_CONSOLIDACAO.md)
- [Roadmap](ROADMAP.md)
- Código-base: src/visual/city-scene.js; src/shell/v21.css; src/ui/app.js; tools/build.mjs.

## 9. Decisão e próximo checkpoint

**Decisão inicial deste plano:** planejamento proposto e documentado. **Autorização posterior:** implantação expressamente solicitada por Yago em 02/11/2026; detalhamento técnico e evidências em V22_IMPLANTACAO.md.  
**Execução iniciada:** inventário técnico realizado e P02–P05 codificados em branch. Capturas/protótipos de comparação e gates de teste ainda precisam de verificação; ver registro de implantação.  
**Critério de conclusão da V2.2:** cidade mais rica e inteligível, 18 lotes e 30 cidades utilizáveis, motor e saves inalterados, HTML offline, regressões e QA aprovados, aceite explícito do jogador.

**Estados após publicação:** P01 = diagnóstico técnico parcial (capturas pendentes); P02–P05 = implementados, QA visual pendente; P06 = HTML e CI PASS (174/174), testes Windows pendentes; homologação V2.2 = PENDENTE. Ver V22_IMPLANTACAO.md.
