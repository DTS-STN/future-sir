import type { ReactNode } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/table';

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
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead key={index} scope="col">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <TableCell className="text-nowrap" key={cellIndex}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
