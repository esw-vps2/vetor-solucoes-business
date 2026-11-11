export type HealthCheckStatus = 'up' | 'down';
export type SolutionHealthStatus = 'healthy' | 'unhealthy';

export interface HealthCheckResult {
  status: HealthCheckStatus;
}

export interface HealthResponse {
  status: SolutionHealthStatus;
  checks: {
    api: HealthCheckResult;
    database: HealthCheckResult;
    smtp: HealthCheckResult;
  };
}
