import { Transaction } from './transaction.model';

// feature_vectors.json has more columns, but rules only read hour_of_day from it.
export type FeatureVector = Pick<Transaction, 'transaction_id' | 'hour_of_day'>;
