document.getElementById("inputExcel").addEventListener("change", handleFile, false);
document.getElementById("showResultsBtn").addEventListener("click", showResults, false);

let avgCol12, avgCol18, stdDev6th, n5th, n6th, confidenceInterval, hypothesisResult;

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData1 = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    generateTable(excelData1, "excelTable1");

    if (workbook.SheetNames.length > 1) {
      const secondSheet = workbook.Sheets[workbook.SheetNames[1]];
      const excelData2 = XLSX.utils.sheet_to_json(secondSheet, { header: 1 });
      addToTable(excelData2, "excelTable1");
    }

    // Calcular los promedios de las columnas 13 y 19
    avgCol12 = calculateAverage(excelData1, 12);
    avgCol18 = calculateAverage(excelData1, 18);

    // Calcular desviación estándar y tamaño de muestra
    stdDev6th = calculateStdDev(excelData1, 18, avgCol18);
    n5th = countValidData(excelData1, 12);
    n6th = countValidData(excelData1, 18);

    // Calcular intervalo de confianza
    confidenceInterval = calculateConfidenceInterval(avgCol12, avgCol18, stdDev6th, n5th, n6th, 0.98);

    // Realizar prueba de hipótesis
    hypothesisResult = testHypothesis(avgCol12, avgCol18, stdDev6th, n6th, 0.05);

    // Mostrar el botón "Mostrar resultados"
    document.getElementById("showResultsBtn").style.display = "block";
  };
  reader.readAsArrayBuffer(file);
}

function showResults() {
  // Mostrar los resultados en el modal
  displayAverage("averageCol13", avgCol12);
  displayAverage("averageCol19", avgCol18);
  displayInterval("confidenceInterval", confidenceInterval);
  displayHypothesisResult("hypothesisResult", hypothesisResult);

  // Mostrar el modal
  $('#resultsModal').modal('show');
}

function calculateAverage(data, colIndex) {
  let sum = 0;
  let count = 0;
  for (let i = 2; i < data.length; i++) {
    const value = parseFloat(data[i][colIndex]);
    if (!isNaN(value)) {
      sum += value;
      count++;
    }
  }
  return count > 0 ? (sum / count).toFixed(2) : 0;
}

function calculateStdDev(data, colIndex, mean) {
  let sum = 0;
  let count = 0;
  for (let i = 2; i < data.length; i++) {
    const value = parseFloat(data[i][colIndex]);
    if (!isNaN(value)) {
      sum += Math.pow(value - mean, 2);
      count++;
    }
  }
  return count > 1 ? Math.sqrt(sum / (count - 1)).toFixed(2) : 0;
}

function countValidData(data, colIndex) {
  let count = 0;
  for (let i = 2; i < data.length; i++) {
    const value = parseFloat(data[i][colIndex]);
    if (!isNaN(value)) {
      count++;
    }
  }
  return count;
}

function calculateConfidenceInterval(mean1, mean2, stdDev, n1, n2, confidenceLevel) {
  const z = confidenceLevel === 0.98 ? 2.33 : 1.96;  // Z-value for 98% or 95% confidence level
  const marginOfError = z * stdDev * Math.sqrt((1 / n1) + (1 / n2));
  const lowerBound = (mean1 - mean2) - marginOfError;
  const upperBound = (mean1 - mean2) + marginOfError;
  return { lowerBound: lowerBound.toFixed(2), upperBound: upperBound.toFixed(2) };
}

function testHypothesis(mean1, mean2, stdDev, n, alpha) {
  const z = (mean2 - mean1) / (stdDev / Math.sqrt(n));
  const criticalValue = 1.645;  // Critical Z-value for one-tailed test at 5% significance
  return z > criticalValue ? "Rechaza H0: Sexto año tiene un promedio mejor." : "No se rechaza H0: No hay evidencia suficiente.";
}

function displayAverage(divId, average) {
  const div = document.getElementById(divId);
  div.textContent = `Promedio: ${average}`;
}

function displayInterval(divId, interval) {
  const div = document.getElementById(divId);
  div.textContent = `Intervalo de confianza al 98%: [${interval.lowerBound}, ${interval.upperBound}]`;
}

function displayHypothesisResult(divId, result) {
  const div = document.getElementById(divId);
  div.textContent = `Resultado de la prueba de hipótesis: ${result}`;
}

function generateTable(data, tableId) {
  const tableHead = document.querySelector(`#${tableId} thead`);
  const tableBody = document.querySelector(`#${tableId} tbody`);
  
  // Limpiar contenido anterior
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  // Crear encabezado
  const headerRow = document.createElement("tr");
  data[0].forEach((cell) => {
    const th = document.createElement("th");
    th.textContent = cell;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // Crear cuerpo de la tabla
  for (let i = 2; i < data.length; i++) {
    let count = 0;
    let rowHtml = "<tr>";
    data[i].forEach((cell, index) => {
      if (count === index) {
        rowHtml += `<td>${cell}</td>`;
      } else {
        for (let j = index - count; j > 0; j--) {
          rowHtml += `<td></td>`;
        }
        rowHtml += `<td>${cell}</td>`;
        count = index;
      }
      count++;
    });
    rowHtml += "</tr>";
    tableBody.innerHTML += rowHtml;
  }
}

function addToTable(data, tableId) {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  for (let i = 2; i < data.length; i++) {
    let count = 0;
    let rowHtml = "<tr>";
    data[i].forEach((cell, index) => {
      if (count === index) {
        rowHtml += `<td>${cell}</td>`;
      } else {
        for (let j = index - count; j > 0; j--) {
          rowHtml += `<td></td>`;
        }
        rowHtml += `<td>${cell}</td>`;
        count = index;
      }
      count++;
    });
    rowHtml += "</tr>";
    tableBody.innerHTML += rowHtml;
  }
}
