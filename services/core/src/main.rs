use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    FromRow, Row, SqlitePool,
};
use std::{
    env,
    net::SocketAddr,
    path::Path as FsPath,
    str::FromStr,
    sync::atomic::{AtomicU64, Ordering},
};
use still_domain::{confirmation_reference, fingerprint, validate_booking, BookingInput};
use still_journey_contract::{evaluate, JourneyEvidence};
use tokio::net::TcpListener;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::{info, warn};

static ID_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Clone)]
struct AppState {
    pool: SqlitePool,
    version: String,
    started_at: String,
}

#[derive(Debug, Serialize)]
struct ErrorBody {
    error: String,
    detail: String,
}

#[derive(Debug)]
enum AppError {
    BadRequest(String),
    Unauthorized(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error, detail) = match self {
            Self::BadRequest(detail) => (StatusCode::BAD_REQUEST, "bad_request", detail),
            Self::Unauthorized(detail) => (StatusCode::UNAUTHORIZED, "unauthorized", detail),
            Self::NotFound(detail) => (StatusCode::NOT_FOUND, "not_found", detail),
            Self::Conflict(detail) => (StatusCode::CONFLICT, "conflict", detail),
            Self::Internal(detail) => (StatusCode::INTERNAL_SERVER_ERROR, "internal_error", detail),
        };
        (
            status,
            Json(ErrorBody {
                error: error.into(),
                detail,
            }),
        )
            .into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        warn!(error = %error, "database operation failed");
        Self::Internal("The STILL service could not complete that operation.".into())
    }
}

#[derive(Debug, Deserialize)]
struct BookingRequest {
    service_id: String,
    slot_id: String,
    name: String,
    email: String,
}

#[derive(Debug, Deserialize)]
struct ServiceQuery {
    service_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct IncidentRequest {
    journey_id: String,
    release_sha: Option<String>,
    failure_class: String,
    summary: String,
    severity: Option<String>,
    evidence_uri: Option<String>,
}

#[derive(Debug, Deserialize)]
struct MonitorRequest {
    source: Option<String>,
    release_sha: Option<String>,
}

#[derive(Debug, Deserialize)]
struct AskRequest {
    question: String,
}

#[derive(Debug, Deserialize)]
struct EvidenceRequest {
    evidence: JourneyEvidence,
}

#[derive(Debug, FromRow)]
struct ServiceRow {
    id: String,
    name: String,
    description: String,
    duration_minutes: i64,
    active: i64,
}

#[derive(Debug, FromRow)]
struct SlotRow {
    id: String,
    service_id: String,
    starts_at: String,
    ends_at: String,
    remaining_capacity: i64,
}

#[derive(Debug, FromRow)]
struct BookingRow {
    id: String,
    service_id: String,
    slot_id: String,
    attendee_name: String,
    attendee_email: String,
    status: String,
    confirmation_reference: String,
    confirmation_code: String,
    request_fingerprint: String,
    created_at: String,
}

#[derive(Debug, FromRow)]
struct IncidentRow {
    id: String,
    journey_id: String,
    release_sha: Option<String>,
    failure_class: String,
    summary: String,
    severity: String,
    status: String,
    evidence_uri: Option<String>,
    created_at: String,
}

#[derive(Debug, FromRow)]
struct TimelineRow {
    id: String,
    event: String,
    status: String,
    summary: String,
    occurred_at: String,
}

#[derive(Debug, FromRow)]
struct PolicyRow {
    id: String,
    name: String,
    status: String,
    description: String,
}

#[derive(Debug, FromRow)]
struct BookingCount {
    count: i64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter("still_core=info")
        .init();
    let pool = connect_pool().await?;
    initialize_database(&pool).await?;
    let state = AppState {
        pool,
        version: env::var("STILL_VERSION").unwrap_or_else(|_| "local".into()),
        started_at: Utc::now().to_rfc3339(),
    };
    let app = app(state);
    let host = env::var("STILL_BIND").unwrap_or_else(|_| "0.0.0.0:8787".into());
    let address: SocketAddr = host.parse()?;
    let listener = TcpListener::bind(address).await?;
    info!(address = %address, "STILL core listening");
    axum::Server::from_tcp(listener.into_std()?)?
        .serve(app.into_make_service())
        .await?;
    Ok(())
}

fn app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/v1/services", get(list_services))
        .route("/api/v1/slots", get(list_slots))
        .route("/api/v1/bookings", post(create_booking))
        .route("/api/v1/booking/:id", get(get_booking))
        .route("/api/v1/operator/summary", get(operator_summary))
        .route("/api/v1/operator/incidents", get(operator_incidents))
        .route("/api/v1/operator/timeline", get(operator_timeline))
        .route("/api/v1/operator/policies", get(operator_policies))
        .route("/api/v1/operator/ask", post(operator_ask))
        .route("/internal/incidents", post(create_incident))
        .route("/internal/monitor/run", post(run_monitor))
        .route("/internal/evidence/evaluate", post(evaluate_evidence))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn connect_pool() -> Result<SqlitePool, sqlx::Error> {
    let raw = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://data/still.db".into());
    if raw.starts_with("sqlite://") && !raw.contains(":memory:") {
        if let Some(parent) = FsPath::new(raw.trim_start_matches("sqlite://")).parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent).map_err(sqlx::Error::Io)?;
            }
        }
    }
    let options = SqliteConnectOptions::from_str(&raw)
        .map_err(|error| sqlx::Error::Configuration(Box::new(error)))?
        .create_if_missing(true)
        .foreign_keys(true);
    SqlitePoolOptions::new()
        .max_connections(8)
        .connect_with(options)
        .await
}

