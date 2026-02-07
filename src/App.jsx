import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import api from './services/api';
import {
  diagnoseStatus,
  getResolution,
  getSubordinates,
  getAllNestedSubordinates,
  getAlerts
} from './logic/engine';
import Login from './components/Login';

const AVATARS = ['👨‍💻', '👩‍💼', '🎨', '👨‍💼', '👩‍💻', '🚀', '✨', '🧠', '👑'];

function App() {
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [authError, setAuthError] = useState('');
  const [viewedManagerId, setViewedManagerId] = useState(null);
  const [history, setHistory] = useState([]);

  // UI States
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [selectedCaptureEmp, setSelectedCaptureEmp] = useState(null);
  const [selectedRadarEmp, setSelectedRadarEmp] = useState(null);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [captureData, setCaptureData] = useState({ mood: 5, alignment: 5, energy: 5, blockers: [] });
  const [activeRes, setActiveRes] = useState(null);
  const [resEmployeeId, setResEmployeeId] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', avatar: AVATARS[0], email: '', password: '123' });
  const [toasts, setToasts] = useState([]);
  const [isSelfPulseOpen, setIsSelfPulseOpen] = useState(false);
  const [selfPulseData, setSelfPulseData] = useState({ mood: 5, alignment: 5, energy: 5, blockers: [], comments: '' });
  const [currentMenu, setCurrentMenu] = useState('home'); // 'home' or 'profile'
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const addToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // Initialize view and Check Auth
  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/employees/me');
          setCurrentUser(res.data);
          setViewedManagerId(res.data.id);
          setHistory([res.data]);

          // Fetch all employees for context
          const empRes = await api.get('/employees');
          setEmployees(empRes.data);
        } catch (err) {
          console.error("Auth failed", err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (currentUser && viewedManagerId === null) {
      setViewedManagerId(currentUser.id);
      setHistory([currentUser]);
    }
  }, [currentUser, viewedManagerId]);

  // URL Deep Linking for Pulse
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('pulse_token');

    if (token) {
      try {
        const decoded = atob(token).split(':');
        const [email, empId] = decoded;
        const targetEmp = employees.find(e => e.email === email && e.id === parseInt(empId));

        if (targetEmp) {
          setCurrentUser(targetEmp);
          setViewedManagerId(targetEmp.id);
          setHistory([targetEmp]);
          setIsSelfPulseOpen(true);
          // Clear the URL parameter so it doesn't trigger again on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
          addToast(`🔗 Acceso por link: Hola ${targetEmp.name}, cuéntanos cómo vas.`);
        }
      } catch (e) {
        console.error("Invalid token", e);
      }
    }
  }, [employees]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hr_copilot_session', JSON.stringify(currentUser));

      // Simulation pulse logic disabled, only trigger via link
      /*
      const needsPulse = currentUser.cadenceDays && (!currentUser.lastSelfPulse ||
        (new Date() - new Date(currentUser.lastSelfPulse.date)) / (1000 * 60 * 60 * 24) >= currentUser.cadenceDays);

      if (needsPulse) {
        addToast(`📧 Email enviado a ${currentUser.email}: Recordatorio de pulso pendiente.`);
        setIsSelfPulseOpen(true);
      }
      */
    } else {
      localStorage.removeItem('hr_copilot_session');
    }
  }, [currentUser]);

  // Derived Data
  const companyEmployees = useMemo(() =>
    currentUser ? employees.filter(e => e.companyId === currentUser.companyId) : [],
    [employees, currentUser]
  );

  const currentViewEmployees = useMemo(() =>
    viewedManagerId ? companyEmployees.filter(e => e.managerId === viewedManagerId) : [],
    [companyEmployees, viewedManagerId]
  );

  const statsSubordinates = useMemo(() =>
    viewedManagerId ? getAllNestedSubordinates(companyEmployees, viewedManagerId) : [],
    [companyEmployees, viewedManagerId]
  );

  const companyAlerts = useMemo(() =>
    (currentUser && viewedManagerId) ? getAlerts(companyEmployees, viewedManagerId) : [],
    [companyEmployees, currentUser, viewedManagerId]
  );

  const resEmployee = useMemo(() =>
    resEmployeeId ? employees.find(e => e.id === resEmployeeId) : null,
    [employees, resEmployeeId]
  );

  const calculateMetrics = (subList) => {
    if (subList.length === 0) return { climate: 100, risk: 0, alignment: 100, energy: 100, status: 'ok', tooltips: {} };
    const total = subList.length;

    const okEmployees = subList.filter(e => e.status === 'ok');
    const attentionEmployees = subList.filter(e => e.status === 'attention');
    const riskEmployees = subList.filter(e => e.status === 'risk');

    const okCount = okEmployees.length;
    const attentionCount = attentionEmployees.length;
    const riskCount = riskEmployees.length;

    const climateScore = ((okCount * 100) + (attentionCount * 50)) / total;
    const riskScore = ((attentionCount * 30) + (riskCount * 100)) / total;
    const alignmentScore = ((okCount * 100) + (attentionCount * 70) + (riskCount * 30)) / total;
    const energyScore = ((okCount * 90) + (attentionCount * 60) + (riskCount * 20)) / total;

    let status = 'ok';
    if (riskCount > 0) status = 'risk';
    else if (attentionCount > 0) status = 'attention';

    const riskNames = riskEmployees.map(e => e.name.split(' ')[0]).join(', ');
    const attentionNames = attentionEmployees.map(e => e.name.split(' ')[0]).join(', ');

    const tooltips = {
      green: "Está todo perfecto. Nada de qué preocuparse ✨",
      yellow: attentionCount > 0
        ? `${attentionNames} requiere(n) atención para evitar problemas mayores ⚠️`
        : "Sin problemas de atención detectados.",
      red: riskCount > 0
        ? `${riskNames} está(n) en riesgo crítico o burnout. ¡Acción inmediata! 🚨`
        : "Sin riesgos críticos detectados."
    };

    return {
      climate: Math.round(climateScore),
      risk: Math.round(Math.min(riskScore, 100)),
      alignment: Math.round(alignmentScore),
      energy: Math.round(energyScore),
      status,
      tooltips
    };
  };

  const metrics = useMemo(() => calculateMetrics(statsSubordinates), [statsSubordinates]);

  // Auth Handlers
  const handleLogin = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      setCurrentUser(user);
      setViewedManagerId(user.id);
      setHistory([user]);

      // Load all employees
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);
      setAuthError('');
    } catch (err) {
      setAuthError(err.response?.data?.msg || 'Error al iniciar sesión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setViewedManagerId(null);
    setHistory([]);
  };

  const handleRegisterCompany = ({ companyName, adminName, email, password }) => {
    // Check if email exists
    if (employees.find(e => e.email === email)) {
      setAuthError('Ese correo ya está registrado');
      return;
    }

    const companyId = Date.now(); // Simple unique ID for the company
    const newAdmin = {
      id: Date.now() + 1,
      name: adminName,
      role: 'Admin @ ' + companyName,
      email,
      password,
      avatar: '👑',
      status: 'ok',
      managerId: null,
      companyId,
      isAdmin: true,
      statusHistory: ['ok'],
      checklists: {}
    };

    setEmployees(prev => [...prev, newAdmin]);
    setCurrentUser(newAdmin);
    setViewedManagerId(newAdmin.id);
    setHistory([newAdmin]);
    setAuthError('');
  };

  // Logic Handlers
  const handleCaptureSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/pulses/manager', {
        employeeId: selectedCaptureEmp.id,
        ...captureData
      });

      // Update local state to reflect change immediately (or re-fetch)
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);

      setIsCaptureOpen(false);
      addToast(`🚀 Evaluación de manager guardada para ${selectedCaptureEmp.name}`);
      setCaptureData({ mood: 5, alignment: 5, energy: 5, blockers: [] });
    } catch (err) {
      addToast(`❌ Error al guardar captura`);
    }
  };

  const handleSelfPulseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pulses/self', selfPulseData);

      // Refresh user and employees
      const meRes = await api.get('/employees/me');
      setCurrentUser(meRes.data);
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);

      setIsSelfPulseOpen(false);
      addToast(`✅ Tu pulso ha sido enviado. ¡Gracias por tu sinceridad!`);
      setSelfPulseData({ mood: 5, alignment: 5, energy: 5, blockers: [], comments: '' });
    } catch (err) {
      addToast(`❌ Error al enviar pulso`);
    }
  };

  const toggleChecklistItem = async (empId, resId, stepIndex) => {
    try {
      await api.post(`/employees/${empId}/checklist`, { resId, stepIndex });
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);
    } catch (err) {
      addToast(`❌ Error al actualizar checklist`);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', newEmployee);
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);
      setIsAddOpen(false);
      setNewEmployee({ name: '', role: '', avatar: AVATARS[0], email: '', password: '123' });
      addToast(`👤 Nuevo empleado añadido: ${newEmployee.name}`);
    } catch (err) {
      addToast(`❌ Error al añadir empleado`);
    }
  };



  if (!currentUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegisterCompany} error={authError} />;
  }

  // Personal Profile View Component
  const MyProfileView = () => (
    <section className="profile-dashboard">
      <div className="profile-hero glass-card">
        <div className="profile-user">
          <span className="profile-avatar">{currentUser.avatar}</span>
          <div className="profile-info">
            <h2>{currentUser.name}</h2>
            <p>{currentUser.role}</p>
          </div>
        </div>
        <div className={`profile-status-badge badge-${currentUser.status}`}>
          {currentUser.status.toUpperCase()}
        </div>
      </div>

      <div className="profile-grid">
        <div className="glass-card personal-stats">
          <h3>Mi Salud Laboral 📊</h3>
          <div className="trend-line large">
            {currentUser.statusHistory?.map((s, idx) => (
              <span key={idx} className={`trend-dot dot-${s} large`}></span>
            ))}
            <span className={`trend-dot dot-${currentUser.status} current large`}></span>
          </div>
          <p className="status-desc">
            {currentUser.status === 'ok' ? 'Estás en un gran momento. ¡Sigue así! ✨' :
              currentUser.status === 'attention' ? 'Hay algunos puntos que requieren tu atención. ⚠️' :
                'Pide ayuda. Estamos aquí para apoyarte. 🆘'}
          </p>
          {currentUser.lastSelfPulse && (
            <div className="last-pulse-info">
              <small>Último pulso enviado: <b>{currentUser.lastSelfPulse.date}</b></small>
            </div>
          )}
        </div>

        {companyEmployees.filter(e => e.managerId === currentUser.id).length > 0 && (
          <div className="glass-card my-team-list">
            <h3>Mis Subordinados 👥</h3>
            <div className="mini-employee-list">
              {companyEmployees.filter(e => e.managerId === currentUser.id).map(emp => (
                <div key={emp.id} className="mini-emp-item" onClick={() => {
                  setViewedManagerId(emp.id);
                  setHistory([...history, emp]);
                  setCurrentMenu('home');
                }}>
                  <span>{emp.avatar} {emp.name}</span>
                  <span className={`badge badge-sm badge-${emp.status}`}>{emp.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="login-screen">
        <div className="glass-card login-card" style={{ textAlign: 'center' }}>
          <span className="logo-icon">🚀</span>
          <h2>Cargando HR Co-pilot...</h2>
          <p>Conectando con el servidor seguro</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleRegisterCompany}
        error={authError}
      />
    );
  }

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="logo" onClick={() => {
          setCurrentMenu('home');
          setViewedManagerId(currentUser.id);
          setHistory([currentUser]);
        }}>
          <span className="logo-icon">🚀</span>
          <h1>HR Co-pilot</h1>
          {currentUser.isAdmin && <span className="admin-badge">ADMIN</span>}
        </div>

        <nav className="header-nav">
          <button className={`nav-btn ${currentMenu === 'home' ? 'active' : ''}`} onClick={() => setCurrentMenu('home')}>📚 Dashboard</button>
          <button className={`nav-btn ${currentMenu === 'profile' ? 'active' : ''}`} onClick={() => setCurrentMenu('profile')}>👤 Mi Perfil</button>
        </nav>

        <div className="header-actions">
          <div className="user-profile">
            <span>Hola, <b>{currentUser.name}</b></span>
            <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión 🔚</button>
          </div>
        </div>
      </header>

      <main className="dashboard">
        {currentMenu === 'profile' ? <MyProfileView /> : (
          <>
            {/* Alert Radar */}
            {companyAlerts.length > 0 && (
              <section className="alert-radar">
                {companyAlerts.slice(0, 2).map(alert => (
                  <div key={alert.id} className={`alert alert-${alert.type} glass-card`}>
                    <span className="alert-icon">{alert.icon}</span>
                    <span className="alert-message">{alert.message}</span>
                    <button className="btn-text btn-sm" onClick={() => {
                      const emp = employees.find(e => e.id === alert.employeeId);
                      setSelectedRadarEmp(emp);
                      setIsRadarOpen(true);
                    }}>Ver Radar</button>
                  </div>
                ))}
              </section>
            )}

            {/* Breadcrumbs */}
            <nav className="breadcrumbs">
              {history.map((h, i) => (
                <React.Fragment key={h.id}>
                  <span className={`breadcrumb-item ${i === history.length - 1 ? 'active' : ''}`} onClick={() => {
                    const newH = history.slice(0, i + 1);
                    setHistory(newH);
                    setViewedManagerId(h.id);
                  }}>
                    {h.name}
                  </span>
                  {i < history.length - 1 && <span className="separator">/</span>}
                </React.Fragment>
              ))}
            </nav>

            <section className="summary-cards">
              <div className="glass-card status-card">
                <h3>Salud del Equipo 📊</h3>
                <div className="traffic-light-container">
                  <div className="traffic-light">
                    <div className={`light red ${metrics.status === 'risk' ? 'active' : ''}`} title={metrics.tooltips?.red}></div>
                    <div className={`light yellow ${metrics.status === 'attention' ? 'active' : ''}`} title={metrics.tooltips?.yellow}></div>
                    <div className={`light green ${metrics.status === 'ok' ? 'active' : ''}`} title={metrics.tooltips?.green}></div>
                  </div>
                </div>
                <p className="status-text">{metrics.status === 'ok' ? '¡Todo OK!' : metrics.status === 'attention' ? 'Atención' : '¡Acción inmediata!'}</p>
              </div>

              <div className="glass-card metrics-card">
                <div className="card-header">
                  <h3>Visión Agregada ({statsSubordinates.length})</h3>
                  <button className="btn-icon" onClick={() => setIsHelpOpen(true)} title="¿Cómo se calcula?">❓</button>
                </div>
                <div className="metrics-grid">
                  <div className="metric">
                    <div className="metric-info"><span>Clima 😊</span><span>{metrics.climate}%</span></div>
                    <div className="progress-bar"><div className="fill" style={{ width: `${metrics.climate}%` }}></div></div>
                  </div>
                  <div className="metric">
                    <div className="metric-info"><span>Alineación 🚀</span><span>{metrics.alignment}%</span></div>
                    <div className="progress-bar"><div className="fill" style={{ width: `${metrics.alignment}%`, background: 'var(--primary)' }}></div></div>
                  </div>
                  <div className="metric">
                    <div className="metric-info"><span>Energía ⚡</span><span>{metrics.energy}%</span></div>
                    <div className="progress-bar"><div className="fill" style={{ width: `${metrics.energy}%`, background: '#f59e0b' }}></div></div>
                  </div>
                  <div className="metric">
                    <div className="metric-info"><span>Riesgo 🏃‍♂️</span><span>{metrics.risk}%</span></div>
                    <div className="progress-bar"><div className="fill risk" style={{ width: `${metrics.risk}%` }}></div></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="employee-list glass-card">
              <div className="card-header list-header">
                <div className="title-group">
                  <h2>{viewedManagerId === currentUser.id ? 'Mis Reportes Directos' : `Reportes de ${history[history.length - 1]?.name}`}</h2>
                  {history.length > 1 && (
                    <button className="btn-back" onClick={() => {
                      const newH = history.slice(0, -1);
                      setHistory(newH);
                      setViewedManagerId(newH[newH.length - 1].id);
                    }}>⬅️ Atrás</button>
                  )}
                </div>
                {currentUser.isAdmin && (
                  <button className="btn btn-primary btn-sm" onClick={() => setIsAddOpen(true)}>➕ Añadir</button>
                )}
              </div>
              <table className="modern-table">
                <thead>
                  <tr><th>Nombre</th><th>Tendencia</th><th>Estado</th><th>Sincronía</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {currentViewEmployees.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div className="user-info">
                          <span className="user-avatar">{emp.avatar}</span>
                          <div className="user-details">
                            <div className="user-name-line">
                              <strong>{emp.name}</strong>
                              <span className="reports-count"> ({getSubordinates(employees, emp.id).length})</span>
                            </div>
                            <span className="user-role">{emp.role}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="trend-line">
                          {emp.statusHistory?.map((s, idx) => (
                            <span key={idx} className={`trend-dot dot-${s}`}></span>
                          ))}
                          <span className={`trend-dot dot-${emp.status} current`}></span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${emp.status}`}>{emp.status.toUpperCase()}</span></td>
                      <td>
                        <div className="sync-status">
                          <span className={`sync-dot ${emp.lastPulse ? 'done' : 'pending'}`} title="Manager"></span>
                          <span className={`sync-dot ${emp.lastSelfPulse ? 'done' : 'pending'}`} title="Empleado"></span>
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button className="btn-icon" onClick={() => { setSelectedCaptureEmp(emp); setIsCaptureOpen(true); }} title="Captura">📝</button>
                        <button className="btn-icon" onClick={() => { setHistory([...history, emp]); setViewedManagerId(emp.id); }} title="Jerarquía">🔍</button>
                        <button className="btn-icon" onClick={async () => {
                          try {
                            await api.post('/pulses/request', { employeeId: emp.id });
                            addToast(`📧 Email real enviado a ${emp.email}: Solicitud de pulso.`);
                          } catch (err) {
                            addToast(`❌ Error al enviar email a ${emp.name}`);
                          }
                        }} title="Solicitar Pulso">✉️</button>
                        <button className="btn-text" onClick={() => { setActiveRes(getResolution(emp.status)); setResEmployeeId(emp.id); }}>Guía 💡</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>

      {/* Modals */}
      {/* Radar Modal with Comparison */}
      {isRadarOpen && selectedRadarEmp && (
        <div className="modal-overlay">
          <div className="glass-card modal-content radar-modal">
            <header className="res-header">
              <div className="user-info">
                <span className="user-avatar">{selectedRadarEmp.avatar}</span>
                <div className="user-details">
                  <div className="user-name-line">
                    <strong>{selectedRadarEmp.name}</strong>
                  </div>
                  <span className="user-role">{selectedRadarEmp.role}</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsRadarOpen(false)}>×</button>
            </header>

            <div className="radar-body">
              <div className="radar-title-row">
                <h3 className="radar-title">Sincronía Boss vs Yo 📡</h3>
                <span className="sync-legend">
                  <span className="legend-item"><span className="dot dot-manager"></span> Jefe</span>
                  <span className="legend-item"><span className="dot dot-self"></span> Yo</span>
                </span>
              </div>
              <p className="modal-subtitle">Último cruce de datos: {selectedRadarEmp.lastPulse?.date || 'Sin datos'}</p>

              <div className="radar-metrics">
                {[
                  { label: 'Ánimo 😊', manager: selectedRadarEmp.lastPulse?.mood || 0, self: selectedRadarEmp.lastSelfPulse?.mood || 0 },
                  { label: 'Alineación 🚀', manager: selectedRadarEmp.lastPulse?.alignment || 0, self: selectedRadarEmp.lastSelfPulse?.alignment || 0 },
                  { label: 'Energía ⚡', manager: selectedRadarEmp.lastPulse?.energy || 0, self: selectedRadarEmp.lastSelfPulse?.energy || 0 }
                ].map((m, i) => {
                  const isGap = Math.abs(m.manager - m.self) >= 2;
                  return (
                    <div key={i} className={`radar-metric comparison ${isGap ? 'gap-warning' : ''}`}>
                      <div className="metric-info">
                        <span>{m.label} {isGap && <span className="gap-tag">Brecha!</span>}</span>
                        <span className="vals">{m.manager} / {m.self}</span>
                      </div>
                      <div className="dual-progress">
                        <div className="progress-bar mini">
                          <div className="fill manager" style={{ width: `${(m.manager / 5) * 100}%` }}></div>
                        </div>
                        <div className="progress-bar mini">
                          <div className="fill self" style={{ width: `${(m.self / 5) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(selectedRadarEmp.lastPulse?.blockers?.length > 0 || selectedRadarEmp.lastSelfPulse?.blockers?.length > 0) && (
                <div className="radar-blockers">
                  <h4>Bloqueadores Detectados 🛑</h4>
                  <div className="blocker-comparison">
                    <div className="blocker-side">
                      <small>Mi Percepción:</small>
                      <div className="blocker-tags">
                        {selectedRadarEmp.lastPulse?.blockers?.map(b => <span key={b} className="blocker-tag manager">{b}</span>)}
                      </div>
                    </div>
                    <div className="blocker-side">
                      <small>Realidad Empleado:</small>
                      <div className="blocker-tags">
                        {selectedRadarEmp.lastSelfPulse?.blockers?.map(b => <span key={b} className="blocker-tag active">{b}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRadarEmp.lastSelfPulse?.comments && (
                <div className="radar-comments">
                  <h4>Comentario del Empleado 💬</h4>
                  <blockquote className="comment-box">{selectedRadarEmp.lastSelfPulse.comments}</blockquote>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary btn-block" onClick={() => {
                setIsRadarOpen(false);
                setActiveRes(getResolution(selectedRadarEmp.status));
                setResEmployeeId(selectedRadarEmp.id);
              }}>Abrir Guía de Resolución 💡</button>
            </div>
          </div>
        </div>
      )}

      {/* Self Pulse Modal */}
      {isSelfPulseOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content pulse-modal highlight-border">
            <header className="res-header">
              <h3>Tu Pulso de Sincronía ✨</h3>
              <p>Ayúdanos a entender cómo te sientes realmente</p>
            </header>

            <form onSubmit={handleSelfPulseSubmit}>
              <div className="capture-flow">
                <div className="capture-group">
                  <label>1. ¿Cómo te sientes hoy realmente? 😊</label>
                  <div className="option-picker">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} type="button" className={`option-btn ${selfPulseData.mood === v ? 'active' : ''}`} onClick={() => setSelfPulseData({ ...selfPulseData, mood: v })}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className="capture-group">
                  <label>2. ¿Sientes que estás alineado con el equipo? 🚀</label>
                  <div className="option-picker">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} type="button" className={`option-btn ${selfPulseData.alignment === v ? 'active' : ''}`} onClick={() => setSelfPulseData({ ...selfPulseData, alignment: v })}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className="capture-group">
                  <label>3. ¿Cuál es tu nivel de energía actual? ⚡</label>
                  <div className="option-picker">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} type="button" className={`option-btn ${selfPulseData.energy === v ? 'active' : ''}`} onClick={() => setSelfPulseData({ ...selfPulseData, energy: v })}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className="capture-group">
                  <label>4. ¿Qué te está bloqueando? (opcional) 🛑</label>
                  <div className="blocker-tags">
                    {[
                      { id: 'boss', label: '👨‍💼 Jefe/Liderazgo' },
                      { id: 'resources', label: '🛠️ Recursos' },
                      { id: 'processes', label: '📈 Procesos' },
                      { id: 'time', label: '⏳ Tiempo' },
                      { id: 'team', label: '🤝 Equipo' },
                      { id: 'personal', label: '🌍 Personal/Externo' }
                    ].map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`blocker-tag ${selfPulseData.blockers.includes(tag.id) ? 'active' : ''}`}
                        onClick={() => {
                          const newBlockers = selfPulseData.blockers.includes(tag.id)
                            ? selfPulseData.blockers.filter(b => b !== tag.id)
                            : [...selfPulseData.blockers, tag.id];
                          setSelfPulseData({ ...selfPulseData, blockers: newBlockers });
                        }}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>5. Comentarios opcionales (solo para tu manager) 💬</label>
                  <textarea
                    className="modern-input"
                    placeholder="Algo que quieras compartir..."
                    value={selfPulseData.comments}
                    onChange={e => setSelfPulseData({ ...selfPulseData, comments: e.target.value })}
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary btn-block">Enviar Pulso 🚀</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast glass-card">
            <span className="toast-icon">✉️</span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <h3>Incorporar Talento 🚀</h3>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group"><label>Nombre</label><input type="text" onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} className="modern-input" required /></div>
              <div className="form-group"><label>Puesto</label><input type="text" onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })} className="modern-input" required /></div>
              <div className="form-group"><label>Email</label><input type="email" onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} className="modern-input" required /></div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setIsAddOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCaptureOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content capture-modal">
            <h3>Captura Invisible: {selectedCaptureEmp?.name}</h3>
            <p className="modal-subtitle">Evalúa el estado actual de {selectedCaptureEmp?.name.split(' ')[0]}</p>

            <form onSubmit={handleCaptureSubmit}>
              <div className="capture-flow">
                {/* Mood Question */}
                <div className="capture-group">
                  <label>1. Ánimo percibido</label>
                  <div className="option-picker">
                    {[
                      { v: 1, e: '😫', l: 'Muy bajo / Agotado' },
                      { v: 2, e: '🙁', l: 'Desanimado / Frustrado' },
                      { v: 3, e: '😐', l: 'Estable / Neutral' },
                      { v: 4, e: '🙂', l: 'Motivado / Positivo' },
                      { v: 5, e: '🤩', l: '¡A tope! / Inspirado' }
                    ].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        title={opt.l}
                        className={`option-btn ${captureData.mood === opt.v ? 'active' : ''}`}
                        onClick={() => setCaptureData({ ...captureData, mood: opt.v })}
                      >
                        {opt.e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment Question */}
                <div className="capture-group">
                  <label>2. Alineación con objetivos</label>
                  <div className="option-picker">
                    {[
                      { v: 1, e: '🛑', l: 'Desconectado / Sin rumbo' },
                      { v: 2, e: '⚠️', l: 'Desalineado / Dudas' },
                      { v: 3, e: '🆗', l: 'Alineado / Cumple' },
                      { v: 4, e: '📈', l: 'Muy alineado / Proactivo' },
                      { v: 5, e: '🚀', l: 'Total sinergia / Líder' }
                    ].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        title={opt.l}
                        className={`option-btn ${captureData.alignment === opt.v ? 'active' : ''}`}
                        onClick={() => setCaptureData({ ...captureData, alignment: opt.v })}
                      >
                        {opt.e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy Question */}
                <div className="capture-group">
                  <label>3. Nivel de energía / carga</label>
                  <div className="option-picker">
                    {[
                      { v: 1, e: '🪫', l: 'Al límite / Sin batería' },
                      { v: 2, e: '🥱', l: 'Sobrecargado / Cansado' },
                      { v: 3, e: '🔋', l: 'Energía estable' },
                      { v: 4, e: '⚡', l: 'Con foco / Alta energía' },
                      { v: 5, e: '💥', l: 'Máximo potencial / Flow' }
                    ].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        title={opt.l}
                        className={`option-btn ${captureData.energy === opt.v ? 'active' : ''}`}
                        onClick={() => setCaptureData({ ...captureData, energy: opt.v })}
                      >
                        {opt.e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="capture-group">
                  <label>Bloqueadores (puedes elegir varios)</label>
                  <div className="blocker-tags">
                    {[
                      { id: 'boss', label: '👨‍💼 Jefe/Liderazgo' },
                      { id: 'resources', label: '🛠️ Recursos' },
                      { id: 'processes', label: '📈 Procesos' },
                      { id: 'time', label: '⏳ Tiempo' },
                      { id: 'team', label: '🤝 Equipo' },
                      { id: 'personal', label: '🌍 Personal/Externo' }
                    ].map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`blocker-tag ${captureData.blockers.includes(tag.id) ? 'active' : ''}`}
                        onClick={() => {
                          const newBlockers = captureData.blockers.includes(tag.id)
                            ? captureData.blockers.filter(b => b !== tag.id)
                            : [...captureData.blockers, tag.id];
                          setCaptureData({ ...captureData, blockers: newBlockers });
                        }}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setIsCaptureOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Señales</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeRes && (
        <div className="modal-overlay" onClick={() => setActiveRes(null)}>
          <div className="glass-card modal-content resolution-modal" onClick={e => e.stopPropagation()}>
            <header className="res-header">
              <h3>{activeRes.title}</h3>
              <button className="close-btn" onClick={() => setActiveRes(null)}>✕</button>
            </header>
            <div className="res-body">
              <h4>Acciones Pendientes ✅</h4>
              <ul className="interactive-checklist">
                {activeRes.steps.map((step, i) => (
                  <li
                    key={i}
                    className={resEmployee?.checklists?.[activeRes.id]?.includes(i) ? 'completed' : ''}
                    onClick={() => toggleChecklistItem(resEmployee.id, activeRes.id, i)}
                  >
                    <input
                      type="checkbox"
                      checked={resEmployee?.checklists?.[activeRes.id]?.includes(i) || false}
                      readOnly
                    />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <h4>Guion Sugerido 💬</h4>
              <blockquote className="script-box">{activeRes.script.replace('[Nombre]', resEmployee?.name)}</blockquote>

              {activeRes.resources && (
                <div className="resources-section">
                  <h4>¿Quieres profundizar? 📚</h4>
                  <div className="resources-grid">
                    {activeRes.resources.map((res, i) => (
                      <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="resource-card">
                        <span className="res-icon">{res.icon}</span>
                        <div className="res-info">
                          <span className="res-title">{res.title}</span>
                          <span className="res-type">{res.type.toUpperCase()}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setActiveRes(null)}>Guardar Progreso</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal - Explanation of Calculations */}
      {isHelpOpen && (
        <div className="modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="glass-card modal-content resolution-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <header className="res-header">
              <h3>📊 ¿Cómo se Calculan las Métricas?</h3>
              <button className="close-btn" onClick={() => setIsHelpOpen(false)}>✕</button>
            </header>
            <div className="res-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

              <h4>🎯 Estados del Empleado (OK, Ojo, Riesgo)</h4>
              <p>El estado de cada empleado se calcula automáticamente basándose en las capturas del manager y/o del propio empleado:</p>

              <div className="script-box" style={{ marginBottom: '20px' }}>
                <strong>🔴 RIESGO</strong> - Se activa cuando:
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <li>Ánimo, Alineación o Energía ≤ 2 (de 5)</li>
                  <li>Tiene 2 o más bloqueadores activos</li>
                  <li>Divergencia crítica: Diferencia ≥ 3 puntos entre percepción manager y empleado</li>
                </ul>
              </div>

              <div className="script-box" style={{ marginBottom: '20px', background: 'rgba(251, 191, 36, 0.1)' }}>
                <strong>🟡 OJO (Atención)</strong> - Se activa cuando:
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <li>Ánimo, Alineación o Energía = 3 (de 5)</li>
                  <li>Tiene exactamente 1 bloqueador</li>
                  <li>Divergencia moderada: Diferencia ≥ 2 puntos entre percepción manager y empleado</li>
                </ul>
              </div>

              <div className="script-box" style={{ marginBottom: '20px', background: 'rgba(34, 197, 94, 0.1)' }}>
                <strong>🟢 OK</strong> - Se activa cuando:
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <li>Ánimo, Alineación y Energía ≥ 4 (de 5)</li>
                  <li>Sin bloqueadores o bloqueadores resueltos</li>
                  <li>Buena sincronía entre manager y empleado</li>
                </ul>
              </div>

              <hr style={{ margin: '30px 0', opacity: 0.2 }} />

              <h4>📈 Visión Agregada del Equipo</h4>
              <p>Estas métricas se calculan promediando los datos de <strong>todos los subordinados directos e indirectos</strong> del manager actual:</p>

              <div className="script-box" style={{ marginBottom: '15px' }}>
                <strong>😊 Clima</strong>
                <p style={{ marginTop: '8px' }}>Promedio del "Ánimo" de todos los empleados, convertido a porcentaje (1-5 → 0-100%).</p>
                <code style={{ display: 'block', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                  Clima = (Suma de Ánimos / (Nº Empleados × 5)) × 100
                </code>
              </div>

              <div className="script-box" style={{ marginBottom: '15px' }}>
                <strong>🚀 Alineación</strong>
                <p style={{ marginTop: '8px' }}>Promedio de la "Alineación con objetivos" de todos los empleados, en porcentaje.</p>
                <code style={{ display: 'block', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                  Alineación = (Suma de Alineaciones / (Nº Empleados × 5)) × 100
                </code>
              </div>

              <div className="script-box" style={{ marginBottom: '15px' }}>
                <strong>⚡ Energía</strong>
                <p style={{ marginTop: '8px' }}>Promedio del "Nivel de energía" de todos los empleados, en porcentaje.</p>
                <code style={{ display: 'block', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                  Energía = (Suma de Energías / (Nº Empleados × 5)) × 100
                </code>
              </div>

              <div className="script-box" style={{ marginBottom: '15px' }}>
                <strong>🏃‍♂️ Riesgo</strong>
                <p style={{ marginTop: '8px' }}>Porcentaje de empleados en estado de RIESGO sobre el total del equipo.</p>
                <code style={{ display: 'block', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                  Riesgo = (Empleados en RIESGO / Total Empleados) × 100
                </code>
              </div>

              <hr style={{ margin: '30px 0', opacity: 0.2 }} />

              <h4>🛰️ Sincronía (Radar de Divergencia)</h4>
              <p>Compara la percepción del <strong>manager</strong> vs. la <strong>realidad del empleado</strong>:</p>

              <div className="script-box" style={{ marginBottom: '15px' }}>
                <strong>🎯 Sincronía Perfecta</strong>
                <p style={{ marginTop: '8px' }}>Cuando la diferencia en Ánimo, Alineación y Energía es 0 puntos.</p>
              </div>

              <div className="script-box" style={{ marginBottom: '15px', background: 'rgba(251, 191, 36, 0.1)' }}>
                <strong>📡 Falta de Sincronía Leve</strong>
                <p style={{ marginTop: '8px' }}>Diferencia de 2 puntos en cualquier dimensión.</p>
              </div>

              <div className="script-box" style={{ marginBottom: '15px', background: 'rgba(239, 68, 68, 0.1)' }}>
                <strong>🛰️ Divergencia Crítica</strong>
                <p style={{ marginTop: '8px' }}>Diferencia de 3 o más puntos. <strong>¡Alerta prioritaria!</strong> Indica desconexión entre manager y empleado.</p>
              </div>

              <hr style={{ margin: '30px 0', opacity: 0.2 }} />

              <h4>💡 Notas Importantes</h4>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                <li><strong>Captura Invisible:</strong> Solo el manager evalúa al empleado (percepción externa).</li>
                <li><strong>Pulso del Empleado:</strong> El empleado se autoevalúa (realidad interna).</li>
                <li><strong>Sincronía:</strong> Solo se calcula cuando existen AMBAS capturas (manager + empleado).</li>
                <li><strong>Actualización:</strong> Los estados se recalculan automáticamente tras cada captura.</li>
                <li><strong>Historial:</strong> Se mantiene un registro de estados previos para detectar tendencias.</li>
              </ul>

            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setIsHelpOpen(false)}>Entendido 👍</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
