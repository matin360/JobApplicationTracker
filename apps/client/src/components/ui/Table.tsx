import type { ReactNode } from 'react';

export interface TableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
}

interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  emptyMessage?: string;
}

const Table = <Row,>({ columns, rows, rowKey, emptyMessage = 'Nothing here yet.' }: TableProps<Row>) => (
  <div className="ui-table-wrap">
    {rows.length === 0 ? (
      <p className="ui-table__empty">{emptyMessage}</p>
    ) : (
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
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
