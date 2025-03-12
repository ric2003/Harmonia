"use server"
import { getInfluxData } from '@/services/influx';

export async function GET() {
  return getInfluxData();
}