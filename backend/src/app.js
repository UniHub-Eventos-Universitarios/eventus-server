'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
