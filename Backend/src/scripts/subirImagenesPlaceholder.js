// scripts/subirImagenesPlaceholder.js
//
// Script de UNA SOLA VEZ: genera una imagen placeholder sencilla
// (círculo de color + inicial del nombre) para cada mascota y cada
// accesorio, la sube a Cloudinary, y guarda la URL resultante en la
// columna "imagen_url" de la tabla correspondiente.
//
// No se usan emojis dentro de la imagen (los emojis a veces no se
// dibujan bien al generar la imagen en el servidor) — son círculos de
// color simples, solo para no dejar el catálogo vacío mientras subes
// el arte final. El emoji_marcador se sigue usando en el frontend como
// respaldo cuando imagen_url esté vacío, así que no se pierde nada.
//
// Cómo correrlo (desde la carpeta Backend):
//   node scripts/subirImagenesPlaceholder.js

require('dotenv').config();
const sharp = require('sharp');
const cloudinary = require('../utilidades/cloudinary');
const supabase = require('../config/supabase.cliente');

// Un color de fondo distinto por categoría, para distinguirlas a simple vista
const COLOR_POR_CATEGORIA = {
    bienvenida: '#f59e0b',
    primeros_pasos: '#2563eb',
    constancia: '#dc2626',
    lectura: '#7c3aed',
    escritura: '#16a34a',
    perfeccion: '#0891b2',
    maestria: '#ca8a04',
    variedad: '#db2777',
    puntos: '#4f46e5',
};

// Genera un PNG de 256x256: círculo de color + la primera letra del nombre
async function generarImagenPlaceholder(nombre, categoria) {
    const color = COLOR_POR_CATEGORIA[categoria] || '#6b7280';
    const inicial = nombre.trim().charAt(0).toUpperCase();

    const svg = `
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
            <circle cx="128" cy="128" r="120" fill="${color}" />
            <text x="128" y="128" font-size="110" font-family="Arial, sans-serif"
                  font-weight="bold" fill="white" text-anchor="middle"
                  dominant-baseline="central">${inicial}</text>
        </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

// Sube un buffer de imagen a Cloudinary y regresa la URL segura (https)
function subirACloudinary(buffer, carpeta, nombrePublico) {
    return new Promise((resolve, reject) => {
        const flujoDeSubida = cloudinary.uploader.upload_stream(
            { folder: `lex/${carpeta}`, public_id: nombrePublico, overwrite: true },
            (error, resultado) => {
                if (error) return reject(error);
                resolve(resultado.secure_url);
            }
        );
        flujoDeSubida.end(buffer);
    });
}

async function procesarTabla(tabla, carpeta) {
    const { data: items, error } = await supabase.from(tabla).select('id, clave, nombre, categoria');
    if (error) throw error;

    console.log(`\n${tabla}: ${items.length} elementos encontrados`);

    for (const item of items) {
        const buffer = await generarImagenPlaceholder(item.nombre, item.categoria);
        const url = await subirACloudinary(buffer, carpeta, item.clave);

        await supabase.from(tabla).update({ imagen_url: url }).eq('id', item.id);

        console.log(`  ✓ ${item.clave} -> ${url}`);
    }
}

async function main() {
    console.log('Subiendo imágenes placeholder a Cloudinary...');
    await procesarTabla('mascotas', 'mascotas');
    await procesarTabla('accesorios', 'accesorios');
    console.log('\nListo. Ya puedes revisar la carpeta "lex" en tu cuenta de Cloudinary.');
    process.exit(0);
}

main().catch((error) => {
    console.error('Error al subir imágenes:', error);
    process.exit(1);
});
