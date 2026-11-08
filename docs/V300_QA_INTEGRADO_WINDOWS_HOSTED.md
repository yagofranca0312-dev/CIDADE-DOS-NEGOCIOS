# V3.0 — P1-02 · QA integrado de interface, operações e recuperação

**Registro:** 07/11/2026 (America/Fortaleza).  
**Repositório:** `yagofranca0312-dev/CIDADE-DOS-NEGOCIOS`; branch `audit/v3.0-consolidacao-integral-v2-20261107`; PR #39 **DRAFT**, não integrada.  
**Evidência executável:** [`tools/qa-windows-integrated-v300.mjs`](../tools/qa-windows-integrated-v300.mjs), acionado pela [CI Windows V3.0](../.github/workflows/qa-windows-v300.yml).  
**Execução observada:** [Windows QA #42437328042](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42437328042), commit `343f0b935ab2e915df3436a1c7e759a202fc658e` — **SUCCESS**, **66 verificações PASS (33 por navegador)**, Google Chrome e Microsoft Edge reais no Windows NT 10.0.26100.0 hospedado pelo GitHub, **modo headless**, arquivo local `file://`. Sem servidor, save pessoal ou ligação com a instalação física do usuário.

## 1. Critério de teste

Este roteiro **não simula comandos diretamente no motor**. Todos os atos de jogo são disparados por formulário, botão, seleção de aba ou HUD **reais da UI**. Depois da ação, o teste lê somente o save local por `localStorage` e compara o estado restaurado por `CidadeCore.importSave` às invariantes econômicas do motor, eventos, ledger, calendário e saldo. É um teste de comportamento do navegador, **não um julgamento de estética ou experiência subjetiva**.

Cada navegador recebeu um **perfil temporário independente** e uma carreira inteiramente fictícia, inicializada pela própria tela do jogo. Nenhum CPF, CNPJ, valor pessoal, nome real, registro de cliente, dados privados ou save de terceiros foi usado.

## 2. Fluxo confirmado em Chrome e Edge — 13 etapas por navegador

| Etapa | Operação real da UI | Propriedade confirmada |
|---|---|---|
| 01 | Formulário de nova carreira | Save schema 9 e conciliação inicial, sem negócio artificial |
| 02 | Seletor de lote e formulário de inauguração | Uma unidade aberta no lote 02, sem desequilíbrio |
| 03 | Aba Mercado e compra manual de 200 unidades | Um `PURCHASE`, um pedido pendente, caixa reduzido, sem receita nem estoque físico antecipado |
| 04 | HUD de +1 dia | Recebimento após prazo, `RECEIPT` único e mercadorias no estoque |
| 05 | Segundo lote e formulário de empresa | Segunda unidade real no mesmo save, total de duas |
| 06 | Aba RH e contratação confirmada | Um empregado fictício, sem despesa nem folha retroativa ao contratar |
| 07 | Aba Logística e transferência entre filiais confirmada | Remanejamento pendente, sem venda fictícia e sem desequilíbrio |
| 08 | Abas Contabilidade, Finanças e RH | Demonstrativo visível; **navegação não modifica um byte do save** |
| 09 | Preparação e cancelamento de reposição manual | Orçamento apresentado; não gera compra, tempo ou mutação |
| 10 | Estratégia gerencial Patch A com confirmação | Um novo `PURCHASE`, um evento `ECONOMIA.COMPRA_PLANEJADA`, sem receita inventada |
| 11 | HUD de +7 dias (ou mais caso demanda não baste), crédito fictício em Finanças | Receita de vendas gerada pelo motor; empréstimo de **R$ 500** cria obrigação de 50.000 centavos sem contabilizar receita |
| 12 | HUD de +30 dias, RH e botão de pagamento | Uma folha `PAYROLL_ACCRUAL`, quitação `PAYROLL_PAYMENT`, sem reapurar despesa |
| 13 | Reload real do `index.html` via `file://` | Duas unidades, financiamento, RH, transferências, razão e conciliação preservados byte a byte |

**Resultado observado no final de cada navegador:** 38 dias de calendário fictício, revisão 13, duas unidades, 1 financiamento e conciliação equilibrada. Chrome e Edge geraram respectivamente 134 e 133 lançamentos, pois a criação pela interface usa **seed dependente de `Date.now()`**, distinta entre execuções; **não** seria correto exigir saldos absolutos idênticos entre simulações aleatórias diferentes. O teste compara invariantes e efeitos de cada ação **dentro da mesma carreira**.

**Provas adicionais:** confirmações do browser para RH, logística e pagamento ocorreram, e nenhum `pageerror` fatal foi registrado. Fluxo não usa chamadas externas de `Core.dispatch` como atalhos, nem injeta snapshots artificiais na aplicação depois da criação.

## 3. Resultados da CI no mesmo commit

O [workflow #42437328042](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42437328042) também aprovou as regressões já existentes:

- **33/33** de persistência `file://`, quota real de `localStorage`, save/reload, export/import JSON e compatibilidade sintética V2.9;
- **19/19** dos BAT e PowerShell originais em diretórios Windows temporários, **com rede/ZIP e abertura do navegador interceptados**;
- SHA-256 do HTML gerado byte a byte idêntico ao blob Git, **`0ac63b72913247249e2559f19009b9941f1d6b794a9f0f17c85904e9eca191c3`**, 1.480.192 bytes.

A suíte Linux geral anterior comprovou **418/418 PASS** no commit P1. Os resultados adicionais de documentação/contrato devem sempre referenciar a CI do seu próprio SHA.

## 4. Matriz de prontidão e limites

- **`RG-13 PARTIAL` — QA de UI desktop:** navegação e formulários reais foram exercitados em Chrome/Edge Windows hospedados; **sem screenshots de revisão visual, sem validação de layout por pessoa e sem equipamento pessoal**.
- **`RG-16 PARTIAL` — jogabilidade/balanceamento:** 13 etapas integradas e 38 dias reais do motor em uma carreira por navegador; **não constitui aceite de balanceamento**, jogo completo, rotas alternativas nem cenário de 5 empresas/5 anos no browser.
- **`3.0.0-03 PARTIAL` — integração:** evidência adicional de convivência de módulos e ledger; restam percursos amplos de RH/Logística/Finanças/Tributos, casos visuais e execução pessoal.
- **`RG-06/08/09/10/12 PARTIAL`** continuam com suas próprias evidências Windows hospedadas; **`RG-07 VERIFIED`** continua encerrado por teste PR-01/PR-02.
- **`RG-11 NOT_EXECUTED`**: nenhum save pessoal verdadeiro foi processado; **`RG-14 NOT_EXECUTED`**: nenhum aparelho mobile real; **`RG-15 NOT_EXECUTED`**: carreira longa no navegador ainda não foi medida.
- **`RG-17 NOT_CREATED` e `RG-18 NOT_GRANTED`**; checkpoint 08 continua bloqueado por critérios de aceite e autorização explícita.

A mudança de **`NOT_EXECUTED` para `PARTIAL`** em RG-13/16 **não eleva o número de requisitos encerrados**. Matriz atual: **5/18 `VERIFIED`**, **13/18 não quitados**, veredito global **NO-GO**.

## 5. Próximos ensaios recomendados

1. **QA de desktop gráfico completo e acessibilidade** em máquina física do usuário (incluindo diferentes resoluções, contraste e teclado), sem publicar capturas com dados reais;
2. **Carreira longa em navegador real**, com perfis isolados e estado sintético de 365/1.825 dias, medindo memória, tempo de render e gravação sem colocar save pessoal em risco;
3. **Aceite de jogabilidade e balanceamento** com interpretação de caixa, demanda, margem, crédito, estoque e riscos por período, validando políticas simuladas sem tratá-las como contabilidade real;
4. **Save pessoal V2.9** testado somente em **cópia offline**, sem levar material privado à CI ou ao repositório;
5. **Aprovação expressa** antes de qualquer merge, tag, release ou homologação da V3.0.

**Governança:** PR #39 segue **DRAFT**, `main` não modificada, `releases/v2.9.0-homologada` preservada, sem iniciar alterações de UI V3.1.
