# 🏙️ Cidade dos Negócios — V2.9.0 · QA, balanceamento e consolidação do ciclo V2 (homologação formal em 07/11/2026)

**Versão V2.9.0 com aceite formal expresso de Yago em 07/11/2026**, com validação de CI da promoção como condição técnica de publicação. O aceite não equivale a testes manuais de Windows ou jogabilidade. A V2.9 acrescenta um **painel econômico de leitura** (margens, risco de caixa, ruptura, desempenho por unidade e 30/90 dias) e **backup compacto reversível V2**, sem modificar regras de compra, vendas, despesa, tributação, crédito ou estoque.

**Risco tratado:** na V2.8, o save de 1.832 dias chegou a aproximadamente **23,4 milhões de caracteres**, próximo do limite de 25 milhões, e o caixa ficou em R$ 6,91. Isso **não comprova jogabilidade balanceada**. O novo diagnóstico expõe esses riscos; não introduz dinheiro, não retuna preços e não executa ações.

**Preservação de saves:** o botão tradicional permanece em formato **V1** compatível com V2.8. O botão **“Backup compacto V2.9”** preserva integralmente históricos, mas só é legível na V2.9+. Guarde um JSON tradicional antes de atualizar ou restaurar uma carreira. A disponibilidade real de `localStorage` e QA no Windows ainda **não foi comprovada**.

**Homologação formal:** [Registro V2.9](docs/HOMOLOGACAO_V290.md) · [Plano V2.9](docs/V290_QA_BALANCEAMENTO_CONSOLIDACAO.md). A candidata passou em **316/316 testes, 0 falhas** e benchmarks de estabilidade, concorrência, crédito, logística e QA; a CI de integração da candidata à `main` também foi aprovada. A promoção definitiva deve passar nova CI antes do checkpoint. **QA Windows, navegador, persistência `file://` e balanceamento percebido ainda não foram comprovados**. O checkpoint V2.8.0 permanece disponível para recuperação.

---

## Histórico da versão anterior homologada

# 🏙️ Cidade dos Negócios — V2.8.0 · Produção e Logística (homologação formal em 07/11/2026)

**V2.8.0 formalmente aprovada pelo titular em 07/11/2026; release definitiva sujeita à validação CI do pacote promovido.** Interliga unidades, centro de distribuição opcional, compras consolidadas, transferências físicas, padaria com insumo e transformação, validade e desperdício de lotes novos, propostas de reposição editáveis e conciliação contábil multiloja.

**Regra:** remanejamento interfilial não gera venda ou CMV. Estoque de origem → trânsito → destino, com conta interna de compensação zerada. Frete, centro de distribuição e perdas geram custos ou despesas verdadeiras **somente no simulador**. Distância é um índice de jogo, **não quilometragem nem trajeto rodoviário real**. Nenhuma proposta de gasto é executada sem confirmação.

**Compatibilidade:** `schemaVersion 9`, novo estado logístico opcional e sem efeitos retroativos em saves anteriores; a **V2.7.0 homologada** permanece no checkpoint [releases/v2.7.0-homologada](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/tree/releases/v2.7.0-homologada).

**Evidências e limites:** [Registro formal](docs/HOMOLOGACAO_V280.md) e [Plano integral V2.8](docs/V280_PRODUCAO_LOGISTICA.md). Candidata validada com 304/304 testes, 0 falhas e benchmarks de 90/365/1.832 dias; integração CI de `main` aprovada. **QA manual Windows/BAT, navegador offline, save real e balanceamento percebido não foram comprovados** e permanecem pendentes, sem serem declarados aprovados. A V2.7.0 mantém seu checkpoint de recuperação. A publicação final depende da CI de release e da `main` após promoção.

---

## Histórico — versão anterior estável

# 🏙️ Cidade dos Negócios — V2.7.0 (homologação formal pelo titular em 05/11/2026)

**Versão estável V2.7.0 — aceite formal do titular.** O módulo financeiro inclui empréstimos fictícios com limite baseado em vendas, juros proporcionais, atraso, multa, quitação e renegociação; contratos recorrentes de fornecimento com preço fixo, pedidos automáticos, rescisão e multas; calendário projetado de compromissos, separado dos saldos realizados.

