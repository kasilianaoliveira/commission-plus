# Supabase no Comissão+

## O que faz cada parte

- **Supabase Auth** cria e autentica contas de gerentes por e-mail e senha. A recuperação de senha também passa por ele.
- **PostgreSQL** guarda o cadastro da equipe em `public.manager_teams` e os registros diários em `public.manager_days`. Cada linha pertence a um gerente.
- **RLS** limita a leitura e a criação da linha ao gerente autenticado. A gravação passa por uma função SQL que confere o dono e a versão dos dados.
- **TanStack React Query** gerencia a consulta da sessão, o carregamento da área, o cache e as mutações de salvamento. Os efeitos restantes escutam eventos externos: mudança de autenticação, intervalo do salvamento automático e saída da página.
- **Chave pública** identifica o projeto no navegador. Ela pode estar no frontend; a proteção dos dados vem da autenticação e das regras do banco. Nunca coloque a chave `service_role` ou uma chave secreta em `VITE_*`.

O histórico salva um snapshot por gerente e data: nomes, percentuais, fixos do dia e vendas. O cadastro independente da equipe guarda nomes, percentuais e fixos, sem vendas ou datas. Equipes adicionais e regras de fixo com vigência ficam para as próximas etapas.

## Configuração

1. Crie um projeto no [painel do Supabase](https://supabase.com/dashboard).
2. No SQL Editor do projeto, execute o conteúdo de [`supabase/migrations/202610030001_initial.sql`](../supabase/migrations/202610030001_initial.sql). Depois, execute [`supabase/migrations/202610030002_daily_history.sql`](../supabase/migrations/202610030002_daily_history.sql). Em seguida, execute [`supabase/migrations/202610030003_team_registry.sql`](../supabase/migrations/202610030003_team_registry.sql). Execute apenas as migrações ainda não aplicadas, mantendo a ordem. Se usar Supabase CLI, aplique as migrações por ela.
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

O gerente cria uma conta, confirma o e-mail quando necessário e entra. A tela abre a data atual em America/Sao_Paulo. Escolher outra data carrega seu registro independente. Abrir uma data vazia não grava nada nem gera valor fixo.

Na aba **Equipe**, cadastre os membros com nome, percentual e valor fixo, todos editáveis. O cadastro é salvo independentemente da data. Na aba **Comissões**, **Iniciar dia com a equipe** copia os membros e as regras do cadastro atual, sem vendas. Esse clique aplica o fixo do dia às pessoas incluídas, mesmo sem vendas. Nessa aba, os dados do membro são exibidos como referência e apenas as vendas são editáveis. Alterações ou remoções no cadastro da equipe não recalculam dias já iniciados.

O salvamento automático mostra pendências, sucesso e falhas. A troca de data e a saída ficam bloqueadas enquanto houver alterações pendentes. Duas abas usam comparação de versão por dia: uma gravação com versão antiga é recusada sem sobrescrever a outra. Em conflito, copie as alterações antes de recarregar. Tentar novamente serve para falhas transitórias; não resolve uma versão desatualizada.

O PNG mostra a data selecionada e os valores atuais da tela. Valores monetários aceitam até duas casas decimais e são persistidos em centavos.

## Limitações desta etapa

- Ainda não há equipes adicionais, fixo semanal/mensal, consultas agregadas por período, PDF ou backup JSON.
- O esquema usa snapshots por data; a evolução para entidades e regras com vigência será feita antes dos fixos periódicos.
- A migração precisa ser aplicada no projeto Supabase. Testes locais com mocks, build e lint não validam a migração ou o RLS em um banco real.

## Checklist de validação no projeto conectado

1. Criar duas contas e lançar dados diferentes em cada uma.
2. Confirmar que cada conta só vê sua própria equipe após sair e entrar novamente.
3. Em uma conta, recarregar a página e abrir outro navegador para conferir a persistência.
4. Tentar consultar e criar uma linha de outra conta diretamente pela API: a leitura não deve revelar dados e a criação deve falhar.
5. Editar a mesma conta em duas abas; a segunda gravação com versão antiga deve falhar sem sobrescrever a primeira.
6. Testar cadastro com confirmação e recuperação de senha usando as URLs configuradas.

## Validação do histórico diário

1. Aplique as migrações `202610030002_daily_history.sql` e `202610030003_team_registry.sql` após a inicial.
2. Cadastre os membros na aba Equipe e aguarde o salvamento. Recarregue e verifique que o cadastro foi preservado sem criar nenhum dia. Na aba Comissões, escolha uma data, inicie com a equipe e adicione vendas. Confira os totais e a persistência.
3. Abra o dia seguinte: deve começar sem registros e com totais zero. Inicie com a equipe e confirme que as vendas não foram copiadas.
4. Faça vendas, aguarde **Salvo na nuvem** e navegue entre os dois dias. O nome, percentual e fixo de cada dia devem permanecer independentes.
5. Edite nome, percentual e fixo ou remova um membro na aba Equipe. Confira que os dias registrados permanecem intactos e um novo dia usa o cadastro atualizado. Exporte o PNG e confira a data selecionada.
6. Faça alterações e tente mudar a data imediatamente: os controles devem aguardar o salvamento. Simule falha de rede e confira que o rascunho é mantido.
7. Abra a mesma data em duas abas. Após a primeira salvar, a segunda deve receber conflito. Datas diferentes podem ser salvas independentemente.
8. Com duas contas, confirme isolamento por interface e API: leituras de `manager_days` e `manager_teams` da outra conta devem ser vazias; escritas diretas devem falhar. A função `save_manager_day` sempre usa o usuário autenticado como proprietário.
