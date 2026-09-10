import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSheetsClient } from './client';

const ORIGINAL_ENV = { ...process.env };

describe('getSheetsClient', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('lança erro claro quando faltam as credenciais', () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    expect(() => getSheetsClient()).toThrow(/Credenciais da conta de serviço/);
  });

  it('constrói o cliente quando as credenciais existem', () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'fake@example.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\nFAKEKEY\\n-----END PRIVATE KEY-----\\n';
    const client = getSheetsClient();
    expect(client.spreadsheets.values.batchGet).toBeTypeOf('function');
  });
});
