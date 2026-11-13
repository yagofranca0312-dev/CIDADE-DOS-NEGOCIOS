// V3.3.3-D — projeção somente leitura de Equipe, Agenda e Ações.
// Usa o MESMO snapshot da Central/Agenda e não cria alertas concorrentes.
export function createV333OperationsView(Core,Decision){
  const severitySet=new Set(['urgente','atenção','informativa']);
  const dueSet=new Set(['vencido','hoje','previsto']);
  const allowed=Object.freeze({businessId:'all',severity:'all',due:'all'});
  const empty=()=>({team:[],history:[],agenda:[],summary:{
    date:null,units:0,activeTotal:0,urgentTotal:0,datedTotal:0,overdueTotal:0,
    shownTeam:0,shownAgenda:0},filters:{...allowed}});
  function project(state,snapshot={},requested={}){
    if(!state?.player?.cityId||!state.world)return empty();
    const unitIds=new Set(Core.businesses(state).map(x=>x.id));
    const businessId=unitIds.has(requested.businessId)?requested.businessId:'all';
    const severity=severitySet.has(requested.severity)?requested.severity:'all';
    const due=dueSet.has(requested.due)?requested.due:'all';
    const active=Array.isArray(snapshot.active)?snapshot.active:[];
    const all=Array.isArray(snapshot.all)?snapshot.all:active;
    const history=Array.isArray(snapshot.history)?snapshot.history:[];
    const matches=item=>(businessId==='all'||item.scope?.businessId===businessId)&&
      (severity==='all'||item.severity===severity);
    const dated=Decision.agenda(state,{limit:Infinity,occurrences:all});
    const team=active.filter(matches),visibleHistory=history.filter(matches);
    const agenda=dated.filter(item=>matches(item)&&(due==='all'||item.status===due));
    return {
      team:team.slice(0,50),history:visibleHistory.slice(0,80),agenda:agenda.slice(0,3),
      summary:{
        date:state.calendar.date,units:unitIds.size,
        activeTotal:active.length,urgentTotal:active.filter(x=>x.severity==='urgente').length,
        datedTotal:dated.length,overdueTotal:dated.filter(x=>x.status==='vencido').length,
        shownTeam:team.length,shownAgenda:agenda.length
      },
      filters:{businessId,severity,due}
    };
  }
  return Object.freeze({project});
}
