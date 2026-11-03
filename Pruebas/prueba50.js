const API = 'https://lex-backend-cj7r.onrender.com/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc5MzY2ODQwMywiZXhwIjoxNzk0MjczMjAzfQ.k8fUomkyvtwKdGBJDLF3cKcXwL_0N5MOWdppww0TYHw';
const cuerpo = { ejercicioClave: 'CU-EJ-03', nivelNumero: 1, puntosObtenidos: 10, aciertos: 5, errores: 1 };

const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN };

async function main() {
  const antes = await (await fetch(API + '/progreso', { headers })).json();
  console.log('Antes:', JSON.stringify(antes).slice(0, 300));

  const respuestas = await Promise.all(
    Array.from({ length: 50 }, () =>
      fetch(API + '/progreso/resultado', { method: 'POST', headers, body: JSON.stringify(cuerpo) })
    )
  );
  const estados = respuestas.map(r => r.status);
  console.log('Estados:', estados.join(' '));
  console.log('Correctos:', estados.filter(s => s === 200 || s === 201).length, 'de 50');

  const despues = await (await fetch(API + '/progreso', { headers })).json();
  console.log('Después:', JSON.stringify(despues).slice(0, 300));
}
main();