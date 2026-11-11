// Excecao de release autorizada pelo titular. Nunca transforma QA ausente em VERIFIED.
// Apenas valida que a dispensa e explicita e que o pacote e o baseline estao coerentes.
// A promocao real exige CI no commit exato, merge revisado e checkpoint.
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(x,'utf8');
const fail=x=>{throw Error('V300_EXCEPTION_INVALID: '+x);};
const w=JSON.parse(read('docs/V300_OWNER_EXCEPTION.json'));
const m=JSON.parse(read('docs/V300_READINESS_EVIDENCE.json'));
const p=JSON.parse(read('package.json'));
const core=read('src/core/game.js');
const html=read('index.html');
const template=read('src/shell/index.template.html');
const required=['RG-05','RG-06','RG-08','RG-09','RG-10','RG-11','RG-12','RG-13','RG-14','RG-15','RG-16'];
const expectedNonrelease=m.requirements.filter(r=>r.status!=='VERIFIED'&&r.type!=='RELEASE').map(r=>r.id).sort();
if(w.contract!=='V300_OWNER_EXCEPTION_V1'||w.status!=='OWNER_AUTHORIZED'||
    w.ownerInstruction!=='entao desconsidere esta nescessidade e homolohue'||
    w.version!=='3.0.0')fail('Autorizacao expressa nao corresponde ao protocolo aprovado');
if(JSON.stringify([...new Set(w.waivedRequirements)].sort())!==JSON.stringify(required.sort())||
    JSON.stringify(expectedNonrelease)!==JSON.stringify(required.sort()))
  fail('Dispensas diferentes das pendencias reais da matriz ordinaria');
if(JSON.stringify(w.nonWaivedRequirements)!==JSON.stringify(['RG-17','RG-18']))
  fail('Gate de candidata e aceite nao podem ser dispensados');
if(w.waiverEffect!=='ASSUMED_RISK_NOT_TESTED_NOT_VERIFIED')
  fail('Dispensa nao pode afirmar falsamente que testes ausentes foram executados');
if(m.stableBaseline.sha!=='082faa4626cf5cb0fc54c9ef092bddd86ffce54c'||
   w.stableRollback.commit!==m.stableBaseline.sha)fail('Baseline V2.9 divergente');
if(!['3.0.0','3.1.0','3.2.0','3.3.0','3.3.1'].includes(p.version)||!core.includes("const VERSION = '"+p.version+"';")||
   !template.includes('<title>Cidade dos Negócios 1 · v'+p.version+'</title>')||
   !html.includes("const VERSION = '"+p.version+"';")||
   /3\.0\.0-alpha\.1/.test(html))fail('Artefato de promocao nao identificado de modo consistente');
if(!w.technicalBaseline.windowsCi?.includes('/actions/runs/42507651978')||
   !w.technicalBaseline.linuxCi?.includes('/actions/runs/42507651867')||
   w.technicalBaseline.sourceCommit!=='4257600b972f4e77905bb60b9cdf517c3b05e6cd')
  fail('Fontes tecnicas originais nao estao registradas');
if(!read('docs/HOMOLOGACAO_V300_EXCEPCIONAL.md').includes('Não é uma certificação'))
  fail('Termo de risco nao foi preservado');
const result={contract:'V300_EXCEPTION_RELEASE_GATE_V1',
  decision:'OWNER_EXCEPTION_AUTHORIZED_FOR_PROMOTION',
  waiverDoesNotProveTests:true,
  ordinaryReleaseReadiness:'NO_GO',
  originalVerified:m.requirements.filter(x=>x.status==='VERIFIED').length,
  originalTotal:m.requirements.length,
  waived:required,
  remainingExternalActions:['ci_exato_versao_3.0.0','merge_verificado','ci_main','checkpoint_release'],
  releaseNotPerformedByGate:true,
  physicalMobileTested:false,privateSaveTested:false,gameplaySubjectiveAcceptedByQA:false};
console.log('V300_EXCEPTION_RELEASE_READINESS '+JSON.stringify(result));
