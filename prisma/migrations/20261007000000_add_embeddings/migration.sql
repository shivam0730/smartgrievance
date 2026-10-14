-- Step 7: semantic duplicate search (pgvector) and look-alike photo fingerprints

-- Neon supports pgvector; this is a no-op if it is already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "ComplaintImage" ADD COLUMN "perceptualHash" TEXT;

-- CreateTable
CREATE TABLE "ComplaintEmbedding" (
    "complaintId" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintEmbedding_pkey" PRIMARY KEY ("complaintId")
);

-- CreateIndex
CREATE INDEX "ComplaintImage_perceptualHash_idx" ON "ComplaintImage"("perceptualHash");

-- AddForeignKey
ALTER TABLE "ComplaintEmbedding" ADD CONSTRAINT "ComplaintEmbedding_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
