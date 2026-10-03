<!--
  Demo animada de "Texto + Trivia".
  6 cuadros en bucle:
  1) se muestra el texto a leer
  2) el usuario le da clic a "Trivia" y el texto se oculta, sale la pregunta
  3) el usuario elige la respuesta correcta
  4) le da clic a "Comprobar" y aparece el ✓
  5) siguiente pregunta, el usuario elige una respuesta equivocada
  6) le da clic a "Comprobar" y aparece el ✗
  Y vuelve a empezar. Todo con CSS, sin JavaScript.
-->
<template>
  <div class="demo-trivia" aria-hidden="true">
    <div class="escenario">
      <!-- Cuadro 1: texto a leer -->
      <div class="cuadro cuadro-1">
        <div class="lineas-texto">
          <span></span><span></span><span></span><span></span>
        </div>
        <span class="etiqueta">Lee con calma</span>
      </div>

      <!-- Cuadro 2: clic en Trivia, aparece la pregunta -->
      <div class="cuadro cuadro-2">
        <button class="boton-demo">Trivia</button>
        <span class="cursor">👆</span>
      </div>

      <!-- Cuadro 3: elige la respuesta correcta -->
      <div class="cuadro cuadro-3">
        <p class="pregunta">¿De qué trataba el texto?</p>
        <div class="opciones">
          <span class="opcion resaltada-bien">Opción 1</span>
          <span class="opcion">Opción 2</span>
        </div>
        <span class="cursor cursor-opcion">👆</span>
      </div>

      <!-- Cuadro 4: comprueba y acierta -->
      <div class="cuadro cuadro-4">
        <button class="boton-demo">Comprobar</button>
        <span class="resultado resultado-bien">✓</span>
      </div>

      <!-- Cuadro 5: siguiente pregunta, elige mal -->
      <div class="cuadro cuadro-5">
        <p class="pregunta">¿Dónde pasó la historia?</p>
        <div class="opciones">
          <span class="opcion">Opción 1</span>
          <span class="opcion resaltada-mal">Opción 2</span>
        </div>
        <span class="cursor cursor-opcion-2">👆</span>
      </div>

      <!-- Cuadro 6: comprueba y falla -->
      <div class="cuadro cuadro-6">
        <button class="boton-demo">Comprobar</button>
        <span class="resultado resultado-mal">✗</span>
        <span class="etiqueta">¿Por qué? →</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Demo decorativa: no recibe props ni emite eventos, solo se anima sola con CSS.
</script>

<style scoped>
.demo-trivia {
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}

.escenario {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  background: var(--color-fondo-suave, rgba(22, 163, 74, 0.06));
  overflow: hidden;
}

.cuadro {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  padding: 12px;
  box-sizing: border-box;
  text-align: center;
}

.lineas-texto {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 80%;
}

.lineas-texto span {
  height: 7px;
  border-radius: 3px;
  background: var(--color-texto-suave, #ccc);
  opacity: 0.6;
}

.etiqueta {
  font-size: 0.8rem;
  color: var(--color-texto-suave, #888);
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

.pregunta {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-texto, inherit);
}

.opciones {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 80%;
}

.opcion {
  border: 1px solid var(--color-texto-suave, #ccc);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 0.8rem;
}

.opcion.resaltada-bien {
  border-color: var(--color-exito, #16a34a);
  background: rgba(22, 163, 74, 0.12);
}

.opcion.resaltada-mal {
  border-color: var(--color-error, #dc2626);
  background: rgba(220, 38, 38, 0.1);
}

.resultado {
  font-size: 1.8rem;
  font-weight: bold;
}

.resultado-bien {
  color: var(--color-exito, #16a34a);
}

.resultado-mal {
  color: var(--color-error, #dc2626);
}

/* Cada cuadro aparece y desaparece en su propio turno, como fotogramas de un GIF */
.cuadro-1 { animation: turno-1 12s infinite; }
.cuadro-2 { animation: turno-2 12s infinite; }
.cuadro-3 { animation: turno-3 12s infinite; }
.cuadro-4 { animation: turno-4 12s infinite; }
.cuadro-5 { animation: turno-5 12s infinite; }
.cuadro-6 { animation: turno-6 12s infinite; }

@keyframes turno-1 { 0%, 14% { opacity: 1; } 16%, 100% { opacity: 0; } }
@keyframes turno-2 { 0%, 16% { opacity: 0; } 18%, 30% { opacity: 1; } 32%, 100% { opacity: 0; } }
@keyframes turno-3 { 0%, 32% { opacity: 0; } 34%, 47% { opacity: 1; } 49%, 100% { opacity: 0; } }
@keyframes turno-4 { 0%, 49% { opacity: 0; } 51%, 63% { opacity: 1; } 65%, 100% { opacity: 0; } }
@keyframes turno-5 { 0%, 65% { opacity: 0; } 67%, 80% { opacity: 1; } 82%, 100% { opacity: 0; } }
@keyframes turno-6 { 0%, 82% { opacity: 0; } 84%, 98% { opacity: 1; } 100% { opacity: 0; } }

/* Si el usuario prefiere menos movimiento, se queda fijo en el primer cuadro */
@media (prefers-reduced-motion: reduce) {
  .cuadro { animation: none !important; opacity: 0; }
  .cuadro-1 { opacity: 1; }
}
</style>
