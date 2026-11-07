# V3.0 — Contrato de documentação única e auditoria do checkpoint 3.0.0-06

**Data:** 07/11/2026. **Gate:** `3.0.0-06` (README, CHANGELOG, ROADMAP e tutorial, com limites fiscais explícitos).  
**Código verificado:** `3.0.0-alpha.1` disponível na `main`; **não homologado como V3.0 completa**.  
**Última release homologada:** `2.9.0`, branch `releases/v2.9.0-homologada`, commit `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.  
**Controle:** PR #39 DRAFT; a publicação exige outros gates técnicos e QA manual; este documento não autoriza merge, promoção, release ou versão V3.1.

## 1. Fonte canônica por assunto — contrato editorial

| Pergunta / assunto | Referência atual | Uso do histórico |
|---|---|---|
| Qual executável/versão roda hoje? | `src/core/game.js::VERSION`, `package.json`, `src/shell/index.template.html` e `README.md` (status corrente) | Versões anteriores são snapshots, não atualizações automáticas |
| Qual versão é homologada e qual é alpha? | `README.md`, `docs/ROADMAP.md`, `docs/HOMOLOGACAO_V290.md` e branches reais | Registro de homologação **formal** não prova QA Windows |
| Como instalar e jogar? | [Guia único atual](JOGAR_GUIA_V300.md) e [atualizador Windows](ATUALIZADOR_WINDOWS.md) | Tutorial antigo no README só tem valor histórico |
| Regras econômicas da V2 e Patch A | [Matriz de contratos](V300_MATRIZ_CONTRATOS_E_PROPRIEDADE.md), [plano Patch A](V300_PATCH_A_ECONOMIA_BALANCEAMENTO.md) e `src/core/game.js` | Métricas históricas de benchmarks pertencem às suas datas e seeds |
| Fiscal didático e limites legais | [Contrato Fiscal V1.9](FISCAL_V19.md), [Fiscal Operacional V2.4-C](V24C_IMPLANTACAO.md) e [Guia único, seção 5](JOGAR_GUIA_V300.md#5-fiscal-não-confundir-os-dois-subsistemas) | Não inferir obrigações oficiais ou apuração 2027+ |
| RH e Paralegal | [Contrato RH/DP](V24B_IMPLANTACAO.md), [Paralegal](V24A_IMPLANTACAO.md) | Todos os cadastros, salários, taxas, prazos e folhas são inventados para o jogo |
| Backup, migração, rollback | [Matriz de saves](V300_MIGRACAO_ROLLBACK_SAVES.md) e `Core.exportSave*`, `Core.importSave` | Backup compacto V2 não funciona em executáveis anteriores à V2.9 |
| Performance, limites do HTML/save | [Benchmark e QA pendente](V300_PERFORMANCE_ESTABILIDADE.md), `tools/benchmark-v300-consolidation.mjs` | CI Linux com DOM simulado não comprova Chrome/Windows/mobile |
| O que está planejado a seguir? | [Roadmap com bloco de estado vigente](ROADMAP.md) e [dossiê dos oito checkpoints](V300_CONSOLIDACAO_INTEGRAL_GATES.md) | Etapas P0–P4, V1.x e V2.x mantidas como **cronologia**, não roadmap atual |
| Registro imutável de alterações e versões | `CHANGELOG.md` com seção “AUDITORIA, sem release homologada” no topo | Não inserir resultados de 2026 em releases antigas nem reescrever changelog histórico |

**Regra de precedência:** artefato executável + motor determinam **o que está implementado**; changelog e gate documental determinam **o que foi certificado e em qual commit**; um plano anterior nunca comprova implantação. Um resultado de benchmark requer SHA, cenário, versão e plataforma. A aprovação dos testes é independente da aprovação formal da V3.0.

## 2. Inventário de correções documentais desta etapa

| Divergência real identificada | Correção feita | Critério de não regressão |
|---|---|---|
| README classificava como atual o limite histórico de 1 empresa e ausência de tributos simulados | Seção vigente atualizada para 5 unidades e distinção entre fiscal didático 2026 e Fiscal Operacional | Testes leem a seção **atual** e o código |
| README não separava código na `main` de versão homologada | Cabeçalho agora declara `3.0.0-alpha.1` na `main`, V2.9 estável e PR #39 DRAFT | Verificação de versão + status |
| CHANGELOG dizia que Patch A ainda aguardava `main` | Texto contextualizado como CI histórica; integração real em `871df2b` registrada | Não tratar código integrado como homologado |
| ROADMAP encerrava em V2.5 alpha e continha decisões superadas | Bloco de **estado vigente** e matriz dos oito gates acrescentados antes do histórico, sem apagar cronologia | Verificação dos oito checkpoints e links |
| Tutorial curto falava só de V1 e não cobria salvamento grande, crédito, RH, fiscal ou Patch A | Criado `docs/JOGAR_GUIA_V300.md` com fluxo de jogo atual e limites de cada departamento | Testes de menu/status e links locais |
| Especificação Patch A ainda dizia “Próxima etapa Patch B” | Aviso de contexto acima do documento original informa prioridade de consolidação V2→V3 | Não alterar cenários, regras ou hashes históricos |
| Diagnóstico de Sistema calculava checksum ao abrir (Etapa 5) | Tutorial atual explica cálculo sob demanda; documentação aponta o risco de `localStorage` | Testes de etapa 5 continuam válidos |

## 3. Regras fiscais e societárias que a documentação não pode flexibilizar

**Simulador didático V1.9 (separado do Fiscal Operacional):**
- Competências de **2026** apenas, com comércio puro sob restrições; ativações exigem consentimento, sem retroagir.
- O estado `UNSUPPORTED` ou `NOT_COVERED` **não indica imposto zero, isenção ou ausência de obrigação fiscal real**.
- O exemplo CBS 0,9% / IBS 0,1% em 2026 é educativo e **não cria `TAX_PAYABLE`**. O motor não lança tributo exigível em 2027+.
- **Somente** na hipótese didática coberta e ativada há `TAX_EXPENSE/TAX_PAYABLE` fictícios; pagamentos são feitos por comando separado do jogo, nunca arrecadação real.

**Fiscal Operacional V2.4-C:** três verificações de competência, datas fictícias do jogo, conclusão e encerramento por empresa; não calcula tributos, não altera ledger e não produz PGDAS-D, SPED, EFD, Reinf, DCTFWeb, MIT ou guias reais.

**Paralegal/RH:** não emite CNPJ, alvará, licença pública; não apura obrigações de CLT, INSS, FGTS, IRRF ou eSocial. Não transformar a taxa do jogo, o prazo lúdico e a folha ficcional em orientação regulatória.

**Princípio:** nunca usar material de jogo para calcular tributos/obrigações de pessoas ou empresas reais. Conteúdo normativo em `FISCAL_V19.md` está datado e limitado ao modelo; legislação vigente para prática profissional exige pesquisa independente, fora do simulador.

## 4. Gates de documentos e release

**Aceite documental mínimo** (em branch auditável):
1. README, CHANGELOG e ROADMAP apresentam **um estado atual** que indica alpha e última release homologada; histórico preservado.
2. Guia de jogador único descreve caminhos do menu implementados, compra por confirmação, ações vs projeções, conservação de saves e diferenças fiscais.
3. Os links relativos locais do README, CHANGELOG e ROADMAP e do guia resolvem a arquivos existentes; o texto de status não contradiz `package.json`.
4. CI da PR executa testes específicos e regride a suíte econômica, contábil, fiscal, saves, build HTML, perf e checksum.
5. Checklist de QA manual permanece separado dos testes Node: não presumir Windows, mobile, performance real, persistência em `file://` nem recuperação do usuário.

**Próximos gates:** `3.0.0-07` (contrato UI de leitura para V3.1) permanece pendente; `3.0.0-08` (homologação integral) segue bloqueado até QA e aceite.

**Status:** entregas documentais preparadas; marcar `3.0.0-06` **PASS DOCUMENTAL (CI)** apenas após verificar o commit e a suíte. Mesmo com PASS documental, **gates 01–05 parciais, 07 pendente, 08 bloqueado**. Não alterar o motor/HTML para completar essa etapa.
