// pages/api/cigarette.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

type CigaretteSettings = {
  brand: string;
  tar?: number;
  nicotine?: number;
};

const filePath = path.join(process.cwd(), 'src', 'db', 'cigarette.csv');

export async function GET() {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return Response.json({ brand: '', tar: undefined, nicotine: undefined });
    }
    
    const [brand, tar, nicotine] = lines[1].split(',');
    return Response.json({
      brand: brand.trim(),
      tar: tar ? Number(tar.trim()) : undefined,
      nicotine: nicotine ? Number(nicotine.trim()) : undefined
    });
  } catch (error) {
    return Response.json({ error: `ファイル読み込みエラー${error}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const newSettings: CigaretteSettings = await request.json();
  
  if (!newSettings || typeof newSettings.brand !== 'string') {
    return Response.json({ error: 'Invalid settings data' }, { status: 400 });
  }

  const csv = `brand,tar,nicotine\n${newSettings.brand},${newSettings.tar || ''},${newSettings.nicotine || ''}\n`;
  
  try {
    await fs.writeFile(filePath, csv, 'utf8');
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: `ファイル書き込みエラー${error}` }, { status: 500 });
  }
}
