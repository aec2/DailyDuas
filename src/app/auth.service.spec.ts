import { mapGoogleAuthError, shouldPreferRedirectFlow } from './auth.service';

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

describe('shouldPreferRedirectFlow', () => {
  it('uses popup flow for regular Android Chrome', () => {
    const result = shouldPreferRedirectFlow(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36',
      false,
    );

    expect(result).toBe(false);
  });

  it('uses redirect flow for iPhone Safari', () => {
    const result = shouldPreferRedirectFlow(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      false,
    );

    expect(result).toBe(true);
  });

  it('uses redirect flow in standalone mode', () => {
    const result = shouldPreferRedirectFlow(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36',
      true,
    );

    expect(result).toBe(true);
  });
});
