## **Tasks**

- Add logic to ensure that appointments can only be scheduled during the health units' operating hours, not just based on the doctors' availability.

# Implementar agendamento de retorno pelo médico - DONE

Adicionar na fila de atendimento do médico um botão **"Marcar Retorno"**, junto das ações de concluir/ausente.

Ao clicar, deve abrir um modal semelhante ao fluxo de agendamento do app, mostrando **dias e horários disponíveis**. Porém, nesse caso, o profissional já deve ser definido automaticamente como o médico que está realizando o atendimento, sem precisar selecioná-lo novamente.

Ao confirmar, deve ser criado um novo agendamento para o paciente com uma **flag indicando que é um retorno**, por exemplo `is_return = true`.

### Regra da flag

- Agendamentos realizados normalmente pelo paciente no app → `is_return = false`.
- Agendamentos criados pelo médico através de **"Marcar Retorno"** → `is_return = true`.

Quando o paciente voltar para esse atendimento, o sistema deve identificar que o agendamento é um retorno e **não exibir o botão "Marcar Retorno"** novamente. Assim, o médico não consegue marcar um "retorno do retorno".

Na fila, seria interessante também identificar visualmente quando o atendimento é um retorno, por exemplo com uma tag **"Retorno"** no card.

### Fluxo

`Consulta normal → Médico atende → Marca retorno → Seleciona data/horário → Retorno criado com is_return = true → Paciente retorna → Botão "Marcar Retorno" não aparece`

# Implementação do Sistema de Exames

## Objetivo

Implementar um novo sistema de gerenciamento e visualização de exames no aplicativo, permitindo que os exames dos pacientes sejam cadastrados pela clínica, vinculados automaticamente ao paciente através do CPF e posteriormente acessados tanto pelo paciente quanto pelo médico responsável.

O sistema deverá permitir o upload dos resultados em PDF, armazenamento seguro dos arquivos e visualização/download de acordo com o perfil de acesso.

## Acesso do Paciente

Na seção "Serviços Rápidos" do aplicativo, adicionar um novo botão:

#### "Meus Exames"

Ao clicar, o paciente será redirecionado para uma nova tela onde poderá visualizar todos os exames vinculados ao seu CPF.

#### Tela "Meus Exames"

Os exames deverão ser apresentados em formato de cards, contendo apenas as informações principais, como:

- Tipo/nome do exame;
- Data em que o exame foi realizado;
- Nome do médico;
- Nome da clínica;
- Outras informações essenciais relacionadas ao exame.

### Visualização do exame

Ao clicar em um card:

- O card deverá expandir ou abrir uma tela de detalhes;
- O usuário poderá visualizar o arquivo PDF do exame dentro do aplicativo;
- Deverá existir uma opção para baixar o PDF;
- O usuário deverá conseguir retornar facilmente para a lista de exames.

## Cadastro de Exames pelo Admin da Clínica

Criar uma nova tela exclusiva para o usuário Admin da clínica, destinada ao cadastro dos resultados dos exames.

### Fluxo de cadastro

O administrador deverá:

- Informar o CPF do paciente;
- O sistema deverá localizar o paciente correspondente;
- Selecionar/informar o tipo de exame;
- Informar a data de realização do exame, quando necessário;
- Fazer o upload do arquivo PDF com o resultado do exame;
  Confirmar o cadastro.

Após o cadastro, o sistema deverá:

- Vincular automaticamente o exame ao paciente encontrado pelo CPF;
- Armazenar o arquivo de forma segura;
- Disponibilizar o exame automaticamente na área "Meus Exames" do paciente;
- Permitir que o exame também seja visualizado pelo médico autorizado a acessar os exames daquele paciente.###

### Validações

O sistema deverá validar, no mínimo:

- Se o CPF informado pertence a um paciente cadastrado;
- Se o arquivo enviado possui formato permitido, inicialmente PDF;
- Se o upload foi concluído corretamente;
- Se os dados obrigatórios do exame foram preenchidos.

## Acesso do Médico

Criar uma nova área/tela para que o médico possa consultar os exames dos pacientes aos quais ele possui acesso.

### Lista de exames

Os exames deverão ser apresentados em cards contendo as principais informações do paciente e do exame, como:

