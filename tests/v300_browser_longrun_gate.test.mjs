import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const evidence=JSON.parse(read('docs/V300_READINESS_EVIDENCE.json'));
const longrun=evidence.browserLongrunQA;
const workflow=read('.github/workflows/qa-windows-v300.yml');
const script=read('tools/qa-windows-longrun-v300.mjs');
const report=read('docs/V300_QA_CARREIRA_LONGA_BROWSER.md');

test('V3.0 P1-03: 365 dias 4/4 PASS, 1825 dias 0/4 por quota real; não inventar PASS',()=>{
  assert.equal(longrun.status,'PARTIAL_QUOTA_LIMITED');
  assert.equal(longrun.completed365,4);
  assert.equal(longrun.total365,4);
  assert.equal(longrun.completed1825,0);
  assert.equal(longrun.total1825,4);
  assert.equal(longrun.blockedByStorage,4);
  assert.equal(longrun.hardFailures,0);
  assert.equal(longrun.releaseBlocking,true);
  assert.match(longrun.ciUrl,/42485124066/);
  assert.match(longrun.issue,/\/issues\/40/);
  assert.equal(evidence.requirements.find(x=>x.id==='RG-15').status,'PARTIAL');
  assert.equal(evidence.checkpointStatus.find(x=>x.id==='3.0.0-05').status,'PARTIAL');
  assert.equal(evidence.checkpointStatus.find(x=>x.id==='3.0.0-08').status,'BLOCKED');
  assert.equal(evidence.requirements.filter(x=>x.status==='VERIFIED').length,5);
});

test('V3.0 P1-03: saves sintéticos do longrun falharam entre dias 425 e 1655',()=>{
  assert.deepEqual(longrun.scenarios.map(x=>[x.browser,x.units,x.lastPersistedDay]),[
    ['chrome',1,1625],['chrome',5,425],['msedge',1,1655],['msedge',5,425]
  ]);
  assert.ok(longrun.scenarios.every(x=>x.completed365&&x.saveBytesAtBlock>4_800_000));
  assert.ok(longrun.scenarios.every(x=>x.compactBytesAtBlock<x.saveBytesAtBlock));
  assert.equal(longrun.failClosedOnQuota,true);
  assert.equal(longrun.originalSavedStateRecovered,true);
  assert.equal(longrun.exportJsonVerified,true);
  assert.equal(longrun.compactRoundtripVerified,true);
  assert.equal(longrun.solutionImplemented,false);
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
  assert.match(report,/4\/4 cenários de 365 dias/);
  assert.match(report,/0\/4 cenários alcançaram 1\.825 dias/);
  assert.match(report,/P0-04/);
  assert.match(report,/NO-GO/);
  assert.equal(evidence.requirements.find(x=>x.id==='RG-17').status,'NOT_CREATED');
  assert.equal(evidence.requirements.find(x=>x.id==='RG-18').status,'NOT_GRANTED');
});
