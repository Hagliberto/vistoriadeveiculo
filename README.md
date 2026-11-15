# Vistoria Veicular — Checklist Digital

> **Versão profissional 1.4.5 (14/11/2026)** · HTML + CSS + JavaScript puro · offline-first · sem servidor de dados

Aplicação de inspeção de veículos com **47 verificações distribuídas em 6 categorias**, identificação, controle do nível de combustível, croqui interativo, registros fotográficos, assinaturas digitais e geração de laudo técnico em papel A4/PDF.

## Como usar

**Uso local no Windows (sem instalação e sem internet):** descompacte a pasta inteira e abra `index.html` no Chrome, Edge ou Firefox. Não separe o HTML dos diretórios `assets/` e `icons/`. Todas as folhas de estilo e ícones já estão incluídos; não é necessário ter conexão com uma CDN.

**Instalação como aplicativo PWA:** publique a pasta em um endereço **HTTPS**, ou use `localhost` durante desenvolvimento. Ao acessar, o navegador compatível poderá oferecer **Instalar App**. Depois de uma primeira visita carregada por completo, o service worker mantém a interface disponível quando a internet não estiver acessível. Em `file://` o checklist também funciona, mas a instalação PWA e o service worker **não** estão disponíveis (restrição dos navegadores).

**Hospedagem no GitHub Pages:** coloque todos os arquivos desta versão na raiz de seu repositório estático. Em *Settings → Pages*, publique a branch `main` usando a pasta `/ (root)`. O app não exige Cloudflare Workers, D1 ou outra API. O armazenamento permanece **local ao navegador/dispositivo** e não sincroniza automaticamente entre dispositivos.

## Interface profissional no desktop e no celular

- **Área de trabalho WIDE:** duas colunas de expanders a partir de 1280 px, com opção **Lista** para quem preferir blocos na largura total. A preferência fica salva no navegador.
- **Appbar:** os seis ícones de ação ficam na barra superior, sem o antigo minicard. Ações: expandir/recolher, histórico, marcar tudo Conforme, limpar e imprimir.
- **Navbar inferior:** atalhos para dados, croqui, checklist, assinaturas, histórico, impressão e configurações.
- **Sidebar recolhida por padrão:** pode ser expandida no desktop ou aberta como menu sobreposto no celular.
- **Configurações:** engrenagem no dock inferior e na sidebar, mostrando versão e pill **Hagliberto Alves de Oliveira**.
- **Ação por categoria:** cada uma das seis categorias tem um ícone **Tudo conforme**. Caso exista uma avaria ou N/A, um diálogo solicita confirmação. A alteração nunca atinge outras categorias e preserva comentários e fotos.

## Correção do histórico

**Salvar Vistoria Atual no Histórico** cria uma **nova versão arquivada a cada salvamento**, mesmo quando o número de protocolo é igual. Cada arquivo recebe um identificador exclusivo e a data/hora do registro; o protocolo da vistoria é mantido. É possível guardar três, quatro, cinco ou mais versões, respeitando o espaço disponível no navegador. Ao apagar uma versão, as demais permanecem. O histórico antigo continua legível.

Uma versão arquivada **não significa sincronização com a nuvem**. Para cópia de segurança externa, exporte o JSON e guarde-o em local seguro. Em dispositivos sem IndexedDB, o armazenamento reduzido do navegador pode restringir o número de arquivos com fotos.

## Funcionalidades

