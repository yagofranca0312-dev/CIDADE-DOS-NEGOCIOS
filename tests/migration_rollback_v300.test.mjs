import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';

// Etapa 4 — ensaios de migração e rollback com motores históricos IMUTÁVEIS.
// A fixture V2.9.0 foi copiada byte a byte da release homologada, SHA original
// do commit 082faa4626cf5cb0fc54c9ef092bddd86ffce54c.
const load=path=>runInNewContext(readFileSync(path,'utf8')+'\nCidadeCore',{});
const current=load('src/core/game.js');
const stablePath='tests/fixtures/core_v2_9_0_homologada.js';
const stable=load(stablePath);
let n=0;
function apply(engine,s,type,payload={}){
  const r=engine.dispatch(s,{id:'migration-v300-'+(++n),type,payload});
  assert.equal(r.ok,true,engine.VERSION+' / '+type+': '+r.error);
  return r.state;
}
function create(engine,seed,sector='mercado'){
  const city=engine.CITIES.find(x=>x.name==='Tianguá');
  assert.ok(city,'Tianguá não consta no catálogo histórico');
  let s=apply(engine,null,'CARREIRA.CRIAR',{name:'Teste de Migração',companyName:'Rede Histórica Simulada',cityId:city.id,seed});
  s=apply(engine,s,'EMPRESA.ABRIR',{sector,cityId:city.id,lot:2});
  return s;
}
function days(engine,s,count){
  while(count>0){const period=Math.min(count,30);s=apply(engine,s,'TEMPO.AVANCAR_LOTE',{days:period});count-=period;}
  return s;
}
const json=o=>JSON.stringify(o);
function integrity(s){
  current.validate(s);
  assert.equal(current.balanceSheet(s).balanced,true);
  assert.equal(current.reconciliationReport(s).ok,true);
}
function pureRestore(s,engine=current){
  const original=json(s);
  for(const data of [engine.exportSave(s),engine.exportSaveCompact(s)]){
    const result=engine.importSave(data);
    assert.equal(result.migrated,false);
    assert.equal(json(result.state),original);
    if(engine===current)integrity(result.state);
  }
}
function compareBeforeAfter(old,s,engine){
  assert.equal(json(s.economy.ledger),json(old.economy.ledger),'Razão histórico foi modificado');
  assert.equal(json(s.audit.events),json(old.audit.events),'Eventos históricos alterados');
  assert.equal(json(s.audit.commands),json(old.audit.commands),'IDs ou fingerprints do histórico alterados');
  assert.equal(s.calendar.tick,old.calendar.tick);
  assert.equal(s.calendar.date,old.calendar.date);
  assert.equal(s.rng.seed,old.rng.seed,'RNG foi reinicializado');
  assert.equal(current.overview(s).cash,engine.overview(old).cash);
  assert.equal(current.overview(s).revenue,engine.overview(old).revenue);
  assert.equal(current.overview(s).stock,engine.overview(old).stock);
  assert.equal(s.world.business?.id,old.world.business?.id,'ID da matriz mudou');
  assert.equal(s.world.business?.stockUnits,old.world.business?.stockUnits);
  assert.equal(s.world.business?.totalSold,old.world.business?.totalSold);
  if(old.world.branches)assert.equal(json(s.world.branches),json(old.world.branches));
}

test('V3.0 migração: fixture V2.9 está byte a byte ligada ao blob do release homologado',()=>{
  const code=readFileSync(stablePath);
  const hash=createHash('sha1').update('blob '+code.length+'\0').update(code).digest('hex');
  assert.equal(hash,'048d174cd2e952d61a255c84c97dbb40dceaf50a');
  assert.equal(stable.VERSION,'2.9.0');
  assert.equal(stable.SCHEMA_VERSION,9);
  assert.equal(current.VERSION,'3.3.1');
});

