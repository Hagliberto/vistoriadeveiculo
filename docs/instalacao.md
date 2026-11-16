# Instalação, execução e publicação

[Documentação](README.md) / Instalação

## Requisitos

Navegador moderno com JavaScript. O aplicativo não exige banco remoto, compilação, Node.js ou Python para uso. Node.js e Python são necessários somente para executar as suítes de teste.

## Abrir localmente

Extraia **toda a pasta** (incluindo `assets/`, `icons/` e `index.html`) e abra `index.html`. O checklist pode ser usado localmente; em `file://` o Service Worker e a instalação PWA não ficam disponíveis.

## Desenvolvimento em localhost

Na raiz do projeto, com Python 3 instalado:

```powershell
python -m http.server 8000
```

Acesse `http://localhost:8000/`. Não confunda os dados desse endereço com os de produção: são origens isoladas.

## Publicação na Cloudflare Pages

O repositório pode ser conectado ao Cloudflare Pages como **site estático**, com branch de produção `main`, sem comando de build e diretório de saída apontando para a **raiz**. Confirme os parâmetros na configuração do projeto e faça um Preview antes do merge. Domínio utilizado: [vistoriadeveiculo.pages.dev](https://vistoriadeveiculo.pages.dev/).

Não colocar os arquivos do pacote dentro de um subdiretório adicional que mude caminhos relativos. Teste acesso à raiz, CSS, JavaScript, imagens do croqui, `version.json` e `service-worker.js`.

## Instalação PWA e atualizações

Em HTTPS/localhost, um navegador compatível pode disponibilizar a instalação. O Service Worker mantém os recursos de interface e as nove imagens locais em cache após carregamento completo.

- `version.json` informa a versão publicada.
- `service-worker.js` usa cache nomeado por versão.
- A atualização é acionada pelo usuário quando disponibilizada, preservando o rascunho; não force a instalação automática de um worker novo.

**Importante:** limpar os dados do site para “resolver cache” pode apagar vistorias; prefira o fluxo normal de atualização e faça backup antes de ações destrutivas.

## GitHub Pages

O projeto também pode ser publicado como site estático; certifique-se de configurar corretamente a origem e os caminhos. Mudança de domínio/origem altera a área de armazenamento do navegador.
