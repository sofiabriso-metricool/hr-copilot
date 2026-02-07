import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-card modal-content resolution-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <header className="res-header">
                    <h3>📊 ¿Cómo se Calculan las Métricas?</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
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
                    <button className="btn btn-primary" onClick={onClose}>Entendido 👍</button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
