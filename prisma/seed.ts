import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type Category,
  type ComplaintStatus,
  type Priority,
  type Severity,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// ── Config ────────────────────────────────────────────────
// Change this to your demo city's center (lat, lng)
const CITY_CENTER = { lat: 28.6139, lng: 77.209 };
const BULK_COMPLAINTS = 150;
// Put your REAL Clerk login email here so Step 3 can link your account as ADMIN
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@smartgrievance.demo";

// ── Deterministic random helpers ──────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

// ── Static data ───────────────────────────────────────────
const DEPARTMENTS = [
  { name: "Road Department", description: "Roads, potholes and road surface damage" },
  { name: "Sanitation Department", description: "Garbage collection and cleanliness" },
  { name: "Water Department", description: "Water supply and leakage" },
  { name: "Drainage Department", description: "Drains, sewers and waterlogging" },
  { name: "Electrical Department", description: "Streetlights and electricity infrastructure" },
];

const CATEGORY_TO_DEPT: Record<Category, string> = {
  POTHOLE: "Road Department",
  ROAD_DAMAGE: "Road Department",
  GARBAGE: "Sanitation Department",
  DRAINAGE: "Drainage Department",
  WATER_LEAKAGE: "Water Department",
  STREETLIGHT: "Electrical Department",
  ELECTRICITY: "Electrical Department",
  OTHER: "Sanitation Department",
};

const TEMPLATES: Record<Category, { titles: string[]; descs: string[] }> = {
  POTHOLE: {
    titles: ["Large pothole on main road", "Deep pothole near market"],
    descs: ["A deep pothole has formed and two-wheelers are slipping.", "Pothole is filled with water and is dangerous at night."],
  },
  GARBAGE: {
    titles: ["Garbage not collected for days", "Overflowing dustbin"],
    descs: ["Garbage has piled up and is smelling badly.", "The dustbin is overflowing and stray animals are spreading waste."],
  },
  DRAINAGE: {
    titles: ["Blocked drain", "Sewer overflow on street"],
    descs: ["Drain is choked and dirty water is flowing on the road.", "Sewer is overflowing after rain and entering shops."],
  },
  STREETLIGHT: {
    titles: ["Streetlight not working", "Flickering streetlight"],
    descs: ["The streetlight has been off for a week, area is very dark.", "Light keeps flickering and goes off at night."],
  },
  WATER_LEAKAGE: {
    titles: ["Water pipe leaking", "Water wasted from broken line"],
    descs: ["Main pipe is leaking and water is flowing on the road.", "Water has been leaking from the pipeline since morning."],
  },
  ROAD_DAMAGE: {
    titles: ["Road surface broken", "Cracked and sunken road"],
    descs: ["Road surface is badly broken for around 50 meters.", "The road has sunk in the middle and is cracking."],
  },
  ELECTRICITY: {
    titles: ["Loose electric wires hanging", "Transformer sparking"],
    descs: ["Electric wires are hanging low near the footpath.", "The transformer is sparking and may be dangerous."],
  },
  OTHER: {
    titles: ["Stray animal menace", "Illegal parking blocking lane"],
    descs: ["Many stray dogs are creating trouble in the lane.", "Vehicles are parked illegally and block the road."],
  },
};

