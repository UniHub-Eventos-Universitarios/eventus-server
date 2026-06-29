'use strict';
const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`API Eventos Academicos rodando em http://localhost:${env.port}/api`);
  console.log(`Ambiente: ${env.nodeEnv}`);
});
