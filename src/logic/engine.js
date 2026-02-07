/**
 * HR Co-pilot Logic Engine
 */

export const authenticate = (employees, email, password) => {
    return employees.find(e => e.email === email && e.password === password);
};

/**
 * Combined Diagnosis Logic
 * Takes both manager perception (data) and employee self-assessment (selfData)
 */
export const diagnoseStatus = (data, selfData = null) => {
    // If no self-assessment, we rely only on the manager (original logic)
    if (!selfData) {
        const { mood, alignment, energy, blockers } = data;
        const blockerCount = Array.isArray(blockers) ? blockers.length : 0;
        if (mood <= 2 || alignment <= 2 || energy <= 2 || blockerCount >= 2) return 'risk';
        if (mood === 3 || alignment === 3 || energy === 3 || blockerCount === 1) return 'attention';
        return 'ok';
    }

    // Combined Logic
    const avgMood = (data.mood + selfData.mood) / 2;
    const avgAlign = (data.alignment + selfData.alignment) / 2;
    const avgEnergy = (data.energy + selfData.energy) / 2;
    const blockerCount = (data.blockers?.length || 0) + (selfData.blockers?.length || 0);

    // DIVERGENCE check: If scores differ by more than 2 points
    const maxDiff = Math.max(
        Math.abs(data.mood - selfData.mood),
        Math.abs(data.alignment - selfData.alignment),
        Math.abs(data.energy - selfData.energy)
    );

    if (maxDiff >= 3 || avgMood <= 2.5 || avgAlign <= 2.5 || avgEnergy <= 2.5 || blockerCount >= 2) {
        return 'risk';
    }

    if (maxDiff >= 2 || avgMood <= 3.5 || avgAlign <= 3.5 || avgEnergy <= 3.5 || blockerCount >= 1) {
        return 'attention';
    }

    return 'ok';
};

export const getResolution = (status) => {
    const resolutions = {
        risk: {
            id: 'risk_resolution',
            title: '🚨 Kit de Emergencia: Riesgo de Fuga/Burnout',
            steps: [
                'Organizar una reunión 1:1 inmediata (menos de 24h).',
                'Escucha activa sin defensas: deja que el empleado hable el 80% del tiempo.',
                'Identificar el "bloqueador raíz" (carga de trabajo, falta de propósito, conflicto).',
                'Acordar un plan de acción de 7 días con cambios tangibles.'
            ],
            script: 'Hola [Nombre], he notado por tus señales que las cosas no están fluyendo como deberían. Me importa mucho tu bienestar y quiero entender qué está pasando realmente para poder ayudarte hoy mismo...',
            resources: [
                { type: 'video', title: 'Cómo detectar el Burnout (TED)', url: 'https://www.youtube.com/watch?v=B6Z6YV9w1vY', icon: '📺' },
                { type: 'video', title: 'Simon Sinek: Prevenir el Burnout', url: 'https://www.youtube.com/watch?v=GAnI6-gIn0c', icon: '🎙️' },
                { type: 'article', title: 'Guía: Gestionar el agotamiento laboral', url: 'https://greatergood.berkeley.edu/article/item/how_to_prevent_burnout_at_work', icon: '📄' }
            ]
        },
        attention: {
            id: 'attention_resolution',
            title: '⚠️ Kit de Prevención: Desalineación Detectada',
            steps: [
                'Programar check-in informal de 15 min.',
                'Clarificar objetivos de la semana.',
                'Preguntar: "¿Qué es lo que más te ha frustrado esta semana?"',
                'Revisar si las expectativas son realistas.'
            ],
            script: 'Buenas [Nombre], ¿cómo va todo? Quería robarte 10 minutos para ver cómo te sientes con el proyecto actual. He visto que hay algunos puntos con fricción y quería ver cómo podemos suavizarlos...',
            resources: [
                { type: 'video', title: 'El poder de la escucha activa (Sinek)', url: 'https://www.youtube.com/watch?v=qpnNsSubeig', icon: '📺' },
                { type: 'video', title: 'Técnicas de Feedback que funcionan (TED)', url: 'https://www.youtube.com/watch?v=wtLJPvx7-ys', icon: '🎙️' },
                { type: 'article', title: '6 Preguntas para alinear a tu equipo', url: 'https://www.ccl.org/articles/leading-effectively-articles/alignment-check-6-questions-to-ask-yourself-and-your-team/', icon: '📄' }
            ]
        },
        ok: {
            id: 'ok_resolution',
            title: '✅ Kit de Potenciación: Mantener el Momentum',
            steps: [
                'Reconocimiento público o privado de logros recientes.',
                'Preguntar por áreas de interés para futuro crecimiento.',
                'Asegurar que tiene los recursos necesarios para seguir así.'
            ],
            script: '¡Gran trabajo esta semana, [Nombre]! Me gusta mucho cómo estás gestionando [X]. Sigue así, ¿hay algo que necesites de mi parte para mantener este ritmo?',
            resources: [
                { type: 'video', title: 'Dan Pink: La ciencia de la motivación (TED)', url: 'https://www.youtube.com/watch?v=rrkrvAUbU9Y', icon: '📺' },
                { type: 'video', title: 'Simon Sinek: Empieza con el POR QUÉ', url: 'https://www.youtube.com/watch?v=u4ZoJKF_VuA', icon: '🎙️' },
                { type: 'article', title: 'Motivar a empleados de alto rendimiento', url: 'https://www.atlassian.com/blog/teamwork/how-to-motivate-high-performers', icon: '📄' }
            ]
        }
    };

    return resolutions[status] || resolutions.ok;
};

