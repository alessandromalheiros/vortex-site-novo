# Vortex novo site — prévia de atendimento centralizado

Esta branch é uma revisão separada, com 24 páginas. O widget de WhatsApp e o formulário nativo de retorno são reais: um envio pode registrar dados no GHL e acionar regras existentes. Não repetir os testes já feitos sem autorização específica.

Prévia verificada: https://vortex-site-novo-4d6kynj00-alessandromalheiros-projects.vercel.app/plano-empresarial-pme.html

## Organização

- Uma chamada principal por página comercial abre o mesmo widget flutuante no canto inferior direito.
- Bolinha verde, símbolo branco; botões principais laranja e identidade azul preservados.
- Links diretos repetidos de WhatsApp e botões duplicados de encerramento foram retirados; textos, títulos e navegação preservados.
- O formulário separado permanece em contato-e-cotacao.html, com Nome e Sobrenome separados, WhatsApp e e-mail opcional. Ele carrega sob escolha.
- A política desta prévia descreve o widget externo e o formulário; ainda está em revisão.

## Implantação e limites

Somente Preview, com noindex/nofollow e robots bloqueado. Deploy Git automático desativado. Não promover para produção nem associar domínios sem aprovação. O site/repositório/projeto vortex-site-principal permanece separado.

A API própria /api/contact continua desativada. A captação real usa o widget e o formulário nativos, sem uma segunda submissão pelo site. Não há credenciais no pacote.

O teste anterior do widget reconheceu um contato existente, sem duplicação, antes do envio pelo WhatsApp. A divisão automática do nome em um cadastro novo e a atribuição por página/campanha ainda não estão confirmadas. Esta alteração visual não é prova de aumento de conversão ou conformidade jurídica.

Este repositório contém o pacote de implantação. Geradores, auditorias e planejamento permanecem no workspace local vortex-site-novo; não confundir este pacote com o conjunto completo de fontes de geração.
