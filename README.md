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

A calculadora salva o estado atual da equipe na conta do gerente via Supabase e exporta o resumo em PNG. Para configurar o projeto Supabase, veja [Configuração do Supabase](docs/supabase.md).

O escopo da próxima versão — login de gerentes, equipes próprias, histórico diário, relatórios em PDF e backup/importação em JSON — está documentado em [Evolução do produto](docs/evolucao-do-produto.md). Essas funcionalidades ainda não estão implementadas.

## Funcionalidades

- **Gestão da equipe:** adicione e remova pessoas, edite nomes e configure as regras individuais.
- **Vendas separadas:** registre e remova cada venda, com total por pessoa atualizado automaticamente.
- **Campo monetário:** aceita números e decimais com vírgula ou ponto, bloqueia letras e negativos e exibe duas casas decimais ao sair do campo. Exemplo: `100` → `100,00`.
- **Cálculo imediato:** veja a comissão percentual, o valor fixo e o total de cada pessoa.
- **Resumo da equipe:** acompanhe o total vendido, o total em comissões e a quantidade de pessoas.
- **Exportação em PNG:** baixe uma imagem com a data, os totais e o detalhamento por pessoa.
- **Salvamento automático na conta:** com Supabase configurado, as alterações são gravadas na área do gerente. Dados locais da versão anterior podem ser importados manualmente.

## Como funciona o cálculo

```text
Total vendido = soma das vendas da pessoa
Comissão percentual = total vendido × (percentual ÷ 100)
Comissão total = comissão percentual + valor fixo
```

Por exemplo, para uma pessoa com **R$ 1.000,00 em vendas**, **10% de comissão** e **R$ 33,33 de valor fixo**:

| Item                      |         Valor |
| ------------------------- | ------------: |
| Total vendido             |   R$ 1.000,00 |
| Comissão percentual (10%) |     R$ 100,00 |
| Valor fixo                |      R$ 33,33 |
| **Comissão total**        | **R$ 133,33** |

Os resultados monetários são arredondados para duas casas decimais. O valor fixo é somado mesmo quando não há vendas.

## Como rodar

### Pré-requisitos

- Node.js **22.13 ou superior na linha 22**, ou **24 ou superior**.
- pnpm instalado.

### Instalação e desenvolvimento

Na pasta do projeto, execute:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Antes de iniciar, preencha `.env.local` e aplique a migração SQL no projeto Supabase conforme [as instruções de configuração](docs/supabase.md). Abra o endereço indicado no terminal — normalmente, `http://localhost:5173`.

### Comandos disponíveis

