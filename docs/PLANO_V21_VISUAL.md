# V2.1 — Identidade Visual, HUD e Clareza de Jogo

**Projeto:** Cidade dos Negócios — Edição 2  
**Data:** 02/11/2026  
**Estado:** PLANEJADO — NENHUMA IMPLEMENTAÇÃO INICIADA  
**Base homologada:** V2.0.0-rc.1, branch `releases/v2.0.0-homologada`, commit `ac3e840b71d3551026f62cc6a04c9173f553f9d7`.  
**Versão de destino proposta:** `2.1.0-rc.1`. **Schema de save:** 9, sem alteração.

## 1. Diretriz de produto vinculante

**Linha 2.x = exclusivamente melhorias visuais, apresentação, legibilidade, organização de telas e interação com sistemas existentes. Linha 3.x = novas funcionalidades e mecânicas.**

A V2.1 **não** adicionará objetivos, progressão econômica, reputação, funcionários, bancos, logística, novos tributos, atividades, construções ou qualquer efeito novo no mundo. Não haverá bônus econômicos por elementos visuais, nem valores fictícios apresentados como cálculo realizado. A ideia é **“uma cidade viva onde se administra um império empresarial”**, nunca um ERP com mapa decorativo.

A V2.1 é o **primeiro patch de refinamento artístico da Edição 2**: marca, entrada no jogo, HUD e hierarquia dos painéis. A reconstrução visual profunda do mapa, atlas de edifícios e ambientação ficam prioritariamente para V2.2; transições e efeitos avançados poderão continuar em V2.3.

## 2. Fontes de direção e rastreabilidade

- **Principal:** `INTERFACE.md` v0.1.0, 01/11/2026, direção visual proposta: cidade antes da planilha; paleta azul-marinho/azul/dourado; menu único; HUD compacto; painéis contextuais; HTML único; indicadores auditáveis. Arquivo original disponível nos materiais de planejamento, não inventar que está versionado no GitHub.
- **REF-01:** `1.LOGO.jfif` — símbolo de edifícios e seta ascendente; prata/branco e dourado sobre azul-marinho. Recriar variantes simplificadas e legíveis, sem apenas miniaturizar o JPG.
- **REF-02:** `2.MOCK.jfif` — cidade sob HUD econômico e janela de gestão; usar composição/hierarquia, **corrigindo os dois menus duplicados e os números ilustrativos**.
- **REF-03:** `3.CONCEPT ARTS.jfif` — linguagem isométrica e famílias de edifícios; **não** implantar níveis 1–3, bancos, fábricas ou centros logísticos como mecânicas.
- **REF-04:** `4.KEYART.jfif` — identidade atmosférica de cidade empresarial ao pôr do sol; referência para abertura, **não mapa cartográfico** de Tianguá, Sobral ou outras cidades.
- **Código vigente:** `docs/V20_CONSOLIDACAO.md`, `src/shell/index.template.html`, `src/shell/theme.css`, `src/shell/v2.css`, `src/ui/app.js`, `src/visual/city-scene.js`, `tools/build.mjs`; o motor `src/core/game.js` deve permanecer intocado, exceto identificador de versão quando necessário.

**Fontes de arte:** não inserir diretamente os quatro JPGs grandes no HTML final sem verificar direitos e orçamento de tamanho. Preferir derivados vetoriais/geométricos originais e leves, baseados na linguagem visual, sem replicar informações fictícias das referências.

## 3. Diagnóstico da V2.0 homologada

A V2.0 já organiza a navegação em **quatro áreas** (Cidade, Empresas, Mercado, Finanças), Configurações separado, Fiscal dentro de Finanças, distrito SVG com **18 lotes** e ferramentas recolhíveis. Isso deve ser **preservado**.

Capturas da V2.0 em 1280 e 390 px indicam oportunidades concretas:
1. A marca exibida na lateral e na abertura é esquemática; ainda não transmite toda a força visual de REF-01.
2. O mapa ganhou protagonismo, porém o observatório econômico, quando expandido, alonga muito a página e disputa atenção com o mundo.
3. No celular, muitos avisos/textos e cartões ficam empilhados antes de chegar à próxima decisão; navegação inferior precisa de verificação rigorosa de sobreposição/foco.
4. Cards e avisos misturam graus de importância; rótulo, valor, período, origem e status nem sempre têm a mesma hierarquia visual.
5. Há camadas CSS históricas e regras responsivas acumuladas; consolidar **somente as regras de apresentação tocadas pelo patch**, com screenshots e testes de regressão, sem refatorar o motor.

