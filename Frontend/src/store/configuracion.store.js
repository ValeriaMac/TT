import { defineStore } from 'pinia';
import api from '../servicios/api';

export const useConfiguracionStore = defineStore('configuracion', {
    state: () => ({
        config: null,
        plantillas: [],
        cargando: false,
    }),

    actions: {
        async cargarConfiguracion() {
            this.cargando = true;
            try {
                const respuesta = await api.get('/configuracion');
                this.config = respuesta.data;
            } finally {
                this.cargando = false;
            }
        },

        async guardarConfiguracion(cambios) {
            const respuesta = await api.put('/configuracion', cambios);
            this.config = respuesta.data.configuracion;
        },

        async cargarPlantillas() {
            const respuesta = await api.get('/configuracion/plantillas');
            this.plantillas = respuesta.data;
        },

        async guardarComoPlantilla(nombre) {
            await api.post('/configuracion/plantillas', { nombre });
            await this.cargarPlantillas();
        },

        async aplicarPlantilla(id) {
            const respuesta = await api.post(`/configuracion/plantillas/${id}/aplicar`);
            this.config = respuesta.data.configuracion;
        },

        async eliminarPlantilla(id) {
            await api.delete(`/configuracion/plantillas/${id}`);
            await this.cargarPlantillas();
        },
    },
});