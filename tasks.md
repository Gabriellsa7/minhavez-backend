## **Tasks**

- Cria um CI/CD no meu projeto - **PRIORIDADE**
- Fazer ajustes visuais no manager medico e admin e app tbm.
- Refatorar o APP - Started
- Criar alertas de erro no papertrail pra vir pro meu email.
- Cria um manual de uso pro app e manager, tipo um tutorial pode ser tbm.
- Verificar se o parpertrail ta configurado no ambiente de PROD.
- Refatorar o painel dos recepcionistas.

## Sobre a version:

- **patch** (`1.0.x`) — correções de bug, ajustes pequenos, sem mudar comportamento visível. É o que seus builds fazem automaticamente.
- **minor** (`1.x.0`) — nova funcionalidade que não quebra nada existente. Você reseta o patch: rode `node scripts/bump-version.js minor`.
- **major** (`x.0.0`) — mudança grande/breaking, redesign, ou um marco importante do produto. Reseta minor e patch: `node scripts/bump-version.js major`.

## Implementação Futura Dentro do Escopo do TCC

- Criar um novo Sistema esse será separado que em um novo repo, pois será um sistema de mostrar a atualização da fila que está ocorrendo no app, ele mostrar o codigo chamado, terá audio falando o codigo do usuario, mostrará o que esta sendo chamado, os que foram chamados com infos como codigo, hora que foi chamado, sala a qual deve se dirigir e vou pensar se tem mais algo, ele terá regras como o codigo será repetido pela voz 3 vezes cada codigo, além disso tem que ter um delay caso outro codigo seja chamado pra que a voz não fale 2 ao mesmo tempo e fique embolado ai a voz falara o codigo e a sala que ele tem que ir. Esse sistema é pra que as pessoas que estejam presencial ou seja as que marcaram na recepção ou os que marcaram pelo app e ja estão lá tbm eles possam ver e saber pra ondem se dirigir e o momento em que foram chamados. Estudar como implementar isso.

## Implementação Fora do Escopo do TCC

- Criar sistema de gamificação, existem varios exemplos, pensar no melhor caso para o meu app, app de exemplo: Quero Delivery, Duolingo.
- Estudar e implementar sistema de pagamento pelo app pois atualmente é apenas na clinica, OBS: Essa funcionalidade será apenas para as unidades de saúde privadas, UBS continua gratuito.

## Done