## 4. Direção de arte V2.1

- **Marca:** “CIDADE DOS NEGÓCIOS”, edifícios + seta de crescimento, azul-marinho profundo, azul financeiro e dourado. Variantes para abertura, barra lateral, ícone pequeno e favicon; forma reconhecível em 32 px.
- **Paleta:** partir dos tokens de `INTERFACE.md`: `#091629`, `#10243E`, `#193451`, `#51A9DF`, `#E9AD50`, `#F4D49A`, `#F4F7FB`, `#B8C6D8`, `#51BD83`, `#EF7070`. Derivações só com função semântica.
- **Atmosfera:** iluminação e profundidade visual moderadas; painel escuro sobre cidade, mais jogo que software contábil. Não criar um fundo de cidade fictícia que substitua o distrito jogável nem alegar geografia real.
- **Tipografia:** sistema local, escala consistente e dígitos tabulares para moedas; todas as métricas com unidade e referência temporal; evitar textos minúsculos sobre o mapa.
- **Foco:** um único botão primário por contexto, estados de seleção/perigo/sucesso acessíveis sem depender apenas da cor.
- **Movimento:** microtransições de aproximadamente 120–220 ms; `prefers-reduced-motion`; animação estritamente visual, sem alterar `tick`, `rng`, ledger ou transações.

## 5. Plano de patches (até seis incrementos)

### V21-P01 — Baseline, inventário e protótipo de composição
- Congelar screenshot comparativo da V2.0 em 320, 360, 390, 768, 1280 e 1920 px (telas: abertura, cidade com/sem empresa, mercado, finanças e fiscal).
- Inventariar tokens, CSS redundante, espaços, ordem visual, informações repetidas e áreas que desviam atenção do mapa.
- Criar wireframe estático de três momentos: (a) tela de entrada, (b) cidade vazia com lote selecionado, (c) empresa operando com inspetor aberto.
- Gate: aprovado o layout sem envolver o motor e sem mostrar ações inexistentes.

### V21-P02 — Marca, ícones e tela inicial (REF-01 + REF-04)
- Redesenhar logo em SVG simplificado e variantes de tamanho; manter assinatura original reconhecível.
- Atualizar splash/onboarding: proporção de arte/área útil, marca, “Novo Jogo” e “Importar” reais; não inventar botão “Continuar” sem validação de save existente.
- Fundo atmosférico leve, visual inspirado na KEYART, com arte otimizada e incorporada; não usar os grandes JPGs como textura de cada tela.
- Gate: logo legível em 32 px; abertura clara em 390/1280 px; zero dependências externas.

### V21-P03 — HUD e linguagem de indicadores (REF-02 corrigida)
- HUD prioritário: cidade/data, caixa **consolidado**, comando de tempo existente, informação de situação/alerta confirmado; indicadores adicionais em expansão.
- Regra visual: até **quatro métricas prioritárias no desktop** e até **duas no mobile**; o restante precisa ter caminho acessível, não desaparecer.
- Componente de métrica consistente: `label + value + unit + period + status + source`; distinguir **caixa / receita / lucro / tributo devido / tributo pago**.
- Estados visuais para seleção de lotes, empresa ativa, estoque insuficiente ou resultado negativo **somente se o motor já emitir essa condição**.
- Gate: nenhum valor mockado; HUD observacional; mesma execução de comandos com e sem efeitos de UI.

### V21-P04 — Paineis contextuais e densidade da cidade
- Refinar o inspetor de lote/empresa para um painel legível; dados essenciais primeiro, ações secundárias recolhíveis.
- Diminuir peso visual de textos educativos persistentes: aviso curto sempre visível + detalhe acessível por expansão, sem suprimir limitações legais.
- Observatório, notícias e tabelas secundárias **fechados por padrão** quando adequado; estado de abertura é preferência de UI, nunca dado econômico.
- Em dispositivos móveis, evitar que navegação inferior, toast ou aviso cubra o botão principal; preservar retorno claro ao mapa.
- Gate: seleção de lote → ação existente alcançada em até três interações em roteiro de teste; nenhum controle inacessível.

