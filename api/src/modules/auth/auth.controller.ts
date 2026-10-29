import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { ENV } from '../../config/env';
import { AuditService } from '../audit/audit.service';
import { sendEmail } from '../../config/mailer';

// In-memory OTP storage for demo/live fallback: tempToken -> { otp, userId, expiresAt }
const otpStore = new Map<string, { otp: string; userId: string; expiresAt: number }>();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  tempToken: z.string().min(1, 'Temporary 2FA token required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const demoLoginSchema = z.object({
  role: z.enum(['INSTITUTION', 'SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN']),
  institutionCode: z.string().optional(),
});

export class AuthController {
  /**
   * Step 1: Login with Username & Password -> Generates 2FA OTP
   */
  public static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.format() });
      }

      const { username, password } = parsed.data;

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email: username }],
        },
        include: {
          role: true,
          institution: true,
        },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        await AuditService.log({
          entityType: 'USER',
          entityId: user.id,
          action: 'LOGIN_FAILED',
          actorName: username,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          afterState: { reason: 'BAD_PASSWORD' },
        });
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      // Generate 6-digit OTP
      const otp = ENV.DEMO_MODE ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
      const tempToken = jwt.sign({ userId: user.id, purpose: '2fa_verification' }, ENV.JWT_SECRET, {
        expiresIn: '10m',
      });

      // Save OTP session
      otpStore.set(tempToken, {
        otp,
        userId: user.id,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      // Send OTP to Mailpit
      await sendEmail({
        to: user.email,
        subject: `[DEPOSIT-TRACK] Your 2FA Login OTP: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #1F3A68; border-radius: 8px;">
            <h2 style="color: #1F3A68;">AICTE DEPOSIT-TRACK 2FA Verification</h2>
            <p>Dear <strong>${user.fullName}</strong>,</p>
            <p>Your one-time security login passcode is:</p>
            <div style="font-size: 28px; font-weight: bold; color: #E67300; letter-spacing: 4px; padding: 12px 0;">
              ${otp}
            </div>
            <p>This OTP will expire in 10 minutes. If you did not request this login, contact the IT administrator immediately.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Smart India Hackathon 2026 | Team StrataXX | Ministry of Education, Govt. of India</p>
          </div>
        `,
      });

      // Record in SMS Outbox table
      if (user.phone) {
        await prisma.smsOutbox.create({
          data: {
            recipientPhone: user.phone,
            message: `AICTE DEPOSIT-TRACK: Your 2FA login OTP is ${otp}. Valid for 10 mins. Do not share.`,
            status: 'DELIVERED',
          },
        });
      }

      // Audit log
      await AuditService.log({
        entityType: 'USER',
        entityId: user.id,
        action: 'LOGIN_OTP_TRIGGERED',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      const phoneMasked = user.phone ? user.phone.replace(/(\d{2})\d+(\d{4})/, '$1******$2') : 'Registered Mobile';

      return res.json({
        success: true,
        requiresOtp: true,
        tempToken,
        phoneMasked,
        email: user.email,
        demoOtp: ENV.DEMO_MODE ? otp : undefined,
        message: `OTP sent to ${user.email} and ${phoneMasked}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
  }

  /**
   * Step 2: Verify OTP and Issue Session Tokens
   */
  public static async verifyOtp(req: Request, res: Response) {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.format() });
      }

      const { tempToken, otp } = parsed.data;

      // Check OTP in store
      const stored = otpStore.get(tempToken);
      const isFixedDemoOtp = ENV.DEMO_MODE && otp === '123456';

      if (!stored && !isFixedDemoOtp) {
        return res.status(400).json({ success: false, message: 'Invalid or expired 2FA session' });
      }

      let userId = stored?.userId;

      if (!userId) {
        // Fallback for fixed demo token decode
        try {
          const decoded = jwt.verify(tempToken, ENV.JWT_SECRET) as any;
          userId = decoded.userId;
        } catch {
          return res.status(400).json({ success: false, message: 'Invalid token' });
        }
      }

      // Check OTP value
      if (stored && stored.otp !== otp && !isFixedDemoOtp) {
        return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
      }

      // Cleanup OTP store
      otpStore.delete(tempToken);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true, institution: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role.name, institutionId: user.institutionId },
        ENV.JWT_SECRET,
        { expiresIn: '12h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await AuditService.log({
        entityType: 'USER',
        entityId: user.id,
        action: 'LOGIN_SUCCESS',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        afterState: { method: '2FA_VERIFIED' },
      });

      return res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          designation: user.designation,
          phone: user.phone,
          role: user.role.name,
          roleDisplayName: user.role.displayName,
          institutionId: user.institutionId,
          institution: user.institution,
        },
      });
    } catch (error) {
      console.error('OTP verify error:', error);
      return res.status(500).json({ success: false, message: 'Server error during OTP verification' });
    }
  }

  /**
   * Demo Mode 1-Click Login Shortcut
   */
  public static async demoLogin(req: Request, res: Response) {
    if (!ENV.DEMO_MODE) {
      return res.status(403).json({ success: false, message: 'Demo mode is not enabled on this server' });
    }

    try {
      const parsed = demoLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.format() });
      }

      const { role, institutionCode } = parsed.data;

      let user;
      if (role === 'INSTITUTION') {
        const code = institutionCode || 'INST-1001';
        user = await prisma.user.findFirst({
          where: {
            role: { name: 'INSTITUTION' },
            institution: { code },
          },
          include: { role: true, institution: true },
        });
      } else {
        user = await prisma.user.findFirst({
          where: { role: { name: role } },
          include: { role: true, institution: true },
        });
      }

      if (!user) {
        return res.status(404).json({ success: false, message: `No demo account found for role ${role}` });
      }

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role.name, institutionId: user.institutionId },
        ENV.JWT_SECRET,
        { expiresIn: '12h' }
      );

      const refreshToken = jwt.sign({ userId: user.id }, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });

      await AuditService.log({
        entityType: 'USER',
        entityId: user.id,
        action: 'DEMO_LOGIN_SWITCH',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          designation: user.designation,
          phone: user.phone,
          role: user.role.name,
          roleDisplayName: user.role.displayName,
          institutionId: user.institutionId,
          institution: user.institution,
        },
      });
    } catch (error) {
      console.error('Demo login error:', error);
      return res.status(500).json({ success: false, message: 'Server error during demo login' });
    }
  }

  /**
   * Get Current Authenticated User Session
   */
  public static async me(req: Request, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { role: true, institution: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          designation: user.designation,
          phone: user.phone,
          role: user.role.name,
          roleDisplayName: user.role.displayName,
          institutionId: user.institutionId,
          institution: user.institution,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
    }
  }

  /**
   * Logout Endpoint
   */
  public static async logout(req: Request, res: Response) {
    if (req.user) {
      await AuditService.log({
        entityType: 'USER',
        entityId: req.user.id,
        action: 'LOGOUT',
        actorId: req.user.id,
        actorName: req.user.fullName,
        actorRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  }
}
