import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const evidence=JSON.parse(read('docs/V300_READINESS_EVIDENCE.json'));
const longrun=evidence.browserLongrunQA;
const workflow=read('.github/workflows/qa-windows-v300.yml');
const script=read('tools/qa-windows-longrun-v300.mjs');
const report=read('docs/V300_P004_PERSISTENCIA_INDEXEDDB.md');

test('V3.0 P0-04: atual IndexedDB 365/1825 4/4 PASS, histórico localStorage 0/4 preservado',()=>{
  assert.equal(longrun.status,'PASS_ALL_SCENARIOS_HOSTED_WINDOWS_PERSONAL_QA_PENDING');
  assert.equal(longrun.completed365,4);
  assert.equal(longrun.total365,4);
  assert.equal(longrun.completed1825,4);
  assert.equal(longrun.total1825,4);
  assert.equal(longrun.blockedByStorage,0);
  assert.equal(longrun.hardFailures,0);
  assert.equal(longrun.releaseBlocking,true,'QA pessoal continua necessário');
  assert.equal(longrun.solutionImplemented,true);
  assert.equal(longrun.persistenceMode,'indexeddb');
  assert.match(longrun.ciUrl,/42488245360/);
  assert.match(longrun.issue,/\/issues\/40/);
  assert.equal(longrun.previousFailure.status,'PARTIAL_QUOTA_LIMITED');
  assert.equal(longrun.previousFailure.completed1825,0);
  assert.equal(longrun.previousFailure.blockedByStorage,4);
  assert.match(longrun.previousFailure.ciUrl,/42485124066/);
  assert.equal(evidence.requirements.find(x=>x.id==='RG-15').status,'PARTIAL');
  assert.equal(evidence.checkpointStatus.find(x=>x.id==='3.0.0-05').status,'PARTIAL');
  assert.equal(evidence.checkpointStatus.find(x=>x.id==='3.0.0-08').status,'BLOCKED');
  assert.equal(evidence.requirements.filter(x=>x.status==='VERIFIED').length,5);
});

test('V3.0 P0-04: quatro browsers/lojas chegam ao dia 1825 e save compacto ultrapassa quota legada',()=>{
  assert.deepEqual(longrun.scenarios.map(x=>[x.browser,x.units,x.lastPersistedDay]),[
    ['chrome',1,1825],['chrome',5,1825],['msedge',1,1825],['msedge',5,1825]
  ]);
  assert.ok(longrun.scenarios.every(x=>x.completed365&&x.completed1825));
  assert.ok(longrun.scenarios.filter(x=>x.units===5).every(x=>x.saveBytesAt1825>5_000_000));
  assert.ok(longrun.scenarios.every(x=>x.exportedTraditionalBytesAt1825>x.saveBytesAt1825));
  assert.ok(longrun.scenarios.every(x=>x.exportedTraditionalBytesAt1825<25_000_000));
  assert.equal(longrun.failClosedOnQuota,true);
  assert.equal(longrun.originalSavedStateRecovered,true);
  assert.equal(longrun.exportJsonVerified,true);
  assert.equal(longrun.compactRoundtripVerified,true);
  assert.equal(longrun.solutionImplemented,true);
});

test('V3.0 P1-03: QAs longos são DOM real/UI Windows hosted, 5 empresas usam capital fictício de fixture',()=>{
  assert.match(script,/assert\.equal\(process\.platform,'win32'/);
  assert.match(script,/launchPersistentContext/);
  assert.match(script,/pathToFileURL\(resolve\('index\.html'\)\)/);
  assert.match(script,/for\(const target of \[365,1825\]\)/);
  assert.match(script,/for\(const channel of \['chrome','msedge'\]\)/);
  assert.match(script,/for\(const units of \[1,5\]\)/);
  assert.match(script,/page\.locator\('#v221-hud-time'\)\.click\(\)/);
  assert.match(script,/data-v221-time/);
  assert.match(script,/await hudAdvance\(page,days\)/);
  assert.match(script,/Performance\.getMetrics/);
  assert.match(script,/exportSaveCompact/);
  assert.match(script,/BLOCKED_STORAGE/);
  assert.match(script,/failClosed:true/);
  assert.match(script,/fiction|FICTÍCIO|FICTIC|SINTÉTICO|sintético|FICTITIO/);
  assert.match(workflow,/node tools\/qa-windows-longrun-v300\.mjs/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.match(workflow,/v300-browser-longrun-metrics/);
});

test('V3.0 P1-03: sem acesso a save privado ou aceite; NO-GO e issue explícitos',()=>{
  assert.equal(longrun.actualUserSaveUsed,false);
  assert.equal(longrun.actualPersonalWindowsTested,false);
  assert.equal(longrun.physicalMobileTested,false);
  assert.equal(longrun.subjectiveVisualReviewCompleted,false);
  assert.equal(longrun.releaseBlocking,true);
  assert.match(report,/4\/4 cenários de 365 dias PASS/);
  assert.match(report,/4\/4 de 1\.825 dias PASS/);
  assert.match(report,/P0-04/);
  assert.match(report,/NO-GO/);
  assert.equal(evidence.requirements.find(x=>x.id==='RG-17').status,'NOT_CREATED');
  assert.equal(evidence.requirements.find(x=>x.id==='RG-18').status,'NOT_GRANTED');
});