async fn initialize_database(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let statements = [
        "CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, duration_minutes INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1)",
        "CREATE TABLE IF NOT EXISTS slots (id TEXT PRIMARY KEY, service_id TEXT NOT NULL REFERENCES services(id), starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, capacity INTEGER NOT NULL, remaining_capacity INTEGER NOT NULL)",
        "CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, service_id TEXT NOT NULL, slot_id TEXT NOT NULL, attendee_name TEXT NOT NULL, attendee_email TEXT NOT NULL, status TEXT NOT NULL, confirmation_reference TEXT NOT NULL UNIQUE, confirmation_code TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE, request_fingerprint TEXT NOT NULL, created_at TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, journey_id TEXT NOT NULL, release_sha TEXT, failure_class TEXT NOT NULL, summary TEXT NOT NULL, severity TEXT NOT NULL, status TEXT NOT NULL, evidence_uri TEXT, created_at TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS timeline_events (id TEXT PRIMARY KEY, event TEXT NOT NULL, status TEXT NOT NULL, summary TEXT NOT NULL, occurred_at TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS policies (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL, description TEXT NOT NULL)",
        "CREATE INDEX IF NOT EXISTS idx_slots_service_starts ON slots(service_id, starts_at)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id)",
        "CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status, created_at)",
    ];
    for statement in statements {
        sqlx::query(statement).execute(pool).await?;
    }
    seed_data(pool).await
}

