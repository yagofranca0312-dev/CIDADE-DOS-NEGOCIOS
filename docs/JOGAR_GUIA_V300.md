# Guia único de jogo e recuperação — Cidade dos Negócios V3.0.0-alpha.1

**Referência documental:** 07/11/2026. **Status:** V3.0.0-alpha.1 com Patch A incorporado à `main`, mas **V3.0 completa NÃO HOMOLOGADA**. A última release formalmente homologada permanece [V2.9.0](HOMOLOGACAO_V290.md), checkpoint `releases/v2.9.0-homologada`.

Este guia descreve o comportamento implementado no **executável HTML único**. Não promete serviços bancários, fiscais, jurídicos ou trabalhistas reais. A reconstrução visual V3.1 ainda não existe neste ciclo de consolidação.

## 1. Antes de jogar ou atualizar

1. Em uma carreira já existente, abra **Configurações/Sistema → Exportar minha carreira** e salve uma cópia **JSON tradicional V1** fora da pasta do jogo. Confirme que o arquivo existe e não está vazio. Mantenha outra cópia em local separado quando possível.
2. O **backup compacto V2.9** também preserva o histórico e costuma ser muito menor, mas exige leitor **V2.9 ou posterior**. Não é substituto universal do tradicional para versões antigas.
3. O executável jogável é `index.html`. No Windows, abra-o diretamente ou use `JOGAR_OFFLINE.bat` com os arquivos necessários no mesmo diretório. Para atualização por `ATUALIZAR_E_JOGAR.bat`, consulte [guia do atualizador](ATUALIZADOR_WINDOWS.md); **ele segue `main`, não a última release homologada**. Portanto, pode instalar uma candidata.
4. A persistência automática pelo navegador usa `localStorage`, sujeita a permissão, quota e comportamento específico de `file://`. **A barra de salvamento local não comprova que haverá recuperação depois de fechar a página**; use sempre JSON externo.
5. Se for testar V3 e V2.9, use **pastas distintas** e cópias de arquivo. Não substitua a única carreira nem a instalação estável.

## 2. Começar uma carreira e aprender o ciclo diário

1. Escolha nome do jogador, empresa e cidade inicial; o catálogo do jogo abrange **30 cidades**. A economia usa parâmetros de simulação; não são dados fiscais ou financeiros oficiais da cidade.
2. Em **Cidade**, selecione um dos **18 lotes** e abra uma empresa de **mercado, padaria ou roupas**. O jogo suporta **até cinco estabelecimentos**, com caixa de grupo compartilhado e estoque separado por unidade.
3. Em **Mercado → Compras**, escolha um produto e fornecedor, confira custo, caixa, prazo de entrega e quantidade, e **confirme a compra**. O pagamento ocorre na encomenda; os produtos entram em trânsito até a entrega.
4. Avance o tempo pelo controle de **dia, 7 ou 30 dias** ou pela simulação automática com pausa. A demanda gera vendas **somente quando há estoque**, com concorrência e limites existentes. **Não existe botão para registrar vendas fictícias manualmente.**
5. Em **Empresas**, alterne a unidade ativa, compare resultados e consulte o histórico de preços, estoques e vendas. Aberturas de filiais usam caixa do grupo e não criam novas receitas nem novas contas bancárias.
6. Consulte **Administrativo → Finanças** para caixa, empréstimos e compromissos; **Contabilidade** para DRE, balanço, fluxo de caixa e conciliação. Distinguir números *realizados* de cenários e obrigações futuras.

## 3. Compras planejadas — Patch A da V3.0

Em **Mercado → Compras**, o painel de capital de giro oferece três modos opcionais:

| Perfil | Reserva de custos fixos | Cobertura pretendida |
|---|---:|---:|
| Conservador | 14 dias | 4 dias de demanda |
| Equilibrado | 7 dias | 7 dias de demanda |
| Agressivo | 3 dias | 12 dias de demanda |

São **hipóteses de decisão**, não ofertas de crédito nem garantias de lucro. A cotação considera caixa, pedidos pendentes, limite do fornecedor, capacidade e estoques da **unidade ativa**, informa passivos conhecidos e ilustra três cenários de preços (92%, 100% e 108% do preço existente). Consultar uma proposta **não compra mercadorias nem altera preços**.

Se quiser executar o plano, clique em **Revisar e confirmar compra planejada** e confirme os valores. O motor revalida a cotação e lança uma única compra; não cria receita ou CMV sem venda. Alterar preço é uma ação separada.

## 4. Módulos empresariais consolidados da V2

| Área do jogo | O que faz | O que NÃO faz |
|---|---|---|
| **Empresas** | Rede até cinco unidades, dashboard, comparativos, preços e resultados realizados | Não cria bancos separados por loja |
| **Mercado** | Estoque, fornecedores, prazos, vendas por demanda, promoções, reposição manual, rivais e planejamento Patch A | Não inventa receita nem compra automaticamente por cotação |
| **Administrativo → Finanças** | Empréstimos e contratos **fictícios**, juros/multas do jogo, pagamentos, calendário de compromissos | Empréstimo não é receita; previsão não é dívida reconhecida automaticamente |
| **Administrativo → Logística** | Transferência interfilial, centro de distribuição, insumos e produção de padaria, perdas de lotes | Transferência interna não é venda; rota/distância não é quilometragem real |
| **Administrativo → RH/DP** | Personagens fictícios, contratação, desligamento, produtividade, competência de folha e pagamento | Não calcula CLT, INSS, FGTS, eSocial, 13º, férias ou IRRF reais |
| **Administrativo → Paralegal** | Cadastro/licença e taxas **exclusivamente fictícios** | Não cria CNPJ, alvará nem inscrição pública |
| **Administrativo → Fiscal** | Dois sistemas separados, descritos na seção seguinte | Não transmite SPED nem emite guias fiscais |
| **Configurações/Sistema** | Backups, restauração, QA, diagnóstico de integridade | Não garante quota ou backup automático infalível |

