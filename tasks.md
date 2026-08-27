## **Tasks**

- Fazer ajustes visuais no manager medico e admin e app tbm.
- Refatorar o APP - Started
- Criar alertas de erro no papertrail pra vir pro meu email.
- Ajustar notificações pois esta sendo enviadas notificações em periodo errado exemplo marquei uma consulta pra amanhã e recebi a correta sua consulta é amanhã e a errada sua consulta é hoje.

## Sobre a version:

- **patch** (`1.0.x`) — correções de bug, ajustes pequenos, sem mudar comportamento visível. É o que seus builds fazem automaticamente.
- **minor** (`1.x.0`) — nova funcionalidade que não quebra nada existente. Você reseta o patch: rode `node scripts/bump-version.js minor`.
- **major** (`x.0.0`) — mudança grande/breaking, redesign, ou um marco importante do produto. Reseta minor e patch: `node scripts/bump-version.js major`.

## Implementação Futura

- Criar sistema de gamificação, existem varios exemplos, pensar no melhor caso para o meu app, app de exemplo: Quero Delivery, Duolingo.
- Estudar e implementar sistema de pagamento pelo app pois atualmente é apenas na clinica para as privadas, UBS é gratuito.

## Done

- Add queue code partner, ex: AP001 -> Atendimento prioritario, AN001 -> Atendimento normal, maybe the numbers can be reseted in the end of the day and used again in the oder day. DONE
- Adiconar sistema de avaliação de medico e clinica e mostrar um carzinho com a quantidade de estrilinhas que ele tem de 1 a 5. DONE
- Define a util to add an icon based on the health unit service type. DONE
- Think how can I get the waiting time in back and front. DONE
- Add logic to show user password when he is writing using an eye icon to show when user click. DONE
- Add logic in backend and frontend to allow the user make a image upload for you profile. - DONE
- Show user image profile -> header.tsx and profile-content.tsx. - DONE
- Add button to edit and upload user profile image no app - profile-content.tsx. - DONE
- Whenever the doctor opens the dashboard, they will see all of their queues, but all of them will be closed by default. The doctor should only be able to open **one queue at a time** , according to the queue's scheduled date. DONE
- Create a notification system for **minha-vez-app** . - DONE
- Add a **Loading Skeleton** to the app to display while `isLoading` is `true` using the `react-native-skeleton-placeholder` dependency — **minha-vez-app** . DONE
- Refactor the app, especially the **React Query** request handling — **minha-vez-app** .
- Solve webSockt and notification error. - DONE
- Melhorar sistema de fila pra poder mesclar em uma fila entre pessoa normal, prioritaria, normal,prioritaria e etc. DONE
- Alterar cores dos places holder dos inputs pra deixar masi escura pra visibilidade. - DONE
- Adicionar mensagens de erros visuais pra erros que são causados pelo preenchimente de forma errada pelo user ex: data errada, CPF invalido e etc. - DONE
- Alterar input de sala pra ser so o numero exemplo 10, 40 e etc ao inves de texto e numero, limitar a numeração ate 9999. - DONE
- Adicionar opção do paciente cancelar consulta com regra de que so pode cancelar ate meio dia do dia anterior, pode ser colocada na tela que abre quando ele clica pra ver as infos da fila o butão em vermelho na parte de baixo, assim que ele clicar abra um modal perguntando se ele deseja cancelar mesmo com o butão de confirmar e um x na parte de cima pra fechar o modal caso ele não queira cancelar, se for necessario implementar algo no back implemente. - DONE
- Implementar sistema de marcar exame como concluido, será um novo painel no manager porem agora pra um usuario que tem sua classificação EXAMPROFESSIONAL, esse vai acessar essa nova aba ver a lista de pessoas que tem pra fazer exame, quando a pessoa chegar na clinica o EXAMPROFESSIONAL marca iniciar ai vai ficar com status iniciado até acabar o exame e conforme for concluindo ela vai marcando como concluida e o status ira pra finalizado, terá a tela de historico pra mostrar o exames e tela de perfil, após exame ficar com
- Status finalizado some da tela do usuario, esse sistema não será com fila cada um terá seu horario marcado so ir e fazer o exame. - DONE
- Implementar no painel manager do EXAMPROFESSIONAL tera uma funcionalidade pra que quando o exame do user tiver pronto ele vai clicar em butão que vai abrir um modal onde ela vai por o PDF do exame do user e o CPF dele, assim que ela clicar em confirma será enviado para o email do/dos ADMIN para que eles possam mandar para o medico e pro USer como é feito atualmente, ou seja será uma nova tela pra isso. - DONE
- Criar tela do ver todos em serviços oferecidos - DONE
- Toda mensagem de erro e textos que tiver em ingles por em portugues - DONE
- Implement Dark theme based on user SO - DONE
- Configurar papertrail. - DONE
- Implementar uma forma de permitir o user sobreescrever o Theme do SO exemplo: O SO dele ta em modo claro mas ele quer o app em modo escura ai ele aperta em um botão la em profile e muda o thema pra escuro. - DONE
- Alterar a mostragem da data de nascimento para DD/MM/AAAA pois é o padrão do Brasil. - DONE
- Add logic to ensure that appointments can only be scheduled during the health units' operating hours, not just based on the doctors' availability. - DONE
- Melhorar o sistema de cadastrar alguem com prioridade de atendimento, atualmente todo usuario quando cadastrado fica como normal, preciso que adicione ele em prioritario assim que se cadastrar e sua idade for maior que 60, colocar nova opção da hora do cadastro com dados baseados no meu enum do back no contrato pra ele selecionar se ele tem alguma coisa ou não usando um dropdown com os dados do enum pra que ele possa entrar em prioridade. - DONE
- No sistema de prioridade no dropdown por doenças cronicas ou algo assim ao selecionar esse opção aparecer uma mensagemzinha abaixo dela em amarelo dizendo pra levar comprovante no dia ou anexar em perfil o comprovante olgo nesse estilo de texto coloque o mais recomendado. - DONE
- Criar nova tela em profile pra ele anexar PDF ou imagem do comprovante de exame de alguma doença que ele tenha, nessa tela ele tbm vai por informações como tipo sanguineo e etc não é obrigatorio pois nem todos sabem tipo sanguineo e etc ai lembre de modificar a mensagem em amarelo no modal de cadastro de paciente pra que agora tenha a info dele fazer o upload . - DONE
- Implementar a opção do paciente editar sua prioridade em profile, pois atualmente ele não pode editar e pode acontecer de em algum momento da vida ele ter algum problema e entar em prioridade. - DONE
- Implementar uma nova tela que ira ficar todas as configs de Profile tipo um mais configurações ou configurações ja que atualmente tem varios buttons de navegação em profile, deixando em perfil so a imagem e nome, informções pessoas, informações de saude novo card que tem o design no figma e ver notificações e sair da conta. - DONE
- Implementar algo que separe a unidade publica da privada na hora que o Admin for cadastrar ele irá definir isso. Pois no fluxo atual não há nada que separe isso, o que pode dificultar para a futura implementação do gamification. - DONE
- AJustar a font do não informado em tipo sanguinio diminuir o texto. - DONE
- Impementar sistema de versão para que sempre que um build for realizado ele subir uma versão tipo 1.1.1 e etc seguindo o padrão de mercado atualmente o app ja esta no quarto build que eu me lembre, ai coloca a versçao e uma mensagenzinha sendo feito por gabriel santana santos como copyrigth assim como na imagem acima de exemplo a versão seŕa mostrada na parte de baixo de profile apos o ultimo componente. - DONE
- `Implementar na raiz do projeto do front, vars.scss e por todas as cores la de forma separadas usando o padrão: $primary e etc.` - DONE
- Implementar uma nova funcionalidade pra quando o user clicar na sua imagem de perfil que está no header e tbm no header da home ele redirecionar pra profile. - DONE
- Implementar funcionalidade pra quando o user clicar em sua imagem em profile ele ampliar a imagem assim como no whatsapp pra que ele consiga ver sua imagem. - DONE
- Minha-vez-manager - implementar tema ecuro, ligth e padrão do navegador. - DONE
- Minha-vez-manager - implementar mensagens de erros mais semanticas e visuais para o manager para facilitar os user a visualizar seus erros. - DONE
- Minha-vez-manager - implementar modal que ira abrir ao clicar em um exame na tela de Exames disponiveis para que seja possivel visualizar as infos do exame. - DONE
- Minha-vez-app - implementar nova tela para que ao clicar pra visualizar um exame agendado em meu exames ele mostrar tbm o Preparo para fazer aquele exame pois atualmente so mostra informações baiscas como valor, data, localização. - DONE
- Minha-vez-app - Implementar um novo card/button em serviço rapidos que será, minhas consultas onde ao clicar vai redirecionar para um nova tela onde vai mostrar cards de todas as consultas que o user tem agendada mostrando infos da consulta e quando ele clicar vai redirecionar pra tela da fila daquela consulta. - DONE
- Minha-vez-app - implementar um Ver todos no mesmo view do Titulo Serviços Rapidos onde ao clicar abrira uma nova tela onde vai listar todos os serviços rapidos usando o mesmo formato dos cards da home coloca 4 por coluna e ao clicar cada um redireciona pra sua respectiva tela. - DONE
- Minha-vez-app - Implementar listas paginadas de clinicas, exames, historicos de consulta e etc, ou seja todo e qualquer lugar que possa ter varios cards adicionar a paginação com numero padrão de paginados de 10. - DONE
- Criar script pra colar o mongoDB e gerar varias unidade de saude e profissonais vinculado a uma dessas unidade pra poder testar a paginação. - DONE
- Minha-vez-app - Na tela de explorar no card que mostrar os especialistas renderizar dentro do circulo de imagem a foto do especialista. - DONE
- Minha-vez-app - no cardzinho que fica abaixo do search a home quando a mensagem fica muito grande os textos ficam colando um no outro permita a quebra de linha quando isso acontecer porem so quando o texto for ficar maior que o card. - DONE
- Minha-vez-app - Verificar se a info que aparece no card de clinicas em explorar sobre as filas min de espera e pessoas na fila são mocadas se for implemente uma nova funcionalidade pra sempre mostrar isso se realmente tiver fila aberta ai vai mostra a qtd de pessoas que estão naquela fila que esta aberta no exato momento se não tiver fila aberta não mostrar no card. - DONE
- AJustar teclado sobrepondo os inputs. - DONE
- Configurar Papertrail no painel manager e configurar erros pra aparecer nos logs do papertrail. - DONE
