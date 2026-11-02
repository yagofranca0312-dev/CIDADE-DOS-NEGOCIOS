# V2.2.1 — Polimento Urbano | piloto controlado de Tianguá

**Data:** 02/11/2026  
**Situação:** PLANO DE EXECUÇÃO DO PILOTO. Não homologado.  
**Branch isolada:** `feature/v2.2.1-piloto-tiangua`, originada da `main` V2.2.0-rc.1.  
**Regra de lançamento:** enquanto o piloto não for aprovado, `main` e o pacote oficial continuam em V2.2.0-rc.1. A identificação V2.2.1 é meta de entrega, não uma versão já liberada.

## 1. Decisão arquitetural: SIM ao piloto isolado

Trabalhar **exclusivamente no distrito comercial de Tianguá** primeiro. A cidade é a cidade-referência de direção de arte porque o titular forneceu captura de uso real do seu mapa V2.2 (lote 03 ocupado, 18 lotes). Aprovado o padrão visual, implementar **por sessões/lotes de cidades**, sem copiar cenários indiscriminadamente e preservando `sizeTier`.

**Justificativa:** a captura evidencia: grade muito dominante, poucos prédios no entorno, baixa legibilidade da malha de ruas e pouca relação entre quadras e arquitetura. As funções de jogo, seleção por lote, navegação e inspeção aparecem corretas. Deve-se reforçar a cena, não redesenhar economia ou HUD.

### Checkpoint de aceite A — Tianguá
Apenas após revisão visual de Tianguá e QA do mapa: registrar aceite ou correções. Isso NÃO homologa V2.2.1 nem automaticamente autoriza as 29 cidades.

### Checkpoint B — Biblioteca comum
Extrair o desenho aprovado para perfis de **composição**, não mapas geográficos reais: volumetria, calçadas, fachadas, comércio neutro, paisagismo, interseções, contraste e distribuição.

### Checkpoint C — Propagação em sessões
A sequência proposta é: 
1. **Sessão 1:** Tianguá, revisão até satisfação visual e funcional.
2. **Sessão 2:** Sobral e Ubajara (escalas regionais e locais; atenção à preservação da lógica oficial `sizeTier`, sem forçar categorias).
3. **Sessão 3:** Fortaleza e demais capitais do Nordeste, avaliando grande/metrópole.
4. **Sessões 4+:** capitais restantes em blocos comparáveis de porte visual, completando 30 cidades.

O número exato de sessões depende da validação da direção artística, não deve antecipar a homologação. O `sizeTier` econômico do core nunca muda.

## 2. Contratos imutáveis

- Cadastro original: **30 cidades**, **18 lotes por cidade**, limite de **5 unidades por carreira**.
- `src/core/game.js`: **zero alterações**, inclusive `VERSION` na primeira experiência. Save schema **9**; sem alterações em contas, RNG, tributação, estoque, calendário, log, comandos ou persitência.
- UI, inspectores, navegação, acessibilidade e localStorage V2.2 permanecem como estão, salvo correção comprovada de UX ligada ao mapa.
- `CidadeVisual.svgMap(city,ownedLots,lot)` permanece com a mesma assinatura; no servidor, sem novas APIs.
- **Tianguá identificada por `city.id === 'CE-TIANGUA'`**, derivada de `CITIES_SOURCE` já disponível, sem adivinhação por posição de array ou nome exibido.
- Outras 29 cidades **devem produzir SVG literalmente idêntico à V2.2.0 original** durante o piloto. Não contam como implantadas V2.2.1.
- Edifícios do cenário são **cosméticos, sem clique e sem contagem de empresas**, não retratam geografia, comércio, relevo ou propriedades reais de Tianguá.
- Animações complexas e pessoas/veículos móveis ficam na V2.3.

## 3. Patches, caminhos e commits planejados

