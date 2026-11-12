# V3.3.2-D — Polimento responsivo, QA e pré-homologação

**Contrato:** CDN-CONTRATO-V332-001 — Gate D
**Base:** candidata C (`feat/v3.3.2-c-central-de-gestao`) com Patches A+B+C.
**Política de release:** não publicar na `main` sem aceite visual expresso do titular. A V3.3.1 é o rollback íntegro.
**Versão funcional candidata:** V3.3.2 A+B+C+D. `package.json` permanece `3.3.1` até o release autorizado, conforme contrato.

## Alterações estritas deste Patch D

- Ajuste de alvos de toque no mobile: tempo/câmera, ações rápidas, Agenda e Central de Gestão.
- Em desktop largo (a partir de 1500 px), distribuição proporcional da largura dos cartões superiores para remover espaço ocioso, sem mudar a proporção do SVG.
- Painel expandido limitado pela área entre HUD e barra inferior, reduzindo sobreposição.
- Inspetor de lote e drawers da cidade reposicionados acima da barra inferior: o comando **Abrir unidade neste lote** fica tocável em tablet/mobile.
- Restauração de foco em controles de teclado ao fechar a equipe, exibir evidência, dispensar avisos e voltar da função aberta.
- Prevenir sobreposição da Central com os painéis `Mais` e `Agenda`.
- Sem recriar elementos de lista enquanto a Central estiver recolhida. Prévia com `aria-live` muda apenas quando o texto mudar.
- Associação acessível de cada botão Detalhes à evidência correspondente (`aria-controls`), região do painel nomeada e suporte a movimento reduzido.
- Sem alterações no `src/core/game.js`, sem save schema novo, sem mudança de motor fiscal/econômico.

## Matriz visual obrigatória

| Cenário | Viewport | Esperado |
|---|---|---|
| Mobile compacto | 320×700 | Sem barra fora da tela; botões tocáveis, Central não cobre HUD |
| Mobile padrão | 390×844 | KPI horizontal legível, mapa inteiro e painel recolhível |
| Mobile amplo | 430×932 | Navegação direta e drawer correto |
| Tablet vertical | 768×1024 | Trilhos acessíveis, preservação de mapa |
| Tablet horizontal | 1024×768 | Sem colisão dos 3 blocos inferiores |
| Desktop HD | 1366×768 | Indicadores, mapa e ações em seus quadrantes |
| Desktop Full HD | 1920×1080 | Composição proporcional, sem esticamento |

São necessárias capturas Chrome e Edge, inclusive com a Central expandida. QA emulado não substitui celular físico.

## Comportamentos e regressões exigidos

1. Criar carreira vazia: Central mostra 0 e não inventa alertas.
2. Criar estoque crítico: aviso com evidência; sem compra automática.
3. Dispensar aviso: apenas estado visual; não altera dinheiro, estoque, ledger nem save.
4. Resolver condição em jogo: aviso desaparece da lista e passa ao histórico visual na sessão.
5. Ir à ação: abre a aba existente e volta à Central sem foco perdido.
6. Navegar por teclado Tab/Enter/Escape; teclado mantém referências após rerender.
7. Verificar data, caixa, vendas e resultado acumulado; nenhum dado ilustrativo.
8. Inspecionar os 18 lotes, zoom 100%, pan, centralizar e toque/seleção.
9. Exportar/importar save da V3.3.1, confirmar schema 10 e operação offline file://.
10. Executar `npm run check`, Windows Chrome/Edge e cenários de 365/1.825 dias.
11. Consultar os screenshots e os relatórios de CI antes do GO.

## Limitações intencionais

- Gerente Comercial (`COM-01`) ainda não ativo por ausência de comparação auditada por produto.
- Histórico da Central permanece **visual e efêmero na sessão**; não é save econômico.
- Avisos não são notificações push e não executam ações financeiras/fiscais por conta própria.

## Gate D (obrigatório)

O resultado pode alcançar `IMPLEMENTADO` ou `TESTADO TECNICAMENTE` com CI verde. **`APROVADO PELO TITULAR`** requer aceite funcional e visual no desktop e telefone reais.

Após o aceite, gerar commit de release com atualização de versão e validação documental, executar CI novamente, preservar backup/rollback V3.3.1 e somente então publicar na `main`. Não criar tag, release ou merge sem GO.

## Procedimento de teste do titular

1. Exporte a carreira em JSON na versão publicada e guarde cópia.
2. Abra o HTML **candidato** da branch D em Chrome/Edge, sem substituir o jogo principal.
3. Confira o cabeçalho e o mapa em desktop; abra a Central e alterne Ativas e Histórico.
4. Repita no celular com o navegador de sua preferência.
5. Use os atalhos Repor Estoque, Preços, Contas e Fiscal sem confirmar operações.
6. Retorne ao mapa e teste zoom, selecionar lotes e fechar janelas.
7. Descreva qualquer corte, botão inacessível, painel sobreposto ou divergência das imagens de referência.
8. O titular autoriza explicitamente ou rejeita a publicação. Qualquer falha relevante exige NO-GO e ajuste restrito.

## Provas

Os links para CI, screenshots e commit candidato serão registrados na PR do Patch D após a execução do pipeline. Este documento não significa homologação antecipada.
