import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// PostgreSQL Pool (if DATABASE_URL is configured in .env)
let pgPool = null;
let isPgReady = false;

if (process.env.DATABASE_URL) {
  try {
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000
    });
    
    // Test connection
    pgPool.query('SELECT NOW()', (err) => {
      if (err) {
        logger.warn(`PostgreSQL connection failed (${err.message}). Falling back to file persistence.`);
        isPgReady = false;
      } else {
        isPgReady = true;
        logger.info('Connected to PostgreSQL database successfully.');
        initPgSchema();
      }
    });
  } catch (err) {
    logger.warn(`PostgreSQL init warning: ${err.message}. Using file persistence.`);
  }
}

async function initPgSchema() {
  if (!isPgReady || !pgPool) return;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    logger.info('PostgreSQL schema initialized (listings, users tables ready).');
  } catch (err) {
    logger.error('Failed to initialize PostgreSQL schema:', err);
  }
}

/**
 * Get all listings (from PostgreSQL if connected, otherwise JSON file)
 */
export async function getListings() {
  if (isPgReady && pgPool) {
    try {
      const res = await pgPool.query('SELECT data FROM listings ORDER BY created_at DESC');
      if (res.rows.length > 0) {
        return res.rows.map(r => r.data);
      }
    } catch (err) {
      logger.error('PostgreSQL getListings error, falling back to JSON file:', err);
    }
  }

  // File fallback
  try {
    const data = await fs.readFile(LISTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to read listings file:', error);
    return [];
  }
}

/**
 * Save all listings (to PostgreSQL and JSON file)
 */
export async function saveListings(listings) {
  // Always persist to file as guaranteed backup
  try {
    await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Failed to write listings to file:', error);
  }

  // Also sync to PostgreSQL if connected
  if (isPgReady && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        for (const item of listings) {
          await client.query(
            `INSERT INTO listings (id, data) VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET data = $2`,
            [item.id, JSON.stringify(item)]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('PostgreSQL saveListings sync error:', err);
    }
  }

  return true;
}

/**
 * Get all users
 */
export async function getUsers() {
  if (isPgReady && pgPool) {
    try {
      const res = await pgPool.query('SELECT data FROM users ORDER BY created_at DESC');
      if (res.rows.length > 0) {
        return res.rows.map(r => r.data);
      }
    } catch (err) {
      logger.error('PostgreSQL getUsers error, falling back to JSON:', err);
    }
  }

  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to read users file:', error);
    return [];
  }
}

/**
 * Save all users
 */
export async function saveUsers(users) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Failed to write users to file:', error);
  }

  if (isPgReady && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        for (const u of users) {
          await client.query(
            `INSERT INTO users (id, email, data) VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE SET email = $2, data = $3`,
            [u.id, u.email, JSON.stringify(u)]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('PostgreSQL saveUsers sync error:', err);
    }
  }

  return true;
}

/**
 * Returns active database info
 */
export function getDatabaseStatus() {
  return {
    type: isPgReady ? 'PostgreSQL (Active Pool)' : 'JSON Datastore (Enterprise Storage Adapter)',
    postgresConfigured: Boolean(process.env.DATABASE_URL),
    postgresConnected: isPgReady
  };
}
