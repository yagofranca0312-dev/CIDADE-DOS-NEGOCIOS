# V3.3.3 — Fechamento dirigido das três lacunas

Base: PR #57, HEAD conferido `f9e7ff2f8d3b5d113d5067d96868f2f968975f42`.
Branch exclusiva: `fix/v3.3.3-fechamento-lacunas`. Sem merge, release ou homologação.

## Evidência anterior à correção

Commit de testes `c9e2d55ace2060656ff81fbcbd2afdd440ae956a`, sem modificação de produção.
[Reprodução Windows/Linux](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/43622117197):
Linux PASS; Chrome e Edge passaram pelas lacunas 1 e 2 e falharam exatamente na
lacuna 3: `P1 LOST_UPDATE: aba B sobrescreveu a gravação confirmada de A`.
As duas abas eram instâncias independentes da UI, sob um perfil compartilhado,
com IndexedDB real e `file://`. A sobrescrita foi verificada no JSON persistido,
não inferida de um contador visual. Teste Node do store também falhou antes da
correção: `Missing expected rejection` para escrita de snapshot desatualizado.

## Defeito confirmado e correção

**P1 LOST_UPDATE:** `commitInFlight` era local a cada aba. O store gravava sem
comparar o snapshot de origem da operação ao conteúdo já atualizado por outra
aba. A transação individual era atômica, mas aceitava uma atualização perdida.

Correção dirigida, sem mudar schema ou banco: token do JSON exato carregado
pela UI; compare-and-swap do snapshot completo na transação readwrite de
IndexedDB. Compara-se o conteúdo, além de revisão/worldId: duas ramificações
podem ter a mesma revisão. Em conflito, não há escrita nem restauração sobre a
outra aba; a UI sinaliza conflito, pausa o avanço automático e bloqueia novas
escritas até recarregar. O estado antigo ainda pode ser exportado.

Importação, restauração e nova carreira passam a atualizar current e safety
juntos na mesma transação. Falha de leitura de retorno tenta rollback somente
se o snapshot ainda é o que esta operação gravou. Não sobrescreve um escritor
posterior. Migração do legado também compara a ausência anterior, relendo em
caso de disputa. Nenhum campo foi acrescentado ao save.

Fallback sem IndexedDB: Web Locks serializa a comparação/escrita em
localStorage entre abas. Sem Web Locks, gravações são recusadas explicitamente;
leitura e exportação continuam disponíveis. Esse é um limite deliberado de
compatibilidade, para não prometer proteção que localStorage sozinho não tem.
A API interna não guardada permanece para compatibilidade dos utilitários;
todos os caminhos de escrita da UI utilizam a guarda.

## Testes e comparação completa

| Lacuna | Cobertura executável | Comparação / critério |
| --- | --- | --- |
| 1 | Saves A/B válidos, distintos e identificáveis; importação suspensa em File.text; segunda importação e comando recusados; barreira de transação IDB; cancelamento, JSON inválido, erro de leitura, abort real, readback interrompido e recuperação; fechamento de aba pendente. | Memória exportada pela UI e save persistido comparados profundamente com A antes de confirmar e com B após confirmação; falhas preservam também safety. |
| 2 | Seleção contextual de outra empresa; abertura de formulários; Agenda/Ações; exportações tradicional e compacta; reimportação e fechamento/reabertura real do navegador. | Estado INTEIRO comparado estruturalmente com o resultado canônico de EMPRESA.ATIVAR usando o ID real do comando. Alterações legítimas: activeBusinessId, revisão e registro do comando; empresas, lotes, propriedades, economia, fiscal e demais estruturas seguem o oracle. |
| 3 | Duas abas com mesmo save; escritor antigo; dois escritores com barreira IDB; importação de outro world enquanto a outra aba fica aberta; importação e limpeza desatualizadas; reabertura. | Um único escritor confirma por snapshot; original da outra aba e seu backup não são apagados; aba conflitante sinaliza o problema; após recarga as abas convergem ao mesmo estado completo. |

Node: funções de produção de importação/commit/persistência e store em instâncias
separadas; promises/barreiras explícitas, sem depender de sleeps. Testes rápidos
de ambos os formatos e todos os campos persistidos. O fallback testa disputa,
world diferente, limpeza antiga e ausência de Web Locks.

Windows: `tools/qa-windows-v333-gaps.mjs`, Chrome e Edge headless hospedados,
perfis temporários; downloads reais exportados pela UI para observar a memória
sem expor ou modificar seu estado privado. Barreiras reais de IndexedDB,
transações abortadas e leitura de retorno interrompida. Relatório JSON como
artefato do workflow `v333-gaps.yml`.

Regressões proporcionais: suíte Node completa; Windows C/D/E, debug anterior,
IndexedDB/migração/reabertura, navegador e operações integradas. Benchmarks
longos de 365/1.825 dias não foram refeitos: não houve mudança do Core nem do
modelo econômico, e a persistência real é coberta por cenários dirigidos.

Resultados finais, SHA exato e links Linux/Windows são consolidados na PR Draft.
Não usar o run de reprodução FAIL como aprovação. O fechamento requer o run
final inteiramente verde e o relatório `V333_GAPS_QA` com todos os cenários PASS.

## Controle de escopo e riscos

- V3.3.2, schema 10, Core, mapa, lotes, atualizador e mecanismo de rollback intactos.
- A exceção ao blob protegido de durable-store consta expressamente em
  V333_RELEASE_READINESS.json com blob anterior, novo e prova do defeito P1.
  O estado de autorização/homologação permanece pendente.
- Não houve save pessoal, perfil pessoal ou teste de dispositivo físico.
- Fechamento de aba é testado; queda de energia/encerramento forçado do SO
  durante flush físico não é simulado nem certificado por esses testes.
- Abas abertas com HTML anterior, sem o protocolo CAS, precisam ser fechadas
  antes de usar a candidata corrigida. Não se garante cooperação de versões antigas.
- Em conflito, a aba perde autorização de gravar, mas preserva seu snapshot em
  memória para exportação. Recarregar é necessário para voltar ao estado atual.
- Sem IndexedDB e sem Web Locks, o jogo é somente leitura/exportação; não há
  fallback inseguro silencioso.

## Arquivos

Produção: src/ui/app.js, src/ui/durable-store.part.js, index.html.
Testes novos: tests/v333_gaps.test.mjs, tools/qa-windows-v333-gaps.mjs.
Checks: .github/workflows/v333-gaps.yml.
Ajustes de contratos de testes para backup atômico: persistence_p0_v300,
release_readiness_v300, stabilization_v241 e v300_indexeddb_durability_gate.
Documentação: este relatório e V333_RELEASE_READINESS.json.

**Decisão final:** consolidada na PR após execução do commit final. PASS técnico
não autoriza homologação, publicação, merge, mudança de versão ou tag.
