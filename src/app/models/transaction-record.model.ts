import { Transaction } from './transaction.model';

// transactions.json has everything a rule needs except hour_of_day, which comes from the feature vector,
// and time and usd, which RuleService computes.
export type TransactionRecord = Omit<Transaction, 'hour_of_day' | 'time' | 'usd'>;
