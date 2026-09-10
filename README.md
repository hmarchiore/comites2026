# COMITES 2026 — gerador do pedido de inscrição eleitoral

Formulário web que preenche automaticamente o PDF oficial da *Domanda di iscrizione nell'elenco elettorale per le elezioni dei COMITES*, exigido pelo Consulado Geral da Itália no Rio de Janeiro (jurisdição RJ/ES).

A pessoa preenche um formulário em português, no celular ou no computador, e baixa o PDF já preenchido em letras maiúsculas, pronto para assinar e enviar por e-mail.

## Escolha do consulado

A primeira tela pergunta qual é o consulado. Quem escolhe **Rio de Janeiro** segue para o formulário. Quem escolhe **outro consulado italiano** recebe o aviso de que o sistema ainda não foi configurado para as demais circunscrições do Brasil, com o contato **27 99714-1599** para quem tiver interesse no desenvolvimento.

Como a escolha já define a circunscrição, o formulário não pergunta nada sobre o consulado. Os três campos consulares do PDF saem do perfil escolhido, definido em `CONSULADOS` no `assets/app.js`:

| Campo do PDF | Valor para o Rio |
| --- | --- |
| All'Ambasciata/Consolato d'Italia in | RIO DE JANEIRO |
| COMITES di | RJ/ES |
| dell'Ambasciata/Consolato in | RIO DE JANEIRO |

Para atender um novo consulado, acrescente um perfil em `CONSULADOS` e um cartão na tela de escolha, com o mesmo valor de `data-go`. As coordenadas do PDF não mudam, porque o modelo oficial é único.

## Como funciona

Tudo acontece no navegador. Não há servidor, banco de dados nem envio de dados para terceiros.

- O PDF oficial em branco fica embutido em base64 em `assets/template.js`.
- O [pdf-lib](https://pdf-lib.js.org/) abre esse modelo e desenha o texto nas coordenadas de cada linha do formulário.
- O tamanho da fonte encolhe sozinho quando o texto é maior que o espaço da linha.
- A assinatura é desenhada num `canvas`, recortada e embutida como PNG transparente sobre a linha *Firma*.
- Os dados digitados ficam apenas no `localStorage` do próprio aparelho, para não se perderem se a página for recarregada.

## Arquivos

| Arquivo | Função |
| --- | --- |
| `index.html` | Formulário e instruções de envio |
| `assets/style.css` | Estilo, responsivo, com tema claro e escuro |
| `assets/app.js` | Coordenadas dos campos, assinatura e geração do PDF |
| `assets/template.js` | PDF oficial em base64 |
| `assets/modelo-original.pdf` | PDF oficial em branco, para download |

## Rodando localmente

Basta abrir `index.html` no navegador. Não há build nem dependências para instalar.

## Envio

1. Baixe o PDF gerado e confira os dados.
2. Assine, na tela ou à caneta depois de imprimir.
3. Envie para **riodejaneiro.elettorale@esteri.it** junto com a cópia de um documento de identidade válido, brasileiro ou italiano, que contenha a assinatura.
4. Prazo final: **04/11/2026**.

Só quem pedir a inscrição por este formulário recebe as cédulas de votação em casa.

[Informações oficiais do Consulado Geral da Itália no Rio de Janeiro](https://consriodejaneiro.esteri.it/br/news/dal_consolato/2026/08/elezione-dei-comitati-degli-italiani-allestero-comites-2026-modalita-per-la-richiesta-di-iscrizione-nellelenco-elettorale/)

## Autoria

Feito por **Helder J Marchiori**, do grupo de WhatsApp [Cidadania italiana – Consulado do RJ](https://chat.whatsapp.com/LZVokMqsJoc0cElzsx5xm0).

## Aviso

Projeto independente, sem vínculo oficial com o Consulado ou com o COMITES. O modelo do PDF é o documento público distribuído pelo consulado.
