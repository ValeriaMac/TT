<template>
  <div class="pagina-inicio">

    <!-- Bienvenida -->
    <div class="banner-bienvenida">
      <div class="emoji-bienvenida">🦉</div>
      <div class="texto-bienvenida">
        <h1>¡Hola, {{ authStore.usuario?.nombre }}! 👋</h1>
      </div>
      <div class="puntos-bienvenida">
        <div class="numero-puntos">{{ puntosTotales }}</div>
        <div class="etiqueta-puntos">puntos totales</div>
      </div>
    </div>

    <!-- Racha / progreso -->
    <div class="tarjeta-racha">
      <div class="fila-racha">
        <span class="emoji-racha">🔥</span>
        <div>
          <div class="numero-racha">{{ rachaActual }}</div>
          <div class="etiqueta-racha">días</div>
        </div>
      </div>
      <div class="barra-progreso">
        <div class="barra-progreso-relleno" :style="{ width: porcentajeNivel + '%' }"></div>
      </div>
    </div>

    <!-- Módulos -->
    <h2 class="titulo-seccion">Módulos</h2>
    <div class="grid-modulos">
      <router-link
        v-for="modulo in modulos"
        :key="modulo.titulo"
        :to="modulo.deshabilitado ? '' : modulo.link"
        class="tarjeta-modulo"
        :class="{ deshabilitada: modulo.deshabilitado }"
      >
        <div class="icono-modulo" :style="{ backgroundColor: modulo.colorFondo, color: modulo.colorTexto }">
          <span v-html="modulo.icono"></span>
        </div>
        <h3>{{ modulo.titulo }}</h3>
        <p>{{ modulo.descripcion }}</p>
      </router-link>
    </div>

    <!-- Insignias recientes -->
    <div v-if="insigniasRecientes.length > 0" class="seccion-insignias">
      <div class="encabezado-seccion">
        <h2 class="titulo-seccion">Insignias recientes</h2>
        <router-link to="/insignias" class="enlace-ver-todas">🏆 Ver todas</router-link>
      </div>
      <div class="grid-insignias">
        <div v-for="insignia in insigniasRecientes" :key="insignia.id" class="tarjeta-insignia">
          <div class="emoji-insignia">{{ insignia.emoji }}</div>
        </div>
      </div>
    </div>

    <!-- Banner de donación -->
    <div class="banner-donacion">
      <div class="fila-donacion">
        <span class="emoji-donacion">💚</span>
        <p>Apoya a Lex</p>
      </div>
      <button class="btn-donar" @click="mostrarModalDonacion = true">
        💗 Donar
      </button>
    </div>

    <ModalDonacion :visible="mostrarModalDonacion" @cerrar="mostrarModalDonacion = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/store/auth.store';
import ModalDonacion from '@/componentes/ModalDonacion.vue';

const authStore = useAuthStore();

// TEMPORAL: valores fijos en lo que se construye el módulo de Progreso/Insignias.
const puntosTotales = ref(0);
const rachaActual = ref(0);
const insigniasRecientes = ref([]); // ej: [{ id: 1, emoji: '✨' }]

// Igual que en Dashboard.tsx: el progreso del nivel actual es el
// resto de dividir los puntos entre 100
const porcentajeNivel = computed(() => (puntosTotales.value % 100) / 100 * 100);

const mostrarModalDonacion = ref(false);

// Iconos como SVG simples inline (mismo patrón que App.vue), para no
// depender de una librería externa como lucide-react
const modulos = [
  {
    titulo: 'Lectura',
    descripcion: 'Texto a voz',
    link: '/lectura',
    colorFondo: '#dbeafe',
    colorTexto: '#2563eb',
    icono: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  },
  {
    titulo: 'Escritura',
    descripcion: 'Edita documentos',
    link: '/escritura',
    colorFondo: '#ede9fe',
    colorTexto: '#7c3aed',
    icono: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
  },
  {
    titulo: 'Ejercicios',
    descripcion: 'Practica',
    link: '/ejercicios',
    deshabilitado: true, // esta ruta todavía no existe
    colorFondo: '#dcfce7',
    colorTexto: '#16a34a',
    icono: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/></svg>',
  },
  {
    titulo: 'Documentos',
    descripcion: 'Gestiona textos',
    link: '/documentos',
    colorFondo: '#ffedd5',
    colorTexto: '#ea580c',
    icono: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  },
];
</script>

<style scoped>
.pagina-inicio {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem;
}

.banner-bienvenida {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(to right, #eef4e8, #f5f0dd);
  border-radius: var(--radio-tarjeta);
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.emoji-bienvenida {
  font-size: 3.5rem;
}

.texto-bienvenida {
  flex: 1;
}

.texto-bienvenida h1 {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
}

.puntos-bienvenida {
  text-align: right;
}

.numero-puntos {
  font-size: 2rem;
  color: var(--color-primario);
}

.etiqueta-puntos {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
}

.tarjeta-racha {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.fila-racha {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.emoji-racha {
  font-size: 1.5rem;
}

.numero-racha {
  font-size: 1.5rem;
}

.etiqueta-racha {
  font-size: 0.75rem;
  color: var(--color-texto-secundario);
}

.barra-progreso {
  height: 10px;
  background: #eee;
  border-radius: 999px;
  overflow: hidden;
}

.barra-progreso-relleno {
  height: 100%;
  background: var(--color-primario);
  transition: width 0.3s;
}

.titulo-seccion {
  font-family: var(--fuente-encabezados);
  font-size: 1.5rem;
  margin-bottom: 1.2rem;
}

.grid-modulos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.2rem;
  margin-bottom: 2rem;
}

.tarjeta-modulo {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
  display: block;
}

.tarjeta-modulo:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.tarjeta-modulo.deshabilitada {
  opacity: 0.5;
  pointer-events: none;
}

.icono-modulo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.tarjeta-modulo h3 {
  font-family: var(--fuente-encabezados);
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
}

.tarjeta-modulo p {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
}

.encabezado-seccion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.enlace-ver-todas {
  color: var(--color-texto-secundario);
  text-decoration: none;
  font-size: 0.9rem;
}

.seccion-insignias {
  margin-bottom: 2rem;
}

.grid-insignias {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.tarjeta-insignia {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.emoji-insignia {
  font-size: 2.5rem;
}

.banner-donacion {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: linear-gradient(to right, #eef4e8, #f0ead9);
  border-radius: var(--radio-tarjeta);
  padding: 1.2rem 1.5rem;
}

.fila-donacion {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.emoji-donacion {
  font-size: 2rem;
}

.fila-donacion p {
  font-weight: 500;
  font-size: 1.1rem;
}

.btn-donar {
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: var(--radio-boton);
  padding: 0.6rem 1.3rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-donar:hover {
  background-color: var(--color-primario-hover);
}
</style>