const CATEGORIES = Object.keys(TEMPLATES) as Category[];
const FLOW: ComplaintStatus[] = ["SUBMITTED", "AI_ANALYSIS", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
const STATUS_POOL: ComplaintStatus[] = [
  "SUBMITTED", "ASSIGNED", "ASSIGNED", "IN_PROGRESS", "IN_PROGRESS", "IN_PROGRESS",
  "RESOLVED", "RESOLVED", "RESOLVED", "RESOLVED", "NEEDS_INFORMATION", "REJECTED", "CANCELLED",
];
const PRIORITY_POOL: Priority[] = ["LOW", "LOW", "MEDIUM", "MEDIUM", "MEDIUM", "HIGH", "HIGH", "CRITICAL"];

// ── Seed ──────────────────────────────────────────────────
async function main() {
  console.log("Cleaning old data...");
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.complaintSimilarity.deleteMany();
  await prisma.complaintStatusHistory.deleteMany();
  await prisma.complaintImage.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Departments
  const deptByName: Record<string, string> = {};
  for (const d of DEPARTMENTS) {
    const created = await prisma.department.create({ data: d });
    deptByName[d.name] = created.id;
  }

  // Users (clerkUserId values are placeholders; real accounts are linked by email in Step 3)
  const admin = await prisma.user.create({
    data: { clerkUserId: "seed_admin_1", name: "Demo Admin", email: ADMIN_EMAIL, role: "ADMIN" },
  });
  const officerByDept: Record<string, string> = {};
  for (const [i, d] of DEPARTMENTS.entries()) {
    const o = await prisma.user.create({
      data: {
        clerkUserId: `seed_officer_${i + 1}`,
        name: `Officer ${d.name.split(" ")[0]}`,
        email: `officer${i + 1}@smartgrievance.demo`,
        role: "OFFICER",
        departmentId: deptByName[d.name],
      },
    });
    officerByDept[d.name] = o.id;
  }
  const citizens: { id: string }[] = [];
  for (let i = 1; i <= 8; i++) {
    citizens.push(
      await prisma.user.create({
        data: { clerkUserId: `seed_citizen_${i}`, name: `Demo Citizen ${i}`, email: `citizen${i}@smartgrievance.demo` },
      }),
    );
  }

  // Helper to create one complete complaint
  let counter = 0;
  async function createComplaint(opts: {
    citizenId?: string;
    category?: Category; // final category
    aiCategory?: Category; // what AI said (defaults to category)
    status?: ComplaintStatus;
    priority?: Priority;
    lat?: number;
    lng?: number;
    ageDays?: number;
    title?: string;
    description?: string;
    duplicateScore?: number;
    suspicionScore?: number;
    suspicionReasons?: string[];
    imageHash?: string;
  }) {
    counter++;
    const category = opts.category ?? pick(CATEGORIES);
    const aiCategory = opts.aiCategory ?? category;
    const status = opts.status ?? pick(STATUS_POOL);
    const priority = opts.priority ?? pick(PRIORITY_POOL);
    const tpl = TEMPLATES[category];
    const createdAt = daysAgo(opts.ageDays ?? between(1, 90));
    const deptName = CATEGORY_TO_DEPT[category];
    const hasDept = status !== "SUBMITTED";
    const hasOfficer = ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "NEEDS_INFORMATION"].includes(status);
    const citizenId = opts.citizenId ?? pick(citizens).id;
    const ticket = `SG-${createdAt.getFullYear()}-${String(counter).padStart(6, "0")}`;
    const suspicionScore = opts.suspicionScore ?? Math.floor(between(0, 35));
    const severity = priority as Severity;

    // status history path
    const idx = FLOW.indexOf(status);
    const path: ComplaintStatus[] = idx >= 0 ? FLOW.slice(0, idx + 1) : [...FLOW.slice(0, 3), status];

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber: ticket,
        userId: citizenId,
        departmentId: hasDept ? deptByName[deptName] : null,
        assignedOfficerId: hasOfficer ? officerByDept[deptName] : null,
        title: opts.title ?? pick(tpl.titles),
        description: opts.description ?? pick(tpl.descs),
        category,
        status,
        priority,
        latitude: opts.lat ?? CITY_CENTER.lat + between(-0.03, 0.03),
        longitude: opts.lng ?? CITY_CENTER.lng + between(-0.03, 0.03),
        address: `Ward ${Math.floor(between(1, 40))}, Demo City`,
        createdAt,
        resolvedAt: status === "RESOLVED" ? new Date(createdAt.getTime() + between(1, 10) * 86_400_000) : null,
        images: {
          create: {
            imageUrl: `https://placehold.co/800x600?text=${category}`,
            storageKey: `demo/${ticket}`,
            fileName: `${ticket}.jpg`,
            mimeType: "image/jpeg",
            imageHash: opts.imageHash ?? `demo-hash-${ticket}`,
          },
        },
        aiAnalysis: {
          create: {
            status: "COMPLETED",
            category: aiCategory,
            categoryConfidence: Number(between(0.72, 0.99).toFixed(2)),
            severity,
            priority,
            duplicateScore: opts.duplicateScore ?? Number(between(0, 0.4).toFixed(2)),
            suspicionScore,
            suspicionReasons: opts.suspicionReasons ?? [],
            reviewStatus: suspicionScore > 60 ? "PENDING" : "NOT_REQUIRED",
            recommendedDepartmentId: deptByName[CATEGORY_TO_DEPT[aiCategory]],
            reasoning: `Category ${aiCategory} detected from description and image. Priority ${priority} based on severity and location.`,
            model: "seed-demo",
          },
        },
        statusHistory: {
          create: path.map((s, i) => ({
            oldStatus: i === 0 ? null : path[i - 1],
            newStatus: s,
            changedById: i < 2 ? null : hasOfficer ? officerByDept[deptName] : admin.id,
            createdAt: new Date(createdAt.getTime() + i * 3_600_000),
          })),
        },
      },
    });

    if (status === "RESOLVED" && rand() < 0.6) {
      await prisma.feedback.create({
        data: {
          complaintId: complaint.id,
          userId: citizenId,
          rating: 3 + Math.floor(rand() * 3),
          outcome: pick(["YES", "YES", "PARTIALLY", "NO"] as const),
        },
      });
    }
    return complaint;
  }

  console.log(`Creating ${BULK_COMPLAINTS} demo complaints...`);
  for (let i = 0; i < BULK_COMPLAINTS; i++) await createComplaint({});

  // ── 5 visible demo cases ──
  console.log("Creating special demo cases...");

  // 1. Normal complaint
  await createComplaint({
    category: "POTHOLE", status: "ASSIGNED", priority: "MEDIUM", ageDays: 1,
    title: "[DEMO] Normal complaint - pothole",
  });

  // 2. Duplicate pair (same spot, ~30m apart, same category)
  const lat = CITY_CENTER.lat + 0.011, lng = CITY_CENTER.lng + 0.012;
  const a = await createComplaint({
    category: "GARBAGE", status: "ASSIGNED", priority: "HIGH", ageDays: 3, lat, lng,
    title: "[DEMO] Garbage heap near park gate",
    description: "Huge garbage heap near the park gate, not collected for a week.",
  });
  const b = await createComplaint({
    category: "GARBAGE", status: "ASSIGNED", priority: "HIGH", ageDays: 2, lat: lat + 0.0002, lng: lng + 0.0001,
    title: "[DEMO] Garbage dumped at park entrance",
    description: "Lots of waste piled up at the entrance of the park for days.",
    duplicateScore: 0.92,
  });
  const [first, second] = [a.id, b.id].sort();
  await prisma.complaintSimilarity.create({
    data: {
      complaintAId: first, complaintBId: second,
      textSimilarity: 0.93, imageSimilarity: 0.88, locationSimilarity: 0.97,
      distanceMeters: 42, overallScore: 0.92,
    },
  });

  // 3. Suspicious complaint (reused image, text/image mismatch)
  await createComplaint({
    category: "POTHOLE", status: "ASSIGNED", priority: "LOW", ageDays: 1,
    title: "[DEMO] Suspicious - large pothole", description: "Large pothole on road.",
    suspicionScore: 84, imageHash: "demo-hash-reused",
    suspicionReasons: ["Image already used in a previous complaint", "Text describes pothole but image shows a streetlight", "Third similar submission this week from same account"],
  });

  // 4. Critical complaint
  await createComplaint({
    category: "ELECTRICITY", status: "IN_PROGRESS", priority: "CRITICAL", ageDays: 0.5,
    title: "[DEMO] Critical - live wire on footpath",
    description: "A live electric wire has fallen on the footpath near a school. Immediate danger.",
  });

  // 5. AI category override (AI said POTHOLE, officer changed to ROAD_DAMAGE)
  const ov = await createComplaint({
    category: "ROAD_DAMAGE", aiCategory: "POTHOLE", status: "IN_PROGRESS", priority: "HIGH", ageDays: 4,
    title: "[DEMO] AI category override",
  });
  await prisma.auditLog.create({
    data: {
      actorId: officerByDept["Road Department"],
      action: "CATEGORY_OVERRIDE",
      entityType: "Complaint",
      entityId: ov.id,
      oldValue: { category: "POTHOLE" },
      newValue: { category: "ROAD_DAMAGE" },
    },
  });

  const total = await prisma.complaint.count();
  console.log(`Done. Departments: ${DEPARTMENTS.length}, complaints: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());