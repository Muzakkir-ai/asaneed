const fs = require('node:fs');
const {PGlite} = require('@electric-sql/pglite');

(async()=>{
  const db = new PGlite();
  try {
    // Minimal Auth schema for the checked-in application migrations.
    await db.exec(`
      create schema auth;
      create role anon;
      create role authenticated;
      create role service_role;
      create table auth.users (
        id uuid primary key, email text, email_confirmed_at timestamptz,
        raw_user_meta_data jsonb default '{}', encrypted_password text
      );
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
      grant usage on schema auth to anon,authenticated;
    `);
    const directory = 'supabase/migrations';
    const through = '20261028220642_workspace_relationship_controls.sql';
    const migrations = fs.readdirSync(directory).filter(file=>file.endsWith('.sql')&&file<=through).sort();
    for (const file of migrations) await db.exec(fs.readFileSync(directory+'/'+file,'utf8'));
    for (const suite of ['auth','management','workspace-relationships']) {
      await db.exec(fs.readFileSync('database/'+suite+'-tests.sql','utf8'));
      console.log('PASS: local migration/RLS fixture '+suite);
    }
  } finally {
    await db.close();
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
