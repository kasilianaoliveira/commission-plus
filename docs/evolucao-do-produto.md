# Evolução do Comissão+

Status: escopo acordado para implementação futura. Este documento não descreve funcionalidades já disponíveis.

## Objetivo

Evoluir a calculadora atual para um sistema com contas de administradores/gerentes, equipes próprias, histórico diário, relatórios em PDF e transferência de dados por exportação e importação.

## Situação atual

- Interface em React, TypeScript e Vite.
- Pessoas e vendas salvas no `localStorage` do navegador, sem sincronização entre dispositivos.
- Vendas sem data: o estado atual não constitui um histórico diário.
- Percentual e valor fixo configurados por pessoa.
- Exportação do resumo atual em PNG.
- Sem autenticação ou banco de dados remoto.

## Escopo acordado

### Contas e equipes

- Apenas administradores/gerentes terão contas e login com e-mail e senha.
- Disponibilizar cadastro, login, recuperação de senha e saída da conta.
- Cada gerente terá sua própria equipe e seus próprios registros.
- As pessoas da equipe serão cadastros para controle de vendas e comissões; não terão login.
- Na primeira versão, não haverá colaboração sobre a mesma equipe nem convites de acesso.
- Uma equipe recebida por importação será uma nova equipe independente do destinatário. O modelo deve permitir essa equipe adicional sem misturar os registros da equipe original.

### Histórico diário

- Salvar os lançamentos com a data de trabalho e permitir navegar entre dias, semanas e meses.
- Ao mudar de dia, preservar os registros anteriores.
- Permitir consultar e corrigir dias anteriores, com confirmação de salvamento e indicação de falhas.
- Guardar, por pessoa e dia, o percentual e o nome usado no registro. Preservar também as regras e os lançamentos de valor fixo efetivamente aplicados ao período.
- Alterar o cadastro de uma pessoa não deve recalcular automaticamente períodos anteriores.
- Arquivar uma pessoa deve preservar seu histórico e sua presença nos relatórios antigos.
- Um dia sem registro não deve gerar automaticamente um valor fixo a pagar.

### Valor fixo configurável

- O gerente poderá definir, por pessoa, o valor fixo e sua periodicidade: diária, semanal ou mensal.
- Permitir editar o valor e a periodicidade posteriormente, escolhendo a data de início da nova regra.
- Manter o histórico das regras: uma edição deve valer a partir da data escolhida, sem alterar automaticamente valores já registrados.
- Correções retroativas devem ser explícitas e mostrar quais registros serão afetados antes da confirmação.
- Lançar o fixo apenas uma vez por período aplicável. Um fixo semanal ou mensal não deve ser somado novamente a cada dia nem a cada geração de relatório.
- Preservar valor, periodicidade, vigência e lançamentos correspondentes no backup JSON e na importação.
- A forma de aplicar o fixo em períodos parciais ou sem vendas ainda precisa ser definida, conforme as decisões pendentes.

### Relatórios em PDF

- Gerar relatórios semanais e mensais a partir dos registros persistidos.
- Informar equipe, período, data de geração e moeda.
- Apresentar total vendido, comissão percentual, valor fixo aplicado e ganho total por pessoa, além dos totais da equipe.
- Consolidar as comissões calculadas em cada dia e os lançamentos de valor fixo atribuídos ao período, respeitando as regras históricas e o arredondamento, sem duplicar fixos semanais ou mensais.
- Oferecer detalhamento por dia para conferência e download do PDF.
- Informar quando o período selecionado não tiver registros.
- A geração será sob demanda na primeira versão; envio automático ou agendado fica fora do escopo.

### Exportação e importação em JSON

- PDF será o formato de relatório; JSON será o formato de backup e transferência de dados.
- Exportar a equipe com pessoas, registros diários, vendas e regras históricas de comissão.
- O arquivo deve conter uma versão do formato, data de exportação, moeda e convenção de datas/fuso.
- Não exportar senhas, sessões, tokens ou credenciais.
- Antes de importar, validar estrutura, versão, datas, valores e vínculos entre os registros.
- Mostrar uma prévia com nome da equipe, quantidade de pessoas, quantidade de registros e período coberto.
- Após confirmação, criar uma nova equipe pertencente ao gerente autenticado, com novos identificadores e vínculos remapeados.
- Não confiar no proprietário informado pelo arquivo; o destino deve ser a conta autenticada.
- Não sobrescrever ou mesclar equipes existentes. Se a importação falhar, não deixar dados parcialmente importados.
- Exportar e importar cria uma cópia independente: alterações posteriores não serão sincronizadas.
- Reimportar o mesmo arquivo deve gerar um aviso antes de criar outra cópia.

## Arquitetura proposta

