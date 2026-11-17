export interface Transaction {
  transaction_id: string;
  txn_date_time: string;
  // txn_date_time in milliseconds, parsed once when the data loads so rules can compare times cheaply.
  time: number;
  sender_account_id: string;
  amount: number;
  currency: string;
  // amount converted to USD at the fixed rates in Currency, once when the data loads. Every threshold compares this.
  usd: number;
  transaction_type: string | null;
  merchant_description_condensed: string;
  merchant_country: string;
  hour_of_day: number;
}
