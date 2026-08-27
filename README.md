<div align="center">

<!-- IMG: logo/banner do backend -->

# Minha Vez — Backend

**A API que orquestra filas de saúde em tempo real.**

Serviço central do ecossistema **Minha Vez**: gerencia unidades de saúde, profissionais, agendamentos de exames, filas de atendimento em tempo real, autenticação e notificações push/e-mail.

[![Node.js](https://img.shields.io/badge/Node.js-TypeScript-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-validated-6BA539?logo=openapiinitiative&logoColor=white)](./src/contracts/service.yaml)
[![Jest](https://img.shields.io/badge/tested%20with-Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)

<!-- IMG: diagrama de arquitetura ou print do Swagger/OpenAPI -->
</div>

---

## Sobre o projeto

O **minhavez-backend** é a API que sustenta o ecossistema Minha Vez, um sistema de gestão de filas para unidades de saúde:

| Repositório | Papel |
|---|---|
| ⚙️ **minhavez-backend** | API central — filas, agendamentos, notificações e autenticação |
| 📱 [minha-vez-app](https://github.com/Gabriellsa7/minha-vez-app) | App mobile usado pelos pacientes |
| 🖥️ [minha-vez-manager](https://github.com/Gabriellsa7/minha-vez-manager) | Painel web usado pelas unidades de saúde |

Construído em **Clean Architecture**, separando regras de negócio (domain) de detalhes de infraestrutura (banco, filas, e-mail, storage), o que facilita testes e manutenção a longo prazo.

## ✨ Funcionalidades

- 🔐 **Autenticação JWT** com refresh token e recuperação de senha por e-mail
- 🏥 **Unidades de saúde**, **profissionais** e **pacientes** — CRUD completo
- 📅 **Agendamento de exames**: disponibilidade, ofertas e reservas (*exam-availability*, *exam-offering*, *exam-booking*)
- ⏱️ **Filas de atendimento em tempo real** via WebSocket — posição, status e tempo estimado
- 🔔 **Notificações** push (Expo) e e-mail (Nodemailer), processadas de forma assíncrona com **BullMQ**
- ⭐ **Avaliações** de unidades e profissionais
- ☁️ **Upload de imagens e PDFs** (exames) via Cloudinary
- 📖 **Contrato OpenAPI** como fonte de verdade da API, com validação automática de requests/responses
- 📊 **Observabilidade**: logging estruturado com envio opcional para Papertrail

<!-- IMG: diagrama do fluxo de fila (paciente entra → posição atualizada via WS → notificação push) -->

## 🧱 Stack

- [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/) com [express-openapi-validator](https://www.npmjs.com/package/express-openapi-validator)
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/) (filas de jobs — notificações, e-mails)
- [WebSocket (ws)](https://github.com/websockets/ws) para atualização de filas em tempo real
- [JWT](https://jwt.io/) + [bcrypt](https://www.npmjs.com/package/bcrypt) para autenticação
- [Cloudinary](https://cloudinary.com/) para armazenamento de arquivos
- [Nodemailer](https://nodemailer.com/) para envio de e-mails
- [Jest](https://jestjs.io/) + [Supertest](https://www.npmjs.com/package/supertest) + [mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server) para testes unitários e de integração
- [Stryker](https://stryker-mutator.io/) para testes de mutação
- [semantic-release](https://semantic-release.gitbook.io/) para versionamento e changelog automáticos
- [Docker](https://www.docker.com/) para empacotamento e execução local

## 🏗️ Arquitetura

```
src/
├── domain/           # Entidades, regras de negócio e contratos (interfaces)
│   ├── auth/ user/ patient/ health-unit/ health-professional.ts/
│   ├── queue/ queue-item/ appointment/
│   ├── exam/ exam-availability/ exam-offering/ exam-booking/
│   ├── notification/ rating/
├── infrastructure/   # Implementações concretas
│   ├── db/mongo/          # Modelos e conexão MongoDB
│   ├── repository/        # Repositórios (Mongo) por domínio
│   ├── queue/bullmq/       # Filas de jobs assíncronos
│   ├── socket/             # WebSocket server
│   ├── external/           # Cloudinary, Expo push, Nodemailer
│   └── config/factories/   # Injeção de dependências
├── interfaces/http/  # Controllers e middlewares HTTP
├── contracts/         # service.yaml — contrato OpenAPI (fonte de verdade da API)
├── workers/           # Workers standalone (ex.: fila de notificações)
├── shared/            # Erros e utilitários compartilhados
└── __tests__/         # Testes unitários e de integração
```

Cada domínio segue o mesmo padrão: `interfaces` (contratos) → `service` (regra de negócio) → `repository` (persistência), mantendo a camada de domínio isolada do framework HTTP e do banco de dados.

## 🚀 Rodando localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local, Atlas ou via Docker)
- [Redis](https://redis.io/) (local ou via Docker)

### Com Docker (recomendado)

```bash
docker-compose up
```

### Manualmente

```bash
# 1. Instale as dependências
yarn install

# 2. Copie o .env de exemplo e preencha os valores
cp .env.example .env
```

Principais variáveis (ver `.env.example` completo):

```env
DATABASE_URI=mongodb+srv://...
PORT=3001
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
REDIS_HOST=redis
EXPO_ACCESS_TOKEN=...        # push notifications
CLOUDINARY_CLOUD_NAME=...    # upload de imagens/PDFs
SMTP_HOST=...                # e-mail de recuperação de senha
```

```bash
# 3. Suba em modo desenvolvimento
yarn dev

# 4. (opcional) Suba o worker de notificações em outro terminal
yarn worker:notifications
```

### Scripts úteis

| Comando | Descrição |
|---|---|
| `yarn dev` | Sobe a API em modo desenvolvimento (hot reload) |
| `yarn worker:notifications` | Sobe o worker de processamento de notificações |
| `yarn build` / `yarn start` | Compila e roda a versão de produção |
| `yarn lint` / `yarn prettier` | Lint e formatação |
| `yarn test` | Testes unitários + integração |
| `yarn test:coverage` | Testes com relatório de cobertura |
| `yarn test:mutation` | Testes de mutação (Stryker) |

## 📖 Documentação da API

O contrato OpenAPI em [`src/contracts/service.yaml`](./src/contracts/service.yaml) documenta e **valida em runtime** todas as rotas — qualquer alteração de rota ou payload deve ser refletida ali primeiro.

<!-- IMG: print do Swagger UI, se houver endpoint de docs exposto -->

## ➕ Adicionando novos recursos

1. Defina entidades e interfaces em `src/domain/<recurso>`
2. Implemente a persistência em `src/infrastructure/repository/<recurso>`
3. Exponha rotas/controllers em `src/interfaces/http`
4. Registre as dependências em `src/infrastructure/config/factories`
5. Documente as rotas em `src/contracts/service.yaml`
6. Escreva testes em `src/__tests__`

---

<div align="center">
  Feito com 💙 por <a href="https://github.com/Gabriellsa7">Gabriel Santana</a>
</div>
