import React from 'react';

const ResolutionModal = ({ isOpen, onClose, activeRes, employee, onToggleChecklist }) => {
    if (!isOpen || !activeRes) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-card modal-content resolution-modal" onClick={e => e.stopPropagation()}>
                <header className="res-header">
                    <h3>{activeRes.title}</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </header>
                <div className="res-body">
                    <h4>Acciones Pendientes ✅</h4>
                    <ul className="interactive-checklist">
                        {activeRes.steps.map((step, i) => (
                            <li
                                key={i}
                                className={employee?.checklists?.[activeRes.id]?.includes(i) ? 'completed' : ''}
                                onClick={() => onToggleChecklist(employee.id, activeRes.id, i)}
                            >
                                <input
                                    type="checkbox"
                                    checked={employee?.checklists?.[activeRes.id]?.includes(i) || false}
                                    readOnly
                                />
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                    <h4>Guion Sugerido 💬</h4>
                    <blockquote className="script-box">{activeRes.script.replace('[Nombre]', employee?.name)}</blockquote>

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
                    <button className="btn btn-primary" onClick={onClose}>Guardar Progreso</button>
                </div>
            </div>
        </div>
    );
};

export default ResolutionModal;
