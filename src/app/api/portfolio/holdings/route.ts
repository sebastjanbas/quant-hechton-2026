import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

// GET /api/portfolio/holdings — list user's holdings
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await db.query(
    `SELECT id, ticker, name, shares, "costBasisPerShare", "assetClass", "createdAt"
     FROM holdings
     WHERE "userId" = $1
     ORDER BY "createdAt" ASC`,
    [session.user.id]
  );

  return NextResponse.json(rows);
}

// POST /api/portfolio/holdings — add a holding
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { ticker, name, shares, costBasisPerShare, assetClass } = body;

  if (!ticker || !name || !shares || !costBasisPerShare) {
    return NextResponse.json({ error: "ticker, name, shares, and costBasisPerShare are required" }, { status: 400 });
  }

  const id = crypto.randomUUID();

  const { rows } = await db.query(
    `INSERT INTO holdings (id, "userId", ticker, name, shares, "costBasisPerShare", "assetClass")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("userId", ticker)
     DO UPDATE SET
       shares = EXCLUDED.shares,
       "costBasisPerShare" = EXCLUDED."costBasisPerShare",
       "assetClass" = EXCLUDED."assetClass",
       "updatedAt" = CURRENT_TIMESTAMP
     RETURNING id, ticker, name, shares, "costBasisPerShare", "assetClass", "createdAt"`,
    [id, session.user.id, ticker.toUpperCase(), name, shares, costBasisPerShare, assetClass ?? "equity"]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
