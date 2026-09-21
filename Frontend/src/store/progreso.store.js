import { defineStore } from 'pinia';
import api from '../servicios/api';

export const useProgresoStore = defineStore('progreso', {
    state: () => ({
        puntosTotales: 0,
        rachaActual: 0,
        rachaMaxima: 0,
        historial: [],
        cargado: false,

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

        // Se usará cuando exista el módulo de Ejercicios: manda el
        // resultado de una ronda y actualiza los valores locales con
        // lo que el backend ya recalculó (puntos y racha)
        async registrarResultado(datosResultado) {
            const respuesta = await api.post('/progreso/resultado', datosResultado);
            this.puntosTotales = respuesta.data.progreso.puntos_totales;
            this.rachaActual = respuesta.data.progreso.racha_actual;
            this.rachaMaxima = respuesta.data.progreso.racha_maxima;
            return respuesta.data;
        },
    },
});