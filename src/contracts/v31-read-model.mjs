// Cidade dos Negócios — contrato experimental V3.1 (Etapa V3.0-07).
// O arquivo é um ADAPTADOR PURO e NÃO é incorporado ao HTML V3.0.
// Não importa UI, DOM, storage, timers, rede, random ou CidadeCore.dispatch.
//
// IMPORTANTE: a V3.1 não está implementada. Esta é uma fronteira de leitura
// para futuras camadas visuais, sem concessão de permissões de gameplay.
export const V31_READ_MODEL_VERSION = 1;
const MAX_EVENTS = 100;
const LOTS_PER_CITY = 18;
const LIMIT_UNITS = 5;
const freeze = value => {
  if(value && typeof value==='object' && !Object.isFrozen(value)){
    for(const item of Object.values(value))freeze(item);
    Object.freeze(value);
  }
  return value;
};
const integer=(n,min,max,label)=>{
  if(!Number.isSafeInteger(n) || n<min || n>max)throw Error(label+' fora do contrato');
  return n;
};
const serial = id => {
  const match=/^evt-(\d+)$/.exec(String(id));
  return match?Number(match[1]):null;
};
const identity = state => ({
  readModelVersion:V31_READ_MODEL_VERSION,
  worldId:state?.worldId??null,
  revision:state?.revision??null,
  schemaVersion:state?.schemaVersion??null,
  date:state?.calendar?.date??null,
  tick:state?.calendar?.tick??null
});

/**
 * Modelo imutável e somente-leitura para overlays da V3.1.
 *
 * Contrato de entrada: state já validado pelo motor (dispatch/importSave).
 * Não efetuar Core.validate(state) em cada frame; validação é dona do core.
 * NÃO passar os objetos retornados para Core.dispatch como referência de estado.
 * Todo texto exibido deve ser inserido como textContent, nunca innerHTML cru.
 */