### V21-P05 — Coesão de Mercado, Finanças e Fiscal
- Aplicar as mesmas regras de cartões, títulos, espaços, botões, alertas e overlays às quatro áreas.
- Visões de DRE/BP/DFC e Fiscal ficam compactas e legíveis; detalhes históricos/justificativas em divulgação progressiva.
- Fiscal nunca usa “R$ 0,00” para denotar regra inexistente: preservar `NOT_COVERED` / `UNSUPPORTED` e natureza educativa.
- Sem novos gráficos ou séries de dados sem contratos existentes; apenas apresentação dos dados já calculados.
- Gate: compras, preços, DRE e pagamento simulado funcionam igual à V2.0.

### V21-P06 — Acessibilidade, desempenho e release
- Medir peso do HTML, renderização em tela e eventos/listeners antes/depois; não definir meta arbitrária sem baseline, mas bloquear regressões relevantes.
- Testar contraste (WCAG AA onde aplicável), zoom 200%, foco teclado, Enter/Espaço/Escape, alvo de toque 44×44 px e movimento reduzido.
- Consolidar apenas CSS comprovadamente redundante nas telas tocadas; preservar comportamento responsivo em 320, 360, 390, 768, 1280, 1920 px.
- Executar `npm run check`, comparação golden de motor V2.0×V2.1, QA de navegador e empacotamento `index.html` offline + ZIP + BAT.
- Testar versão coerente no `package.json`, motor, título, abertura, HUD, rodapé e nomes de download; nenhuma referência antiga `v2.0.0` deve aparecer como versão **corrente** (histórico pode permanecer).

## 6. Proibições e limites do escopo

**Proibido nesta versão:** adicionar novas regras comerciais, fiscais, contábeis, IA, objetivos, RH, edifícios funcionais, sistema de níveis, bônus de prestígio/reputação, saldo por filial ou eventos geradores de dinheiro. O visual de bancos, fábricas e sede nível 3 em REF-03 não autoriza seu uso como empresa jogável. A linha V3 será a porta de entrada das novas mecânicas.

**Preservar:** 30 cidades, 18 lotes por mapa, máximo de cinco unidades, HTML offline único, `schemaVersion:9`, saves, resultados, saldo, estoque, RNG, impostos simulados, calendário e comandos.

**Não antecipar para V2.1:** redesenho profundo do atlas de edifícios/mapa e ambientação das cidades (V2.2), efeitos visuais avançados de transição e feedback (V2.3), salvo refinamentos leves indispensáveis para consistência.

## 7. Gates de homologação

- **G01 — Identidade:** logo, cores, tipografia e identidade legíveis e coerentes com REF-01/REF-04, sem incorporar imagens gigantes desnecessárias.
- **G02 — Foco de jogo:** mapa preservado como protagonista; sem dupla navegação; inspetor não monopoliza a tela; 4 métricas prioritárias desktop / 2 mobile.
- **G03 — Rastreabilidade:** cada status/valor exibido vem de consulta já implementada no motor, com período/fonte; dados ausentes não viram zero.
- **G04 — Preservação:** mesma carreira + seed + sequência de comandos V2.0/V2.1 gera os mesmos valores de mercado, financeiro, fiscal, eventos e RNG; consultas e animações não mutam `state`.
- **G05 — Usabilidade:** fluxos de abrir loja, encomendar estoque, consultar DRE, acessar Fiscal, exportar/importar backup, percorridos em mouse, teclado e toque.
- **G06 — Responsividade:** 320/360/390/768/1280/1920, sem rolagem horizontal global, controles ocultos ou sobreposições críticas.
- **G07 — Distribuição:** build reproduzível; mesma versão em todos os locais, CI PASS, ZIP com atualizador e HTML único offline; schema 9 e backup seguros.
- **G08 — Homologação:** validação prática no Windows por Yago e aceite expresso. Até lá, versão candidata, nunca homologada.

## 8. Critério final

**V2.1 está pronta quando a marca é reconhecível, a primeira tela convida a jogar, a cidade continua central, os instrumentos de gestão estão legíveis e todas as decisões preservam integralmente a economia da V2.0.**

Estado das etapas: **P01–P06 planejadas, zero executadas**. A implementação depende do comando de início do usuário.
