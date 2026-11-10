# Cidade dos Negócios V3.3.0 — Microetapa 01: viewport do mapa

## Escopo autorizado (10/11/2026)
- Corrigir apenas as faixas vazias do mapa na visualização imersiva, em mobile e desktop.
- Preservar a cena Tianguá aprovada (18 lotes, geometria, fachadas e proporção).
- Preservar controles de câmera, HUD, dock, menus, economia, fiscal, saves e schemaVersion 10.
- Não adicionar funcionalidades, nem reformular menus nesta etapa.

## Diagnóstico
No CSS V3.1.0, a última regra `@media(max-width:768px)` colocava o canvas em
`display:grid;align-items:center` e forçava os SVGs a `width:100vw` com
`object-fit:contain`. A cidade Tianguá tem viewBox 1536×664, de razão 2,31325,
produzindo grandes faixas superior/inferior em viewports mais altas.

## Correção
Adicionar ao final do CSS uma regra exclusiva para `body.v31-immersive`
que usa enquadramento *cover* por proporção: SVG com largura
`max(100vw,231.325301dvh)` (Tianguá) ou `max(100vw,158.024691dvh)`
(outros mapas), `height:auto`, sem `max-height`. O canvas fica
100vw×100dvh, com overflow para deslocar a câmera.

Com isso não haverá faixa vazia sem deformar o cenário. Em telas verticais,
partes laterais ficam inicialmente fora do enquadramento, acessíveis por
arrasto e pelas ações de câmera/seleção.

## Critérios de aceitação
- 390×844, 750×917, 1280×720 e 1920×1080: área do mapa cobre a viewport.
- Sem distorção da arte, sem mover lote ou hotspot.
- Zoom +/−, centralização, arrasto/touch e acesso a 18 lotes preservados.
- HUD/dock continuam sobre o mapa. Painéis existentes não são alterados.
- `npm run check` e CI devem passar; `index.html` compilado deve corresponder à fonte.

## Homologação
Não considerar homologação visual concluída apenas com teste textual ou cálculo
geométrico. Requer verificação no navegador (mobile e desktop) e aceite do
titular antes de declarar a microetapa totalmente homologada.