| Ordem | Patch | Implementação | Critério |
|---|---|---|---|
| 01 | V221-T01 | Criar branch de Tianguá e registrar baseline da V2.2.0 em `tests/fixtures/city-scene_v22.js` | 29 cidades sem desvio em 3 cenários |
| 02 | V221-T02 | `src/visual/city-scene.js`: adicionar fundo, quadras periféricas, fachadas comerciais neutras, vegetação, vias e pequenos detalhes isométricos **somente em Tianguá** | Mais continuidade urbana, sem obstrução e sem lote fictício |
| 03 | V221-T03 | `src/shell/v22.css`: regras de contraste/polimento restritas à classe do piloto | Mobile/desktop legíveis, sem estilizar outras cidades |
| 04 | V221-T04 | `tests/visual_v221_tiangua.test.mjs`: golden V2.2 para 29 cidades, 18 lotes, estados vazio/ocupado, seleção/teclado, escape e determinismo | Regressões PASS |
| 05 | V221-T05 | Reconstruir `index.html` com `tools/build.mjs`; abrir PR **rascunho**, rodar `npm run check` no CI | HTML único e CI PASS; não publicar em `main` |
| 06 | V221-T06 | QA visual manual em 320/360/390/768/1280/1920 px; conferir zoom, teclado, touch, foco, lotes 01–18; comparar com captura original | Aceite explícito do piloto para iniciar as demais cidades |

**Commits**: `docs(v221): plano e baseline de Tianguá` → `feat(v221): distrito piloto Tianguá` → `style(v221): polimento restrito a Tianguá` → `test(v221): golden 29 cidades e 18 lotes` → `build(v221): HTML de demonstração`.

## 4. Critérios visuais de aceite

- **A. Cidade, não tabuleiro:** ruas e quadras perceptíveis, densidade de fachada/edifício no entorno e a grade integrada ao cenário, sem perder o propósito jogável.
- **B. Distinção de posse:** lote livre, prédio próprio e lote selecionado distinguíveis por volume, ícone/rótulo e contraste (não só cor).
- **C. Identidade sem cartografia inventada:** somente `Tianguá · CE` e porte existente; ilustração fictícia claramente identificada. Nenhuma marca real, banco, fábrica ou elemento econômico novo.
- **D. Foco e toque:** áreas clicáveis dos 18 lotes, `aria-label` e `aria-pressed`; seletor direto funcional.
- **E. Performance:** SVG enxuto; sem imagens pesadas, fontes/remotos, animação ou loop por frame; orçamento estrutural conservador em testes.
- **F. Compatibilidade:** render de todas as 29 outras cidades bit a bit idêntico à V2.2 original; efeitos, estados, importação/exportação, finanças, fiscal e schema invariáveis.

## 5. Riscos, rollback, governança

- **Aglomeração e sobreposição:** elementos periféricos decorativos devem ficar **atrás** da camada de lotes e ter `pointer-events="none"`; testar foco, selecionado e as 18 áreas.
- **Alteração indireta das outras cidades:** teste de snapshot integral obrigatório. Desvio é BLOQUEIO.
- **Demasiada semelhança entre municípios:** extrair princípios visuais do piloto, não reproduzir Tianguá literalmente; futuro porte urbano preserva diferenciação.
- **Atribuição falsa de realidade:** declarar ilustração fictícia; sem mapas de ruas reais ou pontos de interesse supostos.
- **Persistência/Windows:** antes de qualquer lançamento oficial, QA de `file://`, backup JSON, importação e reabertura local.
- **Reversão:** PR rascunho não integrado na `main`; simplesmente voltar à `main` ou branch `releases/v2.1.0-homologada`. Nunca sobrescrever save.

## 6. Estado de realização a preencher com evidência

Planejamento aprovado pelo pedido do titular em 02/11/2026. A implementação do **piloto somente Tianguá** pode começar na branch; CI e testes visuais devem ser registrados depois de sua execução. Sem aceite visual, **não propagar para outras cidades**.