As áreas utilizam os mesmos lançamentos e eventos do motor. **Ações confirmadas** podem criar custos, obrigações e efeitos físicos; **consultas, filtros e projeções** não devem mudar o estado. Veja [matriz de propriedade e contratos](V300_MATRIZ_CONTRATOS_E_PROPRIEDADE.md).

## 5. Fiscal: não confundir os dois subsistemas

**A. Cenário tributário didático (V1.9).** Começa **desativado**. O jogador pode optar por hipótese limitada de **Simples Nacional para comércio em 2026**, com restrições de setor, município/UF e receita definidas no modelo. Se a competência for coberta, o cenário pode reconhecer `TAX_EXPENSE/TAX_PAYABLE` **fictícios**, e o jogador pode pagar o saldo simulado dentro do jogo. Fora do escopo, aparece `NOT_COVERED` ou `UNSUPPORTED`: **não significa isenção nem alíquota zero**. 2027 em diante não tem apuração tributária contabilizada; IBS/CBS 2026 é **apenas demonstrativo**. [Contrato fiscal original](FISCAL_V19.md).

**B. Fiscal Operacional (V2.4-C).** É **outra funcionalidade**, ativada por empresa. Cria três **checklists internos** sobre vendas, estoque e razão da competência do jogo, com prazos **inventados para o simulador**. Fechamentos registram **eventos**, mas **não** apuram tributo, alteram caixa, recolhem DAS/DARF nem transmitem obrigação. [Contrato Fiscal Operacional](V24C_IMPLANTACAO.md).

**Nenhuma das telas fiscais realiza PGDAS-D, SPED, EFD, Reinf, eSocial, DCTFWeb, MIT, escriturações ou declarações reais.** O jogo não importa NCM, CFOP, CST, documento fiscal ou empresas reais. **Não utilize valores, prazos ou guias mostrados no jogo para cumprir obrigações legais.**

## 6. Salvar, restaurar e recuperar

1. Em **Configurações/Sistema**, exporte **JSON tradicional V1** antes de atualizar ou trocar de computador; opcionalmente exporte **JSON compacto V2**.
2. **Importar carreira** carrega um arquivo JSON validado por formato, integridade do checksum e estado contábil. O jogo pede confirmação para substituir a atual; mantém uma tentativa de **cópia anterior** no navegador.
3. **Restaurar carreira anterior** usa aquela cópia local se existir e estiver íntegra; quando o armazenamento estiver bloqueado, o recurso pode falhar. O backup externo é a recuperação mais confiável.
4. **Executar Diagnóstico** inspeciona o estado e calcula checksum **FNV1A32 sob demanda**. O checksum é detector de alterações acidentais, **não assinatura criptográfica de autoria**.
5. Um save próximo ao limite de **25 milhões de caracteres** pode exceder a quota do `localStorage` mesmo sendo aceito pelo motor. A interface recusa arquivos de importação acima de **25 MB**; tamanho em bytes e caracteres não é idêntico.
6. **Alerta operacional por versão:** no executável da `main` (`3.0.0-alpha.1` do Patch A), uma falha de `localStorage` pode deixar progresso apenas em memória; nesse caso, **exporte imediatamente JSON externo e confira o arquivo baixado**. Na **branch de auditoria PR #39**, o saneamento P0 impede confirmar operações novas quando a escrita falha, com [prova Chrome/Edge Windows hospedado](V300_QA_WINDOWS_HOSTED.md). **Isso ainda não está homologado nem na `main`**. Se o backup falhar, não há garantia de recuperação; preserve qualquer cópia anterior. O [verificador privado de save](V300_QA_BAT_SAVE_LOCAL.md) é opcional e deve rodar somente sobre uma cópia local.
7. O rollback de um arquivo gerado pela alpha para a **V2.9 homologada** foi verificado automaticamente em cenários específicos, mas **não está garantido para toda carreira** e não foi validado manualmente em Windows. Backups compactos não são aceitos antes de V2.9. [Matriz técnica e roteiro de teste](V300_MIGRACAO_ROLLBACK_SAVES.md).

## 7. Limites conhecidos e próximos passos

- O motor tem máximo de **cinco lojas** por carreira, simula economia e rivalidade, e não consulta operações reais de instituições ou Receita Federal.
- **V3.0.0-alpha.1** é o código atual: **não é V3.0 homologada**; a última versão estável homologada é **V2.9.0**.
- A consolidação V3.0 possui testes automatizados de integração, migração, stress e documentação. **QA real em Windows/mobile, saves reais e armazenamento bloqueado permanecem pendentes**.
- A **V3.1 (interface imersiva)** é um plano posterior, não função instalada. Aprofundamentos tributários 2027+ dependem de roadmap próprio e não são presumidos.
- Acompanhe [status de gates da V3.0](V300_CONSOLIDACAO_INTEGRAL_GATES.md), [performance](V300_PERFORMANCE_ESTABILIDADE.md), [README corrente](../README.md) e [CHANGELOG](../CHANGELOG.md).

**Natureza:** documentação operacional do jogo, sem constituir aconselhamento jurídico, contábil, trabalhista ou fiscal.
