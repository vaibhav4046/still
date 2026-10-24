import { CircleAlertIcon, RefreshIcon, WarningIcon } from "./icons";

export function LoadingPanel({ label = "Loading current state" }: { label?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="state-panel loading-panel" role="status">
      <span className="loading-orbit" />
      <div>
        <strong>{label}</strong>
        <p>Reading the authoritative STILL service.</p>
      </div>
    </div>
  );
}

export function EmptyPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="state-panel empty-panel" role="status">
      <CircleAlertIcon className="state-icon" />
      <div><strong>{title}</strong><p>{detail}</p></div>
    </div>
  );
}

export function ErrorPanel({ title = "Signal unavailable", detail, onRetry }: { title?: string; detail: string; onRetry?: () => void }) {
  return (
    <div className="state-panel error-panel" role="alert">
      <WarningIcon className="state-icon" />
      <div className="state-panel-copy"><strong>{title}</strong><p>{detail}</p></div>
      {onRetry ? <button className="icon-button" onClick={onRetry} type="button"><RefreshIcon size={17} /><span className="sr-only">Retry</span></button> : null}
    </div>
  );
}
