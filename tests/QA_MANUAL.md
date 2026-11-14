# Homologação manual — Vistoria Veicular 1.2.0

Faça a homologação preferencialmente em Chrome/Edge e Firefox, em desktop e celular. Para testar instalação e Service Worker, use HTTPS ou `http://localhost`.

1. **Desktop 1280+ px** — confirmar duas colunas de categorias; usar a opção Lista e voltar a Colunas; recarregar e conferir a preferência.
2. **Menu lateral** — verificar o rail recolhido por padrão, expandir/recolher; no celular, abrir e fechar por toque e `Esc`.
3. **Appbar** — verificar se os seis ícones estão **dentro da barra superior** e se o antigo minicard abaixo da apresentação foi removido. Testar ampliar/recolher, histórico, ação global, limpar e PDF.
4. **Navbar inferior e engrenagem** — conferir atalhos e painel de configurações com `Versão 1.2.0` e pill `Hagliberto Alves de Oliveira`.
5. **Marcação individual por categoria** — escolher a primeira categoria e clicar em **Tudo conforme**; apenas seus oito itens devem mudar. Marcar um item dessa categoria como **Avaria**, acionar novamente o botão, cancelar para preservar avaria e repetir confirmando. Notas e fotos devem permanecer.
6. **Histórico com o mesmo protocolo** — abrir o histórico; clicar em **Salvar Vistoria Atual no Histórico** cinco vezes, aguardando o retorno de cada salvamento. Conferir **cinco registros**, mesmo protocolo de laudo e identificadores de arquivo próprios. Recarregar e confirmar que todos permanecem.
7. **Modal sobre modal** — dentro do histórico, clicar em excluir. A confirmação deve aparecer **à frente** do histórico, receber foco e bloquear ações no diálogo de fundo. Cancelar e testar novamente confirmando; apenas o registro escolhido deve sair.
8. **Backups e dados antigos** — exportar um JSON, importar e restaurar. Verificar compatibilidade do histórico anterior à atualização. Faça cópia externa antes de testar limpeza de dados do navegador.
9. **Assinatura, fotos e croqui** — recuperar vistoria arquivada com foto/assinatura, ver visualização e confirmar persistência ao fechar/reabrir.
10. **Laudo A4** — imprimir com poucas e muitas evidências. A appbar, navbar, sidebar e botões de categoria não devem aparecer no laudo; checar títulos sem órfãos, croqui, assinaturas e fotos sem recorte.
11. **Mobile 320 e 390 px** — appbar ainda utilizável, sem rolagem horizontal global, barra inferior visível, foco do teclado e modais com rolagem interna.
12. **Offline** — após visitar via HTTPS/localhost e instalar, desconectar rede e recarregar. Verificar se checklist, fotos/assinaturas e histórico continuam acessíveis.

**Observação:** este checklist complementa os testes automatizados, não atesta conformidade jurídica/regulatória do laudo nem disponibilidade de armazenamento ilimitado.
