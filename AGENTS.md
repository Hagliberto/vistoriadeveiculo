# AGENTS.md — Especificação Técnica e Guia de Evolução: Vistoria Veicular PWA

## 1. Visão Geral e Arquitetura
- **Projeto:** Checklist Digital de Vistoria Veicular (PWA Mobile-First & Offline-First).
- **Stack:** HTML5 semântico, Tailwind CSS (via CDN), JavaScript Vanilla (ES6+), Phosphor Icons, SVG inline.
- **Restrição Arquitetural:** Aplicação **100% client-side** (zero backend obrigatório). Deve funcionar perfeitamente aberta localmente ou hospedada em ambientes estáticos (GitHub Pages / Intranet corporativa).
- **Persistência:** `localStorage` (chave `vistoria_veicular_pwa_v2` ou superior com migração retrocompatível) ou `IndexedDB` quando houver armazenamento de imagens.

---

## 2. Identidade Visual e Padrões de UI/UX
- **Paleta Corporativa Principal:**
  - Azul Escuro Institucional: `#004b93` (`corp.dark`)
  - Azul Principal / Ação: `#0072ce` (`corp.main`)
  - Azul Superfície / Destaque suave: `#f0f7ff` (`corp.surface`) e `#e6f2fc` (`corp.light`)
  - Fundo da aplicação: `#f4f7fa`
- **Sistema de Expanders (Acordeões):**
  - Todos os 9 blocos principais (`Identificação`, `6 categorias de checklist`, `Croqui Visual`, `Observações e Assinaturas`) iniciam **fechados por padrão** (`.expander-card` sem classe `.is-open`).
  - Cada expander mantém borda esquerda de `5px` (`border-l-[5px]`) e fundo de cabeçalho suave com cor temática distinta (`accentColor` e `bgColor` definidos em `CHECKLIST_SCHEMA`).
  - Badges dinâmicos (`0/6 preenchidos`, `0/8 verificados`, `0 avarias`, `Pendente`) devem ser atualizados em tempo real a cada interação.
- **Barra de Controle Global:**
  - Botões compactos apenas com ícones SVG (`w-10 h-10`, atributos `title` e `aria-label` obrigatórios para acessibilidade).
- **Ergonomia Mobile:**
  - Alvos de toque com altura mínima de `42px` (`.touch-target-btn`).
  - Modais de confirmação customizados (nunca usar `window.confirm()` ou `window.alert()` nativos).

---

## 3. Regras Críticas de Geração de PDF e Impressão (`@media print`)
Qualquer atualização neste projeto **DEVE** preservar e aprimorar a qualidade do laudo técnico impresso em papel **A4 Retrato** (`@page { size: A4 portrait; margin: 10mm 11mm; }`), obedecendo às seguintes regras:

1. **Zero Cortes e Proteção de Quebra:**
   - Nunca permitir que um título de seção fique órfão no final de uma página: aplicar `break-after: avoid; page-break-after: avoid;` em `.expander-header`.
   - Aplicar `break-inside: avoid; page-break-inside: avoid;` em linhas individuais (`[id^="row-"]`), no cabeçalho oficial (`#print-official-header`), no bloco do croqui (`#exp-croqui`) e no bloco de assinaturas (`#exp-assinaturas`).
   - Seções longas de checklist **não** devem ter `break-inside: avoid` no contêiner pai `.expander-card`, para não gerar grandes espaços em branco; a quebra deve ocorrer apenas entre linhas `[id^="row-"]`.
2. **Renderização Segura de Assinaturas:**
   - Na função `prepareAndPrint()`, converter os dados dos `<canvas>` (`appState.signatures`) para elementos `<img class="print-only">` renderizados dentro dos boxes de assinatura, garantindo nitidez vetorial/raster sem cortes ou canvases em branco no PDF.
3. **Ocultação de Elementos de UI:**
   - Todo botão de ação, barra de ferramentas, barra de progresso, ícones decorativos de cabeçalho e inputs vazios devem receber `.no-print` ou serem ocultados via CSS `@media print`.
