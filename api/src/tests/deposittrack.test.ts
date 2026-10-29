import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../config/db';
import { DiscrepancyEngine } from '../modules/discrepancies/discrepancy.engine';
import { AuditService } from '../modules/audit/audit.service';
import { LifecycleService } from '../modules/lifecycle/lifecycle.service';
import { ReleaseService } from '../modules/release/release.service';

describe('DEPOSIT-TRACK Backend Test Suite', () => {
  let inst1: any;
  let inst2: any;
  let bank: any;
  let testUser: any;

  beforeAll(async () => {
    inst1 = await prisma.institution.findFirst({ where: { code: 'INST-1001' } });
    inst2 = await prisma.institution.findFirst({ where: { code: 'INST-1002' } });
    bank = await prisma.bank.findFirst({ where: { code: 'SBI' } });
    testUser = await prisma.user.findFirst({ where: { username: 'officer1' } });
  });

  describe('1. Discrepancy Detection Engine', () => {
    it('should detect DATE_MISMATCH when maturity date is before issue date', async () => {
      const badFdr = await prisma.fDR.create({
        data: {
          fdrNumber: `TEST-DATE-${Date.now()}`,
          institutionId: inst1.id,
          bankId: bank.id,
          branchName: 'Test Branch',
          amount: 1000000,
          issueDate: new Date('2025-01-01'),
          maturityDate: new Date('2024-01-01'), // Earlier than issue date!
          validityMonths: 36,
          status: 'SUBMITTED',
        },
      });

      const flags = await DiscrepancyEngine.evaluateFdr(badFdr.id);
      expect(flags.some((f) => f.ruleCode === 'DATE_MISMATCH')).toBe(true);

      // Cleanup
      await prisma.fDR.delete({ where: { id: badFdr.id } });
    });

    it('should detect DUPLICATE_FDR across different institutions', async () => {
      const dupNum = `DUP-TEST-${Date.now()}`;

      const fdrA = await prisma.fDR.create({
        data: {
          fdrNumber: dupNum,
          institutionId: inst1.id,
          bankId: bank.id,
          branchName: 'Branch A',
          amount: 1000000,
          issueDate: new Date(),
          maturityDate: new Date(Date.now() + 365 * 86400000),
          status: 'ACTIVE',
        },
      });

      const fdrB = await prisma.fDR.create({
        data: {
          fdrNumber: dupNum,
          institutionId: inst2.id, // Different institution reusing same FDR number!
          bankId: bank.id,
          branchName: 'Branch B',
          amount: 1000000,
          issueDate: new Date(),
          maturityDate: new Date(Date.now() + 365 * 86400000),
          status: 'SUBMITTED',
        },
      });

      const flags = await DiscrepancyEngine.evaluateFdr(fdrB.id);
      expect(flags.some((f) => f.ruleCode === 'DUPLICATE_FDR')).toBe(true);

      // Cleanup
      await prisma.fDR.deleteMany({ where: { fdrNumber: dupNum } });
    });

    it('should detect AMOUNT_MISMATCH when deposit is below AICTE minimum', async () => {
      const lowFdr = await prisma.fDR.create({
        data: {
          fdrNumber: `TEST-LOW-${Date.now()}`,
          institutionId: inst1.id,
          bankId: bank.id,
          branchName: 'Test Branch',
          amount: 100000, // ₹1,00,000 (Below minimum ₹5,00,000)
          issueDate: new Date(),
          maturityDate: new Date(Date.now() + 365 * 3 * 86400000),
          status: 'SUBMITTED',
        },
      });

      const flags = await DiscrepancyEngine.evaluateFdr(lowFdr.id);
      expect(flags.some((f) => f.ruleCode === 'AMOUNT_MISMATCH')).toBe(true);

      await prisma.fDR.delete({ where: { id: lowFdr.id } });
    });
  });

  describe('2. Cryptographic SHA-256 Audit Hash Chain', () => {
    it('should verify that genesis and seeded hash chain is intact', async () => {
      const result = await AuditService.verifyChain();
      expect(result.isValid).toBe(true);
      expect(result.totalVerified).toBeGreaterThan(0);
    });

    it('should append new audit entry and maintain valid cryptographic linkage', async () => {
      await AuditService.log({
        entityType: 'TEST_ENTITY',
        entityId: 'TEST-123',
        action: 'UNIT_TEST_LOG',
        actorId: testUser.id,
        actorName: testUser.fullName,
        actorRole: 'SCRUTINY_OFFICER',
        afterState: { test: true },
      });

      const result = await AuditService.verifyChain();
      expect(result.isValid).toBe(true);
    });

    it('should accurately detect tampering when a database row is modified', async () => {
      // Simulate tamper
      await AuditService.simulateTamper();

      const verifyTampered = await AuditService.verifyChain();
      expect(verifyTampered.isValid).toBe(false);
      expect(verifyTampered.tamperedIndex).toBeDefined();

      // Repair
      const repairResult = await AuditService.repairChain();
      expect(repairResult.success).toBe(true);

      // Verify repaired
      const verifyRepaired = await AuditService.verifyChain();
      expect(verifyRepaired.isValid).toBe(true);
    });
  });

  describe('3. Automated Lifecycle Engine & Time Travel', () => {
    it('should shift demo clock and scan without error', async () => {
      const shiftResult = await LifecycleService.setDemoClockOffset(60, testUser.id);
      expect(shiftResult.offsetDays).toBe(60);
      expect(shiftResult.scanResult).toBeDefined();
      expect(shiftResult.scanResult.totalScanned).toBeGreaterThan(0);

      // Reset
      const resetResult = await LifecycleService.resetDemoClock(testUser.id);
      expect(resetResult.offsetDays).toBe(0);
    });
  });

  describe('4. Release Workflow State Machine & Eligibility', () => {
    it('should calculate eligibility checklist for an FDR', async () => {
      const activeFdr = await prisma.fDR.findFirst({
        where: { verificationTier: 'CONFIRMED' },
      });

      if (activeFdr) {
        const eligibility = await ReleaseService.evaluateEligibility(activeFdr.id);
        expect(eligibility.checklist).toBeDefined();
        expect(eligibility.checklist.length).toBe(4);
      }
    });
  });
});
