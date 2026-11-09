# Cidade dos Negócios V3.1.0 — Implantação e homologação

**Fonte:** roadmap HTML V2–V3 v2026.11.04/1. **Autorização:** protótipo e implantação aprovados pelo titular em 08/11/2026.

## Checkpoints 3.1.0-01 a 09
01. Cidade principal, dock e HUD; 02. zoom, pan e câmera em sessionStorage; 03. painéis contextuais sobre o mapa, usando os formulários originais; 04. cinco acessos globais na dock, sem modo clássico; 05. lotes reais da carreira via read-model puro; 06. tempo comandado pelos botões antigos e notificações de eventos efetivos; 07. mobile com painéis inferiores; 08. teclado, Escape, foco e movimento reduzido; 09. build, testes de Node, Windows Chrome/Edge e regressões.

## Invariantes
Sem segundo dispatch, RNG, cálculo contábil, regra fiscal ou fluxo econômico. schemaVersion=9 preservado. Nenhuma função V3.2 (novos bairros, cenários vivos ou atlas) incluída.

## Homologação
Só promover e criar `releases/v3.1.0-homologada` após CI do SHA exato, QA Windows, merge aprovado, CI da main e readback do checkpoint. Aprovação formal do titular já foi dada para o projeto e sua implantação, **não é prova de testes manuais físicos**. Saves reais privados, celular físico, experiência subjetiva e instalação pessoal ficam fora do alcance da CI e não devem ser declarados testados. V3.0.0 permanece ponto de rollback.

## Retificação visual V3.1.0 (solicitada após PR #43)
A interface ERP em mapa encaixado não atende à fundação de tela única. Esta alteração substitui a disposição antiga por viewport 100% da tela, câmera com pan/zoom em coordenadas SVG, HUD e dock sobre a cidade, modais centrais com backdrop/Escape e toast em camada superior. O motor, schema 9 e backup permanecem inalterados; expansão de bairros e atlas continuam na V3.2.0. **A homologação visual da correção depende da validação do titular no navegador.** A PR #43 e o checkpoint original permanecem preservados como histórico.

## Acabamento city-first v3.1.0 — sem modo clássico
Barra lateral e botões de alternância retirados do HTML e da lógica. Onboarding em cartão compacto centralizado, com arte de fundo; controles do mapa separados do HUD. Janelas de Empresas, Mercado, Administração e Configurações usam título integrado a trilho fixo de abas iconizadas, com seleção iluminada. Cada subaba apresenta primeiro quatro KPIs confirmados do Core, seguidos do conteúdo operacional preservado. Relatórios, saldos e estoques são fatos da carreira simulada, não estimativas de alíquotas ou ponto de equilíbrio. A etapa de QA inclui 14 subabas e capturas desktop/mobile emulados. **Aceite visual do titular continua pendente e é requisito para homologar a revisão.**

## Ajuste de usabilidade: rolagem compartimentada e bottom-sheet (08/11/2026)
O container de cada janela agora usa `display:flex; flex-direction:column; overflow:hidden`. Título, trilho de abas e botão `✕` não se movem; os quatro KPIs permanecem acima do conteúdo, sem scroll próprio. A rolagem vertical cabe exclusivamente ao `.v23-subpane` ativo, com `overscroll-behavior:contain`, tanto nos 14 departamentos quanto nas três abas adicionadas de Configurações (Saves, Diagnóstico e Integridade). Ferramentas auxiliares de Mercado e filtros compartilhados de Administração são preservados e realocados para o painel correspondente, sem duplicar IDs nem comandos. No mobile, o bottom-sheet mede 92dvh, os KPI cards usam 6×8 px e altura mínima 48 px, e o seletor de lotes fica no canto inferior direito, separado do inspetor. O navegador automatizado verifica scroll independente, cabeçalho estático, posicionamento dos botões, 17 abas, campos e persistência. **Aceite humano ainda necessário**.

## Desobstrução do mapa e HUD mobile (08/11/2026)
Tianguá mantém a arte original e o título integrado. O seletor flutuante de municípios passa a ser invisível; o letreiro contém área SVG transparente com foco/ação por teclado, acompanhando pan e zoom. O seletor também é acessível por Configurações > Saves. Observatório e fontes municipais do IBGE foram deslocados para Empresas > Análises. O botão solto ⓘ Cidade foi retirado. Os contêineres legados do HUD/topbar, inclusive `#unit-switch-container`, são ocultados. O seletor nativo dos 18 lotes não ocupa espaço visual e surge somente ao receber foco; os lotes SVG continuam clicáveis. Em até 768px, HUD mantém linha única de até 48px, rolagem horizontal opcional, ações ▶/❚❚, +1, ⏭, evento ♧ N e fontes menores para caixa/data. QA mede posições reais, interações por mouse/teclado e integridade do save. Aceite visual humano ainda pendente.

## V3.1.0 — Correção final da arte do mapa e do enquadramento (09/11/2026)
O renderizador Tianguá elimina a legenda SVG `.v221-live-legend` e o hotspot do letreiro. O letreiro da arte-base fica exclusivamente decorativo; Save/Configurações só são acessados pelo botão do Dock inferior. A navegação de cidades permanece em Configurações > Saves. Tianguá e os mapas fallback usam 100vw, object-fit contain e proporções originais; no mobile, o SVG ajusta a altura automaticamente (limite de 100dvh menos 110px) e permanece centralizado entre HUD e Dock, sem scroll ou zoom no carregamento. A câmera é inicializada em escala 1.0 sem restaurar zoom anterior do sessionStorage; somente o jogador muda o zoom. Foram atualizados testes históricos da legenda para evitar falsas regressões. A versão permanece aguardando aceite visual do titular antes do merge.
