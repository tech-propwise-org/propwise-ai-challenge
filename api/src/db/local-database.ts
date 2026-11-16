const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'db']);

/** The seed and reset commands delete everything, so they only ever touch a database on this machine. */
export function assertLocalDatabase(databaseUrl: string): void {
  const host = new URL(databaseUrl).hostname;
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to wipe a database on "${host}". The seed and reset commands only run against a local database.`);
  }
}
