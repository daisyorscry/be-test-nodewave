import fs from "fs";
import path from "path";
import axios from "axios";
import * as XLSX from "xlsx";

export async function loadExcelBuffer(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith("file://")) {
    const localPath = fileUrl.replace("file://", "");
    return fs.readFileSync(localPath);
  }

  if (fileUrl.startsWith("/") || fileUrl.startsWith("./") || fileUrl.startsWith("../")) {
    const resolved = path.resolve(fileUrl);
    if (fs.existsSync(resolved)) {
      return fs.readFileSync(resolved);
    }

    if (fileUrl.startsWith("/storage/uploads/")) {
      const cwdResolved = path.resolve(process.cwd(), fileUrl.replace(/^\//, ""));
      return fs.readFileSync(cwdResolved);
    }

    const cwdResolved = path.resolve(process.cwd(), fileUrl.replace(/^\//, ""));
    return fs.readFileSync(cwdResolved);
  }

  const response = await axios.get<ArrayBuffer>(fileUrl, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

export function parseWorkbook(buffer: Buffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: "buffer" });
}

export function excelDateToJS(value: unknown): Date | null {
  if (typeof value !== "number") return null;
  const d = XLSX.SSF.parse_date_code(value);
  if (!d) return null;
  return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H, d.M, d.S));
}

export function extractSheetRows(workbook: XLSX.WorkBook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<any[]>(sheet, { defval: null, header: 1 });
}
