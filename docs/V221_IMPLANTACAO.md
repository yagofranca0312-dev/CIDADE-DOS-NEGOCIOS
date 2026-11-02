# CIDADE DOS NEGÓCIOS — V2.2.1 — IMPLEMENTAÇÃO CANDIDATA / TIANGUÁ

**Data:** 02/11/2026  
**Estado:** IMPLANTAÇÃO TÉCNICA EM BRANCH, NÃO HOMOLOGADA. **GATE ARTÍSTICO G1/G2 NÃO APROVADO.**  
**Branch:** `feature/v2.2.1-cidade-tiangua-prerender`  
**Base:** V2.2.0-rc.1, `main` (schema 9). A versão do motor permanece `2.2.0-rc.1` até uma decisão posterior de lançamento.

## O que já existe

- Cena de Tianguá em **mapa isométrico pré-renderizado** com fundo WebP incorporado ao HTML único.
- Camadas dinâmicas: **18 hotspots SVG**, seleção poligonal contida nos limites do lote, rótulos e sprites independentes de **mercado, padaria e loja de roupas**.
- Os edifícios aparecem somente quando unidades reais são retornadas por `Core.businesses(state)` — não por flags DEMO nem valores hardcoded da arte.
- Inspector de lote oculto até a seleção; ações de abrir empresa, ativar unidade, selecionar cidade e voltar à gestão conectadas às rotinas originais.
- Barra superior com data real, caixa consolidado e resultado acumulado da carreira, e contador de unidades 0–5. **Não exibe resultado fictício de +4,8%.**
- Quatro destinos de navegação, calendário, velocidade, Observatório, atividade da carreira, configurações e backup continuam conectados à estrutura existente.
- `src/core/game.js` mantido sem alterações. `schemaVersion=9`. O renderizador V2.2 continua sendo o fallback das outras 29 cidades.
- HTML único offline reconstruído pelo `tools/build.mjs`, sem CSS ou JS remoto para jogar.

## Evidências observadas

- `npm run check`: **183/183 testes PASS, 0 FAIL** (reconstrução local e suítes herdadas + 9 cenários V221).
- Playwright/Chromium, HTML executado com `set_content`: criação de carreira no motor real; **0 prédios no início**, 18 hotspots; abertura sequencial de mercado no lote 03, padaria no 08, roupas no 17; **0, 1, 2 e 3 imagens de edifícios** conforme o estado; contador real chega a 3/5; ausência de erros JavaScript no fluxo executado.
- Teste móvel em viewport 390×844: 18 lotes, quatro destinos inferiores, sem erros JavaScript no fluxo de abertura inicial.
- Cenas e sprites são assets WebP sob `src/visual/scenes/tiangua/assets` em base64 para distribuição no HTML offline; hashes em `manifest.json`.

## Problemas conhecidos que bloqueiam o merge

1. **G1 ARTÍSTICO ABERTO:** o fundo vazio foi reconstruído por composição manual a partir da imagem aprovada, mas a região do antigo prédio do lote 03 ainda tem emendas perceptíveis. Não é uma arte final limpa aprovada.
2. **G2 ARTÍSTICO ABERTO:** os sprites por ramo foram isolados de estudo visual; existem pequenos artefatos de retoque na base das fachadas onde havia números ilustrativos. Exigem sprites limpos de produção com o mesmo ângulo, escala e direção de luz.
3. Calibrar a oclusão/escala de prédios em todos os 18 lotes e melhorar a composição em celular. Alguns lotes vizinhos ficam visualmente próximos às fachadas altas.
4. Testar **Windows nativo `file://`**, `JOGAR_OFFLINE.bat`, exportação/importação JSON, persistência de `localStorage` após fechar/reabrir. O navegador automatizado deste ambiente bloqueou navegações `file://` e `localhost`; foram usados testes com documento carregado em memória, que **não** substituem o gate Windows.
5. Testar navegadores a 320, 360, 390, 768, 1280, 1536, 1920 pixels e zoom de acessibilidade; os testes documentados não equivalem a aprovação estética.
6. Não homologar nem fazer merge sem revisão visual expressa do jogador e novas evidências de qualidade dos assets.

## Critérios para concluir

- Remover inteiramente o prédio fixo do lote 03 sem emenda visível e sem distorcer ruas/calçadas, mantendo os **18 lotes vazios** no fundo.
- Revisar sprites mercado/padaria/roupas sem números e sem manchas; calibrar âncoras, projeção, sombras e escala.
- Verificar render real de 0, 1, 2, 3 e 5 unidades no município, além de saves reabertos e seleção, foco e zoom.
- Executar CI no GitHub após enviar as fontes, comprovar HTML reproduzível, e só então submeter o piloto ao aceite de Yago.
- Outras 29 cidades continuam intocadas até uma fase posterior.

