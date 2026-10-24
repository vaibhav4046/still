import { CheckIcon, CircleAlertIcon, CircleDotIcon, WarningIcon } from "./icons";

export type ContinuityStatus = "loading" | "healthy" | "degraded" | "offline" | "empty";

export function ContinuitySignal({ status, detail }: { status: ContinuityStatus; detail?: string }) {
  const content = {
    loading: { label: "Reading continuity", title: "Signal pending", Icon: CircleDotIcon },
    healthy: { label: "Continuity signal", title: "Journey intact", Icon: CheckIcon },
    degraded: { label: "Continuity signal", title: "Needs attention", Icon: CircleAlertIcon },
    offline: { label: "Continuity signal", title: "Service unreachable", Icon: WarningIcon },
    empty: { label: "Continuity signal", title: "No stored signal", Icon: CircleAlertIcon },
  }[status];
  const Icon = content.Icon;

  return (
    <section aria-live="polite" className={`continuity-signal signal-${status}`}>
      <div className="signal-icon"><Icon size={21} /></div>
      <div className="signal-copy">
        <span className="eyebrow">{content.label}</span>
        <strong>{content.title}</strong>
        <p>{detail || "The console will show only state returned by the STILL API."}</p>
      </div>
      <span className="signal-meter" aria-hidden="true"><i /><i /><i /></span>
    </section>
  );
}
