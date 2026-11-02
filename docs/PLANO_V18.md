# Plano de implementação — Cidade dos Negócios V1.8.0

**Status:** IMPLEMENTADO COMO V1.8.0-rc.1; CI e testes locais aprovados; homologação prática no Windows pendente. **Base homologada:** V1.7.0-rc.1 (commit `3c06cdbf4fcdffe379215b8bbaa57666cd4a850b`, branch `releases/v1.7.0-homologada`). **Data:** 02/11/2026.

## Missão
Aprofundar a contabilidade gerencial fictícia do simulador, com relatórios coerentes, reconciliáveis e úteis para administrar até cinco unidades. Sem emissão de documentos reais, fiscal ou tributos legalmente calculados. Preservar o arquivo HTML único offline. Não antecipar a reforma de UX/UI nem refatoração ampla previstas para V2.0.

## Diagnóstico verificado na V1.7
- Ledger global com partidas dobradas, valores monetários em centavos e marcação `businessId` nos novos lançamentos.
- Contas existentes no motor: `CASH`, `INVENTORY`, `IN_TRANSIT`, `RECEIVABLE`, `PAYABLE`, `CAPITAL`, `REVENUE`, `COGS`, `EXPENSE`.
- Venda automática, CMV por custo médio ponderado, compras pagas com mercadoria em trânsito, despesas diárias, gastos de abertura e campanhas promocionais sem gasto extra de marketing.
- Relatórios financeiros por período e unidade; caixa **é global** e não se pode repartir retroativamente por estabelecimento.
- Cenários gerenciais V1.4 são projeções, e não fatos contábeis; nunca podem entrar no ledger.
- Fiscal permanece `NOT_COVERED`. Nenhuma obrigação brasileira é calculada.

## Escopo proposto por fases

### E1 — Contratos, auditoria e plano de contas
1. Catalogar tipos existentes de lançamento, origem, evento, impacto por conta e centro de resultado.
2. Criar metadados semânticos para grupos de contas (ativo, passivo, patrimônio, receita, custos e despesas); preservar contas e lançamentos antigos, sem recalculá-los.
3. Definir e documentar os sinais normalizados (devedor/credor) e as regras por tipo de conta.
4. Marcar explicitamente `group` vs `businessId`; diferenciar centros de resultado de unidades de caixa.
5. Acrescentar classificação de transação estruturada **para novos registros**, com transição conservadora do legado; origem desconhecida = não classificada, nunca inventada.

### E2 — DRE por competência e unidade
1. DRE com receita de vendas, CMV, lucro bruto, despesas operacionais e resultado antes de tributos, usando exclusivamente movimentos realizados.
2. Filtros já existentes: dia, mês, trimestre, semestre, ano, intervalo e total da carreira.
3. Comparação entre matriz/filiais e consolidado, preservando o fechamento aritmético: soma de resultados por unidade = consolidado, ressalvados lançamentos estritamente corporativos destacados.
4. Exibir ausência de cálculo tributário como `NOT_COVERED`, jamais como alíquota zero, passivo fiscal zero ou lucro líquido após imposto.

### E3 — Balanço patrimonial e conciliação
1. Balanço de posição na data de corte: caixa compartilhado, estoques, mercadorias em trânsito, eventuais recebíveis, obrigações, capital e resultado acumulado.
2. Não apresentar saldo de caixa por filial. Estoque e movimentações podem ser discriminados por unidade sem criar ativos duplicados.
3. Provar invariantes: ativo = passivo + patrimônio líquido (incluindo resultado acumulado), estoque contábil = estoques por SKU, em trânsito = pedidos pendentes pagos, contas do ledger sem partidas desbalanceadas.
4. Alertar explicitamente quando houver saldo ou documento inconsistente; não “ajustar” automaticamente para fechar.
5. Não reclassificar gastos de abertura já registrados como despesa em períodos antigos.

