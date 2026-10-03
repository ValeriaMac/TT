// composables/useSonidosJuego.js
//
// Sistema de sonido compartido por TODOS los minijuegos. Son tonos
// simples generados con la Web Audio API (sin archivos de audio que
// descargar), igual que ya existía solo dentro de Lluvia.vue — aquí
// se saca a un composable para que cualquier otro juego lo use igual.
//
// Uso en un componente:
//   import { useSonidosJuego } from '../composables/useSonidosJuego';
//   const { sonidoAcierto, sonidoError } = useSonidosJuego();
//   sonidoAcierto();

let audioContext = null;

function obtenerAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function reproducirTono(frecuencia, duracionMs, tipoOnda = 'sine') {
    try {
        const ctx = obtenerAudioContext();
        const oscilador = ctx.createOscillator();
        const ganancia = ctx.createGain();
        oscilador.type = tipoOnda;
        oscilador.frequency.value = frecuencia;
        oscilador.connect(ganancia);
        ganancia.connect(ctx.destination);
        ganancia.gain.setValueAtTime(0.15, ctx.currentTime);
        ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracionMs / 1000);
        oscilador.start();
        oscilador.stop(ctx.currentTime + duracionMs / 1000);
    } catch (error) {
        console.warn('No se pudo reproducir sonido:', error);
    }
}

export function useSonidosJuego() {
    return {
        sonidoAcierto: () => reproducirTono(700, 120),
        sonidoError: () => reproducirTono(180, 220, 'sawtooth'),
        sonidoVidaPerdida: () => reproducirTono(120, 350, 'square'),
        // Un tono distinto y más largo para cuando se completa la ronda entera
        sonidoRondaCompleta: () => reproducirTono(900, 300),
    };
}
