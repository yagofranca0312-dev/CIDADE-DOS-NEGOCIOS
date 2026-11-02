# 🏙️ Cidade dos Negócios 1

**Versão:** `1.4.0-rc.1` — **gestão estratégica, promoções e cenários financeiros**, candidata jogável aguardando homologação.  
**Formato:** um `index.html` autônomo, com CSS e JS incorporados; sem internet ou instalação obrigatória para jogar.  
**Data-base do planejamento:** 01/11/2026.

## Patch 1.4.0-rc.1 — Gestão Estratégica e Equilíbrio Econômico

- **Base homologada:** a V1.3, validada pelo jogador no Windows, está preservada em `releases/v1.3.0-homologada`.
- **Promoções por produto:** campanhas de 5%, 10% ou 15% de desconto por 1–30 dias; podem ser encerradas. O preço de tabela não muda, e a demanda e a receita das **vendas automáticas** usam o preço efetivo em cada dia. Sem segunda fonte de vendas; promoções não consomem dinheiro com publicidade porque esse mecanismo não foi implementado.
- **Gestão de custos:** CMV é custo variável das mercadorias vendidas; despesa operacional diária do setor é fixa, e gastos de abertura aparecem separadamente no realizado. O demonstrativo contábil histórico continua íntegro e as receitas de vendas permanecem líquidas de desconto já no valor de transação simulado. Tributos continuam `NOT_COVERED`.
- **Painel gerencial:** capital de giro gerencial = caixa + estoque + mercadorias em trânsito + contas a receber − obrigações a pagar; ponto de equilíbrio **estimado**, margem de contribuição média do mix de produtos e cobertura de despesas fixas pelo caixa atual, sem vendas.
- **Cenários de caixa e resultados:** escolher 7, 30 ou 90 dias. A projeção determinística usa custo do inventário, procura esperada e estoque disponível, entregas **já pagas**, campanhas vigentes e despesas fixas, sem RNG e **sem gerar lançamentos ou realizar compras**. Prevê faturamento, CMV, resultado, caixa, obrigações e vendas perdidas; não é previsão estatística validada nem garantia financeira.
- **Limitações explícitas:** não prevê alterações futuras de concorrência, eventos econômicos, crédito, pagamento de contas a pagar, impostos, novos pedidos ou campanhas futuras. Projeções de caixa refletem essas hipóteses; saldo aparente não representa recursos livres para gastar sem verificar as obrigações.
- **Saves:** migração unilateral verificável dos esquemas 2/3/4 para o esquema **5** (adição de campanhas), mantendo ledger, inventário, caixa, RNG, registros comerciais e eventos. Guarde backup JSON **antes** de atualizar; a V1.3 não pode ler saves convertidos para esquema 5.
- **Testes:** 76 regressões anteriores + testes de campanhas, migração, integridade contábil e estabilidade de 90/180/365 dias; execução real no Windows dependerá de homologação do jogador.

## Patch 1.3.0-rc.1 — Inteligência de Mercado e Abastecimento

- **Procura independente de estoque:** o motor calcula demanda estimada para todos os SKUs, inclusive quando estão sem mercadorias; registra unidades atendidas, não atendidas e potencial de faturamento perdido (estimativa, **não receita**). As vendas continuam **exclusivamente automáticas** ao avançar os dias. Não reconstitui dados de dias anteriores.
- **Fornecedores simulados com preços e prazos diferentes:** Regional = 100% do custo de referência, entrega em 1 dia, 200 unidades por produto/dia; Atacado = 94%, entrega em 3 dias, 500 unidades por produto/dia. Valores e prazos são **regras fictícias do jogo**, não cotações.
- **Pedido pago em trânsito:** o caixa é reduzido na encomenda, o ativo `IN_TRANSIT` é reconhecido e só é transferido para `INVENTORY` ao receber a mercadoria. Assim, pedido pendente nunca pode ser vendido. A entrega é processada na passagem para a data de vencimento.
- **Custos por lote:** entradas com preços diferentes são conciliadas pelo custo médio ponderado do estoque; cada venda baixa o CMV proporcional ao valor contábil disponível, com arredondamento em centavos sem saldo residual negativo.
- **Planejamento de reposição:** estoque mínimo e meta por produto, alertas, cobertura projetada, quantidade em trânsito e sugestão de encomenda **sem compra automática**. Previsão baseada nos últimos até 7 dias de demanda observada desde a V1.3 ou na estimativa-base fictícia quando não há histórico.
- **Relatórios:** demonstrativo financeiro distingue saldo de mercadorias em trânsito do estoque físico. Histórico de vendas, preços e decisões anteriores é preservado.
- **Compatibilidade:** importação e migração automáticas verificadas de saves `schemaVersion: 2` e `3` para `4`; dados contábeis e físicos são preservados sem inventar compras/recebimentos passados. O schema 4 é **incompatível com executáveis anteriores**: antes de atualizar pelo BAT, exporte e guarde um backup JSON na V1.2.1.
- **Limites:** sem fontes externas, dados municipais reais, emissões fiscais, crédito ao fornecedor ou logística de entregas probabilística. A demanda é agregada por dia e por SKU, não clientes individuais. A nova forma de consumir RNG gera resultados futuros diferentes da V1.2.1 mesmo com os mesmos parâmetros; isso é uma mudança deliberada, não uma recontagem do passado.

