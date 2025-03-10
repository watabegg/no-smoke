// pages/api/smoking.ts
import prisma from "@/lib/prisma";

type SmokingEvent = {
  timestamp: string;
};

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

export async function POST(request: Request) {
  const { events } = await request.json();
  if (!Array.isArray(events)) {
    return Response.json({ error: 'Invalid events data' }, { status: 400 });
  }

  try {
    // トランザクションを使用して一括保存
    await prisma.$transaction(
      events.map((event: SmokingEvent) => 
        prisma.smoking.create({
          data: {
            timestamp: new Date(event.timestamp).toISOString()
          }
        })
      )
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: `データベースエラー: ${error}` }, { status: 500 });
  }
}
