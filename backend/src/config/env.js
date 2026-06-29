'use strict';
require('dotenv').config();

const env = {
  port:              Number(process.env.PORT) || 3333,
  nodeEnv:           process.env.NODE_ENV || 'development',
  supabaseUrl:       process.env.SUPABASE_URL,
  supabaseServiceKey:process.env.SUPABASE_SERVICE_ROLE_KEY,
  corsOrigin:        process.env.CORS_ORIGIN || '*',
  jwtSecret:         process.env.JWT_SECRET || 'eventus-dev-secret-change-in-prod',
  jwtExpiresIn:      process.env.JWT_EXPIRES_IN || '8h',
};

module.exports = env;
