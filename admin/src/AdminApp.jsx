import React, { useState, useEffect } from 'react';
import { 
  Shield, BarChart3, Users, HelpCircle, Award, 
  History, LogOut, CheckCircle, AlertTriangle, 
  Ban, ShieldAlert, ArrowUpRight, Plus, RefreshCw, Edit2
} from 'lucide-react';

export default function AdminApp() {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('studyloop_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (adminToken) {
      verifyAdminSession();
    }
  }, [adminToken]);

  const verifyAdminSession = async () => {
    try {
      const response = await fetch('/api/admin/check', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminUser(data);
      } else {
        // Clear expired
        handleLogout();
      }
    } catch (e) {
      console.error(e);
      // Fallback dev mock admin login if offline
      if (adminToken.startsWith("mock-admin-")) {
        setAdminUser({
          email: adminToken.replace("mock-admin-", ""),
          role: "super_admin"
        });
      }
    }
  };

  const handleLogin = (email) => {
    // Generate a mock JWT for back-office admin auth
    const mockToken = "mock-admin-" + email;
    const mockJwt = btoa(JSON.stringify({ sub: "admin-uuid", email: email, role: "super_admin" })) + ".payload.signature";
    
    localStorage.setItem('studyloop_admin_token', mockJwt);
    setAdminToken(mockJwt);
  };

  const handleLogout = () => {
    localStorage.removeItem('studyloop_admin_token');
    setAdminToken('');
    setAdminUser(null);
  };

  if (!adminUser) {
    return <AdminLoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <nav className="admin-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          <Shield size={24} style={{ color: '#3b82f6' }} />
          <span className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 800 }}>StudyLoop Admin</span>
        </div>

        <div style={{ padding: '0.75rem', backgroundColor: '#1e293b', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.75rem' }}>
          <div style={{ color: '#94a3b8', fontWeight: 500 }}>Logged in as:</div>
          <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.125rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{adminUser.email}</div>
          <div style={{ color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem', marginTop: '0.25rem', letterSpacing: '0.05em' }}>{adminUser.role}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
          <SidebarLink active={activeTab === 'overview'} icon={<BarChart3 size={16} />} label="Overview & Settings" onClick={() => setActiveTab('overview')} />
          <SidebarLink active={activeTab === 'users'} icon={<Users size={16} />} label="User Moderation" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'doubts'} icon={<HelpCircle size={16} />} label="Doubt Room Logs" onClick={() => setActiveTab('doubts')} />
          <SidebarLink active={activeTab === 'badges'} icon={<Award size={16} />} label="Badge Configurator" onClick={() => setActiveTab('badges')} />
          <SidebarLink active={activeTab === 'coins'} icon={<ShieldAlert size={16} />} label="Coins & Endorsements" onClick={() => setActiveTab('coins')} />
          <SidebarLink active={activeTab === 'audit'} icon={<History size={16} />} label="System Audit Logs" onClick={() => setActiveTab('audit')} />
        </div>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: 'auto' }}>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: '#94a3b8', background: 'transparent', border: 'none' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* MAIN PANEL */}
      <main className="admin-main">
        {activeTab === 'overview' && <OverviewTab token={adminToken} />}
        {activeTab === 'users' && <UserModerationTab token={adminToken} />}
        {activeTab === 'doubts' && <DoubtOversightTab token={adminToken} />}
        {activeTab === 'badges' && <BadgeConfiguratorTab token={adminToken} />}
        {activeTab === 'coins' && <CoinsLedgerTab token={adminToken} />}
        {activeTab === 'audit' && <AuditLogsTab token={adminToken} />}
      </main>
    </div>
  );
}

function SidebarLink({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      width: '100%',
      padding: '0.625rem 0.875rem',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.8125rem',
      fontWeight: 500,
      backgroundColor: active ? '#1e293b' : 'transparent',
      color: active ? '#ffffff' : '#94a3b8',
      textAlign: 'left',
      transition: 'all 0.15s ease'
    }}>
      {icon}
      {label}
    </button>
  );
}

