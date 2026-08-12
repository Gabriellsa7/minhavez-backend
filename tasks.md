## **Tasks**

- Add logic to ensure that appointments can only be scheduled during the health units' operating hours, not just based on the doctors' availability.
- Fazer ajustes visuais no manager medico e admin e app tbm.
- Alterar input de sala pra ser so o numero exemplo 10, 40 e etc ao inves de texto e numero, limitar a numeração ate 9999.
- Implementar sistema de marcar exame como concluido, será um novo painel no manager porem agora pra um usuario que tem sua classificação EXAMPROFESSIONAL, esse vai acessar essa nova aba ver a lista de pessoas que tem pra fazer exame e conforme for concluindo ela vai marcando como concluida, terá a tela de historico pra mostrar o exames e tela de perfil.

## Implementação Futura:

- Implementar no painel manager do EXAMPROFESSIONAL tera uma funcionalidade pra que quando o exame do user tiver pronto ele vai clicar em butão que vai abrir um modal onde ela vai por o PDF do exame do user e o CPF dele, assim que ela clicar em confirma será enviado para o email do/dos ADMIN.

## Done:

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
- melhorar sistema de fila pra poder mesclar em uma fila entre pessoa normal, prioritaria, normal,prioritaria e etc. DONE
