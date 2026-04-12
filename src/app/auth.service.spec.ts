import { mapGoogleAuthError } from './auth.service';

describe('mapGoogleAuthError', () => {
  it('maps unauthorized domain errors to a specific message', () => {
    const message = mapGoogleAuthError({ code: 'auth/unauthorized-domain' });

    expect(message).toContain('Authorized domains');
  });

  it('falls back to a generic message for unknown errors', () => {
    const message = mapGoogleAuthError({ code: 'auth/something-else' });

    expect(message).toContain('yetkili domainlerinizi kontrol edin');
  });
});
