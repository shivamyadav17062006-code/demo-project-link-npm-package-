import Icon from "./Icon.jsx";

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.kind}`}>
          <span className="toast-icon">
            <Icon name={toast.kind === "error" ? "alert" : "check"} size={16} />
          </span>
          <span className="toast-message">{toast.message}</span>
          <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)} title="Dismiss">
            <Icon name="x" size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