## Cautela de segurança

Execute somente uma cópia separada do protótipo/jogo candidato. **Exporte o backup JSON da instalação atual antes de experimentar**. Não copie o `index.html` candidato por cima da instalação homologada sem aceite final. Atualizador automático pode sobrescrever uma candidata com o que estiver publicado em `main`.

## Correção de retomada do protótipo aprovado (02/11/2026)

**Objetivo estrito:** restaurar a imagem aprovada, eliminar o contorno de seleção que atravessava a fachada do lote 03 e conectar os estados de propriedade aos recursos gráficos, sem redesenhar o mapa ou alterar o motor.

- A imagem `urban-base.webp.b64` agora é extraída **exatamente** do `<img id="map-art">` do protótipo previamente aprovado. Não há inpainting, retoco nem cenário substituto.
- **Observação importante:** a própria imagem aprovada tem um prédio comercial pré-renderizado no lote 03 e uma legenda ilustrativa embutida. São elementos do cenário, **não comprovantes de que o jogador possui uma unidade**.
- Para o lote 03, a abertura real `EMPRESA.ABRIR` ativa uma placa dinâmica `MERCADO`, `PADARIA` ou `ROUPAS` na fachada existente; a seleção realça somente o marcador `03` e não desenha polígonos sobre fachada/ruas.
- Para os lotes restantes, só se renderizam sprites de unidades retornadas pelo Core. Os sprites ficaram menores para reduzir a invasão de ruas e de lotes adjacentes. Ainda há limitação artística de oclusão, a ser verificada pelo titular.
- A legenda do canto inferior esquerdo foi substituída por uma **legenda SVG dinâmica dentro do mesmo viewBox**, que cobre os números fixos da imagem e reflete `unitMap.size` (0–5 no grupo); isso evita informações visuais conflitantes.
- O título de Tianguá pré-impresso na arte continua exatamente como aprovado. O botão para trocar de município é uma região clicável transparente sobre o mesmo título, sem duplicar o banner.
- A seleção de demais lotes usa um polígono **interno** ao footprint, com espessura contida, sem halo externo.

**Verificação:** `npm run check` com 186 testes após o hotfix; smoke Playwright/Chromium com 0, 1 e 3 unidades e abertura por ramo; viewport móvel 390×844; nenhum erro JavaScript nos fluxos exercitados.

**Pendências antes de homologar:** revisão visual pelo usuário, validação nativa Windows `file://`, persistência de save e acessibilidade com zoom. O PR permanece draft e a `main` não deve ser alterada.

## Patch de interface responsiva — 02/11/2026 (revisão de UX)

**Escopo estrito:** restaurar informações do protótipo visual aprovado e eliminar o recorte horizontal do mapa em smartphone, sem mexer no motor ou na arte-base homologada visualmente.

- Aviso persistente e correto: `SIMULAÇÃO EDUCATIVA` — valores financeiros fictícios do jogo; não foram copiados os números ilustrativos da primeira imagem.
- Legenda acessível e dinâmica em HTML: terrenos disponíveis por cidade (18 menos as unidades na cidade), quantidade de empresas da cidade e indicação da seleção atual. O HUD de estabelecimentos permanece **total do grupo**, como sempre.
- Mapa com encaixe integral padrão em telas até 890px, retirando `min-width:900px` e qualquer extrapolação horizontal.
- Botão **Ampliar mapa**: alterna visão geral e ampliação horizontal rolável; não altera save, economia, seleção nem objetos visuais.
- Em até 620px, HUD em duas colunas e banner funcional **Tianguá · CE** acima do mapa, sem corte de caracteres. O título previamente gravado na cena permanece parte da imagem original, em escala pequena.
- Quatro botões inferiores mantidos; lote 03 e sprites por ramo não alterados.

**Testes:** 190 testes Node (`npm run check`) aprovados, incluindo 4 verificações novas da UI. Validação em Chromium headless com largura 320, 390, 740 e 1536px (zero exceções JS no fluxo exercitado); ensaio de 3 aberturas reais no motor em 390, 740 e 1440px: Mercado lote 03, Padaria lote 14 e Roupas lote 18. Legenda `15 disponíveis / 3 empresas`, HUD `3/5`, patrimônio do jogo consistente. Panorama inicial sem scroll lateral de documento; zoom opcional amplia mapa para interação. Teste nativo `file://` no Windows e revisão visual do usuário continuam pendentes.

**Regra de release:** permanecer em PR Draft até o usuário confirmar interface e comportamento no próprio computador. Nunca atualizar `main` automaticamente pela candidata.