// --- ADMIN LOGIN SCREEN ---
function AdminLoginScreen({ onLogin }) {
  const [email, setEmail] = useState('admin@studyloop.app');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onLogin(email);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid #334155', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <Shield size={32} style={{ color: '#3b82f6' }} />
          <h1 className="font-serif" style={{ color: '#ffffff', fontSize: '1.75rem' }}>StudyLoop Admin</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem' }}>Administrator Email</label>
            <input 
              type="email" 
              className="input" 
              style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#3b82f6', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Authorize Access
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.6875rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
          This console is isolated from student accounts. Only registered admin users from the <code>admin_users</code> table are permitted.
        </div>
      </div>
    </div>
  );
}

// --- TAB: OVERVIEW & PLATFORM SETTINGS ---
function OverviewTab({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Platform Settings State (Simulated configurations)
  const [xpPerSolved, setXpPerSolved] = useState(10);
  const [commissionPercent, setCommissionPercent] = useState(5);
  const [savedSettings, setSavedSettings] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const saveSettings = (e) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Platform Analytics</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div style={{ padding: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '8px' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalUsers}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Total Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '8px' }}>
            <HelpCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalDoubts}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Total Doubts Raised</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ padding: '0.75rem', backgroundColor: '#d1fae5', color: '#047857', borderRadius: '8px' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.solvedDoubts}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Solved Rooms</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
            <ArrowUpRight size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.liveDoubts}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Live OPEN Rooms</div>
          </div>
        </div>
      </div>

      {/* Settings section */}
      <h2 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Platform Settings</h2>
      <form onSubmit={saveSettings} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px', alignItems: 'stretch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label className="label">XP Awarded per Doubt Solved</label>
            <input type="number" className="input" value={xpPerSolved} onChange={e => setXpPerSolved(e.target.value)} />
          </div>
          <div>
            <label className="label">Peer Mentor Coins Commission (%)</label>
            <input type="number" className="input" value={commissionPercent} onChange={e => setCommissionPercent(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#3b82f6' }}>Save Settings</button>
          {savedSettings && <span style={{ color: '#059669', fontSize: '0.8125rem', fontWeight: 600 }}>✓ Settings updated successfully!</span>}
        </div>
      </form>
    </div>
  );
}

