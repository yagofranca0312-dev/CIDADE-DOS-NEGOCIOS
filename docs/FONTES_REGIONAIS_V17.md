# PIB municipal e metodologia — Cidade dos Negócios V1.7.0-rc.1

## Dados oficiais incorporados (snapshot offline)

- **PIB municipal total a preços correntes**, ano **2023**, indicador **37**, tabela **5938** da API SIDRA/IBGE.
- **Unidade:** R$ **mil** (multiplicar por 1.000 para obter o valor em reais correntes).
- Endpoint por município: `https://apisidra.ibge.gov.br/values/t/5938/n6/<codigo_IBGE>/v/37/p/2023`.
- Diretório metodológico: https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9088-produto-interno-bruto-dos-municipios.html
- Fonte de população oficial **2026:** [FONTES_REGIONAIS_V16.md](FONTES_REGIONAIS_V16.md).
- Este recorte corresponde aos 30 municípios já cadastrados no jogo; resultados verificados individualmente pelo código IBGE.

| Município | UF | Código IBGE | População 2026 (hab.) | PIB total 2023 (R$ mil) |
|---|---|---|---:|---:|
| Rio Branco | AC | 1200401 | 390,058 | 12,960,966 |
| Maceió | AL | 2704302 | 995,134 | 33,749,576 |
| Macapá | AP | 1600303 | 491,987 | 18,470,858 |
| Manaus | AM | 1302603 | 2,327,101 | 127,649,795 |
| Salvador | BA | 2927408 | 2,559,945 | 76,698,777 |
| Fortaleza | CE | 2304400 | 2,582,360 | 86,939,832 |
| Brasília | DF | 5300108 | 3,009,996 | 365,669,108 |
| Vitória | ES | 3205309 | 343,935 | 28,257,606 |
| Goiânia | GO | 5208707 | 1,511,709 | 75,780,846 |
| São Luís | MA | 2111300 | 1,090,229 | 42,389,051 |
| Cuiabá | MT | 5103403 | 698,917 | 39,050,753 |
| Campo Grande | MS | 5002704 | 970,843 | 42,269,768 |
| Belo Horizonte | MG | 3106200 | 2,415,451 | 130,197,671 |
| Belém | PA | 1501402 | 1,396,157 | 40,536,062 |
| João Pessoa | PB | 2507507 | 906,093 | 28,442,131 |
| Curitiba | PR | 4106902 | 1,832,183 | 120,065,276 |
| Recife | PE | 2611606 | 1,588,983 | 66,351,305 |
| Teresina | PI | 2211001 | 908,012 | 29,449,063 |
| Rio de Janeiro | RJ | 3304557 | 6,731,133 | 418,462,360 |
| Natal | RN | 2408102 | 783,196 | 31,162,043 |
| Porto Alegre | RS | 4314902 | 1,388,791 | 104,743,272 |
| Porto Velho | RO | 1100205 | 520,379 | 25,402,193 |
| Boa Vista | RR | 1400100 | 500,965 | 18,234,169 |
| Florianópolis | SC | 4205407 | 598,370 | 31,190,132 |
| São Paulo | SP | 3550308 | 11,911,337 | 1,066,825,105 |
| Aracaju | SE | 2800308 | 623,328 | 22,291,877 |
| Palmas | TO | 1721000 | 333,154 | 14,168,469 |
| Tianguá | CE | 2313401 | 87,757 | 2,265,253 |
| Sobral | CE | 2312908 | 217,690 | 6,588,929 |
| Ubajara | CE | 2313609 | 34,531 | 839,887 |

## Modelo econômico (hipótese de gameplay, NÃO dado oficial)

- A V1.6 já aplica um fator de procura vinculado à população de 2026, limitado de 80% a 130%.
- Na V1.7 acrescentou-se ao fator de procura o delta artificial `clamp(round(4 × log10(PIB total 2023 em R$ mil / 20.000.000)), -8, +8)` **pontos percentuais**; o fator combinado permanece entre 80% e 130%.
- O PIB municipal é **atividade econômica total**, NÃO receita comercial, renda domiciliar, PIB per capita, fluxo de compras nem propensão de consumo observada.
- PIB 2023 e população 2026 referem-se a anos diferentes: o jogo não calcula nem apresenta PIB per capita combinando os dois.
- O modelo **não garante resultados econômicos reais**; efeitos são calibrados e valem somente nos dias simulados após migração.

## REGIC 2018 — dados ainda não incorporados

- Base oficial identificada: https://geoftp.ibge.gov.br/organizacao_do_territorio/divisao_regional/regioes_de_influencia_das_cidades/Regioes_de_influencia_das_cidades_2018_Resultados_definitivos/base_tabular/REGIC2018_Municipios_Hierarquia_e_regiao.xlsx
- Neste recorte, o arquivo tabular não foi validado programaticamente para os 30 municípios. A versão sinaliza **não integrado** e NÃO inventa hierarquias/fluxos entre municípios.
- Consequentemente, não existe ainda migração de demanda intermunicipal ou canibalização adicional entre cidades; essas funcionalidades só poderão ser ativadas após a auditoria da base e de sua unidade geográfica.

## Integridade temporal e versionamento

- Saves anteriores `schema 2–7` migram para `schema 8`, mantendo livros, estoque, RNG e empresas; a data `gdpEffectiveFrom` registra quando a nova regra começa.
- Todos os rótulos visíveis de versão são sincronizados em tempo de execução a partir de `CidadeCore.VERSION`; há teste para detectar rodapé/topo/tela inicial divergentes.
- Backups anteriores devem ser exportados antes de atualizar, porque o executável antigo não entende schema 8.
- V2.0 está reservada para auditoria de interface, reorganização e consolidação técnica, sem novos sistemas de gameplay.
