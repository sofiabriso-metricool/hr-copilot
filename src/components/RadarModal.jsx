import React from 'react';

const RadarModal = ({ isOpen, employee, onClose, onOpenResolution }) => {
    if (!isOpen || !employee) return null;

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content radar-modal">
                <header className="res-header">
                    <div className="user-info">
                        <span className="user-avatar">{employee.avatar}</span>
                        <div className="user-details">
                            <div className="user-name-line">
                                <strong>{employee.name}</strong>
                            </div>
                            <span className="user-role">{employee.role}</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </header>

                <div className="radar-body">
                    <div className="radar-title-row">
                        <h3 className="radar-title">Sincronía Boss vs Yo 📡</h3>
                        <span className="sync-legend">
                            <span className="legend-item"><span className="dot dot-manager"></span> Jefe</span>
                            <span className="legend-item"><span className="dot dot-self"></span> Yo</span>
                        </span>
                    </div>
                    <p className="modal-subtitle">Último cruce de datos: {employee.lastPulse?.date || 'Sin datos'}</p>

                    <div className="radar-metrics">
                        {[
                            { label: 'Ánimo 😊', manager: employee.lastPulse?.mood || 0, self: employee.lastSelfPulse?.mood || 0 },
                            { label: 'Alineación 🚀', manager: employee.lastPulse?.alignment || 0, self: employee.lastSelfPulse?.alignment || 0 },
                            { label: 'Energía ⚡', manager: employee.lastPulse?.energy || 0, self: employee.lastSelfPulse?.energy || 0 }
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

                    {(employee.lastPulse?.blockers?.length > 0 || employee.lastSelfPulse?.blockers?.length > 0) && (
                        <div className="radar-blockers">
                            <h4>Bloqueadores Detectados 🛑</h4>
                            <div className="blocker-comparison">
                                <div className="blocker-side">
                                    <small>Mi Percepción:</small>
                                    <div className="blocker-tags">
                                        {employee.lastPulse?.blockers?.map(b => <span key={b} className="blocker-tag manager">{b}</span>)}
                                    </div>
                                </div>
                                <div className="blocker-side">
                                    <small>Realidad Empleado:</small>
                                    <div className="blocker-tags">
                                        {employee.lastSelfPulse?.blockers?.map(b => <span key={b} className="blocker-tag active">{b}</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {employee.lastSelfPulse?.comments && (
                        <div className="radar-comments">
                            <h4>Comentario del Empleado 💬</h4>
                            <blockquote className="comment-box">{employee.lastSelfPulse.comments}</blockquote>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary btn-block" onClick={() => {
                        onClose();
                        onOpenResolution(employee);
                    }}>Abrir Guía de Resolución 💡</button>
                </div>
            </div>
        </div>
    );
};

export default RadarModal;
