# Testes automatizados e homologação

[Documentação](README.md) / Testes

## Pré-requisitos

Node.js para `.mjs` e Python 3 para `test_static.py`. Os testes não são necessários em produção.

## Executar a suíte completa (PowerShell)

```powershell
node --check assets/app.js
node --check assets/export.js
node --check service-worker.js
Get-ChildItem tests -Filter 'test_*.mjs' | ForEach-Object {
    Write-Host "Executando $($_.Name)..."
    node $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Falha em $($_.Name)" }
}
python tests/test_static.py
if ($LASTEXITCODE -ne 0) { throw 'Falha no teste estatico' }
```

A suíte cobre estrutura, estado, máscaras, histórico, modais, croqui, gestos, PDF/exportação, PWA e responsividade. Alguns testes mantêm nomes de versões antigas porque documentam regressões corrigidas; seu conteúdo deve continuar coerente com o comportamento atual.

## Homologação manual antes de merge

- [ ] **Mobile 320, 360, 390 e 430 px:** títulos, descrições e contadores completos, sem rolagem horizontal.
- [ ] **Desktop:** colunas/lista, sidebar, navegação e apenas um expander aberto.
- [ ] **Checklist:** conforme/avaria/N/A, Tudo conforme por categoria, notas e fotos preservadas.
- [ ] **Histórico:** cinco salvamentos do mesmo protocolo aparecem separadamente; exclusão confirma e não apaga vizinhos.
- [ ] **Modais:** sobreposição correta, foco, `Escape` e scroll adequados.
- [ ] **Croqui:** nove vistas, zoom 100–300%, pinça, pan, swipe, tela cheia, toque com zoom e cor por tipo.
- [ ] **Backup:** exportar/importar JSON, restaurar todas as evidências e lidar com dados legados.
- [ ] **Laudo:** identificação e observações obrigatórias, seções opcionais, croqui correto e sem imagens antigas, contagens discretas, quebras A4.
- [ ] **Offline:** carregamento previamente armazenado em HTTPS/localhost, após desconectar a rede.
- [ ] **Atualização PWA:** aviso somente para versão nova; confirmação e preservação do rascunho.

Não use testes estáticos como prova de que uma aparência foi inspecionada num navegador real. Registre navegador, tamanho da tela, versão, data e evidências de falhas.
