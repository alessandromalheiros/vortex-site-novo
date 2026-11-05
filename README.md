# Vortex: novo site em revisão

Projeto privado e separado de vortex-site-principal. Esta versão não está pronta para substituir a produção.

- public/: 24 páginas HTML e arquivos locais de marca, fonte, estilo e navegação.
- api/contact.mjs: entrada Vercel com recebimento explicitamente desativado.
- server/: módulos privados, fora da pasta pública; nenhum destino GHL ou segredo incluído.
- vercel.json: mantém .html (cleanUrls:false), bloqueia indexação e limita a função.

O formulário só confere preenchimento. Não envia, não persiste dados e não cria contatos. Não ativar ou publicar no domínio principal sem revisão final e aprovação. Não remover noindex desta prévia.

Não alterar o repositório/projeto vortex-site-principal, domínio ou automações. Este repositório contém o pacote do site; geradores e testes de autoria continuam no workspace Codex, em vortex-site-novo.
