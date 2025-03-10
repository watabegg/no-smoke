// pages/api/cigarette.ts
import prisma from "@/lib/prisma";

type CigaretteSettings = {
  brand: string;
  tar?: number;
  nicotine?: number;
};

export async function GET() {
  try {
    // 最新の設定を取得
    const latestSettings = await prisma.cigarette.findFirst();
    
    if (!latestSettings) {
      return Response.json({ brand: '', tar: undefined, nicotine: undefined });
    }
    
    return Response.json({
      brand: latestSettings.brand,
      tar: latestSettings.tar || undefined,
      nicotine: latestSettings.nicotine || undefined
    });
  } catch (error) {
    return Response.json({ error: `データベースエラー: ${error}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const newSettings: CigaretteSettings = await request.json();
  
  if (!newSettings || typeof newSettings.brand !== 'string') {
    return Response.json({ error: 'Invalid settings data' }, { status: 400 });
  }

  try {
    await prisma.cigarette.create({
      data: {
        brand: newSettings.brand,
        tar: newSettings.tar || 0,
        nicotine: newSettings.nicotine || 0,
      }
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: `データベースエラー: ${error}` }, { status: 500 });
  }
}
