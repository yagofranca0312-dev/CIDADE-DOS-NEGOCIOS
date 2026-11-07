# V3.0.0 — Dossiê de consolidação integral da linha V2 (pré-homologação)

**Data da abertura:** 07/11/2026 (America/Fortaleza)  
**Escopo autorizado pelo titular:** retomar o roadmap interativo `roadmap_cidade_dos_negocios_v2_v3_interativo.html`; primeiro **consolidar integralmente a V2**, depois aproveitar a implementação do Patch A.  
**Status técnico:** `EM_AUDITORIA / RELEASE_BLOCKED`. **Este documento NÃO homologa nem publica a V3.0.0.**  
**Fonte de requisito:** plano diretor HTML de 04/11/2026 (seção `3.0.0 — Consolidação INTEGRAL da linha V2`).  
**Baseline V2 estável:** `releases/v2.9.0-homologada` — `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.  
**Código presente na main no início da auditoria:** `871df2b1cd133bcad717c0194a474a35fbabcd3c` — `3.0.0-alpha.1`, Patch A Economia e Balanceamento, já integrado, porém não homologado.

## Contrato original da V3.0

> A V3.0 consolida TUDO o que foi desenvolvido durante a V2 — sistemas, economia, IA, RH, fiscal, contratos, progressão, UX e saves.

A V3.0 é uma **release de unificação, regressão e estabilidade**, sem reconstruir a interface estilo SimCity (reservada à V3.1), sem antecipar aprofundamento tributário das versões seguintes e sem desconsiderar mecanismos já instalados.

**Não reverter, remover ou reimplementar o Patch A por consequência desta auditoria.** Seu código na `main` é preservado, mas sua homologação funcional continua independente do gate de consolidação integral da V2.

## Inventário de referência do ciclo V2 — evidência documental

| Área | Implementação histórica registrada | Estado desta auditoria |
|---|---|---|
| Base visual, mapa e UX | V2.0–V2.2.1: cidade, fachadas e responsividade; V2.3: navegação e dashboards | Implementação/documentação existente; QA cruzado da V3 pendente |
| Gestão / Mercado | V2.3: compras, fornecedores e reposição confirmada | Implementação/documentação existente; regressão integral pendente |
| Administração | V2.4: Paralegal, RH/DP e Fiscal Operacional **simulados**; V2.4.1: passivos e recuperação de carreira | Implementação/documentação existente; validação integrada pendente |
| Progressão / IA / Concorrência | V2.5: GDD e etapa parcial; V2.6: jornada, eventos, reputação, rivais e mercado finito | V2.6 homologada; não tratar V2.5 isolada como release final |
| Crédito e contratos | V2.7: empréstimos e fornecimentos **fictícios**, encargos, vencimentos e calendário | Implementação/documentação existente; validação integrada pendente |
| Produção e logística | V2.8: CD, transferências, padaria, perdas e conciliação interfilial | Implementação/documentação existente; validação integrada pendente |
| Economia, qualidade e saves | V2.9: diagnóstico econômico/contábil e backup compacto V2 opcional, mantendo backup V1 | V2.9 formalmente homologada, QA manual ainda ressalvado |
| Patch A já integrado | V3.0.0-alpha.1: estratégias de capital de giro, cotações de compras, cenários de preço e compra confirmada | CI aprovada; **não homologado** |
| Tributação real / transmissão | Não é função do simulador; cálculos e prazos fiscais do jogo são didáticos e fictícios | Não suportado como operação fiscal real |
| Interface 3D/estilo SimCity | Reservada ao ciclo V3.1 | Planejada; fora de escopo da consolidação |

**Limite:** inventário fundamentado nos documentos e changelog; não equivale a auditoria exaustiva de cada comando e cenário.

## Os oito checkpoints oficiais da V3.0 — avaliação em 07/11/2026

| ID | Gate do HTML | Estado observado | Evidência e lacuna |
|---|---|---|---|
| `3.0.0-01` | Inventário final da V2 | **PARCIAL** | Inventário inicial acima; requer conferência comando/arquivo/versão e classificação de pendências |
| `3.0.0-02` | Consolidar APIs e contratos | **PARCIAL** | `docs/ARQUITETURA.md` contém propriedade lógica; falta prova cruzada de ausência de cálculos/comandos duplicados nos domínios |
| `3.0.0-03` | Auditoria cruzada geral | **PARCIAL** | Quatro novos testes de integração V2→V3 passaram na CI (335/335 no total), incluindo RH, crédito, contratos, fiscal, paralegal, concorrência, logística e Patch A; auditoria de contratos/cálculos em código ainda incompleta |
| `3.0.0-04` | Migração de todas as carreiras V2 | **PARCIAL** | Testes integrados PASS: save V1/V2 roundtrip, corrupção, idempotência e migração V1.7→schema 9; saves reais do jogador, recuperação no Windows e outros formatos legados ainda não auditados integralmente |
| `3.0.0-05` | Performance e estabilidade longa | **PARCIAL** | CI atual de regressão aprovada, benchmarks 30/365/1.825 dias com 1 e 5 unidades PASS; limites de interface, navegadores e experiência real não homologados |
| `3.0.0-06` | Documentação e tutorial únicos | **PENDENTE** | README e CHANGELOG refletem Patch A; `docs/ROADMAP.md` preserva decisões históricas já superadas; requer consolidação canônica, sem apagar histórico |
| `3.0.0-07` | Preparar contrato UI V3.1 | **PENDENTE** | Definir API somente-leitura de cidade, eventos e comandos para overlays; renderização não pode mutar estado ou executar ticks |
| `3.0.0-08` | Gate de homologação completa | **BLOQUEADO** | Falta concluir 01–07, CI da release candidata, QA Windows/desktop/mobile, saves reais, aceite e snapshot imutável |

**Nenhum checkpoint é marcado PASS por presunção.** PASS nos testes automatizados não significa PASS nos ensaios manuais.

## Evidências técnicas obtidas no GitHub

1. O checkpoint estável `releases/v2.9.0-homologada` existe no SHA `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.
2. A `main` contém o Patch A da V3.0.0-alpha.1 pelo merge PR #38, commit `871df2b1cd133bcad717c0194a474a35fbabcd3c`.
3. A comparação `releases/v2.9.0-homologada...main` aponta a `main` **21 commits à frente, zero atrás**. Isto indica continuidade da base V2.9, não validação de todos os checkpoints V3.0.
4. CI da candidata Patch A (run `42414260730`) e CI da `main` (run `42414490966`) concluíram `SUCCESS`. Os 331 testes e seis famílias de benchmarks constam do histórico do Patch A; o workflow da `main` confirma `npm run check`, benchmark de 30/365/1.825 dias e verificação de build.
5. `schemaVersion=9` permanece declarado; backup tradicional V1 é necessário para rollback à V2.8, e compacto V2 requer V2.9 ou posterior.
6. A trilha `docs/V300_PATCH_A_ECONOMIA_BALANCEAMENTO.md` registra os cenários e limitações, incluindo que resultados ruins de demanda não são prova de bug nem de balanceamento global resolvido.

