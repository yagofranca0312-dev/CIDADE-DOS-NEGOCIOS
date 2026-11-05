/* V2.0: fragmento de visualização, incorporado à mesma closure pelo build. */
  // Demonstrativo financeiro puro: compara o livro do mesmo recorte, sem novos lançamentos.
  function renderTreasury(report,q,params){
    const flow=Core.cashFlowStatement(state,q.period,params.date,params.range,financeScope);
    const group=financeScope==='all';
    setText('treasury-period-label',report.label+' · '+(group?'grupo consolidado':'contribuição da unidade '+financeScope)+' · até '+BRDate(report.effectiveEnd));
    const numbers={'treasury-cash':flow.closingCash,'treasury-inflows':flow.inflows,'treasury-outflows':flow.outflows,'treasury-net':flow.netCash,
      'treasury-payable':report.closingPayable,'treasury-tax':group?report.closingTaxPayable:null,'treasury-transit':report.closingInTransit};
    for(const [id,value] of Object.entries(numbers))setText(id,value===null?'Somente grupo':Core.money(value));
    const debts=Core.operatingPayablesReport(state);
    if(typeof document!=='undefined'&&$('payable-operating-unit')){
    const chooser=$('payable-operating-unit'),prior=chooser.value;
    chooser.replaceChildren(...debts.units.map(u=>{
      const option=document.createElement('option');option.value=u.businessId;
      option.textContent=u.businessId+' · '+u.city+' · '+Core.money(u.outstanding)+' em aberto';
      return option;
    }));
    if(debts.units.some(u=>u.businessId===prior))chooser.value=prior;
    const selected=debts.units.find(u=>u.businessId===chooser.value);
    const canPay=!!selected?.outstanding;
    chooser.disabled=!debts.units.length;
    $('payable-operating-amount').disabled=!canPay;
    $('payable-operating-submit').disabled=!canPay;
    $('payable-operating-amount').max=canPay?(selected.outstanding/100).toFixed(2):'0';
    setText('payable-operating-summary','Dívidas operacionais: '+Core.money(debts.total)+
      ' · caixa compartilhado: '+Core.money(Core.overview(state).cash)+
      (debts.unclassified?' · outras obrigações fora desta rotina: '+Core.money(debts.unclassified):''));
    }
    const cat=flow.categories;
    const categories=[
      ['Receitas de vendas efetivamente recebidas',cat.sales],['Aportes de capital',cat.capital],
      ['Outras entradas',cat.unclassifiedIn],['Pagamentos a fornecedores',cat.suppliers],
      ['Despesas operacionais pagas',cat.operating],['Salários fictícios pagos',cat.payroll||0],['Liquidação de despesas antigas',cat.operatingSettlements||0],['Custos de abertura pagos',cat.opening],
      ['Tributos simulados pagos',cat.taxPayments],['Outras saídas',cat.unclassifiedOut]
    ];
    $('treasury-categories').innerHTML=categories.map(([title,value])=>'<dt>'+escape(title)+'</dt><dd>'+escape(Core.money(value))+'</dd>').join('');
    $('treasury-performance').innerHTML=[
      ['Receita reconhecida no período',report.revenue],['CMV do período',report.cogs],
      ['Despesas operacionais reconhecidas',report.expenses],['Resultado operacional antes dos tributos',report.revenue-report.cogs-report.expenses]
    ].map(([title,value])=>'<dt>'+escape(title)+'</dt><dd>'+escape(Core.money(value))+'</dd>').join('');
    setText('treasury-scope-note',group?
      'Saldo e fluxo do grupo conciliados pelo razão: '+(flow.reconciled?'SIM':'VERIFICAR')+'. Tributos apresentados apenas se simulados e contabilizados.':
      'A unidade contribui para entradas e saídas do caixa centralizado. Não existe saldo individual; tributos simulados não são rateados.');
  }

  function renderFinances(){
    if(!state)return;
    const q=ensureFinanceQuery();
    $('finance-period').value=q.period;
    for(const group of document.querySelectorAll('[data-finance-field]'))group.hidden=group.dataset.financeField!==q.period;
    const fields={'finance-date':q.asOf,'finance-day':q.day,'finance-month':q.month,
      'finance-quarter':q.quarter,'finance-quarter-year':q.quarterYear,
      'finance-semester':q.semester,'finance-semester-year':q.semesterYear,
      'finance-year':q.year,'finance-range-from':q.from,'finance-range-to':q.to};
    for(const [id,value] of Object.entries(fields)){const el=$(id);if(document.activeElement!==el)el.value=String(value);}
    for(const id of ['finance-date','finance-day','finance-range-from','finance-range-to'])$(id).max=state.calendar.date;
    $('finance-month').max=state.calendar.date.slice(0,7);
    for(const id of ['finance-year','finance-quarter-year','finance-semester-year'])$(id).max=state.calendar.date.slice(0,4);
    let report;
    try {
      const params=financeQueryDate(q);
      report=Core.financialReport(state,q.period,params.date,params.range,financeScope);
      $('finance-validation').hidden=true;setText('finance-validation','');
    }catch(e){
      $('finance-validation').hidden=false;setText('finance-validation',e.message);
      setText('finance-period-label','Corrija o período selecionado para consultar o demonstrativo.');
      $('finance-summary').innerHTML='';setText('finance-statement-note','Selecione um período válido para consultar os demonstrativos.');setText('journal-count','—');
      $('journal-events').innerHTML='<p class="muted">Período inválido. Nenhum dado foi alterado.</p>';
      setText('treasury-period-label','Corrija o período selecionado.');
      for(const id of ['treasury-cash','treasury-inflows','treasury-outflows','treasury-net','treasury-payable','treasury-tax','treasury-transit'])setText(id,'—');
      $('treasury-categories').innerHTML='';$('treasury-performance').innerHTML='';
      return;
    }
    setText('finance-period-label',`${report.label} · ${financeScope==='all'?'GRUPO CONSOLIDADO':`UNIDADE ${financeScope}`} · lançamentos até ${BRDate(report.effectiveEnd)}. Consulta fixa até você alterar os filtros.`);
    // Guia de demonstrações: um único painel, sem adicionar abas principais.
    const titles={summary:'Resumo realizado',dre:'DRE gerencial',balance:'Balanço patrimonial',cash:'Fluxo de caixa realizado',check:'Conferência do razão'};
    setText('finance-statement-title',titles[statementView]);
    for(const button of document.querySelectorAll('[data-statement-view]')){
      const active=button.dataset.statementView===statementView;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    }

    const rows=[
      ['Receita de vendas (período)',report.revenue],
      ['(-) Custo das mercadorias vendidas',report.cogs],
      ['Lucro bruto (período)',report.grossProfit],
      ['(-) Despesas operacionais',report.expenses],
      ['Resultado antes dos tributos',report.revenue-report.cogs-report.expenses],
      ['(-) Tributos simulados contabilizados',report.taxExpense],
      ['Resultado após tributos simulados',report.profit],
      ['Caixa centralizado do grupo',financeScope==='all'?report.closingCash:null],
      ['Estoque contabilizado no encerramento',report.closingInventory],
      ['Obrigações operacionais acumuladas',report.closingPayable],
      ['Tributos simulados a pagar',report.closingTaxPayable],
      ['Mercadorias pagas em trânsito (ativo)',report.closingInTransit]
    ];
    let note='Resultados realizados do ledger. Tributos só entram quando há cenário didático opt-in efetivamente contabilizado; não representam apuração legal.';
    if(statementView==='dre'){
      const x=Core.incomeStatement(state,q.period,financeQueryDate(q).date,financeQueryDate(q).range,financeScope);
      rows.splice(0,rows.length,...[
        ['Receita de vendas',x.revenue],['(-) CMV',x.cogs],['Lucro bruto',x.grossProfit],
        ['(-) Despesas fixas operacionais',x.fixedExpenses],['(-) Folha fictícia apurada',x.payrollExpenses||0],['(-) Abertura de unidades',x.openingExpenses],
        ['(-) Outras despesas não classificadas',x.unclassifiedExpenses],['Resultado antes dos tributos',x.operatingResult],
        ['(-) Tributos simulados lançados no período',x.taxExpense],['Resultado após tributos simulados',x.resultAfterSimulatedTax]
      ]);
      note='DRE do período. Tributos são apenas cenários didáticos reconhecidos após ativação e fechamento da competência; não constituem valores fiscais reais.';
    }else if(statementView==='balance'){
      const x=Core.balanceSheet(state,report.effectiveEnd);
      rows.splice(0,rows.length,...[
        ['Caixa compartilhado',x.accounts.CASH],['Estoques físicos',x.accounts.INVENTORY],
        ['Mercadorias em trânsito',x.accounts.IN_TRANSIT],['Recebíveis',x.accounts.RECEIVABLE],
        ['Total do ativo',x.assets],['Contas a pagar (inclui tributos simulados)',x.liabilities],['Tributos simulados a pagar',x.accounts.TAX_PAYABLE],
        ['Capital aportado',x.paidInCapital],['Resultados acumulados após tributos simulados',x.retainedEarnings],
        ['Patrimônio líquido gerencial',x.equity],['Diferença de conciliação',x.difference]
      ]);
      note=`Balanço CONSOLIDADO do grupo até ${BRDate(x.asOf)}. Nunca é atribuído caixa individual a filiais. ${x.balanced?'Ativo = Passivo + PL.':'⚠ Há divergência ou conta não mapeada.'} Tributos presentes somente quando simulados e contabilizados.`;
    }else if(statementView==='cash'){
      const x=Core.cashFlowStatement(state,q.period,financeQueryDate(q).date,financeQueryDate(q).range,financeScope);
      rows.splice(0,rows.length,...[
        ['Caixa inicial do grupo',x.openingCash],['Entradas de vendas',x.categories.sales],
        ['Aportes ao grupo',x.categories.capital],['Outras entradas sem classificação',x.categories.unclassifiedIn],
        ['Saídas para fornecedores',x.categories.suppliers],['Saídas operacionais',x.categories.operating],['Salários fictícios pagos',x.categories.payroll||0],['Liquidação de despesas operacionais já reconhecidas',x.categories.operatingSettlements||0],
        ['Aberturas de unidades',x.categories.opening],['Pagamento de tributo simulado',x.categories.taxPayments],['Outras saídas sem classificação',x.categories.unclassifiedOut],
        ['Variação líquida de caixa',x.netCash],['Caixa final do grupo',x.closingCash]
      ]);
      note=x.warning+' Entradas, saídas e saldos representam caixa efetivo, e não custos por competência.';
    }else if(statementView==='check'){
      const x=Core.reconciliationReport(state,report.effectiveEnd);
      rows.splice(0,rows.length,...[
        ['Diferença ativo − (passivo + PL)',x.statementDifference],
        ['Unidades conferidas (inventário)',x.snapshotAvailable?x.unitRows.length:null],
        ['Inconsistências identificadas',x.errors.length],
        ['Situação do fechamento',x.ok?'CONCILIADO':'VERIFICAR']
      ]);
      note=x.note+' '+(x.errors.length?x.errors.join(' · '):'Partidas dobradas e balanço conferidos.');
    }
    $('finance-summary').innerHTML=rows.map((x,i)=>`<dt class="${i===rows.length-1?'emphasis':''}">${escape(x[0])}</dt><dd class="${i===rows.length-1?'emphasis':''}">${typeof x[1]==='string'?escape(x[1]):x[1]===null?'Compartilhado (ver grupo)':escape(Core.money(x[1]))}</dd>`).join('');
    setText('finance-statement-note',note);
    setText('journal-count',`${report.entries.length} registros`);
    $('journal-events').innerHTML=report.entries.length?report.entries.slice(-8).reverse().map(j=>`<div class="event-item"><i class="event-dot"></i><div><p>${escape(j.memo)}</p><small>${escape(BRDate(j.date))} · ${escape(j.id)}</small></div></div>`).join(''):'<p class="muted">Nenhum lançamento neste período.</p>';
    renderTreasury(report,q,financeQueryDate(q));
    renderStrategy();
  }

  function renderFiscalOperations(){
    const target=$('fiscal-op-unit-list');if(!target)return;
    const report=Core.fiscalOperationsReport(state),names={CONCLUIDA:'Concluída',ATRASADA:'Atrasada',PENDENTE:'Pendente'};
    setText('fiscal-op-summary',report.openPeriods+' competências abertas · '+report.overdueTasks+
      ' conferências atrasadas · '+report.closedPeriods+' fechamentos registrados');
    if(!report.units.length){target.innerHTML='<p class="muted">Inaugure uma unidade para ativar rotinas fiscais fictícias.</p>';return;}
    target.innerHTML=report.units.map(u=>{
      const heading='<div class="panel-heading"><h4>'+escape(u.businessId)+' · '+escape(u.city)+
        '</h4><span class="tag-soft">'+(u.activatedAt?'Ativado em '+escape(BRDate(u.activatedAt)):'Não ativado')+'</span></div>';
      if(!u.activatedAt)return '<article class="panel spaced">'+heading+
        '<p>Rotinas opcionais: ativar não gera encargos, tributos nem competências anteriores.</p>'+
        '<button type="button" class="btn btn-outline" data-fiscal-op-activate="'+escape(u.businessId)+
        '">Ativar checklist desta unidade</button></article>';
      const visible=u.periods.filter((p,i)=>!p.closed||i>=u.periods.length-3).slice().reverse();
      const periods=visible.map(p=>{
        const tasks=p.tasks.map(t=>'<tr><td>'+escape(t.label)+'</td><td>'+escape(BRDate(t.dueDate))+
          '</td><td>'+escape(names[t.status]||t.status)+'</td><td>'+
          (t.status!=='CONCLUIDA'&&!p.closed?'<button type="button" class="btn btn-outline" data-fiscal-op-task="'+
            escape(t.id)+'" data-fiscal-op-period="'+escape(p.period)+'" data-fiscal-op-unit="'+escape(u.businessId)+
            '">Concluir revisão</button>':'—')+'</td></tr>').join('');
        const badge=p.closed?'Fechado':p.status==='ATRASADO'?'Fechamento atrasado':'Em andamento';
        return '<details class="market-drawer finance-drawer"><summary>Competência '+escape(p.period)+
          ' · '+badge+' · fechamento interno até '+escape(BRDate(p.dueDate))+'</summary>'+
          '<div class="table-scroll"><table class="catalog-table"><thead><tr><th>Conferência</th><th>Prazo do jogo</th><th>Situação</th><th>Ação</th></tr></thead><tbody>'+
          tasks+'</tbody></table></div>'+
          (p.closed?'<p class="field-hint">Fechamento gerencial registrado no histórico auditável.</p>':
            '<button type="button" class="btn btn-outline" data-fiscal-op-close="'+escape(p.period)+
            '" data-fiscal-op-unit="'+escape(u.businessId)+'" '+(p.canClose?'':'disabled')+
            '>Fechar competência do jogo</button>')+'</details>';
      }).join('');
      return '<article class="panel spaced">'+heading+
        (periods||'<p class="field-hint">A primeira competência ficará disponível após a virada do mês do jogo.</p>')+
        '</article>';
    }).join('');
  }
  function renderFiscal(){
    if(!state)return;
    const f=Core.taxReport(state),v=f.estimate,e=f.transition;
    setText('fiscal-status',f.mode==='SIMULACAO_SIMPLES_COMERCIO'?`${v.coverageStatus} · cenário ${v.coverageStatus==='UNSUPPORTED'?'suspenso nesta competência':'ativado'}`:'NOT_COVERED · demonstração econômica');
    $('fiscal-optin').hidden=f.mode!=='DEMONSTRACAO_ECONOMICA';
    $('fiscal-activate').disabled=!$('fiscal-acknowledge').checked;
    const rows=[
      ['Modo atual',f.mode==='DEMONSTRACAO_ECONOMICA'?'Sem cobrança ativa':'Cenário de comércio simulado'],
      ['Início das competências',f.effectiveFrom||'Somente após confirmação'],
      ['Competência corrente',f.currentPeriod],
      ['Cobertura da competência',v.coverageStatus],
      ['Receita registrada no mês',Core.money(v.revenue)],
      ['RBT12 anualizada (didática)',v.rbt12===null?'NÃO COBERTA':Core.money(v.rbt12)],
      ['Faixa do Anexo I',v.bracket===null?'—':`${v.bracket}ª faixa`],
      ['Alíquota efetiva aproximada',v.rateBasisPoints===null?'—':`${(v.rateBasisPoints/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`],
      ['Cenário mensal estimado',v.amount===null?'NÃO CALCULADO':Core.money(v.amount)],
      ['Saldo tributário simulado a pagar',Core.money(f.taxPayable)]
    ];
    $('fiscal-summary').innerHTML=rows.map(([k,val])=>`<dt>${escape(k)}</dt><dd>${escape(val)}</dd>`).join('');
    setText('fiscal-note',`${v.reason} ${f.note} Valor corrente é apenas estimativa até o fechamento; competência não suportada não é zero.`);
    const records=f.assessments.slice(-15).reverse();
    $('fiscal-assessments').innerHTML=records.length?records.map(a=>`<div class="event-item"><div><strong>${escape(a.period)}</strong> · ${escape(a.status)}<p>${a.status==='UNSUPPORTED'?escape(a.reason):`Valor calculado ${escape(Core.money(a.amount))} · Pago ${escape(Core.money(a.paid))}`}</p></div>${a.status==='OPEN'?`<button type="button" class="btn btn-outline" data-tax-pay="${escape(a.period)}">Pagar ${escape(Core.money(a.amount-a.paid))}</button>`:''}</div>`).join(''):'<p class="muted">Nenhuma competência encerrada no modo de simulação. Nada foi lançado retroativamente.</p>';
    $('fiscal-transition').innerHTML=[['Ano / etapa',`${e.year} · ${e.phase}`],
      ['Receita corrente (referência educativa)',Core.money(e.revenueCurrentMonth)],
      ['CBS de teste 2026 — 0,9%',e.cbsTestCents===null?'Não calculada':Core.money(e.cbsTestCents)],
      ['IBS de teste 2026 — 0,1%',e.ibsTestCents===null?'Não calculado':Core.money(e.ibsTestCents)],
      ['Reconhecimento contábil de teste','NENHUM']].map(([k,val])=>`<dt>${escape(k)}</dt><dd>${escape(val)}</dd>`).join('');
    setText('fiscal-transition-note',e.note);
  }
