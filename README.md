# 🏙️ Cidade dos Negócios 1

**Versão:** `1.2.0-rc.1` — **patch comercial com múltiplos produtos**, candidato a homologação.  
**Formato:** um `index.html` autônomo, com CSS e JS incorporados; sem internet ou instalação obrigatória para jogar.  
**Data-base do planejamento:** 01/11/2026.

## Patch 1.2.0-rc.1 — gestão comercial multitem

- **Catálogo:** cada empresa começa com três produtos fictícios; cadastre novos até o limite de 40 por estabelecimento, definindo nome, custo e preço de venda em centavos.
- **Compras:** selecione produto, fornecedor fictício e quantidade; as entradas incrementam estoque e baixam o caixa. Cada pedido guarda itens, fornecedor, data, custo e lançamento contábil.
- **Vendas:** carrinho permite vários itens e confirma uma única venda à vista, com baixa de estoque, entrada no caixa, receita e CMV por item no mesmo commit. Vendas simuladas dos dias também trabalham por produto.
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
