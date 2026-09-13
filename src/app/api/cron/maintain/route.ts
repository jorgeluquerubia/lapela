import { NextResponse } from 'next/server';
import { runMaintenance } from '@/controllers/marketplace';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 401 });
  }

  try {
    const metrics = await runMaintenance();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error durante la ejecución del mantenimiento programado' },
      { status: 500 }
    );
  }
}

export const POST = GET;
