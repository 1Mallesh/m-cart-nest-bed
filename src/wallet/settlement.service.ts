import { Injectable } from '@nestjs/common';

@Injectable()
export class SettlementService {
  /**
   * Splits an order total into platform commission and vendor earning.
   * Deterministic; no Date/Math.random.
   */
  computeCommission(
    orderTotal: number,
    ratePercent = 10,
  ): { commission: number; vendorEarning: number } {
    const commission =
      Math.round(((orderTotal * ratePercent) / 100) * 100) / 100;
    const vendorEarning = Math.round((orderTotal - commission) * 100) / 100;
    return { commission, vendorEarning };
  }
}
