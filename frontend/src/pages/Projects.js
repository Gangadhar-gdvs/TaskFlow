import React, { useEffect, useState } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(r => { setProjects(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const createProject = async e => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
          </div>
          <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            ✚ New Project
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <p>No projects yet. Create your first project!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => {
              const user = JSON.parse(sessionStorage.getItem('user') || '{}');
              const isAdmin = p.admin?._id === user._id;
              return (
                <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
                  <h3 className="project-card-title">{p.name}</h3>
                  <p className="project-card-desc">{p.description || 'No description'}</p>
                  <div className="project-card-footer">
                    <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-member'}`}>
                      {isAdmin ? '👑 Admin' : '👤 Member'}
                    </span>
                    <span className="members-count">
                      👥 {(p.members?.length || 0) + 1} member{(p.members?.length || 0) + 1 !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Project Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">New Project</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={createProject}>
                <div className="form-group">
                  <label>Project Name</label>
                  <input id="project-name-input" className="form-control" placeholder="e.g. Website Redesign"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <textarea className="form-control" placeholder="What is this project about?"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button id="project-create-confirm" type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Creating…' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
