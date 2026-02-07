import React from 'react';

const SelfPulseModal = ({ isOpen, selfPulseData, setSelfPulseData, onSubmit }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content pulse-modal highlight-border">
                <header className="res-header">
                    <h3>Tu Pulso de Sincronía ✨</h3>
                    <p>Ayúdanos a entender cómo te sientes realmente</p>
                </header>

                <form onSubmit={onSubmit}>
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
    );
};

export default SelfPulseModal;