async fn seed_data(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT OR IGNORE INTO services (id, name, description, duration_minutes, active) VALUES (?, ?, ?, ?, 1)")
        .bind("advice-session")
        .bind("Advice appointment")
        .bind("A synthetic 30-minute appointment with a student support adviser.")
        .bind(30_i64)
        .execute(pool)
        .await?;
    sqlx::query("INSERT OR IGNORE INTO services (id, name, description, duration_minutes, active) VALUES (?, ?, ?, ?, 1)")
        .bind("study-planning")
        .bind("Study planning session")
        .bind("A synthetic 45-minute session for planning a manageable study week.")
        .bind(45_i64)
        .execute(pool)
        .await?;

    let slots = [
        (
            "advice-1",
            "advice-session",
            "2026-10-26T09:30:00Z",
            "2026-10-26T10:00:00Z",
        ),
        (
            "advice-2",
            "advice-session",
            "2026-10-26T11:00:00Z",
            "2026-10-26T11:30:00Z",
        ),
        (
            "advice-3",
            "advice-session",
            "2026-10-27T14:00:00Z",
            "2026-10-27T14:30:00Z",
        ),
        (
            "study-1",
            "study-planning",
            "2026-10-26T13:00:00Z",
            "2026-10-26T13:45:00Z",
        ),
        (
            "study-2",
            "study-planning",
            "2026-10-27T10:00:00Z",
            "2026-10-27T10:45:00Z",
        ),
    ];
    for (id, service_id, starts_at, ends_at) in slots {
        sqlx::query("INSERT OR IGNORE INTO slots (id, service_id, starts_at, ends_at, capacity, remaining_capacity) VALUES (?, ?, ?, ?, 1, 1)")
            .bind(id)
            .bind(service_id)
            .bind(starts_at)
            .bind(ends_at)
            .execute(pool)
            .await?;
    }
    let policies = [
        ("policy-fail-closed", "Release evidence gate", "active", "A release needs persisted booking evidence, readback and a matching source SHA."),
        ("policy-bounded-repair", "Repair attempts", "active", "Repairs are bounded and stop after the configured attempt limit."),
        ("policy-synthetic-data", "Synthetic demo data", "active", "Only fictional service and synthetic attendee data are permitted in the demo environment."),
    ];
    for (id, name, status, description) in policies {
        sqlx::query(
            "INSERT OR IGNORE INTO policies (id, name, status, description) VALUES (?, ?, ?, ?)",
        )
        .bind(id)
        .bind(name)
        .bind(status)
        .bind(description)
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn health(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let services = sqlx::query_as::<_, ServiceRow>("SELECT id, name, description, duration_minutes, active FROM services WHERE active = 1 ORDER BY name")
        .fetch_all(&state.pool)
        .await?;
    Ok(Json(json!({
        "status": "healthy",
        "service": "still-core",
        "version": state.version,
        "started_at": state.started_at,
        "persistence": "sqlite",
        "synthetic_data": true,
        "services": services.into_iter().map(service_json).collect::<Vec<_>>(),
    })))
}

async fn list_services(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let services = sqlx::query_as::<_, ServiceRow>("SELECT id, name, description, duration_minutes, active FROM services WHERE active = 1 ORDER BY name")
        .fetch_all(&state.pool)
        .await?;
    Ok(Json(
        json!({ "services": services.into_iter().map(service_json).collect::<Vec<_>>() }),
    ))
}

async fn list_slots(
    State(state): State<AppState>,
    Query(query): Query<ServiceQuery>,
) -> Result<Json<Value>, AppError> {
    let service_id = query
        .service_id
        .ok_or_else(|| AppError::BadRequest("service_id is required".into()))?;
    let slots = sqlx::query_as::<_, SlotRow>("SELECT id, service_id, starts_at, ends_at, remaining_capacity FROM slots WHERE service_id = ? ORDER BY starts_at")
        .bind(service_id)
        .fetch_all(&state.pool)
        .await?;
    Ok(Json(
        json!({ "slots": slots.into_iter().map(slot_json).collect::<Vec<_>>() }),
    ))
}

async fn create_booking(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<BookingRequest>,
) -> Result<Json<Value>, AppError> {
    let input = BookingInput {
        service_id: payload.service_id,
        slot_id: payload.slot_id,
        name: payload.name,
        email: payload.email,
    };
    validate_booking(&input).map_err(|error| AppError::BadRequest(error.to_string()))?;
    let idempotency_key = header_value(&headers, "idempotency-key").unwrap_or_else(new_id);
    if idempotency_key.len() > 160 {
        return Err(AppError::BadRequest("Idempotency-Key is too long".into()));
    }
    let request_fingerprint = fingerprint(&input);
    let mut transaction = state.pool.begin().await?;
    let existing = sqlx::query_as::<_, BookingRow>("SELECT id, service_id, slot_id, attendee_name, attendee_email, status, confirmation_reference, confirmation_code, request_fingerprint, created_at FROM bookings WHERE idempotency_key = ?")
        .bind(&idempotency_key)
        .fetch_optional(&mut *transaction)
        .await?;
    if let Some(existing) = existing {
        if existing.request_fingerprint != request_fingerprint {
            return Err(AppError::Conflict(
                "The idempotency key was already used for a different booking request.".into(),
            ));
        }
        transaction.commit().await?;
        return Ok(Json(booking_json(existing, true, true)));
    }

    let slot = sqlx::query_as::<_, SlotRow>("SELECT id, service_id, starts_at, ends_at, remaining_capacity FROM slots WHERE id = ? AND service_id = ?")
        .bind(&input.slot_id)
        .bind(&input.service_id)
        .fetch_optional(&mut *transaction)
        .await?
        .ok_or_else(|| AppError::NotFound("The requested slot does not exist for this service.".into()))?;
    if slot.remaining_capacity <= 0 {
        return Err(AppError::Conflict(
            "That appointment slot is already full.".into(),
        ));
    }
    let updated = sqlx::query("UPDATE slots SET remaining_capacity = remaining_capacity - 1 WHERE id = ? AND remaining_capacity > 0")
        .bind(&slot.id)
        .execute(&mut *transaction)
        .await?;
    if updated.rows_affected() != 1 {
        return Err(AppError::Conflict(
            "That appointment slot was taken by another request.".into(),
        ));
    }

    let booking_id = new_id();
    let confirmation_code = new_id();
    let confirmation = confirmation_reference(&booking_id);
    let created_at = Utc::now().to_rfc3339();
    sqlx::query("INSERT INTO bookings (id, service_id, slot_id, attendee_name, attendee_email, status, confirmation_reference, confirmation_code, idempotency_key, request_fingerprint, created_at) VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?)")
        .bind(&booking_id)
        .bind(&input.service_id)
        .bind(&input.slot_id)
        .bind(input.name.trim())
        .bind(input.email.trim().to_lowercase())
        .bind(&confirmation)
        .bind(&confirmation_code)
        .bind(&idempotency_key)
        .bind(&request_fingerprint)
        .bind(&created_at)
        .execute(&mut *transaction)
        .await?;
    transaction.commit().await?;
    let booking = BookingRow {
        id: booking_id,
        service_id: input.service_id,
        slot_id: input.slot_id,
        attendee_name: input.name.trim().into(),
        attendee_email: input.email.trim().to_lowercase(),
        status: "confirmed".into(),
        confirmation_reference: confirmation,
        confirmation_code,
        request_fingerprint,
        created_at,
    };
    Ok(Json(booking_json(booking, false, true)))
}

async fn get_booking(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    let capability = header_value(&headers, "x-booking-capability")
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            AppError::Unauthorized("A valid booking capability is required for readback.".into())
        })?;
    let booking = sqlx::query_as::<_, BookingRow>("SELECT id, service_id, slot_id, attendee_name, attendee_email, status, confirmation_reference, confirmation_code, request_fingerprint, created_at FROM bookings WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| {
            AppError::Unauthorized("A valid booking capability is required for readback.".into())
        })?;
    if capability.as_str() != booking.confirmation_code.as_str() {
        return Err(AppError::Unauthorized(
            "A valid booking capability is required for readback.".into(),
        ));
    }
    Ok(Json(booking_json(booking, false, false)))
}

