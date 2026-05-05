import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

function getInitials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function isOverdue(dueDate, status) {
  return dueDate && new Date(dueDate) < new Date() && status !== 'Done';
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [error, setError] = useState('');

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: '' });
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState('');

  // Member modal state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberSaving, setMemberSaving] = useState(false);

  const isAdmin = project?.admin?._id === currentUser._id;

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?projectId=${id}`),
      api.get('/users')
    ]).then(([pRes, tRes, uRes]) => {
      setProject(pRes.data);
      setTasks(tRes.data);
      setUsers(uRes.data);
      setLoading(false);
    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to load project');
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: '' });
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo?._id || ''
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  const saveTask = async e => {
    e.preventDefault();
    setTaskError(''); setTaskSaving(true);
    try {
      const payload = { ...taskForm, projectId: id };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;
      if (editTask) {
        await api.put(`/tasks/${editTask._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      setShowTaskModal(false);
      fetchAll();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setTaskSaving(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete task'); }
  };

  const updateStatus = async (taskId, status) => {
    try { await api.put(`/tasks/${taskId}`, { status }); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to update status'); }
  };

  const addMember = async e => {
    e.preventDefault();
    setMemberSaving(true);
    try {
      await api.post(`/projects/${id}/members`, { userId: memberUserId });
      setShowMemberModal(false);
      setMemberUserId('');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally { setMemberSaving(false); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to remove member'); }
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this entire project?')) return;
    try { await api.delete(`/projects/${id}`); navigate('/projects'); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete project'); }
  };

  const getBadgeClass = (status) => {
    if (status === 'To Do') return 'badge-todo';
    if (status === 'In Progress') return 'badge-inprogress';
    return 'badge-done';
  };

  const getPriBadge = (p) => {
    if (p === 'Low') return 'badge-low';
    if (p === 'Medium') return 'badge-medium';
    return 'badge-high';
  };

  // Non-member users for adding
  const memberIds = new Set([project?.admin?._id, ...(project?.members?.map(m => m._id) || [])]);
  const nonMembers = users.filter(u => !memberIds.has(u._id));

  if (loading) return (
    <div className="app-layout"><Sidebar />
      <main className="main-content"><div className="loading">Loading project…</div></main>
    </div>
  );

  if (error) return (
    <div className="app-layout"><Sidebar />
      <main className="main-content">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/projects')}>← Back to Projects</button>
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 8 }} onClick={() => navigate('/projects')}>← Projects</button>
            <h1 className="page-title">{project?.name}</h1>
            <p className="page-subtitle">{project?.description || 'No description'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <>
                <button className="btn btn-primary btn-sm" onClick={openCreateTask}>✚ Task</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>👤 Add Member</button>
                <button className="btn btn-danger btn-sm" onClick={deleteProject}>🗑 Delete</button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
            📋 Tasks ({tasks.length})
          </button>
          <button className={`tab-btn ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
            👥 Members ({(project?.members?.length || 0) + 1})
          </button>
        </div>

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>{isAdmin ? 'No tasks yet. Create the first one!' : 'No tasks assigned to you.'}</p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map(task => {
                const overdue = isOverdue(task.dueDate, task.status);
                const canEdit = isAdmin || task.assignedTo?._id === currentUser._id;
                return (
                  <div key={task._id} className="task-item">
                    <div className="task-item-left">
                      <div className="task-item-title">
                        {overdue && <span className="overdue-dot" title="Overdue" />}
                        {task.title}
                      </div>
                      <div className="task-item-meta">
                        <span className={`badge ${getBadgeClass(task.status)}`}>{task.status}</span>
                        <span className={`badge ${getPriBadge(task.priority)}`}>{task.priority}</span>
                        {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
                        {task.dueDate && (
                          <span style={{ color: overdue ? 'var(--danger)' : 'inherit' }}>
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{task.description}</p>
                      )}
                    </div>
                    <div className="task-item-actions">
                      {canEdit && (
                        <select
                          className="status-select"
                          value={task.status}
                          onChange={e => updateStatus(task._id, e.target.value)}
                        >
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      )}
                      {isAdmin && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditTask(task)}>✏</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task._id)}>🗑</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Members Tab */}
        {tab === 'members' && (
          <div className="member-list">
            {/* Admin row */}
            <div className="member-row">
              <div className="avatar">{getInitials(project?.admin?.name)}</div>
              <div style={{ flex: 1 }}>
                <div className="member-name">{project?.admin?.name}</div>
                <div className="member-email">{project?.admin?.email}</div>
              </div>
              <span className="badge badge-admin">👑 Admin</span>
            </div>
            {/* Members */}
            {project?.members?.map(m => (
              <div key={m._id} className="member-row">
                <div className="avatar">{getInitials(m.name)}</div>
                <div style={{ flex: 1 }}>
                  <div className="member-name">{m.name}</div>
                  <div className="member-email">{m.email}</div>
                </div>
                <span className="badge badge-member">Member</span>
                {isAdmin && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeMember(m._id)}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{editTask ? 'Edit Task' : 'Create Task'}</h2>
                <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
              </div>
              {taskError && <div className="alert alert-error">{taskError}</div>}
              <form onSubmit={saveTask}>
                <div className="form-group">
                  <label>Title</label>
                  <input className="form-control" placeholder="Task title" value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" placeholder="Optional description"
                    value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                </div>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-control" value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={taskForm.status}
                      onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" className="form-control" value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Assign To</label>
                  <select className="form-control" value={taskForm.assignedTo}
                    onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                    <option value="">— Unassigned —</option>
                    {[project?.admin, ...(project?.members || [])].filter(Boolean).map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={taskSaving}>
                    {taskSaving ? 'Saving…' : editTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showMemberModal && (
          <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Add Member</h2>
                <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
              </div>
              <form onSubmit={addMember}>
                <div className="form-group">
                  <label>Select User</label>
                  <select className="form-control" value={memberUserId}
                    onChange={e => setMemberUserId(e.target.value)} required>
                    <option value="">— Select a user —</option>
                    {nonMembers.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                {nonMembers.length === 0 && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    All registered users are already members.
                  </p>
                )}
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={memberSaving || !memberUserId}>
                    {memberSaving ? 'Adding…' : 'Add Member'}
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
