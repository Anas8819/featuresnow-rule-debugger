import { Rule, Transaction } from '../models';

export class OutsideHoursRule implements Rule {
  readonly id = 'RULE_006';
  readonly startHour = 6;
  readonly endHour = 22;
  readonly condition = `Hour of day is before ${this.startHour} or at/after ${this.endHour}`;

  check(tx: Transaction): string | null {
    if (tx.hour_of_day >= this.startHour && tx.hour_of_day < this.endHour) return null;
    return `Hour ${tx.hour_of_day} is outside business hours (${this.startHour}:00 to ${this.endHour}:00)`;
  }
}
