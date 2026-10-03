# Supabase no Comissão+

## O que faz cada parte

- **Supabase Auth** cria e autentica contas de gerentes por e-mail e senha. A recuperação de senha também passa por ele.
- **PostgreSQL** guarda o estado atual da equipe em `public.manager_workspaces`. Cada linha pertence a um gerente.
- **RLS** limita a leitura e a criação da linha ao gerente autenticado. A gravação passa por uma função SQL que confere o dono e a versão dos dados.
- **TanStack React Query** gerencia a consulta da sessão, o carregamento da área, o cache e as mutações de salvamento. Os efeitos restantes escutam eventos externos: mudança de autenticação, intervalo do salvamento automático e saída da página.
- **Chave pública** identifica o projeto no navegador. Ela pode estar no frontend; a proteção dos dados vem da autenticação e das regras do banco. Nunca coloque a chave `service_role` ou uma chave secreta em `VITE_*`.

Nesta etapa, o banco salva o estado atual da calculadora: pessoas, percentuais, valor fixo e vendas exibidas. A migração para registros com datas, equipes adicionais e relatórios ainda será implementada. A coluna JSON permite conectar a interface atual sem atribuir datas inventadas a vendas anteriores.

## Configuração

1. Crie um projeto no [painel do Supabase](https://supabase.com/dashboard).
2. No SQL Editor do projeto, execute o conteúdo de [`supabase/migrations/202610030001_initial.sql`](../supabase/migrations/202610030001_initial.sql). Se usar Supabase CLI, aplique a migração por ela.
3. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os valores do projeto. A URL e a chave pública ficam na área de conexão/API do projeto.
4. Em Authentication → Providers, habilite e-mail e senha. Em Authentication → URL Configuration, defina **Site URL** como o endereço publicado do aplicativo (ou o endereço local durante o desenvolvimento). Em **Redirect URLs**, adicione os endereços usados para abrir o aplicativo, incluindo a porta, por exemplo `http://localhost:5173`, e o endereço publicado. O cadastro e a recuperação de senha enviam o endereço atual do aplicativo como destino; ele precisa estar autorizado nessa lista.
5. Execute `pnpm install` e `pnpm dev`. Reinicie o servidor após mudar `.env.local`.

Em **Authentication → Sign In / Providers → Email**, configure **Minimum password length** como `8` e **Password Requirements** como **Lowercase, uppercase letters and digits**. A tela exige os mesmos quatro critérios: oito caracteres, uma letra maiúscula, uma minúscula e um número. A configuração no Supabase aplica a regra também a chamadas feitas diretamente à API.

O Supabase impede uma segunda conta com o mesmo e-mail. Dependendo da configuração de confirmação de e-mail, a resposta do cadastro pode ocultar se a conta já existe. Por isso, a tela mostra o erro **“Este e-mail já tem uma conta”** quando o serviço o informa e usa uma mensagem neutra quando envia uma confirmação. A tela oferece **Já tenho conta** e **Esqueci minha senha** para esses casos.

O `.env.local` não é versionado. `.env.example` contém apenas marcadores de exemplo.

### Confirmação abre localhost e mostra conexão recusada

Esse erro significa que o navegador não encontrou o aplicativo no endereço de destino. Para testar localmente, mantenha `pnpm dev` em execução e confira se o endereço indicado no terminal é o mesmo do link. Se estiver em outro dispositivo, `localhost` aponta para esse dispositivo; use o endereço publicado para confirmar nele.

Se o aplicativo estiver publicado, ajuste **Site URL** e **Redirect URLs** no Supabase para o endereço publicado. No template de confirmação, mantenha o link padrão `{{ .ConfirmationURL }}`; um link personalizado fixado em `{{ .SiteURL }}` pode ignorar o destino enviado pelo aplicativo. Consulte a [documentação de redirecionamentos do Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

Links de e-mails já enviados mantêm o destino antigo. Depois de ajustar a configuração, solicite uma nova confirmação; se a conta já foi confirmada, entre no aplicativo com e-mail e senha.

## Comportamento atual

O gerente cria uma conta, confirma o e-mail quando essa opção estiver ativa e entra. Na primeira entrada é criada uma área vazia no banco. Mudanças na calculadora são enviadas automaticamente após uma pausa curta; a tela mostra se os dados foram salvos. O botão **Sair** fica indisponível enquanto houver alterações pendentes.

Se havia dados no `localStorage` da versão anterior, a tela oferece **Importar pessoas e vendas atuais** quando a área da conta está vazia. A importação exige um clique e não apaga os dados locais. Os registros importados continuam sem data; o histórico diário precisa de uma migração própria.

Duas abas da mesma conta podem editar a mesma área. Cada gravação compara a versão lida com a versão no banco. Se outra aba salvou primeiro, a gravação é recusada e a tela mantém as alterações locais para conferência; o gerente não deve recarregar sem copiá-las ou tentar uma recuperação manual.

## Limitações desta etapa

- O esquema atual admite uma área por gerente. Equipes adicionais e importação de backup JSON exigirão uma migração posterior.
- Ainda não há histórico diário, periodicidade editável do valor fixo, relatórios PDF ou backup JSON.
- A exportação disponível continua sendo o resumo atual em PNG.
- Não foi possível validar login e RLS contra um projeto real sem as credenciais públicas e a aplicação da migração no projeto do usuário. Build e lint locais verificam o código, mas não substituem esse teste.

## Checklist de validação no projeto conectado

1. Criar duas contas e lançar dados diferentes em cada uma.
2. Confirmar que cada conta só vê sua própria equipe após sair e entrar novamente.
3. Em uma conta, recarregar a página e abrir outro navegador para conferir a persistência.
4. Tentar consultar e criar uma linha de outra conta diretamente pela API: a leitura não deve revelar dados e a criação deve falhar.
5. Editar a mesma conta em duas abas; a segunda gravação com versão antiga deve falhar sem sobrescrever a primeira.
6. Testar cadastro com confirmação e recuperação de senha usando as URLs configuradas.