- Nome do paciente;
- Identificação do paciente;
- Tipo/nome do exame;
- Data de realização;
- Clínica;
- Outras informações relevantes.

A listagem deverá apresentar somente os pacientes/exames que o médico está autorizado a visualizar.

### Visualização do exame

Ao clicar em um card:

- Abrir uma tela de detalhes ou visualização do exame;
- Exibir o PDF diretamente no aplicativo;
- Disponibilizar uma opção para baixar o arquivo;
- Permitir retornar para a lista de exames.

## Controle de Acesso

O sistema deverá respeitar as permissões de cada perfil:

### Admin da Clínica

- Cadastrar exames;
- Informar o CPF do paciente;
- Fazer upload dos PDFs;
- Visualizar os exames conforme suas permissões.

### Paciente

- Visualizar somente os próprios exames;
- Abrir/visualizar os PDFs;
- Baixar os próprios exames.

### Médico

- Visualizar somente os exames dos pacientes aos quais possui autorização/acesso;
- Abrir/visualizar os PDFs;
- Baixar os exames permitidos.

## Fluxo geral

- Admin da Clínica -> Cadastro do exame → CPF do paciente → Localização do paciente → Upload do PDF → Vinculação ao paciente → Exame disponível
- Paciente -> Serviços Rápidos → Meus Exames → Lista de exames → Selecionar exame → Visualizar PDF → Baixar
- Médico -> Área de exames → Pacientes/exames disponíveis → Selecionar exame → Visualizar PDF → Baixar

## Requisitos principais

- Criar a nova funcionalidade de Exames;
- Criar tela de Meus Exames para o paciente;
- Criar tela de Cadastro de Exames para o Admin da clínica;
- Criar tela de Exames dos Pacientes para o médico;
- Implementar upload de arquivos PDF;
- Vincular exames ao paciente através do CPF;
- Implementar armazenamento e recuperação dos arquivos;
- Implementar visualização de PDF dentro do aplicativo;
- Implementar download dos exames;
- Implementar controle de acesso por perfil;
- Garantir que pacientes não consigam acessar exames de outros pacientes;
- Garantir que médicos somente tenham acesso aos exames dos pacientes autorizados;
- Exibir nos cards apenas as informações realmente necessárias para identificação e contexto do exame.

## Resultado esperado

Ao final da implementação, o fluxo deverá ser totalmente integrado: o Admin da clínica cadastra o exame utilizando o CPF do paciente, o sistema realiza a vinculação automaticamente e o exame passa a aparecer para o paciente na área "Meus Exames" e para o médico autorizado na área de exames dos seus pacientes. Ambos poderão visualizar o PDF diretamente no aplicativo e realizar o download quando necessário.

# Implementação futura:

- Adiconar sistema de avaliação de medico e clina e mostrar um carzinho com a quantidade de estrilinhas que ele tem de 1 a 5.
- Implementar sistema de marcação de exame do paciente no app, ja que atualmente so é perdido marca consultar e visualizar filas de consulta e seus resultados de exames que ele fez.

# Done:

- Add queue code partner, ex: AP001 -> Atendimento prioritario, AN001 -> Atendimento normal, maybe the numbers can be reseted in the end of the day and used again in the oder day DONE
- Define a util to add an icon based on the health unit service type DONE
- Think how can I get the waiting time in back and front DONE
- Add logic to show user password when he is writing using an eye icon to show when user click DONE
- Add logic in backend and frontend to allow the user make a image upload for you profile - DONE
- Show user image profile -> header.tsx and profile-content.tsx - DONE
- Add button to edit and upload user profile image no app - profile-content.tsx - DONE
- Whenever the doctor opens the dashboard, they will see all of their queues, but all of them will be closed by default. The doctor should only be able to open **one queue at a time** , according to the queue's scheduled date. DONE
- Create a notification system for **minha-vez-app** . - DONE
- Add a **Loading Skeleton** to the app to display while `isLoading` is `true` using the `react-native-skeleton-placeholder` dependency — **minha-vez-app** . DONE
- Refactor the app, especially the **React Query** request handling — **minha-vez-app** .
- Solve webSockt and notification error. - DONE
- melhorar sistema de fila pra poder mesclar em uma fila entre pessoa normal, prioritaria, normal,prioritaria e etc. DONE
