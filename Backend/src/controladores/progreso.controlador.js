const supabase = require('../config/supabase.cliente');

// GET /api/progreso (protegida)
async function obtenerProgreso(req, res) {
    try {
        const { data, error } = await supabase
            .from('progreso_general')
            .select('*')
            .eq('usuario_id', req.usuarioId)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al obtener progreso:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// Devuelve la fecha de hoy y de ayer como texto 'YYYY-MM-DD', para
// comparar contra "ultima_actividad" sin complicarse con horas/zonas
function fechaComoTexto(fecha) {
    return fecha.toISOString().split('T')[0];
}

// POST /api/progreso/resultado (protegida)
// Registra el resultado de una ronda de un ejercicio (RF_19) y
// actualiza los puntos totales y la racha de días del usuario.
async function registrarResultado(req, res) {
    try {
        const { ejercicioClave, nivelNumero, puntosObtenidos, aciertos, errores } = req.body;

        if (!ejercicioClave || puntosObtenidos === undefined) {
            return res.status(400).json({ mensaje: 'Faltan datos del resultado' });
        }

        // Buscar el ejercicio por su clave (ej. 'CU-EJ-01')
        const { data: ejercicio, error: errorEjercicio } = await supabase
            .from('ejercicios')
            .select('id')
            .eq('clave', ejercicioClave)
            .single();

        if (errorEjercicio || !ejercicio) {
            return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
        }

        // El nivel es opcional (por si el ejercicio no maneja niveles)
        let nivelId = null;
        if (nivelNumero) {
            const { data: nivel } = await supabase
                .from('niveles')
                .select('id')
                .eq('ejercicio_id', ejercicio.id)
                .eq('numero_nivel', nivelNumero)
                .maybeSingle();
            nivelId = nivel?.id || null;
        }

        // 1) Se guarda el intento tal cual (historial completo, RF_19)
        const { error: errorInsertar } = await supabase.from('resultados_ejercicio').insert({
            usuario_id: req.usuarioId,
            ejercicio_id: ejercicio.id,
            nivel_id: nivelId,
            puntos_obtenidos: puntosObtenidos,
            aciertos: aciertos || 0,
            errores: errores || 0,
        });

        if (errorInsertar) throw errorInsertar;

        // 2) Se actualiza el resumen general (puntos totales y racha)
        const { data: progresoActual, error: errorProgreso } = await supabase
            .from('progreso_general')
            .select('*')
            .eq('usuario_id', req.usuarioId)
            .single();

        if (errorProgreso) throw errorProgreso;

        const hoy = fechaComoTexto(new Date());
        const ayer = fechaComoTexto(new Date(Date.now() - 24 * 60 * 60 * 1000));

        let nuevaRacha;
        if (progresoActual.ultima_actividad === hoy) {
            // Ya había actividad hoy: la racha no cambia
            nuevaRacha = progresoActual.racha_actual;
        } else if (progresoActual.ultima_actividad === ayer) {
            // Practicó ayer y hoy: la racha sigue creciendo
            nuevaRacha = progresoActual.racha_actual + 1;
        } else {
            // Es la primera vez, o dejó pasar uno o más días: la racha reinicia
            nuevaRacha = 1;
        }

        const nuevaRachaMaxima = Math.max(progresoActual.racha_maxima, nuevaRacha);
        const nuevosPuntos = progresoActual.puntos_totales + puntosObtenidos;

        const { data: progresoActualizado, error: errorActualizar } = await supabase
            .from('progreso_general')
            .update({
                puntos_totales: nuevosPuntos,
                racha_actual: nuevaRacha,
                racha_maxima: nuevaRachaMaxima,
                ultima_actividad: hoy,
            })
            .eq('usuario_id', req.usuarioId)
            .select()
            .single();

        if (errorActualizar) throw errorActualizar;

        res.json({ mensaje: 'Resultado registrado', progreso: progresoActualizado });

    } catch (error) {
        console.error('Error al registrar resultado:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// GET /api/progreso/historial (protegida)
// Lista los intentos de ejercicios más recientes del usuario, con el
// nombre del ejercicio y el porcentaje de aciertos de esa ronda.
async function obtenerHistorial(req, res) {
    try {
        const { data, error } = await supabase
            .from('resultados_ejercicio')
            .select('id, puntos_obtenidos, aciertos, errores, fecha, ejercicios(nombre)')
            .eq('usuario_id', req.usuarioId)
            .order('fecha', { ascending: false })
            .limit(20);

        if (error) throw error;

        const historial = data.map((resultado) => {
            const totalIntentos = resultado.aciertos + resultado.errores;
            const porcentaje = totalIntentos > 0
                ? Math.round((resultado.aciertos / totalIntentos) * 100)
                : 0;

            return {
                id: resultado.id,
                nombreEjercicio: resultado.ejercicios?.nombre || 'Ejercicio',
                puntosObtenidos: resultado.puntos_obtenidos,
                porcentaje,
                fecha: resultado.fecha,
            };
        });

        res.json(historial);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { obtenerProgreso, registrarResultado, obtenerHistorial };