// V3.0 / Etapa 8: gate documental de prontidão. Não promove, não publica,
// não faz merge, não cria release, não lê saves reais e não consulta rede.
// CI VERDE neste script significa auditoria executada, NÃO GO para release.
import {readFileSync} from 'node:fs';

const file='docs/V300_READINESS_EVIDENCE.json';
const manifest=JSON.parse(readFileSync(file,'utf8'));
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const validStatus=new Set(['VERIFIED','PARTIAL','NOT_VERIFIED','NOT_EXECUTED','NOT_CREATED','NOT_GRANTED']);
const unique=new Set();

if(manifest.schemaVersion!==1||manifest.assessment!=='V300-08'||
    manifest.releaseTarget!=='3.0.0'||!Array.isArray(manifest.requirements)||
    !Array.isArray(manifest.checkpointStatus)||
    manifest.requirements.length!==18||manifest.checkpointStatus.length!==8)
  throw Error('Matriz de prontidão inválida ou incompleta');
for(const row of manifest.requirements){
  if(!/^RG-\d\d$/.test(row.id)||unique.has(row.id)||
      !validStatus.has(row.status)||typeof row.label!=='string'||!row.label)
    throw Error('Requisito inválido/duplicado: '+row.id);
  unique.add(row.id);
  if(row.status==='VERIFIED' && (typeof row.evidence!=='string'||!row.evidence.trim()))
    throw Error('Requisito marcado VERIFIED sem referência de evidência: '+row.id);
}
const gates=manifest.checkpointStatus;
for(let i=0;i<8;i++)if(gates[i].id!=='3.0.0-0'+(i+1))
  throw Error('Ordem dos checkpoints inválida');
const unresolved=manifest.requirements
  .filter(row=>row.status!=='VERIFIED')
  .map(row=>({id:row.id,type:row.type,status:row.status,label:row.label}));
const gateBlockers=gates.slice(0,7).filter((row,i)=>{
  if(i<5)return row.status!=='PASS';
  return !['PASS','PASS_DOCUMENTAL_CI','PASS_TECHNICAL_CI'].includes(row.status);
}).map(row=>({id:row.id,status:row.status}));
const missingReleaseCandidate=[
  ['ref',manifest.releaseCandidate?.ref],
  ['sha',manifest.releaseCandidate?.sha],
  ['ciUrl',manifest.releaseCandidate?.ciUrl]
].filter(([,value])=>typeof value!=='string'||!value.trim()).map(([key])=>key);
const versionMismatch=pkg.version!==manifest.releaseTarget;
const releaseGateBlocked=gateBlockers.length>0||unresolved.length>0||
  missingReleaseCandidate.length>0||versionMismatch;
const output={
  contract:'V300_RELEASE_GATE_V1',
  decision:releaseGateBlocked?'NO_GO':'READY_FOR_HUMAN_RELEASE_APPROVAL',
  notAHomologation:true,
  currentVersion:pkg.version,
  requestedVersion:manifest.releaseTarget,
  baseline:manifest.stableBaseline.ref,
  automatedEvidence:manifest.latestVerifiedAudit,
  verifiedRequirements:manifest.requirements.length-unresolved.length,
  totalRequirements:manifest.requirements.length,
  unresolved,gatesNotCompleted:gateBlockers,
  candidateMissingFields:missingReleaseCandidate,
  versionMismatch,
  note:'Este verificador lê somente declarações documentadas. CI PASS não certifica QA manual; referências exigem verificação humana independente. Nunca homologa ou cria release.'
};
console.log('V300_RELEASE_READINESS '+JSON.stringify(output));
if(process.argv.includes('--require-go')&&releaseGateBlocked){
  console.error('RELEASE_BLOCKED: critérios não satisfeitos. Sem merge, tag, snapshot ou homologação.');
  process.exitCode=2;
}