1. Add queue code partner, ex: AP001 -> Atendimento prioritario, AN001 -> Atendimento normal, maybe the numbers can be reseted in the end of the day and used again in the oder day. DONE
2. Adiconar sistema de avaliação de medico e clinica e mostrar um carzinho com a quantidade de estrilinhas que ele tem de 1 a 5. DONE
3. Define a util to add an icon based on the health unit service type. DONE
4. Think how can I get the waiting time in back and front. DONE
5. Add logic to show user password when he is writing using an eye icon to show when user click. DONE
6. Add logic in backend and frontend to allow the user make a image upload for you profile. - DONE
7. Show user image profile -> header.tsx and profile-content.tsx. - DONE
8. Add button to edit and upload user profile image no app - profile-content.tsx. - DONE
9. Whenever the doctor opens the dashboard, they will see all of their queues, but all of them will be closed by default. The doctor should only be able to open **one queue at a time** , according to the queue's scheduled date. DONE
10. Create a notification system for **minha-vez-app** . - DONE
11. Add a **Loading Skeleton** to the app to display while `isLoading` is `true` using the `react-native-skeleton-placeholder` dependency — **minha-vez-app** . DONE
12. Refactor the app, especially the **React Query** request handling — **minha-vez-app** .
13. Solve webSockt and notification error. - DONE
14. Melhorar sistema de fila pra poder mesclar em uma fila entre pessoa normal, prioritaria, normal,prioritaria e etc. DONE
15. Alterar cores dos places holder dos inputs pra deixar masi escura pra visibilidade. - DONE
16. Adicionar mensagens de erros visuais pra erros que são causados pelo preenchimente de forma errada pelo user ex: data errada, CPF invalido e etc. - DONE
17. Alterar input de sala pra ser so o numero exemplo 10, 40 e etc ao inves de texto e numero, limitar a numeração ate 9999. - DONE
18. Adicionar opção do paciente cancelar consulta com regra de que so pode cancelar ate meio dia do dia anterior, pode ser colocada na tela que abre quando ele clica pra ver as infos da fila o butão em vermelho na parte de baixo, assim que ele clicar abra um modal perguntando se ele deseja cancelar mesmo com o butão de confirmar e um x na parte de cima pra fechar o modal caso ele não queira cancelar, se for necessario implementar algo no back implemente. - DONE
19. Implementar sistema de marcar exame como concluido, será um novo painel no manager porem agora pra um usuario que tem sua classificação EXAMPROFESSIONAL, esse vai acessar essa nova aba ver a lista de pessoas que tem pra fazer exame, quando a pessoa chegar na clinica o EXAMPROFESSIONAL marca iniciar ai vai ficar com status iniciado até acabar o exame e conforme for concluindo ela vai marcando como concluida e o status ira pra finalizado, terá a tela de historico pra mostrar o exames e tela de perfil, após exame ficar com
20. Status finalizado some da tela do usuario, esse sistema não será com fila cada um terá seu horario marcado so ir e fazer o exame. - DONE
21. Implementar no painel manager do EXAMPROFESSIONAL tera uma funcionalidade pra que quando o exame do user tiver pronto ele vai clicar em butão que vai abrir um modal onde ela vai por o PDF do exame do user e o CPF dele, assim que ela clicar em confirma será enviado para o email do/dos ADMIN para que eles possam mandar para o medico e pro USer como é feito atualmente, ou seja será uma nova tela pra isso. - DONE
22. Criar tela do ver todos em serviços oferecidos - DONE
23. Toda mensagem de erro e textos que tiver em ingles por em portugues - DONE
24. Implement Dark theme based on user SO - DONE
25. Configurar papertrail. - DONE
26. Implementar uma forma de permitir o user sobreescrever o Theme do SO exemplo: O SO dele ta em modo claro mas ele quer o app em modo escura ai ele aperta em um botão la em profile e muda o thema pra escuro. - DONE
27. Alterar a mostragem da data de nascimento para DD/MM/AAAA pois é o padrão do Brasil. - DONE
28. Add logic to ensure that appointments can only be scheduled during the health units' operating hours, not just based on the doctors' availability. - DONE
29. Melhorar o sistema de cadastrar alguem com prioridade de atendimento, atualmente todo usuario quando cadastrado fica como normal, preciso que adicione ele em prioritario assim que se cadastrar e sua idade for maior que 60, colocar nova opção da hora do cadastro com dados baseados no meu enum do back no contrato pra ele selecionar se ele tem alguma coisa ou não usando um dropdown com os dados do enum pra que ele possa entrar em prioridade. - DONE
30. No sistema de prioridade no dropdown por doenças cronicas ou algo assim ao selecionar esse opção aparecer uma mensagemzinha abaixo dela em amarelo dizendo pra levar comprovante no dia ou anexar em perfil o comprovante olgo nesse estilo de texto coloque o mais recomendado. - DONE
31. Criar nova tela em profile pra ele anexar PDF ou imagem do comprovante de exame de alguma doença que ele tenha, nessa tela ele tbm vai por informações como tipo sanguineo e etc não é obrigatorio pois nem todos sabem tipo sanguineo e etc ai lembre de modificar a mensagem em amarelo no modal de cadastro de paciente pra que agora tenha a info dele fazer o upload . - DONE
32. Implementar a opção do paciente editar sua prioridade em profile, pois atualmente ele não pode editar e pode acontecer de em algum momento da vida ele ter algum problema e entar em prioridade. - DONE
33. Implementar uma nova tela que ira ficar todas as configs de Profile tipo um mais configurações ou configurações ja que atualmente tem varios buttons de navegação em profile, deixando em perfil so a imagem e nome, informções pessoas, informações de saude novo card que tem o design no figma e ver notificações e sair da conta. - DONE
34. Implementar algo que separe a unidade publica da privada na hora que o Admin for cadastrar ele irá definir isso. Pois no fluxo atual não há nada que separe isso, o que pode dificultar para a futura implementação do gamification. - DONE
35. AJustar a font do não informado em tipo sanguinio diminuir o texto. - DONE
36. Impementar sistema de versão para que sempre que um build for realizado ele subir uma versão tipo 1.1.1 e etc seguindo o padrão de mercado atualmente o app ja esta no quarto build que eu me lembre, ai coloca a versçao e uma mensagenzinha sendo feito por gabriel santana santos como copyrigth assim como na imagem acima de exemplo a versão seŕa mostrada na parte de baixo de profile apos o ultimo componente. - DONE
37. `Implementar na raiz do projeto do front, vars.scss e por todas as cores la de forma separadas usando o padrão: $primary e etc.` - DONE
38. Implementar uma nova funcionalidade pra quando o user clicar na sua imagem de perfil que está no header e tbm no header da home ele redirecionar pra profile. - DONE
39. Implementar funcionalidade pra quando o user clicar em sua imagem em profile ele ampliar a imagem assim como no whatsapp pra que ele consiga ver sua imagem. - DONE
40. Minha-vez-manager - implementar tema ecuro, ligth e padrão do navegador. - DONE
41. Minha-vez-manager - implementar mensagens de erros mais semanticas e visuais para o manager para facilitar os user a visualizar seus erros. - DONE
42. Minha-vez-manager - implementar modal que ira abrir ao clicar em um exame na tela de Exames disponiveis para que seja possivel visualizar as infos do exame. - DONE
43. Minha-vez-app - implementar nova tela para que ao clicar pra visualizar um exame agendado em meu exames ele mostrar tbm o Preparo para fazer aquele exame pois atualmente so mostra informações baiscas como valor, data, localização. - DONE
44. Minha-vez-app - Implementar um novo card/button em serviço rapidos que será, minhas consultas onde ao clicar vai redirecionar para um nova tela onde vai mostrar cards de todas as consultas que o user tem agendada mostrando infos da consulta e quando ele clicar vai redirecionar pra tela da fila daquela consulta. - DONE
45. Minha-vez-app - implementar um Ver todos no mesmo view do Titulo Serviços Rapidos onde ao clicar abrira uma nova tela onde vai listar todos os serviços rapidos usando o mesmo formato dos cards da home coloca 4 por coluna e ao clicar cada um redireciona pra sua respectiva tela. - DONE
46. Minha-vez-app - Implementar listas paginadas de clinicas, exames, historicos de consulta e etc, ou seja todo e qualquer lugar que possa ter varios cards adicionar a paginação com numero padrão de paginados de 10. - DONE
47. Criar script pra colar o mongoDB e gerar varias unidade de saude e profissonais vinculado a uma dessas unidade pra poder testar a paginação. - DONE
48. Minha-vez-app - Na tela de explorar no card que mostrar os especialistas renderizar dentro do circulo de imagem a foto do especialista. - DONE
49. Minha-vez-app - no cardzinho que fica abaixo do search a home quando a mensagem fica muito grande os textos ficam colando um no outro permita a quebra de linha quando isso acontecer porem so quando o texto for ficar maior que o card. - DONE
50. Minha-vez-app - Verificar se a info que aparece no card de clinicas em explorar sobre as filas min de espera e pessoas na fila são mocadas se for implemente uma nova funcionalidade pra sempre mostrar isso se realmente tiver fila aberta ai vai mostra a qtd de pessoas que estão naquela fila que esta aberta no exato momento se não tiver fila aberta não mostrar no card. - DONE
51. AJustar teclado sobrepondo os inputs. - DONE
52. Configurar Papertrail no painel manager e configurar erros pra aparecer nos logs do papertrail. - DONE
53. Colocar uma ação component de Sua proxima consulta/exame na home ao clicar nele ele deve direcionar para a tela de infos daquele exame ou consulta. - DONE
54. Implementar logic pra mostrar sempre o proximo exame/consulta no cardzinho de lembrete - DONE
55. Implementar logica pra mostrar imagem da clinica no card do queueItems. - DONE
56. Implementar novo componente pra mostrar condicionlmente(sempre que houver consulta/exam mracado) onde vai mostrar as consultas e os exames que o usuario tem marcado. - DONE
57. Criar um readme bonito pra cada repository, app e manager add imagens. - DONE
58. Na nova seção de novas consultas e exames quando tiver 1 dias antes do exame/consulta por um cardzinho(o padrão inicial é não aparecer nenhum cardzinho até cumpir uma dessas 2 regras 1 dia antes e 1 hora antes) dentro do card na parte de cima em amarelo dizendo sua consulta/exame é amanhã e quando tiver faltando 1h no dia da consulta/exame esse cardzinho fica vermelho com uma mensagem tipo, sua consulta é: ai entra uma contagem regressiva até a hora da consulta ou exame ai depois que passar o horario do exame/consulta ela tendo sido finalizada ou não o card principal some junto com as infos e fica so o card das proxima consultas/exame. - DONE
59. Ajustar regra no backend pra impedir que o mesmo user marque mais de uma consulta no mesmo dia. - DONE
60. Ajustar logica no front(minha-vez-manager) pra que quando o medico atenda ou feche a fila de vez sem atender ninguem suma automaticamente da tela do user nos dois lugares que aparece na home. - DONE
61. Ajustar notificações pois esta sendo enviadas notificações em periodo errado exemplo marquei uma consulta pra amanhã e recebi a correta sua consulta é amanhã e a errada sua consulta é hoje. - DONE
62. Ajustar notificação pra so receber a notificação de posição na fila conforme a fila estiver aberta e o medico for chamando no manager ou seja usara websocket. - DONE
63. Implementar uma nova logica pra quando o medico fechar fila sem atender ninguem apareca um modal pra ele digitar o motivo e pro user apareca um modal mostrando o que o medico digitou todas essas infos tem que ser instataneas com wesocket ai assim que ele clicar confirmar ai a fila é fechada some automaticamente da tela do user que tiver com ela aberta e aparece um modal com o motivo e opção pra ele clicar em fechar se o user não tiver no app sim que ele entrar e logar o modal vai aparecer na tela dele tbm mostrando a mensagem e a opção de fechar. - DONE
64. Ajustar logica de mostrar filas na home(seção de filas ativas) pois esta mostrando varias fila algumas repetidas, outras que ja foram fechadas e futuras sendo que é so pra mostrar filas futuras e que estão acontecendo no momento após o user ser atendido ela tem que sumir, além disso nas infos do card da fila na home ta sempre aparecendo as infos de uma fila só normalmente da que foi marcada primeiro ajuste isso, pq cada fila tem sua informação propria.
65. Caso o usuario não adicione suas infos de tipo sanguineo e etc, adicionar um lembrete na home pra que ele lembre de preeencher essa infos dizendo que é importante. - DONE
66. Caso a fila seja fechada por cancelamento do medico, anterior ao dia da consulta permitir o user marcar consulta com outro medico naquele dia que ele ia fazer e foi cancelado. - DONE
67. Na seção de consultas/exam marcadas se ele tiver mais de uma mostrar todas que ele tem pq no comportamento atual so mostra a mais proxima isso ai é papel da seção de Sua proxima consulta/exam essa seção de Consulta e exames marcadps é pra mostrar todas que ele marcou. - DONE
68. Adicionar websockt no manager pra que quando o usuario marcar uma consulta a fila na aparece sem o medico da F5 no painel, alem disso permitir que mesmo com a fila aberta se ainda tiver horario o patient pode marcar entar naquela fila até o medico fechar caso o medico não fecha ela, ela será fechada automaticament 12h a da manha e 22h a da tarde, agora a fila não deve fechar mais altomaticamente quando o medico atender o ultimo agora so fecha quando ele aberta no botão de fechar fila. - DONE
69. Implementar logica pra permitir o medico marcar o retorno do usuario em até no maximo 20 dias depois do dia da consulta. - DONE
70. Alterar ordem das filas que são mostradas no painel manager pq atualmente mostra a ultima marcada eu quero mostra por ordem de data exemplo 27,28,29,30 se tiver duas no mesmo dia, mostra por ordem de turno 29 manha, 29 tarde, 30, 31, 32. - DONE
71. Ajustar redirecionamento da pagina de notfound e criar pagina de erro. - DONE
72. AJustar redirecionamento da pagina de notFound do manager com base no user logado ele sempre retornar pra home. - DONE
73. Melhorar a pagina de notfound colocando logo do app e uma menssagenzinha, criar uma pagina de erro com o mesmo padrão colocando uma mensagenzinha não tão agressiva pra não afetar o user. - DONE
74. Criar um painel pra uma nova role que será para as pessoas que ficam na recepção da clinica ou UBS de saúde eles são responsaveis por marcar a consulta/exame das pessoas que não fizeram pelo app e foram lá pra marcar ai elas vão fazer essa marcação da consulta/exam e eles vão entrar na mesma fila da galera que marcou pelo app usando a ordem atual que temos, esse novo painel terá a tela de marcar consulta, marcar exame e perfil. Essa marcação vai acontecer atraves do CPF do user eles vão digitar pra buscar o usuario, caso existe um user elas marcam se não existir ai elas terão que cadastrar o usuario, tera uma nova opção assim como a de marcar ela vai abrir um modal porem esse modal vai ser pra cadastrar o user com email, senha e etc o que o app pede pra marcar a consulta/exam, após isso esse user estará apto a usar o app e lá na clinica eles vão passar as credencias do user pra ele pode logar no app. - DONE
