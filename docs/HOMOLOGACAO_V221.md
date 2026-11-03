# Homologação — Cidade dos Negócios v2.2.1

**Data:** 02 de novembro de 2026  
**Decisor:** titular do projeto, Yago  
**Status:** HOMOLOGADA por aceite expresso do titular; versionamento técnico sincronizado em `2.2.1`  
**Referência estável:** `releases/v2.2.1-homologada` (criada após CI e integração à main)  
**Entrega anterior:** PR #17, merge `22dc447ae1b0d529e9c31cd2f346d2be952b8d79`  
**Escopo da homologação:** aparência e funcionamento da aba Cidade de Tianguá, HUD recuperado e adaptação mobile.

## O que o aceite cobre

1. A cidade usa a imagem isométrica original, já aprovada anteriormente pelo titular.
2. O lote 03 não recebe halo sobre a fachada; o telhado pode ser clicado. A edificação de sua fachada está pré-renderizada e a identificação do setor é uma placa dinâmica após abertura real.
3. Os demais lotes recebem sprites de mercado, padaria e roupas conforme unidades retornadas pelo motor econômico.
4. Legenda informa disponibilidade e empresas da cidade; HUD informa estabelecimento e indicadores do grupo. Aviso educativo indica natureza simulada do jogo.
5. Quatro áreas principais — Cidade, Empresas, Mercado e Finanças — com a visualização do mapa adaptada a smartphone e zoom opcional.
6. Outras 29 cidades mantêm o renderizador anterior.

## Critérios técnicos preservados

- `VERSION` do Core, `package.json`, título, rodapé, abertura, badge e manifesto de cena atualizados para `2.2.1` (sem `-rc`).
- O identificador de versão é a única alteração permitida em `src/core/game.js`. Lógica econômica, fiscal, contábil, RNG e estrutura do save inalterados.
- `SCHEMA_VERSION=9`; nenhum processo de migração do save foi requerido nesta atualização.
- `index.html` reproduzível byte a byte a partir de `npm run build`, com CSS, JS e recursos visuais internos e sem dependência de servidor para executar.
- Suíte automatizada de regressão e CI obrigatório antes de integrar a alteração de versão à `main`.

## Evidência e limitações

- PR #17 com revisão de UX e mobile recebeu 190 testes automatizados aprovados e GitHub Actions SUCCESS.
- A homologação é expressa pelo titular nesta conversa, não inferida de CI ou simples publicação em branch.
- Testes de navegador em vários tamanhos e fluxos econômicos foram relatados na etapa aprovada, documentados em `docs/V221_IMPLANTACAO.md`.
- **Não foi comprovada neste ambiente a execução nativa no Windows com `file://`, persistência do navegador entre sessões ou restauração de save no computador do usuário.** Recomenda-se exportar backup JSON antes de atualizar a instalação local.
- Não há ampliação de setores ou novas regras fiscais nesta release.

## Recuperação

Se houver problema de interface ou instalação, conservar backup de save e usar o snapshot `releases/v2.2.1-homologada` como referência da versão aprovada. O histórico da V2.1 também permanece em `releases/v2.1.0-homologada`. Não reescrever o histórico de versões anteriores.
