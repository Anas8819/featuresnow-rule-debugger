import { Transaction } from '../models';

export class Currency {
  // Fixed approximate rates (mid-November 2026). Amounts mix 7 currencies, so thresholds are compared in USD.
  private static readonly usdRate: Record<string, number> = {
    USD: 1,
    PAB: 1,
    MXN: 0.054,
    BRL: 0.175,
    COP: 0.0003,
    CRC: 0.00226,
    GTQ: 0.13,
  };

  static usd(tx: Pick<Transaction, 'amount' | 'currency'>): number {
    return tx.amount * Currency.usdRate[tx.currency];
  }

  // Two decimals with thousands separators (1,124.54), the same everywhere: grid cells, reasons and the popup.
  static formatAmount(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  static money(value: number): string {
    return Currency.formatAmount(value) + ' USD';
  }
}
