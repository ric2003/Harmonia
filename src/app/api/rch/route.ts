import { NextResponse } from "next/server";
import { parseRchFile } from "@/utils/rchParser";
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const parsedData = parseRchFile(content);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error parsing RCH file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse RCH file" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public/SeriesTemporaisCaudais/93.rch');
    console.log('Reading file from:', filePath);
    
    const sampleRchContent = await fs.readFile(filePath, 'utf8');
    console.log('File content length:', sampleRchContent.length);
    console.log('First few lines:', sampleRchContent.split('\n').slice(0, 5));
    
    const parsedData = parseRchFile(sampleRchContent);
    console.log('Parsed data timeseries length:', parsedData.timeseries.length);
    
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error parsing RCH file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse RCH file" },
      { status: 500 }
    );
  }
} 