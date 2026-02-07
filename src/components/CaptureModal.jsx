import React from 'react';

const CaptureModal = ({ isOpen, onClose, onSubmit, employee, captureData, setCaptureData }) => {
    if (!isOpen || !employee) return null;

    const options = {
        mood: [
            { v: 1, e: '😫', l: 'Muy bajo / Agotado' },
            { v: 2, e: '🙁', l: 'Desanimado / Frustrado' },
            { v: 3, e: '😐', l: 'Estable / Neutral' },
            { v: 4, e: '🙂', l: 'Motivado / Positivo' },
            { v: 5, e: '🤩', l: '¡A tope! / Inspirado' }
        ],
        alignment: [
            { v: 1, e: '🛑', l: 'Desconectado / Sin rumbo' },
            { v: 2, e: '⚠️', l: 'Desalineado / Dudas' },
            { v: 3, e: '🆗', l: 'Alineado / Cumple' },
            { v: 4, e: '📈', l: 'Muy alineado / Proactivo' },
            { v: 5, e: '🚀', l: 'Total sinergia / Líder' }
        ],
        energy: [
            { v: 1, e: '🪫', l: 'Al límite / Sin batería' },
            { v: 2, e: '🥱', l: 'Sobrecargado / Cansado' },
            { v: 3, e: '🔋', l: 'Energía estable' },
            { v: 4, e: '⚡', l: 'Con foco / Alta energía' },
            { v: 5, e: '💥', l: 'Máximo potencial / Flow' }
        ],
        blockers: [
            { id: 'boss', label: '👨‍💼 Jefe/Liderazgo' },
            { id: 'resources', label: '🛠️ Recursos' },
            { id: 'processes', label: '📈 Procesos' },
            { id: 'time', label: '⏳ Tiempo' },
            { id: 'team', label: '🤝 Equipo' },
            { id: 'personal', label: '🌍 Personal/Externo' }
        ]
    };

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content capture-modal">
                <h3>Captura Invisible: {employee.name}</h3>
                <p className="modal-subtitle">Evalúa el estado actual de {employee.name.split(' ')[0]}</p>

                <form onSubmit={onSubmit}>
                    <div className="capture-flow">
                        <div className="capture-group">
                            <label>1. Ánimo percibido</label>
                            <div className="option-picker">
                                {options.mood.map(opt => (
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

                        <div className="capture-group">
                            <label>2. Alineación con objetivos</label>
                            <div className="option-picker">
                                {options.alignment.map(opt => (
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

                        <div className="capture-group">
                            <label>3. Nivel de energía / carga</label>
                            <div className="option-picker">
                                {options.energy.map(opt => (
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
                                {options.blockers.map(tag => (
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
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Guardar Señales</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CaptureModal;