## Hotfix 1.2.1-rc.1 — controle das vendas pela demanda simulada

- **Venda automática:** exclusivamente pelo avanço do tempo. O comando legado `VENDA.REGISTRAR` agora rejeita novas vendas manuais sem mutar o save, caixa, estoque ou RNG.
- **Balcão virou painel:** mostra estimativa de demanda (somente produtos com estoque), unidades vendidas, demanda não atendida, receita e CMV do último dia simulado.
- **Comprovantes:** movimentações consolidadas por dia e por produto, com quantidade, receita, CMV e lucro bruto. Não equivale a transações individuais de clientes nem emissão fiscal.
- **Histórico preservado:** vendas manuais realizadas na V1.2 continuam contabilizadas e marcadas como legadas. Não serão duplicadas, eliminadas ou convertidas em vendas automáticas.
- **Economia preservada:** mesma fórmula de demanda, consumo de RNG e lançamentos contábeis das vendas automáticas da V1.2. Agora os dias simulados geram também o evento `DEMANDA.SIMULADA` para auditoria; períodos anteriores permanecem sem estimativa retroativa.
- **Saves compatíveis:** `schemaVersion: 3` inalterado; atualizador BAT e backup JSON continuam disponíveis. Recomenda-se exportar backup antes da atualização.
- **Limite:** produto sem estoque não tem demanda calculada nesta versão, portanto aparece como **sem estimativa**, não como demanda zero.

## Patch 1.2.0-rc.1 — gestão comercial multitem

- **Catálogo:** cada empresa começa com três produtos fictícios; cadastre novos até o limite de 40 por estabelecimento, definindo nome, custo e preço de venda em centavos.
- **Compras:** selecione produto, fornecedor fictício e quantidade; as entradas incrementam estoque e baixam o caixa. Cada pedido guarda itens, fornecedor, data, custo e lançamento contábil.
- **Vendas (histórico da V1.2.0):** o carrinho permitia venda manual de múltiplos itens. O hotfix 1.2.1 desativa novas vendas manuais; o avanço de dias registra vendas automáticas com baixa do estoque, caixa, receita e CMV por produto.
- **Consultas:** catálogo exibe estoque, custo, preço, unidades vendidas, receita e CMV por produto a partir desta edição; últimos pedidos e vendas ficam visíveis.
- **Saves antigos:** conversão automática e validada de `schemaVersion: 2` para `3` após verificar o checksum do save original. Caixa, estoque total, preço base, histórico contábil, RNG, datas e total histórico de vendas são preservados; registros anteriores não são artificialmente distribuídos entre novos produtos.
- **Importante:** antes de atualizar, faça backup JSON na V1.1.1. Saves convertidos para schema 3 **não são legíveis por versões antigas**. A migração é unidirecional; mantenha o backup pré-migração para poder retornar ao executável anterior.
- **Limites:** fornecedores, preços, demanda e custos são fictícios; não há cadastro de NFe, pagamentos a prazo, impostos, perdas, frete nem aquisição de novos estabelecimentos. A compra usa custo unitário simulado fixo por SKU, independentemente do fornecedor.

## Hotfix 1.1.1-rc.1 — filtros financeiros manuais

- A consulta financeira deixa de avançar automaticamente com o calendário do jogo. Depois de escolher um período, a data/competência permanece fixa mesmo após simular mais dias.
- **Toda a carreira**: data de referência (corte) escolhida manualmente.
- **Dia**: calendário com todas as datas selecionáveis até o momento do jogo; **competência**: seletor específico de mês/ano.
- **Trimestre**: escolha do trimestre 1–4 e do ano; **semestre**: escolha do semestre 1–2 e do ano.
- **Ano**: campo só de ano; **intervalo**: data inicial e final livres dentro da cronologia já alcançada.
- Botão **Usar data atual do jogo** disponível como ação explícita, não automática.
- Inversão de datas ou datas impossíveis são rejeitadas sem afetar a carreira. O demonstrativo permanece derivado dos lançamentos reais do jogo e distingue fluxos do período de saldos no encerramento.
- **Compatibilidade**: formato de save `schemaVersion: 2`, economia, preços e histórico permanecem inalterados. O filtro é uma preferência de visualização, não um lançamento da carreira.

## Patch 1.1.0-rc.1

- Compras de estoque com atalhos de preenchimento (10/50/100/250 unidades); nenhum botão compra sem confirmação.
- Histórico de mudanças do preço próprio reconstruído dos eventos do save, sem campo novo persistido.
- Relatórios contábeis filtrados por dia, competência (mês), trimestre, ano ou período total, escolhendo uma data de referência.
- Receita, CMV, lucro bruto, despesas e resultado representam o **fluxo no período**; caixa, estoque e obrigações são **saldos acumulados no encerramento**.
- Compatível com saves da V1.0.1 (`schemaVersion: 2`) sem exigir reimportação no mesmo navegador/caminho.

