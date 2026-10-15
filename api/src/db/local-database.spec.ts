import { assertLocalDatabase } from './local-database';

describe('assertLocalDatabase', () => {
  it('allows the local Docker database', () => {
    expect(() => assertLocalDatabase('postgres://challenge:challenge@localhost:5442/challenge')).not.toThrow();
    expect(() => assertLocalDatabase('postgres://challenge:challenge@127.0.0.1:5442/challenge')).not.toThrow();
  });

  it('refuses a database on another host', () => {
    expect(() => assertLocalDatabase('postgres://user:pw@ep-cool-name.eu-central-1.aws.neon.tech/db')).toThrow(/Refusing/);
  });
});