**Contabilidade:** empréstimo aumenta caixa e principal a pagar, **não** receita. Juros e multas são despesas reconhecidas uma vez; pagamentos baixam passivos, sem duplicação. Pedidos dos contratos entram em trânsito após desembolso; compromissos futuros não são lançamentos nem vendas. Modelo de prazo: períodos lúdicos de 30 dias, taxa de 1,8% e multas fictícias. `schemaVersion 9` preservado e financiamento opcional em saves antigos.

**Status:** V2.7.0 **homologada formalmente por autorização expressa de Yago em 05/11/2026**, com regressões e cenários automatizados comprovados. **Ressalva explícita:** não há registro comprovado de QA manual no Windows/navegador, persistência `file://` nem avaliação humana subjetiva de balanceamento; esses critérios permanecem pendentes de execução. A V2.6.0 homologada segue preservada para recuperação. Faça backup JSON antes de atualizar pelo `ATUALIZAR_E_JOGAR.bat` (acompanha a `main`).

**Homologação registrada:** [HOMOLOGACAO_V270.md](docs/HOMOLOGACAO_V270.md). **Especificação:** [V270_CREDITO_CONTRATOS_RISCOS.md](docs/V270_CREDITO_CONTRATOS_RISCOS.md). Testes: `tests/credit_v270.test.mjs`; benchmark: `npm run bench:finance`. A compilação final `2.7.0` precisa de nova CI aprovada antes de criar seu checkpoint definitivo.

---

## Histórico — release anterior homologada V2.6.0

# 🏙️ Cidade dos Negócios — V2.6.0 (homologação formal do titular em 05/11/2026)

## Atualização integral V2.5 + V2.6 — Economia Viva

A **V2.6.0** reúne os pendentes da Jornada Empresarial V2.5 e a concorrência reativa do plano diretor: 12 objetivos, 8 conquistas, 3 desbloqueios de orientação, seis dilemas com efeitos operacionais, tutorial contextual, reputação com influência limitada e 90 rivais persistentes em 30 cidades e três setores. Mercado finito por produto, seis eventos locais fictícios, alertas e decisões concorrentes auditadas.

**Validação automatizada em 05/11/2026:** 275 testes PASS, 0 FAIL; cenários com três estilos em 365 dias e cinco unidades durante 1.825 dias PASS; HTML offline produzido em CI. O benchmark prolongado revelou limite de tamanho do JSON formatado e foi corrigido por serialização compacta automática apenas quando necessária, sem truncar dados ou remover checksum.

**Status:** V2.6.0 **homologada formalmente por aprovação explícita de Yago em 05/11/2026**, após CI automatizado aprovado. **Ressalva:** não há evidência de QA manual concluído no Windows/navegador nem de avaliação subjetiva de balanceamento; o aceite humano não transforma testes não realizados em testes aprovados. O checkpoint de recuperação anterior `releases/v2.4.1-homologada` segue preservado. `schemaVersion 9` mantido. Saves antigos não ativam a concorrência retroativamente: exporte backup JSON e use o botão do Mercado.

**Registro de homologação:** [HOMOLOGACAO_V260.md](docs/HOMOLOGACAO_V260.md). [Patch integral V2.6](docs/V260_PATCH_INTEGRAL.md). O relato da V2.5 abaixo é **histórico da alpha.1**, não descreve as funcionalidades incorporadas nesta release.


## V2.5 — Jornada empresarial (alpha.1, ainda não homologada)

A candidata `2.5.0-alpha.1` (CI **257/257 PASS**, seis benchmarks, HTML reproduzível) introduz o **painel Jornada Empresarial**, em **Empresas → Dashboard**. O módulo lê o histórico real do jogo para apresentar níveis (`Em preparação`, `Negócio local`, `Rede regional`, `Conglomerado`), **12 objetivos mensuráveis** e **3 marcos históricos**. Inclui instruções opcionais de início. Não cria dinheiro, pontos, vendas, estoque, bônus ou lançamentos; nenhuma estrutura de salvamento foi alterada (`schemaVersion 9`).

**Situação:** protótipo incremental em avaliação. Os demais checkpoints da V2.5 (reputação com efeitos, seis dilemas de escolha, conquistas avançadas, equilíbrio e QA manual) **não foram concluídos**. Regras: [GDD da V2.5](docs/V250_GDD_PROGRESSAO.md) e [implantação alpha.1](docs/V250_ALPHA1_IMPLANTACAO.md).

