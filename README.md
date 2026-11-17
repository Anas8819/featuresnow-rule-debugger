# Rule Debugger

A small UI for answering one question: **which rules does a transaction fail, and why?**

- **Transactions page**: every transaction, the rules it fails and the reason for each. Filter by transaction, date and time range, merchant, country, type or USD amount from the column headers.
- **Rules page**: a card per rule with its exact condition and failure count, so rules that never fire, or fire far too often, stand out. Open a rule to see every transaction that fails it, each with its reason, in the same grid as the Transactions page.

## Run it

```
npm install
npm start
```

Then open http://localhost:4200. The first load takes a few seconds: the app downloads about 37 MB of JSON and evaluates every rule against every transaction once.

## What's there

There are two grids:
- **Transactions page:** every transaction, with a last **Failed rules** column. Each failed rule is a chip that opens a popup explaining that rule for that transaction, followed by its reason.
- **Rules page, after opening a rule:** the transactions that fail that rule, with a last **Reason** column. It's plain text: the rule is already open, so there's no chip and no filter.

Both grids show the same rows (a transaction with its failures) and share one setup, `TransactionGridService` (`src/app/services/transaction-grid.service.ts`):
- the modules;
- one `gridOptions` object (theme, paging, sorting, the "All" filter reset);
- the filters;
- the transaction columns.

Each page passes `[gridOptions]`, its rows and its columns, and adds only its own last column.

How the grids are set up:
- 50 rows per page.
- Filters open from a filter icon in the column header:

  | Column | Filter |
  |---|---|
  | Transaction | text, "contains" |
  | Date & time | date and time range |
  | Merchant | text, "contains" |
  | Country | single-select |
  | Type | single-select |
  | Amount (USD) | text, "contains", on the plain number: typing `1124` matches `1,124.54` |
  | Failed rules (Transactions page) | single-select: All, "—" (passed every rule), "All rules" (failed any rule), or one of RULE_001 to RULE_007 |
  | Reason (Rules page) | none |

- Country, Type and Failed rules are single-select because AG Grid's multi-select (Set) filter is Enterprise-only.
  - They use the free text filter, with "All" plus one dropdown option per choice.
  - Each option has its own small predicate.
  - The Failed rules filter reads a hidden value per row, such as `RULE_001,RULE_005`, or `—` when the transaction passed every rule.
- The paging bar has First/Previous/Next/Last buttons and a page-number box: type a page and press Enter to jump straight to it.
- Every column sorts when you click its header (ascending, descending, then unsorted):
  - Amount and Amount (USD) hold the number and only format it for display, so they sort numerically. Amount is in each transaction's own currency, so use Amount (USD) to compare sizes.
  - Failed rules holds the failed rule IDs (the chips are drawn by a cell renderer), so it sorts by them: rows failing the same rules sit together, and rows that passed everything ("—") come last.
  - No column needs a custom sort comparator.
- Column menus, resizing, column dragging and the page-size picker are switched off.
- Picking "All" in a dropdown filter removes that column's filter completely, so its header icon goes back to grey.
- Only the AG Grid modules the grids need are registered.
- Both pages are lazy-loaded, so AG Grid sits in one shared chunk downloaded on first use, not in the initial bundle.

## Approach

```
src/app/
  models/                       one interface per file (*.model.ts), all exported from index.ts
    rule.model.ts               the Rule interface every rule implements
    transaction.model.ts        the Transaction shape the rules read (with time and usd computed at load)
    rule-info.model.ts          a rule's name, description, severity, action and condition
    tx-result.model.ts          a transaction with the rules it fails (the row both grids show)
    *-record.model.ts           the shapes as read from the JSON files, before RuleService completes them
    ...                         Failure, FeatureVector, AppData, Evaluation, RulePopup
  evaluators/
    *-rule.evaluator.ts         one class per rule: its thresholds, condition text and check()
    rules.token.ts              RULES, the multi-provider InjectionToken<Rule[]> RuleService injects
    rule.providers.ts           provideRules(): the one list of rule classes, each provided under RULES
    index.ts                    exports RULES and provideRules
  helpers/
    currency.ts                 Currency: USD rates, usd(), formatAmount(), money()
    sender-history.ts           SenderHistory: earlierTransactions() / mostCommonCountry(), shared by RULE_003 and RULE_005
    index.ts                    exports Currency and SenderHistory
  services/
    data.service.ts             reads the 3 JSON files and returns them as read
    rule.service.ts             injects the rules; joins transactions with feature vectors (adding time and usd),
                                groups by sender, runs every rule, and gives each rule its condition
    evaluation.service.ts       connects the two: loads the data, evaluates it once, and caches that one result
    transaction-grid.service.ts the AG Grid setup both pages share
  components/
    rule-tags/                  a rule's ID with its severity and action badges (rule cards, rule detail, rule popup)
    rule-condition/             the grey box with a rule's exact condition (same three places)
  app.ts/.html/.scss            navigation + router outlet
  app.routes.ts                 /transactions, /rules (the rule cards) and /rules/:ruleId (one rule's failing transactions)
  pages/
    transactions-page/          the Transactions page (*.component.ts, .html, .scss)
    rules-page/                 the Rules page, both the list and one rule (*.component.ts, .html, .scss)
src/styles.scss                 styles shared by both pages (font, cards, badges, buttons, grid cells)
```

- **Every rule implements one `Rule` interface** (the Strategy pattern):
  - `id`: matches the `rule_id` in `example_rules.json`.
  - `condition`: the exact check in plain English.
  - `check(tx, senderTxs)`: returns a reason string when the transaction fails, or `null` when it passes.