const historical=[
 ['V1.0.1 / schema 2','tests/fixtures/core_v1_0_1.js',2],
 ['V1.2.0 / schema 3','tests/fixtures/core_v1_2_0.js',3],
 ['V1.2.1 / schema 3','tests/fixtures/core_v1_2_1.js',3],
 ['V1.3.0 / schema 4','tests/fixtures/core_v1_3_0.js',4],
 ['V1.4.0 / schema 5','tests/fixtures/core_v1_4_0.js',5],
 ['V1.5.0 / schema 6','tests/fixtures/core_v1_5_0.js',6],
 ['V1.6.0 / schema 7','tests/fixtures/core_v1_6_0.js',7],
 ['V1.7.0 / schema 8','tests/fixtures/core_v1_7_0.js',8],
 ['V1.8.0 / schema 8','tests/fixtures/core_v1_8_0.js',8],
 ['V1.9.0 / schema 9','tests/fixtures/core_v1_9_0.js',9],
 ['V2.0.0 / schema 9','tests/fixtures/core_v2_0_0.js',9]
];
for(const [label,fixture,schema] of historical){
  test('V3.0 migração: '+label+' preserva livro, eventos, IDs, estoque, caixa, RNG e tempo',()=>{
    const legacy=load(fixture);
    let before=create(legacy,300410+schema);
    before=apply(legacy,before,'ESTOQUE.COMPRAR',{quantity:24,supplierId:'regional',productId:'base'});
    before=days(legacy,before,2);
    assert.equal(before.schemaVersion,schema);
    const original=json(before),exported=legacy.exportSave(before);
    const imported=current.importSave(exported),after=imported.state;
    assert.equal(imported.migrated,true);
    assert.equal(after.schemaVersion,10);
    compareBeforeAfter(before,after,legacy);
    assert.equal(json(before),original,'Motor antigo teve snapshot mutado durante migração');
    assert.equal(after.audit.events.length,before.audit.events.length,'Criou eventos retroativos');
    assert.equal(after.economy.ledger.length,before.economy.ledger.length,'Criou lançamento retroativo');
    integrity(after);
    pureRestore(after);
  });
}

test('V3.2: carreira real V2.9 é migrada mantendo razão, RNG, unidades e estoque',()=>{
  let s=create(stable,300473);
  s=apply(stable,s,'ESTOQUE.COMPRAR',{quantity:100,productId:'base',supplierId:'regional'});
  s=days(stable,s,5);
  const before=json(s),blob=stable.exportSave(s),compact=stable.exportSaveCompact(s);
  for(const data of [blob,compact]){
    const imported=current.importSave(data);
    assert.equal(imported.migrated,true);
    assert.equal(imported.state.schemaVersion,10);
    assert.equal(imported.state.fiscal.regime,'SIMPLES');
    assert.equal(imported.state.fiscal.taxStartDate,s.calendar.date);
    compareBeforeAfter(s,imported.state,stable);
    integrity(imported.state);
    pureRestore(imported.state);
  }
  assert.equal(json(s),before);
});

test('V3.2: formato V1/V2 permanece portátil, mas schema 10 não faz downgrade inseguro para V2.9',()=>{
  let s=create(current,300474);
  const plan=current.operationalBalanceReport(s,'equilibrado');
  assert.ok(plan.spendCents>0);
  const cmd={id:'migration-v300-patch-a-unique',type:'ECONOMIA.COMPRAR_PLANO',
    payload:{mode:plan.mode,businessId:plan.businessId,revision:plan.revision,quoteId:plan.quoteId}};
  const result=current.dispatch(s,cmd);
  assert.equal(result.ok,true,result.error);s=result.state;
  assert.ok(s.audit.events.some(e=>e.type==='ECONOMIA.COMPRA_PLANEJADA'));
  const snapshot=json(s);
  for(const raw of [current.exportSave(s),current.exportSaveCompact(s)]){
    assert.equal(json(current.importSave(raw).state),snapshot);
    assert.throws(()=>stable.importSave(raw),/schema|incompatível/i,
      'Não prometer downgrade automático para schema 9');
  }
  integrity(s);
});

test('V3.2: empréstimo, filiais, RH e CD de V2.9 são preservados na migração',()=>{
  let s=create(stable,300475);
  s=apply(stable,s,'ESTOQUE.COMPRAR',{quantity:200,productId:'base',supplierId:'regional'});
  s=days(stable,s,7);
  assert.ok(stable.creditReport(s).eligibility.availableCents>=50000);
  s=apply(stable,s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:6});
  s=apply(stable,s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
  s=apply(stable,s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});
  s=apply(stable,s,'RH.CONTRATAR',{businessId:stable.businesses(s)[0].id,name:'Colaborador Fictício',role:'atendimento'});
  s=days(stable,s,30);
  const original=json(s);
  for(const format of [stable.exportSave(s),stable.exportSaveCompact(s)]){
    const imported=current.importSave(format);
    assert.equal(imported.migrated,true);
    assert.equal(imported.state.schemaVersion,10);
    compareBeforeAfter(s,imported.state,stable);
    assert.equal(current.balanceSheet(imported.state).difference,0);
    assert.equal(current.creditReport(imported.state).principalOutstanding,
      stable.creditReport(s).principalOutstanding);
    assert.equal(json(current.logisticsReport(imported.state).depot),
      json(stable.logisticsReport(s).depot));
    assert.equal(current.rhReport(imported.state).pendingCents,stable.rhReport(s).pendingCents);
    integrity(imported.state);
  }
  assert.equal(json(s),original);
});

