// pages/api/smoking.ts
import prisma from "@/lib/prisma";
import { Client } from '@line/bot-sdk';

// type SmokingEvent = {
//   timestamp: string;
// };

export async function GET() {
  try {
    const events = await prisma.smoking.findMany({
      orderBy: {
        timestamp: 'desc'
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
  const { timestamp } = await request.json();
  
  try {
    // Save to database
    await prisma.smoking.create({
      data: {
        timestamp: timestamp
      }
    });
    
    // Format timestamp for message
    const date = new Date(timestamp);
    // Add 9 hours to adjust for Japan time zone
    date.setHours(date.getHours() + 9);
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Create formatted message
    const message = `${month}月${day}日${hours}時${minutes}分に吸ったよ！`;
    
    // Send message to LINE
    await client.broadcast({
      type: 'text',
      text: message
    });
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: `データベースエラー: ${error}` }, { status: 500 });
  }
}
