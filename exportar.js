let asignacionesActuales = []; // Guardamos las asignaciones para exportar

  document.getElementById("formulario").addEventListener("submit", handleFormSubmit);
  document.getElementById("exportarCSV").addEventListener("click", exportarAsignacionesACSV);

  function handleFormSubmit(event) {
    event.preventDefault();

    const legajo = obtenerLegajo();

    if (!validarLegajo(legajo)) {
      alert("Por favor ingresá solo números en el legajo.");
      return;
    }

    const url = construirURL(legajo);

    obtenerAsignaciones(url)
      .then((data) => {
        asignacionesActuales = data.asignaciones || [];
        mostrarAsignacionesPorQuincena(data);
        // Habilitar botón exportar si hay datos
        document.getElementById("exportarCSV").disabled = asignacionesActuales.length === 0;
      })
      .catch((error) => manejarError(error));
  }

  function obtenerLegajo() {
    return document.getElementById("legajo").value.trim();
  }

  function validarLegajo(legajo) {
    const soloNumeros = /^\d+$/;
    return soloNumeros.test(legajo);
  }

  function construirURL(legajo) {
    return `https://asignaciones-proxy-production.up.railway.app/legajo/${legajo}`;
  }

  function obtenerAsignaciones(url) {
    return fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo obtener la información.");
      }
      return response.json();
    });
  }

  function obtenerQuincena(fechaStr) {
    const dia = new Date(fechaStr).getDate();
    return dia <= 15 ? "Primera Quincena" : "Segunda Quincena";
  }

  function agruparPorQuincena(asignaciones) {
    const grupos = {
      "Primera Quincena": [],
      "Segunda Quincena": []
    };

    asignaciones.forEach(asignacion => {
      const quincena = obtenerQuincena(asignacion.fecha);
      grupos[quincena].push(asignacion);
    });

    return grupos;
  }

  function mostrarAsignacionesPorQuincena(data) {
    const listaAsignaciones = document.getElementById("asignaciones");
    listaAsignaciones.innerHTML = "";

    if (!data.asignaciones || data.asignaciones.length === 0) {
      listaAsignaciones.innerHTML = "<li>No hay asignaciones.</li>";
      return;
    }

    const asignacionesPorQuincena = agruparPorQuincena(data.asignaciones);

    for (const quincena in asignacionesPorQuincena) {
      const asignaciones = asignacionesPorQuincena[quincena];
      if (asignaciones.length === 0) continue;

      const titulo = document.createElement("h3");
      titulo.textContent = quincena;
      listaAsignaciones.appendChild(titulo);

      let totalHoras = 0;

      const ul = document.createElement("ul");
      ul.classList.add("lista-quincena");

      asignaciones.forEach((asignacion) => {
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

        ul.appendChild(li);
      });

      const total = document.createElement("li");
      total.innerHTML = `<strong>Total de horas: ${totalHoras.toFixed(2)} hs</strong>`;
      total.classList.add("total-horas");
      ul.appendChild(total);

      listaAsignaciones.appendChild(ul);
    }
  }

  function manejarError(error) {
    console.error(`Error: ${error}`);
    alert("Error al consultar las asignaciones.");
  }

  function calcularHoras(entrada, salida) {
    const [h1, m1] = entrada.split(":").map(Number);
    const [h2, m2] = salida.split(":").map(Number);

    const inicio = new Date(0, 0, 0, h1, m1);
    const fin = new Date(0, 0, salida < entrada ? 1 : 0, h2, m2);

    const diffMs = fin - inicio;
    const diffHoras = diffMs / (1000 * 60 * 60);
    return diffHoras;
  }

  // Convierte array de objetos a CSV
  function convertirArrayObjetosACSV(data) {
    if (!data.length) return "";

    const columnas = Object.keys(data[0]);
    const encabezado = columnas.join(",");

    const filas = data.map(obj => {
      return columnas.map(col => {
        let valor = obj[col] !== null && obj[col] !== undefined ? obj[col].toString() : "";
        if (valor.includes(",") || valor.includes('"')) {
          valor = `"${valor.replace(/"/g, '""')}"`;
        }
        return valor;
      }).join(",");
    });

    return [encabezado, ...filas].join("\r\n");
  }

  // Descarga el CSV generado
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

  // Función que prepara los datos y dispara la descarga CSV
  function exportarAsignacionesACSV() {
    if (asignacionesActuales.length === 0) {
      alert("No hay asignaciones para exportar.");
      return;
    }

    // Preparamos datos con horas calculadas
    const asignacionesConHoras = asignacionesActuales.map(asignacion => ({
      fecha: asignacion.fecha,
      horaEntrada: asignacion.horaEntrada,
      horaSalida: asignacion.horaSalida,
      tienda: asignacion.tienda,
      horasTrabajadas: calcularHoras(asignacion.horaEntrada, asignacion.horaSalida).toFixed(2)
    }));

    const csv = convertirArrayObjetosACSV(asignacionesConHoras);

    const legajo = obtenerLegajo() || "sin_legajo";
    descargarCSV(csv, `asignaciones_legajo_${legajo}.csv`);
  }
