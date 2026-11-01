# CP-000 — Fundação da arquitetura de jogo HTML único

- **Data:** 2026-11-01
- **Projeto:** Cidade dos Negócios
- **Slug proposto no GitHub:** `yagofranca0312-dev/cidade-dos-negocios`
- **Estado:** checkpoint da decisão arquitetural; **não homologação de gameplay**.
- **Entrega executável:** `index.html`, offline e independente de CDN/servidor.
- **Inspiração técnica:** lições de MicroCity e Touchline: evitar monólito de regras, patch acumulativo, dupla mutação, eventos fictícios, save frágil e QA insuficiente.

## Decisões congeladas

1. Um HTML físico com módulos lógicos internos e fronteiras explícitas.
2. Um estado oficial (`State`) e comandos centralizados (`Engine.dispatch`).
3. A interface somente renderiza estado; não calcula resultado econômico.
4. O relógio do mundo é único e separado da velocidade de apresentação.
5. Eventos registrados somente após a aplicação real de uma decisão.
6. Seed de aleatoriedade controlada; sem `Math.random()` nas regras de negócio.
7. Backups JSON, esquema versionado e validação; não depender de armazenamento implícito `file://`.
8. Regras técnicas verificáveis e testes progressivos, incluindo longa duração e integração.
9. Um patch só avança mediante versão exata, backup e evidência de teste.
10. O próximo passo é definir a fantasia de jogo e o ciclo econômico mínimo **antes** de implementar mecânicas.

## Fora do escopo de CP-000

Economia, indústrias, moedas, negócios, competição entre empresas, IA econômica, tempo em execução, mapas e balanceamento. Também estão pendentes publicação, proteção de branches e homologação no GitHub enquanto não houver repositório remoto verificado.

## Critério de conclusão

- Arquivos de configuração e arquitetura preparados;
- HTML abre offline e diagnóstico inicial passa **após teste real em navegador**;
- CI executa verificações estáticas assim que o repositório existir;
- Repo privado confirmado, arquivos publicados e checkpoint de commit registrado no GitHub.

> **Regra de rastreabilidade:** não marcar os itens de publicação, CI remoto ou browser QA como concluídos sem evidência. Documento é checkpoint de planejamento e preparação, não release.
