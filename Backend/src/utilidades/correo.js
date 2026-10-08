// utilidades/correo.js
// Envío de correos. Dos formas:
//  1) Con BREVO_API_KEY: se manda por HTTPS (API de Brevo). Es la que se usa
//     en Render, porque el plan gratis de Render bloquea los puertos SMTP.
//  2) Sin BREVO_API_KEY: se manda por SMTP (Gmail). Sirve en tu computadora.
const nodemailer = require('nodemailer');

const remitente = () => process.env.CORREO_REMITENTE || process.env.SMTP_USUARIO;

async function enviarConBrevo({ para, asunto, html }) {
    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify({
            sender: { name: 'lex', email: remitente() },
            to: [{ email: para }],
            subject: asunto,
            htmlContent: html,
        }),
        signal: AbortSignal.timeout(15000),
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        throw new Error(`Brevo respondió ${respuesta.status}: ${detalle}`);
    }
}

function crearTransportador() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USUARIO,
            pass: process.env.SMTP_CONTRASENA,
        },
        // Si el servidor no responde, falla rápido en vez de quedarse colgado
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
}

async function enviarCorreo({ para, asunto, html }) {
    if (process.env.BREVO_API_KEY) {
        return enviarConBrevo({ para, asunto, html });
    }
    const transportador = crearTransportador();
    await transportador.sendMail({
        from: remitente(),
        to: para,
        subject: asunto,
        html,
    });
}

module.exports = { enviarCorreo };