**Checkpoint de recuperação:** `releases/v2.4.1-homologada`. A V2.4.1 continua sendo a versão estável de referência. Como `ATUALIZAR_E_JOGAR.bat` usa `main`, uma alpha publicada nela é para teste e não deve ser descrita como versão final homologada. Faça backup JSON antes de atualizar.

## Situação anterior — V2.4.1 estável (estabilização financeira)

**Versão oficial:** `2.4.1`, homologada formalmente pelo titular em 05/11/2026 após CI (250 PASS, 6 benchmarks). **Limite da evidência:** sem teste manual Windows/browser comprovado; exporte JSON. Checkpoint anterior: `releases/v2.4.0-homologada`.

- **Contas a pagar:** módulo Financeiro liquida despesas diárias reconhecidas em `PAYABLE`, por unidade, com `PAYABLE` a débito e `CASH` a crédito. Não reconhece despesa novamente e não mistura folha de RH ou `TAX_PAYABLE`.
- **Projeções:** a unidade ativa inclui a nova folha fictícia no resultado e nas obrigações estimadas; informa passivos conhecidos do grupo e cenário de liquidez se fossem quitados. Não liquida automaticamente nem projeta impostos futuros.
- **Proteção da carreira:** importação ou nova carreira guarda cópia local verificável da carreira atual; sistema oferece recuperação da cópia anterior e recomenda backup JSON externo. `localStorage` em `file://` continua dependente do navegador.
- **Qualidade:** novos testes de regressão e benchmark automatizado de 30, 365 e 1.825 dias com 1 e 5 unidades, incluindo integridade contábil, salvamento e importação.
- **Contrato preservado:** `schemaVersion 9`, regras fiscais anteriores, motor determinístico, HTML único offline e salvamentos antigos; nenhuma nova forma de crédito ou simulação tributária.
- **Evidências e roteiro de QA Windows:** [docs/V241_ESTABILIZACAO.md](docs/V241_ESTABILIZACAO.md). A homologação exige confirmação posterior do jogador.

## Release estável 2.4.0 — ciclo administrativo A–C (04/11/2026)

- **Paralegal (Patch A):** regularizações administrativas simuladas por unidade, taxas do jogo e calendário.
- **RH/DP (Patch B):** funcionários fictícios por unidade, produtividade, folha mensal e pagamentos no caixa compartilhado.
- **Fiscal Operacional (Patch C):** checklists e fechamentos administrativos mensais, com prazos exclusivamente fictícios; sem cálculos legais ou transmissão.
- A versão **2.4.0** não acrescenta novas mecânicas em relação à `2.4.0-alpha.3`; promove apenas o identificador e a documentação após a homologação dos patches A, B e C.
- `schemaVersion: 9` permanece, com salvamentos anteriores compatíveis. Faça backup JSON antes de atualizar com `ATUALIZAR_E_JOGAR.bat`.
- Os controles fiscais do jogo **não** equivalem a obrigações ou recolhimentos reais; a hipótese tributária didática segue isolada.
- Consulte `docs/HOMOLOGACAO_V240.md` para a trilha de aprovação e evidências de teste.


**Versão histórica homologada:** `2.2.1` — aceite expresso de Yago em 02/11/2026. O mapa original de Tianguá, a seleção corrigida do lote 03, as fachadas dinâmicas, a legenda real e a responsividade para smartphone foram integrados à `main` pelo PR #17 e aprovados pelo titular. **Save schema:** 9, sem migração. O motor econômico e fiscal foi preservado; mudou somente seu identificador de versão. Snapshot de homologação: `releases/v2.2.1-homologada`. A validação nativa de persistência em Windows `file://` não foi comprovada por teste automatizado.

## V2.2.1 — Tianguá pré-renderizada e responsiva

- Arte isométrica **original aprovada**, 18 terrenos interativos e destaque de seleção sem invasão da fachada do lote 03.
- Mercado, padaria e roupas vinculados a unidades realmente abertas pelo motor; placa dinâmica no prédio pré-renderizado do lote 03, sprites nos demais.
- HUD com valores efetivos da simulação, aviso educativo, legenda de lotes e empresas por município e botão opcional **Ampliar mapa** no celular.
- Quatro abas principais: Cidade, Empresas, Mercado e Finanças. Outras 29 cidades mantêm o cenário anterior.
- **190 testes automatizados** na revisão de UX aprovada, com build HTML offline reproduzível; homologação documental em [HOMOLOGACAO_V221.md](docs/HOMOLOGACAO_V221.md).