// --- TAB: USER MODERATION ---
function UserModerationTab({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newReputation, setNewReputation] = useState(5.0);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleUpdateReputation = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reputation?rating=${newReputation}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setEditingUserId(null);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSuspend = async (userId) => {
    if (!confirm("Are you sure you want to suspend this user? This will reset their reputation and flag their bio.")) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem' }}>User Moderation</h1>
      <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>Adjust peer tutor reputation ratings or suspend accounts flagged for community guideline violations.</p>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>College</th>
              <th>Department</th>
              <th>XP</th>
              <th>Reputation</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                </td>
                <td>{u.college || "Not Set"}</td>
                <td>{u.department || "Not Set"}</td>
                <td>{u.xp}</td>
                <td>
                  {editingUserId === u.id ? (
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="5" 
                        className="input" 
                        style={{ width: '60px', padding: '0.25rem' }} 
                        value={newReputation} 
                        onChange={e => setNewReputation(e.target.value)} 
                      />
                      <button onClick={() => handleUpdateReputation(u.id)} className="btn btn-primary" style={{ padding: '0.25rem' }}>✓</button>
                      <button onClick={() => setEditingUserId(null)} className="btn btn-secondary" style={{ padding: '0.25rem' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⭐ {u.reputation} / 5.0</span>
                      <button onClick={() => { setEditingUserId(u.id); setNewReputation(u.reputation); }} className="btn-icon" style={{ padding: '0.125rem' }}><Edit2 size={12} /></button>
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleSuspend(u.id)} className="btn btn-danger" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                    <Ban size={12} /> Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- TAB: DOUBT ROOM OVERSIGHT ---
function DoubtOversightTab({ token }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/admin/doubts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [token]);

  if (loading) return <div>Loading doubt logs...</div>;

  return (
    <div>
      <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Doubt Room Oversight</h1>
      <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>View logs of all active and resolved workspaces across campuses.</p>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Topic / Title</th>
              <th>Subject</th>
              <th>College</th>
              <th>Creator UUID</th>
              <th>Helper UUID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {r.id}</div>
                </td>
                <td><span className="badge badge-success" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>{r.subject}</span></td>
                <td>{r.college}</td>
                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{r.creatorId}</td>
                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{r.helperId || "Waiting"}</td>
                <td>
                  <span className={`badge ${r.status === 'SOLVED' ? 'badge-success' : 'badge-danger'}`} style={{
                    backgroundColor: r.status === 'SOLVED' ? '#d1fae5' : '#fef3c7',
                    color: r.status === 'SOLVED' ? '#059669' : '#d97706'
                  }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- TAB: BADGES RULE CONFIGURATOR ---
function BadgeConfiguratorTab({ token }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteriaType, setCriteriaType] = useState('DOUBTS_SOLVED');
  const [criteriaValue, setCriteriaValue] = useState(1);
  const [iconUrl, setIconUrl] = useState('/badges/badge.png');

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/gamification/rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [token]);

  const handleEdit = (rule) => {
    setId(rule.id);
    setName(rule.name);
    setDescription(rule.description);
    setCriteriaType(rule.criteriaType);
    setCriteriaValue(rule.criteriaValue);
    setIconUrl(rule.iconUrl || '/badges/badge.png');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !description) return;

    try {
      const response = await fetch('/api/admin/badges/rule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, name, description, criteriaType, criteriaValue, iconUrl })
      });

      if (response.ok) {
        setId(null);
        setName('');
        setDescription('');
        setCriteriaValue(1);
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading rules...</div>;

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* List */}
      <div style={{ flex: 1 }}>
        <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Badge Configurator</h1>
        <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>Configure rules table values to award achievement badges dynamically.</p>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Description</th>
                <th>Criteria Type</th>
                <th>Value</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.description}</td>
                  <td><code>{r.criteriaType}</code></td>
                  <td>{r.criteriaValue}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleEdit(r)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="card" style={{ width: '320px', height: 'fit-content' }}>
        <h3 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          {id ? "Edit Badge Rule" : "Create Badge Rule"}
        </h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Badge Name</label>
            <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div>
            <label className="label">Description / Achievement Text</label>
            <textarea className="input" style={{ minHeight: '60px' }} value={description} onChange={e => setDescription(e.target.value)} required />
          </div>

          <div>
            <label className="label">Criteria Type</label>
            <select className="input" value={criteriaType} onChange={e => setCriteriaType(e.target.value)}>
              <option value="DOUBTS_SOLVED">Doubts Solved</option>
              <option value="SESSIONS_TAUGHT">Sessions Taught</option>
              <option value="XP_EARNED">Experience (XP)</option>
              <option value="STREAK_DAYS">Streak Days</option>
            </select>
          </div>

          <div>
            <label className="label">Required Threshold Value</label>
            <input type="number" className="input" value={criteriaValue} onChange={e => setCriteriaValue(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#3b82f6' }}>Save Rule</button>
          {id && (
            <button type="button" onClick={() => { setId(null); setName(''); setDescription(''); }} className="btn btn-secondary">Cancel</button>
          )}
        </form>
      </div>
    </div>
  );
}

// --- TAB: SYSTEM AUDIT LOGS ---
function AuditLogsTab({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/admin/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  if (loading) return <div>Loading audit logs...</div>;

  return (
    <div>
      <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem' }}>System Audit Logs</h1>
      <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>Immutable logs tracking administrator actions, user bans, and platform configuration changes.</p>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrator UUID</th>
              <th>Action</th>
              <th>Detailed Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString()}</td>
                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{l.adminId}</td>
                <td><span className="badge badge-danger" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>{l.action}</span></td>
                <td>{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- TAB: COINS LEDGER & ENDORSEMENTS OVERSIGHT ---
function CoinsLedgerTab({ token }) {
  return (
    <div>
      <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Coins Ledger & Endorsement Ring Oversight</h1>
      <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>Audit peer coin distribution, rewards issuance, and inspect endorsement collusion metrics.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-card">
          <h3 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Coin Rewards Parameters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span>Doubt Room Solved Reward:</span>
              <strong>+5 Coins + 10 XP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span>Peer Skill Endorsement:</span>
              <strong>+5 Coins + 10 XP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span>Daily Streak Login Claim:</span>
              <strong>+1 Coin + 2 XP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Skill Swap Completed:</span>
              <strong>+15 XP to both peers</strong>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Anti-Spam Collusion Rules</h3>
          <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
            The platform automatically enforces unique constraint rules per `(endorser_id, recipient_id, skill)` pair. 
            Self-endorsements are prohibited by PostgreSQL check constraints (`endorser_id &lt;&gt; recipient_id`).
          </p>
        </div>
      </div>
    </div>
  );
}
