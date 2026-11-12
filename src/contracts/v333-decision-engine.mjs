// V3.3.3-A — motor puro de ocorrências da Central de Gestão.
// Não executa comandos, não consulta rede e não grava no estado da carreira.
// Agenda e Ações Rápidas serão integradas a este contrato nos patches B/C.
export function createV333DecisionEngine(Core){
  const rank=Object.freeze({urgente:0,'atenção':1,informativa:2});
  const sourceVersion='V333-A-1';
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
  const safeId=value=>String(value??'');
  const roleFor=Object.freeze({SUP:'Gerente de Suprimentos',FIN:'Controller Financeiro',FIS:'Analista Tributário'});
  const signatureOf=(item)=>JSON.stringify({
    rule:item.rule,severity:item.severity,phase:item.phase
  });
  function candidates(current){
    if(!current?.player?.cityId||!current.world)return [];
    const today=current.calendar.date,rows=[],units=Core.businesses(current);
    const unitIds=new Set(units.map(unit=>unit.id));
    const put=(data)=>{
      if(!data.id||!data.role||!data.route||!data.rule)return;
      const item={...data,sourceVersion,dateReference:today,status:'ativa'};
      item.signature=signatureOf(item);
      rows.push(item);
    };
    // Cada unidade usa a API canônica de estoque sem trocar a unidade real.
    // A view rasa apenas informa ao relatório qual empresa ler. Nenhum save é mutado.
    for(const unit of units){
      const selected={...current,world:{...current.world,activeBusinessId:unit.id}};
      for(const item of Core.inventoryReport(selected)){
        const empty=item.stock===0;
        if(!empty&&!item.alert)continue;
        const arriving=item.inTransit>0;
        const severity=empty&&!arriving?'urgente':'atenção';
        const rule=empty?'SUP-02':'SUP-01';
        const message=empty?
          item.name+' está sem estoque físico na unidade '+unit.id+'. '+
          (arriving?item.inTransit+' unidade(s) em trânsito; acompanhe o recebimento.':
                    'Não há pedido em trânsito; avalie a reposição.'):
          item.name+' na unidade '+unit.id+': '+item.stock+' física(s), '+
          item.inTransit+' em trânsito; ponto de reposição '+item.reorderPoint+'.';
        put({id:'SUP|'+safeId(unit.id)+'|'+safeId(item.id),category:'SUP',
          rule,role:roleFor.SUP,severity,
          phase:empty?(arriving?'sem-estoque-com-transito':'sem-estoque-sem-transito'):
            (arriving?'estoque-baixo-com-transito':'estoque-baixo-sem-transito'),
          title:empty?'Produto sem estoque físico':'Reposição recomendada',message,
          scope:{businessId:unit.id,productId:item.id,kind:'produto'},
          evidence:{businessId:unit.id,productId:item.id,stock:item.stock,
            inTransit:item.inTransit,reorderPoint:item.reorderPoint,available:item.stock+item.inTransit},
          route:'mercado:compras',focus:'restock-assistant',requiresUnit:true});
      }
    }
    const payables=Core.operatingPayablesReport(current);
    for(const unit of payables.units){
      if(!unitIds.has(unit.businessId)||unit.outstanding<=0)continue;
      put({id:'FIN-01|'+safeId(unit.businessId),category:'FIN',
        rule:'FIN-01',role:roleFor.FIN,severity:'atenção',phase:'passivo-sem-vencimento',
        title:'Conta operacional a liquidar',
        message:'A unidade '+unit.businessId+' possui '+Core.money(unit.outstanding)+
          ' em passivos operacionais. O sistema não informa vencimento.',
        scope:{businessId:unit.businessId,kind:'passivo-operacional'},
        evidence:{businessId:unit.businessId,amountCents:unit.outstanding,dueDate:null,
          certainty:'SEM_VENCIMENTO_INFORMADO'},
        route:'administrativo:financas',focus:'payable-operating-form',requiresUnit:false});
    }
    for(const tax of current.fiscal?.assessments||[]){
      if(!['OPEN','OVERDUE'].includes(tax.status)||!Number.isSafeInteger(tax.amount)||
        !Number.isSafeInteger(tax.paid)||tax.amount<=tax.paid)continue;
      const late=validDate(tax.dueDate)&&tax.dueDate<today;
      put({id:'FIS-01|'+safeId(tax.id),category:'FIS',
        rule:'FIS-01',role:roleFor.FIS,severity:late?'urgente':'atenção',
        phase:late?'guia-vencida':'guia-aberta',
        title:late?'Guia simulada vencida':'Guia simulada em aberto',
        message:'Competência '+tax.period+': saldo '+Core.money(tax.amount-tax.paid)+
          (late?' · vencimento '+tax.dueDate.split('-').reverse().join('/')+'.':
           ' · consulte a apuração e o vencimento cadastrado.'),
        scope:{kind:'guia-simulada',assessmentId:tax.id,period:tax.period},
        evidence:{amountCents:tax.amount-tax.paid,dueDate:validDate(tax.dueDate)?tax.dueDate:null,
          status:tax.status,period:tax.period},
        route:'administrativo:fiscal',focus:'v23-pane-administrativo-fiscal',requiresUnit:false});
    }
    // Checklist educacional por estabelecimento e competência: não confundir
    // com apuração fiscal real nem inferir obrigações não presentes no Core.
    const fiscal=units.length?Core.fiscalOperationsReport(current):{units:[]};
    for(const unit of fiscal.units){
      if(!unitIds.has(unit.businessId))continue;
      for(const period of unit.periods){
        if(period.closed)continue;
        const pending=period.tasks.filter(task=>task.status!=='CONCLUIDA');
        if(!pending.length)continue;
        const late=pending.filter(task=>task.status==='ATRASADA').length;
        const taskDates=pending.map(task=>task.dueDate).filter(validDate).sort();
        const nextDueDate=taskDates[0]||null;
        put({id:'FIS-02|'+safeId(unit.businessId)+'|'+safeId(period.period),
          category:'FIS',rule:'FIS-02',role:roleFor.FIS,
          severity:late?'urgente':'atenção',phase:late?'checklist-atrasado':'checklist-pendente',
          title:'Checklist fiscal pendente',
          message:'Unidade '+unit.businessId+', competência '+period.period+': '+
            pending.length+' tarefa(s) pendente(s)'+(late?' ('+late+' atrasada(s)).':'.'),
          scope:{businessId:unit.businessId,kind:'checklist-fiscal',period:period.period},
          evidence:{businessId:unit.businessId,period:period.period,
            pending:pending.map(task=>task.id).sort(),late,dueDate:nextDueDate,
            periodDueDate:validDate(period.dueDate)?period.dueDate:null},
          route:'administrativo:fiscal',focus:'v23-pane-administrativo-fiscal',
          requiresUnit:false});
      }
    }
    // COM-01 não ativado: não existe benchmark comercial confiável por produto.
    rows.sort((a,b)=>rank[a.severity]-rank[b.severity]||a.id.localeCompare(b.id));
    const unique=new Map();
    for(const item of rows)if(!unique.has(item.id))unique.set(item.id,item);
    return [...unique.values()];
  }
  // V3.3.3-B: agenda usa as MESMAS ocorrências da Central para tributos e
  // checklists. Compromissos financeiros datados vêm do calendário canônico.
  // Passivos sem vencimento (FIN-01) não ganham datas artificiais.
  function agenda(current,{limit=3,occurrences=null}={}){
    if(!current?.player?.cityId||!current.world)return [];
    const today=current.calendar.date,items=[];
    const dueStatus=date=>date<today?'vencido':date===today?'hoje':'previsto';
    const fromCentral=Array.isArray(occurrences)?occurrences:candidates(current);
    for(const occurrence of fromCentral){
      if(!['FIS-01','FIS-02'].includes(occurrence.rule))continue;
      const date=occurrence.evidence?.dueDate;
      if(!validDate(date))continue; // Aviso não é prova de vencimento.
      const isTax=occurrence.rule==='FIS-01';
      const label=isTax?
        'Guia simulada '+occurrence.scope.period+' · '+Core.money(occurrence.evidence.amountCents):
        'Checklist fiscal '+occurrence.scope.period+' · '+occurrence.scope.businessId;
      items.push({
        id:'AGENDA|'+occurrence.id,occurrenceId:occurrence.id,
        sourceKind:'CENTRAL_OCORRENCIA',sourceVersion,
        date,status:dueStatus(date),severity:occurrence.severity,
        label,route:occurrence.route,focus:occurrence.focus,
        scope:occurrence.scope,evidence:occurrence.evidence,
        certainty:'DATA_DO_REGISTRO',requiresUnit:occurrence.requiresUnit
      });
    }
    const schedule=Core.financialCommitmentsReport(current,30).events;
    for(const event of schedule){
      if(!['LOAN_SCHEDULE','LOAN_DUE','SUPPLIER_COMMITMENT'].includes(event.kind)||
        !validDate(event.date)||!Number.isSafeInteger(event.amountCents)||
        event.amountCents<=0||event.id===null||event.id===undefined)continue;
      const type=event.kind==='LOAN_DUE'?'Parcela exigível':
        event.kind==='LOAN_SCHEDULE'?'Parcela prevista':'Compra contratada';
      items.push({
        id:'AGENDA|FIN|'+safeId(event.kind)+'|'+safeId(event.id)+'|'+event.date,
        occurrenceId:null,sourceKind:'COMPROMISSO_FINANCEIRO',sourceVersion,
        date:event.date,status:dueStatus(event.date),
        severity:event.date<=today?'urgente':'atenção',
        label:type+' · '+Core.money(event.amountCents),
        route:'administrativo:financas',focus:'credit-calendar-summary',
        scope:{kind:event.kind,referenceId:event.id},
        evidence:{amountCents:event.amountCents,date:event.date,
          kind:event.kind,referenceId:event.id,certainty:event.certainty},
        certainty:event.certainty,requiresUnit:false
      });
    }
    const priority={vencido:0,hoje:1,previsto:2};
    items.sort((a,b)=>priority[a.status]-priority[b.status]||
      a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
    const unique=new Map();
    for(const item of items)if(!unique.has(item.id))unique.set(item.id,item);
    return [...unique.values()].slice(0,Number.isSafeInteger(limit)?Math.max(0,Math.min(limit,100)):3);
  }

  function createTracker(){
    let world=null,previous=new Map(),dismissed=new Map(),history=[],snapshot=null,key=null;
    const reset=nextWorld=>{
      world=nextWorld;previous=new Map();dismissed=new Map();history=[];
      snapshot=null;key=null;
    };
    const push=event=>{
      history.unshift(event);
      if(history.length>80)history.length=80;
    };
    function inspect(state){
      const currentWorld=safeId(state?.worldId||'sem-carreira');
      if(world!==currentWorld)reset(currentWorld);
      const cacheKey=currentWorld+'|'+safeId(state?.revision)+'|'+
        safeId(state?.world?.activeBusinessId);
      if(!snapshot||key!==cacheKey||snapshot.state!==state){
        const next=candidates(state),now=new Map(next.map(item=>[item.id,item]));
        for(const [id,old] of previous){
          if(!now.has(id)){
            push({...old,status:'resolvida',resolutionDate:state.calendar.date});
            dismissed.delete(id);
          }
        }
        for(const item of next){
          const old=previous.get(item.id);
          if(!old)continue;
          const previousRank=rank[old.severity],currentRank=rank[item.severity];
          // Estoque baixo -> zerado é agravamento também quando mercadoria
          // está em trânsito e a gravidade visual permanece em "atenção".
          const stockWorse=old.rule==='SUP-01'&&item.rule==='SUP-02';
          const stockBetter=old.rule==='SUP-02'&&item.rule==='SUP-01';
          if(previousRank!==currentRank||stockWorse||stockBetter){
            const worse=currentRank<previousRank||stockWorse;
            push({...item,status:worse?'agravada':'melhorada',
              previousSeverity:old.severity,resolutionDate:state.calendar.date});
          }
          // Dispensas só reabrem após mudança MATERIAL; não a cada variação
          // de centavos/quantidade que mantém a mesma condição.
          if(dismissed.has(item.id)&&dismissed.get(item.id)!==item.signature){
            dismissed.delete(item.id);
          }
        }
        previous=now;snapshot={state,all:next};key=cacheKey;
      }
      const active=snapshot.all.filter(item=>dismissed.get(item.id)!==item.signature);
      return {active,all:snapshot.all,history:[...history],total:snapshot.all.length,
        hidden:snapshot.all.length-active.length};
    }
    function dismiss(id,state){
      inspect(state);
      const item=previous.get(id);
      if(!item||dismissed.get(id)===item.signature)return false;
      dismissed.set(id,item.signature);
      push({...item,status:'dispensada',resolutionDate:state.calendar.date});
      return true;
    }
    return Object.freeze({inspect,dismiss});
  }
  return Object.freeze({sourceVersion,candidates,agenda,createTracker});
}
