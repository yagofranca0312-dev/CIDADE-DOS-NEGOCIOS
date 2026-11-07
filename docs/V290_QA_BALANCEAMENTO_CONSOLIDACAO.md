# CIDADE DOS NEGÓCIOS — V2.9.0-alpha.1 · QA, balanceamento e consolidação do ciclo V2

**Data do planejamento executado:** 07/11/2026 · **Base:** `releases/v2.8.0-homologada` (`a18108ac6433c438a604b8f2e668d61d0db624c0`).  
**Status:** **candidata técnica em validação**, não homologada. O último checkpoint formal permanece V2.8.0.

## Objetivo, escopo e fronteiras

A V2.9 fecha **risco operacional e técnico** antes da V3, sem acrescentar sistemas econômicos, mudar os parâmetros comerciais/fiscais, criar receita interna, alterar a semântica de `schemaVersion=9` nem declarar teste manual inexistente.

**Situação constatada:** a V2.8 teve 304 regressões e benchmarks aprovados (90/365/1.832 dias), mas o cenário de 1.832 dias gerou um JSON de aproximadamente **23.361.782 caracteres** frente ao limite de 25 milhões, com caixa final de **691 centavos**. Esse cenário mostra risco de esgotamento do arquivo e fragilidade financeira, **não prova o balanceamento do gameplay nem a viabilidade econômica**.

**Política de calibração:** V2.9 informa margens, demandas perdidas, custos, cobertura financeira e riscos a partir dos fatos simulados; **não reajusta automaticamente vendas, produtividade, fornecedores, taxas de juros ou dificuldade**. Retuning de valores deve ser proposto e aprovado com séries reproduzíveis antes da V3.

## Oito checkpoints

| CP | Entrega | Critério verificável | Status |
|---|---|---|---|
| 01 | Inventário de riscos V2.8 | Marcar save próximo de 25M, quota variável de `localStorage`, liquidez terminal, QA real ausente e trajetos de jogo não reais | Implementado, validação CI |
| 02 | Baseline econômico de 30/90 dias | `qualityReport()` não mutante lê receita, CMV, despesas, tributos, caixa e demanda perdida; unidades separadas | Implementado, validação CI |
| 03 | Alertas sem execução automática | Alertas de estoque, liquidez, dias de custos fixos e resultado; nenhum gasto, mudança de preço ou venda fictícia | Implementado, validação CI |
| 04 | Backup portável preservado | `exportSave()` V1 continua idêntico e legível na V2.8; `importSave()` valida checksum | Implementado, validação CI |
| 05 | Backup compacto opcional | `exportSaveCompact()` V2 com dicionário reversível; conserva integralmente históricos, estrutura, dados e saldos; V2.8 **não lê** esse formato | Implementado, validação CI |
| 06 | QA visual e controle de risco | Em Sistema: painel 30/90 dias, tabela por unidade, alerta de limite, comparar tamanhos e exportação compacta sob clique | Implementado, navegador real pendente |
| 07 | Regressões e horizonte 3–5 lojas | 12 novos testes + 304 legados, benchmark dedicado 90/365 dias, bem como estabilidade, concorrência, crédito e logística | Testes em execução |
| 08 | GATE consolidação V2 → V3 | CI PASS no SHA final, HTML único, save importável, evidência de QA Windows e aceite expresso do titular | **Pendente: CI, QA real e homologação** |

## Sem perdas nem alterações econômicas

- O **formato tradicional V1** permanece `saveFormatVersion: 1` com checksum FNV1A32 do payload, `schemaVersion: 9`. Não há mudança nas regras de `dispatch`, produção, venda, débito/crédito, receita, CMV, despesas, tributos ou concorrentes.
- O **formato compacto V2** é um **arquivo JSON** separado. Seu codec `DICT_KEYS_V1` usa dicionário de nomes de propriedades e arrays etiquetadas para representar objetos e listas sem descartar um evento, journal ou item. O importador reconstrói o mesmo estado e valida seu checksum e todas as invariantes antes de aceitar. A compacidade exata é uma métrica a provar em CI.
- Os saves antigos V1 são importados normalmente. O compacto V2 **não deve ser usado como único backup quando se pretende voltar à versão V2.8**: mantenha JSON V1 para rollback.
- Importar um save com arquivo íntegro não garante persistência em `localStorage`: o limite do navegador varia por dispositivo, política e origem `file://`. Exportação JSON externa é a defesa principal.
- O limite atual de 25 milhões de caracteres permanece; nenhuma remoção irreversível de histórico, compactação destrutiva, truncamento de logs nem nova migração são implementados.
- Ao ser usado na V2.9, `qualityReport(state,30|90)` é consulta pura. **'Receita' significa venda ao consumidor externo do simulador**, sem transferência interfilial. Os alertas de margem e dias de caixa livre são indicadores retrospec­tivos, não promessa de liquidez.

## Gate de QA real no Windows

Para registrar validação funcional, o jogador ainda deverá:
1. Exportar **JSON tradicional** da V2.8 e guardar uma cópia externa antes da atualização.
2. Atualizar pelo `ATUALIZAR_E_JOGAR.bat`, abrir o jogo no Windows e comprovar que o HTML único renderiza.
3. Conferir Sistema → QA e balanceamento, alternar 30/90 dias e verificar que as métricas batem com o razão.
4. Comparar tamanhos e exportar **backup compacto V2.9**, importar o arquivo em **carreira de teste**, conferir checksum e saldos. Retornar ao save original se necessário.
5. Testar fechamento/reabertura do navegador e persistência de `localStorage` — **não inferir sucesso por CI**.
6. Exercitar cadeia lojas → CD → padaria → perdas e financiamentos em carreira de teste. Anotar erros, percepção de custos, diversão e eventuais travamentos.
7. Examinar risco de save com mais de 80% do limite; não prometer ausência de falhas para saves >25M ou para quota de navegador inferior.

## Critério de passagem à V3

- Release candidata passa `npm run check`, `npm run bench:stability`, `npm run bench:competition`, `npm run bench:finance`, `npm run bench:logistics`, `npm run bench:quality`, hash único do HTML e testes V1/V2 compatíveis.
- `main` só recebe candidata depois de CI aprovada. CI de `main` deve ser verificada novamente. Checkpoint de candidata independente da `releases/v2.8.0-homologada`.
- **Não declarar V2.9 homologada** sem aceite expresso de Yago e documentação de ressalvas sobre QA manual.
- **V3**: backlog separado para dados externos, tributação didática mais abrangente, logística com parametrização regulatória e desempenho/arquivamento de histórico de longo prazo, condicionado à priorização posterior.

**Próximo estado permitido:** candidata validada por CI e publicada para QA, sem homologação antecipada.