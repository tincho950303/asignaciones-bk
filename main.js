document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();

  const legajo = document.getElementById("legajo").value;
  const regex = /^\d+$/;
  if (!regex.test(legajo)) {
    alert("Por favor ingresá solo números en el legajo.");
    return;
  }

  const servidor = `https://asignaciones-proxy-production.up.railway.app/legajo/${legajo}`;

  fetch(servidor)
    .then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo obtener la información.");
      }
      return response.json();
    })
    .then((data) => {
      const listaAsignaciones = document.getElementById("asignaciones");
      listaAsignaciones.innerHTML = "";

      let totalHoras = 0;

      if (data.asignaciones && data.asignaciones.length > 0) {
        data.asignaciones.forEach((asignacion) => {
          const horas = calcularHoras(asignacion.horaEntrada, asignacion.horaSalida);
          totalHoras += horas;

          const li = document.createElement("li");
          li.classList.add("fila-asignacion");

          li.innerHTML = `
            <span class="col-fecha">${asignacion.fecha}</span>
            <span class="col-hora">${asignacion.horaEntrada} a ${asignacion.horaSalida}</span>
            <span class="col-tiempo">${horas.toFixed(2)} hs</span>
            <span class="col-tienda">${asignacion.tienda}</span>
          `;

          listaAsignaciones.appendChild(li);
        });

        // Mostrar total
        const total = document.createElement("li");
        total.innerHTML = `<strong>Total de horas: ${totalHoras.toFixed(2)} hs</strong>`;
        listaAsignaciones.appendChild(total);
      } else {
        listaAsignaciones.innerHTML = "<li>No hay asignaciones.</li>";
      }
    })
    .catch((error) => {
      console.error(`Error: ${error}`);
      alert("Error al consultar las asignaciones.");
    });
});

// Función para calcular la diferencia de horas
function calcularHoras(entrada, salida) {
  const [h1, m1] = entrada.split(":").map(Number);
  const [h2, m2] = salida.split(":").map(Number);

  const inicio = new Date(0, 0, 0, h1, m1);
  const fin = new Date(0, 0, salida < entrada ? 1 : 0, h2, m2); // cruza medianoche = +1 día

  const diffMs = fin - inicio;
  const diffHoras = diffMs / (1000 * 60 * 60);
  return diffHoras;
}
function convertirArrayObjetosACSV(data) {
  if (!data.length) return "";

  // Obtener las claves (columnas) del primer objeto
  const columnas = Object.keys(data[0]);

  // Crear la fila de encabezados separada por comas
  const encabezado = columnas.join(",");

  // Crear las filas de datos
  const filas = data.map(obj => {
    return columnas.map(col => {
      // Escapar comas o comillas si es necesario
      let valor = obj[col] !== null && obj[col] !== undefined ? obj[col].toString() : "";
      if (valor.includes(",") || valor.includes('"')) {
        valor = `"${valor.replace(/"/g, '""')}"`; // Escapar comillas dobles
      }
      return valor;
    }).join(",");
  });

  // Unir encabezado y filas con salto de línea
  return [encabezado, ...filas].join("\r\n");
}
function descargarCSV(csvString, nombreArchivo = "asignaciones.csv") {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
