## **Tasks**

- Add logic to ensure that appointments can only be scheduled during the health units' operating hours, not just based on the doctors' availability.
- Define a util to add an icon based on the health unit service type
- Add queue code partner, ex: AP001 -> Atendimento prioritario, AN001 -> Atendimento normal, maybe the numbers can be reseted in the end of the day and used again in the oder day
- Think how can I get the waiting time in back and front -> health-unit-info.tsx;
- Add logic to show user password when he is writing -> login-form.tsx and signup-form.tsx;
- Add logic in backend and frontend to allow the user make a image upload for you profile - DONE
- Show user image profile -> header.tsx and profile-content.tsx - DONE
- Add button to edit and upload user profile image no app - profile-content.tsx - DONE
- Whenever the doctor opens the dashboard, they will see all of their queues, but all of them will be closed by default. The doctor should only be able to open **one queue at a time** , according to the queue's scheduled date. Once the **last patient** in the queue has been **attended** or **canceled due to absence** , the queue should automatically close. Implement this logic.
- Create a notification system for **minha-vez-app** . - DONE
- Add a **Loading Skeleton** to the app to display while `isLoading` is `true` using the `react-native-skeleton-placeholder` dependency — **minha-vez-app** .
- Refactor the app, especially the **React Query** request handling — **minha-vez-app** .
- Define a utility to assign an icon based on the health unit's service type — `health-unit-info.tsx`.
- Solve webSockt and notification error. - DONE
- ver sistema de prioridade pra poder mesclar em uma fila norma, prioridade, normal,prioridade.
- implementar sistema de exames colocando pra o admin fazer o upload do exame com base no cpf user mostrar o examo tanto pro usuario quanto para o medico.
- implementar sistema pra que o medico possa marcar o retorno do paciente antes de encerrar o atendimento, adicionar uma flag pra caso seja paciente de retorno esse botão do retorno não irá mais aparecer pra aquele paciente.
