# V2.6.0-rc.1 — Patch integral: Jornada Empresarial + Concorrência e Economia Viva

**Origem:** Roadmap interativo V2 → V3, arquivo do titular de 04/11/2026.
**Base protegida:** `releases/v2.4.1-homologada`. **Referência de desenvolvimento:** merge da `v2.5.0-alpha.1` (PR #29).
**Status:** CANDIDATA IMPLEMENTADA; **não homologada** e não equivalente a aprovação no Windows.
**Escopo:** concluir funcionalidades faltantes da V2.5 no mesmo patch V2.6 e implementar os oito tópicos do plano V2.6.

## Entregas da V2.5 recuperadas no patch integral

1. 12 objetivos contabilizados a partir do ledger, unidades e calendário; sem ganhos por abrir menus.
2. 4 patamares empresariais sob requisitos cumulativos (preparação, negócio local, rede regional e conglomerado).
3. 8 conquistas derivadas de evidências econômicas e administrativas, sem bônus fictícios.
4. 3 desbloqueios informativos, sem bloquear mecanismos existentes nem gerar dinheiro.
5. Reputação por cidade e setor, baseada em amostra operacional de pelo menos sete dias, não atribuída como nota alta a empreendimento sem histórico. Efeito limitado no peso da demanda, nunca em caixa/estoque por consulta.
6. Seis dilemas jogáveis: estoque versus caixa; preço versus volume; contratar versus adiar; abrir filial versus resguardar reserva; fornecedor rápido versus barato; quitar passivo versus comprar mercadoria. Cada escolha é um comando `DILEMA.ESCOLHER` idempotente, com consequência auditada, regras econômicas existentes e intervalo de observação de sete dias por dilema.
7. Tutorial contextual somente leitura, que acompanha a fase real da carreira (abrir, comprar, receber, vender, concorrer, estabilizar, expandir).
8. Testes dedicados `tests/journey_v250_integral.test.mjs`. O critério humano de diversão/QA real continua pendente.

**Restrições:** toda escolha econômica usa comandos e journals existentes e valida caixa, estoque, capacidade e obrigações. "Reservar/adiar" significa optar por não comprometer caixa ou contratar, sem criar pontos ou lançamento de receita.

## V2.6 — 8 checkpoints oficiais

| Checkpoint do roadmap | Evidência técnica nesta candidata | Status |
| --- | --- | --- |
| 01 Modelo de empresa rival | `world.rivalEconomy.modelVersion=1`, caixa, segmento, cidade, estoque, estratégia, capacidade, preço, reputação | Implementado |
| 02 Rivais por cidade e setor | 90 rivais persistentes (30 cidades × 3 setores), identidade e valores derivados de seed | Implementado |
| 03 Demanda coerente | Alocação diária de mercado total por cidade, setor e SKU, com soma de quotas igual ao mercado, sem duplicação | Implementado |
| 04 Decisões concorrentes | Preço semanal, reposição limitada a caixa/estoque, pequenas expansões de capacidade; sem caixa infinito | Implementado |
| 05 Eventos locais | 6 tipos fictícios, início/fim, duração de 3–8 dias, efeitos de −15% a +16%; histórico auditável | Implementado |
| 06 Alertas estratégicos | Painel no Mercado com rival, situação, evento e oportunidades de reposição | Implementado |
| 07 Equilíbrio | Regressões determinísticas de 365 dias em Tianguá, Fortaleza e São Paulo; benchmark do motor | Testado automaticamente; avaliação humana pendente |
| 08 GATE de mundo reativo | Testes e HTML offline verificáveis em CI; QA Windows, balanço lúdico e aceite de Yago | **Pendente de homologação** |

## Compatibilidade e segurança

- `SCHEMA_VERSION=9` preservado; exportação/importação com checksum e reversibilidade mantidas.
- Carreiras antigas **não recebem rivais retroativos** apenas por importar; a ativação é explícita pelo botão do Mercado e grava evento `MUNDO.CONCORRENCIA_ATIVADA`.
- Em novas carreiras criadas pela interface, o novo mundo é ativado após a criação; o domínio mantém um comando explícito para auditar o momento de início.
- Estado de rivais e eventos não é uma nova receita, despesa, conta, empresa própria nem fonte pública; é simulação estritamente local.
- Histórico de 2026 e dados econômicos oficiais embutidos continuam separados das hipóteses simuladas do jogo.
- Não existe rede, requisição HTTP, dinheiro real, autenticação externa, interação com empresas ou tributos reais.
- `releases/v2.4.1-homologada` permanece a referência de rollback. Fazer backup JSON **antes** da ativação; não regravar sobre o único backup.

## Como testar a versão candidata no Windows

1. Exporte a carreira atual pela tela `Configurações` do jogo antigo; guarde o JSON original fora da pasta do patch.
2. Abra o novo `index.html` do artefato de CI no navegador como arquivo local; não sobrescreva o jogo antigo até concluir o teste.
3. Inicie carreira de teste e verifique `Empresas → Dashboard → Jornada empresarial`, conquistas, desbloqueios, reputação e dilemas.
4. Em `Mercado`, verifique painel de rivais e eventos; troque cidades, avance sete e trinta dias, experimente dois preços e dois fornecedores.
5. Importe um save antigo com backup preservado. Confira que o mundo concorrencial requer ativação explícita; depois confira caixa, contas a pagar e vendas antes/depois.
6. Rode pelo menos um cenário de 30 dias e outro de 90 dias para verificar se a progressão é compreensível e se uma estratégia economicamente prudente permite recuperação.
7. Se houver erro em vendas, save, UI, histórico ou desempenho, preservar JSON e logs; voltar ao checkpoint V2.4.1 sem reimportar save modificado.

## Critério para homologação V2.6.0 estável

- Build determinístico: `npm run build`, `npm test`, `npm run bench:stability` e `git diff --exit-code -- index.html` aprovados em PR CI.
- Confirmação de que saves legados seguem importando e que nenhum comando duplicado multiplica receitas ou passivos.
- QA real Windows/navegador, leitura de painel, performance e divertido/justo, com aceite formal do titular.
- **Até o fechamento desses pontos, manter o sufixo `-rc.1`; não criar `releases/v2.6.0-homologada`.**
