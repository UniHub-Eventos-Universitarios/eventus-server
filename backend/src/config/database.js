'use strict';
const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

if (!env.supabaseUrl || !env.supabaseServiceKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios no .env');
}

const db = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false },
});

module.exports = db;
