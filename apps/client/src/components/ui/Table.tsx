import type { ReactNode } from 'react';

export interface TableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  sortable?: boolean;
}

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc';
}

interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  emptyMessage?: string;
  sort?: TableSort;
  onSortChange?: (key: string) => void;
}

/**
 * Generic table. Columns marked `sortable` render header buttons when
 * `onSortChange` is provided; the active column exposes aria-sort. Rows render
 * inside a horizontally scrollable wrapper so wide tables never break layout.
 */
const Table = <Row,>({ columns, rows, rowKey, emptyMessage = 'Nothing here yet.', sort, onSortChange }: TableProps<Row>) => (
  <div className="ui-table-wrap">
    {rows.length === 0 ? (
      <p className="ui-table__empty">{emptyMessage}</p>
    ) : (
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} aria-sort={sort?.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                {column.sortable && onSortChange ? (
                  <button type="button" className="ui-table__sort" onClick={() => onSortChange(column.key)}>
                    {column.header}
                    {sort?.key === column.key ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default Table;
