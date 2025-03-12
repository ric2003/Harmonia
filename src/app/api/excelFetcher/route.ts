"use server"
import { GET as fetchExcelData } from '@/services/excelFetcher';

export async function GET() {
  return fetchExcelData();
}