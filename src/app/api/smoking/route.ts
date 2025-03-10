// pages/api/smoking.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

type SmokingEvent = {
  timestamp: string;
};

const filePath = path.join(process.cwd(), 'src', 'db', 'smoking.csv');

export async function GET() {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    // 先頭行はヘッダーなので除外
    const data: SmokingEvent[] = lines.slice(1).map(line => {
      const [timestamp] = line.split(',');
      return { timestamp: timestamp.trim() };
    });
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: `ファイル読み込みエラー${error}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { events } = await request.json();
  if (!Array.isArray(events)) {
    return Response.json({ error: 'Invalid events data' }, { status: 400 });
  }

  // CSV 形式に変換（ヘッダー付き）
  let csv = 'timestamp\n';
  events.forEach((event: SmokingEvent) => {
    csv += `${event.timestamp}\n`;
  });

  try {
    await fs.writeFile(filePath, csv, 'utf8');
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: `ファイル書き込みエラー${error}` }, { status: 500 });
  }
}