- **Identificação:** data/tipo, vistoriador, motorista, placa, modelo, ano, cor, quilometragem e combustível.
- **Checklist:** 47 itens em seis grupos, com Conforme, Avaria e N/A, observações e foto por item. Todas as nove seções iniciam fechadas.
- **Croqui:** posição percentual de avarias, tipo, descrição e evidência fotográfica. Acesso por teclado: `Tab` para focar o croqui e `Enter` ou `Espaço` para inserir um ponto central.
- **Assinaturas:** campos de assinatura para vistoriador e motorista; assinaturas restauradas quando se abre uma vistoria salva.
- **Histórico:** salvar laudos, abrir, excluir ou criar uma vistoria de **Saída** a partir de uma de **Entrada**. Ao duplicar como Saída, é gerado novo protocolo e as assinaturas anteriores são removidas.
- **Backup:** exportação e importação de vistoria em JSON (incluindo fotos e assinaturas). Um JSON representa o estado completo da vistoria atual; o histórico inteiro não é exportado em lote.
- **Laudo A4:** quadro estático de identificação, contadores, status escolhido, observações efetivamente preenchidas, croqui, assinaturas convertidas em imagem e anexo fotográfico quando houver evidências. O comando **Imprimir/PDF** abre a janela de impressão do navegador.
- **Privacidade:** não há envio automático de dados, fotos, GPS ou assinaturas a servidores. A localização só é solicitada quando o usuário aciona o comando específico e permite o acesso.

## Armazenamento e compatibilidade

A aplicação usa **IndexedDB** quando disponível para guardar o rascunho completo e o histórico, inclusive fotografias. Usa também `localStorage` para recuperação e compatibilidade com as versões antigas (`vistoria_veicular_pwa_v2`, `vistoria_veicular_pwa_v3` e `vistoria_veicular_history_v1`). Caso IndexedDB esteja indisponível, o navegador tenta guardar localmente os dados; neste caso, o limite de espaço pode impedir vistorias com muitas fotos.

**Atenção:** os dados são mantidos no perfil do navegador e podem ser perdidos ao limpar dados do site, usar navegação anônima, trocar de dispositivo ou alterar a origem (por exemplo, de `file://` para uma URL de produção). Para preservar vistorias, **exporte o JSON de cada laudo importante** e mantenha backups externos. O JSON contém informações pessoais, fotos e assinaturas; guarde-o em local protegido.

A troca de origem (`file://`, `localhost`, domínio GitHub Pages) não migra automaticamente os dados, pois cada origem tem um armazenamento isolado.

## Impressão e PDF

1. Preencha a vistoria e toque no botão de gerar laudo (ícone de impressora). Se houver campos importantes faltando, o sistema oferece confirmar ou voltar para completar.
2. No diálogo do navegador, escolha **Salvar como PDF** ou sua impressora.
3. Se necessário, ajuste para **A4 / Retrato / Escala 100%**. Recomenda-se habilitar *Gráficos de plano de fundo* para fidelidade das cores.
4. Confira no pré-visualizador a divisão entre páginas, especialmente em vistorias com muitas fotos ou textos longos. A paginação final depende do motor de impressão e das fontes do navegador.

O projeto prepara o relatório **sem depender de serviços externos de PDF**. Os espaços de assinatura são convertidos em imagens antes de imprimir, e as linhas de checklist usam proteção contra corte.

## Estrutura do projeto

```text
index.html                  Interface da vistoria
assets/app.css              CSS de utilitários compilado (Tailwind empacotado)
assets/print-and-custom.css Estilos da interface, impressão A4, acessibilidade
assets/app.js               Lógica e armazenamento client-side
assets/icons.js             Ícones SVG locais
icons/icon-192.png          Ícone instalável
icons/icon-512.png          Ícone instalável de alta resolução
manifest.webmanifest        Metadados PWA
service-worker.js           Cache offline da interface
AGENTS.md                   Regras técnicas e padrões de evolução
CHANGELOG.md                Histórico desta consolidação
README.md                   Documentação de uso e publicação
tests/test_state.mjs        Testes do estado e máscaras (Node.js)
tests/test_static.py        Auditoria estrutural (Python 3)
```

## Verificações técnicas

O projeto não requer dependências para funcionar. Para executar os **testes opcionais** no terminal (caso tenha Node.js e Python instalados):

```powershell
node .\tests\test_state.mjs
python .\tests\test_static.py
node --check .\assets\app.js
node --check .\assets\icons.js
node --check .\service-worker.js
```

