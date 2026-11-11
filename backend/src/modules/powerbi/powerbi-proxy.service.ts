import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_TIMEOUT_MS = 15000;
const NOT_CONFIGURED = 'Report service is not configured.';
const TEMPORARILY_UNAVAILABLE = 'Report service is temporarily unavailable.';
const FAILED_TO_COMMUNICATE = 'Failed to communicate with the report service.';

export interface PowerBiWorkspaceRecord {
  id: string;
  name: string;
  isOnDedicatedCapacity?: boolean;
  isReadOnly?: boolean;
}

export interface PowerBiRemoteReportRecord {
  id: string;
  name: string;
  datasetId?: string;
  embedUrl?: string;
}

export interface PowerBiPageRecord {
  name: string;
  displayName: string;
  order?: number;
}

export interface PowerBiGeneratedToken {
  token: string;
  expiration: string;
}

@Injectable()
export class PowerBiProxyService {
  private readonly logger = new Logger(PowerBiProxyService.name);

  constructor(private readonly config: ConfigService) {}

  listWorkspaces(): Promise<PowerBiWorkspaceRecord[]> {
    return this.getCollection('/groups').then((items) =>
      items.flatMap((item) => {
        const mapped = this.mapWorkspace(item);
        return mapped ? [mapped] : [];
      }),
    );
  }

  listReports(workspaceId: string): Promise<PowerBiRemoteReportRecord[]> {
    return this.getCollection(`/groups/${workspaceId}/reports`).then((items) =>
      items.flatMap((item) => {
        const mapped = this.mapReport(item);
        return mapped ? [mapped] : [];
      }),
    );
  }

  getReport(
    workspaceId: string,
    reportId: string,
  ): Promise<Required<Pick<PowerBiRemoteReportRecord, 'datasetId' | 'embedUrl'>> &
    PowerBiRemoteReportRecord> {
    return this.requestJson(
      'GET',
      `/groups/${workspaceId}/reports/${reportId}`,
    ).then((payload) => {
      const mapped = this.mapReport(payload);
      if (!mapped?.datasetId || !mapped.embedUrl) {
        throw new ServiceUnavailableException(FAILED_TO_COMMUNICATE);
      }
      return {
        ...mapped,
        datasetId: mapped.datasetId,
        embedUrl: mapped.embedUrl,
      };
    });
  }

  listPages(
    workspaceId: string,
    reportId: string,
  ): Promise<PowerBiPageRecord[]> {
    return this.getCollection(
      `/groups/${workspaceId}/reports/${reportId}/pages`,
    ).then((items) =>
      items.flatMap((item) => {
        const mapped = this.mapPage(item);
        return mapped ? [mapped] : [];
      }),
    );
  }

  generateEmbedToken(
    datasetId: string,
    reportId: string,
  ): Promise<PowerBiGeneratedToken> {
    return this.requestJson('POST', '/reports/GenerateToken', {
      dataset_ids: [datasetId],
      report_ids: [reportId],
    }).then((payload) => {
      if (!isRecord(payload)) {
        throw new ServiceUnavailableException(FAILED_TO_COMMUNICATE);
      }
      const token = payload.token;
      const expiration = payload.expiration;
      if (typeof token !== 'string' || typeof expiration !== 'string') {
        throw new ServiceUnavailableException(FAILED_TO_COMMUNICATE);
      }
      return { expiration, token };
    });
  }

  private async getCollection(path: string): Promise<unknown[]> {
    const payload = await this.requestJson('GET', path, undefined, true);
    return unwrapCollection(payload);
  }

  private async requestJson(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
    emptyOnNotFound = false,
  ): Promise<unknown> {
    const baseUrl = this.resolveBaseUrl();
    const apiKey = this.config.get<string>('POWERBI_EMBEDDED_API_KEY')?.trim();

    if (!baseUrl || !apiKey) {
      throw new ServiceUnavailableException(NOT_CONFIGURED);
    }

    const timeoutMs = this.resolveTimeout();
    const headers: Record<string, string> = {
      'X-API-Key': apiKey,
    };
    const init: RequestInit = {
      headers,
      method,
      signal: AbortSignal.timeout(timeoutMs),
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, init);
    } catch {
      this.logger.warn('Report service request failed');
      throw new ServiceUnavailableException(TEMPORARILY_UNAVAILABLE);
    }

    if (response.status === 401 || response.status === 403) {
      throw new ServiceUnavailableException(NOT_CONFIGURED);
    }

    if (response.status === 404 && emptyOnNotFound) {
      return { value: [] };
    }

    if (!response.ok) {
      this.logger.warn('Report service returned an error status');
      throw new ServiceUnavailableException(FAILED_TO_COMMUNICATE);
    }

    return response.json() as Promise<unknown>;
  }

  private resolveBaseUrl(): string | null {
    const raw = this.config.get<string>('POWERBI_EMBEDDED_URL')?.trim();
    if (!raw) {
      return null;
    }

    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
    } catch {
      return null;
    }

    return raw.replace(/\/+$/, '');
  }

  private resolveTimeout(): number {
    const parsed = Number(this.config.get<string>('POWERBI_EMBEDDED_TIMEOUT'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
  }

  private mapWorkspace(value: unknown): PowerBiWorkspaceRecord | null {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
      return null;
    }

    const mapped: PowerBiWorkspaceRecord = { id: value.id, name: value.name };
    if (typeof value.isOnDedicatedCapacity === 'boolean') {
      mapped.isOnDedicatedCapacity = value.isOnDedicatedCapacity;
    }
    if (typeof value.isReadOnly === 'boolean') {
      mapped.isReadOnly = value.isReadOnly;
    }
    return mapped;
  }

  private mapReport(value: unknown): PowerBiRemoteReportRecord | null {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
      return null;
    }

    const mapped: PowerBiRemoteReportRecord = { id: value.id, name: value.name };
    if (typeof value.datasetId === 'string') {
      mapped.datasetId = value.datasetId;
    }
    if (typeof value.embedUrl === 'string') {
      mapped.embedUrl = value.embedUrl;
    }
    return mapped;
  }

  private mapPage(value: unknown): PowerBiPageRecord | null {
    if (
      !isRecord(value) ||
      typeof value.name !== 'string' ||
      typeof value.displayName !== 'string'
    ) {
      return null;
    }

    const mapped: PowerBiPageRecord = {
      displayName: value.displayName,
      name: value.name,
    };
    if (typeof value.order === 'number') {
      mapped.order = value.order;
    }
    return mapped;
  }
}

function unwrapCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray(payload.value)) {
    return payload.value;
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
