import { prisma } from '../../config/db';
import { sendEmail } from '../../config/mailer';
import { AuditService } from '../audit/audit.service';

export class LifecycleService {
  /**
   * Retrieves the current simulated date considering the demo clock offset
   */
  public static async getEffectiveDate(): Promise<Date> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'demo_clock_offset_days' },
    });

    const offsetDays = setting ? parseInt(setting.value, 10) || 0 : 0;
    return new Date(Date.now() + offsetDays * 86400000);
  }

  /**
   * Sets the demo clock offset days
   */
  public static async setDemoClockOffset(offsetDays: number, actorId?: string) {
    await prisma.systemSetting.upsert({
      where: { key: 'demo_clock_offset_days' },
      update: { value: offsetDays.toString() },
      create: { key: 'demo_clock_offset_days', value: offsetDays.toString() },
    });

    const effectiveDate = await this.getEffectiveDate();

    await AuditService.log({
      entityType: 'SYSTEM',
      entityId: 'DEMO_CLOCK',
      action: 'SETTINGS_CHANGE',
      actorId: actorId || null,
      afterState: { offsetDays, simulatedDate: effectiveDate.toISOString() },
    });

    // Automatically run lifecycle scan on clock shift!
    const scanResult = await this.runLifecycleScan(actorId);

    return {
      offsetDays,
      simulatedDate: effectiveDate,
      scanResult,
    };
  }

  /**
   * Resets demo clock back to real time (offset 0)
   */
  public static async resetDemoClock(actorId?: string) {
    return await this.setDemoClockOffset(0, actorId);
  }

  /**
   * Scans all FDR instruments against reminder rules and escalation thresholds
   */
  public static async runLifecycleScan(actorId?: string) {
    const simulatedToday = await this.getEffectiveDate();
    const startTime = Date.now();

    const [reminderRules, escalationRules, fdrs] = await Promise.all([
      prisma.reminderRule.findMany({ where: { isActive: true }, orderBy: { daysBeforeMaturity: 'desc' } }),
      prisma.escalationRule.findMany({ where: { isActive: true }, orderBy: { daysOverdue: 'asc' } }),
      prisma.fDR.findMany({
        where: {
          status: {
            notIn: ['DRAFT', 'RENEWED', 'RELEASED', 'REJECTED'],
          },
        },
        include: { institution: true, bank: true },
      }),
    ]);

    let remindersTriggered = 0;
    let maturedCount = 0;
    let escalationsTriggered = 0;

    for (const fdr of fdrs) {
      const maturityTime = fdr.maturityDate.getTime();
      const todayTime = simulatedToday.getTime();
      const diffDays = Math.ceil((maturityTime - todayTime) / 86400000);

      // 1. Pre-Maturity Reminders (e.g., 90, 60, 30, 7 days)
      if (diffDays > 0) {
        // Update status to EXPIRING_SOON if <= 30 days
        if (diffDays <= 30 && fdr.status === 'ACTIVE') {
          await prisma.fDR.update({
            where: { id: fdr.id },
            data: { status: 'EXPIRING_SOON' },
          });
        }

        for (const rule of reminderRules) {
          // Trigger reminder if close to rule threshold
          if (diffDays <= rule.daysBeforeMaturity && diffDays > rule.daysBeforeMaturity - 7) {
            const notifTitle = `Maturity Alert (${rule.daysBeforeMaturity} Days): FDR #${fdr.fdrNumber}`;
            const notifMsg = `FDR #${fdr.fdrNumber} (₹${fdr.amount.toLocaleString('en-IN')} held with ${fdr.bank.name}) matures on ${fdr.maturityDate.toLocaleDateString('en-IN')}. Please prepare renewal or release documentation.`;

            // Deduplicate: check if notification already exists for this FDR and rule
            const existing = await prisma.notification.findFirst({
              where: {
                institutionId: fdr.institutionId,
                title: notifTitle,
              },
            });

            if (!existing) {
              await prisma.notification.create({
                data: {
                  institutionId: fdr.institutionId,
                  title: notifTitle,
                  message: notifMsg,
                  type: 'REMINDER',
                },
              });

              await prisma.smsOutbox.create({
                data: {
                  recipientPhone: fdr.institution.phone || '+91 98765 43210',
                  message: `AICTE Alert: FDR ${fdr.fdrNumber} (₹${fdr.amount.toLocaleString('en-IN')}) matures in ~${rule.daysBeforeMaturity} days. Please take action on portal.`,
                  status: 'DELIVERED',
                },
              });

              await sendEmail({
                to: fdr.institution.email,
                subject: `[AICTE REMINDER] ${notifTitle}`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; border-left: 4px solid #FF9933;">
                    <h3 style="color: #1F3A68;">AICTE Security Deposit Maturity Notice</h3>
                    <p>Dear ${fdr.institution.name},</p>
                    <p>${notifMsg}</p>
                    <p>Failure to renew or initiate release prior to maturity may lead to compliance flags.</p>
                  </div>
                `,
              });

              remindersTriggered++;
            }
          }
        }
      }

      // 2. Post-Maturity Detection & Status Transition
      if (diffDays <= 0) {
        if (fdr.status !== 'MATURED') {
          await prisma.fDR.update({
            where: { id: fdr.id },
            data: { status: 'MATURED' },
          });
          maturedCount++;
        }

        const daysOverdue = Math.abs(diffDays);

        // 3. Escalations
        for (const esc of escalationRules) {
          if (daysOverdue >= esc.daysOverdue) {
            const escTitle = `🚨 Escalation (${esc.daysOverdue}d Overdue): FDR #${fdr.fdrNumber} (${fdr.institution.name})`;
            const escMsg = `FDR #${fdr.fdrNumber} belonging to ${fdr.institution.name} has been matured for ${daysOverdue} days without renewal or release request. Escalated to ${esc.targetRole}.`;

            const existing = await prisma.notification.findFirst({
              where: { title: escTitle },
            });

            if (!existing) {
              await prisma.notification.create({
                data: {
                  title: escTitle,
                  message: escMsg,
                  type: 'ESCALATION',
                },
              });

              await prisma.smsOutbox.create({
                data: {
                  recipientPhone: '+91 98765 43220', // Scrutiny Officer
                  message: `AICTE Escalation: FDR ${fdr.fdrNumber} overdue by ${daysOverdue} days. Action required.`,
                  status: 'DELIVERED',
                },
              });

              escalationsTriggered++;
            }
          }
        }
      }
    }

    const durationMs = Date.now() - startTime;

    const summary = {
      simulatedDate: simulatedToday,
      totalScanned: fdrs.length,
      remindersTriggered,
      maturedTransitioned: maturedCount,
      escalationsTriggered,
      durationMs,
    };

    await prisma.jobRun.create({
      data: {
        jobName: 'LIFECYCLE_MATURITY_SCAN',
        status: 'SUCCESS',
        details: JSON.stringify(summary),
      },
    });

    if (actorId) {
      await AuditService.log({
        entityType: 'JOB',
        entityId: 'LIFECYCLE_SCAN',
        action: 'EXECUTE',
        actorId,
        afterState: summary,
      });
    }

    return summary;
  }
}
