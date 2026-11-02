# Cidade dos Negócios — V2.2.0-rc.1 — implantação visual

**Data:** 02/11/2026  
**Status:** CANDIDATA EM BRANCH DE DESENVOLVIMENTO; AGUARDANDO CI, QA DE NAVEGADOR E HOMOLOGAÇÃO WINDOWS.  
**Branch:** `feature/v2.2.0-rc.1`. **Base de recuperação:** `releases/v2.1.0-homologada`, commit `645467b0a87d037a049976a4d75e09c008894316`.  
**Contrato:** V2.x apenas arte/UX; motor econômico e fiscal preservado, exceto VERSION; schemaVersion 9, sem migração.  
**Plano de referência:** [PLANO_V22_MAPA_ATLAS_AMBIENTACAO.md](PLANO_V22_MAPA_ATLAS_AMBIENTACAO.md).

## O que foi codificado

- **V22-P01 (diagnóstico técnico — parcial):** auditoria de `src/visual/city-scene.js`, seleção em `src/ui/app.js`, CSS V2.0/V2.1, build, testes e limite da assinatura do renderer. Capturas comparativas e protótipos visuais em seis larguras **não foram realizados nesta sessão**.
- **V22-P02 (implementado, QA pendente):** nova composição SVG de plataforma urbana, ruas, calçadas, sombras, vegetação, solo e ambiente, com separação entre cenário decorativo não clicável e terrenos jogáveis.
- **V22-P03 (implementado, QA pendente):** atlas geométrico SVG reutilizável com cinco arquétipos gráficos neutros. Apenas terrenos realmente pertencentes à rede recebem edifícios destacados; outros lotes permanecem visivelmente livres. Não há correspondência inventada com ramo, nível ou saldo.
- **V22-P04 (implementado, QA pendente):** densidade de construção decorativa segundo as quatro categorias `sizeTier` já existentes. Variação estável por `city.id`, sem `Math.random`, `Date.now`, novas cidades ou geografia real fictícia.
- **V22-P05 (implementado, QA pendente):** hit area e rótulos acessíveis para os 18 lotes, `aria-pressed`, distinção entre posse/seleção, seletor direto de lotes 1–18 para toque/teclado, restituição de foco após seleção por teclado, CSS responsivo em `src/shell/v22.css`.
- **V22-P06 (empacotamento técnico executado; validação pendente):** integração ao `tools/build.mjs`, sincronização de `2.2.0-rc.1` no core, package, título, abertura, HUD e rodapé; `index.html` compilado e versionado na branch. `tests/visual_v22.test.mjs` acrescenta 12 cenários de verificação estrutural, sem substituir os testes econômicos históricos.

## Limites do comportamento

- O motor `src/core/game.js` só muda as duas ocorrências do identificador `VERSION`, de `2.1.0-rc.1` para `2.2.0-rc.1`; seus efeitos econômicos não foram alterados deliberadamente.
- A assinatura de leitura `CidadeVisual.svgMap(city,ownedLots,lot)` é preservada: não foram introduzidos parâmetros de setor/edifício. Os edifícios funcionam como representação gráfica **genérica**.
- Os 18 lotes continuam numerados em uma grade lógica 3×6, `data-lot`, com seleção pela UI e nenhuma transação no renderer.
- Todas as 30 cidades recebem seus nomes e UFs do cadastro original. `sizeTier` afeta somente a densidade ilustrativa.
- HTML único offline; sem fontes, CSS ou scripts externos em tempo de execução. A arte de entrada da V2.1 continua incorporada.
- V2.3 permanece responsável por movimento avançado e feedback animado; funcionalidades econômicas novas ficam para a V3.x.

## Evidências por obter antes da aprovação

1. `npm run check`, teste de `git diff --exit-code -- index.html` e GitHub Actions CI, depois de abrir PR.
2. Comparar saídas determinísticas V2.1×V2.2 (incluindo fiscal, estoque, calendário, RNG e ledger), verificando `core` byte a byte após normalizar apenas VERSION. O teste já está escrito, mas não contabilizar como PASS antes da execução observada.
3. QA real em Chromium ou outro navegador: 320, 360, 390, 768, 1280 e 1920 px; seleção nos 18 lotes, toque, teclado, inspeção, expansão do HUD, navegação, zoom 200% e foco visível. **Não há evidência de captura ou teste de navegador nesta sessão.**
4. Medir peso do executável, quantidade de nós de cena, tempo de render e fluidez em aparelho real; os limites de arquivo e grupos presentes em teste são controles preventivos, não benchmark de desempenho medido.
5. Windows nativo: `JOGAR_OFFLINE.bat`, `file://`, importação/exportação, backup JSON prévio, persistência de `localStorage` após fechar/abrir, retomada do jogo e rollback.
6. Homologação expressa de Yago após testar a candidata. **Não confundir implantação em branch, CI ou PR com homologação.**

## Critérios de bloqueio

Falha do `npm run check`, HTML gerado divergente, alteração econômica não justificada, perda de lote acionável, seleção quebrada, situação tributária simulada apresentada como real, navegação indisponível ou perda de save impedem homologação.

**Estado do projeto ao registrar este documento:** alterações de código e pacote HTML da V2.2 implementadas na branch; PR, CI, QA nativo e homologação ainda pendentes. Este registro deve receber um adendo datado quando os gates forem efetivamente executados.