export function createV31ReadModel(core){
  if(!core || !Array.isArray(core.CITIES) || !core.SECTORS ||
     typeof core.businesses!=='function' || typeof core.overview!=='function' ||
     typeof core.cityById!=='function')throw Error('CidadeCore incompatível com leitura V3.1');

  const listCities=()=>freeze(core.CITIES.map(c=>({
    id:c.id,name:c.name,uf:c.uf,sizeTier:c.sizeTier,
    population2026:c.population2026??null,gdp2023Thousand:c.gdp2023Thousand??null,
    economicModel:'SIMULATED'
  })));

  function cityContext(state,requested){
    const id=requested??state?.player?.cityId??null;
    if(id===null)return null;
    const city=core.cityById(id);
    if(!city)throw Error('Cidade inválida para overlay');
    return city;
  }

  function readCity(state,{cityId=null,selectedLot=null}={}){
    if(selectedLot!==null)integer(selectedLot,1,LOTS_PER_CITY,'Lote');
    const city=cityContext(state,cityId);
    const units=state?core.businesses(state):[];
    const activeUnitId=state?.world?.activeBusinessId??null;
    const totals=state?core.overview(state):null;
    const inCity=city?units.filter(u=>(u.cityId??state?.player?.cityId)===city.id):[];
    const byLot=new Map(inCity.map(u=>[u.lot,u]));
    const lots=city?Array.from({length:LOTS_PER_CITY},(_,i)=>{
      const lot=i+1,u=byLot.get(lot);
      return {lot,ownership:u?'PLAYER':'UNCLAIMED_BY_PLAYER',
        unit:u?{id:u.id,sector:u.sector,sectorName:core.SECTORS[u.sector].name,
          stockUnits:u.stockUnits,active:u.id===activeUnitId}:null,
        selected:lot===selectedLot};
    }):[];
    return freeze({...identity(state),city:city?{
      id:city.id,name:city.name,uf:city.uf,sizeTier:city.sizeTier,
      economicModel:'SIMULATED',lotCount:LOTS_PER_CITY
    }:null,selectedLot,activeUnitId,
    group:totals?{units:units.length,cashCents:totals.cash,profitCents:totals.profit,
      stockUnits:totals.stock}:null,lots});
  }

  function isCurrent(model,state){
    return Boolean(model && model.readModelVersion===V31_READ_MODEL_VERSION &&
      model.worldId===(state?.worldId??null) &&
      model.revision===(state?.revision??null) &&
      model.schemaVersion===(state?.schemaVersion??null));
  }

  // Historico principal do jogo, não os eventos próprios do sistema de rivais.
  // Paginação não remove eventos do state e nunca expõe payload completo.
  // mode='recent': últimos eventos, do mais novo para o mais antigo.
  // mode='delta': a partir de afterSeq, do mais antigo para o mais recente.
  function readEvents(state,{mode='recent',limit=30,afterSeq=0,cityId=null}={}){
    if(!['recent','delta'].includes(mode))throw Error('Modo de eventos não suportado');
    integer(limit,1,MAX_EVENTS,'Limite de eventos');
    integer(afterSeq,0,1000000000,'Cursor de eventos');
    const city=cityId===null?null:cityContext(state,cityId);
    const events=state?.audit?.events??[];
    const cityUnits=city?new Set(core.businesses(state).filter(u=>
      (u.cityId??state?.player?.cityId)===city.id).map(u=>u.id)):null;
    const matches=e=>!city || cityUnits.has(e.businessId) ||
      e.data?.cityId===city.id;
    const toRow=e=>({
      id:e.id,seq:serial(e.id),type:String(e.type),date:String(e.date),
      text:String(e.text),businessId:e.businessId??null,
      // Texto de usuário/cidade é NÃO CONFIÁVEL para uso em innerHTML.
      textFormat:'PLAIN_TEXT'
    });
    const rows=[];let hasMore=false;
    if(mode==='recent'){
      for(let i=events.length-1;i>=0;i--){
        const e=events[i];if(!matches(e))continue;
        if(rows.length===limit){hasMore=true;break;}
        rows.push(toRow(e));
      }
    } else {
      for(let i=0;i<events.length;i++){
        const e=events[i],number=serial(e.id);
        if(number===null || number<=afterSeq || !matches(e))continue;
        if(rows.length===limit){hasMore=true;break;}
        rows.push(toRow(e));
      }
    }
    const nextSeq=mode==='delta'?
      (rows.length?rows[rows.length-1].seq:(state?.audit?.eventSeq??0)):
      (state?.audit?.eventSeq??0);
    return freeze({...identity(state),mode,cityId:city?.id??null,
      cursor:afterSeq,nextSeq,limit,hasMore,totalRecorded:events.length,events:rows});
  }

  // Exibe affordances, NÃO emite comandos. A confirmação, atribuição de ID,
  // verificação de revision/quote e autorização pertencem a Core.dispatch
  // via src/ui/app.js::commit. Nenhuma disponibilidade é autorização.
  function readActionHints(state,{cityId=null,lot=null}={}){
    if(lot!==null)integer(lot,1,LOTS_PER_CITY,'Lote');
    const city=cityContext(state,cityId),hasCareer=!!state?.player?.cityId;
    const units=state?core.businesses(state):[];
    const unit=city && lot!==null?units.find(u=>
      (u.cityId??state?.player?.cityId)===city.id&&u.lot===lot):null;
    const cash=hasCareer?core.overview(state).cash:0;
    const canOpen=hasCareer&&!!city&&lot!==null&&!unit&&units.length<LIMIT_UNITS;
    const openingOptions=Object.entries(core.SECTORS).map(([sector,s])=>({
      sector,label:s.name,openCostCents:s.openCost,
      advisoryEnabled:canOpen&&cash>=s.openCost
    }));
    const actions=[
      {intent:'SELECT_LOT',kind:'UI_ONLY',advisoryEnabled:!!city,
        note:'Seleciona lote no estado efêmero da interface, sem Core.dispatch.'},
      {intent:'EMPRESA.ABRIR',kind:'GAME_COMMAND',
        advisoryEnabled:openingOptions.some(x=>x.advisoryEnabled),
        payloadFields:['cityId','lot','sector'],options:openingOptions,
        note:'Oferta visual apenas; caixa, limite e ocupação são revalidados pelo core.'},
      {intent:'EMPRESA.ATIVAR',kind:'GAME_COMMAND',
        advisoryEnabled:hasCareer&&!!unit&&unit.id!==state.world.activeBusinessId,
        payloadFields:['businessId'],
        targetBusinessId:unit?.id??null,
        note:'Confirmar no core com comando idempotente.'},
      {intent:'TEMPO.AVANCAR_DIA',kind:'GAME_COMMAND',
        advisoryEnabled:hasCareer,payloadFields:[],
        note:'Uma única origem de tempo: Core.dispatch; não acionar em render/animationFrame.'}
    ];
    return freeze({...identity(state),cityId:city?.id??null,lot,
      authority:'ADVISORY_ONLY',dispatchOwner:'CidadeCore.dispatch',
      actions});
  }
  return freeze({contract:'CIDADE_V31_READ_V1',version:V31_READ_MODEL_VERSION,
    listCities,readCity,readEvents,readActionHints,isCurrent});
}