---


## V2.2 — Cidade viva, edifícios e ambientação (exclusivamente visual)

- Cena isométrica redesenhada com ruas, plataforma urbana, calçadas, árvores, skyline e cinco arquétipos de construções geométricas.
- Lotes livres claramente disponíveis; edifícios da rede exibidos somente quando o motor registra posse; visual sem ramo, nível, atividade bancária, indústria ou economia inventados.
- Quatro densidades artísticas de cenário (`local`, `regional`, `grande`, `metropole`) para as 30 cidades, com rótulos de cenário fictício.
- 18 lotes 1–18 acessíveis por clique, Enter/Espaço e seletor direto para toque; HUD V2.1 e inspetor preservados.
- 12 novos cenários de teste estrutural; **174/174 testes automatizados PASS** e HTML reproduzível em CI; QA visual e Windows ainda pendentes antes de homologar.
- [Implantação V2.2 e gates](docs/V22_IMPLANTACAO.md) · [Plano original V2.2](docs/PLANO_V22_MAPA_ATLAS_AMBIENTACAO.md).

---

## Histórico: V2.1 homologada

**Versão atual:** `2.1.0-rc.1` — HOMOLOGADA por aceite expresso de Yago em 02/11/2026, preservada na branch `releases/v2.1.0-homologada` (commit `645467b0`). **Schema:** 9, sem alterações econômicas. **HTML único offline.** A homologação não comprova teste nativo de persistência no Windows.

## V2.1 — Marca, abertura e HUD

- Arte conceitual de referência otimizada, logotipo e favicon vetoriais incorporados no jogo offline.
- HUD com caixa, receita, resultado e estoque; no celular, botão acessível para consultar métricas secundárias.
- Inspetor de lote compacto, detalhes expansíveis e identidade uniforme nas telas de Mercado, Finanças e Fiscal.
- Motor V2.0 congelado, alterando somente `VERSION`; regressão V2.0×V2.1, schema 9 preservado.
- **QA local:** 162 testes PASS; CI da PR #14 PASS; seis resoluções e operação em navegador. A persistência real em `file://` no Windows continua sem comprovação nesta sessão e deve ser verificada no uso.
- **Instalação:** exportar backup JSON, extrair o ZIP e abrir `JOGAR_OFFLINE.bat`; confirmar importação e persistência após reinício no Windows. Snapshot de rollback V2.0 preservado; não editar a branch homologada.
- [Registro técnico e homologação V2.1](docs/V21_IMPLANTACAO.md) · [Plano V2.1](docs/PLANO_V21_VISUAL.md) · **[Próxima V2.2 — Mapa, Atlas e Ambientação (somente planejamento)](docs/PLANO_V22_MAPA_ATLAS_AMBIENTACAO.md)**.

---

## Histórico da V2.0 homologada

**Versão jogável:** `2.0.0-rc.1` — **consolidação da arquitetura de apresentação e reformulação visual de jogo**, homologada pelo jogador em 02/11/2026.  
**Distribuição:** único `index.html` completo e offline. **Schema de save:** 9, igual ao da V1.9.  
**Referência homologada:** V1.9, branch `releases/v1.9.0-homologada`, commit `575c54c676e024c4d5f9e0186cd404a62b636bd1`.

**Homologação da V2.0:** aprovada expressamente pelo jogador em 02/11/2026. Versão preservada em `releases/v2.0.0-homologada` (commit `ac3e840b71d3551026f62cc6a04c9173f553f9d7`). A identificação técnica `2.0.0-rc.1` foi mantida para corresponder ao executável testado; não houve mudança do motor.

**Registro histórico da V2.0:** o plano seguinte era [V2.1 — Identidade Visual, HUD e Clareza de Jogo](docs/PLANO_V21_VISUAL.md), posteriormente implementada e homologada conforme o registro no topo deste README. Diretriz vigente: **versões 2.x apenas visuais; funcionalidades novas somente em 3.x**.

## V2.0 — Um mundo de negócios, sem mecânicas novas

