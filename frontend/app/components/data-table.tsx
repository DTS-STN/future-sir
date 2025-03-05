import type { ReactNode } from 'react';

type Row = (string | number | ReactNode)[];

interface DataTableProps {
  /**
   * Array of column header text
   */
  headers: string[];

  /**
   * 2D array of table data where each inner array represents a row
   */
  rows: Row[];

  /**
   * Whether to apply alternating background colors to rows
   * @default true
   */
  striped?: boolean;
}

export function DataTable({ headers, rows, striped = true }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-600">
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-white">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
