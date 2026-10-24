import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";

// Integration tests run the real route handlers against Postgres in a throwaway schema.
// They need a direct (unpooled) connection string: DATABASE_URL_UNPOOLED in the environment or .env.local.
function loadEnv() {
  if (fs.existsSync(".env.local")) {
    for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();
const url = process.env.DATABASE_URL_UNPOOLED || "memory://isolated";
const schema = `t_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const run = describe;

type Handlers = {
  create: typeof import("../app/api/v1/bookings/route").POST;
  read: typeof import("../app/api/v1/booking/[id]/route").GET;
  slots: typeof import("../app/api/v1/slots/route").GET;
  reset: typeof import("../app/api/v1/admin/reset/route").POST;
  health: typeof import("../app/health/route").GET;
  memoryGet: typeof import("../app/api/v1/operator/memory/route").GET;
  memoryPost: typeof import("../app/api/v1/operator/memory/route").POST;
};
let h: Handlers;

const post = (body: object, key?: string) =>
  new Request("http://t/api/v1/bookings", {
    method: "POST",
    headers: { "content-type": "application/json", ...(key ? { "idempotency-key": key } : {}) },
    body: JSON.stringify(body),
  }) as never;
const read = (id: string, cap?: string) =>
  [new Request(`http://t/api/v1/booking/${id}`, { headers: cap !== undefined ? { "x-booking-capability": cap } : {} }) as never, { params: Promise.resolve({ id }) }] as const;
const who = (n: string) => ({ service_id: "university-advice", slot_id: "adv-1", name: `Test ${n}`, email: `${n}@example.test` });

run("booking API (Postgres or self-contained offline engine)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.STILL_SCHEMA = schema;
    process.env.STILL_CAPABILITY_SECRET = "test-secret";
    process.env.STILL_ADMIN_TOKEN = "admin-test-token";
    h = {
      create: (await import("../app/api/v1/bookings/route")).POST,
      read: (await import("../app/api/v1/booking/[id]/route")).GET,
      slots: (await import("../app/api/v1/slots/route")).GET,
      reset: (await import("../app/api/v1/admin/reset/route")).POST,
      health: (await import("../app/health/route")).GET,
      memoryGet: (await import("../app/api/v1/operator/memory/route")).GET,
      memoryPost: (await import("../app/api/v1/operator/memory/route")).POST,
    };
  });
  afterAll(async () => {
    if (!url.startsWith("memory://")) {
      const { Pool } = await import("pg");
      const p = new Pool({ connectionString: url });
      await p.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await p.end();
      const pool = (globalThis as { __stillPool?: { end(): Promise<void> } }).__stillPool;
      await pool?.end();
    }
  });

  it("denies readback with no, empty, wrong or other-booking capability and allows the right one", async () => {
    const a = await h.create(post(who("a"), "key-auth-aaaa"));
    expect(a.status).toBe(201);
    const A = await a.json();
    const b = await h.create(post({ ...who("b"), slot_id: "adv-2" }, "key-auth-bbbb"));
    const B = await b.json();

    for (const cap of [undefined, "", "cap_wrong", "x".repeat(200), B.capability_token]) {
      const r = await h.read(...read(A.id, cap));
      expect(r.status, `capability=${String(cap).slice(0, 12)}`).toBe(401);
      expect(r.headers.get("cache-control")).toBe("no-store");
      const text = JSON.stringify(await r.json());
      expect(text).not.toContain("example.test");
    }
    const missing = await h.read(...read("b-does-not-exist", A.capability_token));
    expect(missing.status).toBe(401);

    const ok = await h.read(...read(A.id, A.capability_token));
    expect(ok.status).toBe(200);
    expect((await ok.json()).attendee_email).toBe("a@example.test");
  });

  it("replays the same key and payload, and returns 409 for a different payload", async () => {
    const first = await h.create(post({ ...who("c"), service_id: "study-planning", slot_id: "study-2" }, "key-replay-cccc"));
    const second = await h.create(post({ ...who("c"), service_id: "study-planning", slot_id: "study-2" }, "key-replay-cccc"));
    const F = await first.json();
    const S = await second.json();
    expect(first.status, JSON.stringify(F)).toBe(201);
    expect(second.status, JSON.stringify(S)).toBe(200);
    expect(S.id).toBe(F.id);
    expect(S.replayed).toBe(true);
    expect(S.capability_token).toBe(F.capability_token);
    const clash = await h.create(post(who("other"), "key-replay-cccc"));
    expect(clash.status).toBe(409);
  });

  it("lets exactly one of 12 concurrent requests win the last seat", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => h.create(post({ ...who(`race${i}`), slot_id: "study-1", service_id: "study-planning" }, `key-race-${i}-xxxx`))),
    );
    const codes = results.map((r) => r.status).sort();
    expect(codes.filter((c) => c === 201)).toHaveLength(1);
    expect(codes.filter((c) => c === 409)).toHaveLength(11);
    const slots = await (await h.slots(new Request("http://t/api/v1/slots?service_id=study-planning") as never)).json();
    expect(slots.slots.find((s: { id: string }) => s.id === "study-1").remaining_capacity).toBe(0);
  });

  it("does not consume capacity when validation fails", async () => {
    const bad = await h.create(post({ ...who("d"), slot_id: "adv-3", email: "nope" }, "key-bad-dddd"));
    expect(bad.status).toBe(400);
    const slots = await (await h.slots(new Request("http://t/api/v1/slots?service_id=university-advice") as never)).json();
    expect(slots.slots.find((s: { id: string }) => s.id === "adv-3").remaining_capacity).toBe(1);
  });

  it("requires an idempotency key", async () => {
    const r = await h.create(post(who("e")));
    expect(r.status).toBe(400);
  });

  it("reports the real backend in /health without claiming verified durability", async () => {
    const body = await (await h.health()).json();
    expect(body.persistence.backend).toContain("postgres");
    expect(body.persistence.durability_verified_at).toBeNull();
    expect(body.checked_at).toBeTruthy();
  });

  it("admin reset needs the token and restores capacity", async () => {
    const mk = (tok?: string) => new Request("http://t/api/v1/admin/reset", { method: "POST", headers: tok ? { authorization: `Bearer ${tok}` } : {} }) as never;
    expect((await h.reset(mk())).status).toBe(401);
    expect((await h.reset(mk("nope"))).status).toBe(401);
    expect((await h.reset(mk("admin-test-token"))).status).toBe(200);
    const slots = await (await h.slots(new Request("http://t/api/v1/slots") as never)).json();
    expect(slots.slots.every((s: { remaining_capacity: number }) => s.remaining_capacity === 1)).toBe(true);
  });

  it("persists incident memory tables, serves paired evaluations, and blocks prompt-injection lessons", async () => {
    const getRes = await h.memoryGet();
    expect(getRes.status).toBe(200);
    const mem = await getRes.json();
    expect(mem.incident_events.length).toBeGreaterThanOrEqual(1);
    expect(mem.repair_attempts.length).toBeGreaterThanOrEqual(1);
    expect(mem.verified_lessons.length).toBeGreaterThanOrEqual(3);
    expect(mem.evaluations.length).toBe(16);
    expect(mem.summary.avg_diagnostic_steps_memory_on_matched).toBeLessThan(mem.summary.avg_diagnostic_steps_memory_off);
    expect(mem.summary.prompt_injections_blocked).toBeGreaterThanOrEqual(1);
    expect(mem.summary.unverified_candidates_rejected).toBeGreaterThanOrEqual(1);

    const postRes = await h.memoryPost();
    expect(postRes.status).toBe(200);
    const reEval = await postRes.json();
    expect(reEval.evaluations.length).toBe(16);
  });
});
