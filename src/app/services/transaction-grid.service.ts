import { Injectable } from '@angular/core';
import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColDef,
  DateFilterModule,
  FilterChangedEvent,
  GridOptions,
  IFilterOptionDef,
  ModuleRegistry,
  PaginationModule,
  RowAutoHeightModule,
  TextFilterModule,
  themeQuartz,
} from 'ag-grid-community';

import { Currency } from '../helpers';
import { TxResult } from '../models';

// The AG Grid setup shared by the Transactions page grid and the Rules page's failing-transactions grid:
// modules, options (look, paging, sorting, the "All" filter reset), filters and the transaction columns.
// Both grids show TxResult rows; each page adds its own last column.
@Injectable({ providedIn: 'root' })
export class TransactionGridService {
  // AG Grid only bundles the features that are registered. These grids use:
  // an in-memory row list (ClientSideRowModelModule, which also brings column sorting), paging,
  // rows that grow to fit wrapped text, cell classes (cellClass, used for the mono IDs, right-aligned amounts
  // and wrapped cells), and text and date column filters.
  // Registered here rather than in app.config.ts so AG Grid stays in the lazy-loaded page bundles:
  // both pages inject this service before their grid renders.
  constructor() {
    ModuleRegistry.registerModules([
      ClientSideRowModelModule,
      PaginationModule,
      RowAutoHeightModule,
      CellStyleModule,
      TextFilterModule,
      DateFilterModule,
    ]);
  }

  // Everything both grids set the same way. Each page passes this as [gridOptions], plus its own rows and columns.
  readonly gridOptions: GridOptions<TxResult> = {
    // Every column sorts when its header is clicked (ascending, descending, then unsorted).
    // Resizing, column dragging and the column menu are switched off. The filter icon is its own header button,
    // so it still appears on columns that have a filter.
    defaultColDef: {
      sortable: true,
      resizable: false,
      suppressMovable: true,
      suppressHeaderMenuButton: true,
    },
    // Matches the app's design tokens in styles.scss, so the grid looks like the rest of the app.
    theme: themeQuartz.withParams({
      accentColor: '#3a5bd9',
      borderColor: '#e1e4ea',
      foregroundColor: '#1b2330',
      headerBackgroundColor: '#f0f2f5',
      headerTextColor: '#5d6878',
      fontFamily: 'inherit',
      fontSize: 12,
      wrapperBorderRadius: 8,
    }),
    pagination: true,
    paginationPageSize: 50,
    // The paging bar shows "1 to 50 of N" and "Page [x] of y" with First/Previous/Next/Last buttons.
    // The page number is an input box, so any page can be reached by typing it. There is no page-size picker.
    paginationPanels: ['rowSummary', 'pageSummary'],
    // autoHeight: the grid grows to fit its 50 rows, so the page scrolls instead of a box inside the grid.
    domLayout: 'autoHeight',
    onFilterChanged: (event) => this.removeAllOptionFilters(event),
  };

  // AG Grid's own class for right-aligned cells. Used instead of `type: 'rightAligned'`, which would also
  // right-align the header (and move its filter icon to the left of the title); all headers stay left-aligned.
  private readonly rightAlignedCell = 'ag-right-aligned-cell';

  // A text filter limited to "contains" with a single condition, like a plain search box.
  private readonly containsFilter = {
    filter: 'agTextColumnFilter',
    filterParams: { filterOptions: ['contains'], maxNumConditions: 1 },
  };

  // AG Grid's multi-select filter is Enterprise-only, so the dropdown filters use the free text filter as a
  // single-select: each option has no text box (numberOfInputs: 0) and its own predicate that decides,
  // from the cell's filter value, whether a row stays.
  // "All" comes first because the dropdown always shows its first option: without it, the filter would open
  // showing a real option (e.g. BRA) while nothing is filtered, and picking that option would do nothing.
  dropdownFilter(options: IFilterOptionDef[]) {
    const all: IFilterOptionDef = {
      displayKey: 'all',
      displayName: 'All',
      numberOfInputs: 0,
      predicate: () => true,
    };
    return {
      filter: 'agTextColumnFilter',
      filterParams: { filterOptions: [all, ...options], maxNumConditions: 1 },
    };
  }

