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
        <IconoLibro />
      </div>
    </section>

    <section class="tarjetas-caracteristicas">
      <div class="tarjeta-caracteristica">
        <IconoLibro />
        <h3>Lectura adaptativa</h3>
        <p>Personaliza fuente, tamaño, espaciado y colores</p>
      </div>
      <div class="tarjeta-caracteristica">
        <IconoCerebro />
        <h3>Ejercicios gamificados</h3>
        <p>Practica comprensión, fluidez, ortografía y más</p>
      </div>
      <div class="tarjeta-caracteristica">
        <IconoProgreso />
        <h3>Sigue tu progreso</h3>
        <p>Gana puntos, insignias y mantén tu racha</p>
      </div>
    </section>

    <p class="pie-landing">Plataforma de apoyo complementaria</p>
  </div>
</template>

<script setup>
// Iconos simples en SVG, sin librerías externas (mismo patrón que App.vue)
const IconoLibro = {
  template: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
}
const IconoCerebro = {
  template: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/></svg>`
}
const IconoProgreso = {
  template: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
}
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
  align-items: center;
  gap: 2rem;
  background: var(--color-tarjeta);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-boton);
  padding: 2rem;
  margin-bottom: 2rem;
}

.contenido-principal {
  flex: 1;
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
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 150px;
  background: #f0f0f0;
  border-radius: var(--radio-boton);
  color: var(--color-primario);
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
  border-radius: var(--radio-boton);
  padding: 1.2rem;
  text-align: center;
  color: var(--color-primario);
}

.tarjeta-caracteristica h3 {
  color: initial;
  margin: 0.5rem 0 0.3rem;
}

.tarjeta-caracteristica p {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}

.pie-landing {
  text-align: center;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
</style>