- **Cidade como protagonista:** mapa isométrico ocupa a área principal, lotes interativos e inspetor de terreno/empresa contextual.
- **Navegação simplificada:** quatro áreas (Cidade, Empresas, Mercado, Finanças), Fiscal acessível dentro de Finanças, Configurações separadas.
- **Menos congestionamento:** indicadores e controles essenciais visíveis; outras análises em painéis recolhíveis. No celular, barra inferior fixa e controles adaptados.
- **Código organizado:** renderizadores de mercado e finanças separados em módulos de origem incorporados na mesma closure no build; SVG do mapa separado do motor.
- **Garantias econômicas:** motor V1.9 congelado, alterando apenas `VERSION`; `schemaVersion: 9`, estado, saldos, impostos, estoque e cronologia inalterados. Golden tests com cenários determinísticos.
- **Critérios de homologação:** testes locais e navegador, CI remota, instalação offline, importação/exportação e aceite prático do jogador no Windows.

**Documentação de referência:** [V20_CONSOLIDACAO.md](docs/V20_CONSOLIDACAO.md). **Backup:** exporte JSON antes de substituir a V1.9. Regra tributária 2027+ ainda não coberta; o simulador não equivale a sistema fiscal legal. Não divulgar recursos de arte conceitual ainda não desenvolvidos como mecânicas.

---

## Patch V1.9.0-rc.1 — Sistema Tributário Brasileiro Simulado (02/11/2026)

**Status:** candidata em desenvolvimento/testes, **não homologada**. **Base:** V1.8 homologada e preservada em `releases/v1.8.0-homologada`. **Save:** schema 9 (a V1.8 não reabre arquivos exportados pela V1.9).

- **Novo motor fiscal:** modo padrão `NOT_COVERED` sem qualquer lançamento de imposto. Ativação de cenário comercial hipotético exige reconhecimento expresso do caráter educativo; passa a valer apenas no **primeiro dia do mês seguinte**. Nunca tributa meses anteriores nem transforma demonstrações de anos passados em obrigações.
- **Simples Nacional didático em 2026:** situação de comércio Anexo I presumida, limitada a unidades dos ramos de mercado e roupas, sob **uma única UF**. Calcula faixa, alíquota efetiva aproximada e encargo **simulado**, tomando receita do grupo (só vendas realizadas) e RBT12 anualizada para início de atividade, com tabelas e fontes legais identificadas. A simulação **não consegue apurar** segregação ST, monofásicos, reduções, atividades próprias/industrialização, fatos geradores, ISS ou exigências reais. Por isso os números **não são DAS real, PGDAS-D, EFD ou guia fiscal**.
- **Fechamento e pagamento:** no último dia da competência elegível, reconhece uma única vez `TAX_EXPENSE` contra `TAX_PAYABLE` no ledger global; pagamento posterior é **voluntário** e baixa o passivo e o caixa, sem gerar despesa adicional. O destaque IBS/CBS de teste nunca gera passivo.
- **Reforma Tributária:** explicação temporal 2026–2033. IBS 0,1% e CBS 0,9% de 2026 aparecem como **informação do ano-teste**, não como recolhimento automático. **2027+ não possui rule pack de tributo exigível** nesta versão; mostrar `UNSUPPORTED` e nenhuma cobrança em vez de calcular alíquota futura inventada.
- **Integração contábil:** DRE separa resultado operacional e efeito dos tributos fictícios; balanço mostra `TAX_PAYABLE`; caixa realizado segrega pagamentos, além de manter o caixa único da rede. Nenhum tributo pode ser inferido do nome de produto ou cidade sem cobertura.
- **Interface:** reutilizada a **aba Fiscal já existente**; controles de opt-in e pagamentos, resumo e histórico de competências, sem novas abas principais. A V2.0 continua **exclusivamente dedicada a consolidar arquitetura e reestruturar a experiência visual como jogo**, sem adicionar sistemas.
- **Compatibilidade:** migração de saves 2–8 para 9 preservando movimentos, estoques, filiais e RNG. Exportar o backup JSON da V1.8 antes de atualizar. Reversão requer backup anterior.
- **Fontes e contrato:** [FISCAL_V19.md](docs/FISCAL_V19.md). **Não é ferramenta de uso profissional ou orientação fiscal aplicável a contribuintes reais.**

## Patch V1.8.0-rc.1 — Contabilidade Empresarial Avançada

