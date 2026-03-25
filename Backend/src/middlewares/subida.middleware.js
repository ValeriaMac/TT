const multer = require('multer');

const almacenamiento = multer.memoryStorage();

const filtroArchivos = (req, file, cb) => {
    if (file.mimetype === 'application/epub+zip') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos EPUB'), false);
    }
};

const subida = multer({
    storage: almacenamiento,
    fileFilter: filtroArchivos,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

module.exports = subida;