## Trabalho mínimo para conclusão

1. Encerrar `3.0.0-01` com matriz rastreável **funcionalidade → comando → persistência → teste → status**.
2. Encerrar `3.0.0-02/03` por auditoria integrada: ledger, passivos, estoque, trânsito, folha, fiscal simulado, contratos, crédito, progressão, IA, eventos e compras; verificar idempotência e uma única origem para cada fato.
3. Encerrar `3.0.0-04`: save novo e carreiras V2 anteriores; JSON tradicional, compacto V2 e arquivo corrompido; comparar antes/depois sem perda de dinheiro, estoque, histórico e IDs.
4. Encerrar `3.0.0-05`: benchmark reproduzível longo + abrir/fechar painéis + limites reais de memória e tamanho; declarar hardware/navegador.
5. Encerrar `3.0.0-06/07` preservando histórico no README, CHANGELOG, ROADMAP e documentação UI V3.1.
6. Criar candidata exclusiva de consolidação, validar CI sobre SHA exato, realizar QA Windows e desktop/mobile, obter aceite, publicar `3.0.0` e snapshot imutável **apenas se os gates realmente passarem**.
7. Após a consolidação homologada, continuar a evolução usando o Patch A já presente, sem duplicar suas regras e sem chamá-lo de aprovado retroativamente.

