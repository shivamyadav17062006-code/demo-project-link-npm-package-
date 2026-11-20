import Icon from "./Icon.jsx";

export const NAV_GROUPS = [
  {
    group: "Workspace",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: "grid",
        title: "Project overview",
        subtitle: "Monitor and manage npm packages in your Node.js project."
      },
      {
        id: "packages",
        label: "Packages",
        icon: "box",
        title: "Packages",
        subtitle: "Install, inspect and remove dependencies."
      },
      {
        id: "playground",
        label: "Command playground",
        icon: "terminal",
        title: "Command playground",
        subtitle: "Run fixed, read-only npm commands."
      }
    ]
  },
  {
    group: "Tools",
    items: [
      {
        id: "security",
        label: "Security audit",
        icon: "shield",
        title: "Security audit",
        subtitle: "Known vulnerabilities in the installed dependency tree."
      },
      {
        id: "outdated",
        label: "Outdated packages",
        icon: "refresh",
        title: "Outdated packages",
        subtitle: "Newer versions published to the registry."
      },
      {
        id: "doctor",
        label: "Project doctor",
        icon: "heart",
        title: "Project doctor",
        subtitle: "Check Node, npm and project setup."
      }
    ]
  },
  {
    group: "Learn",
    items: [
      {
        id: "concepts",
        label: "NPM concepts",
        icon: "book",
        title: "NPM concepts",
        subtitle: "Beginner explanations of core npm ideas."
      },
      {
        id: "quiz",
        label: "Interactive quiz",
        icon: "zap",
        title: "Interactive quiz",
        subtitle: "Test what you know about npm."
      },
      {
        id: "activity",
        label: "Activity logs",
        icon: "pulse",
        title: "Activity logs",
        subtitle: "Every operation the dashboard performed."
      }
    ]
  }
];

export const NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((section) => section.items),
  {
    id: "settings",
    label: "Settings",
    icon: "sliders",
    title: "Settings",
    subtitle: "Project location and dashboard safety."
  }
];

export default function Sidebar({
  page,
  onNavigate,
  collapsed,
  onToggle,
  project,
  online
}) {
  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="brand">
        <span className="brand-mark">
          <Icon name="cube" size={21} />
        </span>
        <div className="brand-text">
          <strong>npm-pal</strong>
          <span>Developer workspace</span>
        </div>
      </div>

      <button
        type="button"
        className="project-switch"
        onClick={() => onNavigate("settings")}
        title={project?.path ?? "Choose a project folder"}
      >
        <span className="project-dot" />
        <span className="project-switch-name">{project?.name ?? "Loading project"}</span>
        <span className="chevron">⌄</span>
      </button>

      <nav className="nav" aria-label="Main">
        {NAV_GROUPS.map((section) => (
          <div className="nav-group" key={section.group}>
            <div className="side-label">{section.group}</div>
            {section.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
                title={item.label}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="connection">
          <span className={`live-dot ${online ? "on" : "off"}`} />
          {online ? "Local project connected" : "Backend offline"}
        </div>
        <button type="button" className="user-row" onClick={() => onNavigate("settings")}>
          <span className="avatar">NP</span>
          <span className="user-meta">
            <b>npm-pal</b>
            <small>Local dashboard</small>
          </span>
          <Icon name="sliders" size={15} className="more" />
        </button>
      </div>

      <button
        type="button"
        className="collapse-btn"
        onClick={onToggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={15} />
      </button>
    </aside>
  );
}
