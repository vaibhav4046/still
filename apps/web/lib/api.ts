export type ApiErrorPayload = {
  detail?: string;
  message?: string;
  error?: string;
};

export type Service = {
  id: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  active?: boolean;
};

export type Slot = {
  id: string;
  serviceId?: string;
  startsAt: string;
  endsAt?: string;
  available?: boolean;
};

export type Booking = {
  id?: string;
  confirmationReference?: string;
  status?: string;
  serviceName?: string;
  startsAt?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  capabilityToken?: string;
};

export type Health = {
  status?: string;
  version?: string;
  services?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type OperatorSummary = {
  status?: string;
  journeyStatus?: string;
  headline?: string;
  healthyJourneys?: number;
  activeIncidents?: number;
  pendingRepairs?: number;
  evidenceCount?: number;
  services?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type Incident = Record<string, unknown> & {
  id?: string;
  title?: string;
  severity?: string;
  status?: string;
  summary?: string;
  createdAt?: string;
};

export type TimelineEvent = Record<string, unknown> & {
  id?: string;
  title?: string;
  event?: string;
  status?: string;
  occurredAt?: string;
  createdAt?: string;
};

export type Policy = Record<string, unknown> & {
  id?: string;
  name?: string;
  status?: string;
  description?: string;
};

export type AskResponse = {
  answer?: string;
  message?: string;
  response?: string;
  [key: string]: unknown;
};

export type VerifiedLesson = {
  id: string;
  signature_hash: string;
  failure_family: string;
  route_pattern: string;
  selector_pattern: string;
  root_cause_summary: string;
  minimal_repair_recipe: string;
  verification_command: string;
  source_commit_sha: string;
  verified_pipeline_id: string | null;
  trust_state: "trusted" | "candidate" | "quarantined";
  times_reused: number;
  sanitizer_status: "CLEAN" | "BLOCKED";
  sanitized_recipe_preview: string;
};

export type MemoryEvaluation = {
  id: string;
  scenario_id: string;
  scenario_name: string;
  failure_family: string;
  memory_mode: "off" | "on";
  matched_lesson_id: string | null;
  precedent_status: string;
  trust_check_passed: boolean;
  sanitizer_blocked: boolean;
  diagnostic_steps: number;
  diagnosis_latency_ms: number;
  correct_minimal_fix: boolean;
  verification_passed: boolean;
  lines_changed: number;
};

export type OperatorMemoryState = {
  schema_version: string;
  disclosure: string;
  summary: {
    scenarios_total: number;
    paired_runs_total: number;
    trusted_lessons_count: number;
    candidate_lessons_count: number;
    quarantined_lessons_count: number;
    trusted_precedent_hits: number;
    unverified_candidates_rejected: number;
    prompt_injections_blocked: number;
    avg_diagnostic_steps_memory_off: number;
    avg_diagnostic_steps_memory_on_all: number;
    avg_diagnostic_steps_memory_on_matched: number;
  };
  incident_events: Array<Record<string, unknown>>;
  repair_attempts: Array<Record<string, unknown>>;
  verified_lessons: VerifiedLesson[];
  evaluations: MemoryEvaluation[];
};

export function getApiBaseUrl() {
  const custom = process.env.NEXT_PUBLIC_STILL_API_URL;
  if (typeof custom === "string" && custom.trim().length > 0) {
    return custom.trim().replace(/\/+$/, "");
  }
  return "";
}

export class StillApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "StillApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new StillApiError(
      "The appointment booking service is currently reconnecting. Please refresh or try the accessible fallback.",
    );
  }

  if (!response.ok) {
    let message = `The STILL service returned ${response.status}.`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = payload.detail || payload.message || payload.error || message;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new StillApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function arrayFromPayload(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key];
  }
  return [];
}