## Proteções e não escopo

- NÃO eliminar código do Patch A, nem aplicar `reset --hard` ou rollback sobre `main`.
- NÃO alterar o schema 9, migrar silenciosamente saves, inventar vendas ou crédito, nem misturar fatos simulados com regras fiscais reais.
- NÃO implementar interface SimCity agora (V3.1), nem iniciar o aprofundamento fiscal posterior.
- NÃO marcar QA humano como realizado sem execução observável.
- Não publicar este registro como release homologada, não criar `releases/v3.0.0-homologada` e não alterar o executável até completar o gate.

**Decisão de 07/11/2026:** escopo de consolidação V3.0 reestabelecido; auditoria documental aberta; homologação técnica **ainda não concedida**.


## Etapa 2 — Auditoria cruzada executada na candidata (07/11/2026)

**Branch:** `audit/v3.0-consolidacao-integral-v2-20261107`.  
**Arquivo de teste novo:** [`tests/integration_v300_consolidation.test.mjs`](../tests/integration_v300_consolidation.test.mjs).  
**Commit de teste:** `f5c3497bf1c68dd291046d5959a211d72199b49a`.  
**CI de validação:** [GitHub Actions #42416696608](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42416696608), `SUCCESS`.  
**Resultado:** **335/335 testes PASS, 0 FAIL** — quatro casos novos mais 331 testes preexistentes; `npm run check`, build HTML único e benchmark de estabilidade **PASS**.

### Novos testes observados como PASS

1. **Integração V2 dentro de uma só carreira:** estoque e venda efetiva, financiamento, contratos de fornecedor, abertura de filial, concorrência, RH/DP, Fiscal Operacional, Paralegal e transferência entre filiais; balanço, razão e compensação interfilial conciliados após 33 dias acumulados.
2. **Patch A com módulos V2:** proposta de capital de giro, compra estratégica com confirmação e ID idempotente, folha e fechamento de mês; consultas de qualidade/progressão/finanças/logística não alteraram estado ou RNG.
3. **Migração histórica:** arquivo V1.7 homologado representado pelo fixture original da versão V1.7 migrou a schema 9 sem reescrever registros anteriores, alterar caixa nem ativar crédito, concorrência, RH ou logística retroativamente.
4. **Proteção de persistência:** backup tradicional V1 e compacto V2 preservaram estado serializado integral e conciliação; adulteração de checksum foi rejeitada; comando repetido não duplicou consequência e reutilização conflitante do ID foi rejeitada.

**Benchmarks observados na mesma CI:** estabilidade 30/365/1.825 dias, 1 e 5 estabelecimentos, integridade `PASS`. O pior caso registrado (1.825 dias e 5 unidades) gerou save de aproximadamente **21.321.320 bytes**, com média computacional de **4,95 ms/dia no executor da CI**. Isso **não** demonstra desempenho em computador de usuário nem persistência via `file://`.

### Conclusão e limites

- **PASS técnico observado nesta etapa:** regressões cruzadas acrescentadas, build/testes e benchmark sob as condições da CI.
- **PARCIAL — gate `3.0.0-03`:** integração entre domínios testada; resta auditoria arquitetural completa de propriedades do motor, ausência de cálculo duplicado e invariante de todos os fluxos combinados.
- **PARCIAL — gate `3.0.0-04`:** formatos V1/V2 e um legado V1.7 validados em laboratório; faltam arquivos reais de jogador, teste manual de corrupção/rollback e cobertura documental do inventário de todas as carreiras V2.
- **PARCIAL — gate `3.0.0-05`:** desempenho da CI comprovado; falta validação de interface/navegador, mobile e Windows.
- **PENDENTES:** documentação unificada (`3.0.0-06`), contrato UI V3.1 (`3.0.0-07`), QA humano e gate final (`3.0.0-08`).

**Sem promoção a versão final, sem mudança de gameplay, sem homologação de QA humano, sem merge desta PR.** A `main` permanece com o Patch A candidato preservado. A próxima etapa lógica é fechar a matriz de contratos/propriedade única (`3.0.0-01/02/03`) e documentar as lacunas de compatibilidade antes do gate final.