Testes estruturais e unitários não substituem uma vistoria completa em um aparelho real e o exame de PDFs longos. Para homologação, teste em Chrome/Edge e ao menos um navegador móvel: editar/restaurar, tirar fotos, desenhar as duas assinaturas, salvar/abrir histórico, exportar/importar JSON e imprimir documentos com várias páginas.

## Como aplicar no repositório existente

Antes de substituir arquivos, confirme que alterações suas foram salvas no Git ou copiadas para um backup. Extraia o conteúdo do ZIP na raiz do seu repositório `vistoriadeveiculo`, **sem apagar a pasta `.git`**. Os dois arquivos `index.html` fornecidos foram comparados; a versão com histórico, fotos e melhorias de PDF serviu de base, complementada pelas regras do `AGENTS.md`.

Depois execute no terminal PowerShell, na pasta do repositório:

```powershell
git status
git diff --check
git add index.html assets icons manifest.webmanifest service-worker.js AGENTS.md README.md CHANGELOG.md tests .gitignore
git commit -m "feat: consolidar vistoria veicular profissional offline-first"
git push origin main
```

Se preferir revisar antes de publicar, permaneça na branch existente `feature/vistoria-profissional-v1.0.0` (ou crie uma branch específica `feature/vistoria-profissional-v1.3.0`) e abra um pull request após testar. O projeto foi entregue **sem executar commit ou push** no seu computador ou remoto.

## Limitações assumidas

- A interface é 100% local e funciona sem rede; a instalação PWA depende de HTTPS ou localhost.
- GPS depende de permissão e disponibilidade do dispositivo; em `file://` pode ser bloqueado pelo navegador.
- Arquivos JSON não são criptografados. Mantenha backups protegidos.
- Assinaturas desenhadas na tela não constituem, por si só, assinatura digital com certificado ICP-Brasil.
- O histórico é local, sem sincronização na nuvem nem controle multiusuário.

## Testes de regressão (Node.js e Python)

```powershell
node tests/test_state.mjs
node tests/test_history.mjs
node tests/test_modals.mjs
python tests/test_static.py
```

Veja [tests/QA_MANUAL.md](tests/QA_MANUAL.md) para a conferência visual de desktop, mobile, histórico, confirmações e impressão.

### Atualizações da versão 1.3.0
No desktop, a navegação usa ícones coloridos. Em telas até 1023px, o botão **Ações** da navegação inferior exibe os comandos de inspeção sem criar uma segunda linha no cabeçalho. O botão **Tudo conforme** de cada categoria alterna entre selecionar e desmarcar apenas os itens daquela categoria. Somente uma seção pode permanecer aberta.


## Atualizações (v1.4.0)
Hospede os arquivos completos em HTTPS (GitHub Pages, Cloudflare Pages ou intranet HTTPS).
Publique `version.json` com o número exato da nova versão (ex.: `1.5.0`), atualize `APP_VERSION` em `assets/app.js` e o nome `CACHE_NAME` no `service-worker.js` a cada release.
**Importante:** todos os arquivos da nova versão devem estar publicados antes de atualizar `version.json`; recomenda-se publicar tudo na mesma implantação atômica.
Ao abrir, voltar à aba ou retornar à conexão, o app verifica a versão. Quando houver uma versão mais nova, o botão **Atualizar** aparece acima da navbar.
O botão salva o rascunho, ativa o service worker em espera e recarrega a página quando ele assumir o controle. Sem internet ou em `file://`, a verificação remota não funciona.
Durante a primeira migração da versão 1.3.0, o service worker antigo pode ativar a v1.4.0 automaticamente; o novo fluxo de confirmação vale para as versões seguintes.

## Ajustes visuais v1.4.1
No celular (até 599px), o card de apresentação da área de trabalho é ocultado. A identificação do desenvolvedor aparece somente em Configurações, acessível pela engrenagem.

