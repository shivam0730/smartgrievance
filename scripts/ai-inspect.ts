/**
 * Shows what the AI decided for one complaint (ticket number or id).
 * Usage:  npm run ai:inspect -- SG-2026-ABC123
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { prisma } = await import("../src/lib/db");
  const key = process.argv[2];
  if (!key) throw new Error("Give a ticket number, e.g. npm run ai:inspect -- SG-2026-ABC123");

  const c = await prisma.complaint.findFirst({
    where: { OR: [{ ticketNumber: key }, { id: key }] },
    include: { aiAnalysis: true, department: true },
  });
  if (!c) throw new Error(`No complaint found for "${key}"`);

  console.log(`\n${c.ticketNumber}  "${c.title}"`);
  console.log(`status=${c.status} priority=${c.priority} category=${c.category} department=${c.department?.name ?? "-"}`);
  const a = c.aiAnalysis;
  if (!a) return console.log("No AI analysis yet.");
  console.log(`AI: ${a.status} model=${a.model ?? "-"} confidence=${a.categoryConfidence ?? "-"}`);
  console.log(`duplicateScore=${a.duplicateScore}  suspicionScore=${a.suspicionScore}  review=${a.reviewStatus}`);
  console.log("suspicion reasons:", JSON.stringify(a.suspicionReasons, null, 2));
  if (a.errorMessage) console.log("error:", a.errorMessage);

  const pairs = await prisma.complaintSimilarity.findMany({
    where: { OR: [{ complaintAId: c.id }, { complaintBId: c.id }] },
    orderBy: { overallScore: "desc" },
  });
  console.log(`\nSimilar complaints (${pairs.length}):`);
  for (const p of pairs) {
    const otherId = p.complaintAId === c.id ? p.complaintBId : p.complaintAId;
    const other = await prisma.complaint.findUnique({ where: { id: otherId }, select: { ticketNumber: true, title: true } });
    console.log(
      `  ${other?.ticketNumber}  overall=${p.overallScore}  text=${p.textSimilarity}  image=${p.imageSimilarity ?? "-"}  ` +
        `location=${p.locationSimilarity} (${p.distanceMeters} m)  "${other?.title}"`,
    );
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
