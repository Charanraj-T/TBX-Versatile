import type { BreakdownColumn } from '../types';

export function exportToCSV(columns: BreakdownColumn[], rows: any[], filename = 'financial_export.csv') {
  if (!rows || rows.length === 0) return;

  const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

  const csvRows = rows.map(row => {
    return columns.map(col => {
      const val = row[col.key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'number') return val.toString();
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...csvRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function exportToExcel(columns: BreakdownColumn[], rows: any[], filename = 'financial_export.xls') {
  if (!rows || rows.length === 0) return;

  const headerCells = columns.map(col => 
    `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>`
  ).join('');

  const rowNodes = rows.map(row => {
    const cells = columns.map(col => {
      const val = row[col.key];
      if (val === null || val === undefined) {
        return '<Cell><Data ss:Type="String"></Data></Cell>';
      }
      if (typeof val === 'number' || (col.format === 'currency' && !isNaN(Number(val)))) {
        return `<Cell ss:StyleID="${col.format === 'currency' ? 'Currency' : 'Number'}"><Data ss:Type="Number">${Number(val)}</Data></Cell>`;
      }
      return `<Cell><Data ss:Type="String">${escapeXml(String(val))}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  const excelXML = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="$#,##0.00"/>
  </Style>
  <Style ss:ID="Number">
   <NumberFormat ss:Format="#,##0"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Export">
  <Table>
   <Row>${headerCells}</Row>
   ${rowNodes}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([excelXML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