Manter React + Vite para aproveitar a interface existente e adicionar Supabase para autenticação e banco PostgreSQL. Migrar para Next.js não é requisito desta etapa.

As permissões devem ser aplicadas no banco por RLS, vinculando equipes ao usuário autenticado e protegendo também pessoas, dias e vendas. Filtrar registros apenas na interface não é suficiente. Credenciais administrativas devem permanecer fora do frontend e dos arquivos exportados.

Operações que precisem de execução no servidor poderão usar funções de banco ou uma função de backend, conforme a necessidade. A importação deve ocorrer de forma transacional. Relatórios em PDF poderão ser gerados no navegador a partir dos dados autorizados, sem exigir armazenamento permanente dos PDFs nesta versão.

### Modelo de dados inicial

| Entidade | Responsabilidade |
| --- | --- |
| Conta | Identidade do administrador/gerente, gerenciada pela autenticação. |
| Equipe | Nome, proprietário e fuso utilizado para os dias de trabalho. |
| Pessoa | Cadastro, regras padrão de comissão e estado ativo/arquivado. |
| Regra de valor fixo | Pessoa, valor, periodicidade e vigência, preservando versões anteriores. |
| Lançamento de valor fixo | Pessoa, regra histórica, período de referência, data de atribuição e valor aplicado, sem duplicação por período. |
| Registro diário | Equipe, pessoa, data, nome histórico e percentual aplicado. |
| Venda | Registro diário associado e valor monetário. |

Deve existir no máximo um registro diário por pessoa, equipe e data. Valores monetários devem usar centavos inteiros ou um tipo decimal exato, evitando erros de ponto flutuante na persistência e nos relatórios.

Datas de trabalho devem ser armazenadas como datas de calendário. Instantes de criação e alteração devem ser armazenados separadamente. A definição do fuso deve ser consistente na tela, no banco, no PDF e no JSON.

## Migração dos dados atuais

Os dados locais existentes não possuem datas. Por isso, não é possível reconstruir automaticamente dias, semanas ou meses anteriores.

Oferecer uma prévia para importar o estado atual para a conta autenticada e pedir ao gerente que escolha a data à qual esses lançamentos pertencem. Preservar a cópia local até que a migração remota seja confirmada. Não associar silenciosamente dados do navegador a uma conta nem inventar histórico.

## Decisões pendentes

| Tema | Definição necessária |
| --- | --- |
| Aplicação do valor fixo | Como tratar períodos sem vendas, períodos parciais e mudanças de regra durante a semana ou o mês? Em qual data atribuir o fixo semanal/mensal para consolidar relatórios? |
| Semana | Qual é o primeiro dia da semana e como apresentar semanas que atravessam meses? |
| Fuso | Confirmar se `America/Sao_Paulo` será o padrão das equipes. |
| Correções históricas | Como permitir alteração explícita do percentual e do fixo de um dia anterior? |
| Exportação atual | Manter o resumo diário em PNG além dos novos relatórios em PDF? |

A periodicidade será escolhida e poderá ser editada pelo gerente. As regras de aplicação em períodos parciais e sem vendas precisam ser definidas antes de implementar os cálculos dos relatórios. As regras atuais somam o fixo mesmo sem vendas, mas não possuem uma unidade de tempo.

## Ordem de implementação

1. Definir as regras pendentes, criar o banco, as permissões e a autenticação.
2. Implementar equipes e pessoas vinculadas à conta, com migração opcional dos dados locais.
3. Implementar histórico diário e preservação das regras aplicadas.
4. Implementar consultas semanais e mensais e relatórios em PDF.
5. Implementar backup JSON, prévia e importação para uma nova equipe.

## Critérios de aceite

- Um gerente não consegue consultar ou alterar dados de outro, inclusive por chamadas diretas à API.
- Sair da conta e entrar em outra não expõe dados da sessão anterior na interface.
- Dados salvos ficam disponíveis ao acessar a mesma conta em outro dispositivo.
- Trocar a data ou recarregar a página preserva os registros salvos.
- Mudar as regras padrão ou arquivar uma pessoa preserva os resultados históricos.
- O gerente consegue editar o valor fixo e sua periodicidade com data de início, preservando os lançamentos anteriores e sem duplicar o fixo nos relatórios.
- PDFs correspondem à soma dos registros do período, incluindo limites de semana e mês e regras de arredondamento.
- O backup restaura os dados em uma nova equipe sem modificar a equipe original do destinatário.
- Arquivos inválidos são recusados sem gravação parcial, e importar a cópia não concede acesso à equipe de origem.

## Possível evolução futura

Compartilhar uma equipe por convite, com permissões de acesso, caso surja a necessidade de vários gerentes trabalharem sobre os mesmos registros. Esse recurso não faz parte da primeira versão.
