/**
 * Runs AI analysis for complaints that never got one (for example complaints created before Step 6).
 * Usage:  npm run ai:backfill            (all waiting complaints, one at a time)
 *         npm run ai:backfill -- 5       (at most 5)
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config(); // .env

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // Imported after the env files are loaded
  const { prisma } = await import("../src/lib/db");
  const { analyzeComplaint } = await import("../src/lib/ai/analyze-complaint");

  const limit = Number(process.argv[2]) || 50;

  // Complaints stuck in AI_ANALYSIS without a finished analysis go back to the queue first
  await prisma.complaint.updateMany({
    where: { status: "AI_ANALYSIS", OR: [{ aiAnalysis: null }, { aiAnalysis: { status: { not: "COMPLETED" } } }] },
    data: { status: "SUBMITTED" },
  });

  const waiting = await prisma.complaint.findMany({
    where: { status: "SUBMITTED", OR: [{ aiAnalysis: null }, { aiAnalysis: { status: { not: "COMPLETED" } } }] },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, ticketNumber: true },
  });
  console.log(`${waiting.length} complaint(s) waiting for analysis`);

  for (const c of waiting) {
    const r = await analyzeComplaint(c.id);
    console.log(`${c.ticketNumber}: ${r.status}${r.reason ? ` (${r.reason})` : ""}`);
    await sleep(6000); // stay under free-tier requests-per-minute limits
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
