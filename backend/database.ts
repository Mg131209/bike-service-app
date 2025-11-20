import { Database, SQLQueryBindings } from 'bun:sqlite';

export const db = new Database('bikes.sqlite', { readwrite: true, create: true });

export const runQuery = (query: string, params: SQLQueryBindings[] = []): unknown => {
  const statement = db.prepare(`${query};`, params);
  return statement.run();
};

export const selectOne = <T extends Record<string, unknown>>(
  query: string,
  params: SQLQueryBindings[] = []
): T | null => {
  const statement = db.prepare(`${query};`, params);
  return statement.get() as T | null;
};

export const selectMany = <T extends Record<string, unknown>>(
  query: string,
  params: SQLQueryBindings[] = []
): T[] => {
  const statement = db.prepare(`${query};`, params);
  return statement.all() as T[];
};

export const insertOne = <T extends Record<string, unknown>>(
  query: string,
  params: SQLQueryBindings[] = []
): T => {
  const statement = db.prepare(`${query};`, params);
  return statement.get() as T;
};

export const insertMany = <T extends Record<string, unknown>>(
  query: string,
  params: SQLQueryBindings[] = []
): T[] => {
  const statement = db.prepare(`${query};`, params);
  return statement.all() as T[];
};
