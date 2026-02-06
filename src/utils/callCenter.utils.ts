// Helpers for parsing call-center Excel rows and updating processing progress.
import { excelDateToJS } from "$utils/excel.utils";
import { prisma } from "$utils/prisma.utils";

export function mapRowsToRecords(fileId: number, headers: string[], rows: any[], offset: number) {
  const getByHeader = (row: any[], header: string) => row[headers.indexOf(header)];
  return rows
    .map((row, idx) => {
      if (!row || row.length === 0 || row[0] == null) return null;
      return {
        fileId,
        rowNumber: offset + idx + 1,
        externalId: String(getByHeader(row, "ID") ?? ""),
        customerName: String(getByHeader(row, "Customer Name") ?? ""),
        sentiment: String(getByHeader(row, "Sentiment") ?? ""),
        csatScore: getByHeader(row, "CSAT Score") != null ? Number(getByHeader(row, "CSAT Score")) : null,
        callTimestamp: excelDateToJS(getByHeader(row, "Call Timestamp")),
        reason: getByHeader(row, "Reason") ? String(getByHeader(row, "Reason")) : null,
        city: getByHeader(row, "City") ? String(getByHeader(row, "City")) : null,
        state: getByHeader(row, "State") ? String(getByHeader(row, "State")) : null,
        channel: getByHeader(row, "Channel") ? String(getByHeader(row, "Channel")) : null,
        responseTime: getByHeader(row, "Response Time") ? String(getByHeader(row, "Response Time")) : null,
        callDurationMinutes:
          getByHeader(row, "Call Duration (Minutes)") != null
            ? Number(getByHeader(row, "Call Duration (Minutes)"))
            : null,
        callCenter: getByHeader(row, "Call Center") ? String(getByHeader(row, "Call Center")) : null
      };
    })
    .filter(Boolean);
}

export async function updateProgress(fileId: number, processedRows: number) {
  await (prisma as any).fileUpload.update({
    where: { id: fileId },
    data: { processedRows }
  });
}
