import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/print-and-custom.css', import.meta.url), 'utf8');
const listeners = new Map();
const nodes = new Map();
function elem(id='') {
  return {
    id, dataset: {}, innerHTML: '', textContent: '', value: '', children: [],
    style: {setProperty(k,v){this[k]=v}},
    classList: {toggle(){}, add(){}, remove(){}, contains(){return false}},
    addEventListener(k,fn){if (!listeners.has(id)) listeners.set(id,{}); listeners.get(id)[k]=fn},
    appendChild(c){this.children.push(c)}, setAttribute(){}, focus(){},
    getBoundingClientRect(){return {left:0, top:0, width:400, height:225}},
    querySelector(sel){return sel === '.croqui-zoom-stage' ? stage : null},
    closest(){return null},
    setPointerCapture(){},hasPointerCapture(){return false},
    get clientWidth(){return 400},get clientHeight(){return 225}
  };
}
const stage=elem('stage');
const surface=elem('surface'); surface.dataset.croquiView='front';
const get = id => { if(!nodes.has(id)) nodes.set(id,elem(id)); return nodes.get(id); };
const document = {
  addEventListener(){}, getElementById:get, createElement:() => elem('generated'),
  querySelector(sel) { if(sel === '[data-croqui-view="front"]') return surface; return null; },
  querySelectorAll(sel) {
    if(sel === '[data-croqui-view]') return [surface];
    if(sel === '.croqui-zoom-stage') return [stage];
    if(sel === '.croqui-surface') return [surface];
    return [];
  }
};
const ctx={document, window:{}, console, localStorage:{setItem(){},getItem(){return null}}, Date, Math, Promise, setTimeout(){return 1},clearTimeout(){}};
vm.createContext(ctx); vm.runInContext(src,ctx);
const run = code => vm.runInContext(code,ctx);
run(`appState=createDefaultState(); updateAllBadgesAndStats=()=>{};saveToLocalStorage=()=>{};showToast=()=>{};setActiveCroquiView('front'); setupDiagramInteractions()`);
const event=(id,x,y)=>({pointerId:id,button:0,clientX:x,clientY:y,target:{closest(){return null}},preventDefault(){},cancelable:true});
const send=(type,id,x,y)=>{const fn=listeners.get('surface')?.[type];assert.ok(fn,type);fn(event(id,x,y));};
const count=()=>run('appState.pins.length');
// Two fingers pinch: increase zoom without adding any damage markers.
send('pointerdown',1,100,100);
send('pointerdown',2,200,100);
send('pointermove',2,300,100);
assert.ok(run('croquiZoom') > 1.9,'pinch increases zoom');
send('pointerup',2,300,100);
send('pointerup',1,100,100);
listeners.get('surface').click(event(1,110,110));
assert.equal(count(),0,'pinch cannot create a pin');
// At zoom, single pointer moves the image instead of changing the viewpoint.
const oldView=run('activeCroquiView');
send('pointerdown',3,110,110);
send('pointermove',3,165,140);
assert.ok(run('croquiPanX') > 0,'pan moves image horizontally');
assert.ok(run('croquiPanY') > 0,'pan moves image vertically');
send('pointerup',3,165,140);
assert.equal(run('activeCroquiView'),oldView);
assert.equal(count(),0,'pan cannot create pin');
// Zoom reset also resets the image position.
run('setCroquiZoom(1)');
assert.equal(run('croquiPanX'),0);assert.equal(run('croquiPanY'),0);
// At 100%, a horizontal swipe changes the view but cannot create an avaria.
send('pointerdown',4,210,110);
send('pointermove',4,120,110);
send('pointerup',4,120,110);
assert.equal(run('activeCroquiView'),'front-left','swipe advances view at normal zoom');
listeners.get('surface').click(event(4,120,110));
assert.equal(count(),0,'swipe cannot create pin');
// Print summary uses count only, with no pill.
const renderStart=src.indexOf('function renderDamagePins()');
const renderPart=src.slice(renderStart,src.indexOf('function updatePinDesc(',renderStart));
assert.match(renderPart,/class="croqui-print-count/);
assert.doesNotMatch(renderPart,/\$\{grouped\[view\.id\]\.length\} ponto\(s\)/);
assert.match(css,/touch-action:none !important/);
assert.match(css,/\.croqui-print-count/);
assert.equal(JSON.parse(fs.readFileSync(new URL('../version.json',import.meta.url))).version,'1.5.10');
console.log('OK: pinça, pan no zoom, proteção contra pontos involuntários e contagem discreta no PDF v1.5.10.');