  option(
    displayKey: string,
    displayName: string,
    keep: (cellValue: string) => boolean,
  ): IFilterOptionDef {
    return {
      displayKey,
      displayName,
      numberOfInputs: 0,
      predicate: (_filterValues: unknown[], cellValue: string) => keep(cellValue),
    };
  }

  // The transaction columns both grids show. The Country and Type dropdown options come from the given rows,
  // so each grid only offers the values it actually contains.
  transactionColumns(rows: TxResult[]): ColDef<TxResult>[] {
    return [
      {
        headerName: 'Transaction',
        field: 'tx.transaction_id',
        cellClass: 'mono',
        width: 140,
        ...this.containsFilter,
      },
      {
        headerName: 'Date & time',
        field: 'tx.txn_date_time',
        width: 160,
        filter: 'agDateColumnFilter',
        // The cell shows the original text. The filter compares the time parsed at load (milliseconds)
        // with the date picked in the filter: negative = before it, positive = after it, 0 = same moment.
        // cellDataType: false stops AG Grid guessing "date-time text" from the cell values and parsing them itself,
        // which would replace the comparison below.
        cellDataType: false,
        filterValueGetter: (p) => p.data?.tx.time ?? null,
        filterParams: {
          filterOptions: ['inRange'],
          inRangeInclusive: true,
          includeTime: true,
          maxNumConditions: 1,
          comparator: (filterDate: Date, cellTime: number) => Math.sign(cellTime - filterDate.getTime()),
        },
      },
      {
        headerName: 'Merchant',
        field: 'tx.merchant_description_condensed',
        flex: 1,
        minWidth: 140,
        ...this.containsFilter,
      },
      {
        headerName: 'Country',
        field: 'tx.merchant_country',
        width: 110,
        ...this.singleSelectFilter(this.distinctSorted(rows, (row) => row.tx.merchant_country)),
      },
      {
        headerName: 'Type',
        valueGetter: (p) => (p.data ? this.typeOf(p.data) : ''),
        width: 120,
        ...this.singleSelectFilter(this.distinctSorted(rows, (row) => this.typeOf(row))),
      },
      // The amount columns hold the number, so they sort numerically; valueFormatter only changes what is shown.
      // Amount is in each transaction's own currency, so compare sizes with Amount (USD).
      {
        headerName: 'Amount',
        valueGetter: (p) => p.data?.tx.amount,
        valueFormatter: (p) => (p.data ? `${Currency.formatAmount(p.value)} ${p.data.tx.currency}` : ''),
        cellClass: this.rightAlignedCell,
        width: 140,
      },
      {
        headerName: 'Amount (USD)',
        valueGetter: (p) => p.data?.tx.usd,
        valueFormatter: (p) => (p.value == null ? '' : Currency.formatAmount(p.value)),
        // The filter searches the plain number (1124.54), so typing 1124 matches a cell shown as 1,124.54.
        filterValueGetter: (p) => p.data?.tx.usd.toFixed(2) ?? '',
        cellClass: this.rightAlignedCell,
        width: 140,
        ...this.containsFilter,
      },
    ];
  }

  // Picking "All" in a dropdown filter lets every row through, but AG Grid still counts it as an active filter
  // and keeps the header's filter icon highlighted. So whenever a column is set to "All", its filter is removed
  // completely. Removing it fires filterChanged again, but then no column is on "All", so this stops there.
  private removeAllOptionFilters(event: FilterChangedEvent<TxResult>): void {
    const model = event.api.getFilterModel();
    const withoutAll = Object.fromEntries(
      Object.entries(model).filter(([, columnModel]) => columnModel?.type !== 'all'),
    );
    if (Object.keys(withoutAll).length !== Object.keys(model).length) {
      event.api.setFilterModel(withoutAll);
    }
  }

  private typeOf(row: TxResult): string {
    return row.tx.transaction_type ?? '—';
  }

  // Country and Type: one option per value; picking one keeps rows whose cell equals it.
  private singleSelectFilter(values: string[]) {
    return this.dropdownFilter(values.map((value) => this.option(value, value, (cell) => cell === value)));
  }

  private distinctSorted(rows: TxResult[], getValue: (row: TxResult) => string): string[] {
    return [...new Set(rows.map(getValue))].sort();
  }
}
