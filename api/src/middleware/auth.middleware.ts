import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/db';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  institutionId?: string | null;
  institutionName?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authenticate JWT Bearer token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing or invalid format',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        institution: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      institutionId: user.institutionId,
      institutionName: user.institution?.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or token invalid',
    });
  }
}

/**
 * RBAC Role Authorization Middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    if (allowedRoles.includes('*') || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role ${req.user.role} does not have required permissions.`,
    });
  };
}

/**
 * Security helper: Applies institution-level tenancy isolation to Prisma WHERE clauses
 */
export function scopeInstitutionFilter(req: Request, baseWhere: Record<string, any> = {}): Record<string, any> {
  if (req.user?.role === 'INSTITUTION') {
    if (!req.user.institutionId) {
      throw new Error('Institution user has no associated institutionId');
    }
    return {
      ...baseWhere,
      institutionId: req.user.institutionId,
    };
  }
  // Scrutiny Officers, Competent Authorities & Admins see all records across AICTE
  return baseWhere;
}
