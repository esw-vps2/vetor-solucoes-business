import { Request } from 'express';

export interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  profile: string;
  sessionId: string;
  type: 'access';
  email: string;
  firstName: string;
  lastName: string;
  cargo: string;
  age: number;
  sex: string;
  photoUrl: string;
  enabledActions: string[];
}

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  profile: string;
  sessionId: string;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

export interface SafeUser {
  id: string;
  email: string;
  profile: string;
  firstName: string;
  lastName: string;
  cargo: string;
  age: number;
  sex: string;
  photoUrl: string;
  tenantId: string;
  tenantName: string;
  tenantPhotoUrl: string;
  tenantSlug: string;
  enabledActions: string[];
}
