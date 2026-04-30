import * as fs from 'fs'
import * as path from 'path'
import { createAdminClient } from '../lib/supabase'

async function runMigrations() {
  try {
    const supabaseAdmin = createAdminClient()
    
    console.log('Starting database migrations...')

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_create_tables.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    // Execute migration
    const { error } = await supabaseAdmin.rpc('sql_exec', {
      sql: sql,
    } as any)

    if (error) {
      console.error('Migration failed:', error.message)
      process.exit(1)
    }

    console.log('✅ Migrations completed successfully!')
  } catch (error: any) {
    console.error('Error running migrations:', error.message)
    process.exit(1)
  }
}

runMigrations()