async fn operator_summary(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let services = service_health(&state.pool).await?;
    let active_incidents = sqlx::query_as::<_, BookingCount>(
        "SELECT COUNT(*) AS count FROM incidents WHERE status NOT IN ('resolved', 'closed')",
    )
    .fetch_one(&state.pool)
    .await?
    .count;
    let pending_repairs = sqlx::query_as::<_, BookingCount>("SELECT COUNT(*) AS count FROM incidents WHERE status IN ('investigating', 'repairing', 'awaiting_verification')").fetch_one(&state.pool).await?.count;
    let evidence_count =
        sqlx::query_as::<_, BookingCount>("SELECT COUNT(*) AS count FROM timeline_events")
            .fetch_one(&state.pool)
            .await?
            .count;
    let healthy = services
        .iter()
        .filter(|item| item.get("status") == Some(&json!("healthy")))
        .count() as i64;
    Ok(Json(json!({
        "status": if active_incidents == 0 { "healthy" } else { "degraded" },
        "journeyStatus": if active_incidents == 0 { "healthy" } else { "degraded" },
        "headline": if active_incidents == 0 { "All supported journeys are holding." } else { "A supported journey needs attention." },
        "healthyJourneys": healthy,
        "activeIncidents": active_incidents,
        "pendingRepairs": pending_repairs,
        "evidenceCount": evidence_count,
        "services": services,
        "syntheticData": true,
    })))
}

async fn operator_incidents(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let rows = sqlx::query_as::<_, IncidentRow>("SELECT id, journey_id, release_sha, failure_class, summary, severity, status, evidence_uri, created_at FROM incidents ORDER BY created_at DESC LIMIT 50").fetch_all(&state.pool).await?;
    Ok(Json(
        json!({ "incidents": rows.into_iter().map(incident_json).collect::<Vec<_>>() }),
    ))
}

