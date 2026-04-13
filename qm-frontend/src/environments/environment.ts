export const environment = {
  production: true,
  /**
   * API base with no trailing slash. For static hosting without a proxy, use the gateway origin
   * (e.g. http://localhost:8080). The gateway must allow CORS from your app origin in that case.
   */
  apiUrl: 'http://localhost:8080',
  useMockHistory: false,
  /** When true, calculator calls go to Spring (via apiUrl or dev proxy); auth interceptor is enabled. */
  useBackendMeasurement: true,
  /** Google OAuth2 authorize URL (adjust if OAuth is only behind gateway). */
  googleOAuthAuthorizeUrl: 'http://localhost:8080/oauth2/authorization/google',
};
