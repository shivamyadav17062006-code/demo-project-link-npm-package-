import Icon from "./Icon.jsx";
import { NAV_ITEMS } from "./Sidebar.jsx";

export default function TopBar({ page, project, online, refreshing, onRefresh, onNavigate }) {
  const meta = NAV_ITEMS.find((item) => item.id === page) ?? NAV_ITEMS[0];

  return (
    <div className="top-shell">
      <div className="top-strip">
        <span>LOCAL WORKSPACE</span>
        <span className="strip-right">LOCAL MODE <b>●</b></span>
      </div>

      <header className="topbar">
        <div className="topbar-title">
          <div className="breadcrumb">
            Workspace <span>/</span> {meta.title}
          </div>
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>

        <div className="topbar-actions">
          {project && (
            <span className="version-chip" title={project.path}>
              {project.name} <b>v{project.version}</b>
            </span>
          )}

          <span className={`connection ${online ? "online" : "offline"}`}>
            <span className="dot" />
            {online ? "Local project connected" : "API offline"}
          </span>

          <button type="button" className="icon-btn" onClick={onRefresh} title="Refresh data">
            <Icon name="refresh" size={17} className={refreshing ? "spin" : ""} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onNavigate("settings")}
            title="Settings"
          >
            <Icon name="sliders" size={17} />
          </button>
        </div>
      </header>
    </div>
  );
}
