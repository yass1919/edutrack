#!/usr/bin/env node

import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL found');
  return true;
}

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    const { stdout, stderr } = await execAsync('npx drizzle-kit push --config=drizzle.config.ts');
    
    if (stderr && !stderr.includes('warn')) {
      console.log(`Migration stderr: ${stderr}`);
    }
    
    console.log('✅ Database migration completed');
    if (stdout) console.log(stdout);
    
  } catch (error) {
    console.log(`⚠️ Migration note: ${error.message}`);
    
    // Don't fail if tables already exist
    if (error.message.includes('already exists') || 
        error.message.includes('no changes') ||
        error.message.includes('up to date')) {
      console.log('ℹ️ Database already up to date');
    } else {
      console.log('❌ Migration failed, continuing...');
    }
  }
}

async function startServer() {
  console.log('🚀 Starting EduTrack server...');
  
  const server = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
  
  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
  });
}

async function main() {
  console.log('🎯 EduTrack Production Startup');
  console.log('================================');
  
  try {
    await checkDatabase();
    await runMigration();
    await startServer();
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

main();