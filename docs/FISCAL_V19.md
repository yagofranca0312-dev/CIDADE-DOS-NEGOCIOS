# Contrato fiscal — Cidade dos Negócios V1.9.0-rc.1

**Data-base normativa:** 02/11/2026. **Natureza:** simulação econômica educativa, limitada, não escrituração nem apuração fiscal legal.

## Períodos, cobertura e pacote

| Situação | Saída | Consequência contábil |
|---|---|---|
| Carreira nova ou importada | `NOT_COVERED` | Nenhum tributo lançado. |
| Hipótese comercial ativada, antes do mês de início | Cenário ainda não efetivo | Nenhum lançamento retroativo. |
| Competência de 2026 coberta (somente comércio e unidades na mesma UF) | `SIMULATED_PARTIAL`, cálculo do Anexo I | Na virada mensal: `D TAX_EXPENSE / C TAX_PAYABLE`. |
| Pagamento confirmado pelo jogador | `PAID` | `D TAX_PAYABLE / C CASH`, sem outra despesa. |
| 2027 e anos posteriores, padaria/produção própria, rede multi-UF, RBT12 acima do teto do modelo | `UNSUPPORTED` | Nenhum tributo inventado ou lançado. |
| Informativo IBS/CBS de teste de 2026 | `EDUCATIONAL_ONLY` | Jamais movimenta o ledger. |

**Atenção:** `UNSUPPORTED` não significa isenção, inexistência de imposto ou alíquota zero. Impostos não cobertos podem existir no mundo real.

## Modelo do Simples Nacional (2026, didático)

Fonte da tabela: Lei Complementar 123/2006, Anexo I (comércio), redação vigente na referência 2026. Valores em reais:

| Faixa da RBT12 | Alíquota nominal | Parcela a deduzir |
|---|---:|---:|
| até 180.000,00 | 4,00% | 0,00 |
| 180.000,01 a 360.000,00 | 7,30% | 5.940,00 |
| 360.000,01 a 720.000,00 | 9,50% | 13.860,00 |
| 720.000,01 a 1.800.000,00 | 10,70% | 22.500,00 |
| 1.800.000,01 a 3.600.000,00 | 14,30% | 87.300,00 |
| 3.600.000,01 a 4.800.000,00 | 19,00% | 378.000,00 |

Alíquota efetiva aproximada: `(RBT12 × nominal − dedução) / RBT12`, com valores na mesma unidade. Imposto educativo: receita realizada no mês × alíquota efetiva, arredondado uma única vez para centavos. O `RBT12` das competências de início de atividade foi **anualizado didaticamente**: no mês inicial, receita mensal × 12; nos 11 seguintes, média dos meses passados × 12; desde 12 meses anteriores, soma efetiva dos 12 meses. Isso **não substitui** as regras completas de início de atividade, projeção de receita, enquadramento legal ou segregação de PGDAS-D.

### Escopo efetivamente suportado

Comércio puro hipotético: `mercado` ou `roupas`, em uma única UF, sem particularidades. Os produtos do jogo não possuem NCM, CFOP, CST, cClassTrib, documento fiscal, situação de ICMS-ST/monofasia, regime especial, créditos, redução de base, benefícios, compras para industrialização ou receita de serviço. Não se infere tratamento fiscal legal do nome da loja ou do produto. Padaria com potencial produção própria fica fora do cálculo contabilizável. Lojas do jogo não têm CNPJs independentes: hipótese didática de contribuinte único.

### Cronologia e hipóteses

O jogo começa em 2026-11-01. A ativação explícita do modo simulador começa no 1º dia do mês seguinte. No último dia da competência, a obrigação aparece **naquela data**, antes de avançar o calendário. Pagar exige saldo do caixa único e não contabiliza uma nova despesa. Duas chamadas com o mesmo ID são idempotentes; nova tentativa de pagar competência quitada é rejeitada. Se o período não tiver rule pack ou estiver fora do escopo, pode ser registrado como `UNSUPPORTED`, sem lançamento de tributos.

A partir de janeiro de 2027, o jogo não efetua apuração legal nem simulação contabilizada do Simples, IBS ou CBS; as regras e opções específicas exigem fonte e codificação adicional. A linha do tempo de 2027 a 2033 é **somente explicativa**.

## Reforma Tributária do Consumo

Ano-teste de **2026**: CBS 0,9% e IBS 0,1% podem ser mostrados sobre a receita fictícia como demonstração de valores, **sem** gerar passivo, pagamento ou crédito de tributo. A Receita Federal informa condições específicas de dispensa e compensação vinculadas às obrigações acessórias e à legislação. Por isso, aplicar 1% como desconto automático seria incorreto.

Em **2027**, distinguem-se conceitualmente a opção pelo Simples Nacional e a opção pelo regime regular do IBS/CBS (dentro ou fora do DAS, conforme opção). O jogo **não calcula** o regime híbrido nem duplica IBS/CBS dentro e fora do DAS. A cronologia ICMS/ISS → IBS até 2033 serve apenas de contexto.

## Contabilidade e integridade

- `TAX_EXPENSE` é débito de despesa gerencial exclusivamente *simulada*; `TAX_PAYABLE` é crédito de obrigação **fictícia**, não obrigação tributária real.
- Passivo consolidado = contas operacionais a pagar + tributo simulado a pagar; patrimônio incorpora resultado acumulado após a despesa simulada.
- Pagamento é fluxo de caixa realizado do jogo, sem criar novas receitas ou custos; impostos de teste são somente informativos.
- Filiais seguem como centros de resultado, **não** contas bancárias; a obrigação tributária simulada pertence ao grupo.
- Histórico pré-V1.9 não recebe tributos retroativos; ao migrar schema 8→9, só se acrescenta metadado inicial fiscal desativado.

## Fontes oficiais conferidas

- LC 123/2006, Anexo I — https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm
- Receita Federal, legislação da RTC — https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/legislacao/
- Receita Federal, linha do tempo e teste 2026 — https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda
- Receita Federal, CGSN 194/2026 e opções para 2027 — https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/setembro/simples-nacional-2027-entenda-os-novos-prazos-e-faca-sua-escolha-com-consciencia-e-tranquilidade/

## Política de versão e homologação

Schema 9. Confirmação de versão em package, motor, título, abertura, topo, rodapé e nome do HTML/ZIP. npm check e regressões locais, navegação real em desktop/celular, GitHub Actions no PR, e só então publicação da candidata. Homologação Windows exige aceite do jogador.
