"use server"
import { NextRequest } from 'next/server';
import { getInfluxData } from '@/services/influx';

export async function GET(request: NextRequest) {
  return getInfluxData();
}