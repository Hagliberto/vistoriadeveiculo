# Contribuição, branches e releases

[Documentação](README.md) / Contribuição

## Fluxo recomendado

Mantenha a `main` como produção e crie branches para mudanças. Faça commits pequenos, com mensagens descritivas (ex.: `docs: reorganizar documentacao do projeto`, `fix: corrigir exportacao do laudo`).

```powershell
git switch main
git pull --ff-only origin main
git switch -c docs/organizacao-documentacao
# edite arquivos, revise e teste
git diff --check
git add README.md AGENTS.md CHANGELOG.md docs tests/QA_MANUAL.md
git commit -m "docs: profissionalizar README e centralizar documentacao"
git push -u origin docs/organizacao-documentacao
```

Abra um Pull Request e confira os arquivos alterados. Só depois do aceite e homologação faça o merge conforme as regras do repositório.

## Checklist de release funcional

1. Atualizar a versão em `assets/app.js` (`APP_VERSION`), `version.json`, `service-worker.js` (cache) e rótulos derivados, quando houver uma **nova versão funcional**.
2. Registrar mudanças no [CHANGELOG](../CHANGELOG.md), mantendo o histórico mais recente no topo.
3. Revisar README e documentos afetados, evitando descrições obsoletas.
4. Executar [testes](testes.md), testes visuais e teste do PDF em navegador real.
5. Criar/mergear branch, publicar em produção e verificar atualização do PWA.
6. Criar tag anotada da versão **somente após aprovação**.

Mudanças **somente de documentação** não precisam alterar o número do aplicativo. Não crie tags v1.5.11 sem código funcional e homologação correspondente.

## Convenções de conteúdo

- Português do Brasil, títulos objetivos, terminologia estável: *avaria*, *vistoria*, *laudo*, *croqui*, *histórico*.
- README breve; detalhes sob `docs/`; [AGENTS](../AGENTS.md) com instruções mandatórias; CHANGELOG com mudanças cronológicas.
- Links Markdown relativos testados no próprio GitHub.
- Nunca publicar JSON real de vistorias, fotos pessoais, dados de placa, tokens ou credenciais no repositório.