### E4 — Fluxo de caixa realizado e fechamento gerencial
1. Fluxo de caixa **realizado** reconciliado com lançamentos `CASH`, com saldo inicial + entradas - saídas = saldo final.
2. Separar pagamentos a fornecedores, despesas, vendas, aporte e demais origens onde a classificação seja verificável; históricos ambíguos ficam sem categoria detalhada e não entram em classificações especulativas.
3. Consulta/fechamento gerencial mensal somente leitura e verificável, sem bloquear retroativamente a carreira, gerar lançamentos adicionais ou alterar o RNG.
4. Diferenciar caixa realizado de cenário projetado da V1.4.

### E5 — Interface, documentação e homologação
1. Reutilizar a área **Finanças** com navegação interna compacta (Resumo, DRE, Balanço, Fluxo de Caixa, Conferência), evitando adicionar uma nova aba principal ou aumentar a poluição visual.
2. Manter o foco em números e decisões, não em linguagem de ERP; a reformulação estética estrutural permanece para V2.0.
3. Documentar fórmulas, limites e exemplos auditáveis, atualizar CHANGELOG/README/ROADMAP.
4. Preparar HTML único e atualizador Windows, validando versão nos quatro pontos: título, abertura, topo e rodapé, além do nome de arquivo.
5. Preservar o backup pré-upgrade e migrações de schemas 2–8; alterar para schema 9 somente se novos metadados persistidos forem essenciais.

## Gates obrigatórios
- **G01 — Conservação histórica:** importação de V1.7 preserva IDs, datas, movimentos, saldos, inventário, vendas, filiais e RNG; nada é recontado.
- **G02 — Integridade:** toda partida fecha, DRE bate com os movimentos de resultado e o balanço equilibra até a data selecionada.
- **G03 — Períodos:** nenhum movimento de competência posterior afeta corte passado; filtros continuam estáveis ao avançar os dias.
- **G04 — Rede:** cinco unidades, caixa global; resultado por unidade concilia com grupo; despesas corporativas não alocadas de forma fictícia.
- **G05 — Casos extremos:** estoque zerado, entregas pendentes, perdas de venda, promoções vigentes, caixa negativo/obrigações, 90/180/365 dias e períodos sem movimentos.
- **G06 — Persistência:** exportar/importar JSON com checksum, idempotência, limites de tamanho e recuperação do autosave; rollback por backup.
- **G07 — Interface:** visualização em 320, 390, 768 e 1280 px, sem erros de runtime, versão sincronizada, leitura clara.
- **G08 — Publicação:** `npm run check` local e GitHub Actions PASS no PR; somente depois merge na `main`; Windows homologado exclusivamente após confirmação do jogador.

## Exclusões explícitas da V1.8
- CNPJ, nota fiscal, obrigações SPED, Simples Nacional, ICMS, IBS, CBS, IRPJ, CSLL e regras tributárias (previsão V1.9, com validação normativa própria).
- Empréstimos, folha de pagamento, ativo imobilizado/depreciação, transferências de estoque entre filiais, inventário físico e contas bancárias separadas, salvo futuro planejamento aprovado.
- Reorganização integral do código, redesenho amplo de mapa, abas e UX (reserva V2.0).
- Criar dinheiro, tributos, lucros ou transações retroativas com base em estimativas ou projeções.

## Critério de conclusão
A V1.8 estará **implementada e pronta para homologação** quando relatórios derivados do ledger forem consistentes, todos os gates aplicáveis estiverem aprovados, a CI estiver verde, o HTML/ZIP tiver versão coerente e os saves antigos preservados. Somente o aceite expresso do jogador a torna homologada.


## Relatório de execução da V1.8.0-rc.1 (02/11/2026)

- E1–E5 implementadas, com documentação detalhada em `docs/CONTABILIDADE_V18.md`.
- Mantido schema 8: não foi necessário migrar os saves; a V1.7 homologada pode ser importada sem alterar seus lançamentos.
- `npm run check`: 130/130 testes locais. CI no PR #11: build, testes, comparação do HTML gerado e SHA-256 concluídos com sucesso.
- Chromium: interface com cinco demonstrativos internos testada em 320, 390, 768 e 1280 px, sem erros JS ou rolagem horizontal.
- Limites: fechamento apenas gerencial, não cria movimentações, não calcula tributos, balanço e caixa pertencem ao grupo.
- **Não homologada ainda:** a aceitação prática do jogador continua necessária.
