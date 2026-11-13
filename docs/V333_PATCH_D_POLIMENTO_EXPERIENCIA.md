# V3.3.3-D/E — Polimento e experiência da Central integrada

**Estado:** CANDIDATA, sem homologação ou promoção a `main`.
**Base:** PR #54 / `feat/v3.3.3-c-acoes-contextuais`, commit `9c6d279f590cfa2a560f315a368f08d05d45cfce`.
**Branch:** `feat/v3.3.3-d-polimento-experiencia` (4ª microetapa de 5).

## Contrato aprovado de produto
1. Unificar acesso à **Equipe**, **Agenda** e **Ações** sem criar outro motor: barra compacta da Central de Operações orienta os painéis já existentes.
2. **Resumo diário:** data do **jogo**, número de empresas, avisos ativos/urgentes e compromissos vencidos. Somente APIs e ocorrências canônicas, sem IA externa nem novos cálculos econômicos.
3. **Filtros efêmeros:** empresa de origem, severidade e situação temporal; aplicados a Equipe e Agenda sem ocultar o total real de avisos do HUD, sem apagar pendências nem escrever no save. Filtros inválidos e unidade removida retornam a 'Todas'.
4. **Navegação acessível:** botões Equipe/Agenda/Ações com estado pressionado e vínculo aos painéis; teclas de seta, Home/End movem o foco entre abas; ações continuam exigindo clique real; focos visíveis e listas com aviso de filtro vazio.
5. **Layout responsivo:** reserva de espaço do rodapé integrada com a área útil do mapa e painéis existentes. Não alterar SVG, câmera, lotes, geometria, scroll de navegação nem lógica econômica.
6. `Core`, `schemaVersion=10` e `package.json.version=3.3.2` preservados. Não criar pagamentos, compras, dívida, tributo ou data fictícia.

## Mecanismo
- `createV333OperationsView(Core,Decision)` é adaptador puro que consome `tracker.inspect(state)` e `Decision.agenda(...,occurrences)`.
- A UI projeta somente visualização; avisos dispensados continuam existindo nos dados da Agenda quando constituem compromissos datados.
- O processamento de filtros é de UI, reseta por `worldId`. Avisos não mudam identidade, prioridade ou empresa; a troca de unidade continua no contrato C (commit durável apenas ao clicar em aviso).

## Gate D
- Testes D-01…D-12 e todas as regressões A/B/C: identidade, filtros, ausência de phantom data, não mutação, rotas, acessibilidade, build determinístico.
- Chrome/Edge em Windows hospedado: abrir `index.html` por `file://`, testar central, filtros, teclado, foco, geometrias desktop/mobile e sem alteração no save, além do QA comum 365/1825 dias, IndexedDB e BAT.
- QA humano em instalação pessoal e com save real permanece pendente, assim como aceite dos Patches A/B/C/D.
- **Patch E/E reservado para qualidade e homologação global**, sem execução neste patch.
- Não integrar em `main` nem mudar versão antes de aprovação expressa da V3.3.3.

## Checkpoint de build reprodutível
- A faixa D utiliza o adaptador puro e é embutida no mesmo HTML offline.
- As proteções de sobreposição do drawer foram ajustadas para desktop e mobile sem alterar mapa ou save.
- O gate final requer CI no mesmo SHA após a geração canônica do `index.html`, sem assumir aprovação de teste manual.
