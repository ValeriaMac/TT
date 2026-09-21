<!-- vistas/Landing.vue -->
<template>
  <div class="pagina-landing">
    <header class="encabezado-landing">
      <h1 class="logo-landing">lex</h1>
      <p class="lema-landing">Fortalece tu lectura y escritura</p>
    </header>

    <section class="tarjeta-principal">
      <div class="contenido-principal">
        <h2>Aprende a tu ritmo</h2>
        <p>
          Plataforma para mejorar comprensión lectora, fluidez y escritura
          con ejercicios interactivos.
        </p>
        <div class="botones-principales">
          <router-link to="/registro" class="btn-primario">Regístrate</router-link>
          <router-link to="/login" class="btn-secundario">Inicia sesión</router-link>
        </div>
      </div>
      <div class="imagen-principal">
        <img :src="imagenLector" alt="Ilustración de una persona leyendo un libro" class="ilustracion-lector" />
      </div>
    </section>

    <section class="tarjetas-caracteristicas">
      <div class="tarjeta-caracteristica">
        <div class="icono-caracteristica">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <h3>Lectura adaptativa</h3>
        <p>Personaliza fuente, tamaño, espaciado y colores</p>
      </div>
      <div class="tarjeta-caracteristica">
        <div class="icono-caracteristica">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="7" width="20" height="11" rx="5.5"/>
            <path d="M7 11v4M5 13h4"/>
            <circle cx="16" cy="12" r="1"/>
            <circle cx="19" cy="14" r="1"/>
          </svg>
        </div>
        <h3>Ejercicios gamificados</h3>
        <p>Practica comprensión, fluidez, ortografía y más</p>
      </div>
      <div class="tarjeta-caracteristica">
        <div class="icono-caracteristica">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <h3>Sigue tu progreso</h3>
        <p>Gana puntos, insignias y mantén tu racha</p>
      </div>
    </section>

    <p class="pie-landing">Plataforma de apoyo complementaria</p>
  </div>
</template>

<script setup>
import imagenLector from '@/assets/lector.jpg';
</script>

<style scoped>
.pagina-landing {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

.encabezado-landing {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-landing {
  font-size: 2rem;
  color: var(--color-primario);
  margin: 0;
}

.lema-landing {
  color: var(--color-texto-secundario);
}

.tarjeta-principal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2rem;
  background: var(--color-tarjeta);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-tarjeta);
  padding: 2rem;
  margin-bottom: 2rem;
  /* Evita que cualquier hijo (como la caja de la imagen) se salga
     de las esquinas redondeadas si llega a medir más que la tarjeta */
  overflow: hidden;
}

.contenido-principal {
  flex: 1.3;
  min-width: 260px;
}

.contenido-principal h2 {
  margin-top: 0;
}

.botones-principales {
  display: flex;
  gap: 0.8rem;
  margin-top: 1.2rem;
}

.btn-primario,
.btn-secundario {
  padding: 0.7rem 1.4rem;
  border-radius: var(--radio-boton);
  text-decoration: none;
  font-weight: 600;
  border: 1px solid var(--color-borde);
}

.btn-primario {
  background-color: var(--color-primario);
  color: white;
  border: none;
}

.btn-secundario {
  color: var(--color-primario);
  background: transparent;
}

.imagen-principal {
  /* Tamaño fijo (no "flex: 1"), para que no crezca más que la
     tarjeta que la contiene — así se queda como un cuadro modesto,
     igual que en el mockup, en vez de dominar toda la tarjeta */
  width: 220px;
  height: 220px;
  flex-shrink: 0;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f0e8;
  border-radius: var(--radio-tarjeta);
  padding: 1.5rem;
  box-sizing: border-box;
}

.ilustracion-lector {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tarjetas-caracteristicas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.tarjeta-caracteristica {
  background: var(--color-tarjeta);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-tarjeta);
  padding: 1.5rem;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Cuadro chico de color detrás del ícono, igual que en el mockup */
.icono-caracteristica {
  width: 48px;
  height: 48px;
  background: #eef4e8;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primario);
  margin-bottom: 0.9rem;
}

.icono-caracteristica svg {
  width: 24px;
  height: 24px;
}

.tarjeta-caracteristica h3 {
  font-family: var(--fuente-encabezados);
  font-size: 1.15rem;
  margin: 0 0 0.4rem;
}

.tarjeta-caracteristica p {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  line-height: 1.4;
}

.pie-landing {
  text-align: center;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
</style>