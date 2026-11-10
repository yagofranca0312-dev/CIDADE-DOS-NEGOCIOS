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
    const f=Core.taxReport(state),v=f.estimate,e=f.transition,plan=f.planning;
    const names={SIMPLES:'Simples Nacional',PRESUMIDO:'Lucro Presumido',REAL:'Lucro Real'};
    const format=x=>Core.money(Math.max(0,Math.round(x||0)));
    const rate=x=>(Math.round(x*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    const current=plan.regimes.find(x=>x.regime===f.regime);
    setText('fiscal-current-regime',names[f.regime]||f.regime);
    setText('fiscal-regularity',f.regular?'REGULAR no jogo':'EM ATRASO · crédito bloqueado');
    $('fiscal-status').className='v31-status-badge '+(f.regular?'v31-status-done':'v31-status-pending');
    setText('fiscal-status',f.regular?'SIMULAÇÃO REGULAR':'GUIAS VENCIDAS');
    setText('fiscal-total-rbt12',format(v.rbt12));
    setText('fiscal-tax-credits',format(f.taxCreditsCents));
    setText('fiscal-effective-rate',rate(current?.effectiveRatePercent||0));
    $('fiscal-regime-select').value=f.regime;
    $('fiscal-iva-mode').value=f.simplesIvaMode;
    $('fiscal-iva-mode').disabled=Number(f.currentPeriod.slice(0,4))<2027;
    setText('fiscal-next-regime',f.scheduledRegime?
      'Mudança tributária para '+names[f.scheduledRegime]+' agendada para janeiro do próximo ano do jogo.':
      'A opção inicial ou em janeiro é imediata; demais alterações ficam agendadas para janeiro. Não há mudança retroativa.');
    $('fiscal-summary').innerHTML=[
      ['Competência atual',f.currentPeriod],
      ['Guia simulada a pagar',format(f.taxPayable)],
      ['Receita contabilizada no mês',format(v.revenue)],
      ['Créditos carregados para o futuro',format(f.taxCreditsCents)],
      ['Módulo fiscal','ATIVO · SIMULADO']
    ].map(([label,value])=>'<dt>'+escape(label)+'</dt><dd>'+escape(value)+'</dd>').join('');
    setText('fiscal-note',v.warning+' '+f.note);
    $('fiscal-comparison-table').innerHTML=plan.regimes.map(r=>{
      const bd=r.breakdown,winner=r.regime===plan.recommendedRegime;
      const simple=r.regime==='SIMPLES';
      return '<tr class="'+(winner?'fiscal-v32-best':'')+'"><td><strong>'+escape(names[r.regime])+'</strong> '+
        (winner?'<span class="v31-status-badge v31-status-done">Menor custo</span>':'')+
        '</td><td>'+format(bd.irpj+bd.csll)+'</td><td>'+format(bd.pisCofins+(simple?0:0))+
        '</td><td>'+format(bd.icms+bd.ibsCbs)+'</td><td>'+format(bd.cpp)+
        '</td><td>−'+format(bd.creditsUsed)+'</td><td><strong>'+format(r.totalCents)+
        '</strong></td><td>'+rate(r.effectiveRatePercent)+'</td></tr>';
    }).join('');
    setText('fiscal-planning-recommendation','Menor custo estimado no jogo: '+names[plan.recommendedRegime]+
      '. Economia potencial versus regime atual: '+format(plan.estimatedSavingCents)+'. '+plan.note);
    setText('fiscal-preview','Prévia '+f.currentPeriod+': '+format(v.principalCents)+' · receitas '+format(v.revenue)+
      ' · créditos aplicáveis '+format(v.creditsUsed)+'. Só será lançada no encerramento do mês, sem retroatividade.');
    const lines=a=>{
      const bd=a.breakdown;if(!bd)return '';
      return '<dl class="finance-list">'+[
        ['IRPJ',bd.irpj],['CSLL',bd.csll],['PIS/COFINS ou DAS simplificado',bd.pisCofins],
        ['CPP simulada',bd.cpp],['ICMS',bd.icms],['IBS/CBS (hipótese)',bd.ibsCbs],['Créditos usados',-bd.creditsUsed]
      ].map(([k,val])=>'<dt>'+escape(k)+'</dt><dd>'+escape((val<0?'−':'')+format(Math.abs(val)))+'</dd>').join('')+'</dl>';
    };
    const records=f.assessments.slice(-18).reverse();
    $('fiscal-assessments').innerHTML=records.length?records.map(a=>{
      const open=a.amount-a.paid,canPay=open>0&&['OPEN','OVERDUE'].includes(a.status);
      const tag=a.status==='PAID'||a.status==='SETTLED'?'v31-status-done':a.status==='OVERDUE'?'fiscal-v32-overdue':'v31-status-pending';
      const legacy=a.principalCents===undefined;
      return '<details class="fiscal-v32-assessment"><summary><strong>'+escape(a.period)+
        '</strong> · '+escape(legacy?'LEGADO V1.9':names[a.regime])+
        ' · '+escape(a.dueDate?BRDate(a.dueDate):'Vencimento legado')+
        ' · <span class="v31-status-badge '+tag+'">'+escape(a.status)+'</span>'+
        ' · Aberto '+format(open)+'</summary>'+
        '<p>Principal '+format(a.principalCents??a.amount)+' · Multa '+format(a.fineCents)+
        ' · Juros '+format(a.interestCents)+' · Pago '+format(a.paid)+'</p>'+
        lines(a)+(canPay?'<button class="btn btn-primary" type="button" data-tax-pay="'+escape(a.period)+
        '">Pagar guia integral '+format(open)+'</button> <button class="btn btn-outline" type="button" data-tax-partial="'+escape(a.period)+
        '">Pagamento parcial</button>':'')+'</details>';
    }).join(''):'<p class="muted">Nenhuma competência concluída. O motor apura automaticamente na virada de cada mês.</p>';
    $('fiscal-transition').innerHTML=[
      ['Etapa atual',String(e.year)+' · '+e.phase],
      ['Receita deste mês (educativa)',format(e.revenueCurrentMonth)],
      ['CBS 2026 (somente teste)',e.cbsTestCents===null?'—':format(e.cbsTestCents)],
      ['IBS 2026 (somente teste)',e.ibsTestCents===null?'—':format(e.ibsTestCents)]
    ].map(([k,val])=>'<dt>'+escape(k)+'</dt><dd>'+escape(val)+'</dd>').join('');
    setText('fiscal-transition-note',e.note);
  }
