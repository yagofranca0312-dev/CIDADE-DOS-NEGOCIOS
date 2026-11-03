/* V2.3-C: consultas gerenciais da rede. Não cria ou altera lançamentos. */
function companyShiftDate(date,days){
  const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
function companyReportWindow(state,core,kind,customFrom='',customTo=''){
  const today=state.calendar.date,last=state.calendar.tick?companyShiftDate(today,-1):today;
  const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
  if(kind==='all')return {from:core.START_DATE,to:today,label:'Toda a carreira',kind};
  if(kind==='month')return {from:today.slice(0,7)+'-01',to:today,label:'Mês atual (registros disponíveis)',kind};
  if(['7','30','90'].includes(kind)){
    const from=companyShiftDate(last,1-Number(kind));
    return {from:from<core.START_DATE?core.START_DATE:from,to:last,label:'Últimos '+kind+' dias concluídos',kind};
  }
  if(kind==='custom'){
    if(!valid(customFrom)||!valid(customTo)||customFrom<core.START_DATE||customTo>today||customFrom>customTo)
      throw Error('Informe um intervalo válido entre o início da carreira e a data atual.');
    return {from:customFrom,to:customTo,label:'Intervalo '+customFrom+' a '+customTo,kind};
  }
  throw Error('Período de análise desconhecido.');
}
function companyScopedUnits(state,core,scope){
  const units=core.businesses(state);
  if(scope==='all')return units;
  const i=scope.indexOf(':'),kind=scope.slice(0,i),value=scope.slice(i+1);
  if(i<1||!value)throw Error('Seleção empresarial inválida.');
  if(kind==='unit')return units.filter(b=>b.id===value);
  if(kind==='city')return units.filter(b=>b.cityId===value);
  if(kind==='sector')return units.filter(b=>b.sector===value);
  throw Error('Seleção empresarial inválida.');
}
function companyMetricReport(state,core,scope,window){
  const units=companyScopedUnits(state,core,scope),all=scope==='all';
  const selected=new Set(units.map(x=>x.id));
  if(!all&&units.length===0)throw Error('Nenhuma unidade corresponde a este filtro.');
  const reports=all?[core.financialReport(state,'range',state.calendar.date,{from:window.from,to:window.to},'all')]:
    units.map(b=>core.financialReport(state,'range',state.calendar.date,{from:window.from,to:window.to},b.id));
  const sum=k=>reports.reduce((v,r)=>v+r[k],0);
  const revenue=sum('revenue'),cogs=sum('cogs'),expenses=sum('expenses'),taxExpense=all?sum('taxExpense'):0;
  const orders=units.flatMap(b=>b.purchaseOrders.filter(o=>o.status==='PENDING'));
  const inTransitUnits=orders.reduce((n,o)=>n+o.items.reduce((v,line)=>v+line.quantity,0),0);
  const stock=units.reduce((n,b)=>n+b.stockUnits,0);
  const alertCount=units.reduce((n,b)=>n+b.products.filter(p=>{
    const pending=b.purchaseOrders.filter(o=>o.status==='PENDING').reduce((a,o)=>a+o.items.filter(x=>x.productId===p.id).reduce((s,line)=>s+line.quantity,0),0);
    return p.stockUnits+pending<=p.reorderPoint;
  }).length,0);
  const soldUnits=units.reduce((n,b)=>n+b.sales.filter(x=>x.date>=window.from&&x.date<=window.to)
    .reduce((v,sale)=>v+sale.items.reduce((a,item)=>a+item.quantity,0),0),0);
  return {scope,window,unitIds:selected,unitCount:units.length,units,revenue,cogs,expenses,taxExpense,
    grossProfit:revenue-cogs,operatingResult:revenue-cogs-expenses,afterTax:revenue-cogs-expenses-taxExpense,
    grossMargin:revenue?Math.round((revenue-cogs)*10000/revenue)/100:null,
    stock,inTransitUnits,criticalProducts:alertCount,soldUnits,
    entries:reports.flatMap(r=>r.entries),hasCorporateTax:all,
    cash:all?core.overview(state).cash:null,taxPayable:all?core.overview(state).taxPayable:null};
}
function companyTrendRows(metric){
  const monthly=metric.window.kind==='all'||metric.window.kind==='90';
  const from=metric.window.kind==='all'?Math.max(0,Number(metric.window.to.slice(0,4))*12+Number(metric.window.to.slice(5,7))-12):null;
  const map=new Map();
  for(const journal of metric.entries){
    const key=monthly?journal.date.slice(0,7):journal.date;
    if(monthly&&from!==null&&Number(key.slice(0,4))*12+Number(key.slice(5,7))<=from)continue;
    const row=map.get(key)||{key,revenue:0,cogs:0,expenses:0,taxes:0};
    for(const e of journal.entries){
      if(e.account==='REVENUE')row.revenue+=e.credit-e.debit;
      if(e.account==='COGS')row.cogs+=e.debit-e.credit;
      if(e.account==='EXPENSE')row.expenses+=e.debit-e.credit;
      if(e.account==='TAX_EXPENSE')row.taxes+=e.debit-e.credit;
    }
    map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>a.key.localeCompare(b.key)).map(row=>({...row,
    operatingResult:row.revenue-row.cogs-row.expenses,net:row.revenue-row.cogs-row.expenses-row.taxes}));
}
function companyComparisonRows(state,core,window,dimension='unit',city='all',sector='all',sort='revenue'){
  if(!['unit','city','sector'].includes(dimension))throw Error('Dimensão de comparação inválida.');
  let units=core.businesses(state).filter(x=>(city==='all'||x.cityId===city)&&(sector==='all'||x.sector===sector));
  const bucket=new Map();
  for(const unit of units){
    const key=dimension==='unit'?unit.id:dimension==='city'?unit.cityId:unit.sector;
    const label=dimension==='unit'?(unit.id+' · '+core.cityById(unit.cityId).name+' · '+core.SECTORS[unit.sector].name):
      dimension==='city'?core.cityById(unit.cityId).name:core.SECTORS[unit.sector].name;
    const row=bucket.get(key)||{key,label,unitCount:0,revenue:0,cogs:0,expenses:0,operatingResult:0,stock:0,inTransitUnits:0};
    const r=core.financialReport(state,'range',state.calendar.date,{from:window.from,to:window.to},unit.id);
    row.unitCount++;row.revenue+=r.revenue;row.cogs+=r.cogs;row.expenses+=r.expenses;
    row.operatingResult+=r.revenue-r.cogs-r.expenses;row.stock+=unit.stockUnits;
    row.inTransitUnits+=unit.purchaseOrders.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.items.reduce((s,x)=>s+x.quantity,0),0);
    bucket.set(key,row);
  }
  const rows=[...bucket.values()].map(x=>({...x,margin:x.revenue?Math.round((x.revenue-x.cogs)*10000/x.revenue)/100:null}));
  const k={revenue:'revenue',operating:'operatingResult',margin:'margin',stock:'stock'}[sort]||'revenue';
  rows.sort((a,b)=>((b[k]??-Infinity)-(a[k]??-Infinity))||a.label.localeCompare(b.label));
  return rows;
}
function companyFillSelect(id,options){
  const el=$(id),old=el.value;
  if(el.options.length!==options.length||options.some((opt,i)=>el.options[i].value!==opt.value||el.options[i].textContent!==opt.label)){
    el.replaceChildren(...options.map(x=>{const opt=document.createElement('option');opt.value=x.value;opt.textContent=x.label;return opt;}));
  }
  el.value=options.some(x=>x.value===old)?old:options[0]?.value||'';
}
function companyPercent(value){return value===null?'—':value.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';}
function companyRenderUnitList(){
  const report=Core.groupReport(state),search=$('company-unit-search').value.trim().toLocaleLowerCase('pt-BR');
  const city=$('company-unit-city').value,sector=$('company-unit-sector').value,active=business();
  const units=report.units.filter(x=>(city==='all'||x.cityId===city)&&(sector==='all'||x.sector===sector)&&
    (x.id+' '+x.city+' '+Core.SECTORS[x.sector].name).toLocaleLowerCase('pt-BR').includes(search));
  $('unit-rows').innerHTML=units.length?units.map(u=>{
    const gross=u.revenue?Math.round((u.revenue-u.cogs)*10000/u.revenue)/100:null;
    const transit=Core.businesses(state).find(b=>b.id===u.id)?.purchaseOrders.filter(o=>o.status==='PENDING').reduce((s,o)=>s+o.items.reduce((n,x)=>n+x.quantity,0),0)||0;
    return '<tr><td><strong>'+escape(u.id)+'</strong> · '+escape(Core.SECTORS[u.sector].name)+'<small class="company-unit-location">'+escape(u.city)+' · lote '+u.lot+'</small></td><td>'+escape(Core.money(u.revenue))+'</td><td>'+escape(Core.money(u.profit))+'</td><td>'+escape(companyPercent(gross))+'</td><td>'+u.stock+'</td><td>'+transit+'</td><td><button type="button" class="btn btn-outline" data-unit-activate="'+escape(u.id)+'" '+(u.id===active?.id?'disabled':'')+'>'+(u.id===active?.id?'Ativa':'Gerenciar')+'</button></td></tr>';
  }).join(''):'<tr><td colspan="7">Nenhuma unidade corresponde aos filtros selecionados.</td></tr>';
  setText('company-unit-summary',units.length+' de '+report.count+' unidade(s) exibida(s). Resultados operacionais sem rateio dos tributos centrais.');
}
function companyRenderDashboard(){
  const report=Core.groupReport(state),group=report.group,op=group.revenue-group.cogs-group.expenses;
  const gross=group.revenue?Math.round((group.revenue-group.cogs)*10000/group.revenue)/100:null;
  setText('company-dashboard-revenue',Core.money(group.revenue));
  setText('company-dashboard-margin',companyPercent(gross));
  setText('company-dashboard-operating',Core.money(op));
  setText('company-dashboard-net',Core.money(group.profit));
  setText('company-dashboard-stock',group.stock+' un.');
  setText('company-dashboard-tax',Core.money(group.taxPayable));
  const units=Core.businesses(state),pending=units.reduce((n,b)=>n+b.purchaseOrders.filter(o=>o.status==='PENDING').length,0),critical=units.reduce((n,b)=>n+b.products.filter(p=>{
    const inTransit=b.purchaseOrders.filter(o=>o.status==='PENDING').reduce((s,o)=>s+o.items.filter(x=>x.productId===p.id).reduce((t,x)=>t+x.quantity,0),0);
    return p.stockUnits+inTransit<=p.reorderPoint;
  }).length,0);
  setText('company-dashboard-alerts',critical+' produto(s) no mínimo ou abaixo · '+pending+' pedido(s) em trânsito · '+report.count+'/5 unidade(s).');
  setText('company-dashboard-taxes-note','Tributos simulados e caixa são centrais. Resultado operacional e resultado após tributos são indicadores diferentes; não existem CNPJs fictícios por filial.');
}
function companyRenderAnalysis(){
  const period=$('company-analysis-period').value,from=$('company-analysis-from'),to=$('company-analysis-to');
  $('company-analysis-custom').hidden=period!=='custom';
  try{
    const w=companyReportWindow(state,Core,period,from.value,to.value);
    const metric=companyMetricReport(state,Core,$('company-analysis-scope').value,w);
    $('company-analysis-error').hidden=true;
    setText('company-analysis-period-label',w.label+' · '+metric.unitCount+' unidade(s) · resultados realizados dos lançamentos existentes.');
    setText('company-analysis-revenue',Core.money(metric.revenue));
    setText('company-analysis-operating',Core.money(metric.operatingResult));
    setText('company-analysis-margin',companyPercent(metric.grossMargin));
    setText('company-analysis-sales',metric.soldUnits+' un.');
    setText('company-analysis-stock',metric.stock+' un. físicas atuais · '+metric.inTransitUnits+' em trânsito');
    setText('company-analysis-tax-note',metric.hasCorporateTax?
      'Grupo: tributos simulados lançados '+Core.money(metric.taxExpense)+'; resultado após tributos '+Core.money(metric.afterTax)+'. Caixa atual centralizado: '+Core.money(metric.cash)+'.':
      'Recorte operacional de unidades, cidade ou ramo. Tributos e caixa do grupo não são rateados.');
    const rows=companyTrendRows(metric),max=Math.max(1,...rows.map(x=>x.revenue));
    $('company-trend-rows').innerHTML=rows.length?rows.map(row=>{
      const label=row.key.length===7?row.key.slice(5)+'/'+row.key.slice(0,4):BRDate(row.key);
      const width=Math.max(0,Math.min(100,row.revenue/max*100));
      return '<tr><td>'+escape(label)+'</td><td><div class="company-bar" aria-hidden="true"><span style="width:'+width.toFixed(1)+'%"></span></div></td><td>'+escape(Core.money(row.revenue))+'</td><td>'+escape(Core.money(row.operatingResult))+'</td></tr>';
    }).join(''):'<tr><td colspan="4">Sem lançamentos nesse recorte. Nenhum valor estimado foi incluído.</td></tr>';
    setText('company-trend-note',w.kind==='all'?'Gráfico dos últimos até 12 meses com registros; totais superiores consideram toda a carreira.':'Série realizada, sem projeções e sem lançamentos fictícios.');
  }catch(e){
    $('company-analysis-error').hidden=false;setText('company-analysis-error',e.message);
    for(const id of ['company-analysis-period-label','company-analysis-revenue','company-analysis-operating','company-analysis-margin','company-analysis-sales','company-analysis-stock','company-analysis-tax-note'])setText(id,'—');
    $('company-trend-rows').innerHTML='<tr><td colspan="4">Corrija os filtros para consultar o histórico.</td></tr>';
  }
}
function companyRenderComparison(){
  const period=$('company-compare-period').value;
  $('company-compare-custom').hidden=period!=='custom';
  try{
    const w=companyReportWindow(state,Core,period,$('company-compare-from').value,$('company-compare-to').value);
    const rows=companyComparisonRows(state,Core,w,$('company-compare-dimension').value,$('company-compare-city').value,$('company-compare-sector').value,$('company-compare-sort').value);
    $('company-compare-error').hidden=true;
    const revenue=rows.reduce((n,x)=>n+x.revenue,0),operating=rows.reduce((n,x)=>n+x.operatingResult,0),count=rows.reduce((n,x)=>n+x.unitCount,0);
    setText('company-compare-summary',w.label+' · '+rows.length+' agrupamento(s), '+count+' unidade(s) · receita '+Core.money(revenue)+' · resultado operacional '+Core.money(operating)+'.');
    $('company-compare-rows').innerHTML=rows.length?rows.map((x,i)=>'<tr><td>'+escape(x.label)+'</td><td>'+x.unitCount+'</td><td>'+escape(Core.money(x.revenue))+'</td><td>'+escape(Core.money(x.operatingResult))+'</td><td>'+escape(companyPercent(x.margin))+'</td><td>'+x.stock+'</td><td>'+x.inTransitUnits+'</td></tr>').join(''):
      '<tr><td colspan="7">Não existem estabelecimentos nesse recorte.</td></tr>';
  }catch(e){
    $('company-compare-error').hidden=false;setText('company-compare-error',e.message);
    setText('company-compare-summary','Corrija os filtros de comparação.');
    $('company-compare-rows').innerHTML='<tr><td colspan="7">Período inválido.</td></tr>';
  }
}
function renderCompanyPanels(){
  const units=Core.businesses(state),uniq=(key)=>[...new Set(units.map(key))].sort();
  const city=[{value:'all',label:'Todas as cidades'},...uniq(x=>x.cityId).map(v=>({value:v,label:Core.cityById(v).name}))];
  const sector=[{value:'all',label:'Todos os ramos'},...uniq(x=>x.sector).map(v=>({value:v,label:Core.SECTORS[v].name}))];
  companyFillSelect('company-unit-city',city);companyFillSelect('company-unit-sector',sector);
  companyFillSelect('company-compare-city',city);companyFillSelect('company-compare-sector',sector);
  companyFillSelect('company-analysis-scope',[{value:'all',label:'Grupo consolidado'},...units.map(x=>({value:'unit:'+x.id,label:'Unidade '+x.id+' · '+Core.cityById(x.cityId).name})),
    ...city.slice(1).map(x=>({value:'city:'+x.value,label:'Cidade: '+x.label})),
    ...sector.slice(1).map(x=>({value:'sector:'+x.value,label:'Ramo: '+x.label}))]);
  for(const id of ['company-analysis-from','company-compare-from']){const el=$(id);el.min=Core.START_DATE;el.max=state.calendar.date;if(!el.value)el.value=Core.START_DATE;}
  for(const id of ['company-analysis-to','company-compare-to']){const el=$(id);el.min=Core.START_DATE;el.max=state.calendar.date;if(!el.value)el.value=state.calendar.date;}
  companyRenderDashboard();companyRenderUnitList();companyRenderAnalysis();companyRenderComparison();
}