export function normalizeServices(payload: unknown): Service[] {
  return arrayFromPayload(payload, ["services", "data"]).flatMap((item) => {
    const record = asRecord(item);
    const id = asString(record.id || record.service_id || record.slug);
    const name = asString(record.name || record.title || record.label);
    if (!id || !name) return [];
    const duration = record.duration_minutes ?? record.durationMinutes;
    return [
      {
        id,
        name,
        description: asString(record.description),
        durationMinutes: typeof duration === "number" ? duration : undefined,
        active: typeof record.active === "boolean" ? record.active : undefined,
      },
    ];
  });
}

export function normalizeSlots(payload: unknown): Slot[] {
  return arrayFromPayload(payload, ["slots", "data"]).flatMap((item) => {
    const record = asRecord(item);
    const id = asString(record.id || record.slot_id);
    const startsAt = asString(record.starts_at || record.startsAt || record.start_time || record.startTime);
    if (!id || !startsAt) return [];
    return [
      {
        id,
        serviceId: asString(record.service_id || record.serviceId),
        startsAt,
        endsAt: asString(record.ends_at || record.endsAt || record.end_time || record.endTime),
        available: typeof record.available === "boolean" ? record.available : undefined,
      },
    ];
  });
}

export function normalizeBooking(payload: unknown): Booking {
  const record = asRecord(payload);
  const nested = asRecord(record.booking || record.data);
  const source = Object.keys(nested).length ? nested : record;
  return {
    id: asString(source.id || source.booking_id),
    confirmationReference: asString(source.confirmation_reference || source.confirmationReference || source.reference),
    status: asString(source.status),
    serviceName: asString(source.service_name || source.serviceName),
    startsAt: asString(source.starts_at || source.startsAt),
    attendeeName: asString(source.attendee_name || source.attendeeName || source.name),
    attendeeEmail: asString(source.attendee_email || source.attendeeEmail || source.email),
    capabilityToken: asString(source.capability_token || source.capabilityToken || source.capability),
  };
}

export function normalizeRecords<T extends Record<string, unknown>>(payload: unknown, keys: string[]): T[] {
  return arrayFromPayload(payload, keys).map((item) => asRecord(item) as T);
}

export function getHealth() {
  return request<Health>("/health");
}

export async function getServices() {
  return normalizeServices(await request<unknown>("/api/v1/services"));
}

export async function getSlots(serviceId: string) {
  return normalizeSlots(await request<unknown>(`/api/v1/slots?service_id=${encodeURIComponent(serviceId)}`));
}

export function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() || `still-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** The caller owns the idempotency key so a retry of the same intent replays instead of double-booking. */
export async function createBooking(input: {
  serviceId: string;
  slotId: string;
  name: string;
  email: string;
  idempotencyKey: string;
}) {
  const idempotencyKey = input.idempotencyKey;
  return normalizeBooking(
    await request<unknown>("/api/v1/bookings", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        service_id: input.serviceId,
        slot_id: input.slotId,
        name: input.name,
        email: input.email,
      }),
    }),
  );
}

export async function getBooking(id: string, capabilityToken: string) {
  return normalizeBooking(
    await request<unknown>(`/api/v1/booking/${encodeURIComponent(id)}`, {
      headers: { "x-booking-capability": capabilityToken },
    }),
  );
}

export function getOperatorSummary() {
  return request<OperatorSummary>("/api/v1/operator/summary");
}

export async function getOperatorIncidents() {
  return normalizeRecords<Incident>(await request<unknown>("/api/v1/operator/incidents"), ["incidents", "data"]);
}

export async function getOperatorTimeline() {
  return normalizeRecords<TimelineEvent>(await request<unknown>("/api/v1/operator/timeline"), [
    "timeline",
    "events",
    "data",
  ]);
}

export async function getOperatorPolicies() {
  return normalizeRecords<Policy>(await request<unknown>("/api/v1/operator/policies"), ["policies", "data"]);
}

export function askOperator(question: string) {
  return request<AskResponse>("/api/v1/operator/ask", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

export function getOperatorMemory() {
  return request<OperatorMemoryState>("/api/v1/operator/memory");
}

export function runOperatorMemoryEvaluation() {
  return request<OperatorMemoryState>("/api/v1/operator/memory", {
    method: "POST",
    body: JSON.stringify({ action: "evaluate" }),
  });
}
