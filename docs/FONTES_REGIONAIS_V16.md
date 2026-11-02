# Fontes e calibração regional — Cidade dos Negócios V1.6.0-rc.1

## Indicador oficial integrado (snapshot offline)

**Fonte:** Instituto Brasileiro de Geografia e Estatística (IBGE), Diretoria de Pesquisas / Coordenação de População e Indicadores Sociais.

**Produto:** Estimativas da população residente nos municípios brasileiros, referência **1º de julho de 2026**, versão do arquivo **POP2026_20261029.pdf**.

**URL original:** https://ftp.ibge.gov.br/Estimativas_de_Populacao/Estimativas_2026/POP2026_20261029.pdf

**Data do arquivo:** 29/10/2026 (nome de versão); disponível no diretório oficial em 30/10/2026.

**Método de extração:** conferência individual dos trinta municípios na tabela oficial da publicação. Códigos IBGE completos (UF + código de município), identificação por município e UF, sem considerar população como renda, PIB ou capacidade de consumo.

| UF | Município | Código IBGE | População estimada 2026 |
|---|---|---:|---:|
| AC | Rio Branco | 1200401 | 390058 |
| AL | Maceió | 2704302 | 995134 |
| AP | Macapá | 1600303 | 491987 |
| AM | Manaus | 1302603 | 2327101 |
| BA | Salvador | 2927408 | 2559945 |
| CE | Fortaleza | 2304400 | 2582360 |
| DF | Brasília | 5300108 | 3009996 |
| ES | Vitória | 3205309 | 343935 |
| GO | Goiânia | 5208707 | 1511709 |
| MA | São Luís | 2111300 | 1090229 |
| MT | Cuiabá | 5103403 | 698917 |
| MS | Campo Grande | 5002704 | 970843 |
| MG | Belo Horizonte | 3106200 | 2415451 |
| PA | Belém | 1501402 | 1396157 |
| PB | João Pessoa | 2507507 | 906093 |
| PR | Curitiba | 4106902 | 1832183 |
| PE | Recife | 2611606 | 1588983 |
| PI | Teresina | 2211001 | 908012 |
| RJ | Rio de Janeiro | 3304557 | 6731133 |
| RN | Natal | 2408102 | 783196 |
| RS | Porto Alegre | 4314902 | 1388791 |
| RO | Porto Velho | 1100205 | 520379 |
| RR | Boa Vista | 1400100 | 500965 |
| SC | Florianópolis | 4205407 | 598370 |
| SP | São Paulo | 3550308 | 11911337 |
| SE | Aracaju | 2800308 | 623328 |
| TO | Palmas | 1721000 | 333154 |
| CE | Tianguá | 2313401 | 87757 |
| CE | Sobral | 2312908 | 217690 |
| CE | Ubajara | 2313609 | 34531 |

## Outros indicadores: metadados, sem valores importados

- **PIB dos Municípios:** o IBGE publica os resultados municipais mais recentes consultados para **2023** em https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9088-produto-interno-bruto-dos-municipios.html . Não foram incluídos valores por município nesta edição: o campo aparece como **não integrado**.
- **REGIC:** a classificação oficial de hierarquia urbana de **2018** está no portal do IBGE, https://www.ibge.gov.br/geociencias/organizacao-do-territorio/redes-e-fluxos-geograficos/15798-regioes-de-influencia-das-cidades.html . Valores de classificação oficial não foram importados: o campo aparece como **não integrado**.
- **CAGED:** emprego formal não foi incluído. Não usar a população como proxy de emprego formal ou rendimentos.

## Hipóteses matemáticas do jogo (NÃO são estatísticas oficiais)

- Índice de demanda: `clamp(round(100 + 14 × log10(população / 150000)), 80, 130)`; portanto um município mais populoso recebe um índice gradualmente maior, sem escala linear de vendas. **Este índice não mede consumo real.**
- Faixas fictícias: `local <100 mil`, `regional 100–499 mil`, `grande 500 mil–1,499 milhão`, `metrópole >=1,5 milhão`. Essas categorias não correspondem ao REGIC nem à classificação oficial dos municípios.
- Referência concorrencial simulada: 102%, 100%, 98%, 96% por faixa, aplicada a um preço de referência fictício e a um concorrente algorítmico.
- Elasticidade fictícia da demanda: 1,25; 1,40; 1,55; 1,70 por faixa, com limites absolutos de resposta no jogo (0,08–1,85).
- Lojas próprias do mesmo setor e município continuam dividindo sua demanda endereçável. Não existe consulta de mercado real em tempo de execução.
- Paisagem do mapa: altura, skyline e densidade decorativa diferem por faixa; os 18 lotes permanecem iguais. A representação não é cartográfica ou cadastral.

## Integridade e atualização

O pacote funciona 100% offline. A URL da fonte serve para consulta independente e não é consumida pelo jogo. A mudança das regras afeta apenas **os dias futuros**; a migração de save registra a data de ativação e preserva os dados históricos sem recálculo. Valores da população não mudam por avançar o calendário fictício até 2030 ou 2050. Para futuras revisões da base, os registros precisam de nova versão de dados, testes de regressão e documentação específica.
