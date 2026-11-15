import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const src = read('assets/app.js');
const html = read('index.html');
const listeners = new Map();
const nodes = new Map();
function elem(id='') {
 return { id, dataset:{}, innerHTML:'', textContent:'', className:'', children:[],
  style:{setProperty(k,v){this[k]=v}},
  classList:{toggle(){},add(){},remove(){},contains(){return false}},
  addEventListener(k,fn){if(!listeners.has(id))listeners.set(id,{});listeners.get(id)[k]=fn},
  appendChild(c){this.children.push(c)},setAttribute(){},focus(){},
  getBoundingClientRect(){return {left:0,top:0,width:400,height:225}},
  querySelector(sel){return sel==='.croqui-zoom-stage'?stage:null},
  closest(){return null},setPointerCapture(){},hasPointerCapture(){return false},
  get clientWidth(){return 400},get clientHeight(){return 225}
 };
}
const stage=elem('stage'), surface=elem('surface');surface.dataset.croquiView='front';
const get = id=>{if(!nodes.has(id))nodes.set(id,elem(id));return nodes.get(id)};
const doc={addEventListener(){},getElementById:get,createElement:()=>elem('generated'),
 querySelector(sel){if(sel==='[data-croqui-view="front"]')return surface;return null},
 querySelectorAll(sel){if(sel==='[data-croqui-view]')return [surface];if(sel==='.croqui-zoom-stage')return [stage];if(sel==='.croqui-surface')return [surface];return []}};
const ctx={document:doc,window:{},console,localStorage:{setItem(){},getItem(){return null}},Date,Math,Promise,setTimeout(){return 1},clearTimeout(){}};
vm.createContext(ctx);vm.runInContext(src,ctx);
const run=code=>vm.runInContext(code,ctx);
run(`appState=createDefaultState();updateAllBadgesAndStats=()=>{};saveToLocalStorage=()=>{};showToast=()=>{};setActiveCroquiView('front');setupDiagramInteractions()`);
const ev=(id,x,y)=>({pointerId:id,button:0,clientX:x,clientY:y,target:{closest(){return null}},preventDefault(){},cancelable:true});
const send=(kind,id,x,y)=>listeners.get('surface')[kind](ev(id,x,y));
const count=()=>run('appState.pins.length');
run('setCroquiZoom(2)');
// Pressionar sem mover marca um ponto mesmo com zoom, sem duplicar por click sintético.
send('pointerdown',1,150,100);send('pointerup',1,150,100);
assert.equal(count(),1,'Pressão estática com zoom deve marcar');
listeners.get('surface').click(ev(1,150,100));
assert.equal(count(),1,'Click nativo após pointerup não deve duplicar');
assert.equal(run('appState.pins[0].type'),'Amassado');
assert.equal(run('getDamagePinColor(appState.pins[0].type).fill'),'#be123c');
// Arraste da imagem ampliada NÃO marca, inclusive com movimento muito curto acima do limiar.
send('pointerdown',2,150,100);send('pointermove',2,200,115);send('pointerup',2,200,115);
assert.equal(count(),1,'Pan não deve marcar');
// Pinça não deve marcar.
send('pointerdown',3,120,100);send('pointerdown',4,200,100);
send('pointermove',4,240,100);send('pointerup',4,240,100);send('pointerup',3,120,100);
assert.equal(count(),1,'Pinça não deve marcar');
// A cor não depende do ID nem da posição.
assert.equal(run("getDamagePinColor('Amassado').fill"),'#be123c');
assert.equal(run("getDamagePinColor('Risco').fill"),'#1d4ed8');
assert.equal(run("getDamagePinColor('Quebrado').fill"),'#c2410c');
assert.equal(run("getDamagePinColor('Faltando').fill"),'#7e22ce');
assert.match(html,/sidebar-label">v1\.5\.8 • Offline/);
assert.match(html,/settings-version-pill">Versão 1\.5\.8/);
assert.match(src,/syncDisplayedAppVersion\(\);/);
assert.equal(JSON.parse(read('version.json')).version,'1.5.8');
assert.match(read('service-worker.js'),/shell-v1\.5\.8/);
console.log('OK: cores fixas por tipo, toque com zoom sem duplicação, pan/pinça e interface versionada 1.5.8.');
