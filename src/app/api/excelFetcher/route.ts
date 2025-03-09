"use server"
import { NextRequest } from 'next/server';
import { GET as fetchExcelData } from '@/services/excelFetcher';

export async function GET(request: NextRequest) {
  return fetchExcelData();
}