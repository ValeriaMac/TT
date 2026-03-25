const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Subir archivo EPUB
const subirEpub = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ningún archivo' });
        }

       const nombreArchivo = req.file.originalname;

        const { data, error } = await supabase.storage
            .from('epubs')
            .upload(nombreArchivo, req.file.buffer, {
                contentType: 'application/epub+zip'
            });

        if (error) {
            console.log('Error Supabase:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({
            mensaje: 'Archivo subido correctamente',
            ruta: data.path
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Obtener lista de EPUBs
const obtenerEpubs = async (req, res) => {
    try {
        const { data, error } = await supabase.storage
            .from('epubs')
            .list();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ archivos: data });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Obtener URL temporal de un EPUB
const obtenerUrlEpub = async (req, res) => {
    try {
        const { nombre } = req.params;

        const { data, error } = await supabase.storage
            .from('epubs')
            .createSignedUrl(nombre, 3600); // URL válida por 1 hora

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ url: data.signedUrl });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Eliminar un EPUB
const eliminarEpub = async (req, res) => {
    try {
        const { nombre } = req.params;

        const { error } = await supabase.storage
            .from('epubs')
            .remove([nombre]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ mensaje: 'Archivo eliminado correctamente' });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    subirEpub,
    obtenerEpubs,
    obtenerUrlEpub,
    eliminarEpub
};