- **Plano de contas e classificação:** contas de ativo, passivo, capital, receita, CMV e despesa, com sinal contábil definido. Novos lançamentos recebem uma classe `kind` opcional. Históricos sem classificação são identificados por padrões exatos de memos legados; origem desconhecida fica **não classificada**.
- **DRE gerencial:** receita, CMV, lucro bruto, despesas fixas, gastos de abertura e outras despesas; resultado **antes dos tributos**. Disponível para grupo e cada unidade nos mesmos períodos já existentes.
- **Balanço patrimonial:** somente **consolidado**, com caixa do grupo, estoques, bens em trânsito, recebíveis, obrigações, capital aportado e lucros/prejuízos acumulados. Identidade Ativo = Passivo + Patrimônio é conferida a cada corte.
- **Fluxo de caixa REALIZADO:** entradas/saídas, saldo inicial e final reconciliados. Para filiais, exibe apenas **contribuição ao caixa global**; não inventa saldo de caixa próprio.
- **Conferência e fechamento gerencial:** validação do balanço e estoques/pedidos **somente na data atual**; corte histórico confere o ledger, sem inventar posições físicas passadas. Fechamento mensal de leitura, sem lançar ou travar períodos.
- **UI compacta:** cinco visualizações internas em Finanças (Resumo, DRE, Balanço, Caixa, Conferência). Nenhuma nova aba principal; remodelação de UX/UI reservada para V2.0.
- **Saves:** permanece `schemaVersion: 8` (não se exige migração do save V1.7). IDs, históricos, RNG, ledger e estoques antigos ficam intocados; a V1.7 antiga pode ler o save desde que ignore o campo opcional `kind` criado em registros futuros. Exporte backup JSON antes de atualizar mesmo assim.
- **Fiscal:** `NOT_COVERED`; não existem créditos tributários, cálculo de impostos, DRE após impostos ou demonstrações legais. Não substitui escrituração contábil real.
- **Garantia de versionamento:** título, abertura, cabeçalho, rodapé, `package.json` e nome da distribuição obrigatoriamente V1.8.0-rc.1. Build falha se divergirem.
- **Status:** candidata técnica, aguardando homologação funcional do jogador no Windows.

## Patch V1.7.0-rc.1 — inteligência econômica regional (primeiro incremento)

- **PIB municipal IBGE 2023:** integrou-se o PIB total de todos os 30 municípios, com referência e unidade corretas (R$ mil) e link para os registros no SIDRA.
- **Demanda futura com contexto regional:** efeito fictício limitado a ±8 pontos percentuais sobre o fator demográfico de V1.6. Não representa renda nem comércio efetivo.
- **Comparador compacto:** o Observatório mostra PIB, ajuste simulado e comparação do fator de demanda entre dois municípios, preservando as telas existentes.
- **REGIC 2018 e PIB per capita:** ainda **não integrados** — a base original de hierarquia urbana não foi auditada por município. Não foram criados fluxos intermunicipais não comprovados.
- **Migração:** saves 2–7 → esquema 8, preservando lançamentos, unidades, estoque e histórico. `gdpEffectiveFrom` marca somente os efeitos futuros.
- **Correção de versionamento:** versão única no motor, espelhada automaticamente na tela inicial, badge superior e rodapé; `index.html` e arquivos de instalação devem identificar `V1.7.0_RC1`.
- **Visual:** apenas ajustes mínimos neste painel. A grande revisão de UX/UI e arquitetura fica reservada à **V2.0**, conforme a diretriz do projeto.

**Fontes oficiais e calibração:** [FONTES_REGIONAIS_V17.md](docs/FONTES_REGIONAIS_V17.md).  
**Antes de atualizar:** exporte backup JSON da carreira. A V1.6 não lê saves do esquema 8.

## Patch 1.6.0-rc.1 — Economia Regional e Cidades Dinâmicas

