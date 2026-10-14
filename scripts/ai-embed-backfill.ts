/**
 * Creates the text embedding for complaints that do not have one yet (for example the seeded demo complaints),
 * so that new complaints can be compared against them.
 * Usage:  npm run ai:embed-backfill
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { prisma } = await import("../src/lib/db");
  const { getAIProvider } = await import("../src/lib/ai/provider");
  const { complaintEmbeddingText, embedTexts } = await import("../src/lib/ai/embeddings");
  const { storeEmbedding } = await import("../src/lib/ai/duplicates");

  const provider = getAIProvider();
  const todo = await prisma.$queryRaw<{ id: string; title: string; description: string }[]>`
    SELECT c.id, c.title, c.description
    FROM "Complaint" c
    LEFT JOIN "ComplaintEmbedding" e ON e."complaintId" = c.id
    WHERE e."complaintId" IS NULL
    ORDER BY c."createdAt" ASC`;
  console.log(`${todo.length} complaint(s) without an embedding (using ${provider.name}:${provider.embeddingModel})`);

  const BATCH = 20;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const vectors = await embedTexts(provider, batch.map(complaintEmbeddingText));
    for (let j = 0; j < batch.length; j++) await storeEmbedding(batch[j].id, vectors[j], provider.embeddingModel);
    console.log(`  embedded ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    if (i + BATCH < todo.length) await new Promise((r) => setTimeout(r, 4000)); // free-tier friendly
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
