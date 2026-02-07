import React from 'react';

const MyProfile = ({ currentUser, companyEmployees, setViewedManagerId, setHistory, setCurrentMenu, history }) => {
    if (!currentUser) return null;

    return (
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
};

export default MyProfile;