async fn operator_timeline(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let rows = sqlx::query_as::<_, TimelineRow>("SELECT id, event, status, summary, occurred_at FROM timeline_events ORDER BY occurred_at DESC LIMIT 100").fetch_all(&state.pool).await?;
    Ok(Json(
        json!({ "timeline": rows.into_iter().map(timeline_json).collect::<Vec<_>>() }),
    ))
}

async fn operator_policies(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let rows = sqlx::query_as::<_, PolicyRow>(
        "SELECT id, name, status, description FROM policies ORDER BY id",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(
        json!({ "policies": rows.into_iter().map(policy_json).collect::<Vec<_>>() }),
    ))
}

async fn operator_ask(
    State(state): State<AppState>,
    Json(payload): Json<AskRequest>,
) -> Result<Json<Value>, AppError> {
    let question = payload.question.trim();
    if question.is_empty() || question.chars().count() > 400 {
        return Err(AppError::BadRequest(
            "question must be between 1 and 400 characters".into(),
        ));
    }
    let summary = operator_summary(State(state.clone())).await?.0;
    let incidents = operator_incidents(State(state)).await?.0;
    let active = summary
        .get("activeIncidents")
        .and_then(Value::as_i64)
        .unwrap_or(0);
    let answer = if question.to_lowercase().contains("broke")
        || question.to_lowercase().contains("incident")
    {
        if active == 0 {
            "No unresolved incidents are stored for the supported journeys.".to_string()
        } else {
            format!("{} unresolved incident(s) are stored. Open the incident queue to inspect their evidence.", active)
        }
    } else if question.to_lowercase().contains("healthy") {
        format!(
            "The current stored journey state is {}.",
            summary
                .get("journeyStatus")
                .and_then(Value::as_str)
                .unwrap_or("unknown")
        )
    } else if question.to_lowercase().contains("fix") || question.to_lowercase().contains("repair")
    {
        format!(
            "{} repair item(s) are stored in the current operator state.",
            summary
                .get("pendingRepairs")
                .and_then(Value::as_i64)
                .unwrap_or(0)
        )
    } else {
        format!("I can answer from stored STILL state. Current journey status: {}. Incident records returned: {}.", summary.get("journeyStatus").and_then(Value::as_str).unwrap_or("unknown"), incidents.get("incidents").and_then(Value::as_array).map(|items| items.len()).unwrap_or(0))
    };
    Ok(Json(
        json!({ "answer": answer, "grounded": true, "source": "still-core operator records" }),
    ))
}

async fn create_incident(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<IncidentRequest>,
) -> Result<Json<Value>, AppError> {
    require_internal_secret(&headers)?;
    if payload.journey_id.trim().is_empty()
        || payload.failure_class.trim().is_empty()
        || payload.summary.trim().is_empty()
    {
        return Err(AppError::BadRequest(
            "journey_id, failure_class and summary are required".into(),
        ));
    }
    let id = new_id();
    let created_at = Utc::now().to_rfc3339();
    let severity = payload.severity.unwrap_or_else(|| "medium".into());
    sqlx::query("INSERT INTO incidents (id, journey_id, release_sha, failure_class, summary, severity, status, evidence_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, 'detected', ?, ?)")
        .bind(&id).bind(&payload.journey_id).bind(payload.release_sha).bind(&payload.failure_class).bind(&payload.summary).bind(&severity).bind(payload.evidence_uri).bind(&created_at).execute(&state.pool).await?;
    append_timeline(&state.pool, "detect", "detected", &payload.summary).await?;
    Ok(Json(
        json!({ "id": id, "status": "detected", "created_at": created_at, "syntheticData": true }),
    ))
}

