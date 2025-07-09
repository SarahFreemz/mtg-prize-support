FROM node:14

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY src ./src

RUN npm install -g @google/clasp

EXPOSE 8080

CMD ["clasp", "run"]