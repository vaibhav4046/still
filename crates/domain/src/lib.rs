use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BookingInput {
    pub service_id: String,
    pub slot_id: String,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServiceRecord {
    pub id: String,
    pub name: String,
    pub description: String,
    pub duration_minutes: i64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SlotRecord {
    pub id: String,
    pub service_id: String,
    pub starts_at: String,
    pub ends_at: String,
    pub remaining_capacity: i64,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ValidationError {
    #[error("service_id is required")]
    MissingService,
    #[error("slot_id is required")]
    MissingSlot,
    #[error("name must be between 2 and 120 characters")]
    InvalidName,
    #[error("email must be a valid synthetic email address")]
    InvalidEmail,
}

pub fn validate_booking(input: &BookingInput) -> Result<(), ValidationError> {
    if input.service_id.trim().is_empty() {
        return Err(ValidationError::MissingService);
    }
    if input.slot_id.trim().is_empty() {
        return Err(ValidationError::MissingSlot);
    }
    let name_len = input.name.trim().chars().count();
    if !(2..=120).contains(&name_len) {
        return Err(ValidationError::InvalidName);
    }
    let email = input.email.trim();
    let mut parts = email.split('@');
    let local = parts.next().unwrap_or_default();
    let domain = parts.next().unwrap_or_default();
    if parts.next().is_some() || local.is_empty() || domain.is_empty() || !domain.contains('.') {
        return Err(ValidationError::InvalidEmail);
    }
    Ok(())
}

pub fn fingerprint(input: &BookingInput) -> String {
    format!(
        "{}|{}|{}|{}",
        input.service_id.trim(),
        input.slot_id.trim(),
        input.name.trim(),
        input.email.trim().to_lowercase()
    )
}

pub fn confirmation_reference(id: &str) -> String {
    let compact = id.replace('-', "").to_uppercase();
    let short = compact
        .chars()
        .rev()
        .take(12)
        .collect::<String>()
        .chars()
        .rev()
        .collect::<String>();
    format!("STILL-{short}")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid() -> BookingInput {
        BookingInput {
            service_id: "advice".into(),
            slot_id: "slot-1".into(),
            name: "Alex Morgan".into(),
            email: "alex@example.org".into(),
        }
    }

    #[test]
    fn validates_synthetic_booking() {
        assert!(validate_booking(&valid()).is_ok());
    }

    #[test]
    fn rejects_invalid_email() {
        let mut input = valid();
        input.email = "not-an-email".into();
        assert_eq!(validate_booking(&input), Err(ValidationError::InvalidEmail));
    }

    #[test]
    fn fingerprint_is_stable_and_case_insensitive_for_email() {
        let mut first = valid();
        let mut second = valid();
        second.email = "ALEX@EXAMPLE.ORG".into();
        assert_eq!(fingerprint(&first), fingerprint(&second));
        first.name = "Different".into();
        assert_ne!(fingerprint(&first), fingerprint(&second));
    }

    #[test]
    fn confirmation_reference_changes_with_id_suffix() {
        assert_ne!(
            confirmation_reference("still-18e104e020fd842b-1"),
            confirmation_reference("still-18e104e020fd842b-2")
        );
    }
}