## Hotfix 1.0.1-rc.1 (homologado)

- O lote selecionado aparece em uma etiqueta destacada sobre o mapa, sem sobrecarregar a cidade com 18 rótulos permanentes; cada lote preserva sua identificação acessível.
- A aba Mercado exibe lado a lado **seu preço atual** e a **referência independente do concorrente**.
- Após atualizar o preço, uma mensagem mostra o valor anterior e o novo; o evento já era auditável.
- Não foram alterados economia, formato de save (`schemaVersion: 2`), RNG, regras fiscais ou comportamento do atualizador.

## O que já funciona

- Criar uma carreira em qualquer uma das **30 cidades brasileiras previstas**: 27 capitais/DF, Tianguá, Sobral e Ubajara (Fortaleza já está entre as capitais).
- Explorar um **mapa isométrico fictício** de 18 lotes por cidade, selecionar um lote e abrir uma empresa comercial (mercado, padaria ou loja de roupas).
- Comprar estoque, definir preços, simular vendas diárias e enfrentar concorrência algorítmica básica.
- Avançar 1, 7 ou 30 dias; executar em reprodução automática 1×, 2× e 5× com pausa.
- Consultar caixa, receitas, despesas, custo de mercadorias, estoque e resultado **antes de tributos**.
- Fazer exportação e importação de saves `.json` com checksum, comando idempotente e eventos auditáveis; migração conservadora do save de fundação CP-000 vazio.
- Verificar integridade de estado/ledger no painel Sistema.

**Limites explícitos:** os parâmetros econômicos são **simulados e fictícios**, não estatísticas oficiais das cidades. **Nenhum tributo brasileiro está calculado** neste release; MT-01 informa `NOT_COVERED`, e não alíquota zero. A continuação do calendário após 2033 não representa atualização normativa. Apenas um estabelecimento é operável por carreira neste primeiro corte.

## Jogar no Windows

1. Extraia o ZIP e **abra `index.html` por duplo clique** no Chrome/Edge, ou clique em `JOGAR_OFFLINE.bat`.
2. Crie uma carreira, selecione lote, inaugure empresa, compre estoque e avance os dias.
3. Em **Sistema → Exportar minha carreira**, faça um backup `.json` após cada sessão.
4. Para carregar em outro PC/HTML, use **Sistema → Importar carreira**.
5. O armazenamento local do navegador é uma conveniência; **em `file://` pode variar conforme navegador/caminho**. O backup JSON é o método portátil recomendado.

### Atualizar pelo GitHub

O `ATUALIZAR_E_JOGAR.bat` obtém a versão da branch `main` do repositório [CIDADE-DOS-NEGOCIOS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS). **O HTML já está publicado no GitHub.** Veja [ATUALIZADOR_WINDOWS.md](docs/ATUALIZADOR_WINDOWS.md).

## Desenvolver

Requer Node.js ≥ 22. Nada é baixado por npm:

```bash
npm run build   # reúne src/core/game.js, src/ui/app.js e src/shell/* em index.html
npm test        # testes de motor, integração estrutural e atualizador
npm run check   # build reproduzível + testes
```

**Não editar `index.html` e `src/` em paralelo:** `index.html` é derivado de `src/` pela ferramenta de build. Os arquivos extras são **fontes/testes**, não necessários para jogar.

### Arquitetura

- C00: um controlador (`CidadeCore.dispatch`), comandos com ID, idempotência e commit lógico.
- M01: estado canônico (`schemaVersion: 3`), 30 cidades, empresa, ledger, calendário, auditoria e cobertura fiscal.
- M02/M04: data única por mundo, demanda e concorrente básico determinísticos.
- M03: eventos confirmados no mesmo commit; consultas não alteram o jogo.
- M05: exportação/importação com checksum FNV1A32 (detecção acidental de corrupção, **não** autenticação criptográfica); armazenamento local de melhor esforço.
- M06: verificação do ledger, estoque e estado, sem reparação silenciosa.
- MT-01: presença de metadados de cobertura sem cálculos legais (`NOT_COVERED`).

## Qualidade e publicação

Os testes automatizados comprovam apenas os cenários executados. Não substituem o ensaio por duplo clique no Windows e um ciclo real de salvamento/reabertura. O hotfix V1.0.1 foi homologado pelo usuário e preservado na branch `releases/v1.0.1-homologada`. A V1.1.1 foi validada no Windows pelo usuário; a V1.2 permanece candidata até novos testes na máquina do jogador.

Documentação histórica inicial: [checkpoint CP-000](docs/00_CHECKPOINT_CP000.md), [arquitetura](docs/ARQUITETURA.md), [roadmap](docs/ROADMAP.md), [atualizador Windows](docs/ATUALIZADOR_WINDOWS.md). O **pacote local** inclui as sete especificações e o guia do programador em `docs/especificacoes/`. Esses documentos não entram no publicador inicial por conterem referências a fontes privadas do projeto.

## Privacidade

O repositório identificado está **público**. Não inclua credenciais, saves pessoais ou informações de clientes nos commits. O jogo não envia dados para servidores. Nenhuma licença de redistribuição adicional é concedida neste pacote.
