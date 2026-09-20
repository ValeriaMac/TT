const supabase = require('../config/supabase.cliente');

async function obtenerConfiguracion(req, res) {
    try {
        const { data, error } = await supabase
            .from('configuracion_visual')
            .select('*')
            .eq('usuario_id', req.usuarioId)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

async function actualizarConfiguracion(req, res) {
    try {
        const {
            tipografia, tamanoFuente, colorFondo, colorTexto,
            espaciadoLetras, espaciadoPalabras, espaciadoLineas,
            resaltadoLetrasConfusas, letrasResaltadas,
        } = req.body;

        if (tamanoFuente && (tamanoFuente < 12 || tamanoFuente > 24)) {
            return res.status(400).json({ mensaje: 'El tamaño de fuente debe estar entre 12 y 24' });
        }

        const { data, error } = await supabase
            .from('configuracion_visual')
            .update({
                tipografia,
                tamano_fuente: tamanoFuente,
                color_fondo: colorFondo,
                color_texto: colorTexto,
                espaciado_letras: espaciadoLetras,
                espaciado_palabras: espaciadoPalabras,
                espaciado_lineas: espaciadoLineas,
                resaltado_letras_confusas: resaltadoLetrasConfusas,
                letras_resaltadas: letrasResaltadas || {},
                fecha_actualizacion: new Date().toISOString(),
            })
            .eq('usuario_id', req.usuarioId)
            .select()
            .single();

        if (error) throw error;
        res.json({ mensaje: 'Configuración guardada', configuracion: data });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

async function listarPlantillas(req, res) {
    try {
        const { data, error } = await supabase
            .from('plantillas')
            .select('*')
            .eq('usuario_id', req.usuarioId)
            .order('fecha_creacion', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al listar plantillas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

async function guardarPlantilla(req, res) {
    try {
        const { nombre } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre de la plantilla es obligatorio' });
        }

        const { data: configActiva, error: errorConfig } = await supabase
            .from('configuracion_visual')
            .select('*')
            .eq('usuario_id', req.usuarioId)
            .single();

        if (errorConfig) throw errorConfig;

        const { data, error } = await supabase
            .from('plantillas')
            .insert({
                usuario_id: req.usuarioId,
                nombre,
                tipografia: configActiva.tipografia,
                tamano_fuente: configActiva.tamano_fuente,
                color_fondo: configActiva.color_fondo,
                color_texto: configActiva.color_texto,
                espaciado_letras: configActiva.espaciado_letras,
                espaciado_palabras: configActiva.espaciado_palabras,
                espaciado_lineas: configActiva.espaciado_lineas,
                resaltado_letras_confusas: configActiva.resaltado_letras_confusas,
                letras_resaltadas: configActiva.letras_resaltadas,
            })
            .select()
            .single();

        if (error) {
            if (error.message.includes('Límite de 3 plantillas')) {
                return res.status(409).json({ mensaje: 'Ya tienes el máximo de 3 plantillas guardadas' });
            }
            throw error;
        }

        res.status(201).json({ mensaje: 'Plantilla guardada correctamente', plantilla: data });
    } catch (error) {
        console.error('Error al guardar plantilla:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

async function aplicarPlantilla(req, res) {
    try {
        const { id } = req.params;

        const { data: plantilla, error: errorPlantilla } = await supabase
            .from('plantillas')
            .select('*')
            .eq('id', id)
            .eq('usuario_id', req.usuarioId)
            .single();

        if (errorPlantilla || !plantilla) {
            return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
        }

        const { data, error } = await supabase
            .from('configuracion_visual')
            .update({
                tipografia: plantilla.tipografia,
                tamano_fuente: plantilla.tamano_fuente,
                color_fondo: plantilla.color_fondo,
                color_texto: plantilla.color_texto,
                espaciado_letras: plantilla.espaciado_letras,
                espaciado_palabras: plantilla.espaciado_palabras,
                espaciado_lineas: plantilla.espaciado_lineas,
                resaltado_letras_confusas: plantilla.resaltado_letras_confusas,
                letras_resaltadas: plantilla.letras_resaltadas,
                fecha_actualizacion: new Date().toISOString(),
            })
            .eq('usuario_id', req.usuarioId)
            .select()
            .single();

        if (error) throw error;
        res.json({ mensaje: 'Plantilla aplicada', configuracion: data });
    } catch (error) {
        console.error('Error al aplicar plantilla:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

async function eliminarPlantilla(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('plantillas')
            .delete()
            .eq('id', id)
            .eq('usuario_id', req.usuarioId);

        if (error) throw error;
        res.json({ mensaje: 'Plantilla eliminada' });
    } catch (error) {
        console.error('Error al eliminar plantilla:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion,
    listarPlantillas,
    guardarPlantilla,
    aplicarPlantilla,
    eliminarPlantilla,
};