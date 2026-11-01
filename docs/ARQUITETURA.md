# Arquitetura técnica — Single-File Simulation Engine

## Princípio

**Um arquivo executável, módulos lógicos isolados.** O `index.html` contém DOM, CSS, JavaScript e recursos de apresentação. Arquivos auxiliares no repositório são apenas de desenvolvimento.

## Pipeline de ação

`input do jogador → validação do comando → motor → atualização atômica do State → evento confirmado → sistemas derivados → apresentação → persistência sob demanda`.

Nenhuma etapa de apresentação pode produzir uma segunda consequência econômica ou esportiva.

## Divisão lógica

| Módulo | Dono de | Não pode fazer |
| --- | --- | --- |
| CONFIG | parâmetros e versão | alterar partida |
| STATE | snapshot e alteração validada | renderizar DOM |
| COMMANDS/ENGINE | validar/aplicar ações uma vez | depender de clique/HTML |
| SYSTEMS | cálculos econômicos derivados | gravar resultado duas vezes |
| AI | propor ações compatíveis | ignorar os mesmos gates do jogador |
| TIME | ordem única dos ticks | usar timers paralelos de gameplay |
| EVENTS | registrar fatos confirmados | inventar notícias ou estatísticas |
| RENDER | interface acessível e responsiva | modificar estado de negócio |
| STORAGE | serialize, validate, backup, migration | perder saves silenciosamente |
| QA | invariantes, regressão, desempenho | mudar estado ao consultar |
| BOOT | conectar componentes | duplicar inicialização |

**CP-000** implementa apenas o esqueleto `Config / State / Engine / Time / Events / AI / Storage / Diagnostics / UI / Boot`, sem regras de negócio.

## Invariantes obrigatórias

- IDs de entidades únicos; contadores e saldos finitos, não negativos quando aplicável.
- Cada ação identificada gera no máximo uma consequência oficial; idempotência para reexecuções.
- Estado serializado contém versão de esquema e seed.
- Importação rejeita esquemas inválidos e nunca substitui estado válido antes de toda validação.
- `render(state)` e consultas de QA são observacionais; não avançam calendário nem RNG.
- Tempo discreto controlado por um agendador central; animação nunca altera resultado.
- Same seed + input + actions + version ⇒ mesmas consequências simuladas.
- Eventos e histórico registrados somente se de fato processados.

## Persistência

Como `localStorage` em arquivos locais pode se comportar de modo diferente entre navegadores, a exportação/importação JSON é a base de portabilidade. IndexedDB/localStorage podem ser oferecidos depois, com migração e backup explícitos. Nunca incorporar saves reais em testes.

## Performance

Métricas propostas para fases posteriores: ms por tick, tamanho do estado serializado, quantidade de entidades, eventos por tick, heap aproximado e tempo para simular 1/5/10/20 anos. Os limiares serão definidos a partir de medições, e não inventados no CP-000.

## Segurança

Sem `eval`, CDN, network fetch, credenciais embutidas ou HTML dinâmico não sanitizado. A interface usa `textContent` para dados importados. A importação possui limite de tamanho, validação de esquema e IDs duplicados.
