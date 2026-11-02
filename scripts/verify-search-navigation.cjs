const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {readSearchNavigation:read,syncSearchNavigation:sync} = require('../src/utils/searchNavigation.ts');
let checks = 0;
function check(name, condition) { assert.ok(condition,name); checks++; }
function setup(href='https://danavago.com/',state=null) {
  global.window={location:new URL(href),history:{state,replaceState(next,_,url){this.state=next;window.location=new URL(url,window.location.href);}}};
}
const params={from:'Đà Nẵng',to:'Huế',date:'2099-11-02',passengers:2};
setup('https://danavago.com/?from=Đà+Nẵng&to=Huế&date=2099-11-02&passengers=2&step=search');
check('Legacy links import Vietnamese cities',read().get('from')==='Đà Nẵng');
check('Legacy links import search step',read().get('step')==='search');
sync(params,'search');
check('Owned query parameters removed',window.location.href==='https://danavago.com/');
check('Clean results reload retains origin and destination',read().get('from')==='Đà Nẵng' && read().get('to')==='Huế');
check('Clean results reload retains date and passengers',read().get('date')===params.date && read().get('passengers')==='2');
check('Clean results reload retains results step',read().get('step')==='search');
sync(params,'home');
check('Home refresh stays home',read().get('step')==='home');
check('Home address stays clean',window.location.search==='');
setup('https://danavago.com/?from=Hội+An&utm_source=partner#routes',{router:'preserve'});
sync(params,'home');
check('Preserve unrelated query/anchor',window.location.search==='?utm_source=partner'&&window.location.hash==='#routes');
check('Preserve another router history state',window.history.state.router==='preserve');
setup('https://danavago.com/?step=lookup&code=DG123');sync(params,'lookup');
check('Ticket reference remains usable',window.location.search==='?code=DG123');
check('Lookup state survives cleanup',read().get('step')==='lookup');
for(const path of ['/app','/app/','/admin','/administrator']) {
 setup('https://danavago.com'+path+'?from=Hà+Nội',{unrelated:true}); const before=window.location.href;
 sync(params,'home');check('Do not mutate '+path,window.location.href===before&&window.history.state.unrelated===true);
 check('Do not restore website search on '+path,[...read()].length===0);
}
setup('https://danavago.com/',{danavaSearch:{version:1,params:{from:42,to:null,date:{},passengers:'bad'},step:'payment'}});
check('Malformed saved values ignored',[...read()].length===0);
setup('https://danavago.com/',{danavaSearch:{version:99,params,step:'search'}});
check('Unknown schema ignored',[...read()].length===0);
setup('https://danavago.com/?from=Hội+An',{danavaSearch:{version:1,params,step:'search'}});
check('Explicit link supersedes prior history',read().get('from')==='Hội An'&&read().get('to')===null);
setup(); window.history.replaceState=()=>{throw Error('blocked')}; assert.doesNotThrow(()=>sync(params,'home'));checks++;
delete global.window;assert.doesNotThrow(()=>sync(params,'home'));check('SSR read is empty',[...read()].length===0);
console.log(JSON.stringify({passed:checks}));
