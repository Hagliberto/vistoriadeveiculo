import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html=read('index.html'), js=read('assets/app.js'), css=read('assets/print-and-custom.css');
const views=['front','front-left','left','rear-left','rear','rear-right','right','front-right','top'];
for (const key of views) {
  assert.match(html,new RegExp(`data-view-card="${key}"`), `Vista ${key} presente`);
  assert.match(html,new RegExp(`data-croqui-view="${key}"`), `Vista ${key} interativa`);
  assert.match(html,new RegExp(`id="pins-layer${key==='top'?'':'-'+key}"`), `Pontos independentes: ${key}`);
  assert.match(html,new RegExp(`src="assets/croqui/${key}\\.webp"`), `Imagem ${key}`);
  const f=new URL(`../assets/croqui/${key}.webp`,import.meta.url);
  assert.ok(fs.statSync(f).size>5000,`Referência incorporada: ${key}`);
  assert.match(read('service-worker.js'),new RegExp(`croqui/${key}\\.webp`), `Cache offline: ${key}`);
}
assert.equal((html.match(/data-view-card=/g)||[]).length,9);
assert.match(js,/addEventListener\('pointerdown'/);
assert.match(js,/addEventListener\('pointerup'/);
assert.match(js,/suppressClickUntil/);
assert.match(js,/Math\.abs\(dx\) >= 48/);
assert.match(css,/@media print[\s\S]*croqui-views-grid[\s\S]*grid-template-columns:repeat\(2/);
assert.equal(JSON.parse(read('version.json')).version,'1.5.7');

function makeEl() {
  const listeners={};
  return {
    listeners, dataset:{}, innerHTML:'', textContent:'', children:[], style:{setProperty(){}},
    classList:{toggle(){},add(){},remove(){}},
    setAttribute(){},addEventListener(ev,fn){(listeners[ev] ||= []).push(fn)},
    fire(ev,data){for(const fn of listeners[ev]||[])fn(data)},
    appendChild(child){this.children.push(child)},
    querySelector(sel){return sel==='.croqui-zoom-stage'?{getBoundingClientRect:()=>({left:0,top:0,width:500,height:280})}:null},
    getBoundingClientRect(){return {left:0,top:0,width:500,height:280}}
  };
}
const nodes=new Map(); const get=id=>{if(!nodes.has(id))nodes.set(id,makeEl());return nodes.get(id)};
const surfaces=views.map(key=>{const el=makeEl();el.dataset.croquiView=key;return el});
const cards=views.map(key=>{const el=makeEl();el.dataset.viewCard=key;return el});
const doc={
 addEventListener(){},getElementById:get,createElement:makeEl,
 querySelector(){return null},
 querySelectorAll(sel){if(sel==='[data-croqui-view]')return surfaces;if(sel==='[data-view-card]')return cards;if(sel==='.croqui-zoom-stage'||sel==='.damage-type-btn'||sel==='[data-croqui-nav]')return [];return []}
};
const ctx={document:doc,window:{},localStorage:{getItem(){return null},setItem(){}},console,Date,Math,Promise,setTimeout(){return 0},clearTimeout(){}};
vm.createContext(ctx);vm.runInContext(js,ctx);
const run=code=>vm.runInContext(code,ctx);
run('setupDiagramInteractions()');
assert.equal(run('activeCroquiView'),'front');
const surface=surfaces[0];
const target={closest(){return null}};
surface.fire('pointerdown',{pointerId:2,button:0,clientX:400,clientY:100,target});
surface.fire('pointerup',{pointerId:2,clientX:300,clientY:102,preventDefault(){}});
assert.equal(run('activeCroquiView'),'front-left','Arraste esquerda avança para 45°');
surface.fire('click',{target,clientX:300,clientY:102});
assert.equal(run('appState.pins.length'),0,'Arraste não gera avaria involuntária');
const surface45=surfaces[1];
surface45.fire('pointerdown',{pointerId:4,button:0,clientX:280,clientY:120,target});
surface45.fire('pointerup',{pointerId:4,clientX:350,clientY:121,preventDefault(){}});
assert.equal(run('activeCroquiView'),'front','Arraste direita retorna à frontal');
const legacy=run(`normalizeState({pins:[{id:1,x:10,y:15,view:'top',type:'Risco',desc:''},{id:2,x:25,y:45,view:'left',type:'Quebrado',desc:''}],checklist:{},vehicle:{},signatures:{},meta:{}})`);
assert.deepEqual(Array.from(legacy.pins,p=>p.view),['top','left']);
console.log('OK: nove vistas da prancha, WebP offline, swipe com mouse/toque, proteção contra marcação e compatibilidade de dados.');