test('V3.0 recuperação: backup alterado e schema novo rejeitados antes de entregar estado',()=>{
  let s=create(current,300476);
  s=apply(current,s,'ESTOQUE.COMPRAR',{quantity:30,supplierId:'regional',productId:'base'});
  const snapshot=json(s);
  const standard=JSON.parse(current.exportSave(s));
  const badHash=JSON.parse(json(standard));
  badHash.payload.calendar.tick+=1;
  assert.throws(()=>current.importSave(json(badHash)),/Checksum/);
  const unknownSchema=JSON.parse(json(standard));
  unknownSchema.payload.schemaVersion=11;
  unknownSchema.checksum=current.hash(json(unknownSchema.payload));
  assert.throws(()=>current.importSave(json(unknownSchema)),/schema incompatível/i);
  const balancedButInvalid=JSON.parse(json(standard));
  balancedButInvalid.payload.world.business.products[0].stockUnits+=10;
  balancedButInvalid.checksum=current.hash(json(balancedButInvalid.payload));
  assert.throws(()=>current.importSave(json(balancedButInvalid)),/Saldos|Estoque|contabil/i);
  const duplicateEvent=JSON.parse(json(standard));
  duplicateEvent.payload.audit.events[1].id=duplicateEvent.payload.audit.events[0].id;
  duplicateEvent.checksum=current.hash(json(duplicateEvent.payload));
  assert.throws(()=>current.importSave(json(duplicateEvent)),/Eventos duplicados/);
  const unsupportedEnvelope=JSON.parse(json(standard));
  unsupportedEnvelope.saveFormatVersion=3;
  assert.throws(()=>current.importSave(json(unsupportedEnvelope)),/Envelope de save/);
  const invalidCompact=JSON.parse(current.exportSaveCompact(s));
  invalidCompact.codec='DICT_KEYS_V2';
  assert.throws(()=>current.importSave(json(invalidCompact)),/Codec compacto/);
  const missingKeys=JSON.parse(current.exportSaveCompact(s));
  missingKeys.keys=[];
  assert.throws(()=>current.importSave(json(missingKeys)),/Referência de chave compacta/);
  assert.throws(()=>current.importSave('{malformed'),{name:'SyntaxError'});
  assert.equal(json(s),snapshot,'Uma importação com erro não pode editar a carreira ativa');
  integrity(s);
});

test('V3.0 recuperação: CP-000 sem atividade migra; CP-000 com atividade falha sem inventar histórico',()=>{
  const empty={schemaVersion:1,meta:{title:'Cidade dos Negócios',version:'0.0.1',seed:2000},
    world:{entities:[]},player:{},calendar:{tick:0},history:[]};
  const clean=current.importSave(json(empty));
  assert.equal(clean.migrated,true);
  assert.equal(clean.state.schemaVersion,10);
  assert.equal(clean.state.economy.ledger.length,0);
  assert.equal(clean.state.audit.events.length,0);
  assert.equal(current.overview(clean.state).cash,0);
  const active={...empty,world:{entities:[{id:'entity-1'}]}};
  assert.throws(()=>current.importSave(json(active)),/atividade não suportada/);
});

test('V3.0 recuperação: exportação tradicional V1 continua padrão e preserva compatibilidade de rollback',()=>{
  const s=create(current,300477),snapshot=json(s);
  const standard=JSON.parse(current.exportSave(s)),compact=JSON.parse(current.exportSaveCompact(s));
  assert.equal(standard.saveFormatVersion,1);
  assert.equal(compact.saveFormatVersion,2);
  assert.equal(compact.codec,'DICT_KEYS_V1');
  assert.equal(standard.checksum,current.hash(snapshot));
  assert.equal(compact.checksum,current.hash(snapshot));
  assert.equal(json(current.importSave(json(standard)).state),snapshot);
  assert.equal(json(current.importSave(json(compact)).state),snapshot);
  assert.throws(()=>stable.importSave(json(standard)),/schema|incompatível/i);
  assert.throws(()=>stable.importSave(json(compact)),/schema|incompatível/i);
  assert.equal(current.saveHealthReport(s).schemaVersion,10);
});