export const getSubordinates = (employees, managerId) => {
    return employees.filter(emp => emp.managerId === managerId);
};

export const getAllNestedSubordinates = (employees, managerId) => {
    const direct = getSubordinates(employees, managerId);
    let all = [...direct];
    direct.forEach(emp => {
        all = [...all, ...getAllNestedSubordinates(employees, emp.id)];
    });
    return all;
};

export const getAlerts = (employees, managerId) => {
    const team = getAllNestedSubordinates(employees, managerId);
    const alerts = [];

    team.forEach(emp => {
        const history = emp.statusHistory || [];
        if (history.length < 2) return;

        const current = emp.status;
        const previous = history[history.length - 1];

        // Misalignment Alert (Divergence)
        if (emp.lastPulse && emp.lastSelfPulse) {
            const diffMood = Math.abs(emp.lastPulse.mood - emp.lastSelfPulse.mood);
            const diffAlign = Math.abs(emp.lastPulse.alignment - emp.lastSelfPulse.alignment);
            const diffEnergy = Math.abs(emp.lastPulse.energy - emp.lastSelfPulse.energy);

            if (diffMood >= 3 || diffAlign >= 3 || diffEnergy >= 3) {
                let focus = diffMood >= 3 ? 'el ánimo' : (diffAlign >= 3 ? 'la alineación' : 'la energía');
                alerts.push({
                    id: `alert_${emp.id}_divergence_critical`,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    type: 'danger',
                    message: `¡Divergencia Crítica! Gran brecha detectada en ${focus} de ${emp.name}.`,
                    icon: '🛰️'
                });
            } else if (diffMood >= 2 || diffAlign >= 2 || diffEnergy >= 2) {
                alerts.push({
                    id: `alert_${emp.id}_divergence_warning`,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    type: 'warning',
                    message: `Falta de sincronía leve detectada con ${emp.name}. Revisa el radar.`,
                    icon: '📡'
                });
            } else if (diffMood === 0 && diffAlign === 0 && diffEnergy === 0) {
                alerts.push({
                    id: `alert_${emp.id}_perfect_sync`,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    type: 'success',
                    message: `¡Sincronía Perfecta! Estás totalmente alineado con ${emp.name}.`,
                    icon: '🎯'
                });
            }
        }

        if (current === 'risk' && previous !== 'risk') {
            alerts.push({
                id: `alert_${emp.id}_risk`,
                employeeId: emp.id,
                employeeName: emp.name,
                type: 'danger',
                message: `¡Alerta! ${emp.name} ha entrado en estado de RIESGO.`,
                icon: '🚨'
            });
        } else if (current === 'attention' && previous === 'ok') {
            alerts.push({
                id: `alert_${emp.id}_attention`,
                employeeId: emp.id,
                employeeName: emp.name,
                type: 'warning',
                message: `${emp.name} requiere atención (cambio de OK a OJO).`,
                icon: '⚠️'
            });
        } else if (current === 'ok' && previous !== 'ok') {
            alerts.push({
                id: `alert_${emp.id}_recovered`,
                employeeId: emp.id,
                employeeName: emp.name,
                type: 'success',
                message: `¡Buenas noticias! ${emp.name} se ha recuperado a estado OK.`,
                icon: '✨'
            });
        }
    });

    return alerts;
};
