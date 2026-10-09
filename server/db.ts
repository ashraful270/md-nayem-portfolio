// Re-export local database functions for backward compatibility,
// alongside the new async storage abstraction.
export { getDatabase, saveDatabase, getInitialDatabase } from './db/db-local.ts';
export * from './db/storage.ts';
