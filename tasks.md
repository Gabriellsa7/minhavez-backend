## **Tasks**

- Add logic to ensure that appointments can only be scheduled during the health units' operating hours, not just based on the doctors' availability.
- Fazer ajustes visuais no manager medico e admin e app tbm.

# Implementação futura:

- Implementar sistema de marcação de exame do paciente no app, ja que atualmente so é permitido marcar consulta e visualizar filas de consulta e seus resultados de exames que fez. Ainda não ha clinica que possa fazer exames então essa funcionalidade vai permitir cadastrar clinicas que façam exames com todas as infos que é necessaria pra ser uma clinica de exames busque quais as melhores infos e implemente essa task.

# Done:

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
