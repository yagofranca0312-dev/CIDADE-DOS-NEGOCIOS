# Cidade dos Negócios — V2.0.0-rc.1 — Consolidação técnica e experiência de jogo

**Estado:** candidata implementada localmente, testes automatizados e navegação real em navegador aprovados; homologação Windows do jogador pendente. **Data:** 02/11/2026.  
**Base de referência:** V1.9.0-rc.1 homologada pelo jogador, commit `575c54c676e024c4d5f9e0186cd404a62b636bd1`, branch `releases/v1.9.0-homologada`.

## Contrato da V2.0

**Não criar mecânicas novas.** Motor fiscal, vendas, estoque, preços, períodos, balances, RBT12, PIB, população, 30 cidades, 18 lotes e limite de cinco unidades têm o mesmo comportamento da V1.9. A V2.0 é dedicada à apresentação, coesão de arquitetura, redução do congestionamento de telas e preservação de dados.

Os documentos internos originais `INTERFACE.md`, `MOTORES.md`, `CONTROLADOR.md`, `ESTADO.md`, `PERSISTENCIA.md`, `TEMPO E IA.md`, `DIAGNOSTICO E QUALIDADE.md` foram adotados como *direção de planejamento* e não como mecânicas efetivamente disponíveis. As quatro imagens originais são referências de arte, não telas implementadas. A direção visual é «império empresarial em uma cidade viva».

## Arquitetura efetivamente aplicada

1. `src/core/game.js`: **CONGELADO**, alterado apenas no identificador `VERSION` e comentário inicial. A fixture da V1.9 em `tests/fixtures/core_v1_9_0.js` é confrontada byte a byte (normalizando só a versão). Assim, este release não reescreve contabilidade, tributação, mercado ou migração.
2. `src/visual/city-scene.js`: renderização SVG pura do distrito urbano, isolada da lógica de negócio; cliques continuam entrando por `Core.dispatch` no controlador de interface. Não há RNG novo, status inventados ou chamadas de rede.
3. `src/ui/app.js`: shell da aplicação, interpretação de navegação, vínculo de comandos e estado da interface. Renderizadores foram extraídos para `src/ui/market-views.part.js` e `src/ui/finance-views.part.js`. São **fragmentos de mesma closure** unidos em tempo de build, não scripts/URLs externos.
4. `src/shell/theme.css`: estilos históricos preservados para compatibilidade. `src/shell/v2.css`: identidade e composição V2 (tokens, mapa protagonista, cards compactos, menu lateral e barra inferior móvel, painéis expansíveis, foco). Próximo ciclo de manutenção poderá remover regras históricas redundantes com análise de cobertura CSS; não removê-las cegamente agora.
5. `tools/build.mjs`: compõe tema, V2 CSS, núcleo, cena visual, renderizadores e shell em **um único `index.html`**, valida título, abertura, HUD e rodapé de versão. O único JS executado continua inline, sem scripts externos.

## Arquitetura de informação e fluxos

A navegação principal agora possui **quatro áreas:** Cidade, Empresas, Mercado e Finanças. Configurações são uma ferramenta separada e Fiscal é acessado como subseção de Finanças. Não foi apagado nenhum formulário ou controle do jogo.

- **Cidade:** mapa em destaque com 18 lotes clicáveis e inspeção contextual. Se o terreno pertence à rede, o botão abre a gestão da unidade; se está disponível, permite inaugurar. O observatório e o histórico ficam em detalhes expansíveis, sem ocultar os dados oficiais quando solicitados.
- **Empresas:** gestão das cinco unidades, estado de operação e decisões existentes, sem inventar CNPJ ou caixa por filial.
- **Mercado:** compras e precificação visíveis; cadastro, demanda, promoções, catálogo, reposição e comprovantes em seções expansíveis. A consulta e abertura de seções não avançam calendário nem RNG.
- **Finanças:** relatórios e filtros existentes mais seção fiscal, acessível por botão interno. Projeções avançadas recolhíveis; resultados realizados não se confundem com estimativas.
- **Mobile:** uma barra inferior de quatro áreas, configurações no topo; rolagem e áreas de toque verificadas para impedir sobreposição de controles.

## Identidade e elementos ilustrativos

Paleta azul-marinho, azul financeiro, dourado e estados semânticos; tipografia de sistema. Paisagem SVG isométrica com diferenças de porte urbano já previstas na V1.6. Os 18 lotes continuam um distrito **fictício**; não há fidelidade cartográfica, novos edifícios funcionais ou níveis de construção criados nesta versão.

## Integridade e compatibilidade

- Esquema de save: **9**, inalterado. Arquivos exportados da V1.9 são importados sem nova migração e sem impostos retroativos.
- Mesmo seed + comandos + versão de regras ⇒ mesmos valores, RNG, calendário, lançamentos, produtos e eventos. O número exibido da aplicação é V2.0, mas o estado econômico permanece equivalente à V1.9.
- O HTML `file://` pode variar na persistência automática entre navegadores; backup JSON continua recomendado antes da atualização. Nenhum save pessoal é incorporado ao GitHub.
- As limitações fiscais da V1.9 permanecem: cenário Anexo I de 2026 sob condições muito restritas; IBS/CBS 2026 informativos; 2027+ sem regra apurável suportada. Não usar para apuração fiscal real.

## Testes observados na candidata

- `npm run check`: **154/154 PASS** após a modularização e a refatoração visual.
- Comparação determinística V1.9 versus V2 em cenários com e sem filial e com hipótese tributária ativada; verificação de ledger, estoque, RNG, calendário e relatórios.
- Navegador Chromium: 320, 390, 768, 1280, 1920 pixels sem exceções JS, sem rolagem horizontal, 18 lotes, menu de quatro áreas, transição Finanças↔Fiscal, inspetor e painéis expansíveis.
- Fluxo operacional real de interface: carreira → selecionar lote → abrir negócio → encomendar 60 unidades → avançar sete dias → DRE → Fiscal → Configurações → exportar JSON. Validado em 390 e 1280 px, caixa final consistente entre ambos.
- Atenção: ambiente de teste impede carregar `file://` diretamente; as verificações Playwright foram realizadas com conteúdo HTML embutido na página, sem verificar a persistência de `localStorage` **entre reinicializações**. A homologação Windows cobre esse ponto.

## Gates pendentes de homologação

1. Publicar branch/PR no GitHub, exigir CI remota PASS e verificar o commit publicado.
2. Garantir HTML/ZIP de distribuição e atualizador compatíveis com a versão na `main`.
3. No Windows: backup JSON prévio; iniciar V2; conferir versão em título, abertura, topo e rodapé; importar save V1.9 e comparar saldos; fechar/abrir o arquivo; testar ambiente offline.
4. Confirmar visual e fluxo na máquina do jogador. **Não marcar homologada sem aceite explícito do usuário.**

## Diretriz de produto

Esta versão é **consolidação**, não expansão. Funcionalidades do planejamento original ainda não implementadas (RH, fabricação, bancos, transporte, construção por níveis, tributação completa) continuam fora da interface como gameplay; nenhum valor ou indicador não derivado do motor poderá aparecer como realizado.
