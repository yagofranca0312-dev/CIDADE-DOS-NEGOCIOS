/* Cidade dos Negócios 1 — interface. Sem regras econômicas e sem RNG. */
(() => {
  'use strict';
  const Core=CidadeCore;
  const $=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BRDate=iso=>iso.split('-').reverse().join('/');
  const KEY='cidade-dos-negocios-save-v1';
  const SAFETY_KEY='cidade-dos-negocios-prior-save-v241';
  let state=null,viewCityId=null,selectedLot=1,tab='cidade',timer=null,speed=1,sequence=0,autosaveStatus='Backup JSON recomendado';
  let commitInFlight=false,startupBlocked=true,safetyBackupAvailable=false;
  let inspectorOpen=false; // interface somente, nunca persistido
  let restockDraft=null; // proposta de compra efêmera (não entra em saves)
  const activeSection={empresa:'dashboard',mercado:'compras',administrativo:'financas',sistema:'saves'}; // somente UI, fora do save
  let mapZoomed=false; // visão ampliada opcional; não altera o save
  let financeQuery=null,strategyHorizon=30,financeScope='all',statementView='summary'; // preferências de interface, independentes do GameState
  const business=()=>state?Core.activeBusiness(state):null;
  function chooseProduct(id){const b=business();return b?.products?.find(p=>p.id===$(id)?.value)||b?.products?.[0]||null;}
  function refillSelect(id,products){
    const select=$(id),previous=select.value;
    select.replaceChildren(...products.map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.name;return option;}));
    if(products.some(p=>p.id===previous))select.value=previous;
  }
  /* CDN_COMPANY_VIEWS */
  /* CDN_RESTOCK_VIEWS */
  /* CDN_MARKET_VIEWS */
  const setText=(id,value)=>{const el=$(id);if(el)el.textContent=String(value)};
  function notify(message,isError=false){
    const n=$('toast');n.textContent=message;n.classList.toggle('error',isError);n.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('visible'),4500);
    setText('start-message',message);
  }
  // P0: somente o snapshot gravado e lido de volta pode tornar-se o estado ativo.
  // Em erro de quota/permissão, o próximo comando é recusado e a carreira anterior
  // permanece em memória. O JSON externo ainda exige conferência do usuário.
  function persistLocal(candidate){
    if(!candidate)return false;
    try{
      const contents=Core.exportSave(candidate);
      const previous=localStorage.getItem(KEY);
      try{
        localStorage.setItem(KEY,contents);
        if(localStorage.getItem(KEY)!==contents)throw Error('Falha de leitura de retorno');
      }catch(writeError){
        // Normalmente setItem é atômico. A tentativa abaixo protege também
        // implementações anômalas que modificam a chave antes de falhar.
        let recovered=false;
        try{
          if(localStorage.getItem(KEY)!==previous){
            if(previous===null)localStorage.removeItem(KEY);
            else localStorage.setItem(KEY,previous);
          }
          recovered=localStorage.getItem(KEY)===previous;
        }catch(_){}
        if(!recovered)throw Error(writeError.message+'; a cópia local anterior não pôde ser confirmada');
        throw writeError;
      }
      autosaveStatus='Cópia local verificada neste navegador; mantenha backup JSON externo.';
      return true;
    }catch(error){
      autosaveStatus=`Salvamento local indisponível (${error.message}). Operação NÃO confirmada; a carreira anterior foi mantida. Exporte backup JSON e resolva o armazenamento antes de continuar.`;
      notify(autosaveStatus,true);
      return false;
    }finally{
      setText('autosave-label',autosaveStatus);
      setText('footer-state',autosaveStatus.startsWith('Cópia')?'Cópia local verificada · backup JSON recomendado':'Salvamento local sem garantia');
    }
  }
  // P0-04: no IndexedDB usamos JSON compacto reversível em uma transação.
  // O estado em RAM só é ativado APÓS commit + readback da cópia durável.
  async function persistDurable(candidate){
    if(!candidate)return false;
    if(CidadeDurableStore.mode()==='legacy-localstorage')return persistLocal(candidate);
    try{
      await CidadeDurableStore.writeCurrent(Core.exportSaveCompact(candidate));
      autosaveStatus='Cópia local verificada no IndexedDB; mantenha backup JSON externo.';
      return true;
    }catch(error){
      autosaveStatus='Salvamento local indisponível ('+error.message+'). Operação NÃO confirmada; a carreira anterior foi mantida. Exporte backup JSON e verifique o armazenamento antes de continuar.';
      notify(autosaveStatus,true);return false;
    }finally{
      setText('autosave-label',autosaveStatus);
      setText('footer-state',autosaveStatus.startsWith('Cópia')?'Cópia local verificada · backup JSON recomendado':'Salvamento local sem garantia');
    }
  }
  async function backupCurrent(){
    if(!state)return true;
    try{
      const raw=Core.exportSaveCompact(state);
      await CidadeDurableStore.writeBackup(raw);
      const saved=await CidadeDurableStore.readBackup();
      if(saved!==raw)throw Error('Leitura da cópia de segurança divergiu');
      safetyBackupAvailable=true;
      return true;
    }catch(error){
      notify('Não foi possível preservar a carreira atual neste navegador ('+error.message+'). Exporte backup JSON antes de substituí-la.',true);
      return false;
    }
  }
  function renderSafetyBackup(){
    const button=$('restore-prior-save-btn');if(!button)return;
    button.disabled=!safetyBackupAvailable;
    setText('safety-backup-status',safetyBackupAvailable?
      'Cópia anterior disponível neste navegador. Exporte também um JSON externo.':
      'Nenhuma cópia anterior registrada neste navegador.');
  }

  function renderQuality(){
    if(!state?.player?.cityId)return;
    const q=Core.qualityReport(state,Number($('qa-horizon').value)||30);
    const ratio=x=>x===null?'Sem amostra':String(x).replace('.',',')+'%';
    const fields=[
      ['Receita do período',Core.money(q.salesCents)],
      ['CMV externo realizado',Core.money(q.cogsCents)],
      ['Despesas reconhecidas',Core.money(q.expensesCents)],
      ['Resultado após tributo simulado',Core.money(q.periodResultCents)],
      ['Margem bruta',ratio(q.grossMarginPercent)],
      ['Caixa do grupo',Core.money(q.cashCents)],
      ['Passivos reconhecidos',Core.money(q.recognizedLiabilitiesCents)],
      ['Caixa menos passivos',Core.money(q.freeCashCents)],
      ['Custos fixos diários (cenário)',Core.money(q.estimatedFixedDailyCents)],
      ['Cobertura de custos fixos',q.fixedCostRunwayDays===null?'Sem custo fixo':q.fixedCostRunwayDays+' dia(s)'],
      ['Demanda não atendida',q.unmetDemandUnits+' de '+q.demandUnits+' unidades · '+ratio(q.unmetDemandPercent)]
    ];
    $('qa-v290-summary').innerHTML=fields.map(x=>'<dt>'+escape(x[0])+'</dt><dd>'+escape(x[1])+'</dd>').join('');
    $('qa-v290-flags').innerHTML=q.flags.length?q.flags.map(f=>
      '<div class="event-item"><div><strong>'+escape(f.id)+' · Atenção</strong><p>'+
      escape(f.label)+'</p></div></div>').join(''):
      '<p class="muted">Nenhum alerta quantitativo acima dos limites escolhidos. Isso NÃO é garantia de equilíbrio ou lucratividade futura.</p>';
    $('qa-v290-units').innerHTML=q.unitsReport.map(b=>'<tr><td>'+escape(b.id)+'</td><td>'+
      escape(Core.money(b.revenue))+'</td><td>'+escape(Core.money(b.cogs))+'</td><td>'+
      escape(Core.money(b.expenses))+'</td><td>'+escape(Core.money(b.contributionCents))+
      '</td><td>'+ratio(b.demandUnmetPercent)+'</td></tr>').join('')||
      '<tr><td colspan="6">Sem empresas abertas.</td></tr>';
  }

  function lastAvailableDate(){
    if(!state)return Core.START_DATE;
    if(!state.calendar.tick)return state.calendar.date;
    const d=new Date(state.calendar.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);
    return d.toISOString().slice(0,10);
  }
  function renderGroup(){
    const group=Core.groupReport(state),active=business();
    const select=$('unit-switch'),previous=active?.id||'';
    select.replaceChildren(...group.units.map(u=>{const option=document.createElement('option');option.value=u.id;option.textContent=`${u.id} · ${u.city} · ${Core.SECTORS[u.sector].name}`;return option;}));
    select.disabled=!group.count;select.value=previous;
    $('unit-switch-container').hidden=!group.count;
    const finance=$('finance-scope'),scope=financeScope;
    finance.replaceChildren(...[{id:'all',name:'Grupo consolidado'},...group.units.map(u=>({id:u.id,name:`${u.id} · ${u.city}`}))].map(x=>{
      const opt=document.createElement('option');opt.value=x.id;opt.textContent=x.name;return opt;
    }));
    if(![...finance.options].some(o=>o.value===scope))financeScope='all';finance.value=financeScope;
    setText('group-count',`${group.count}/5 estabelecimentos`);
    setText('v23a-dashboard-count',`${group.count}/5 estabelecimentos`);
    setText('group-available-cash',Core.money(group.group.cash));
    setText('group-operating-result',Core.money(group.group.profit));
    const rows=group.units.map(u=>`<tr><td><strong>${escape(u.id)}</strong> · ${escape(Core.SECTORS[u.sector].name)}<br><small>${escape(u.city)} · lote ${u.lot}</small></td><td>${escape(Core.money(u.revenue))}</td><td>${escape(Core.money(u.profit))}</td><td>${u.stock}</td><td><button type="button" class="btn btn-outline" data-unit-activate="${escape(u.id)}" ${u.id===active?.id?'disabled':''}>${u.id===active?.id?'Ativa':'Gerenciar'}</button></td></tr>`).join('');
    $('unit-rows').innerHTML=rows||'<tr><td colspan="5">Inaugure sua primeira unidade.</td></tr>';
    setText('group-scope-note','Receitas, CMV e despesas atribuídos a cada unidade; caixa pertence ao grupo. Nenhum capital é criado ao abrir filial.');
  }
  function renderParalegal(){
    const target=$('paralegal-unit-list');if(!target)return;
    const units=Core.paralegalReport(state);
    if(!units.length){target.innerHTML='<p class="muted">Inaugure uma unidade para iniciar os processos simulados.</p>';return;}
    const names={PENDENTE:'Não solicitado',EM_ANALISE:'Em análise',CONCLUIDO:'Concluído / vigente',VENCIDA:'Vencida'};
    target.innerHTML=units.map(u=>{
      const registration=u.processes.find(p=>p.service==='cadastro');
      return `<article class="panel spaced"><div class="panel-heading"><h4>${escape(u.businessId)} · ${escape(u.city)}</h4><span class="tag-soft">${escape(Core.SECTORS[u.sector].name)}</span></div>
        <div class="table-scroll"><table class="catalog-table"><thead><tr><th>Processo</th><th>Situação</th><th>Previsão / validade</th><th>Ação</th></tr></thead><tbody>${u.processes.map(p=>{
          const eligible=['PENDENTE','VENCIDA'].includes(p.status)&&(p.service!=='licenca'||registration.status==='CONCLUIDO');
          const timeline=p.dueDate?'Conclusão prevista '+BRDate(p.dueDate):p.expiresAt?'Válido até '+BRDate(p.expiresAt):'—';
          return `<tr><td>${escape(p.label)}<br><small>Taxa do jogo: ${escape(Core.money(p.feeCents))}</small></td>
            <td>${escape(names[p.status]||p.status)}</td><td>${escape(timeline)}</td>
            <td><button type="button" class="btn btn-outline" data-paralegal-action="${escape(p.service)}" data-paralegal-unit="${escape(u.businessId)}" ${eligible?'':'disabled'}>${p.status==='VENCIDA'?'Renovar':'Solicitar'}</button></td></tr>`;}).join('')}</tbody></table></div></article>`;
    }).join('');
  }

  function renderRH(){
    const target=$('rh-unit-list');if(!target)return;
    const report=Core.rhReport(state);
    const selector=$('rh-hire-unit'),previous=selector.value;
    selector.replaceChildren(...report.units.map(u=>{
      const opt=document.createElement('option');opt.value=u.businessId;
      opt.textContent=u.businessId+' · '+u.city;return opt;
    }));
    if(report.units.some(u=>u.businessId===previous))selector.value=previous;
    $('rh-hire-submit').disabled=!report.units.length;
    setText('rh-summary',report.totalActive+' funcionários ativos · folhas pendentes: '+Core.money(report.pendingCents));
    if(!report.units.length){target.innerHTML='<p class="muted">Inaugure uma unidade para contratar personagens.</p>';return;}
    target.innerHTML=report.units.map(u=>{
      const active=u.employees.filter(x=>!x.dismissedAt),former=u.employees.filter(x=>x.dismissedAt);
      const workers=active.map(x=>'<tr><td>'+escape(x.name)+'<br><small>'+escape(x.id)+'</small></td><td>'+
        escape(Core.RH_ROLES[x.role].label)+'</td><td>'+escape(Core.money(x.salaryCents))+
        '</td><td><button type="button" class="btn btn-outline" data-rh-dismiss="'+escape(x.id)+'">Desligar</button></td></tr>').join('');
      const sheets=u.payrolls.slice().reverse().map(p=>'<tr><td>'+escape(p.period)+'</td><td>'+escape(Core.money(p.amount))+
        '</td><td>'+(p.status==='OPEN'?'Em aberto':'Paga')+'</td><td>'+
        (p.status==='OPEN'?'<button type="button" class="btn btn-outline" data-rh-pay="'+escape(p.period)+'" data-rh-unit="'+escape(u.businessId)+'">Pagar</button>':'—')+
        '</td></tr>').join('');
      return '<article class="panel spaced"><div class="panel-heading"><h4>'+escape(u.businessId)+' · '+escape(u.city)+'</h4>'+
        '<span class="tag-soft">'+u.activeCount+'/4 ativos · bônus '+u.bonusPercent+'%</span></div>'+
        '<p class="field-hint">Salários-base mensais: '+escape(Core.money(u.monthlyCents))+
        ' · folhas ainda não pagas: '+escape(Core.money(u.pendingCents))+
        ' · '+former.length+' desligado(s) no histórico.</p>'+
        '<h4>Equipe ativa</h4><div class="table-scroll"><table class="catalog-table"><thead><tr><th>Funcionário</th><th>Cargo</th><th>Salário fictício</th><th>Ação</th></tr></thead><tbody>'+
        (workers||'<tr><td colspan="4">Sem funcionários ativos.</td></tr>')+'</tbody></table></div>'+
        '<h4>Folhas mensais concluídas</h4><div class="table-scroll"><table class="catalog-table"><thead><tr><th>Mês</th><th>Total</th><th>Situação</th><th>Ação</th></tr></thead><tbody>'+
        (sheets||'<tr><td colspan="4">A folha é reconhecida no fim do mês do jogo.</td></tr>')+'</tbody></table></div></article>';
    }).join('');
  }
  function renderPriceHistory(){
    const items=Core.priceHistory(state),container=$('price-history');
    setText('price-history-count',`${items.length} alteração(ões)`);
    container.innerHTML=items.length?items.slice(-12).reverse().map(item=>`<div class="price-history-row"><small>${escape(BRDate(item.date))} · ${escape(item.productName||'Produto base')} · ${escape(item.id)}</small><strong>${escape(Core.money(item.old))} → ${escape(Core.money(item.cents))}</strong></div>`).join(''):'<p class="muted">Nenhuma alteração registrada nesta carreira.</p>';
  }
  function renderRivals(){
    const report=Core.rivalMarketReport(state,viewCityId);
    $('rival-enable').hidden=report.enabled;
    setText('rival-status',report.enabled?'SIMULAÇÃO ATIVA':'LEGADO SEGURO');
    if(!report.enabled){
      setText('rival-summary','Carreira anterior: os rivais não foram aplicados retroativamente. Exporte seu save JSON antes de ativá-los.');
      $('rival-rows').innerHTML='<tr><td colspan="6">Economia concorrencial ainda não ativada nesta carreira.</td></tr>';
      $('rival-alerts').innerHTML='<p class="muted">Ative a economia viva para começar a simulação.</p>';
      $('rival-events').innerHTML='';
      $('rival-actions').innerHTML='';
      return;
    }
    setText('rival-summary',report.cityName+' · '+report.rivals.length+' rivais locais · '+state.calendar.tick+' dia(s) de carreira. A competição usa caixa e estoque exclusivos dos rivais.');
    $('rival-rows').innerHTML=report.rivals.map(r=>
      '<tr><td><strong>'+escape(r.name)+'</strong><br><small>'+escape(r.sector)+'</small></td>'+
      '<td>'+escape(r.strategy)+'</td><td>'+r.priceIndex+'% da referência</td>'+
      '<td>'+r.stockUnits+' un.</td><td>'+r.capacityUnits+' un./dia</td>'+
      '<td>'+r.reputation+'/90</td></tr>'
    ).join('')||'<tr><td colspan="6">Nenhum rival ativo.</td></tr>';
    $('rival-alerts').innerHTML=report.alerts.map(a=>
      '<div class="event-item"><div><p>'+escape(a)+'</p></div></div>').join('');
    $('rival-actions').innerHTML=report.actions.slice().reverse().map(e=>
      '<div class="event-item"><div><p>'+escape(e.text)+
      '</p><small>'+escape(e.date)+'</small></div></div>').join('')||
      '<p class="muted">Ainda não houve decisão concorrente relevante nesta cidade.</p>';
    $('rival-events').innerHTML=report.events.slice().reverse().map(e=>
      '<div class="event-item"><div><strong>'+escape(e.label)+'</strong><p>'+
      escape(e.effectPct>0?'Demanda favorecida '+e.effectPct+'%':'Demanda reduzida '+Math.abs(e.effectPct)+'%')+
      '</p><small>'+escape(e.startDate)+' até '+escape(e.endDate)+
      (e.active?' · EM CURSO':' · Encerrado')+'</small></div></div>').join('')||
      '<p class="muted">Nenhuma ocorrência local registrada até aqui.</p>';
  }
  function renderProgression(){
    const p=Core.progressionReport(state);
    setText('progression-level',p.level.label);
    setText('progression-goal-status',p.completed+' de '+p.total+' objetivos alcançados · '+p.metrics.days+' dia(s) operados');
    $('progression-goals').innerHTML=p.goals.map(g=>
      '<div class="event-item"><div><strong>'+escape(g.completed?'✓ '+g.label:g.label)+'</strong>'+
      '<p>'+escape(g.details)+'</p><small>'+escape(g.evidence)+' · '+g.progressPct+'% do requisito mais distante</small>'+
      '<progress max="100" value="'+g.progressPct+'" aria-label="'+escape(g.label)+'"></progress></div></div>'
    ).join('');
    const won=p.achievements.filter(a=>a.completed);
    $('progression-achievements').innerHTML=p.achievements.map(a=>
      '<div class="event-item"><div><strong>'+escape(a.completed?'✓ '+a.label:'○ '+a.label)+
      '</strong><small>'+escape(a.source)+'</small></div></div>').join('');
    const guide=Core.journeyGuide(state);
    setText('journey-next-action',guide.title+' — '+guide.next);
    $('journey-unlocks').innerHTML=p.unlocks.map(u=>
      '<div class="event-item"><div><strong>'+escape(u.unlocked?'✓ '+u.label:'○ '+u.label)+
      '</strong><small>'+escape(u.reason)+'</small></div></div>').join('');
    const rep=Core.reputationReport(state,viewCityId);
    $('journey-reputation').innerHTML=rep.units.length?rep.units.map(u=>
      '<div class="event-item"><div><strong>'+escape(Core.SECTORS[u.sector].name)+
      '</strong><p>'+escape(u.score===null?'Em observação: menos de 7 dias de amostra':
      'Reputação '+u.score+'/90 · '+u.status+' · impacto no peso competitivo '+u.impactPct+'%')+
      '</p></div></div>').join(''):'<p class="muted">Abra uma unidade nesta cidade para acompanhar sua reputação.</p>';
    $('journey-dilemmas').innerHTML=Core.dilemmaReport(state).map(d=>
      '<article class="panel spaced"><h4>'+escape(d.title)+'</h4>'+
      (d.cooldownDays?'<p class="field-hint">Nova decisão em '+d.cooldownDays+' dia(s).</p>':'')+
      '<div class="restock-choice">'+d.choices.map(c=>
      '<button type="button" class="btn btn-outline" data-dilemma="'+escape(d.id)+
      '" data-choice="'+escape(c.id)+'" '+(c.available?'':'disabled')+
      ' title="'+escape(c.reason||c.label)+'">'+escape(c.label)+'</button>').join('')+'</div>'+
      (d.lastChoice?'<small>Última escolha: '+escape(d.lastChoice)+' · '+escape(d.lastDate)+'</small>':'')+
      '</article>').join('');

  }
  function initialFinanceQuery(){
    const date=lastAvailableDate(),year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
    return {period:'all',asOf:date,day:date,month:date.slice(0,7),
      quarter:String(Math.floor((month-1)/3)+1),quarterYear:year,
      semester:String(Math.floor((month-1)/6)+1),semesterYear:year,
      year,from:Core.START_DATE,to:date};
  }
  function ensureFinanceQuery(){if(!financeQuery)financeQuery=initialFinanceQuery();return financeQuery;}
  function financeQueryDate(q){
    const year=n=>String(n).padStart(4,'0');
    if(q.period==='all')return {date:q.asOf};
    if(q.period==='day')return {date:q.day};
    if(q.period==='month')return {date:q.month+'-01'};
    if(q.period==='quarter')return {date:year(q.quarterYear)+'-'+String((Number(q.quarter)-1)*3+1).padStart(2,'0')+'-01'};
    if(q.period==='semester')return {date:year(q.semesterYear)+'-'+(q.semester==='1'?'01':'07')+'-01'};
    if(q.period==='year')return {date:year(q.year)+'-01-01'};
    return {date:q.to,range:{from:q.from,to:q.to}};
  }
  function renderStrategy(){
    if(!business()){$('strategy-metrics').innerHTML='<p class="muted">Abra uma empresa para consultar as projeções.</p>';$('strategy-cost-rows').innerHTML='';$('strategy-risks').innerHTML='';return;}
    const report=Core.strategyReport(state,strategyHorizon);
    $('strategy-horizon').value=String(strategyHorizon);
    const value=(v)=>v===null?'Não atingível':Core.money(v);
    const data=[
      ['Capital de giro (saldo atual)',Core.money(report.workingCapital)],
      ['Caixa atual cobre despesas fixas por',`${report.cashCoverageDays} dias (sem vendas)`],
      ['Despesa operacional fixa por dia',Core.money(report.dailyFixed)],
      ['Ponto de equilíbrio do mix',report.breakEvenUnits===null?'Sem margem positiva':`${report.breakEvenUnits} un./dia (estimado)`],
      ['Caixa no fim do cenário (antes da quitação de dívidas)',Core.money(report.projectedCash)],
      ['Contas operacionais atualmente a pagar',Core.money(report.knownObligations.operational)],
      ['Folhas já apuradas e não pagas',Core.money(report.knownObligations.payroll)],
      ['Tributos didáticos lançados a pagar',Core.money(report.knownObligations.tax)],
      ['Nova folha estimada da unidade ativa',Core.money(report.projectedPayrollAccrual)],
      ['Caixa se quitadas todas obrigações atuais',Core.money(report.cashAfterKnownDebtsIfPaid)],
      ['Obrigações no fim do cenário',Core.money(report.projectedPayable)],
      ['Resultado operacional projetado',Core.money(report.projectedProfit)],
      ['Unidades potencialmente não atendidas',String(report.estimatedLostUnits)],
      ['Vendas projetadas',String(report.estimatedSoldUnits)+' unidades']
    ];
    $('strategy-metrics').innerHTML=data.map(([k,v])=>`<div class="strategy-metric"><small>${escape(k)}</small><strong>${escape(v)}</strong></div>`).join('');
    const rows=[
      ['Receita de vendas',report.recent.revenue,report.projectedRevenue],
      ['(-) CMV / custo variável das mercadorias',report.recent.cogs,report.projectedCogs],
      ['(-) Despesa operacional fixa',report.recent.fixed,report.projectedFixed],
      ['(-) Nova folha estimada da unidade ativa',null,report.projectedPayrollAccrual],
      ['(-) Despesas de abertura / não recorrentes',report.recent.oneOff,null],
      ['Resultado operacional antes dos tributos',report.recent.operatingResult,report.projectedProfit]
    ];
    $('strategy-cost-rows').innerHTML=rows.map(([label,actual,projected])=>`<tr><td>${escape(label)}</td><td>${escape(Core.money(actual))}</td><td>${projected===null?'Não projetado':escape(Core.money(projected))}</td></tr>`).join('');
    const risks=[report.forecastNote];
    if(report.cashAfterKnownDebtsIfPaid<0)risks.push('⚠ Cenário de caixa insuficiente para liquidar obrigações conhecidas; não é previsão consolidada da rede.');
    if(report.breakEvenUnits===null)risks.push('⚠ O mix de produtos não tem margem de contribuição positiva nas condições atuais.');
    if(report.projectedPayable>Core.overview(state).payable)risks.push('⚠ O cenário prevê novas contas a pagar por caixa insuficiente para despesas fixas.');
    if(report.estimatedLostUnits>0)risks.push(`⚠ Projeção de ${report.estimatedLostUnits} unidades não atendidas: avalie reposição e prazos de entrega.`);
    if(report.recent.oneOff>0)risks.push('Abertura e outras despesas eventuais constam do realizado, mas não foram repetidas na projeção.');
    $('strategy-risks').innerHTML=risks.length?risks.map(x=>`<p>${escape(x)}</p>`).join(''):'<p>Sem alertas adicionais nos parâmetros desta projeção hipotética.</p>';
  }

  // V2.7: a tela apenas lê relatórios e envia comandos idempotentes ao domínio.
  function setCreditOptions(id,rows){
    const el=$(id),selected=el.value;
    el.replaceChildren(...rows.map(row=>{
      const opt=document.createElement('option');
      opt.value=String(row[0]);opt.textContent=String(row[1]);
      return opt;
    }));
    if(rows.some(x=>String(x[0])===selected))el.value=selected;
    el.disabled=!rows.length;
  }
  function renderCredit(){
    const report=Core.creditReport(state),elig=report.eligibility;
    const activeLoans=report.loans.filter(l=>l.status!=='PAID');
    const statusNames={OPEN:'Em dia',DUE:'Parcela vencendo',DELINQUENT:'Em atraso',RESTRUCTURED:'Renegociado',PAID:'Quitado'};
    const detail=[
      ['Elegibilidade',elig.eligible?'Crédito disponível':elig.reason],
      ['Vendas dos últimos 30 dias',Core.money(elig.salesLast30Cents||0)],
      ['Limite total permitido',Core.money(elig.creditLimitCents||0)],
      ['Limite adicional disponível',Core.money(elig.availableCents||0)],
      ['Principal dos empréstimos',Core.money(report.principalOutstanding)],
      ['Juros reconhecidos a pagar',Core.money(report.interestOutstanding)],
      ['Multas de crédito a pagar',Core.money(report.feesOutstanding)],
      ['Multas de fornecedores a pagar',Core.money(report.contractFeesOutstanding)]
    ];
    $('credit-summary').innerHTML=detail.map(item=>'<dt>'+escape(item[0])+'</dt><dd>'+escape(item[1])+'</dd>').join('');
    $('credit-contract-submit').disabled=!elig.eligible;
    $('credit-loan-list').innerHTML=report.loans.map(l=>{
      const due=l.duePrincipalCents+l.interestDueCents+l.feesDueCents;
      return '<div class="event-item"><div><strong>'+escape(l.id)+' · '+escape(statusNames[l.status]||l.status)+
        '</strong><p>Principal: '+escape(Core.money(l.remainingCents))+' · Encargos reconhecidos: '+
        escape(Core.money(l.interestDueCents+l.feesDueCents))+' · Parcela exigível: '+escape(Core.money(due))+
        '</p><small>Próximo vencimento fictício: '+escape(l.nextDueDate)+' · '+l.termMonths+
        ' períodos · renegociações '+l.renegotiations+'/2</small></div></div>';
    }).join('')||'<p class="muted">Nenhum financiamento contratado.</p>';
    setCreditOptions('credit-pay-id',activeLoans.map(l=>[l.id,l.id+' · '+Core.money(l.remainingCents+l.interestDueCents+l.feesDueCents)]));
    setCreditOptions('credit-renegotiate-id',activeLoans.filter(l=>l.status==='DELINQUENT').map(l=>[l.id,l.id+' · '+Core.money(l.remainingCents)]));
    $('credit-payment-form').querySelector('button').disabled=!activeLoans.length;
    $('credit-renegotiate-form').querySelector('button').disabled=!activeLoans.some(l=>l.status==='DELINQUENT');
    if(activeLoans.length&&!$('credit-pay-amount').value){
      const loan=activeLoans.find(l=>l.id===$('credit-pay-id').value)||activeLoans[0];
      $('credit-pay-amount').value=((loan.duePrincipalCents+loan.interestDueCents+loan.feesDueCents||Math.min(loan.remainingCents,50000))/100).toFixed(2);
    }
    const units=Core.businesses(state);
    setCreditOptions('supplier-contract-unit',units.map(u=>[u.id,u.id+' · '+Core.cityById(u.cityId).name]));
    const selected=units.find(u=>u.id===$('supplier-contract-unit').value)||units[0];
    setCreditOptions('supplier-contract-product',(selected?.products||[]).map(p=>[p.id,p.name]));
    $('supplier-contract-form').querySelector('button').disabled=!selected;
    $('supplier-contract-list').innerHTML=report.contracts.map(c=>{
      const pending=(c.cycles-c.processed)*c.quantity*c.unitCostCents;
      const status=c.status==='ACTIVE'?'Ativo':c.status==='COMPLETED'?'Concluído':'Rescindido';
      return '<div class="event-item"><div><strong>'+escape(c.id+' · '+status)+
        '</strong><p>'+escape(c.productName)+' · '+c.quantity+' un. por pedido · custo '+escape(Core.money(c.unitCostCents))+
        '/un. · '+c.fulfilled+'/'+c.cycles+' pedidos efetivados · '+c.missed+
        ' falha(s) · compromisso futuro '+escape(Core.money(pending))+'</p><small>'+
        'Próxima data '+escape(c.status==='ACTIVE'?c.nextOrderDate:'—')+
        ' · multa em aberto '+escape(Core.money(c.penaltyDueCents))+'</small><div class="filter-action-row">'+
        (c.status==='ACTIVE'?'<button type="button" class="btn btn-outline" data-credit-cancel="'+escape(c.id)+'">Rescindir</button>':'')+
        (c.penaltyDueCents>0?'<button type="button" class="btn btn-outline" data-credit-fee="'+escape(c.id)+'">Quitar multa</button>':'')+
        '</div></div></div>';
    }).join('')||'<p class="muted">Nenhum contrato de fornecimento.</p>';
    const horizon=Number($('credit-calendar-horizon').value)||90;
    const cal=Core.financialCommitmentsReport(state,horizon);
    $('credit-calendar-summary').innerHTML=[
      ['Caixa realizado do grupo',cal.cash],
      ['Passivos já reconhecidos no balanço',cal.recognizedLiabilities],
      ['Compras futuras contratadas não contabilizadas',cal.expectedSupplierCents],
      ['Parcelas futuras estimadas (principal e juros)',cal.expectedLoanCents],
      ['Juros futuros ainda não reconhecidos',cal.expectedUnrecognizedLoanInterestCents],
      ['Despesas operacionais fixas hipotéticas',cal.fixedOperatingScenarioCents],
      ['Caixa sob estresse sem vendas (não disponível)',cal.stressCashNoSales]
    ].map(row=>'<dt>'+escape(row[0])+'</dt><dd>'+escape(Core.money(row[1]))+'</dd>').join('');
    const kindNames={LOAN_DUE:'Parcela/encargos exigíveis',LOAN_SCHEDULE:'Financiamento futuro',
      SUPPLIER_COMMITMENT:'Compra contratada',RECOGNIZED_PAYABLES:'Outros passivos já lançados',
      PAYROLL_KNOWN:'Folhas já contabilizadas no passivo'};
    $('credit-calendar-rows').innerHTML=cal.events.slice(0,25).map(ev=>
      '<tr><td>'+escape(ev.date)+'</td><td>'+escape((kindNames[ev.kind]||ev.kind)+' · '+ev.id)+
      '</td><td>'+escape(Core.money(ev.amountCents))+'</td><td>'+escape(ev.certainty)+
      '</td></tr>').join('')||'<tr><td colspan="4">Nenhum compromisso no horizonte escolhido.</td></tr>';
  }

  /* CDN_LOGISTICS_VIEWS */
  /* CDN_FINANCE_VIEWS */
  function resetTimer(){if(timer){clearInterval(timer);timer=null;}setText('pause-btn','▶ Jogar');}
  async function commit(type,payload={}){
    if(startupBlocked){notify('Carregamento do save ainda não confirmado; ação recusada.',true);return false;}
    if(commitInFlight){notify('Existe outra gravação em andamento. Aguarde a confirmação antes de repetir.',true);return false;}
    commitInFlight=true;
    document.body.dataset.storageBusy='true';
    try{
      const result=Core.dispatch(state,{type,id:nextId(),payload});
      if(!result.ok){notify(result.error,true);return false;}
      if(result.status==='APPLIED'){
        if(!await persistDurable(result.state))return false;
        if(type==='CARREIRA.CRIAR'){resetTimer();financeQuery=null;financeScope='all';statementView='summary';}
        restockDraft=null;state=result.state;
        const chosen=business();
        if((type==='EMPRESA.ABRIR'||type==='EMPRESA.ATIVAR')&&chosen){
          viewCityId=chosen.cityId;selectedLot=chosen.lot;inspectorOpen=false;
        }else viewCityId=viewCityId??state.player.cityId;
        render();
      }
      notify(result.message);
      return true;
    }finally{commitInFlight=false;document.body.dataset.storageBusy='false';}
  }
  // Rotas anteriores de Finanças e Fiscal permanecem compatíveis.
  function goto(name,requestedSection=null){
    const aliases={financas:['administrativo','financas'],fiscal:['administrativo','fiscal'],contabilidade:['administrativo','contabilidade']};
    const [root,section]=aliases[name]||[name,requestedSection];
    if(!['cidade','empresa','mercado','administrativo','sistema'].includes(root))return;
    if(section&&Object.prototype.hasOwnProperty.call(activeSection,root)&&document.querySelector('[data-section-pane="'+root+':'+section+'"]'))activeSection[root]=section;
    if(root==='administrativo'&&activeSection.administrativo==='contabilidade'&&
       (statementView==='summary'||statementView==='cash'))statementView='dre';
    const sharedFilters=document.querySelector('#admin-shared-filters');
    if(sharedFilters)sharedFilters.hidden=!(root==='administrativo'&&['financas','contabilidade'].includes(activeSection.administrativo));
    // City-first é a única navegação; toda área não-cidade vira janela sobre o mapa.
    if(state&&root!=='cidade'&&immersiveOpen!==root){v31OpenPanel(root,section);return;}
    tab=root;
    if(root==='cidade')immersiveOpen=null;
    document.body.classList.toggle('v221-city-mode',!!state?.player?.cityId&&(root==='cidade'||!!immersiveOpen));
    document.body.classList.toggle('v31-overlay-open',!!immersiveOpen);
    document.querySelectorAll('.view[data-view]').forEach(el=>{const chosen=el.dataset.view===root||(!!immersiveOpen&&el.dataset.view==='cidade');el.hidden=!chosen;el.classList.toggle('active',chosen);});
    document.querySelectorAll('.nav-primary [data-tab]').forEach(el=>{const chosen=el.dataset.tab===root;el.classList.toggle('active',chosen);if(chosen)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    document.querySelectorAll('[data-section-pane]').forEach(el=>{const [area,sub]=el.dataset.sectionPane.split(':');el.hidden=!(area===root&&activeSection[area]===sub);});
    document.querySelectorAll('[data-section-tab]').forEach(el=>{const [area,sub]=el.dataset.sectionTab.split(':');const chosen=activeSection[area]===sub;el.classList.toggle('active',chosen);el.setAttribute('aria-selected',String(chosen));el.tabIndex=chosen?0:-1;});
    const labels={cidade:['CENTRAL DE OPERAÇÕES','A sua cidade, as suas decisões.','Explore lotes comerciais e acompanhe os acontecimentos.'],empresa:['GESTÃO EMPRESARIAL','Sua rede em um só lugar.','Dashboard, estabelecimentos e análises da carreira.'],mercado:['CENTRAL OPERACIONAL','Compre, abasteça e venda.','Compras, estoque, vendas e ferramentas comerciais.'],administrativo:['GESTÃO ADMINISTRATIVA','Os departamentos da sua rede.','Finanças, RH/DP, Contabilidade, Fiscal e Paralegal.'],sistema:['PERSISTÊNCIA E QA','Seu progresso, sua segurança.','Faça backups e confira o estado da simulação.']};
    const info=labels[root];setText('page-kicker',info[0]);setText('page-title-text',info[1]);setText('page-subtitle',info[2]);
    if(state)render();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function cityOptions(){
    const items=Core.CITIES.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    for(const selectId of ['start-city','explore-city','v221-city-selector']){
      $(selectId).innerHTML='';
      const group=document.createDocumentFragment();
      for(const city of items){const opt=document.createElement('option');opt.value=city.id;opt.textContent=`${city.name} · ${city.uf}${city.capital?' (capital)':''}`;group.appendChild(opt);}
      $(selectId).appendChild(group);
    }
    const tiangua=Core.CITIES.find(c=>c.name==='Tianguá');$('start-city').value=tiangua.id;
  }
  function renderRegional(city){
    const p=Core.regionalProfile(city.id);
    if(!p)return;
    setText('regional-population',new Intl.NumberFormat('pt-BR').format(p.population));
    setText('regional-code',p.ibgeCode);
    setText('regional-date','01/07/'+p.populationYear);
    setText('regional-urban-size',p.tierLabel);
    setText('regional-demand-factor',`${p.demandFactor}%`);
    setText('regional-competition-factor',`${p.competitionFactor}%`);
    setText('regional-gdp',`R$ ${new Intl.NumberFormat('pt-BR').format(p.gdp2023Thousand * 1000)} · IBGE 2023`);
    setText('regional-regic','Classificação municipal não integrada · REGIC 2018');
    setText('regional-gdp-effect',`${p.gdpAdjustment>0?'+':''}${p.gdpAdjustment} p.p. (hipótese)`);
    setText('regional-model-status','População (2026) e PIB total (2023) oficiais. Ajuste comercial é uma regra fictícia limitada; não equivale a PIB per capita, renda das famílias ou fluxo intermunicipal.');
    $('regional-gdp-source').href=p.gdpSource;
    const comparisonCity=Core.cityById($('regional-compare-city').value);
    if(comparisonCity){
      const [a,b]=Core.regionalComparison([city.id,comparisonCity.id]);
      setText('regional-compare-result',`${a.name}: índice ${a.simulatedDemandFactor}% · ${b.name}: índice ${b.simulatedDemandFactor}%. Comparação de fatores simulados, não previsão de faturamento.`);
    }
    $('regional-source').href=p.source;
    $('map-canvas').dataset.urbanSize=p.tier;
  }
  function eventsHTML(events){if(!events.length)return '<p class="muted">Nenhum evento registrado ainda.</p>';return events.map(e=>`<div class="event-item"><i class="event-dot"></i><div><p>${escape(e.text)}</p><small>${escape(e.date)} · ${escape(e.type)}</small></div></div>`).join('');}
  /* CDN_V31_IMMERSIVE */
  function render(){
    const started=!!state?.player?.cityId;
    document.body.classList.toggle('v221-city-mode',started);
    $('onboarding').hidden=started;$('game-shell').hidden=!started;
    if(!started)return;
    const b=business(),units=Core.businesses(state),info=Core.overview(state),ownCity=Core.cityById(b?.cityId||state.player.cityId);
    const visibleCity=Core.cityById(viewCityId)||ownCity;
    viewCityId=visibleCity.id;
    document.body.classList.toggle('v221-tiangua-scene',visibleCity.id==='CE-TIANGUA');
    $('v221-city-selector').value=visibleCity.id;
    setText('top-city',`${visibleCity.name} · ${visibleCity.uf}`);
    setText('v221-map-city-title',`${visibleCity.name.toUpperCase()} · ${visibleCity.uf}`);
    $('explore-city').value=visibleCity.id;
    setText('date-label',BRDate(state.calendar.date));
    setText('v221-date-label',BRDate(state.calendar.date));
    setText('kpi-cash',Core.money(info.cash));setText('kpi-revenue',Core.money(info.revenue));setText('kpi-profit',Core.money(info.profit));setText('kpi-stock',info.stock);
    setText('v221-hud-cash',Core.money(info.cash));setText('v221-hud-profit',Core.money(info.profit));setText('v221-hud-count',`${units.length}/5`);
    setText('kpi-stock-label',b?`${b.products.length} produtos cadastrados · unidades totais`:'Sem estoque');
    $('other-city-warning').hidden=units.some(x=>x.cityId===visibleCity.id);
    setText('other-city-warning','Cidade sem unidade da sua rede. Você pode inaugurar uma unidade num lote disponível.');
    setText('map-title',`Distrito comercial de ${visibleCity.name}`);setText('map-uf',visibleCity.uf);
    const cityUnits=units.filter(x=>x.cityId===visibleCity.id);
    setText('v221-legend-free',`${18-cityUnits.length} disponíveis`);
    setText('v221-legend-owned',`${cityUnits.length} ${cityUnits.length===1?'empresa':'empresas'}`);
    setText('v221-legend-selection',inspectorOpen?`Lote ${String(selectedLot).padStart(2,'0')} selecionado`:'Nenhuma seleção');
    document.body.classList.toggle('v221-map-zoomed',mapZoomed&&visibleCity.id==='CE-TIANGUA');
    const zoomButton=$('v221-map-zoom');
    zoomButton.hidden=visibleCity.id!=='CE-TIANGUA';
    zoomButton.setAttribute('aria-pressed',String(mapZoomed));
    zoomButton.textContent=mapZoomed?'⊖ Mostrar mapa inteiro':'⊕ Ampliar mapa';
    $('map-canvas').innerHTML=visibleCity.id==='CE-TIANGUA'
      ? CidadeTianguaCena.svgMap(visibleCity,units.filter(x=>x.cityId===visibleCity.id),inspectorOpen?selectedLot:null)
      : CidadeVisual.svgMap(visibleCity,units.filter(x=>x.cityId===visibleCity.id).map(x=>x.lot),inspectorOpen?selectedLot:null);
    $('v221-inspector').hidden=!inspectorOpen;
    $('map-lot-picker').value=String(selectedLot);
    renderRegional(visibleCity);
    setText('selected-lot',`Lote ${String(selectedLot).padStart(2,'0')} de 18`);updateOpenPreview();
    const lotOwner=units.find(x=>x.cityId===visibleCity.id&&x.lot===selectedLot);
    $('map-open-company').disabled=!lotOwner&&units.length>=5;
    setText('map-open-company',lotOwner?'Gerenciar este estabelecimento':'Abrir unidade neste lote');
    setText('map-lot-status',lotOwner?`Sua unidade ${lotOwner.id} está neste lote.`:(units.length>=5?'Limite de 5 estabelecimentos atingido.':'Terreno disponível para uma nova unidade.'));
    setText('city-events','');$('city-events').innerHTML=eventsHTML(state.audit.events.slice(-6).reverse());
    $('company-empty').hidden=units.length>=5;$('company-active').hidden=!b;
    renderGroup();
    renderCompanyPanels();
    if(tab==='empresa'&&activeSection.empresa==='dashboard')renderProgression();
    setText('company-status',b?'EM OPERAÇÃO':'NÃO INAUGURADA');
    $('buy-form').querySelector('button').disabled=!b;$('price-form').querySelector('button').disabled=!b;
    if(b){const s=Core.SECTORS[b.sector];setText('company-glyph',s.glyph);setText('company-title',`${state.player.companyName} · ${b.id} · ${s.name}`);setText('company-product',`${b.products.length} produto(s) cadastrados`);setText('company-location',`${Core.cityById(b.cityId).name} / ${Core.cityById(b.cityId).uf} · lote ${String(b.lot).padStart(2,'0')}`);setText('company-sold',b.totalSold);setText('company-price',Core.money(b.unitPrice));setText('company-payable',Core.money(info.payable));
      setText('market-product','Escolha o produto e o fornecedor. Custos unitários são simulados.');
      setText('your-current-price',Core.money(b.unitPrice));
      setText('competitor-price',Core.money(Math.round(Core.competitorReference(state,{referenceCents:s.recommended},ownCity))));
      if(document.activeElement!==$('price-value'))$('price-value').value=(b.unitPrice/100).toFixed(2);
      updateBuyPreview();
    }else{setText('market-product','Abra uma empresa antes de comprar mercadorias.');setText('your-current-price','—');setText('competitor-price','—');setText('buy-total','—');}
    renderCommerce();renderPriceHistory();renderRivals();
    if(tab==='mercado'&&activeSection.mercado==='compras')renderBalancePlan();
    if(tab==='administrativo'&&activeSection.administrativo==='financas')renderCredit();
    if(tab==='administrativo'&&activeSection.administrativo==='logistica')renderLogistics();
    if((tab==='administrativo'&&['financas','contabilidade'].includes(activeSection.administrativo))||financeQuery)renderFinances();
    renderFiscal();
    renderFiscalOperations();
    renderParalegal();
    renderRH();
    renderSafetyBackup();
    if(tab==='sistema'){
      renderQuality();
      // Diagnóstico completo calcula hash de todo o save e deve ser explícito.
      // A navegação exibe somente contadores baratos; checksum FNV1A32 fica sob demanda.
      $('diagnostic-details').innerHTML=[['Versão do jogo',Core.VERSION],['Schema',String(state.schemaVersion)],['Revisão',String(state.revision)],['Unidade ativa',b?.id||'Nenhuma'],['Cidade ativa',ownCity.name],['Estabelecimentos',String(units.length)],['Cidades / UFs',`${Core.CITIES.length} / ${new Set(Core.CITIES.map(x=>x.uf)).size}`],['Dias concluídos',String(state.calendar.tick)],['Eventos confirmados',String(state.audit.events.length)],['Checksum local','Sob demanda: execute o diagnóstico'],['Cobertura fiscal',state.fiscal.coverageStatus]].map(x=>`<dt>${escape(x[0])}</dt><dd>${escape(x[1])}</dd>`).join('');
    }
    setText('turn-message',!b?'Abra sua primeira empresa.':b.stockUnits===0?'Seu estoque está vazio. Reabasteça.':`Sua empresa está operando há ${state.calendar.tick} dia(s).`);
    setText('turn-subtext',!b?'Clique em um lote para iniciar.':`${b.products.length} produtos · Estoque total ${b.stockUnits} un. · próximo dia ${BRDate(state.calendar.date)}.`);
    setText('autosave-label',autosaveStatus);
    setText('footer-state',autosaveStatus.startsWith('Cópia')?'Cópia local verificada · backup JSON recomendado':autosaveStatus.startsWith('Salvamento local indisponível')?'Salvamento local sem garantia':'Backup JSON recomendado');
    v31Render();
  }
  function updateBuyPreview(){
    if(!business())return;
    const qty=Number($('buy-quantity').value),p=chooseProduct('buy-product');
    const supplier=Core.SUPPLIERS.find(s=>s.id===$('buy-supplier').value);
    const unit=p&&supplier?Math.round(p.costCents*supplier.priceFactor/100):0;
    setText('buy-total',p&&supplier&&Number.isInteger(qty)&&qty>0?`Encomenda: ${Core.money(unit)} por unidade · total pago hoje: ${Core.money(qty*unit)} · entrega em ${supplier.leadDays} dia(s) · caixa: ${Core.money(Core.overview(state).cash)}`:'Informe quantidade e fornecedor.');
  }
  function exportFile(compact=false){
    if(!state){notify('Crie uma carreira antes de exportar.',true);return;}
    try{
      const data=compact?Core.exportSaveCompact(state):Core.exportSave(state),blob=new Blob([data],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`cidade-dos-negocios-${state.player.cityId}-${state.calendar.date}${compact?'-compacto-v29':''}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      notify(compact?'Download compacto solicitado; só é compatível com V2.9+. Confira o arquivo e mantenha também um backup tradicional.':'Download tradicional solicitado. Confira se o arquivo JSON foi salvo no computador.');
    }catch(e){notify(e.message,true);}
  }
  async function importFile(file){
    if(!file)return;
    if(file.size>25_000_000){notify('Save excede 25 MB.',true);return;}
    if(state?.player.cityId&&!confirm('Substituir a carreira atual pelo save importado? Recomendamos exportar antes.'))return;
    if(startupBlocked||commitInFlight){notify('Outra operação está em andamento. Importação não iniciada.',true);return;}
    commitInFlight=true;
    document.body.dataset.storageBusy='true';
    try{
      const incoming=Core.importSave(await file.text());
      if(!await backupCurrent())return;
      if(!await persistDurable(incoming.state)){
        notify('Importação não concluída: o novo save não pôde ser armazenado. A carreira anterior foi preservada.',true);
        return;
      }
      resetTimer();state=incoming.state;
      restockDraft=null;viewCityId=business()?.cityId||state.player.cityId;selectedLot=1;financeQuery=null;financeScope='all';statementView='summary';
      render();notify(incoming.message);
    }
    catch(e){notify(`Importação rejeitada: ${e.message}. A carreira anterior foi preservada.`,true);}
    finally{commitInFlight=false;document.body.dataset.storageBusy='false';}
  }
  function launchAuto(){
    if(timer){resetTimer();return;}
    if(!state)return;
    timer=setInterval(async()=>{if(commitInFlight)return;if(!await commit('TEMPO.AVANCAR_DIA'))resetTimer();},Math.round(1900/speed));setText('pause-btn','Ⅱ Pausar');
  }
  function bind(){
    bindLogistics();
    bindBalancePlan();
    v31Bind();
    // Somente estado de apresentação; não grava em save nem executa comandos econômicos.
    const hudToggle=$('stats-more-toggle');
    hudToggle.addEventListener('click',()=>{
      const expanded=hudToggle.getAttribute('aria-expanded')!=='true';
      $('stats-bar').classList.toggle('is-expanded',expanded);
      hudToggle.setAttribute('aria-expanded',String(expanded));
      hudToggle.firstChild.textContent=expanded?'Mostrar apenas os principais ':'Mostrar resultado e estoque ';
    });
    $('career-form').addEventListener('submit',async e=>{e.preventDefault();const name=$('player-name').value,companyName=$('company-name').value,cityId=$('start-city').value;if(await commit('CARREIRA.CRIAR',{name,companyName,cityId,seed:(Date.now()>>>0)}))await commit('MUNDO.CONCORRENCIA_ATIVAR');});
    $('rival-enable').addEventListener('click',()=>commit('MUNDO.CONCORRENCIA_ATIVAR'));

    // Controles V2.7: nunca alteram o estado diretamente.
    $('credit-contract-form').addEventListener('submit',e=>{
      e.preventDefault();
      const principalCents=Math.round(Number($('credit-principal').value)*100),
        termMonths=Number($('credit-term').value);
      if(confirm('Contratar crédito FICTÍCIO de '+Core.money(principalCents)+'? O principal entra no caixa e gera dívida; haverá juros de 1,8% a cada 30 dias.'))
        commit('CREDITO.CONTRATAR',{principalCents,termMonths});
    });
    $('credit-pay-id').addEventListener('change',()=>{
      const l=Core.creditReport(state).loans.find(x=>x.id===$('credit-pay-id').value);
      $('credit-pay-amount').value=l?((l.duePrincipalCents+l.interestDueCents+l.feesDueCents||Math.min(l.remainingCents,50000))/100).toFixed(2):'';
    });
    $('credit-payment-form').addEventListener('submit',async e=>{
      e.preventDefault();
      const loanId=$('credit-pay-id').value,amountCents=Math.round(Number($('credit-pay-amount').value)*100);
      if(confirm('Pagar '+Core.money(amountCents)+' com o caixa do grupo? A baixa será aplicada primeiro às multas, depois aos juros e ao principal.'))
        if(await commit('CREDITO.PAGAR',{loanId,amountCents}))$('credit-pay-amount').value='';
    });
    $('credit-renegotiate-form').addEventListener('submit',e=>{
      e.preventDefault();
      const loanId=$('credit-renegotiate-id').value,termMonths=Number($('credit-renegotiate-term').value);
      if(confirm('Renegociar '+loanId+' em '+termMonths+' novos períodos fictícios? Juros e multas existentes NÃO são perdoados.'))
        commit('CREDITO.RENEGOCIAR',{loanId,termMonths});
    });
    $('supplier-contract-unit').addEventListener('change',()=>{
      const unit=Core.businessById(state,$('supplier-contract-unit').value);
      setCreditOptions('supplier-contract-product',(unit?.products||[]).map(p=>[p.id,p.name]));
    });
    $('supplier-contract-form').addEventListener('submit',e=>{
      e.preventDefault();
      const payload={businessId:$('supplier-contract-unit').value,productId:$('supplier-contract-product').value,
        supplierId:$('supplier-contract-supplier').value,quantity:Number($('supplier-contract-quantity').value),
        periodDays:Number($('supplier-contract-period').value),cycles:Number($('supplier-contract-cycles').value)};
      if(confirm('Assinar contrato FICTÍCIO com '+payload.cycles+' pedidos automáticos? Eles descontam caixa na data do pedido. Falta de caixa/estoque gera multa simulada de 2%, e rescisão antecipada cobra 5% do compromisso restante.'))
        commit('CONTRATO.FORNECEDOR.ASSINAR',payload);
    });
    $('supplier-contract-list').addEventListener('click',e=>{
      const cancel=e.target.closest('[data-credit-cancel]'),fee=e.target.closest('[data-credit-fee]');
      if(cancel){
        const contractId=cancel.dataset.creditCancel;
        const c=Core.creditReport(state).contracts.find(x=>x.id===contractId);
        if(c&&confirm('Rescindir '+contractId+'? Serão cancelados pedidos futuros e lançada multa de 5% sobre os compromissos restantes.'))
          commit('CONTRATO.FORNECEDOR.RESCINDIR',{contractId});
      }else if(fee){
        const contractId=fee.dataset.creditFee;
        const c=Core.creditReport(state).contracts.find(x=>x.id===contractId);
        if(c&&confirm('Quitar '+Core.money(c.penaltyDueCents)+' de multa fictícia do contrato '+contractId+'?'))
          commit('CONTRATO.FORNECEDOR.PAGAR_PENALIDADE',{contractId,amountCents:c.penaltyDueCents});
      }
    });
    $('credit-calendar-horizon').addEventListener('change',renderCredit);

    $('journey-dilemmas').addEventListener('click',e=>{const t=e.target.closest('button[data-dilemma]');if(t&&!t.disabled)commit('DILEMA.ESCOLHER',{dilemmaId:t.dataset.dilemma,choice:t.dataset.choice});});
    for(const button of document.querySelectorAll('[data-tab]'))button.addEventListener('click',()=>goto(button.dataset.tab));
    for(const button of document.querySelectorAll('[data-go]'))button.addEventListener('click',()=>goto(button.dataset.go));
    for(const button of document.querySelectorAll('[data-section-tab]')){
      button.addEventListener('click',()=>goto(...button.dataset.sectionTab.split(':')));
      button.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
        const list=[...button.parentElement.querySelectorAll('[data-section-tab]')],ix=list.indexOf(button),step=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
        const next=e.key==='Home'?list[0]:e.key==='End'?list.at(-1):list[(ix+step+list.length)%list.length];
        if(next){e.preventDefault();next.focus();next.click();}
      });
    }
    for(const button of document.querySelectorAll('[data-section-go]'))button.addEventListener('click',()=>goto(...button.dataset.sectionGo.split(':')));
    $('unit-switch').addEventListener('change',e=>{if(e.target.value)commit('EMPRESA.ATIVAR',{businessId:e.target.value});});
    $('finance-scope').addEventListener('change',e=>{financeScope=e.target.value;renderFinances();});

    $('rh-hire-form').addEventListener('submit',async e=>{
      e.preventDefault();
      const name=$('rh-hire-name').value.trim(),role=$('rh-hire-role').value,businessId=$('rh-hire-unit').value;
      const def=Core.RH_ROLES[role];if(!def)return;
      if(confirm('Contratar '+name+' como '+def.label+' na unidade '+businessId+'? Salário mensal FICTÍCIO '+Core.money(def.salaryCents)+'.'))
        if(await commit('RH.CONTRATAR',{name,role,businessId}))$('rh-hire-name').value='';
    });
    $('rh-unit-list').addEventListener('click',e=>{
      const dismissal=e.target.closest('[data-rh-dismiss]');
      if(dismissal&&confirm('Desligar personagem? A folha do mês ainda será apurada proporcionalmente.')){
        commit('RH.DESLIGAR',{employeeId:dismissal.dataset.rhDismiss});return;
      }
      const pay=e.target.closest('[data-rh-pay]');
      if(pay&&confirm('Pagar folha fictícia '+pay.dataset.rhPay+'? Valor descontado do caixa compartilhado.'))
        commit('RH.PAGAR_FOLHA',{businessId:pay.dataset.rhUnit,period:pay.dataset.rhPay});
    });
    $('paralegal-unit-list').addEventListener('click',e=>{
      const btn=e.target.closest('[data-paralegal-action]');if(!btn||btn.disabled)return;
      const service=btn.dataset.paralegalAction,businessId=btn.dataset.paralegalUnit;
      const definition=Core.PARALEGAL_SERVICES[service];if(!definition)return;
      if(confirm(`Solicitar ${definition.label} para ${businessId}? Taxa FICTÍCIA de ${Core.money(definition.feeCents)} será debitada do caixa do grupo. Não é documento legal.`))
        commit('PARALEGAL.PROTOCOLAR',{businessId,service});
    });

    $('fiscal-op-unit-list').addEventListener('click',e=>{
      const activation=e.target.closest('[data-fiscal-op-activate]');
      if(activation){
        if(confirm('Ativar checklist mensal FICTÍCIO da unidade '+activation.dataset.fiscalOpActivate+
          '? Os prazos são somente do jogo, sem tributos ou exigências reais.'))
          commit('FISCAL_OP.ATIVAR',{businessId:activation.dataset.fiscalOpActivate,acceptSimulation:true});
        return;
      }
      const task=e.target.closest('[data-fiscal-op-task]');
      if(task){
        if(confirm('Confirmar revisão interna fictícia da competência '+task.dataset.fiscalOpPeriod+'?'))
          commit('FISCAL_OP.CONCLUIR_TAREFA',{businessId:task.dataset.fiscalOpUnit,
            period:task.dataset.fiscalOpPeriod,task:task.dataset.fiscalOpTask});
        return;
      }
      const closing=e.target.closest('[data-fiscal-op-close]');
      if(closing&&!closing.disabled){
        if(confirm('Fechar checklist da competência '+closing.dataset.fiscalOpClose+
          '? Esta ação é apenas administrativa e NÃO apura nem paga tributos.'))
          commit('FISCAL_OP.FECHAR',{businessId:closing.dataset.fiscalOpUnit,period:closing.dataset.fiscalOpClose});
      }
    });
    $('fiscal-regime-apply').addEventListener('click',()=>{
      const regime=$('fiscal-regime-select').value,simplesIvaMode=$('fiscal-iva-mode').value;
      if(confirm('Confirmar regime '+regime+' do jogo? A mudança será aplicada agora ou agendada para janeiro conforme o calendário. Cálculos fictícios, sem opção legal perante o Fisco.')){
        commit('FISCAL.ALTERAR_REGIME',{regime,simplesIvaMode});
      }
    });
    $('fiscal-assessments').addEventListener('click',e=>{
      const full=e.target.closest('[data-tax-pay]'),partial=e.target.closest('[data-tax-partial]');
      const btn=full||partial;if(!btn)return;
      const period=full?full.dataset.taxPay:partial.dataset.taxPartial;
      const a=Core.taxReport(state).assessments.find(x=>x.period===period);
      if(!a)return;
      const pending=a.amount-a.paid;let amountCents=pending;
      if(partial){
        const text=prompt('Quanto deseja pagar da guia fictícia '+period+' (em R$, exemplo 120,50)?',
          (pending/100).toFixed(2).replace('.',','));
        if(text===null)return;
        const normalized=text.trim().replace(/[.]/g,'').replace(',','.');
        const money=Number(normalized);
        if(!Number.isFinite(money)||money<=0||!Number.isSafeInteger(Math.round(money*100))||Math.round(money*100)>pending){
          notify('Valor de pagamento parcial inválido.');return;
        }
        amountCents=Math.round(money*100);
      }
      if(confirm('Pagar '+Core.money(amountCents)+' de '+period+'? Isto reduz o caixa do jogo e baixa a obrigação fictícia.'))
        commit('FISCAL.PAGAR_COMPETENCIA',{period,amountCents});
    });

    $('unit-rows').addEventListener('click',e=>{const btn=e.target.closest('[data-unit-activate]');if(btn)commit('EMPRESA.ATIVAR',{businessId:btn.dataset.unitActivate});});
    for(const id of ['company-unit-city','company-unit-sector','company-analysis-scope','company-analysis-period','company-analysis-from','company-analysis-to','company-compare-dimension','company-compare-city','company-compare-sector','company-compare-period','company-compare-from','company-compare-to','company-compare-sort']){
      $(id).addEventListener('change',()=>renderCompanyPanels());
    }
    $('company-unit-search').addEventListener('input',companyRenderUnitList);
    $('explore-city').addEventListener('change',e=>{viewCityId=e.target.value;inspectorOpen=false;render();updateOpenPreview();});
    $('v221-city-selector').addEventListener('change',e=>{viewCityId=e.target.value;inspectorOpen=false;$('v221-city-pick').hidden=true;render();});
    $('map-canvas').addEventListener('click',e=>{const target=e.target.closest('[data-lot]');if(target){
      selectedLot=Number(target.dataset.lot);inspectorOpen=true;render();updateOpenPreview();
      const owner=Core.businesses(state).find(x=>x.cityId===viewCityId&&x.lot===selectedLot);
      // Lote edificado abre sua empresa na janela; lote livre exibe as opcoes de abertura.
      if(owner){
        if(business()?.id!==owner.id)commit('EMPRESA.ATIVAR',{businessId:owner.id}).then(ok=>{if(ok)v31OpenPanel('empresa','minhas-empresas');});
        else v31OpenPanel('empresa','minhas-empresas');
      }
    }});
    $('map-canvas').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const target=e.target.closest('[data-lot]');if(target){e.preventDefault();selectedLot=Number(target.dataset.lot);inspectorOpen=true;render();$('map-canvas').querySelector(`[data-lot="${selectedLot}"]`)?.focus();}}});
  $('map-lot-picker').addEventListener('change',e=>{const next=Number(e.target.value);if(Number.isInteger(next)&&next>=1&&next<=18){selectedLot=next;inspectorOpen=true;render();$('map-lot-picker').focus();}});
    $('v221-map-zoom').addEventListener('click',()=>{
      mapZoomed=!mapZoomed;
      render();
      // No modo ampliado, a faixa do mapa pode ser deslocada horizontalmente.
      if(mapZoomed){const el=$('map-canvas');el.scrollLeft=Math.max(0,(el.scrollWidth-el.clientWidth)/2);}
    });
    $('v221-inspector-close').addEventListener('click',()=>{inspectorOpen=false;render();$('map-canvas').focus();});
    $('v221-hud-units').addEventListener('click',()=>goto('empresa'));
    $('v221-config-open').addEventListener('click',()=>goto('sistema'));
    $('v221-help-open').addEventListener('click',()=>{$('v221-help-panel').hidden=!$('v221-help-panel').hidden;});
    $('v221-help-close').addEventListener('click',()=>{$('v221-help-panel').hidden=true;});
    $('v221-city-pick-close').addEventListener('click',()=>{$('v221-city-pick').hidden=true;});
    $('v221-event-open').addEventListener('click',()=>{$('v221-activity').open=!$('v221-activity').open;$('v221-observatory').open=false;});
    $('v221-hud-time').addEventListener('click',()=>{const el=$('v221-time-menu');el.hidden=!el.hidden;$('v221-hud-time').setAttribute('aria-expanded',String(!el.hidden));$('v221-time-speed').value=$('speed-select').value;});
    $('v221-time-speed').addEventListener('change',e=>{$('speed-select').value=e.target.value;$('speed-select').dispatchEvent(new Event('change'));});
    for(const button of document.querySelectorAll('[data-v221-time]'))button.addEventListener('click',()=>{
      const t=button.dataset.v221Time;const target=t==='play'?'pause-btn':t==='1'?'next-day':t==='7'?'next-week':'next-month';
      $(target).click();$('v221-time-menu').hidden=true;$('v221-hud-time').setAttribute('aria-expanded','false');
    });
    $('map-open-company').addEventListener('click',async()=>{const owner=Core.businesses(state).find(x=>x.cityId===viewCityId&&x.lot===selectedLot);if(owner&&business()?.id!==owner.id){if(!await commit('EMPRESA.ATIVAR',{businessId:owner.id}))return;}v31OpenPanel('empresa','minhas-empresas',$('map-open-company'));if(!owner)$('sector-select').focus();});
    $('sector-select').addEventListener('change',updateOpenPreview);
    $('open-form').addEventListener('submit',async e=>{e.preventDefault();if(!state)return;if(await commit('EMPRESA.ABRIR',{sector:$('sector-select').value,cityId:viewCityId,lot:selectedLot}))goto('cidade');});
    $('buy-quantity').addEventListener('input',updateBuyPreview);
    $('buy-product').addEventListener('change',updateBuyPreview);
    $('buy-supplier').addEventListener('change',()=>{renderCommerce();updateBuyPreview();});
    $('policy-product').addEventListener('change',()=>{const p=chooseProduct('policy-product');if(p){$('policy-reorder').value=p.reorderPoint;$('policy-target').value=p.targetStock;}});
    $('stock-policy-form').addEventListener('submit',e=>{e.preventDefault();const productId=$('policy-product').value;commit('ESTOQUE.POLITICA_DEFINIR',{productId,reorderPoint:Number($('policy-reorder').value),targetStock:Number($('policy-target').value)});});
    $('price-product').addEventListener('change',()=>{const p=chooseProduct('price-product');if(p)$('price-value').value=(p.priceCents/100).toFixed(2);renderCommerce();});
    $('promo-product').addEventListener('change',renderCommerce);
    $('promo-form').addEventListener('submit',async e=>{e.preventDefault();const productId=$('promo-product').value,percent=Number($('promo-percent').value),days=percent?Number($('promo-days').value):0;if(await commit('PROMO.DEFINIR',{productId,percent,days}))notify(percent?`Campanha de ${percent}% confirmada por ${days} dia(s) de jogo.`:'Campanha encerrada.');});
    $('strategy-horizon').addEventListener('change',e=>{strategyHorizon=Number(e.target.value);renderStrategy();});
    $('product-form').addEventListener('submit',async e=>{e.preventDefault();
      const name=$('new-product-name').value,costCents=Math.round(Number($('new-product-cost').value)*100),priceCents=Math.round(Number($('new-product-price').value)*100);
      if(await commit('PRODUTO.CADASTRAR',{name,costCents,priceCents})){$('product-form').reset();notify('Produto cadastrado. Agora configure estoque mínimo e encomende mercadorias.');}
    });
    for(const b of document.querySelectorAll('[data-buy-preset]'))b.addEventListener('click',()=>{$('buy-quantity').value=b.dataset.buyPreset;updateBuyPreview();$('buy-quantity').focus();});
    for(const button of document.querySelectorAll('[data-statement-view]'))button.addEventListener('click',()=>{statementView=button.dataset.statementView;renderFinances();});
    $('finance-period').addEventListener('change',e=>{ensureFinanceQuery().period=e.target.value;renderFinances();});
    const controls=[['finance-date','asOf'],['finance-day','day'],['finance-month','month'],
      ['finance-quarter','quarter'],['finance-quarter-year','quarterYear'],
      ['finance-semester','semester'],['finance-semester-year','semesterYear'],
      ['finance-year','year'],['finance-range-from','from'],['finance-range-to','to']];
    for(const [id,field] of controls)$(id).addEventListener('change',e=>{
      ensureFinanceQuery()[field]=field.endsWith('Year')||field==='year'?Number(e.target.value):e.target.value;
      renderFinances();
    });
    $('finance-current-date').addEventListener('click',()=>{
      const q=ensureFinanceQuery(),current=lastAvailableDate(),year=Number(current.slice(0,4)),month=Number(current.slice(5,7));
      if(q.period==='all')q.asOf=current;
      else if(q.period==='day')q.day=current;
      else if(q.period==='month')q.month=current.slice(0,7);
      else if(q.period==='quarter'){q.quarter=String(Math.floor((month-1)/3)+1);q.quarterYear=year;}
      else if(q.period==='semester'){q.semester=String(Math.floor((month-1)/6)+1);q.semesterYear=year;}
      else if(q.period==='year')q.year=year;
      else {q.to=current;}
      renderFinances();
    });
    $('regional-compare-city').addEventListener('change',()=>renderRegional(Core.cityById(viewCityId)||Core.CITIES[0]));
    bindRestock();
    $('buy-form').addEventListener('submit',e=>{e.preventDefault();commit('ESTOQUE.COMPRAR',{productId:$('buy-product').value,supplierId:$('buy-supplier').value,quantity:Number($('buy-quantity').value)});});
    $('price-form').addEventListener('submit',async e=>{e.preventDefault();const p=chooseProduct('price-product'),value=$('price-value').value,cents=Math.round(Number(value)*100),before=p?.priceCents;if(await commit('PRECO.DEFINIR',{productId:p?.id,cents})){const after=business().products.find(x=>x.id===p.id).priceCents;const message=`Preço de ${p.name} atualizado: ${Core.money(before)} → ${Core.money(after)}.`;setText('price-change-feedback',message);notify(message);}});
    $('next-day').addEventListener('click',()=>commit('TEMPO.AVANCAR_DIA'));
    $('next-week').addEventListener('click',()=>commit('TEMPO.AVANCAR_LOTE',{days:7}));
    $('next-month').addEventListener('click',()=>commit('TEMPO.AVANCAR_LOTE',{days:30}));
    $('speed-select').addEventListener('change',e=>{speed=Number(e.target.value);if(timer){resetTimer();launchAuto();}});
    $('pause-btn').addEventListener('click',launchAuto);
    $('export-btn').addEventListener('click',()=>exportFile(false));
    $('export-compact-btn').addEventListener('click',()=>exportFile(true));
    $('qa-horizon').addEventListener('change',renderQuality);
    $('qa-save-health-btn').addEventListener('click',()=>{
      try{
        const saved=Core.saveHealthReport(state);
        const fields=[['Backup normal',saved.standardChars.toLocaleString('pt-BR')+' caracteres ('+saved.standardPercent+'%)'],
          ['Backup compacto',saved.compactChars.toLocaleString('pt-BR')+' caracteres ('+saved.compactPercent+'%)'],
          ['Redução sem excluir histórico',saved.savedPercent+'%'],['Limite por arquivo',saved.maxChars.toLocaleString('pt-BR')+' caracteres']];
        $('qa-save-size').innerHTML=fields.map(x=>'<dt>'+escape(x[0])+'</dt><dd>'+escape(x[1])+'</dd>').join('');
        setText('qa-save-warning',saved.standardNearLimit?
          'Atenção: save tradicional acima de 80% do limite! Exporte backup compacto também. O navegador pode ter quota menor que esse limite.':
          'Arquivos verificados em memória, sem excluir eventos. O formato compacto exige V2.9+. Persistência local do navegador não foi garantida.');
      }catch(e){notify('Diagnóstico do backup: '+e.message,true);}
    });
    $('import-btn').addEventListener('click',()=>$('import-file').click());
    $('start-import').addEventListener('click',()=>$('import-file').click());
    $('import-file').addEventListener('change',async e=>{const f=e.target.files?.[0];try{await importFile(f);}finally{e.target.value='';}});
    $('restore-prior-save-btn').addEventListener('click',async()=>{
      if(commitInFlight||startupBlocked)return;
      commitInFlight=true;document.body.dataset.storageBusy='true';
      try{
      let raw;
      try{raw=await CidadeDurableStore.readBackup();}catch(error){notify(error.message,true);return;}
      if(!raw){notify('Não existe cópia anterior neste navegador.',true);return;}
      let incoming;
      try{incoming=Core.importSave(raw);}catch(error){notify('Backup anterior inválido: '+error.message,true);return;}
      if(!confirm('Restaurar carreira anterior? A atual será preservada como cópia de segurança.'))return;
      if(!await backupCurrent())return;
      if(!await persistDurable(incoming.state)){
        // Voltar a cópia recuperável à versão anterior se a restauração falhou.
        try{await CidadeDurableStore.writeBackup(raw);}catch(_){}
        notify('Restauração cancelada: gravação não confirmada. A carreira atual foi preservada.',true);return;
      }
      resetTimer();state=incoming.state;
      restockDraft=null;viewCityId=business()?.cityId||state.player.cityId;selectedLot=1;financeQuery=null;financeScope='all';statementView='summary';
      render();notify('Carreira anterior restaurada. Faça também um backup JSON.');
      }finally{commitInFlight=false;document.body.dataset.storageBusy='false';}
    });
    $('payable-operating-unit').addEventListener('change',()=>renderFinances());
    $('payable-operating-form').addEventListener('submit',async event=>{
      event.preventDefault();
      const cents=Math.round(Number($('payable-operating-amount').value)*100);
      const unit=$('payable-operating-unit').value;
      const row=Core.operatingPayablesReport(state).units.find(x=>x.businessId===unit);
      if(!row||!Number.isSafeInteger(cents)||cents<=0){notify('Selecione a unidade e informe um pagamento válido.',true);return;}
      if(!confirm('Liquidar '+Core.money(cents)+' do passivo operacional de '+unit+'? O valor reduzirá caixa e obrigação, sem lançar nova despesa.'))return;
      if(await commit('PAYABLES.PAGAR_OPERACIONAL',{businessId:unit,amountCents:cents}))$('payable-operating-amount').value='';
    });
    $('run-diagnostic').addEventListener('click',()=>{try{const before=JSON.stringify(state),out=Core.diagnostics(state);if(before!==JSON.stringify(state))throw Error('Diagnóstico alterou o estado');setText('diagnostic-result',out.status+' · revisão '+out.revision+' · checksum '+out.checksum);notify('Verificação estrutural e contábil aprovada.');}catch(e){setText('diagnostic-result',e.message);notify(e.message,true);}});
    $('new-career-btn').addEventListener('click',async()=>{
      if(commitInFlight||startupBlocked)return;
      commitInFlight=true;document.body.dataset.storageBusy='true';
      try{
      if(!confirm('Deseja criar outra carreira? A atual será copiada para recuperação neste navegador; exporte também JSON.'))return;
      if(!await backupCurrent())return;
      try{await CidadeDurableStore.clearCurrent();}
      catch(e){notify('Não foi possível confirmar a limpeza da carreira; a atual foi mantida. '+e.message,true);return;}
      resetTimer();state=null;viewCityId=null;financeQuery=null;financeScope='all';statementView='summary';
      setText('price-change-feedback','Alterações de preços serão confirmadas aqui.');
      render();notify('Nova carreira: preencha os dados iniciais. Exporte um backup para preservar a carreira anterior.');
      }finally{commitInFlight=false;document.body.dataset.storageBusy='false';}
    });

  }
  function updateOpenPreview(){const s=Core.SECTORS[$('sector-select').value],city=Core.cityById(viewCityId);if(s)setText('open-preview',`Abertura em ${city?.name||'cidade selecionada'} · lote ${String(selectedLot).padStart(2,'0')} · investimento ${Core.money(s.openCost)} do caixa compartilhado · ramo: ${s.name}.`);}
  async function start(){
    // Fonte única de versão: nunca depender de textos desatualizados no rodapé ou no topo.
    for(const id of ['intro-version','build-version','footer-version'])setText(id,`v${Core.VERSION}`);
    document.title=`Cidade dos Negócios 1 · v${Core.VERSION}`;
    const comparer=$('regional-compare-city');
    comparer.replaceChildren(...Core.CITIES.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(c=>{
      const o=document.createElement('option');o.value=c.id;o.textContent=`${c.name} · ${c.uf}`;return o;
    }));
    comparer.value=Core.CITIES.find(c=>c.name==='Sobral').id;
    cityOptions();bind();updateOpenPreview();
    try{
      const raw=await CidadeDurableStore.readCurrent(Core);
      if(raw){const loaded=Core.importSave(raw);state=loaded.state;viewCityId=business()?.cityId||state.player.cityId;autosaveStatus='Cópia local verificada no '+CidadeDurableStore.mode()+'; mantenha backup JSON externo.';}
      safetyBackupAvailable=!!(await CidadeDurableStore.readBackup());
      startupBlocked=false;
    }catch(e){
      startupBlocked=true;
      autosaveStatus='Não foi possível confirmar o salvamento durável. Ações bloqueadas para proteger a carreira. Importe o backup em ambiente seguro. '+e.message;
      notify(autosaveStatus,true);
    }
    render();renderSafetyBackup();goto('cidade');
    document.body.dataset.storageReady=startupBlocked?'blocked':'ready';
  }
  start();
})();