async fn run_monitor(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<MonitorRequest>,
) -> Result<Json<Value>, AppError> {
    require_internal_secret(&headers)?;
    let source = payload
        .source
        .clone()
        .unwrap_or_else(|| "scheduled-monitor".into());
    let services = service_health(&state.pool).await?;
    let healthy = services
        .iter()
        .all(|item| item.get("status").and_then(Value::as_str) == Some("healthy"));
    let status = if healthy { "healthy" } else { "degraded" };
    let summary = if healthy {
        "Scheduled probe completed: all seeded services have an available slot."
    } else {
        "Scheduled probe completed: one or more services need attention."
    };
    append_timeline(&state.pool, "monitor", status, summary).await?;
    if !healthy {
        sqlx::query("INSERT INTO incidents (id, journey_id, release_sha, failure_class, summary, severity, status, evidence_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, 'detected', ?, ?)")
            .bind(new_id()).bind("appointment-booking").bind(payload.release_sha).bind("availability").bind(summary).bind("high").bind(&source).bind(Utc::now().to_rfc3339()).execute(&state.pool).await?;
    }
    Ok(Json(
        json!({ "status": status, "source": source, "checked_at": Utc::now().to_rfc3339(), "services": services, "syntheticData": true }),
    ))
}

async fn evaluate_evidence(
    State(_state): State<AppState>,
    Json(payload): Json<EvidenceRequest>,
) -> Result<Json<Value>, AppError> {
    let expected_sha = env::var("STILL_SOURCE_SHA").unwrap_or_else(|_| "local".into());
    let result = evaluate(&payload.evidence, &expected_sha);
    Ok(Json(
        json!({ "verdict": result.verdict, "reasons": result.reasons, "source_sha": expected_sha }),
    ))
}

async fn service_health(pool: &SqlitePool) -> Result<Vec<Value>, AppError> {
    let services = sqlx::query_as::<_, ServiceRow>("SELECT id, name, description, duration_minutes, active FROM services WHERE active = 1 ORDER BY name").fetch_all(pool).await?;
    let mut result = Vec::new();
    for service in services {
        let remaining = sqlx::query("SELECT COALESCE(SUM(remaining_capacity), 0) AS remaining FROM slots WHERE service_id = ?").bind(&service.id).fetch_one(pool).await?.get::<i64, _>("remaining");
        result.push(json!({ "id": service.id, "name": service.name, "status": if remaining > 0 { "healthy" } else { "degraded" }, "remaining_slots": remaining, "last_checked": Utc::now().to_rfc3339() }));
    }
    Ok(result)
}

async fn append_timeline(
    pool: &SqlitePool,
    event: &str,
    status: &str,
    summary: &str,
) -> Result<(), AppError> {
    sqlx::query("INSERT INTO timeline_events (id, event, status, summary, occurred_at) VALUES (?, ?, ?, ?, ?)")
        .bind(new_id()).bind(event).bind(status).bind(summary).bind(Utc::now().to_rfc3339()).execute(pool).await?;
    Ok(())
}

fn require_internal_secret(headers: &HeaderMap) -> Result<(), AppError> {
    let expected = env::var("STILL_SCHEDULER_SECRET").unwrap_or_else(|_| "local-dev-only".into());
    if header_value(headers, "x-still-scheduler-secret").as_deref() != Some(expected.as_str()) {
        return Err(AppError::Unauthorized(
            "The internal scheduler secret is required.".into(),
        ));
    }
    Ok(())
}

fn header_value(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(str::to_owned)
}

fn service_json(row: ServiceRow) -> Value {
    json!({ "id": row.id, "name": row.name, "description": row.description, "duration_minutes": row.duration_minutes, "active": row.active == 1 })
}

fn slot_json(row: SlotRow) -> Value {
    json!({ "id": row.id, "service_id": row.service_id, "starts_at": row.starts_at, "ends_at": row.ends_at, "available": row.remaining_capacity > 0, "remaining_capacity": row.remaining_capacity })
}

fn booking_json(row: BookingRow, idempotent_replay: bool, include_capability: bool) -> Value {
    let mut payload = json!({ "id": row.id, "service_id": row.service_id, "slot_id": row.slot_id, "status": row.status, "confirmation_reference": row.confirmation_reference, "service_name": row.service_id, "starts_at": null, "attendee_name": row.attendee_name, "attendee_email": row.attendee_email, "created_at": row.created_at, "idempotent_replay": idempotent_replay });
    if include_capability {
        payload["capability"] = Value::String(row.confirmation_code);
    }
    payload
}

fn incident_json(row: IncidentRow) -> Value {
    json!({ "id": row.id, "journey_id": row.journey_id, "release_sha": row.release_sha, "failure_class": row.failure_class, "title": row.failure_class, "summary": row.summary, "severity": row.severity, "status": row.status, "evidence_uri": row.evidence_uri, "created_at": row.created_at, "syntheticData": true })
}

