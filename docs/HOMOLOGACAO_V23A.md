# Homologação funcional — Cidade dos Negócios v2.3.0-alpha.1 (Patch A)

**Data de aceite (horário de Fortaleza):** 02/11/2026.  
**Origem homologada:** `releases/v2.2.1-homologada` no commit `9fbdc2446584c58c4171ebd6db3deaa7ec7c7a7e`.  
**Branch de desenvolvimento:** `feature/v2.3-a-navegacao`.  
**PR:** #19, direcionada à `main`.  
**Versão pública intermediária:** `2.3.0-alpha.1`.  
**Snapshot de recuperação pretendido:** `releases/v2.3.0-alpha.1-patch-a-homologada`.

## Evidência de aceite

O titular instalou a prévia isolada do Patch A no Windows e declarou expressamente: **“VALIDADO HOMOLOGUE PARA VERSIONARMOS E DEPOIS PARTIVAMOS PARA A PROXIMA, E EU PSOSA ATUALIZAR NORMALMENTE”**.

Esta declaração é aceite funcional do Patch A, não prova específica de persistência do `file://` em todos os navegadores, nem homologação da V2.3.0 inteira.

## Entrega

- Menu principal em quatro áreas; administrativo substitui Finanças na navegação.
- Departamentos internos Finanças, RH/DP, Contabilidade, Fiscal e Paralegal.
- Empresas: Dashboard, Minhas Empresas, Análises e Comparativos.
- Mercado: Compras, Estoque, Vendas e Outros; **ainda sem reposição inteligente**, reservada ao Patch B.
- Fiscal preservado com avisos e comandos da V1.9; atalhos anteriores compatíveis.
- Identificação técnica sincronizada no motor, pacote, template e HTML para `2.3.0-alpha.1`.
- Save schema 9 e lógica do motor preservados; alterações do motor limitadas a texto da versão.

## Gate de publicação

Verificar CI PASS, build reproduzível, testes de regressão e integridade do diff. Após merge na `main`, confirmar SHA publicado, preservar snapshot e verificar que o atualizador Windows obtém o novo commit oficial.

## Futuro

Esta homologação é intermediária. Os patches B, C e D seguem pendentes, assim como a homologação final da V2.3.0.
