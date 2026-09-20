<!-- vistas/Inicio.vue -->
<template>
  <div class="pagina-inicio">
    <div class="banner-bienvenida">
      <span class="saludo">🦉 ¡Hola, {{ authStore.usuario?.nombre }}! 👋</span>
      <div class="puntos-totales">
        <strong>{{ puntosTotales }}</strong>
        <span>puntos totales</span>
      </div>
    </div>

    <div class="tarjeta-racha">
      <span>🔥 {{ rachaActual }} <small>días</small></span>
      <div class="barra-racha">
        <div class="barra-racha-relleno" :style="{ width: porcentajeRacha + '%' }"></div>
      </div>
    </div>

    <h2>Módulos</h2>
    <div class="grid-modulos">
      <router-link to="/lectura" class="tarjeta-modulo">
        <span class="icono-modulo">📖</span>
        <strong>Lectura</strong>
        <small>Texto a voz</small>
      </router-link>

      <router-link to="/escritura" class="tarjeta-modulo">
        <span class="icono-modulo">🏷️</span>
        <strong>Escritura</strong>
        <small>Edita documentos</small>
      </router-link>

      <!-- Ejercicios todavía no tiene ruta construida -->
      <span class="tarjeta-modulo deshabilitada" title="Próximamente">
        <span class="icono-modulo">🎮</span>
        <strong>Ejercicios</strong>
        <small>Practica</small>
      </span>

      <router-link to="/documentos" class="tarjeta-modulo">
        <span class="icono-modulo">📄</span>
        <strong>Documentos</strong>
        <small>Gestiona textos</small>
      </router-link>
    </div>

    <h2>Insignias recientes</h2>
    <div class="tarjeta-insignias">
      <span v-if="insigniasRecientes.length === 0" class="sin-insignias">
        Todavía no tienes insignias. ¡Sigue practicando!
      </span>
      <span v-else v-for="insignia in insigniasRecientes" :key="insignia.id" class="icono-insignia">
        {{ insignia.emoji }}
      </span>
    </div>

    <div class="banner-donacion">
      <span>💚 Apoya a Lex</span>
      <button class="btn-donar-chico" @click="mostrarModalDonacion = true">Donar</button>
    </div>

    <ModalDonacion :visible="mostrarModalDonacion" @cerrar="mostrarModalDonacion = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth.store';
import ModalDonacion from '@/componentes/ModalDonacion.vue';

const authStore = useAuthStore();

// TEMPORAL: valores fijos en lo que se construye el módulo de Progreso/Insignias.
// Cuando ese backend exista, esto se reemplaza por una llamada real (como
// se hizo con configuracionStore.cargarConfiguracion() en Escritura).
const puntosTotales = ref(0);
const rachaActual = ref(0);
const porcentajeRacha = ref(0);
const insigniasRecientes = ref([]); // ej: [{ id: 1, emoji: '✨' }]

const mostrarModalDonacion = ref(false);
</script>

<style scoped>
.pagina-inicio {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.banner-bienvenida {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-tarjeta);
  border-radius: var(--radio-boton);
  padding: 1.2rem 1.5rem;
  margin-bottom: 1rem;
}

.saludo {
  font-size: 1.1rem;
  font-weight: 600;
}

.puntos-totales {
  text-align: right;
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
}

.puntos-totales strong {
  display: block;
  font-size: 1.3rem;
  color: initial;
}

.tarjeta-racha {
  background: white;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-boton);
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.barra-racha {
  margin-top: 0.5rem;
  height: 6px;
  background: #eee;
  border-radius: 999px;
  overflow: hidden;
}

.barra-racha-relleno {
  height: 100%;
  background: var(--color-primario);
}

.grid-modulos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tarjeta-modulo {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  background: white;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-boton);
  padding: 1.2rem;
  text-decoration: none;
  color: inherit;
}

.tarjeta-modulo small {
  color: var(--color-texto-secundario);
}

.tarjeta-modulo.deshabilitada {
  opacity: 0.5;
  cursor: not-allowed;
}

.icono-modulo {
  font-size: 1.5rem;
}

.tarjeta-insignias {
  background: white;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-boton);
  padding: 1.2rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.8rem;
}

.sin-insignias {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}

.icono-insignia {
  font-size: 1.8rem;
}

.banner-donacion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eef4e8;
  border-radius: var(--radio-boton);
  padding: 1rem 1.5rem;
}

.btn-donar-chico {
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  cursor: pointer;
  font-weight: 600;
}
</style>