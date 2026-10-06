import { defineStore } from 'pinia';
import api from '../servicios/api';
import { useAuthStore } from './auth.store';

// RF_26 / RT_01: si no hay conexión, los resultados de los ejercicios
// se guardan en el dispositivo (localStorage) y se mandan al servidor
// cuando regresa el internet.
const LLAVE_COLA = 'resultadosPendientes';

function leerCola() {
    try {
        return JSON.parse(localStorage.getItem(LLAVE_COLA)) || [];
    } catch {
        return [];
    }
}

function guardarCola(cola) {
    try {
        localStorage.setItem(LLAVE_COLA, JSON.stringify(cola));
    } catch {
        // si el navegador no deja guardar, no se rompe la app
    }
}

let escuchandoConexion = false;

export const useProgresoStore = defineStore('progreso', {
    state: () => ({
        puntosTotales: 0,
        rachaActual: 0,
        rachaMaxima: 0,
        historial: [],
        cargado: false,
        enLinea: typeof navigator !== 'undefined' ? navigator.onLine : true,
        pendientes: leerCola().length,
        sincronizando: false,
    }),

    actions: {
        async cargarProgreso() {
            const respuesta = await api.get('/progreso');
            this.puntosTotales = respuesta.data.puntos_totales;
            this.rachaActual = respuesta.data.racha_actual;
            this.rachaMaxima = respuesta.data.racha_maxima;
            this.cargado = true;
        },

        async cargarHistorial() {
            const respuesta = await api.get('/progreso/historial');
            this.historial = respuesta.data;
        },

        // Manda el resultado de una ronda y actualiza los valores locales
        // con lo que el backend ya recalculó (puntos y racha). Si no hay
        // conexión, lo guarda en el dispositivo para sincronizarlo después.
        async registrarResultado(datosResultado) {
            try {
                const respuesta = await api.post('/progreso/resultado', datosResultado);
                this.puntosTotales = respuesta.data.progreso.puntos_totales;
                this.rachaActual = respuesta.data.progreso.racha_actual;
                this.rachaMaxima = respuesta.data.progreso.racha_maxima;
                return respuesta.data;
            } catch (error) {
                // Si el servidor SÍ respondió (con un error), no es un problema
                // de conexión: se deja que lo maneje quien llamó
                if (error.response) throw error;

                const authStore = useAuthStore();
                const cola = leerCola();
                cola.push({
                    datos: datosResultado,
                    usuarioId: authStore.usuario?.id ?? null,
                    guardadoEn: new Date().toISOString(),
                });
                guardarCola(cola);
                this.pendientes = cola.length;

                // Se suman los puntos en pantalla; al sincronizar, el valor real
                // lo vuelve a calcular el servidor
                this.puntosTotales += datosResultado.puntosObtenidos || 0;
                return { guardadoLocalmente: true };
            }
        },

        // Manda al servidor los resultados que se guardaron sin conexión
        async sincronizarPendientes() {
            if (this.sincronizando) return;
            const authStore = useAuthStore();
            if (!authStore.estaAutenticado) return;

            const cola = leerCola();
            if (cola.length === 0) {
                this.pendientes = 0;
                return;
            }

            this.sincronizando = true;
            const restantes = [];

            try {
                for (let i = 0; i < cola.length; i++) {
                    const item = cola[i];

                    // Un resultado guardado por otra cuenta se conserva
                    // hasta que esa cuenta vuelva a iniciar sesión
                    const esDeOtraCuenta =
                        item.usuarioId && authStore.usuario?.id && item.usuarioId !== authStore.usuario.id;
                    if (esDeOtraCuenta) {
                        restantes.push(item);
                        continue;
                    }

                    try {
                        await api.post('/progreso/resultado', item.datos);
                    } catch (error) {
                        if (!error.response) {
                            // Sigue sin conexión: se conserva este y todos los demás
                            restantes.push(...cola.slice(i));
                            break;
                        }
                        // El servidor lo rechazó (datos inválidos): se descarta
                        // para que no se quede atorado en la cola para siempre
                        console.warn('Resultado pendiente descartado por el servidor:', error.response.data);
                    }
                }
            } finally {
                guardarCola(restantes);
                this.pendientes = restantes.length;
                this.sincronizando = false;
            }

            if (restantes.length < cola.length) {
                // Ya se sincronizó algo: se actualizan puntos y racha reales
                await this.cargarProgreso().catch(() => {});
            }
        },

        // Se llama una sola vez al arrancar la app (App.vue)
        iniciarSincronizacion() {
            if (escuchandoConexion) return;
            escuchandoConexion = true;

            window.addEventListener('online', () => {
                this.enLinea = true;
                this.sincronizarPendientes();
            });
            window.addEventListener('offline', () => {
                this.enLinea = false;
            });

            if (navigator.onLine) this.sincronizarPendientes();
        },
    },
});
