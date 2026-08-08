/**
 * Environment access in one place, so a missing variable fails loudly at the
 * point of use rather than surfacing as an undefined deep inside a query.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example.`,
    );
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get passphrase() {
    return required("ARVEN_PASSPHRASE");
  },
  get sessionSecret() {
    return required("ARVEN_SESSION_SECRET");
  },
};
