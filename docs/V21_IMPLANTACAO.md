# V2.1 — Implementação visual, critérios e limites

**Status:** candidata local implementada, ainda não homologada por Yago. **Base:** V2.0 homologada, commit `ac3e840b`.

## Escopo executado

- Refatoração somente de apresentação: logotipo SVG original inspirado em REF-01, favicon offline, keyart REF-04 otimizada em WebP e embutida no HTML durante build, identidade de marca e onboarding.
- HUD com valores extraídos do estado real; no celular exibe duas métricas primárias e botão acessível que revela resultado e estoque, corrigindo a inacessibilidade da V2.0.
- Inspetor de lotes com ação principal destacada e instrução contextual expansível.
- Aviso tributário educativo resumido mas com detalhamento acessível; sem apresentar apuração oficial.
- Unificação dos cartões, inputs, tabelas e botões de Mercado/Finanças/Fiscal. Movimentos cosméticos respeitam `prefers-reduced-motion`.
- Nova folha `src/shell/v21.css`, preservando os estilos legados e os módulos de origem.

## Fronteiras

- `src/core/game.js` mudou somente o número da versão de `2.0.0-rc.1` para `2.1.0-rc.1`.
- `schemaVersion` permanece 9, não foram alteradas vendas, RNG, fiscal, ledger, produtos, cidades ou procedimentos.
- A arte de referência é **conceitual**; não é um mapa nem uma promessa de portos, bancos e indústrias jogáveis.
- V2.2 terá como foco mapa/edifícios mais detalhados; V3.x será a primeira linha com novas mecânicas.

## Gates de saída

1. Build byte a byte reproduzível, HTML offline sem requisições externas.
2. Testes locais completos e regressão V2.0×V2.1 idêntica para economia e save.
3. QA em 320/360/390/768/1280/1920 px, abertura, HUD expandido, seleção de lote, compras, DRE, fiscal e backup.
4. ZIP/BAT, contagem de versão sincronizada na abertura, topo, rodapé, package e nome de download.
5. CI GitHub PASS e aceite de Yago antes de homologar.

## Evidências observadas na candidata

- `npm run check`: **162 testes PASS**, incluídos build reproduzível, regressão determinística da V2.0 e proteção do atualizador contra regressão de versão.
- Chromium: criação de carreira, seleção de lote, abertura da empresa, compras, passagem de dias, consulta de DRE/Fiscal e acesso às configurações testados em 390 e 1280 px com conteúdo carregado no navegador; tela de entrada/HUD/seleção testados em 320, 360, 390, 768, 1280 e 1920 px sem rolagem horizontal.
- Limite da evidência de navegador: a execução em `file://`/localhost e a persistência nativa de `localStorage` entre reinicializações precisam de confirmação no Windows; a QA automatizada validou o comportamento visual com documento HTML incorporado e persistência simulada.
- **Atualizador:** enquanto a branch principal pública permanecer na V2.0, o BAT de atualização remota rejeitará instalação de versão inferior e abrirá a cópia local; preferir `JOGAR_OFFLINE.bat` para esta candidata.

**Homologação prática ainda pendente**.
