<!--
  Demo animada del "Cronómetro de lectura".
  4 cuadros en bucle:
  1) libro + reloj, contador de lecturas en "1"
  2) el usuario le da clic a ▶ y el reloj empieza a girar
  3) el usuario le da clic a ■ (terminar) y sale la pregunta "Guardar / Repetir"
  4) el usuario guarda y el contador avanza a "2"
  Y vuelve a empezar. Todo con CSS, sin JavaScript.
-->
<template>
  <div class="demo-cronometro" aria-hidden="true">
    <div class="escenario">
      <!-- Cuadro 1: listo para empezar -->
      <div class="cuadro cuadro-1">
        <div class="fila-superior">
          <span class="icono">📖</span>
          <span class="icono">🕐</span>
        </div>
        <div class="contador">
          <span class="paso activo">1</span>
          <span class="paso">2</span>
          <span class="paso">3</span>
        </div>
        <div class="lineas-texto">
          <span></span><span></span><span></span>
        </div>
        <button class="boton-demo">▶</button>
      </div>

      <!-- Cuadro 2: leyendo, reloj girando -->
      <div class="cuadro cuadro-2">
        <div class="reloj-grande">
          <span class="manecilla">|</span>
        </div>
        <div class="lineas-texto leyendo">
          <span></span><span></span><span></span>
        </div>
        <button class="boton-demo">■</button>
      </div>

      <!-- Cuadro 3: resultado, elegir guardar o repetir -->
      <div class="cuadro cuadro-3">
        <p class="resultado-texto">¡Listo!</p>
        <div class="opciones-resultado">
          <span class="chip chip-bien">✓ Guardar</span>
          <span class="chip chip-mal">↺ Repetir</span>
        </div>
        <span class="cursor">👆</span>
      </div>

      <!-- Cuadro 4: avanza a la siguiente lectura -->
      <div class="cuadro cuadro-4">
        <div class="contador">
          <span class="paso">1</span>
          <span class="paso activo">2</span>
          <span class="paso">3</span>
        </div>
        <p class="resultado-texto">Siguiente lectura</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Demo decorativa: no recibe props ni emite eventos, solo se anima sola con CSS.
</script>

<style scoped>
.demo-cronometro {
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}

.escenario {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  background: var(--color-fondo-suave, rgba(220, 38, 38, 0.06));
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
  padding: 10px;
  box-sizing: border-box;
}

.fila-superior {
  display: flex;
  gap: 10px;
  font-size: 1.6rem;
}

.contador {
  display: flex;
  gap: 8px;
}

.paso {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  background: var(--color-fondo-suave, #eee);
  color: var(--color-texto-suave, #888);
}

.paso.activo {
  background: var(--color-secundario, #dc2626);
  color: white;
  font-weight: bold;
}

.lineas-texto {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 70%;
}

.lineas-texto span {
  height: 6px;
  border-radius: 3px;
  background: var(--color-texto-suave, #ccc);
  opacity: 0.6;
}

.lineas-texto.leyendo span {
  background: var(--color-primario);
  opacity: 0.8;
}

.boton-demo {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--color-primario);
  color: white;
  font-size: 1rem;
}

.reloj-grande {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 3px solid var(--color-secundario, #dc2626);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.manecilla {
  position: absolute;
  font-weight: bold;
  color: var(--color-secundario, #dc2626);
  animation: girar-manecilla-demo 1.8s linear infinite;
  transform-origin: center;
}

@keyframes girar-manecilla-demo {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.resultado-texto {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-texto, inherit);
}

.opciones-resultado {
  display: flex;
  gap: 8px;
}

.chip {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 10px;
}

.chip-bien {
  background: rgba(22, 163, 74, 0.15);
  color: var(--color-exito, #16a34a);
}

.chip-mal {
  background: rgba(220, 38, 38, 0.1);
  color: var(--color-error, #dc2626);
}

.cursor {
  font-size: 1.4rem;
}

/* Cada cuadro aparece y desaparece en su propio turno, como fotogramas de un GIF */
.cuadro-1 { animation: turno-1 10s infinite; }
.cuadro-2 { animation: turno-2 10s infinite; }
.cuadro-3 { animation: turno-3 10s infinite; }
.cuadro-4 { animation: turno-4 10s infinite; }

@keyframes turno-1 { 0%, 18% { opacity: 1; } 20%, 100% { opacity: 0; } }
@keyframes turno-2 { 0%, 20% { opacity: 0; } 22%, 48% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes turno-3 { 0%, 50% { opacity: 0; } 52%, 78% { opacity: 1; } 80%, 100% { opacity: 0; } }
@keyframes turno-4 { 0%, 80% { opacity: 0; } 82%, 98% { opacity: 1; } 100% { opacity: 0; } }

/* Si el usuario prefiere menos movimiento, se queda fijo en el primer cuadro */
@media (prefers-reduced-motion: reduce) {
  .cuadro { animation: none !important; opacity: 0; }
  .cuadro-1 { opacity: 1; }
  .manecilla { animation: none; }
}
</style>
