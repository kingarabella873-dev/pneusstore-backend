export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}