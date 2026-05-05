import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>⚡ TaskFlow</h2>
        <p>Team Task Manager</p>
      </div>

      <nav>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📊</span> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📁</span> Projects
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>🚪 Sign out</button>
      </div>
    </aside>
  );
}