fn timeline_json(row: TimelineRow) -> Value {
    json!({ "id": row.id, "event": row.event, "title": row.event, "status": row.status, "summary": row.summary, "occurred_at": row.occurred_at })
}

fn policy_json(row: PolicyRow) -> Value {
    json!({ "id": row.id, "name": row.name, "status": row.status, "description": row.description })
}

fn new_id() -> String {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();
    let counter = ID_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("still-{timestamp:x}-{counter:x}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderValue;

    async fn test_state() -> AppState {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory sqlite pool");
        initialize_database(&pool).await.expect("init schema");
        AppState {
            pool,
            version: "test".into(),
            started_at: Utc::now().to_rfc3339(),
        }
    }

    #[tokio::test]
    async fn get_booking_denies_missing_or_wrong_capability_and_allows_valid_capability() {
        let state = test_state().await;
        let mut headers = HeaderMap::new();
        headers.insert(
            "idempotency-key",
            HeaderValue::from_static("rust-cap-test-key-1"),
        );
        let created = create_booking(
            State(state.clone()),
            headers,
            Json(BookingRequest {
                service_id: "advice-session".into(),
                slot_id: "advice-1".into(),
                name: "Alex Morgan".into(),
                email: "alex@example.edu".into(),
            }),
        )
        .await
        .expect("create booking succeeds")
        .0;

        let booking_id = created["id"].as_str().expect("id").to_owned();
        let capability = created["capability"]
            .as_str()
            .expect("capability")
            .to_owned();

        let missing = get_booking(
            State(state.clone()),
            Path(booking_id.clone()),
            HeaderMap::new(),
        )
        .await;
        assert!(matches!(missing, Err(AppError::Unauthorized(_))));

        let mut wrong_headers = HeaderMap::new();
        wrong_headers.insert(
            "x-booking-capability",
            HeaderValue::from_static("wrong-capability"),
        );
        let wrong = get_booking(
            State(state.clone()),
            Path(booking_id.clone()),
            wrong_headers.clone(),
        )
        .await;
        assert!(matches!(wrong, Err(AppError::Unauthorized(_))));

        let unknown = get_booking(
            State(state.clone()),
            Path("still-nonexistent-id".into()),
            wrong_headers,
        )
        .await;
        assert!(matches!(unknown, Err(AppError::Unauthorized(_))));

        let mut valid_headers = HeaderMap::new();
        valid_headers.insert(
            "x-booking-capability",
            HeaderValue::from_str(&capability).expect("valid header"),
        );
        let readback = get_booking(State(state), Path(booking_id.clone()), valid_headers)
            .await
            .expect("authorized readback succeeds")
            .0;
        assert_eq!(readback["id"].as_str(), Some(booking_id.as_str()));
        assert!(readback.get("capability").is_none());
    }

    #[tokio::test]
    async fn create_booking_enforces_idempotency_replay_and_conflict() {
        let state = test_state().await;
        let mut headers = HeaderMap::new();
        headers.insert(
            "idempotency-key",
            HeaderValue::from_static("rust-idem-key-1"),
        );
        let first = create_booking(
            State(state.clone()),
            headers.clone(),
            Json(BookingRequest {
                service_id: "study-planning".into(),
                slot_id: "study-1".into(),
                name: "Riley Chen".into(),
                email: "riley@example.edu".into(),
            }),
        )
        .await
        .expect("first create succeeds")
        .0;
        assert_eq!(first["idempotent_replay"], json!(false));

        let replay = create_booking(
            State(state.clone()),
            headers.clone(),
            Json(BookingRequest {
                service_id: "study-planning".into(),
                slot_id: "study-1".into(),
                name: "Riley Chen".into(),
                email: "riley@example.edu".into(),
            }),
        )
        .await
        .expect("replay succeeds")
        .0;
        assert_eq!(replay["id"], first["id"]);
        assert_eq!(replay["idempotent_replay"], json!(true));

        let conflict = create_booking(
            State(state),
            headers,
            Json(BookingRequest {
                service_id: "study-planning".into(),
                slot_id: "study-2".into(),
                name: "Riley Chen".into(),
                email: "riley@example.edu".into(),
            }),
        )
        .await;
        assert!(matches!(conflict, Err(AppError::Conflict(_))));
    }
}
