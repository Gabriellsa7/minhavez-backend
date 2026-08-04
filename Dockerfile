FROM node:24-alpine

WORKDIR /whitebeard
COPY . /whitebeard/

ARG PORT=3000
ARG VERSION=latest
ARG SERVICE_NAME=app

ENV PORT_EXPOSED=$PORT
ENV serviceName=$SERVICE_NAME
ENV version=$VERSION

EXPOSE $PORT_EXPOSED:$PORT_EXPOSED

RUN yarn && yarn cache clean && rm -rf .npmrc
RUN yarn build

CMD ["yarn","start"]
