<div align="center">

# Comissão+

**Comissões do dia, sem complicação.**

Registre as vendas da equipe, ajuste as regras de cada pessoa e acompanhe os valores calculados na hora.

React · TypeScript · Vite

[Funcionalidades](#funcionalidades) · [Como rodar](#como-rodar) · [Como usar](#como-usar) · [Estrutura](#estrutura-do-projeto)

</div>

---

## Sobre o projeto

O Comissão+ é uma aplicação para calcular comissões a partir das vendas de cada pessoa. Cada integrante tem seu próprio percentual e valor fixo, enquanto o resumo reúne o total vendido e o total em comissões da equipe.

Tudo funciona no navegador, com salvamento local automático e exportação do resumo em PNG para compartilhar.

O escopo da próxima versão — login de gerentes, equipes próprias, histórico diário, relatórios em PDF e backup/importação em JSON — está documentado em [Evolução do produto](docs/evolucao-do-produto.md). Essas funcionalidades ainda não estão implementadas.

## Funcionalidades

- **Gestão da equipe:** adicione e remova pessoas, edite nomes e configure as regras individuais.
- **Vendas separadas:** registre e remova cada venda, com total por pessoa atualizado automaticamente.
- **Campo monetário:** aceita números e decimais com vírgula ou ponto, bloqueia letras e negativos e exibe duas casas decimais ao sair do campo. Exemplo: `100` → `100,00`.
- **Cálculo imediato:** veja a comissão percentual, o valor fixo e o total de cada pessoa.
- **Resumo da equipe:** acompanhe o total vendido, o total em comissões e a quantidade de pessoas.
- **Exportação em PNG:** baixe uma imagem com a data, os totais e o detalhamento por pessoa.
- **Salvamento automático:** os dados são mantidos no `localStorage` do navegador.

## Como funciona o cálculo

```text
Total vendido = soma das vendas da pessoa
Comissão percentual = total vendido × (percentual ÷ 100)
Comissão total = comissão percentual + valor fixo
```

Por exemplo, para uma pessoa com **R$ 1.000,00 em vendas**, **10% de comissão** e **R$ 33,33 de valor fixo**:

| Item | Valor |
| --- | ---: |
| Total vendido | R$ 1.000,00 |
| Comissão percentual (10%) | R$ 100,00 |
| Valor fixo | R$ 33,33 |
| **Comissão total** | **R$ 133,33** |

Os resultados monetários são arredondados para duas casas decimais. O valor fixo é somado mesmo quando não há vendas.

## Como rodar

### Pré-requisitos

- Node.js **22.13 ou superior na linha 22**, ou **24 ou superior**.
- pnpm instalado.

### Instalação e desenvolvimento

Na pasta do projeto, execute:

```bash
pnpm install
pnpm dev
```

Abra o endereço indicado no terminal — normalmente, `http://localhost:5173`.

### Comandos disponíveis

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento. |
| `pnpm build` | Verifica os tipos e gera a aplicação em `dist/`. |
| `pnpm preview` | Disponibiliza o build para conferência local. |
| `pnpm lint` | Verifica o código com ESLint. |

Para conferir a versão de produção localmente:

```bash
pnpm build
pnpm preview
```

## Como usar

1. Edite o nome, o percentual e o valor fixo de cada pessoa.
2. Digite o valor de uma venda. Ao sair do campo, `100` será exibido como `100,00`.
3. Clique em **Adicionar venda** para registrar outros valores para a mesma pessoa.
4. Confira os totais individuais e o **Resumo do dia**.
5. Clique em **Exportar imagem** para baixar o resumo em PNG.

Use **Adicionar pessoa** para incluir integrantes na equipe. Os botões de remoção permitem excluir uma venda ou uma pessoa.

### Onde os dados ficam salvos?

Os dados ficam no navegador usado para acessar a aplicação e continuam disponíveis após recarregar a página. Não há sincronização entre dispositivos ou navegadores. Limpar os dados do site também remove os registros salvos.

O resumo apresenta os valores atuais da tela; os registros não são separados automaticamente por dia. A imagem exportada inclui a data da exportação.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| React 19 | Interface e componentes. |
| TypeScript | Tipagem dos dados e do código. |
| Vite 8 | Desenvolvimento e build. |
| Lucide React | Ícones da interface. |
| CSS Modules | Estilos isolados por componente. |
| Canvas API | Geração do resumo em PNG. |
| localStorage | Persistência local. |
| ESLint | Verificação do código. |

## Estrutura do projeto

```text
public/                   # Ícones públicos
src/
├── assets/               # Recursos visuais
├── app/                  # Composição da tela: index.tsx e style.module.css
├── components/           # Uma pasta por componente, com index.tsx e style.module.css
│   ├── app-header/
│   ├── app-footer/
│   ├── hero/
│   ├── summary-cards/
│   ├── commission-section/
│   └── person-card/
├── hooks/
│   └── useCommissionPeople.ts  # Estado, edição e persistência da equipe
├── types/
│   └── commission.ts     # Tipos de pessoas, vendas e totais
├── utils/
│   ├── commission.ts     # Cálculos, formatação e leitura dos dados salvos
│   └── exportSummary.ts  # Geração e download do PNG
├── index.css             # Tokens, estilos básicos e acessibilidade globais
└── main.tsx              # Entrada da aplicação
```

## Desenvolvimento

Os cálculos e a formatação monetária ficam em `src/utils/commission.ts`. As alterações da equipe e o salvamento ficam em `src/hooks/useCommissionPeople.ts`, e a exportação fica em `src/utils/exportSummary.ts`.

Cada componente fica em `src/components/nome-do-componente/`, com a implementação e exportação em `index.tsx` e os estilos em `style.module.css`. As pastas usam letras minúsculas e palavras separadas por hífen (kebab-case). A composição da aplicação segue o mesmo padrão em `src/app/`. Importe o CSS Module no próprio componente e use as classes pelo objeto `styles`. Regras responsivas ficam no mesmo arquivo de estilos do componente; tokens e regras globais ficam em `src/index.css`.

Antes de enviar alterações, execute:

```bash
pnpm lint
pnpm build
```