- **Each class owns its thresholds** as fields. Changing a threshold is a one-line edit, and the `condition` text is built from the same fields, so the text and the logic can't drift apart.
- **Rules are registered through DI.** `provideRules()` (in `app.config.ts`) provides each rule class under the multi-provider token `RULES`, and `RuleService` injects `RULES` to get them all. `RuleService` never changes when a rule is added, and a rule class can `inject()` whatever it needs later (such as a rules config).
- **Adding a rule** takes three steps. Nothing else changes.
  1. Create an `evaluators/*-rule.evaluator.ts` file with a class that implements `Rule`.
  2. Add the class to the list in `evaluators/rule.providers.ts`.
  3. Add its name and description to `example_rules.json`.
- **Evaluation pairs each rule once.** `RuleService.evaluate` pairs each rule from `example_rules.json` with its implementation up front, copies the implementation's `condition` onto the rule info, and returns `{ rules, results }`. The pages show `rule.condition` directly.
- **One job per service.** `DataService` only reads the JSON files. `RuleService` only turns that data into results. `EvaluationService` connects the two and is the only service the pages call for data, so `DataService` and `RuleService` never call each other.
- **Evaluated once.** The data never changes while the app runs. `EvaluationService` holds the app's only cache, one promise of the evaluation, so switching pages doesn't reload or re-evaluate anything. The pages only filter and paginate the results.
- **Each rule has its own URL.** Opening a rule card goes to `/rules/RULE_005`, so the browser's Back button returns to the list and a rule can be linked to directly. An unknown rule ID shows the list.
- **A missing data file shows an error.** If a JSON file can't be loaded, both pages show what failed instead of staying on "Loading…".
ou can compare a row directly against the rule's condition. RULE_006 uses the hour of day, which you can read from the date and time.

## How each rule was interpreted

`example_rules.json` only describes rules in words, so each description had to be turned into a concrete check.

| Rule | Fails when | Fails |
|---|---|---|
| RULE_001 High value | amount in USD > 1,000 | 388 |
| RULE_002 Many small transactions | amount < 10 USD, and the sender has ≥ 5 such transactions in the last 60 minutes (this one included) | 206 |
| RULE_003 Unusual type | the type makes up < 5% of the sender's **earlier** transactions (at least 10 needed) | 915 |
| RULE_004 High-risk merchant | the merchant is on the high-risk list | 0 |
| RULE_005 Cross-border | the merchant country differs from the most common country in the sender's earlier transactions (at least 10 needed), and amount ≥ 250 USD | 175 |
| RULE_006 Outside hours | hour of day < 6 or ≥ 22 | 9,268 |
| RULE_007 Large ATM cash | type is `atm` and amount > 500 USD | 0 |

## Data findings

- **Invalid JSON:** both data files contain bare `NaN`, which isn't valid JSON. It is replaced with `null` before parsing.
- **Joining the files:** `transactions.json` and `feature_vectors.json` match 1:1 on `transaction_id`. Only `hour_of_day` is taken from the feature vector; the rest comes from the transaction.
- **RULE_004 can't fire:** the data provides no high-risk merchant list, so the list is empty.
- **RULE_007 can't fire:** there is no ATM or cash transaction type, and `terminal_id` is always 0.

## What I'd do with more time

Time was short, so these were left out. None of them needs a restructure: they build on the current layout.

### Configurable rules

- **Thresholds outside the code.** Every threshold is a field on its evaluator class (`minUsd`, `windowMinutes`, `rareShare`, …), so changing one means a code change and a rebuild. They could move to `environment.ts`, or better, to a `rules-config.json` in `public/data` that is loaded with the other files and passed to each evaluator's constructor. The `condition` text is already built from those fields, so it would follow the config automatically.
- **The same for the other hard-coded lists:** the USD rates in `Currency` and the empty high-risk merchant list in RULE_004. The rates could also come from an exchange-rate API instead of fixed mid-November values.
- **Editing thresholds in the UI.** A small form on the rule detail page (for example "minimum USD" for RULE_001) that re-runs that rule and updates its failure count immediately. This is the most useful debugging feature: "how many transactions would fail if the limit were 1,500?". `EvaluationService` would then cache the loaded data separately from the evaluation, so only the rules re-run, not the 37 MB download.
- **Declarative rules.** Further out, rules could be described as data (field, operator, value, optional sender-history window) and run by one generic evaluator, so a new simple rule needs no new class. The Strategy classes would stay for rules that need custom logic, like RULE_003 and RULE_005.

### Reusable components

- **An Angular cell renderer** for the Failed rules chips. It is currently built with `document.createElement` in the page. A component implementing `ICellRendererAngularComp` would use a normal template and an `output()` for the click.

### Performance

- **Faster sender history.** `SenderHistory.earlierTransactions` filters the sender's full list for every transaction, and RULE_002 does the same for its 60-minute window, which is quadratic per sender. Sorting each sender's list by time once, then using a running count per type and country (RULE_003, RULE_005) and a sliding window (RULE_002), would make evaluation close to linear.

### Small features

- **Export to CSV** of the currently filtered rows (AG Grid's `CsvExportModule` is in Community).
- **Filters in the URL,** so a filtered view can be shared or bookmarked, the same way each rule already has its own URL.
- **"Why didn't it fire?" per transaction:** a transaction detail view listing every rule with pass or fail and the values compared, for example "1,124.54 USD > 1,000 USD: fails" and "hour 14 is inside 6 to 22: passes". This would need `check()` to also explain passes.
- **An Hour column** in the grids, so RULE_006 can be checked without reading it off the date and time.
- **Failures over time:** a small chart per rule showing when it fires, which makes rules like RULE_006 (9,268 failures) stand out even more clearly.
