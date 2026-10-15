import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('accepts the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('challenge123');

    await expect(verifyPassword('challenge123', stored)).resolves.toBe(true);
    await expect(verifyPassword('challenge124', stored)).resolves.toBe(false);
  });

  it('rejects a stored value in an unknown format', async () => {
    await expect(verifyPassword('challenge123', 'plain-text')).resolves.toBe(false);
  });
});