| Comando             | O que faz                                                              |
| ------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`          | Inicia o servidor de desenvolvimento.                                  |
| `pnpm build`        | Verifica os tipos e gera a aplicação em `dist/`.                       |
| `pnpm preview`      | Disponibiliza o build para conferência local.                          |
| `pnpm lint`         | Verifica o código e a formatação com ESLint e Prettier.                |
| `pnpm lint:fix`     | Corrige os problemas de lint que podem ser resolvidos automaticamente. |
| `pnpm format`       | Formata os arquivos do projeto com Prettier.                           |
| `pnpm format:check` | Confere a formatação sem alterar arquivos.                             |
| `pnpm test`         | Executa todos os testes com Vitest.                                    |
| `pnpm test:watch`   | Executa o Vitest em modo watch durante o desenvolvimento.              |

Para conferir a versão de produção localmente:

```bash
pnpm build
pnpm preview
```

## Como usar

1. Crie uma conta de gerente ou entre com e-mail e senha.
2. Se quiser trazer os dados salvos anteriormente neste navegador, use **Importar pessoas e vendas atuais**.
3. Edite o nome, o percentual e o valor fixo de cada pessoa.
4. Digite o valor de uma venda. Ao sair do campo, `100` será exibido como `100,00`.
5. Clique em **Adicionar venda** para registrar outros valores para a mesma pessoa.
6. Confira os totais individuais e o **Resumo do dia**; aguarde a indicação **Salvo na nuvem**.
7. Clique em **Exportar imagem** para baixar o resumo em PNG.

Use **Adicionar pessoa** para incluir integrantes na equipe. Os botões de remoção permitem excluir uma venda ou uma pessoa.

### Onde os dados ficam salvos?

Com Supabase configurado, os dados atuais ficam na conta do gerente e podem ser acessados em outros dispositivos. Dados salvos anteriormente no navegador podem ser importados manualmente após o login. A configuração está em [docs/supabase.md](docs/supabase.md).

O resumo apresenta os valores atuais da tela; os registros não são separados automaticamente por dia. A imagem exportada inclui a data da exportação.

## Tecnologias

| Tecnologia                 | Uso                                                          |
| -------------------------- | ------------------------------------------------------------ |
| React 19                   | Interface e componentes.                                     |
| TypeScript                 | Tipagem dos dados e do código.                               |
| Vite 8                     | Desenvolvimento e build.                                     |
| Lucide React               | Ícones da interface.                                         |
| React Hook Form            | Estado, validação e envio dos formulários de autenticação.   |
| TanStack React Query       | Consultas, cache e mutações dos dados do Supabase.           |
| CSS Modules                | Estilos isolados por componente.                             |
| Canvas API                 | Geração do resumo em PNG.                                    |
| Supabase Auth e PostgreSQL | Login e persistência dos dados atuais da equipe.             |
| localStorage               | Fonte dos dados da versão anterior para importação opcional. |
| ESLint e Prettier          | Verificação do código e padronização da formatação.          |
| Vitest e Testing Library   | Testes de regras de negócio e hooks React.                   |

## Estrutura do projeto

```text
public/                   # Ícones públicos
src/
├── assets/               # Recursos visuais
├── app/                  # Composição da tela: index.tsx e style.module.css
├── components/           # Uma pasta por componente, com index.tsx e style.module.css
│   ├── header/
│   ├── footer/
│   ├── hero/
│   ├── summary-cards/
│   ├── commission-section/
│   ├── person-card/
│   ├── auth-panel/
│   └── password-update/
├── api/                  # Hooks do React Query por tipo de chamada
│   ├── auth/             # Sessão, login, cadastro, senha e saída da conta
│   └── workspace/        # Consulta e salvamento da área do gerente
├── hooks/
│   └── use-commission-people.ts # Estado e edição da equipe
├── lib/
│   ├── query-client.ts   # Configuração do cache do React Query
│   └── supabase.ts       # Cliente Supabase
├── types/                # Tipos de domínio, formulários e props de componentes
├── utils/
│   ├── commission.ts     # Cálculos, formatação e leitura dos dados salvos
│   └── export-summary.ts  # Geração e download do PNG
├── index.css             # Tokens, estilos básicos e acessibilidade globais
└── main.tsx              # Entrada da aplicação
supabase/migrations/      # Estrutura e permissões do banco
```

## Desenvolvimento

Os cálculos e a formatação monetária ficam em `src/utils/commission.ts`. As edições da equipe ficam em `src/hooks/use-commission-people.ts`. As consultas e mutações do Supabase ficam em `src/api/auth/` e `src/api/workspace/`, com o cache configurado em `src/lib/query-client.ts`. As declarações de tipos ficam em `src/types/`. A exportação PNG fica em `src/utils/export-summary.ts`.

Cada componente fica em `src/components/nome-do-componente/`, com a implementação e exportação em `index.tsx` e os estilos em `style.module.css`. As pastas usam letras minúsculas e palavras separadas por hífen (kebab-case). A composição da aplicação segue o mesmo padrão em `src/app/`. Importe o CSS Module no próprio componente e use as classes pelo objeto `styles`. Regras responsivas ficam no mesmo arquivo de estilos do componente; tokens e regras globais ficam em `src/index.css`.

Os formulários de cadastro, login, recuperação e definição de nova senha usam React Hook Form. Os campos da calculadora usam o estado compartilhado em `use-commission-people.ts`, que alimenta os cálculos e o salvamento automático.

A formatação é definida em `.prettierrc.json`: indentação de 2 espaços, aspas simples, sem ponto e vírgula e uma prop por linha em JSX. O ESLint também aponta desvios dessas regras.

No VS Code, instale as extensões recomendadas **Prettier** (`esbenp.prettier-vscode`) e **ESLint** (`dbaeumer.vscode-eslint`). As configurações versionadas em `.vscode/settings.json` ativam a formatação e as correções do ESLint ao salvar. Para formatar pelo terminal, use `pnpm format`.

Os testes usam Vitest e ficam em `tests/`, em arquivos `*.test.ts` ou `*.test.tsx`. Use as funções de teste, asserções e mocks do Vitest; para hooks e componentes React, use Testing Library com o ambiente jsdom.

Antes de enviar alterações, execute:

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm build
```
