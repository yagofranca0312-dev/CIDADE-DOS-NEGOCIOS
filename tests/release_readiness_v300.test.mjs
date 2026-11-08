import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const read=path=>readFileSync(path,'utf8');
const evidence=JSON.parse(read('docs/V300_READINESS_EVIDENCE.json'));
const pkg=JSON.parse(read('package.json'));
const gateSource=read('docs/V300_CONSOLIDACAO_INTEGRAL_GATES.md');
const ui=read('src/ui/app.js');
const run=(...args)=>spawnSync(process.execPath,['tools/v300-release-gate.mjs',...args],{
  encoding:'utf8',timeout:20000
});

test('V3.0-08: inventário possui oito checkpoints em ordem e 18 requisitos explícitos',()=>{
  assert.equal(evidence.schemaVersion,1);
  assert.equal(evidence.assessment,'V300-08');
  assert.equal(evidence.releaseTarget,'3.0.0');
  assert.equal(evidence.checkpointStatus.length,8);
  assert.equal(evidence.requirements.length,18);
  assert.deepEqual(evidence.checkpointStatus.map(r=>r.id),
    Array.from({length:8},(_,i)=>'3.0.0-0'+(i+1)));
  assert.equal(new Set(evidence.requirements.map(r=>r.id)).size,18);
});

test('V3.0-08: cores históricos e branch ainda não são release V3.0 homologada',()=>{
  assert.equal(pkg.version,'3.0.0-alpha.1');
  assert.equal(evidence.stableBaseline.version,'2.9.0');
  assert.equal(evidence.stableBaseline.sha,'082faa4626cf5cb0fc54c9ef092bddd86ffce54c');
  assert.equal(evidence.mainAtAudit,'871df2b1cd133bcad717c0194a474a35fbabcd3c');
  assert.equal(evidence.releaseCandidate.ref,null);
  assert.equal(evidence.releaseCandidate.sha,null);
  assert.equal(evidence.releaseCandidate.ciUrl,null);
  assert.match(gateSource,/\*\*BLOQUEADO\*\*/);
});

test('V3.0-08: gates 01–05 permanecem parciais e 06/07 somente técnica/documental',()=>{
  assert.deepEqual(evidence.checkpointStatus.slice(0,5).map(r=>r.status),
    ['PARTIAL','PARTIAL','PARTIAL','PARTIAL','PARTIAL']);
  assert.deepEqual(evidence.checkpointStatus.slice(5).map(r=>r.status),
    ['PASS_DOCUMENTAL_CI','PASS_TECHNICAL_CI','BLOCKED']);
  for(const row of evidence.checkpointStatus){
    assert.ok(row.evidence&&row.open);
  }
});

test('V3.0-08: persistência com write-ahead é proteção automatizada, QA real continua aberto',()=>{
  const save=ui.split('  function persistLocal(candidate){')[1]?.split('  function backupCurrent(){')[0];
  const commit=ui.split('  function commit(type,payload={}){')[1]?.split('  // Rotas anteriores')[0];
  assert.ok(save&&commit,'Contrato UI de persistência candidato não localizado');
  assert.match(save,/Core\.exportSave\(candidate\)/);
  assert.match(save,/localStorage\.setItem\(KEY,contents\)/);
  assert.match(save,/localStorage\.getItem\(KEY\)!==contents/);
  assert.match(commit,/if\(!persistLocal\(result\.state\)\)return false;/);
  assert.ok(commit.indexOf('persistLocal(result.state)')<commit.indexOf('state=result.state'),
    'O estado só pode mudar depois de confirmar a persistência');
  const r=evidence.requirements.find(x=>x.id==='RG-06');
  assert.equal(r.status,'PARTIAL','Windows hospedado não substitui QA da instalação pessoal');
  assert.match(r.evidence,/actions\/runs\/42432588846/);
});

test('V3.0-08: CI Windows headless é parcial e não inventa QA pessoal/mobile',()=>{
  const hostedPartial=new Set(['RG-08','RG-09','RG-10','RG-12','RG-13','RG-15','RG-16']);
  for(const id of ['RG-08','RG-09','RG-10','RG-11','RG-12','RG-13','RG-14','RG-15','RG-16']){
    const row=evidence.requirements.find(x=>x.id===id);
    assert.equal(row.status,hostedPartial.has(id)?'PARTIAL':'NOT_EXECUTED',id);
    if(hostedPartial.has(id))assert.match(row.evidence,id==='RG-09'?/actions\/runs\/42434425027/:(id==='RG-13'||id==='RG-16')?/actions\/runs\/42437328042/:id==='RG-15'?/actions\/runs\/42485124066/:/actions\/runs\/42432588846/);
    else assert.equal(row.evidence,null,id);
  }
  assert.equal(evidence.requirements.find(x=>x.id==='RG-18').status,'NOT_GRANTED');
  assert.equal(evidence.requirements.find(x=>x.id==='RG-17').status,'NOT_CREATED');
});

test('V3.0-08: auditoria ordinária devolve NO_GO sem falhar CI de evidência',()=>{
  const r=run();
  assert.equal(r.error,undefined);
  assert.equal(r.status,0,r.stderr);
  const line=r.stdout.split('\n').find(x=>x.startsWith('V300_RELEASE_READINESS '));
  assert.ok(line,'Relatório auditável ausente');
  const out=JSON.parse(line.slice('V300_RELEASE_READINESS '.length));
  assert.equal(out.decision,'NO_GO');
  assert.equal(out.notAHomologation,true);
  assert.equal(out.verifiedRequirements,5);
  assert.equal(out.unresolved.length,13);
  assert.ok(!out.unresolved.some(x=>x.id==='RG-07'));
  assert.equal(evidence.requirements.find(x=>x.id==='RG-07').status,'VERIFIED');
  assert.match(evidence.requirements.find(x=>x.id==='RG-07').evidence,/42435965283/);
  assert.equal(out.totalRequirements,18);
  assert.equal(out.gatesNotCompleted.length,5);
  assert.equal(out.candidateMissingFields.length,3);
  assert.equal(out.versionMismatch,true);
  assert.ok(out.unresolved.some(x=>x.id==='RG-06'));
  assert.ok(out.unresolved.some(x=>x.id==='RG-18'));
});

test('V3.0-08: modo --require-go BLOQUEIA promoção com exit code 2',()=>{
  const r=run('--require-go');
  assert.equal(r.error,undefined);
  assert.equal(r.status,2);
  assert.match(r.stdout,/"decision":"NO_GO"/);
  assert.match(r.stderr,/RELEASE_BLOCKED/);
});

test('V3.0-08: scripts separados distinguem auditoria de tentativa de liberar',()=>{
  assert.equal(pkg.scripts['audit:release'],'node tools/v300-release-gate.mjs');
  assert.equal(pkg.scripts['audit:release:require-go'],'node tools/v300-release-gate.mjs --require-go');
  const workflow=read('.github/workflows/ci.yml');
  assert.match(workflow,/run: npm run audit:release/);
  assert.doesNotMatch(workflow,/run: npm run audit:release:require-go/);
  assert.match(workflow,/run: npm run check/);
  assert.match(workflow,/run: npm run bench:stability/);
  assert.match(workflow,/run: npm run bench:consolidation/);
});
