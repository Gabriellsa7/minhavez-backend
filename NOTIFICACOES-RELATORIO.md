# Relatório de notificações e observabilidade

## Escopo

Este documento consolida a implementação atual do ecossistema de notificações, filas e observabilidade. A arquitetura existente foi preservada: as adições reutilizam os serviços, repositórios, providers, workers e factories já existentes.

## Backend

### Notificações

- Entidade, schema e repositório de `Notification` com status, tentativas, prioridade, datas de envio/entrega, erro e metadados.
- `NotificationService` para criação, persistência, agendamento e processamento de notificações.
- `QueueNotificationService` para notificações de aproximação na fila (posições 10, 5, 3, 2 e 1), com deduplicação por paciente e posição.
- `AppointmentReminderService` para criação de lembretes de consulta.
- Provider Expo para push; sem `EXPO_ACCESS_TOKEN`, o envio é simulado e registrado em log estruturado.
- Registro de múltiplos dispositivos por usuário via `PushTokenService` e `POST /notifications/register-token`.
- Gateway WebSocket para eventos de criação e entrega.

### BullMQ e Redis

Filas registradas:

- `notification.queue`
- `appointment.queue`
- `notification.failed.queue` (DLQ)

Workers disponíveis:

- `NotificationWorker`: processa push, atualiza a notificação e só envia jobs à DLQ após esgotar as tentativas.
- `AppointmentWorker`: processa jobs de consulta.

Scripts adicionais:

```bash
npm run worker:notifications
npm run worker:appointments
```

O provider Redis/BullMQ foi ajustado para `maxRetriesPerRequest: null`, requisito do BullMQ 6 para conexões usadas pelos workers.

## Observabilidade

### Bull Board

- Painel em `GET /admin/queues`.
- As três filas acima são registradas automaticamente no painel.
- Dependências instaladas: `@bull-board/api@8.5.0` e `@bull-board/express@8.5.0`.

### Health checks

| Rota | Retorno |
| --- | --- |
| `GET /health` | Estado agregado de MongoDB, Redis, BullMQ, filas e workers. |
| `GET /health/redis` | Resultado do comando Redis `PING`. |
| `GET /health/bullmq` | Conectividade BullMQ, contadores e workers. |
| `GET /health/queues` | Jobs `waiting`, `active`, `delayed`, `completed` e `failed` por fila. |

### Endpoint de desenvolvimento

`POST /debug/test-notification` é registrado somente quando `NODE_ENV` não é `production`.

Ele cria uma `Notification`, cria um job real em `notification.queue` e retorna:

```json
{
  "notificationId": "...",
  "jobId": "...",
  "queue": "notification.queue",
  "status": "queued"
}
```

### Logs estruturados

Foram mantidos/adicionados logs para:

- conexão Redis/BullMQ;
- início e conclusão de worker;
- criação, início, retry e conclusão de job;
- encaminhamento para DLQ;
- push enviado, falho ou simulado.

## Docker e variáveis de ambiente

O `docker-compose.yml` existente foi preservado e recebeu o serviço `redis:7-alpine`, com volume persistente `redis-data`. Nenhum MongoDB ou serviço adicional foi incluído.

Variáveis relevantes:

```env
REDIS_URL=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
EXPO_ACCESS_TOKEN=
```

Para iniciar somente o Redis local:

```bash
docker compose up -d redis
```

## Aplicativo Expo

Foram adicionadas as dependências compatíveis com Expo SDK 54:

- `expo-device@~8.0.10`
- `expo-notifications@~0.32.17`

Elas corrigem as importações e declarações de tipo de `expo-device` e `expo-notifications` usadas pelo serviço de notificações e pelo layout raiz.

Também foram corrigidos:

- handler de notificações compatível com o SDK atual (`shouldShowBanner` e `shouldShowList`);
- rota tipada da tela de notificações;
- erro de sintaxe em `src/app/index.tsx`;
- usos de `any` no app, substituídos por tipos concretos ou `unknown`.

## Correções de tipo

- Removidos todos os `any` explícitos de `src` no backend e no app.
- Payload de erro Axios tipado no app.
- Erros Axios tratados como `unknown` e refinados com `isAxiosError`.
- Serviços de notificação tipados sem casts `any`.
- Mocks de testes migrados de `any` para interfaces de domínio.
- Corrigida a atualização do repositório de notificações para persistir `params.notificationData`, incluindo o status `SENT` após processamento.

## OpenAPI

`src/contracts/service.yaml` foi atualizado com as rotas de health check, status de filas, Bull Board e endpoint de teste de desenvolvimento, além de schemas para respostas de infraestrutura.

## Validação executada

### Backend

```text
npx tsc --noEmit -p tsconfig.json  ✓
npm run test:unit -- --runInBand   ✓
```

Resultado: 5 suítes e 5 testes aprovados.

### App

```text
npm run lint       ✓ (sem erros; há 4 avisos antigos e não bloqueantes em login-form)
npx tsc --noEmit   ✓
```

### Fluxo real validado

- MongoDB conectado.
- Redis respondeu `PONG`.
- BullMQ conectado.
- Bull Board respondeu HTTP 200.
- Workers `notification.queue` e `appointment.queue` iniciados.
- Job `2` criado em `notification.queue`.
- Notification `6a71d4295b75295cb2c3dadd` criada e persistida.
- Worker consumiu o job e a notification foi atualizada para `SENT`.
- Push Expo simulado porque `EXPO_ACCESS_TOKEN` não estava configurado.
- DLQ vazia: todos os contadores estavam em zero após o processamento.

Evidência de log:

```text
Notification job created jobId=2 queue=notification.queue
Notification worker started jobId=2
Expo push simulated reason=EXPO_ACCESS_TOKEN not configured
Push delivered notificationId=6a71d4295b75295cb2c3dadd
Notification worker finished jobId=2
Job completed jobId=2
```

## Limitação da validação de appointment

O ambiente conectado possuía pacientes e unidade de saúde, mas nenhum profissional de saúde. Por isso não foi criada uma consulta de teste persistente artificial. O worker e a fila de appointment foram iniciados e expostos no monitoramento; a validação completa de criação de appointment requer um profissional válido no ambiente.
