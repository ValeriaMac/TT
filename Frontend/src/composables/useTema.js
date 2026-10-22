import { ref } from 'vue'

// Tema del SISTEMA (claro / oscuro). No toca la personalización visual
// de lectura y escritura, que sigue usando los colores que elige la persona.
const CLAVE = 'tema-sistema'
const tema = ref('claro')

function aplicar(valor) {
  tema.value = valor
  document.documentElement.setAttribute('data-tema', valor === 'oscuro' ? 'oscuro' : 'claro')
}

// Se llama una sola vez al arrancar la app (main.js)
export function iniciarTema() {
  let guardado = null
  try { guardado = localStorage.getItem(CLAVE) } catch (e) { /* sin almacenamiento */ }
  if (!guardado) {
    guardado = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
  }
  aplicar(guardado)
}

export function useTema() {
  function alternarTema() {
    const nuevo = tema.value === 'oscuro' ? 'claro' : 'oscuro'
    aplicar(nuevo)
    try { localStorage.setItem(CLAVE, nuevo) } catch (e) { /* sin almacenamiento */ }
  }
  return { tema, alternarTema }
}
