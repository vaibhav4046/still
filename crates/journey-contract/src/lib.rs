use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Verdict {
    Pass,
    Fail,
    InsufficientEvidence,
    DeployBlocked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct JourneyEvidence {
    pub contract_version: String,
    pub journey_id: String,
    pub source_sha: String,
    pub environment: String,
    pub interaction_mode: String,
    pub booking_id: Option<String>,
    pub confirmation_reference: Option<String>,
    pub test_artifact_uri: Option<String>,
    pub api_readback: bool,
    pub verdict: Verdict,
    pub reason: String,
    pub verified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Evaluation {
    pub verdict: Verdict,
    pub reasons: Vec<String>,
}

pub fn evaluate(evidence: &JourneyEvidence, expected_source_sha: &str) -> Evaluation {
    let mut reasons = Vec::new();
    if evidence.contract_version != "1" {
        reasons.push("unsupported contract version".into());
    }
    if evidence.journey_id.trim().is_empty() {
        reasons.push("journey_id is required".into());
    }
    if evidence.source_sha != expected_source_sha {
        reasons.push("source SHA does not match the release under evaluation".into());
    }
    if evidence.environment.trim().is_empty() {
        reasons.push("environment is required".into());
    }
    if !evidence.api_readback {
        reasons.push("authoritative API readback is missing".into());
    }
    if evidence.booking_id.is_none() || evidence.confirmation_reference.is_none() {
        reasons.push("persisted booking identifiers are missing".into());
    }
    if evidence.test_artifact_uri.is_none() {
        reasons.push("test artifact provenance is missing".into());
    }
    if reasons.is_empty() {
        Evaluation {
            verdict: Verdict::Pass,
            reasons: vec!["all critical evidence is present".into()],
        }
    } else {
        Evaluation {
            verdict: Verdict::InsufficientEvidence,
            reasons,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn evidence() -> JourneyEvidence {
        JourneyEvidence {
            contract_version: "1".into(),
            journey_id: "book-advice-session".into(),
            source_sha: "abc".into(),
            environment: "test".into(),
            interaction_mode: "keyboard".into(),
            booking_id: Some("booking".into()),
            confirmation_reference: Some("STILL-1234".into()),
            test_artifact_uri: Some("artifact://playwright".into()),
            api_readback: true,
            verdict: Verdict::Pass,
            reason: "ok".into(),
            verified_at: Some("2026-10-23T00:00:00Z".into()),
        }
    }

    #[test]
    fn passes_complete_evidence() {
        assert_eq!(evaluate(&evidence(), "abc").verdict, Verdict::Pass);
    }

    #[test]
    fn fails_closed_on_sha_mismatch() {
        assert_eq!(
            evaluate(&evidence(), "different").verdict,
            Verdict::InsufficientEvidence
        );
    }
}
