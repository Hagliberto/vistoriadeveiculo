# Arquitetura e contratos técnicos

[Documentação](README.md) / Arquitetura

## Visão de componentes

```text
Navegador
 ├─ index.html                       Interface, expanders e relatório
 ├─ assets/app.css                  Estilos utilitários locais
 ├─ assets/print-and-custom.css     UI responsiva + impressão A4
 ├─ assets/app.js                   Estado, checklist, croqui e persistência
 ├─ assets/export.js                Seleção de conteúdo do laudo
 ├─ assets/icons.js                 Ícones locais
 ├─ assets/croqui/*.webp            Nove vistas do veículo
 ├─ IndexedDB / localStorage         Rascunho e histórico (por origem)
 └─ service-worker.js               Cache offline e atualização
```

A aplicação roda em HTML, CSS e JavaScript sem backend obrigatório. Arquivos estáticos são servidos diretamente. `manifest.webmanifest` define metadados instaláveis; `version.json` sinaliza a versão publicada.

## Contrato de dados

`appState` é normalizado ao recuperar dados e inclui, entre outros:

| Campo | Significado |
| --- | --- |
| `meta` | Protocolo, timestamps e identificador do arquivo histórico |
| `vehicle` | Identificação, modalidade e observações gerais |
| `checklist` | Respostas por ID da seção/item (`ok`, `nok`, `na`, `null`), observação e foto |
| `pins` | Avarias com ID, coordenadas percentuais, vista, região, tipo, descrição e foto |
| `signatures` | Assinaturas do vistoriador e motorista |

`CHECKLIST_SCHEMA` em `assets/app.js` é a referência para **47 itens em 6 categorias**. Não altere IDs sem migração. Compatibilidade com `vistoria_veicular_pwa_v2`, `v3` e histórico legado deve ser testada.

## Fluxos sensíveis

**Persistência:** gravar estado sem sobrescrever outro arquivamento do mesmo protocolo; histórico tem identificador exclusivo e atualizações serializadas.

**Croqui:** nove arquivos WebP; marcas vinculadas à vista; gestos não devem inserir pontos durante pan/pinça; cores por **tipo**, não por índice. Nomes esquerda/direita das imagens exigem validação física antes de mudança.

**Impressão:** `assets/export.js` controla visibilidade seletiva por classes, `assets/app.js` prepara e valida a impressão, `assets/print-and-custom.css` gera layout A4. O relatório deve refletir exatamente os dados exibidos e não alterar `appState`.

**PWA:** `version.json` deve corresponder a `APP_VERSION` e ao nome de cache do Service Worker. Cache de assets estáticos, com navegação priorizando rede e fallback offline; consulta à versão não deve ser servida de cache antigo. Atualização ativada somente com confirmação.

## Responsividade e segurança

- Em telas pequenas, cabeçalhos e pills não podem truncar; dock não pode cobrir controles essenciais.
- Os modais devem gerenciar foco, `Escape`, ordem de sobreposição e diálogo de confirmação.
- Entradas textuais vindas de arquivos/importação devem ser escapadas ao compor HTML.
- Fotos e assinaturas são dados pessoais potencialmente sensíveis; não adicionar telemetria nem upload automático sem requisitos claros.

Confira [AGENTS](../AGENTS.md) antes de implementar e [testes](testes.md) antes da publicação.
