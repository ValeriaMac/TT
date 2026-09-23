// controladores/lluvia.controlador.js
//
// A diferencia de los demás ejercicios, aquí el backend no manda un
// banco de preguntas por subnivel — manda UNA configuración por nivel
// (letra objetivo, letras distractoras, velocidad de caída), y toda
// la animación de las letras cayendo vive del lado del frontend.
const supabase = require('../config/supabase.cliente');
const { determinarNivelYSubnivel } = require('../utilidades/utilidades_juegos');

// GET /api/ejercicios/lluvia (protegida)
async function obtenerConfiguracion(req, res) {
    try {
        const { data: ejercicio, error: errorEjercicio } = await supabase
            .from('ejercicios')
            .select('id')
            .eq('clave', 'CU-EJ-05')
            .single();

        if (errorEjercicio || !ejercicio) {
            return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
        }

        const progreso = await determinarNivelYSubnivel(req.usuarioId, ejercicio.id);

        const { data: config, error: errorConfig } = await supabase
            .from('banco_preguntas')
            .select('opciones')
            .eq('nivel_id', progreso.nivelId)
            .limit(1)
            .single();

        if (errorConfig || !config) {
            return res.status(404).json({ mensaje: 'No hay configuración para este nivel.' });
        }

        res.json({
            numeroNivel: progreso.numeroNivel,
            subnivel: progreso.subnivel,
            ejercicioCompletado: progreso.ejercicioCompletado,
            letraObjetivo: config.opciones.letra_objetivo,
            distractores: config.opciones.distractores,
            velocidadCaidaMs: config.opciones.velocidad_caida_ms,
        });

    } catch (error) {
        console.error('Error al obtener configuración de Lluvia:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { obtenerConfiguracion };