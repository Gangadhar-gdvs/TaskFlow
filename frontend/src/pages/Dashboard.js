import React, { useEffect, useState } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const maxCount = stats?.perUser?.length ? Math.max(...stats.perUser.map(u => u.count)) : 1;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Your workspace overview</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            📁 View Projects
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading stats…</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card purple">
                <div className="stat-label">Total Tasks</div>
                <div className="stat-value purple">{stats?.total ?? 0}</div>
              </div>
              <div className="stat-card cyan">
                <div className="stat-label">To Do</div>
                <div className="stat-value cyan">{stats?.byStatus?.['To Do'] ?? 0}</div>
              </div>
              <div className="stat-card warn">
                <div className="stat-label">In Progress</div>
                <div className="stat-value warn">{stats?.byStatus?.['In Progress'] ?? 0}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-label">Done</div>
                <div className="stat-value green">{stats?.byStatus?.['Done'] ?? 0}</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-label">Overdue</div>
                <div className="stat-value danger">{stats?.overdue ?? 0}</div>
              </div>
            </div>

            <div className="grid-2">
              {/* Status Breakdown */}
              <div className="card">
                <div className="section-title">Status Breakdown</div>
                {['To Do', 'In Progress', 'Done'].map(s => {
                  const count = stats?.byStatus?.[s] ?? 0;
                  const total = stats?.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={s} className="user-bar-row" style={{ marginBottom: 10 }}>
                      <span className="bar-label">{s}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tasks Per User */}
              <div className="card">
                <div className="section-title">Tasks Per User</div>
                {stats?.perUser?.length ? (
                  <div className="per-user-bar">
                    {stats.perUser.map((u, i) => (
                      <div key={i} className="user-bar-row">
                        <span className="bar-label">{u.name}</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${Math.round((u.count / maxCount) * 100)}%` }} />
                        </div>
                        <span className="bar-count">{u.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <p>No task assignments yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
