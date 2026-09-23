// controladores/documentosTexto.controlador.js
const supabase = require('../config/supabase.cliente');

// POST /api/documentos (protegida)
// Body: { titulo, contenido }
async function crearDocumento(req, res) {
    try {
        const { titulo, contenido } = req.body;

        const { data, error } = await supabase
            .from('documentos_texto')
            .insert({
                usuario_id: req.usuarioId,
                titulo: titulo?.trim() || 'Sin título',
                contenido: contenido || '',
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ mensaje: 'Documento creado', documento: data });
    } catch (error) {
        console.error('Error al crear documento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// GET /api/documentos (protegida) — lista los documentos del usuario
async function listarDocumentos(req, res) {
    try {
        const { data, error } = await supabase
            .from('documentos_texto')
            .select('id, titulo, fecha_creacion, fecha_actualizacion')
            .eq('usuario_id', req.usuarioId)
            .order('fecha_actualizacion', { ascending: false });

        if (error) throw error;

        res.json({ documentos: data });
    } catch (error) {
        console.error('Error al listar documentos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// GET /api/documentos/:id (protegida) — trae uno completo, con su contenido
async function obtenerDocumento(req, res) {
    try {
        const { data, error } = await supabase
            .from('documentos_texto')
            .select('*')
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId) // nunca dejar ver documentos de otro usuario
            .single();

        if (error || !data) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' });
        }

        res.json({ documento: data });
    } catch (error) {
        console.error('Error al obtener documento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// PUT /api/documentos/:id (protegida)
// Body: { titulo, contenido }
async function actualizarDocumento(req, res) {
    try {
        const { titulo, contenido } = req.body;

        const { data, error } = await supabase
            .from('documentos_texto')
            .update({
                titulo: titulo?.trim() || 'Sin título',
                contenido: contenido ?? '',
                fecha_actualizacion: new Date().toISOString(),
            })
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId) // no se puede editar un documento ajeno
            .select()
            .single();

        if (error || !data) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' });
        }

        res.json({ mensaje: 'Documento actualizado', documento: data });
    } catch (error) {
        console.error('Error al actualizar documento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// DELETE /api/documentos/:id (protegida)
async function eliminarDocumento(req, res) {
    try {
        const { error } = await supabase
            .from('documentos_texto')
            .delete()
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId);

        if (error) throw error;

        res.json({ mensaje: 'Documento eliminado' });
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = {
    crearDocumento,
    listarDocumentos,
    obtenerDocumento,
    actualizarDocumento,
    eliminarDocumento,
};