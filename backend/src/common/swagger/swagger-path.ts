const swaggerUiPath = '/api/docs';

export function isSwaggerPath(path: string): boolean {
  return (
    path === swaggerUiPath ||
    path.startsWith(`${swaggerUiPath}/`) ||
    path === '/api/docs-json' ||
    path === '/api/docs-yaml'
  );
}
