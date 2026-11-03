const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Cada usuario tiene su propia carpeta en el bucket (su id), así nadie
// ve ni abre los libros de otro usuario
const rutaDelUsuario = (req, nombre) => `${req.usuarioId}/${nombre}`;

// Rechaza nombres que intenten salirse de la carpeta del usuario
const nombreValido = (nombre) =>
    typeof nombre === 'string' && nombre !== '' && !nombre.includes('/') && !nombre.includes('..');

// Revisa que el archivo sea un EPUB completo y no esté dañado:
// 1) empieza como un ZIP, 2) el primer archivo es "mimetype" con el tipo
// de EPUB, 3) tiene el final del ZIP (un archivo cortado no lo tiene) y
// 4) incluye META-INF/container.xml, que todo EPUB trae
const esEpubValido = (buffer) => {
    if (!buffer || buffer.length < 100) return false;
    const empiezaComoZip = buffer.readUInt32LE(0) === 0x04034b50;
    const primerArchivo = buffer.toString('latin1', 30, 38) === 'mimetype'
        && buffer.toString('latin1', 38, 140).includes('application/epub+zip');
    const finalDelZip = buffer.subarray(Math.max(0, buffer.length - 65557)).includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    const tieneContainer = buffer.includes('META-INF/container.xml');
    return empiezaComoZip && primerArchivo && finalDelZip && tieneContainer;
};

// Subir archivo EPUB
const subirEpub = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ningún archivo' });
        }

        const nombreArchivo = req.file.originalname;

        if (!nombreValido(nombreArchivo)) {
            return res.status(400).json({ error: 'Nombre de archivo no válido' });
        }

        if (!esEpubValido(req.file.buffer)) {
            return res.status(400).json({ error: 'El archivo está dañado o no es un EPUB válido' });
        }

        const { data, error } = await supabase.storage
            .from('epubs')
            .upload(rutaDelUsuario(req, nombreArchivo), req.file.buffer, {
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
            .list(String(req.usuarioId));

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

        if (!nombreValido(nombre)) {
            return res.status(400).json({ error: 'Nombre de archivo no válido' });
        }

        const { data, error } = await supabase.storage
            .from('epubs')
            .createSignedUrl(rutaDelUsuario(req, nombre), 3600); // URL válida por 1 hora

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

        if (!nombreValido(nombre)) {
            return res.status(400).json({ error: 'Nombre de archivo no válido' });
        }

        const { error } = await supabase.storage
            .from('epubs')
            .remove([rutaDelUsuario(req, nombre)]);

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