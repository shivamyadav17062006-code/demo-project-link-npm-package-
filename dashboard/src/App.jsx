import { useCallback, useEffect, useState } from "react";

import { api } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import Toasts from "./components/Toasts.jsx";
import Overview from "./views/Overview.jsx";
import Packages from "./views/Packages.jsx";
import Security from "./views/Security.jsx";
import Outdated from "./views/Outdated.jsx";
import Concepts from "./views/Concepts.jsx";
import Quiz from "./views/Quiz.jsx";
import Playground from "./views/Playground.jsx";
import Activity from "./views/Activity.jsx";
import Doctor from "./views/Doctor.jsx";
import Settings from "./views/Settings.jsx";

export default function App() {
  const [page, setPage] = useState("overview");
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 960);
  const [project, setProject] = useState(null);
  const [online, setOnline] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((kind, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((list) => [...list.slice(-3), { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const navigate = useCallback((next) => {
    setPage(next);
    window.scrollTo(0, 0);
  }, []);

  const loadProject = useCallback(async () => {
    try {
      const data = await api.project();
      setProject(data);
      setOnline(true);
      return data;
    } catch {
      setOnline(false);
      return null;
    }
  }, []);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        await api.health();
        setOnline(true);
      } catch {
        setOnline(false);
      }
    }, 15_000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadProject();
    setRefreshKey((key) => key + 1);
    window.setTimeout(() => setRefreshing(false), 600);
  }, [loadProject]);

  const handleProjectChange = useCallback((data) => {
    setProject(data);
    setOnline(true);
    setRefreshKey((key) => key + 1);
  }, []);

  const viewProps = { refreshKey, project, notify };

  return (
    <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        page={page}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        project={project}
        online={online}
      />

      <div className="main">
        <TopBar
          page={page}
          project={project}
          online={online}
          refreshing={refreshing}
          onRefresh={refresh}
          onNavigate={navigate}
        />

        <main className="content">
          {!online && (
            <div className="offline-banner">
              <strong>Backend is offline.</strong>
              <span>
                Start it with <code>npm run dev</code> (or <code>npm start</code>) inside the dashboard
                folder, then refresh.
              </span>
            </div>
          )}

          {page === "overview" && (
            <Overview {...viewProps} onNavigate={navigate} />
          )}
          {page === "packages" && <Packages {...viewProps} />}
          {page === "playground" && <Playground {...viewProps} />}
          {page === "security" && <Security {...viewProps} />}
          {page === "outdated" && <Outdated {...viewProps} />}
          {page === "doctor" && <Doctor {...viewProps} />}
          {page === "concepts" && <Concepts {...viewProps} onNavigate={navigate} />}
          {page === "quiz" && <Quiz {...viewProps} />}
          {page === "activity" && <Activity {...viewProps} />}
          {page === "settings" && (
            <Settings {...viewProps} onProjectChange={handleProjectChange} />
          )}
        </main>
      </div>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