- **Base oficial offline:** as 30 cidades da carreira possuem código IBGE de 7 dígitos e população estimada pelo **IBGE em 1º/07/2026**, extraída de `POP2026_20261029.pdf` (atualização 29/10/2026). Veja `docs/FONTES_REGIONAIS_V16.md` para todos os valores, a URL original e o método.
- **Não confundir dados reais com gameplay:** tamanho/população são oficiais; o fator de demanda (80% a 130%), sensibilidade a preços, faixa urbana (local/regional/grande/metrópole) e pressão concorrencial são **modelos fictícios**, e não indicadores do IBGE. PIB municipal 2023 e REGIC 2018 **não foram incorporados por cidade** nesta edição: o painel os indica como não integrados, sem inventar valores.
- **Demanda local diferente:** a procura futura por produtos passa a utilizar o fator regional calibrado na escala logarítmica da população municipal. Preços concorrentes e elasticidade também variam por faixa simulada. Continua existindo partilha de mercado entre lojas do mesmo setor e cidade, sem duplicar consumidores.
- **Mapa diferenciado:** o distrito isométrico mantém os mesmos 18 lotes e cliques, mas a altura dos edifícios, a paisagem e a densidade visual variam por faixa populacional. **Não reproduz** geografia real nem quantidade real de prédios.
- **Observatório regional:** ao trocar de cidade, mostra população oficial, data de referência, código IBGE, perfil urbano fictício, índices simulados e fonte oficial externa. A consulta não exige internet; o link de evidência pode ser aberto separadamente quando houver conexão.
- **Compatibilidade do histórico:** saves `schemaVersion: 2–6` são migrados para 7 sem recontar caixa, CMV, livros, estabelecimentos ou vendas antigas. `world.regional.effectiveFrom` registra a data do jogo em que o novo modelo entrou em vigor; a simulação futura muda deliberadamente, sem editar o passado. O esquema 7 não é legível pelo executável antigo.
- **Qualidade:** bateria de testes do motor, impacto econômico, cobertura municipal, migração preservativa, 365 dias de simulação multiunidade e quatro resoluções. Windows e atualizador BAT dependem da sua validação de homologação.

**Antes de atualizar:** exporte o backup JSON na V1.5 homologada. O save migrado para schema 7 não abre versões anteriores.

## Patch 1.5.0-rc.1 — Expansão Empresarial e Múltiplos Estabelecimentos

- **Grupo empresarial:** até **cinco estabelecimentos por carreira** (matriz mais quatro filiais), inclusive em cidades diferentes e setores distintos. Lotes só podem ser ocupados por uma unidade do grupo; os demais lotes permanecem disponíveis.
- **Caixa compartilhado:** abrir filial desconta o custo de abertura do caixa existente sem criar aporte/capital adicional; vendas, compras e despesas de cada unidade impactam o caixa do grupo. A consulta individual **não apresenta um caixa fictício próprio**.
- **Operação segregada:** cada unidade possui setor, cidade, lote, produtos, preços, promoções, estoque físico, mercadorias em trânsito, pedidos, vendas e despesas próprias. Alternar a unidade ativa não altera RNG, tempo ou saldos.
- **Demanda com canibalização:** unidades do **mesmo setor e mesma cidade** compartilham a procura estimada de cada SKU. O fator por unidade é `1 / número de unidades da rede naquele setor e cidade`; o modelo evita duplicar integralmente a demanda, porém ainda é uma aproximação econômica fictícia.
- **Finanças:** o livro contábil global continua equilibrado. Lançamentos novos são marcados com ID da unidade, e os históricos anteriores à V1.5 são atribuídos à matriz, sem reescrever seus valores. Os filtros financeiros permitem escolher **grupo consolidado** ou **unidade**, mantendo os períodos independentes do calendário. Caixa só é exibido na visão consolidada.
- **Indicadores:** visão de receita, CMV, despesas, lucro e estoque por unidade e total da rede. As projeções V1.4 continuam limitadas à **unidade ativa**, utilizando o caixa compartilhado de partida sem simular as demais unidades em paralelo; não devem ser somadas como projeção consolidada.
- **Migração:** o `schemaVersion` passou de **5 para 6**. Saves válidos de versões 2–5 são convertidos preservando ledger, saldos, vendas e estoque históricos; **o executável antigo não abre schema 6**. Exporte backup JSON na V1.4 antes de atualizar pelo BAT. O HTML mantém a mesma chave de salvamento local.
- **Limites da edição:** filiais não são CNPJs distintos, nem têm regimes fiscais próprios. Não há transferências entre depósitos, empréstimos, funcionários, logística entre unidades, tributação legal ou indicadores econômicos reais nesta versão. Fornecedores continuam fictícios; a capacidade diária é por unidade e SKU.
- **Qualidade:** testes multiloja, migração, conciliação por unidade e grupo, demanda compartilhada, simulação longa e quatro resoluções de interface. Homologação Windows pendente.

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
