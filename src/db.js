import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DB_PATH = process.env.DB_PATH || "data/ecotrace.db";

export async function initDb() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      process_name TEXT,
      emission_value REAL NOT NULL,
      emission_unit TEXT NOT NULL,
      scope TEXT,
      data_source TEXT,
      recorded_at TEXT NOT NULL,
      prev_hash TEXT NOT NULL,
      hash TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_records_recorded_at
    ON records(recorded_at DESC);
  `);

  return db;
}
