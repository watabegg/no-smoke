// pages/api/smoking.ts
import prisma from "@/lib/prisma";

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

export async function POST(request: Request) {
  const { event } = await request.json();

  try {
      await prisma.smoking.create({
      data: {
        timestamp: new Date(event.timestamp).toISOString()
      }
      });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: `データベースエラー: ${error}` }, { status: 500 });
  }
}
