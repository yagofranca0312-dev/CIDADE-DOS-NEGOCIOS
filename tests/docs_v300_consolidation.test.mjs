import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';

// V3.0-06: travas documentais, não homologa release nem executa gameplay.
const read=p=>readFileSync(p,'utf8');
const readme=read('README.md'),changelog=read('CHANGELOG.md'),
  roadmap=read('docs/ROADMAP.md'),guide=read('docs/JOGAR_GUIA_V300.md'),
  contract=read('docs/V300_CONTRATO_DOCUMENTACAO.md'),
  core=read('src/core/game.js'),ui=read('src/ui/app.js'),
  template=read('src/shell/index.template.html'),
  pkg=JSON.parse(read('package.json'));
const readmeTop=readme.split('## Histórico da última versão homologada')[0];
const changelogTop=changelog.split('## 2.9.0 —')[0];
const roadmapTop=roadmap.split('## Histórico de planejamento')[0];

test('V3.0-06: documentos distinguem promocao excepcional e arquivo historico',()=>{
  assert.equal(pkg.version,'3.3.0');
  assert.match(core,/const VERSION = '3\.3\.0'/);
  assert.match(template,/<title>Cidade dos Negócios 1 · v3\.3\.0<\/title>/);
  assert.match(readmeTop,/3\.0\.0/);
  assert.match(readmeTop,/2\.9\.0/);
  assert.match(readmeTop,/excepcional/i);
  assert.match(readmeTop,/#39/);
  assert.match(changelogTop,/excepcional/i);
  assert.match(changelogTop,/NÃO representa nova versão liberada|Não representa nova versão liberada/);
  assert.match(readmeTop,/082faa4626cf5cb0fc54c9ef092bddd86ffce54c/);
  assert.doesNotMatch(readmeTop,/Nenhum tributo brasileiro está calculado|Apenas um estabelecimento é operável/);
});

test('V3.0-06: roadmap atual explicita oito gates, plano de consolidação antes da V3.1',()=>{
  for(let i=1;i<=8;i++)assert.match(roadmapTop,new RegExp('3\\.0\\.0-0'+i));
  assert.match(roadmapTop,/INTEGRAL|integral/i);
  assert.match(roadmapTop,/V3\.1/);
  assert.match(roadmapTop,/BLOQUEADO/);
  assert.match(roadmapTop,/históric/i);
  assert.match(roadmap,/## P0 — Fundação/,'histórico original do roadmap foi apagado');
  assert.match(changelog,/## 2\.9\.0 —/,'registro V2.9 foi apagado');
  assert.match(readme,/## Histórico da última versão homologada/,'README perdeu arquivo histórico');
});

test('V3.0-06: tutorial usa os cinco menus existentes e compra confirmada',()=>{
  assert.match(template,/data-view="cidade"/);
  for(const key of ['empresa:dashboard','mercado:compras','administrativo:rh-dp','administrativo:contabilidade','sistema'])
    assert.match(template,new RegExp('data-v31-open="'+key+'"'));
  for(const section of ['financas','logistica','rh-dp','contabilidade','fiscal','paralegal'])
    assert.match(template,new RegExp('data-section-pane="administrativo:'+section+'"'));
  for(const heading of ['Antes de jogar','Começar uma carreira','Compras planejadas','Módulos empresariais',
    'Fiscal: não confundir','Salvar, restaurar','Limites conhecidos'])
    assert.ok(guide.includes(heading),'guia sem: '+heading);
  assert.match(guide,/Revisar e confirmar compra planejada/);
  assert.match(template,/id="v300a-apply"/);
  assert.match(guide,/até cinco estabelecimentos/);
  assert.match(guide,/JSON tradicional V1/);
  assert.match(guide,/V2\.9 ou posterior/);
  assert.match(guide,/localStorage/);
  assert.match(ui,/Core\.dispatch\(state/);
});

test('V3.0-06: avisos do fiscal do jogo impedem promessas de apuração legal',()=>{
  for(const text of [readmeTop,guide,contract]){
    assert.match(text,/Fiscal Operacional/);
    assert.match(text,/2026/);
    assert.match(text,/(fictíci|simulad)/i);
    assert.match(text,/(2027|2027\+)/);
  }
  assert.match(guide,/UNSUPPORTED/);
  assert.match(guide,/NOT_COVERED/);
  assert.match(guide,/SPED/);
  assert.match(guide,/PGDAS-D/);
  assert.match(guide,/Reinf/);
  assert.match(guide.replaceAll('**',''),/não apuram? tributos?/i);
  assert.match(contract,/não indica imposto zero/);
  assert.match(read('docs/V24C_IMPLANTACAO.md'),/sem multa ou pagamento automático/i);
  assert.match(read('docs/FISCAL_V19.md'),/UNSUPPORTED.*não significa|não significa isenção/);
});

test('V3.0-06: referências locais canônicas apontam a arquivos existentes',()=>{
  const sources=[
    ['README.md',readmeTop],['README.md',readme.split('## Funcionalidades implementadas na linha atual')[1]],
    ['CHANGELOG.md',changelogTop],['docs/ROADMAP.md',roadmapTop],
    ['docs/JOGAR_GUIA_V300.md',guide],['docs/V300_CONTRATO_DOCUMENTACAO.md',contract]
  ];
  let seen=0;
  for(const [file,source] of sources){
    assert.ok(typeof source==='string','fragmento ausente: '+file);
    const re=/\[[^\]]+\]\(([^)]+)\)/g;
    for(const [,uri] of source.matchAll(re)){
      if(/^https?:\/\//.test(uri)||uri.startsWith('#'))continue;
      const target=decodeURIComponent(uri.split('#')[0]);
      if(!target||target.includes(' '))continue;
      assert.equal(existsSync(resolve(dirname(file),target)),true,'Link quebrado em '+file+': '+uri);
      seen++;
    }
  }
  assert.ok(seen>=20,'links locais insuficientes para referenciar a documentação unificada');
});

test('V3.0-06: documentação não confunde auditoria com homologação e conserva próximos gates',()=>{
  assert.match(readmeTop,/DRAFT/);
  assert.match(contract,/3\.0\.0-06/);
  assert.match(contract,/3\.0\.0-07/);
  assert.match(contract,/3\.0\.0-08/);
  assert.match(roadmapTop,/NÃO HOMOLOGAD|não homologad/i);
  assert.match(changelogTop,/NÃO representa nova versão liberada|Não representa nova versão liberada/);
  assert.match(read('docs/V300_PATCH_A_ECONOMIA_BALANCEAMENTO.md'),/prioridade aprovada posteriormente/);
});
