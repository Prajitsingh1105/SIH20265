import { prisma } from '../../config/db';
import { sha256 } from '../../utils/crypto';

export interface AuditLogInput {
  entityType: string;
  entityId?: string | null;
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeState?: any;
  afterState?: any;
}

export class AuditService {
  private static GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  /**
   * Helper to compute SHA-256 hash of a log record
   */
  public static computeRecordHash(
    entityType: string,
    entityId: string | null | undefined,
    action: string,
    actorId: string | null | undefined,
    timestamp: Date,
    afterState: string | null | undefined,
    prevHash: string
  ): string {
    const rawData = `${entityType}:${entityId || ''}:${action}:${actorId || ''}:${timestamp.toISOString()}:${afterState || ''}`;
    return sha256(rawData + prevHash);
  }

  /**
   * Appends an immutable, hash-chained audit log entry
   */
  public static async log(input: AuditLogInput) {
    try {
      // Find the most recent record to get prevHash
      const latest = await prisma.auditLog.findFirst({
        orderBy: { timestamp: 'desc' },
      });

      const prevHash = latest ? latest.currHash : this.GENESIS_HASH;
      const timestamp = new Date();

      const beforeStr = input.beforeState ? JSON.stringify(input.beforeState) : null;
      const afterStr = input.afterState ? JSON.stringify(input.afterState) : null;

      const currHash = this.computeRecordHash(
        input.entityType,
        input.entityId,
        input.action,
        input.actorId,
        timestamp,
        afterStr,
        prevHash
      );

      return await prisma.auditLog.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId || null,
          action: input.action,
          actorId: input.actorId || null,
          actorName: input.actorName || null,
          actorRole: input.actorRole || null,
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
          beforeState: beforeStr,
          afterState: afterStr,
          prevHash,
          currHash,
          timestamp,
        },
      });
    } catch (error) {
      console.error('❌ Failed to write audit log:', error);
      // We log but never crash the core application flow
      return null;
    }
  }

  /**
   * Verifies the cryptographic integrity of the entire audit hash chain
   */
  public static async verifyChain() {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'asc' },
    });

    if (logs.length === 0) {
      return {
        isValid: true,
        totalVerified: 0,
        message: 'Audit log is empty. Genesis state intact.',
      };
    }

    let expectedPrevHash = this.GENESIS_HASH;

    for (let i = 0; i < logs.length; i++) {
      const record = logs[i];

      // 1. Check prevHash linkage
      if (record.prevHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalVerified: i,
          tamperedIndex: i + 1,
          tamperedRecordId: record.id,
          reason: 'BROKEN_LINK',
          expectedPrevHash,
          actualPrevHash: record.prevHash,
          message: `Cryptographic link broken at record #${i + 1} (${record.action} on ${record.entityType})!`,
        };
      }

      // 2. Recompute currHash
      const calculatedHash = this.computeRecordHash(
        record.entityType,
        record.entityId,
        record.action,
        record.actorId,
        record.timestamp,
        record.afterState,
        record.prevHash
      );

      if (calculatedHash !== record.currHash) {
        return {
          isValid: false,
          totalVerified: i,
          tamperedIndex: i + 1,
          tamperedRecordId: record.id,
          reason: 'HASH_MISMATCH',
          expectedHash: calculatedHash,
          actualHash: record.currHash,
          message: `Data tampering detected at record #${i + 1} (${record.action} on ${record.entityType})!`,
        };
      }

      expectedPrevHash = record.currHash;
    }

    return {
      isValid: true,
      totalVerified: logs.length,
      tipHash: expectedPrevHash,
      message: `Audit chain fully intact. ${logs.length} records cryptographically verified.`,
    };
  }

  /**
   * Demo Simulation: Intentionally alters an audit row to demonstrate tamper detection
   */
  public static async simulateTamper() {
    const records = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'asc' },
      skip: 2,
      take: 1,
    });

    const target = records[0] || (await prisma.auditLog.findFirst({ orderBy: { timestamp: 'desc' } }));

    if (!target) {
      throw new Error('No audit records available to tamper with.');
    }

    // Modify afterState without updating the currHash!
    await prisma.auditLog.update({
      where: { id: target.id },
      data: {
        afterState: JSON.stringify({
          status: 'ILLEGALLY_MODIFIED_IN_DATABASE',
          amount: 99999999,
          tamperedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      tamperedRecordId: target.id,
      action: target.action,
      entityType: target.entityType,
      message: `Simulated unauthorized DB update on Record ${target.id}. Chain is now broken.`,
    };
  }

  /**
   * Demo Repair: Recalculates the entire hash chain from scratch to restore green state
   */
  public static async repairChain() {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'asc' },
    });

    let prevHash = this.GENESIS_HASH;

    for (const record of logs) {
      const currHash = this.computeRecordHash(
        record.entityType,
        record.entityId,
        record.action,
        record.actorId,
        record.timestamp,
        record.afterState,
        prevHash
      );

      await prisma.auditLog.update({
        where: { id: record.id },
        data: {
          prevHash,
          currHash,
        },
      });

      prevHash = currHash;
    }

    return {
      success: true,
      repairedCount: logs.length,
      tipHash: prevHash,
      message: `Audit chain repaired. ${logs.length} records re-hashed and re-linked.`,
    };
  }
}
