import { isSwaggerPath } from './swagger-path.js';

describe('isSwaggerPath', () => {
  it('matches the Swagger UI and served OpenAPI documents', () => {
    expect(isSwaggerPath('/api/docs')).toBe(true);
    expect(isSwaggerPath('/api/docs/')).toBe(true);
    expect(isSwaggerPath('/api/docs/swagger-ui.css')).toBe(true);
    expect(isSwaggerPath('/api/docs-json')).toBe(true);
    expect(isSwaggerPath('/api/docs-yaml')).toBe(true);
  });

  it('does not match product endpoints', () => {
    expect(isSwaggerPath('/api/v1')).toBe(false);
    expect(isSwaggerPath('/api/v1/contact')).toBe(false);
    expect(isSwaggerPath('/api/v1/auth/login')).toBe(false);
  });
});
