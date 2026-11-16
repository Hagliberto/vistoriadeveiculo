import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const nodes = new Map();
const viewCards = new Map();
const navDots = new Map();
const stages = [makeNode(), makeNode(), makeNode()];

function makeNode() {
  return {
    innerHTML: '',
    style: { setProperty(name, value) { this[name] = value; } },
    children: [],
    className: '',
    textContent: '',
    title: '',
    value: '',
    dataset: {},
    attributes: {},
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    focus() {},
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
  };
}
const get = id => {
  if (!nodes.has(id)) nodes.set(id, makeNode());
  return nodes.get(id);
};
for (const id of ['top','left','front','right','rear']) {
  const card = makeNode();
  card.dataset.viewCard = id;
  viewCards.set(id, card);
  const dot = makeNode();
  dot.dataset.croquiNav = id;
  navDots.set(id, dot);
}
const query = sel => {
  const cardMatch = sel.match(/^\[data-view-card="([^"]+)"\]$/);
  if (cardMatch) return viewCards.get(cardMatch[1]) || null;
  return null;
};
const queryAll = sel => {
  if (sel === '[data-view-card]') return [...viewCards.values()];
  if (sel === '.croqui-zoom-stage') return stages;
  if (sel === '[data-croqui-nav]') return [...navDots.values()];
  return [];
};

const ctx = {
  console,
  document: {
    addEventListener() {},
    getElementById: get,
    createElement: makeNode,
    querySelector: query,
    querySelectorAll: queryAll,
  },
  window: {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  setTimeout() { return 1; },
  clearTimeout() {},
  Date,
  Math,
  Promise,
};
vm.createContext(ctx);
vm.runInContext(app, ctx);
const run = code => vm.runInContext(code, ctx);

for (const id of ['btn-croqui-prev-view', 'btn-croqui-next-view', 'btn-croqui-zoom-in', 'btn-croqui-zoom-out', 'btn-croqui-zoom-reset', 'croqui-zoom-level', 'croqui-view-legend', 'print-croqui-miniatures-grid', 'croqui-active-view-label', 'croqui-active-view-desc']) {
  assert.ok(html.includes(`id="${id}"`), `${id} precisa existir no HTML`);
}
assert.ok(!html.includes('id="croqui-region-select"'), 'seletor antigo de região não deve existir');
assert.ok(html.includes('Navegar pelas vistas do veículo'));
assert.ok(html.includes('Resumo do croqui por visão'));

const normalized = run(`normalizeState({meta:{},vehicle:{data:'2026-11-15',tipo:'Entrada',vistoriador:'',motorista:'',placa:'',modelo:'',ano:'',cor:'',km:'',combustivel:'1/2',obsGerais:''},checklist:{},pins:[{id:7,x:22,y:24,view:'front',region:'Região inválida',type:'Quebrado',desc:'teste',photo:null}],signatures:{}})`);
assert.equal(normalized.pins[0].view, 'front');
assert.equal(normalized.pins[0].region, 'Capô');

assert.equal(run(`detectCroquiRegion('front', 80, 50)`), 'Farol direito');
assert.equal(run(`detectCroquiRegion('rear', 50, 70)`), 'Placa traseira');
assert.equal(run(`detectCroquiRegion('left', 20, 85)`), 'Roda dianteira esquerda');

run(`setActiveCroquiView('rear')`);
assert.equal(get('croqui-active-view-label').textContent, 'Traseira (180°)');
assert.match(get('croqui-active-view-desc').textContent, /lanternas|traseira/i);
assert.equal(navDots.get('rear').attributes['aria-pressed'], 'true');

run(`setCroquiZoom(1.45)`);
assert.equal(get('croqui-zoom-level').textContent, '145%');
assert.ok(stages.every(stage => stage.style.transform === 'translate(0px, 0px) scale(1.45)'));

run(`appState=createDefaultState(); appState.pins=[
  {id:201,x:12,y:16,view:'front',region:'Farol direito',type:'Quebrado',desc:'quebrado',photo:null},
  {id:202,x:44,y:26,view:'left',region:'Porta dianteira esquerda',type:'Risco',desc:'risco leve',photo:null}
]; renderDamagePins();`);
assert.ok(get('print-croqui-miniatures-grid').innerHTML.includes('Frontal'));
assert.ok(get('print-croqui-miniatures-grid').innerHTML.includes('Farol direito'));
assert.ok(get('damage-list').children[0].innerHTML.includes('Região:'));
assert.ok(get('damage-list').children[0].innerHTML.includes('Farol direito'));

run(`updateAllBadgesAndStats = () => {}; updatePinRegion(201, 'Para-choque dianteiro')`);
const updatedRegion = run(`appState.pins.find(p => p.id === 201).region`);
assert.equal(updatedRegion, 'Para-choque dianteiro');
assert.equal(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).version, '1.5.10');
assert.ok(fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8').includes('shell-v1.5.10'));
console.log('OK: croqui 360° v1.5.10 com zoom discreto, detecção de região e resumo por visão.');
