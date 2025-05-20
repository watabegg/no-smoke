// pages/api/smoking.ts
import prisma from "@/lib/prisma";
import { Client } from '@line/bot-sdk';

export async function GET() {
  try {
    const events = await prisma.smoking.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        cigarette: true
      }
    });
    return Response.json(events);
  } catch (error) {
    return Response.json({ error: `データベースエラー: ${error}` }, { status: 500 });
  }
}

// LINE Bot SDK configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

export async function POST(request: Request) {
  const { timestamp, cigaretteId } = await request.json();
  
  try {
  //   // 最新のタバコ設定を取得（cigaretteIdが指定されていない場合）
  //   let finalCigaretteId = cigaretteId;
  //   if (!finalCigaretteId) {
  //     const latestCigarette = await prisma.cigarette.findFirst({
  //       orderBy: {
  //         id: 'desc'
  //       }
  //     });
  //     if (latestCigarette) {
  //       finalCigaretteId = latestCigarette.id;
  //     }
  //   }
    
  //   // Save to database
  //   await prisma.smoking.create({
  //     data: {
  //       timestamp: timestamp,
  //       cigaretteId: finalCigaretteId
  //     }
  //   });
    
  //   // Format timestamp for message
  //   const date = new Date(timestamp);
  //   // Add 9 hours to adjust for Japan time zone
  //   date.setHours(date.getHours() + 9);
  //   const month = date.getMonth() + 1; // getMonth() returns 0-11
  //   const day = date.getDate();
  //   const hours = date.getHours();
  //   const minutes = date.getMinutes();
    
  //   // Create formatted message
  //   const message = `${month}月${day}日${hours}時${minutes}分に吸ったよ！`;
    
  //   // Send message to LINE
  //   await client.broadcast({
  //     type: 'text',
  //     text: message
  //   });
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: `データベースエラー: ${error}` }, { status: 500 });
  }
}

// 既存のデータを更新するためのエンドポイント
export async function PUT() {
  try {
    // 最新のタバコ設定を取得
    const latestCigarette = await prisma.cigarette.findFirst({
      orderBy: {
        id: 'desc'
      }
    });
    
    if (!latestCigarette) {
      return Response.json({ message: "タバコ設定が見つかりません" }, { status: 404 });
    }
    
    // cigaretteIdが設定されていないすべての喫煙記録を更新
    // const updateResult = await prisma.smoking.updateMany({
    //   where: {
    //     cigaretteId: null
    //   },
    //   data: {
    //     cigaretteId: latestCigarette.id
    //   }
    // });
    
    return Response.json({ 
      success: true, 
      message: `喫煙記録を更新しました`,
      cigaretteId: latestCigarette.id
    });
  } catch (error) {
    return Response.json({ error: `データベースエラー: ${error}` }, { status: 500 });
  }
}
