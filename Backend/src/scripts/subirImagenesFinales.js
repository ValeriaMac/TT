// scripts/subirImagenesFinales.js
//
// Sube el arte final de las mascotas y los accesorios a Cloudinary y
// actualiza imagen_url y nombre en la base de datos.
//
// Todo sale del nombre del archivo:
//   mascotas_insignias/01_koala.png  -> clave "mascota_01_koala", nombre "Koala"
//   accesorios_mascotas/04_lentes.png -> clave "acc_04_lentes",   nombre "Lentes"
// (antes hay que correr el SQL que renombra las claves en Supabase)
//
// Se corre desde la carpeta Backend, con tu .env:
//   node src/scripts/subirImagenesFinales.js "RUTA\mascotas_insignias" "RUTA\accesorios_mascotas"

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cloudinary = require('../utilidades/cloudinary');
const supabase = require('../config/supabase.cliente');

const EXTENSIONES = ['.png', '.jpg', '.jpeg', '.webp'];

// "07_sombrero_sheriff" -> "Sombrero sheriff"
function nombreDesdeArchivo(archivo) {
    const texto = archivo.replace(/^\d+_/, '').replace(/_/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

async function procesar(tabla, prefijoClave, carpetaNube, carpetaLocal) {
    if (!fs.existsSync(carpetaLocal)) {
        console.log(`\n${tabla}: no existe la carpeta ${carpetaLocal}, se omite.`);
        return;
    }

    const archivos = fs
        .readdirSync(carpetaLocal)
        .filter((nombre) => EXTENSIONES.includes(path.extname(nombre).toLowerCase()));

    console.log(`\n${tabla}: ${archivos.length} imágenes en ${carpetaLocal}`);

    for (const nombreArchivo of archivos) {
        const archivo = path.parse(nombreArchivo).name;
        const clave = `${prefijoClave}${archivo}`;
        const nombre = nombreDesdeArchivo(archivo);

        // Primero se revisa que exista en la base, para no subir imágenes de más
        const { data: existe, error: errorBuscar } = await supabase
            .from(tabla)
            .select('id')
            .eq('clave', clave)
            .maybeSingle();
        if (errorBuscar) throw errorBuscar;
        if (!existe) {
            console.log(`  - ${archivo}: no hay ningún elemento con la clave ${clave}, se omite`);
            continue;
        }

        const resultado = await cloudinary.uploader.upload(path.join(carpetaLocal, nombreArchivo), {
            folder: `lex/${carpetaNube}`,
            public_id: archivo,
            overwrite: true,
            invalidate: true,
        });

        const { error } = await supabase
            .from(tabla)
            .update({ imagen_url: resultado.secure_url, nombre })
            .eq('id', existe.id);
        if (error) throw error;

        console.log(`  ✓ ${clave} (${nombre}) -> ${resultado.secure_url}`);
    }
}

async function main() {
    const raiz = path.join(__dirname, '..', '..', 'imagenes_finales');
    const rutaMascotas = process.argv[2] || path.join(raiz, 'mascotas');
    const rutaAccesorios = process.argv[3] || path.join(raiz, 'accesorios');

    console.log('Subiendo imágenes finales a Cloudinary...');
    await procesar('mascotas', 'mascota_', 'mascotas', rutaMascotas);
    await procesar('accesorios', 'acc_', 'accesorios', rutaAccesorios);
    console.log('\nListo.');
    process.exit(0);
}

main().catch((error) => {
    console.error('Error:', error.message || error);
    process.exit(1);
});