export const environment = {
  production: false,
  /**
   * Empty during `ng serve` so requests stay same-origin and `proxy.conf.json` forwards
   * `/api` and `/auth` to http://localhost:8080 (no CORS on the gateway required for local dev).
   */
  apiUrl: 'http://localhost:8080',
  useMockHistory: false,
  useBackendMeasurement: true,
  /**
   * Spring OAuth2 start URL (browser full navigation). Matches user-service on 8082 if
   * `spring.security.oauth2.client.registration.google.redirect-uri` points to 8082.
   * If you move OAuth behind the gateway, use http://localhost:8080/oauth2/authorization/google
   * and update Google Cloud redirect URIs accordingly.
   */
  googleOAuthAuthorizeUrl: 'http://localhost:8082/oauth2/authorization/google',
};