4. **Exibição Condicional de Status e Observações:**
   - Na impressão, ocultar botões não selecionados e exibir apenas o selo correspondente ao status escolhido (`Conforme`, `Avaria`, `N/A`) ou `"Não verificado"`.
   - Campos de observação individual (`.obs-container`) só devem aparecer no PDF se contiverem texto (`.has-content`).
5. **Sincronização Pré-Impressão:**
   - `prepareAndPrint()` deve preencher data/hora exata de emissão, atualizar todos os contadores do cabeçalho `#print-official-header`, sincronizar imagens de assinatura e aguardar renderização antes de invocar `window.print()`.

---

## 4. Estrutura de Estado (`appState`)
Manter compatibilidade com a estrutura de dados central:
```javascript
{
  meta: {
    id: "UUID ou timestamp",
    updatedAt: "ISOString",
    gps: { lat: null, lng: null } // opcional
  },
  vehicle: {
    data: "YYYY-MM-DD",
    tipo: "Entrada | Saída | Periódica | Transferência",
    vistoriador: "",
    motorista: "",
    placa: "",
    modelo: "",
    ano: "",
    cor: "",
    km: "",
    combustivel: "Reserva | 1/4 | 1/2 | 3/4 | Cheio",
    obsGerais: ""
  },
  checklist: {
    "[section_id]_[index]": {
      status: "ok | nok | na | null",
      obs: "",
      photo: null // Base64 comprimido opcional
    }
  },
  pins: [
    {
      id: 1700000000000,
      x: 50.0, // percentual 4..96
      y: 50.0, // percentual 6..94
      type: "Amassado | Risco | Quebrado | Faltando",
      desc: "",
      photo: null // Base64 comprimido opcional
    }
  ],
  signatures: {
    "sig-vistoriador": "data:image/png;base64,...",
    "sig-motorista": "data:image/png;base64,..."
  }
}
---

## 11. Regras de Interface e Histórico — v1.3.0

- **Desktop:** checklist em duas colunas a partir de 1280 px (com opção de lista), navbar inferior de ícones e barra lateral recolhida ao iniciar. A barra superior concentra as ações globais, sem minicard redundante.
- **Ações individuais de categoria:** as seis categorias oferecem um controle independente **Tudo conforme**; nunca modificar os itens de outras categorias. Antes de sobrescrever uma classificação `nok` (avaria) ou `na`, exigir confirmação customizada. Preservar observações e fotos existentes.
- **Histórico de versões arquivadas:** cada clique em **Salvar Vistoria Atual no Histórico** cria um registro com `meta.archiveId` exclusivo e `meta.savedAt`, ainda que `meta.id` (protocolo original) se repita. Nunca substituir silenciosamente um arquivo anterior pelo mesmo protocolo. Migração de históricos antigos sem `archiveId` é obrigatória.
- **Operações concorrentes:** gravar inclusões/exclusões do histórico em fila para impedir perdas em cliques consecutivos. Excluir pelo identificador exclusivo do arquivo, não por índice que possa mudar durante uma gravação assíncrona.
- **Modal sobre modal:** `confirm-modal` deve ficar acima dos demais, o modal anterior fica `inert` durante a confirmação, e o foco retorna ao controle de origem após cancelar ou confirmar. `Escape` deve operar apenas sobre o modal superior.
- **Recursos locais:** todos os ícones utilizados devem existir no pacote `assets/icons.js`; manter o funcionamento offline após a primeira carga do PWA. A mídia `print` deve ocultar todas as ações novas.


## Atualização sob demanda — v1.4.0
- Requer `version.json` acessível na origem da aplicação, sem cache, para detectar versão mais recente.
- `APP_VERSION` em `assets/app.js` deve coincidir com `version.json` e `CACHE_NAME` do service worker.
- Não ativar automaticamente novas versões no evento `install`; apenas após clique do usuário e salvamento completo.
- Preservar a compatibilidade de armazenamento local/IndexedDB e o funcionamento offline.

## Ajustes de interface — v1.4.1
- O crédito nominal do desenvolvedor deve aparecer somente no painel de Configurações, não na navbar inferior.
- O card `#workspace-heading` deve permanecer visível em desktop e oculto em telas de até 599px.
- Atualizar simultaneamente `version.json`, `APP_VERSION`, `service-worker.js` e rótulos de versão em novas releases.
