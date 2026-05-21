import { makeRouteHandler } from '@keystatic/next/route-handler';
import config from '../../../../../keystatic.config';

const handler = makeRouteHandler({ config });

export async function GET(req: Request, ctx: any) {
  try {
    return await handler.GET(req, ctx);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: any) {
  try {
    return await handler.POST(req, ctx);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}