import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import api from './services/api';
import {
  getResolution,
  getSubordinates,
  getAllNestedSubordinates,
  getAlerts
} from './logic/engine';
import Login from './components/Login';
import MyProfile from './components/MyProfile';
import RadarModal from './components/RadarModal';
import SelfPulseModal from './components/SelfPulseModal';
import AddEmployeeModal from './components/AddEmployeeModal';
import CaptureModal from './components/CaptureModal';
import ResolutionModal from './components/ResolutionModal';
import HelpModal from './components/HelpModal';

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
  const [requestingPulseFor, setRequestingPulseFor] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [fallbackLink, setFallbackLink] = useState(null);

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
        // Basic validation for base64
        if (!/^[A-Za-z0-9+/=]+$/.test(token)) {
          throw new Error("Invalid base64 characters");
        }

        const decoded = atob(token).split(':');
        if (decoded.length < 2) throw new Error("Invalid token format");

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
        console.error("Invalid token in URL", e);
      }
    }
  }, [employees]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hr_copilot_session', JSON.stringify(currentUser));
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
    viewedManagerId ? companyEmployees.filter(e => Number(e.managerId) === Number(viewedManagerId)) : [],
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
    setIsAuthLoading(true);
    setAuthError('');
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
    } catch (err) {
      console.error("Login Error details:", err);
      const detail = err.response?.data?.msg || err.message;
      setAuthError(`${detail}. Revisa la consola (F12) para más detalles.`);
    } finally {
      setIsAuthLoading(false);
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
      await api.post('/pulses/manager', {
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
      console.error("Capture submit failed", err);
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
      console.error("Self pulse submit failed", err);
      addToast(`❌ Error al enviar pulso`);
    }
  };

  const toggleChecklistItem = async (empId, resId, stepIndex) => {
    try {
      await api.post(`/employees/${empId}/checklist`, { resId, stepIndex });
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);
    } catch (err) {
      console.error("Checklist update failed", err);
      addToast(`❌ Error al actualizar checklist`);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      // Ensure we have a valid managerId, default to currentUser.id if viewedManagerId is null
      const managerId = viewedManagerId || currentUser.id;
      await api.post('/employees', { ...newEmployee, managerId });

      const empRes = await api.get('/employees');
      setEmployees(empRes.data);
      setIsAddOpen(false);
      setNewEmployee({ name: '', role: '', avatar: AVATARS[0], email: '', password: '123' });
      addToast(`👤 Nuevo empleado añadido: ${newEmployee.name}`);
    } catch (err) {
      console.error("Add employee failed", err);
      addToast(`❌ Error al añadir empleado`);
    }
  };

  const handleDeleteEmployee = async (empId, empName) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${empName}?`)) return;
    try {
      await api.delete(`/employees/${empId}`);
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);
      addToast(`🗑️ ${empName} ha sido eliminado.`);
    } catch (err) {
      console.error("Delete employee failed", err);
      addToast(`❌ ${err.response?.data?.msg || 'Error al eliminar empleado'}`);
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegisterCompany} error={authError} loading={isAuthLoading} />;
  }

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
          <button className={`nav-btn ${currentMenu === 'home' ? 'active' : ''}`} onClick={() => setCurrentMenu('home')}>Dashboard</button>
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
        {currentMenu === 'profile' ? (
          <MyProfile
            currentUser={currentUser}
            companyEmployees={companyEmployees}
            setViewedManagerId={setViewedManagerId}
            setHistory={setHistory}
            setCurrentMenu={setCurrentMenu}
            history={history}
          />
        ) : (
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
                        <button
                          className={`btn-icon ${requestingPulseFor === emp.id ? 'loading' : ''}`}
                          onClick={async () => {
                            if (requestingPulseFor) return;
                            setRequestingPulseFor(emp.id);
                            try {
                              const res = await api.post('/pulses/request', { employeeId: emp.id });
                              const link = res.data.pulseLink;
                              if (link) {
                                setFallbackLink({ name: emp.name, link });
                              }
                              addToast(`📧 Procesando envío manual/automático.`);
                            } catch (err) {
                              console.error("Request pulse failed", err);
                              const link = err.response?.data?.pulseLink;
                              if (link) {
                                setFallbackLink({ name: emp.name, link });
                                addToast(`⚠️ Backup: Generado link manual.`);
                              } else {
                                const detail = err.response?.data?.error || err.response?.data?.msg || err.message;
                                addToast(`❌ Error: ${detail}`);
                              }
                            } finally {
                              setRequestingPulseFor(null);
                            }
                          }}
                          title="Solicitar Pulso"
                          disabled={requestingPulseFor === emp.id}
                        >
                          {requestingPulseFor === emp.id ? <span className="spinner-mini"></span> : '✉️'}
                        </button>
                        <button className="btn-text" onClick={() => { setActiveRes(getResolution(emp.status)); setResEmployeeId(emp.id); }}>Guía 💡</button>
                        <button className="btn-icon delete-btn" onClick={() => handleDeleteEmployee(emp.id, emp.name)} title="Eliminar">🗑️</button>
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
      {/* Pulse Link Fallback Modal */}
      {fallbackLink && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <header className="modal-header">
              <h3>🔗 Link de Pulso para {fallbackLink.name}</h3>
            </header>
            <p>Se ha generado el link de pulso. Pulsa el botón para copiarlo y envíaselo por WhatsApp o Slack:</p>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '5px', wordBreak: 'break-all', margin: '15px 0', fontSize: '14px' }}>
              {fallbackLink.link}
            </div>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => {
                navigator.clipboard.writeText(fallbackLink.link);
                addToast("✅ Link copiado al portapapeles");
              }}>Copiar Link</button>
              <button className="btn btn-secondary" onClick={() => setFallbackLink(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <RadarModal
        isOpen={isRadarOpen}
        employee={selectedRadarEmp}
        onClose={() => setIsRadarOpen(false)}
        onOpenResolution={(emp) => {
          setActiveRes(getResolution(emp.status));
          setResEmployeeId(emp.id);
        }}
      />

      <SelfPulseModal
        isOpen={isSelfPulseOpen}
        selfPulseData={selfPulseData}
        setSelfPulseData={setSelfPulseData}
        onSubmit={handleSelfPulseSubmit}
        onClose={() => setIsSelfPulseOpen(false)}
      />

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast glass-card">
            <span className="toast-icon">✉️</span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      <AddEmployeeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddEmployee}
        newEmployee={newEmployee}
        setNewEmployee={setNewEmployee}
        avatars={AVATARS}
      />

      <CaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onSubmit={handleCaptureSubmit}
        employee={selectedCaptureEmp}
        captureData={captureData}
        setCaptureData={setCaptureData}
      />

      <ResolutionModal
        isOpen={!!activeRes}
        onClose={() => setActiveRes(null)}
        activeRes={activeRes}
        employee={resEmployee}
        onToggleChecklist={toggleChecklistItem}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

export default App;
