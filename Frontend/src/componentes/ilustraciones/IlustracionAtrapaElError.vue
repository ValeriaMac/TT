<!--
  Demo animada de "Atrapa el error".
  4 cuadros en bucle:
  1) se muestra la oración con la palabra equivocada marcada
  2) aparece la lupa buscando esa palabra
  3) el usuario escribe la corrección
  4) le da clic a "Comprobar" y aparece el ✓
  Y vuelve a empezar. Todo con CSS, sin JavaScript.
-->
<template>
  <div class="demo-atrapa-error" aria-hidden="true">
    <div class="escenario">
      <!-- Cuadro 1: oración con el error marcado -->
      <div class="cuadro cuadro-1">
        <p class="oracion">
          El perro <span class="palabra-error">corre</span> rapido
        </p>
        <span class="etiqueta">Encuentra el error</span>
      </div>

      <!-- Cuadro 2: la lupa busca la palabra -->
      <div class="cuadro cuadro-2">
        <p class="oracion">
          El perro <span class="palabra-error resaltada">corre</span> rapido
        </p>
        <span class="lupa">🔍</span>
      </div>

      <!-- Cuadro 3: el usuario escribe la corrección -->
      <div class="cuadro cuadro-3">
        <p class="oracion tachada">
          El perro corre rapido
        </p>
        <div class="cuadro-escritura">
          <span class="texto-corregido">rápido</span>
          <span class="lapiz">✏️</span>
        </div>
      </div>

      <!-- Cuadro 4: comprueba y acierta -->
      <div class="cuadro cuadro-4">
        <button class="boton-demo">Comprobar</button>
        <span class="cursor">👆</span>
        <span class="resultado">✓</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Demo decorativa: no recibe props ni emite eventos, solo se anima sola con CSS.
</script>

<style scoped>
.demo-atrapa-error {
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}

.escenario {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  background: var(--color-fondo-suave, rgba(124, 58, 237, 0.06));
  overflow: hidden;
}

.cuadro {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  padding: 14px;
  box-sizing: border-box;
  text-align: center;
}

.oracion {
  margin: 0;
  font-size: 1rem;
  color: var(--color-texto, inherit);
}

.palabra-error {
  color: var(--color-error, #dc2626);
  text-decoration: underline wavy;
}

.palabra-error.resaltada {
  background: rgba(220, 38, 38, 0.15);
  border-radius: 4px;
  padding: 0 4px;
}

.oracion.tachada {
  opacity: 0.6;
}

.etiqueta {
  font-size: 0.8rem;
  color: var(--color-texto-suave, #888);
}

.lupa {
  font-size: 1.8rem;
  animation: mover-lupa 1.6s ease-in-out infinite;
}

@keyframes mover-lupa {
  0%, 100% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
}

.cuadro-escritura {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 2px dashed var(--color-primario);
  border-radius: 8px;
  padding: 6px 12px;
}

.texto-corregido {
  color: var(--color-exito, #16a34a);
  font-weight: bold;
}

.lapiz {
  font-size: 1.1rem;
}

.boton-demo {
  border: none;
  border-radius: 10px;
  background: var(--color-primario);
  color: white;
  padding: 8px 16px;
  font-size: 0.9rem;
}

.cursor {
  font-size: 1.4rem;
}

.resultado {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-exito, #16a34a);
}

/* Cada cuadro aparece y desaparece en su propio turno, como fotogramas de un GIF */
.cuadro-1 { animation: turno-1 9s infinite; }
.cuadro-2 { animation: turno-2 9s infinite; }
.cuadro-3 { animation: turno-3 9s infinite; }
.cuadro-4 { animation: turno-4 9s infinite; }

@keyframes turno-1 { 0%, 20% { opacity: 1; } 22%, 100% { opacity: 0; } }
@keyframes turno-2 { 0%, 22% { opacity: 0; } 24%, 44% { opacity: 1; } 46%, 100% { opacity: 0; } }
@keyframes turno-3 { 0%, 46% { opacity: 0; } 48%, 70% { opacity: 1; } 72%, 100% { opacity: 0; } }
@keyframes turno-4 { 0%, 72% { opacity: 0; } 74%, 98% { opacity: 1; } 100% { opacity: 0; } }

/* Si el usuario prefiere menos movimiento, se queda fijo en el primer cuadro */
@media (prefers-reduced-motion: reduce) {
  .cuadro { animation: none !important; opacity: 0; }
  .cuadro-1 { opacity: 1; }
  .lupa { animation: none; }
}
</style>
