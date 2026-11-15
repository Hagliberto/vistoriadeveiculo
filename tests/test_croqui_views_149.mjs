import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const nodes = new Map();
const viewCards = new Map();

function node() {
  return {
    innerHTML: '',
    style: { setProperty(name, value) { this[name] = value; } },
    children: [],
    className: '',
    textContent: '',
    title: '',
    dataset: {},
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    focus() {}
  };
}
const get = id => {
  if (!nodes.has(id)) nodes.set(id, node());
  return nodes.get(id);
};
const query = sel => {
  const m = sel.match(/^\[data-view-card="([^"]+)"\]$/);
  if (m) {
    if (!viewCards.has(m[1])) viewCards.set(m[1], node());
    return viewCards.get(m[1]);
  }
  return null;
};

const ctx = {
  console,
  document: {
    addEventListener() {},
    getElementById: get,
    createElement: node,
    querySelector: query
  },
  window: {},
  Date,
  Math,
  Promise
};
vm.createContext(ctx);
vm.runInContext(app, ctx);
const run = code => vm.runInContext(code, ctx);

for (const key of ['top','left','right','front','rear']) {
  assert.ok(html.includes(`data-croqui-view="${key}"`), `Visão ${key} precisa existir no HTML`);
}
assert.ok(html.includes('Visão superior'));
assert.ok(html.includes('Lateral esquerda'));
assert.ok(html.includes('Lateral direita'));
assert.ok(html.includes('Frontal'));
assert.ok(html.includes('Traseira'));

const normalized = run(`normalizeState({meta:{},vehicle:{data:'2026-11-15',tipo:'Entrada',vistoriador:'',motorista:'',placa:'',modelo:'',ano:'',cor:'',km:'',combustivel:'1/2',obsGerais:''},checklist:{},pins:[{id:1,x:10,y:20,type:'Risco',desc:'A',photo:null},{id:2,x:20,y:30,view:'left',type:'Quebrado',desc:'B',photo:null}],signatures:{}})`);
assert.equal(normalized.pins[0].view, 'top');
assert.equal(normalized.pins[1].view, 'left');

run(`appState.pins=[
  {id:101,x:10,y:12,view:'top',type:'Risco',desc:'capô',photo:null},
  {id:102,x:20,y:22,view:'left',type:'Quebrado',desc:'porta do motorista',photo:null},
  {id:103,x:30,y:32,view:'rear',type:'Amassado',desc:'porta-malas',photo:null}
]; renderDamagePins();`);
assert.equal(get('pins-layer').children.length, 1);
assert.equal(get('pins-layer-left').children.length, 1);
assert.equal(get('pins-layer-rear').children.length, 1);
assert.equal(get('croqui-count-top').textContent, '1 ponto(s)');
assert.equal(get('croqui-count-left').textContent, '1 ponto(s)');
assert.equal(get('croqui-count-right').textContent, '0 ponto(s)');
assert.ok(get('damage-list').children[1].innerHTML.includes('Lat. esquerda'));
assert.ok(get('damage-list').children[2].innerHTML.includes('Traseira'));
assert.equal(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url))).version, '1.5.1');
assert.ok(fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8').includes('shell-v1.5.1'));
console.log('OK: croqui em múltiplas visões, migração de view, contadores e versionamento v1.5.1.');
