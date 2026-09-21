<template>
  <div class="pagina-ejercicios">
    <h1 class="titulo-pagina">Ejercicios</h1>

    <div class="grid-categorias">
      <div class="tarjeta-categoria">
        <div class="encabezado-categoria">
          <span class="icono-categoria">📖</span>
          <div>
            <h3>Comprensión lectora</h3>
            <p>Textos y preguntas</p>
          </div>
        </div>
        <p class="ejercicio-item deshabilitado">Texto + preguntas trivia — Próximamente</p>
      </div>

      <div class="tarjeta-categoria">
        <div class="encabezado-categoria">
          <span class="icono-categoria">⚡</span>
          <div>
            <h3>Fluidez lectora</h3>
            <p>Velocidad de lectura</p>
          </div>
        </div>
        <p class="ejercicio-item deshabilitado">Cronómetro de lectura — Próximamente</p>
      </div>

      <div class="tarjeta-categoria">
        <div class="encabezado-categoria">
          <span class="icono-categoria">✏️</span>
          <div>
            <h3>Ortografía</h3>
            <p>Escritura correcta</p>
          </div>
        </div>
        <router-link to="/ejercicios/atrapa-error" class="ejercicio-item ejercicio-activo">
          Atrapa el error →
        </router-link>
      </div>

      <div class="tarjeta-categoria">
        <div class="encabezado-categoria">
          <span class="icono-categoria">👁️</span>
          <div>
            <h3>Diferenciación</h3>
            <p>Letras similares</p>
          </div>
        </div>
        <p class="ejercicio-item deshabilitado">Tarjetas de letras — Próximamente</p>
        <p class="ejercicio-item deshabilitado">Lluvia de letras — Próximamente</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.pagina-ejercicios {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.titulo-pagina {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.grid-categorias {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.2rem;
}

.tarjeta-categoria {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.3rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.encabezado-categoria {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.icono-categoria {
  font-size: 1.6rem;
}

.encabezado-categoria h3 {
  font-family: var(--fuente-encabezados);
  font-size: 1.1rem;
}

.encabezado-categoria p {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
}

.ejercicio-item {
  display: block;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  text-decoration: none;
}

.ejercicio-item.deshabilitado {
  color: var(--color-texto-secundario);
  background: #f5f5f0;
  opacity: 0.7;
}

.ejercicio-item.ejercicio-activo {
  background: #eef4e8;
  color: var(--color-primario);
  font-weight: 600;
}

.ejercicio-item.ejercicio-activo:hover {
  background: var(--color-primario);
  color: white;
}
</style>