## Navegação v1.4.3
A ordem das etapas na tela, na barra inferior e na sidebar é **Dados → Croqui → Checklist → Assinaturas**. A sidebar recolhida apresenta os ícones com cores de cada etapa; ao expandir, aparecem descrições curtas. A seção ativa acompanha o expander aberto.

### Exportar e compartilhar (v1.4.4)
A opção **Exportar** abre um modal de quatro escolhas: **Salvar como PDF** (abre o mesmo laudo A4 da impressão; selecione “Salvar como PDF” no diálogo do navegador), **Baixar PNG** (imagem 2x do relatório com croqui, fotos e assinaturas, ajustada ao limite do navegador), **Compartilhar** (prioriza PDF pela Web Share API e usa PNG apenas se o PDF não for aceito) e **Imprimir** (impressão A4). O PDF direto é gerado integralmente no navegador, sem bibliotecas de terceiros ou conexão externa. A opção Imprimir continua abrindo o diálogo nativo com o CSS A4 existente. Compartilhar depende do navegador e de contexto HTTPS; quando indisponível, o aplicativo oferece download do arquivo local, sem enviar dados a servidor.


### Qualidade de exportação (v1.4.4)
PDF direto com páginas A4 em JPEG de aproximadamente 200 dpi, gerado offline. O texto do PDF compartilhável é rasterizado; para imprimir com texto selecionável e layout CSS, use **Imprimir → Salvar como PDF**. Documentos muito grandes dependem dos limites de memória do navegador. Faça homologação com fotos e assinaturas em celular.

### Fidelidade do PDF à impressão (v1.4.5)
A opção **Salvar como PDF** usa o mesmo `validateAndPrint()` e `prepareAndPrint()` da impressão. Selecione **Destino → Salvar como PDF**, papel **A4**, escala **100%/padrão** e, se necessário, **Gráficos de fundo**. O arquivo PDF de **Compartilhar** continua sendo gerado como raster para a Web Share API e pode ter aparência diferente; os navegadores não expõem o PDF do diálogo de impressão ao JavaScript.


### PDF oficial (v1.4.6)

A única fonte do layout PDF é `@media print`: os botões **Salvar como PDF**, **Imprimir** e **Compartilhar PDF oficial** usam `validateAndPrint()` e `prepareAndPrint()`. Na janela de impressão do Chrome/Edge escolha **Salvar como PDF**, A4, 1 página por folha, gráficos de segundo plano ativados e cabeçalhos/rodapés desativados. Para compartilhar, anexe o PDF salvo no aplicativo de destino. A Web Share API não oferece acesso ao arquivo PDF gerado pelo diálogo nativo, portanto não há envio automático do PDF oficial.


### Central de exportação simplificada (v1.4.7)
O menu oferece **Salvar como PDF**, **Baixar em PNG** e **Imprimir**. A antiga opção Compartilhar PDF oficial foi retirada porque apenas repetia a ação Salvar como PDF. O PDF A4 é salvo pelo diálogo nativo de impressão e pode ser anexado depois a WhatsApp/e-mail. Não é possível compartilhar diretamente o PDF emitido pelo diálogo do navegador por JavaScript.


### Croqui em várias visões (v1.4.9)

O croqui agora exibe o veículo em **cinco ângulos**: visão superior, lateral esquerda, lateral direita, frontal e traseira. Cada ponto é salvo com a visão correspondente, e a lista de avarias indica em qual face do veículo o dano foi registrado. Isso melhora bastante a leitura do laudo quando há muitos danos espalhados.

### Croqui multicolorido (v1.4.9)

Os pontos usam cores por **posição atual** (1 vermelho, 2 azul, 3 verde, 4 laranja, 5 roxo, 6 rosa e assim por diante). A mesma cor aparece no ponto do carro, no número e no tipo da avaria na lista e no laudo impresso. A exclusão recalcula a numeração e as cores sem excluir fotos ou observações dos pontos restantes.
