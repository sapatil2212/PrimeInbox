import { db } from "../config/db";
import { SmtpAccount, RotationType } from "@prisma/client";

export class SmtpRotationService {
  /**
   * Selects an active SMTP account from the campaign's SMTP pool based on limit quotas and rotation algorithms.
   */
  static async selectSmtpAccount(
    companyId: string,
    smtpGroupId: string | null,
    rotationType: RotationType,
    lastSelectedSmtpId?: string,
    smtpAccountId?: string | null
  ): Promise<SmtpAccount | null> {
    if (smtpAccountId) {
      const singleAccount = await db.smtpAccount.findUnique({
        where: { id: smtpAccountId },
      });
      if (
        singleAccount &&
        singleAccount.status === "ACTIVE" &&
        singleAccount.currentDailyCount < singleAccount.dailyLimit &&
        singleAccount.currentHourlyCount < singleAccount.hourlyLimit
      ) {
        return singleAccount;
      }
      return null; // Selected SMTP account is rate-limited or inactive
    }

    let candidateAccounts: SmtpAccount[] = [];

    if (!smtpGroupId) {
      // If no group is configured, fall back to any active SMTP accounts owned by the tenant
      candidateAccounts = await db.smtpAccount.findMany({
        where: {
          companyId,
          status: "ACTIVE",
        },
      });
    } else {
      // Retrieve the mapped SMTP accounts for the group
      const mappings = await db.smtpGroupAccount.findMany({
        where: { smtpGroupId },
        include: {
          smtpAccount: true,
        },
      });
      candidateAccounts = mappings.map((m) => m.smtpAccount);
    }

    // Filter candidate accounts based on status and limit thresholds
    const eligibleAccounts = candidateAccounts.filter(
      (acc) =>
        acc.status === "ACTIVE" &&
        acc.currentDailyCount < acc.dailyLimit &&
        acc.currentHourlyCount < acc.hourlyLimit
    );

    if (eligibleAccounts.length === 0) {
      return null; // All accounts in the pool are rate-limited or disabled
    }

    return this.applyRotationAlgorithm(eligibleAccounts, rotationType, lastSelectedSmtpId);
  }

  /**
   * Applies the configured rotation algorithm to choose a single SMTP account.
   */
  private static applyRotationAlgorithm(
    accounts: SmtpAccount[],
    rotationType: RotationType,
    lastSelectedSmtpId?: string
  ): SmtpAccount {
    if (accounts.length === 1) return accounts[0];

    switch (rotationType) {
      case "RANDOM": {
        const randomIndex = Math.floor(Math.random() * accounts.length);
        return accounts[randomIndex];
      }

      case "PRIORITY": {
        // Sort by priority level (descending). Grab highest priority accounts.
        const maxPriority = Math.max(...accounts.map((a) => a.priority));
        const priorityPool = accounts.filter((a) => a.priority === maxPriority);
        // Round robin within the highest priority sub-pool
        return this.applyRoundRobin(priorityPool, lastSelectedSmtpId);
      }

      case "WEIGHTED": {
        const totalWeight = accounts.reduce((sum, a) => sum + a.rotationWeight, 0);
        if (totalWeight <= 0) return accounts[0];
        
        let randomWeightPoint = Math.random() * totalWeight;
        for (const account of accounts) {
          randomWeightPoint -= account.rotationWeight;
          if (randomWeightPoint <= 0) {
            return account;
          }
        }
        return accounts[0];
      }

      case "ROUND_ROBIN":
      default:
        return this.applyRoundRobin(accounts, lastSelectedSmtpId);
    }
  }

  /**
   * Round-robin helper that selects the next account in sequence after the last selected ID.
   */
  private static applyRoundRobin(accounts: SmtpAccount[], lastSelectedId?: string): SmtpAccount {
    if (!lastSelectedId) return accounts[0];

    const lastIdx = accounts.findIndex((a) => a.id === lastSelectedId);
    // If not found or was the last item, start over at 0
    if (lastIdx === -1 || lastIdx === accounts.length - 1) {
      return accounts[0];
    }
    
    return accounts[lastIdx + 1];
  }
}
