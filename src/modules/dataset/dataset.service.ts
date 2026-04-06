import fs from "node:fs";
import path from "node:path";
import { InvoiceRow } from "../query/query.types";

export class DatasetService {
  static getInvoices(): InvoiceRow[] {
    const filePath = path.join(process.cwd(), "src/data/invoices.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    return JSON.parse(fileContent) as InvoiceRow[];
  }
}