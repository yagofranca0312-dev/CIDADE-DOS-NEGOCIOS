import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let id=0;
const act=(s,type,payload={})=>{
 const r=Core.dispatch(s,{id:'qa-v29-'+(++id),type,payload});
 assert.equal(r.ok,true,r.error||type);return r.state;
};
function career(seed=29000){
 let s=act(null,'CARREIRA.CRIAR',{name:'Empreendedor QA',companyName:'Rede QA fictícia',cityId:'CE-TIANGUA',seed});
 return act(s,'EMPRESA.ABRIR',{sector:'mercado',lot:1,cityId:'CE-TIANGUA'});
}
function step(s,days){
 while(days){const tick=Math.min(days,30);s=act(s,'TEMPO.AVANCAR_LOTE',{days:tick});days-=tick;}
 return s;
}
test('V2.9: mantém schema9, versão alpha e importação do envelope V1 legado intacta',()=>{
 let s=career(29001);
 assert.equal(Core.SCHEMA_VERSION,9);
 assert.equal(Core.VERSION,'3.0.0');
 const old=Core.exportSave(s),envelope=JSON.parse(old);
 assert.equal(envelope.saveFormatVersion,1);
 assert.equal(JSON.stringify(Core.importSave(old).state),JSON.stringify(s));
 assert.equal(s.economy.logistics,undefined);
});
test('V2.9: backup compacto V2 é reversível, preserva integralmente eventos, ledger e checksum',()=>{
 let s=career(29002);s=act(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:100});
 s=step(s,30);
 const before=JSON.stringify(s),compact=Core.exportSaveCompact(s),file=JSON.parse(compact);
 assert.equal(file.saveFormatVersion,2);assert.equal(file.codec,'DICT_KEYS_V1');
 assert.equal(file.checksum,Core.hash(before));
 const restored=Core.importSave(compact);
 assert.equal(JSON.stringify(restored.state),before);
 assert.equal(restored.migrated,false);
 assert.equal(Core.reconciliationReport(restored.state).ok,true);
});
test('V2.9: compressão por chaves não perde históricos e reduz tamanho em carreira com movimento',()=>{
 let s=career(29003);
 s=act(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:200});s=step(s,60);
 const standard=Core.exportSave(s),compact=Core.exportSaveCompact(s),measure=Core.saveHealthReport(s);
 assert.ok(compact.length<standard.length,compact.length+' deveria ser menor que '+standard.length);
 assert.ok(measure.savedPercent>5);
 assert.equal(measure.compactChars,compact.length);
 assert.ok(measure.standardChars>=JSON.stringify(JSON.parse(standard)).length);
 assert.equal(JSON.stringify(Core.importSave(compact).state),JSON.stringify(s));
});
test('V2.9: dicionário adulterado ou checksum incorreto são rejeitados sem alterar a carreira',()=>{
 const s=career(29004),source=JSON.stringify(s),compact=JSON.parse(Core.exportSaveCompact(s));
 compact.checksum='00000000';
 assert.throws(()=>Core.importSave(JSON.stringify(compact)),/Checksum/);
 assert.equal(JSON.stringify(s),source);
});
test('V2.9: formato compactado inválido e referências fora do dicionário são rejeitados',()=>{
 const s=career(29005);
 const invalid=JSON.parse(Core.exportSaveCompact(s));
 invalid.codec='INVALID';
 assert.throws(()=>Core.importSave(JSON.stringify(invalid)),/Codec/);
 const invalid2=JSON.parse(Core.exportSaveCompact(s));
 invalid2.keys=[];
 assert.throws(()=>Core.importSave(JSON.stringify(invalid2)),/Referência de chave compacta/);
});
test('V2.9: versões antigas têm retorno V1 tradicional, enquanto V2 compacto exige leitor novo',()=>{
 const s=career(29006);
 assert.equal(JSON.parse(Core.exportSave(s)).saveFormatVersion,1);
 assert.equal(JSON.parse(Core.exportSaveCompact(s)).saveFormatVersion,2);
 assert.match(Core.saveHealthReport(s).note,/2\.9\.0/);
});
test('V2.9: leitura do QA é pura, não gera receita, custo, eventos nem alteração de RNG',()=>{
 let s=career(29007),serialized=JSON.stringify(s);
 const q=Core.qualityReport(s,30);
 assert.equal(q.horizonDays,30);assert.equal(q.salesCents,0);
 assert.equal(q.cashCents,Core.overview(s).cash);
 assert.equal(JSON.stringify(s),serialized);
 assert.equal(Core.qualityReport(s,90).horizonDays,90);
 assert.throws(()=>Core.qualityReport(s,180),/Horizonte/);
});
test('V2.9: resultado de 30 dias equivale ao razão contábil realizado e discrimina unidades',()=>{
 let s=career(29008);
 s=act(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:200});
 s=step(s,30);
 const q=Core.qualityReport(s,30),dre=Core.incomeStatement(s,'range',s.calendar.date,{from:q.from,to:Core.dateNext(q.from)},'all');
 assert.ok(q.salesCents>=0);assert.ok(q.cogsCents>=0);
 assert.equal(q.periodResultCents,q.salesCents-q.cogsCents-q.expensesCents-q.taxExpenseCents);
 assert.equal(q.unitsReport.length,1);assert.equal(q.unitsReport[0].id,Core.activeBusiness(s).id);
 assert.ok(q.demandUnits>=q.unmetDemandUnits);
 assert.equal(Core.reconciliationReport(s).ok,true);
});
test('V2.9: ruptura de demanda é observável sem inventar venda, não há compra automática',()=>{
 let s=career(29009);s=step(s,30);
 const before=JSON.stringify(s),cash=Core.overview(s).cash,q=Core.qualityReport(s,30);
 assert.equal(q.salesCents,0);
 assert.ok(q.unmetDemandUnits>0);
 assert.ok(q.flags.some(x=>x.id==='STOCKOUT'));
 assert.equal(JSON.stringify(s),before);assert.equal(Core.overview(s).cash,cash);
});
test('V2.9: alerta financeiro não altera passivos nem produz receitas fictícias',()=>{
 let s=career(29010);s=step(s,100);
 const base=JSON.stringify(s),q=Core.qualityReport(s,90);
 assert.equal(q.cashCents,Core.overview(s).cash);
 assert.equal(q.recognizedLiabilitiesCents,Core.balanceSheet(s).liabilities);
 assert.equal(JSON.stringify(s),base);
 assert.equal(q.balanced,true);
});
test('V2.9: arquivo compactado inválido não pode contornar validação do inventário ou do razão',()=>{
 let s=career(29011),dirty=JSON.parse(JSON.stringify(s));
 dirty.world.business.products[0].stockUnits=9999;
 assert.throws(()=>Core.exportSaveCompact(dirty),/Estoque|concili|Saldos/i);
});
test('V2.9: HTML único incorpora painel de QA e ferramenta de backup opcional sem script externo',()=>{
 const html=readFileSync('index.html','utf8');
 for(const id of ['qa-v290-title','qa-v290-summary','qa-v290-flags','qa-v290-units',
   'qa-save-health-btn','qa-save-size','export-compact-btn'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/v3\.0\.0-alpha\.1/);
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new Script(scripts[0][2]));
});
