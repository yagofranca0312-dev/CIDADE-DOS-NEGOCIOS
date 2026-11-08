import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const evidence=JSON.parse(read('docs/V300_READINESS_EVIDENCE.json'));
const workflow=read('.github/workflows/qa-windows-v300.yml');
const build=read('tools/build.mjs');
const docs=read('docs/V300_QA_WINDOWS_HOSTED.md');

test('V3.0 QA Windows: execução possui 33 verificações Chrome/Edge e SHA atestado',()=>{
  const a=evidence.windowsHostedAudit;
  assert.ok(a&&a.result==='SUCCESS');
  assert.equal(a.assertions,33);
  assert.equal(a.os,'Windows NT 10.0.26100.0');
  assert.deepEqual(a.browsers,['Chrome 156 (headless)','Edge 156 (headless)']);
  assert.equal(a.fileOrigin,'file://');
  assert.equal(a.actualQuotaReached,true);
  assert.equal(a.reloadAfterClosingBrowser,true);
  assert.equal(a.exportImportJsonOnDisk,true);
  assert.match(a.ciUrl,/42432588846/);
});

test('V3.0 QA Windows: prova Chrome/Edge hosted NÃO é QA de saves reais e não homologa',()=>{
  assert.equal(evidence.windowsHostedAudit.realUserSaveTested,false);
  assert.equal(evidence.windowsHostedAudit.personalWindowsInstallationTested,false);
  assert.equal(evidence.windowsHostedAudit.physicalMobileTested,false);
  for(const id of ['RG-06','RG-08','RG-10','RG-12']){
    const r=evidence.requirements.find(x=>x.id===id);
    assert.equal(r.status,'PARTIAL');
    assert.match(r.evidence,/42432588846/);
  }
  for(const id of ['RG-09','RG-11','RG-13','RG-14','RG-15','RG-16']){
    assert.equal(evidence.requirements.find(x=>x.id===id).status,'NOT_EXECUTED');
  }
  assert.equal(evidence.checkpointStatus.find(x=>x.id==='3.0.0-08').status,'BLOCKED');
});

test('V3.0 QA Windows: HTML gerado tem contrato de bytes idênticos a git show',()=>{
  const q=evidence.crossPlatformHtml;
  assert.equal(q.status,'PASS_BYTE_IDENTICAL');
  assert.equal(q.bytes,1479945);
  assert.equal(q.sha256,'3dea7a0560ae97ec6b994a470068ce7d72fd9eff18f07779584ef9095cb8e398');
  assert.match(q.windowsObservedCI,/42432588846/);
  assert.ok(build.includes(".replace(/\\r\\n?/g,'\\n');"));
  const verifier=read('tools/verify-html-byte-identical-v300.mjs');
  assert.match(verifier,/HEAD:index\.html/);
  assert.match(verifier,/assert\.equal\(localHash,gitHash/);
});

test('V3.0 QA Windows: Chrome e Edge reais não entram nas dependências do jogo',()=>{
  assert.match(workflow,/runs-on: windows-latest/);
  assert.match(workflow,/node tools\/qa-windows-browser-v300\.mjs/);
  assert.match(workflow,/playwright@1\.55\.1/);
  assert.match(workflow,/node tools\/verify-html-byte-identical-v300\.mjs/);
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies?.playwright,undefined);
  assert.equal(pkg.devDependencies?.playwright,undefined);
  const html=read('index.html');
  assert.doesNotMatch(html,/playwright@1\.55\.1/);
});

test('V3.0 QA Windows: documento ressalva que não houve QA pessoal nem mobile físico',()=>{
  assert.match(docs,/33\/33/);
  assert.match(docs,/GitHub Actions/);
  assert.match(docs,/file:\/\//);
  assert.match(docs,/QuotaExceededError/);
  assert.match(docs,/NO-GO/);
  assert.match(docs,/NÃO EXECUTADO/);
  assert.match(docs,/SHA-256/);
});
