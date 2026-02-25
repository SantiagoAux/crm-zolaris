/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          CRM SOLAR – CRUD CLIENTES / LEADS POTENCIALES             ║
 * ║          Google Apps Script (.gs)                                   ║
 * ║                                                                     ║
 * ║  Hoja de cálculo esperada: "Clientes - Leads Potenciales"           ║
 * ║  Columnas (en orden):                                               ║
 * ║   A: Fecha          B: Nombre         C: Telefono                  ║
 * ║   D: Ubicacion      E: Motivo         F: Tipo Alerta               ║
 * ║   G: Valor Propuesta H: Potencia      I: Ahorro                    ║
 * ║   J: Beneficios     K: Paneles        L: Produccion Anual          ║
 * ║   M: Etapa          N: Notas                                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 *  INSTRUCCIONES DE USO:
 *  1. Abre tu Google Spreadsheet con la hoja "Clientes - Leads Potenciales".
 *  2. Ve a Extensiones > Apps Script y pega este archivo.
 *  3. Guarda y recarga la hoja → verás el menú "📋 CRM Clientes".
 *  4. La primera fila debe contener los encabezados (se crea automáticamente
 *     si la hoja está vacía).
 */

// ─── CONSTANTES ─────────────────────────────────────────────────────────────

/** Nombre exacto de la hoja en el Spreadsheet */
const SHEET_NAME = "Clientes - Leads Potenciales";
const USUARIOS_SHEET_NAME = "Usuarios";

/** Encabezados de usuarios */
const USUARIOS_HEADERS = ["ID", "Email", "Password", "Nombre", "Rol", "Activo"];

/** Encabezados de columna en orden estricto */
const HEADERS = [
  "Fecha",
  "Nombre",
  "Telefono",
  "Ubicacion",
  "Motivo",
  "Tipo Alerta",
  "Valor Propuesta",
  "Potencia",
  "Ahorro",
  "Beneficios",
  "Paneles",
  "Produccion Anual",
  "Etapa",
  "Notas",
  "Embajador",
];

/** Etapas válidas del pipeline */
const ETAPAS_VALIDAS = ["contacto", "cotizacion", "negociacion", "cierre_ganado", "cierre_perdido"];

// ─── MENÚ PERSONALIZADO ──────────────────────────────────────────────────────

/**
 * Se ejecuta automáticamente al abrir el Spreadsheet.
 * Crea el menú CRM en la barra de herramientas.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📋 CRM Clientes")
    .addItem("➕ Crear nuevo cliente", "abrirFormularioCrear")
    .addSeparator()
    .addItem("🔍 Buscar cliente por nombre", "buscarClientePorNombre")
    .addItem("📊 Ver todos los clientes", "verTodosLosClientes")
    .addSeparator()
    .addItem("✏️ Editar cliente seleccionado", "editarClienteSeleccionado")
    .addItem("🗑️ Eliminar cliente seleccionado", "eliminarClienteSeleccionado")
    .addSeparator()
    .addItem("🛠️ Inicializar hoja (headers)", "inicializarHoja")
    .addToUi();
}

// ─── UTILIDADES DE HOJA ──────────────────────────────────────────────────────

/**
 * Obtiene la hoja "Clientes - Leads Potenciales".
 * Si no existe, la crea y agrega los encabezados.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    _escribirHeaders(sheet);
  }
  return sheet;
}

/**
 * Escribe los encabezados en la fila 1 con formato.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function _escribirHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  headerRange
    .setFontWeight("bold")
    .setBackground("#1a3a5c")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

/**
 * Inicializa la hoja: crea encabezados si la primera fila está vacía.
 * También redimensiona las columnas.
 */
function inicializarHoja() {
  const sheet = getSheet();
  const firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell || firstCell.toString().trim() === "") {
    _escribirHeaders(sheet);
  }
  // Ajustar anchos de columna
  sheet.setColumnWidth(1, 140); // Fecha
  sheet.setColumnWidth(2, 160); // Nombre
  sheet.setColumnWidth(3, 140); // Telefono
  sheet.setColumnWidth(4, 120); // Ubicacion
  sheet.setColumnWidth(5, 260); // Motivo
  sheet.setColumnWidth(6, 160); // Tipo Alerta
  sheet.setColumnWidth(7, 140); // Valor Propuesta
  sheet.setColumnWidth(8, 110); // Potencia
  sheet.setColumnWidth(9, 110); // Ahorro
  sheet.setColumnWidth(10, 120); // Beneficios
  sheet.setColumnWidth(11, 80);  // Paneles
  sheet.setColumnWidth(12, 150); // Produccion Anual
  sheet.setColumnWidth(13, 110); // Etapa
  sheet.setColumnWidth(14, 220); // Notas
  sheet.setColumnWidth(15, 160); // Embajador

  SpreadsheetApp.getUi().alert("✅ Hoja inicializada correctamente.");
}

/**
 * Genera un ID de fila basado en timestamp + random para unicidad.
 * (Interno: no se almacena en hoja, se usa la fila como índice)
 * @returns {string}
 */
function _generarId() {
  return Utilities.getUuid();
}

/**
 * Convierte una fila de datos (array) en un objeto Lead.
 * @param {Array} row - Array con valores de la fila.
 * @param {number} rowIndex - Número de fila en la hoja (1-based).
 * @returns {Object} Lead
 */
function _rowToLead(row, rowIndex) {
  return {
    _fila: rowIndex,
    fecha: row[0] ? row[0].toString() : "",
    nombre: row[1] ? row[1].toString() : "",
    telefono: row[2] ? row[2].toString() : "",
    ubicacion: row[3] ? row[3].toString() : "",
    motivo: row[4] ? row[4].toString() : "",
    tipoAlerta: row[5] ? row[5].toString() : "",
    valorPropuesta: _parsearNumero(row[6]),
    potencia: row[7] ? row[7].toString() : "",
    ahorro: _parsearNumero(row[8]),
    beneficios: _parsearNumero(row[9]),
    paneles: parseInt(row[10]) || 0,
    produccionAnual: row[11] ? row[11].toString() : "",
    etapa: row[12] ? row[12].toString().toLowerCase() : "contacto",
    notas: row[13] ? row[13].toString() : "",
    embajador: row[14] ? row[14].toString() : "",
  };
}

/**
 * Convierte un objeto Lead en array de valores para la hoja.
 * @param {Object} lead
 * @returns {Array}
 */
function _leadToRow(lead) {
  return [
    lead.fecha || _getFechaActual(),
    lead.nombre || "",
    lead.telefono || "",
    lead.ubicacion || "",
    lead.motivo || "Cliente Potencial detectado (>300 kWh)",
    lead.tipoAlerta || "OPORTUNIDAD VENTA",
    lead.valorPropuesta || 0,
    lead.potencia || "",
    lead.ahorro || 0,
    lead.beneficios || 0,
    lead.paneles || 0,
    lead.produccionAnual || "",
    lead.etapa || "contacto",
    lead.notas || "",
    lead.embajador || "",
  ];
}

/**
 * Parsea un número desde string con formatos COP ($1.234.567) o número.
 * @param {*} valor
 * @returns {number}
 */
function _parsearNumero(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return valor;
  const limpio = valor.toString().replace(/[$\s.]/g, "").replace(",", ".");
  return parseFloat(limpio) || 0;
}

/**
 * Retorna la fecha/hora actual en formato "YYYY-MM-DD HH:MM".
 * @returns {string}
 */
function _getFechaActual() {
  var now = new Date();
  return now.getFullYear() + "-" +
    _pad2(now.getMonth() + 1) + "-" +
    _pad2(now.getDate()) + " " +
    _pad2(now.getHours()) + ":" +
    _pad2(now.getMinutes());
}

/**
 * Rellena un número con cero a la izquierda (reemplaza padStart).
 * @param {number} n
 * @returns {string}
 */
function _pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

/**
 * Formatea un número como moneda COP.
 * Compatible con Rhino y V8 (NO usa Intl.NumberFormat).
 * Ejemplo: 15422149 → "$15.422.149"
 * @param {number} valor
 * @returns {string}
 */
function _formatCOP(valor) {
  if (isNaN(valor) || valor === null || valor === undefined) return "$0";
  var num = Math.round(Number(valor));
  var negativo = num < 0;
  var abs = negativo ? -num : num;
  var str = abs.toString();
  var resultado = "";
  var contador = 0;
  for (var i = str.length - 1; i >= 0; i--) {
    if (contador > 0 && contador % 3 === 0) resultado = "." + resultado;
    resultado = str[i] + resultado;
    contador++;
  }
  return (negativo ? "-$" : "$") + resultado;
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo cliente/lead en la hoja.
 *
 * @param {Object} lead - Objeto con los campos del cliente.
 *   Campos requeridos: nombre, telefono, ubicacion
 *   Campos opcionales: fecha, motivo, tipoAlerta, valorPropuesta,
 *                      potencia, ahorro, beneficios, paneles,
 *                      produccionAnual, etapa, notas
 * @returns {Object} Resultado con { ok, mensaje, fila }
 *
 * @example
 *   crearCliente({
 *     nombre: "Carlos Martínez",
 *     telefono: "573229132643",
 *     ubicacion: "Pasto",
 *     valorPropuesta: 15422149,
 *     potencia: "3.71 kWp",
 *     ahorro: 287580,
 *     beneficios: 6168860,
 *     paneles: 6,
 *     produccionAnual: "4,948 kWh/año",
 *     etapa: "cotizacion"
 *   });
 */
function crearCliente(lead) {
  try {
    // Validaciones
    if (!lead || typeof lead !== "object") {
      return { ok: false, mensaje: "Debe proporcionar un objeto lead válido." };
    }
    if (!lead.nombre || lead.nombre.toString().trim() === "") {
      return { ok: false, mensaje: "El campo 'nombre' es obligatorio." };
    }
    if (!lead.telefono || lead.telefono.toString().trim() === "") {
      return { ok: false, mensaje: "El campo 'telefono' es obligatorio." };
    }
    if (!lead.ubicacion || lead.ubicacion.toString().trim() === "") {
      return { ok: false, mensaje: "El campo 'ubicacion' es obligatorio." };
    }
    if (lead.etapa && !ETAPAS_VALIDAS.includes(lead.etapa.toLowerCase())) {
      return {
        ok: false,
        mensaje: `Etapa inválida. Valores permitidos: ${ETAPAS_VALIDAS.join(", ")}`,
      };
    }

    const sheet = getSheet();
    const ultimaFila = sheet.getLastRow();
    const nuevaFila = ultimaFila + 1;

    // Asignar fecha si no viene
    if (!lead.fecha) lead.fecha = _getFechaActual();
    if (!lead.etapa) lead.etapa = "contacto";

    const rowData = _leadToRow(lead);
    sheet.getRange(nuevaFila, 1, 1, HEADERS.length).setValues([rowData]);

    // Formato alternado de filas para legibilidad
    const bgColor = nuevaFila % 2 === 0 ? "#f0f4f8" : "#ffffff";
    sheet.getRange(nuevaFila, 1, 1, HEADERS.length).setBackground(bgColor);

    return {
      ok: true,
      mensaje: `✅ Cliente "${lead.nombre}" creado en la fila ${nuevaFila}.`,
      fila: nuevaFila,
    };
  } catch (e) {
    return { ok: false, mensaje: "Error al crear cliente: " + e.message };
  }
}

/**
 * Abre el diálogo interactivo para crear un cliente (menú).
 */
function abrirFormularioCrear() {
  const ui = SpreadsheetApp.getUi();

  const nombre = ui.prompt("➕ Nuevo Cliente", "Nombre completo:", ui.ButtonSet.OK_CANCEL);
  if (nombre.getSelectedButton() !== ui.Button.OK) return;

  const telefono = ui.prompt("➕ Nuevo Cliente", "Teléfono (ej: 573229132643):", ui.ButtonSet.OK_CANCEL);
  if (telefono.getSelectedButton() !== ui.Button.OK) return;

  const ubicacion = ui.prompt("➕ Nuevo Cliente", "Ciudad / Ubicación:", ui.ButtonSet.OK_CANCEL);
  if (ubicacion.getSelectedButton() !== ui.Button.OK) return;

  const valorPropuesta = ui.prompt("➕ Nuevo Cliente", "Valor Propuesta (número, sin $):", ui.ButtonSet.OK_CANCEL);
  if (valorPropuesta.getSelectedButton() !== ui.Button.OK) return;

  const potencia = ui.prompt("➕ Nuevo Cliente", "Potencia instalada (ej: 3.71 kWp):", ui.ButtonSet.OK_CANCEL);
  if (potencia.getSelectedButton() !== ui.Button.OK) return;

  const ahorro = ui.prompt("➕ Nuevo Cliente", "Ahorro mensual (número, sin $):", ui.ButtonSet.OK_CANCEL);
  if (ahorro.getSelectedButton() !== ui.Button.OK) return;

  const beneficios = ui.prompt("➕ Nuevo Cliente", "Beneficios totales (número, sin $):", ui.ButtonSet.OK_CANCEL);
  if (beneficios.getSelectedButton() !== ui.Button.OK) return;

  const paneles = ui.prompt("➕ Nuevo Cliente", "Número de paneles:", ui.ButtonSet.OK_CANCEL);
  if (paneles.getSelectedButton() !== ui.Button.OK) return;

  const produccionAnual = ui.prompt("➕ Nuevo Cliente", "Producción Anual (ej: 4,948 kWh/año):", ui.ButtonSet.OK_CANCEL);
  if (produccionAnual.getSelectedButton() !== ui.Button.OK) return;

  const etapaPrompt = ui.prompt(
    "➕ Nuevo Cliente",
    "Etapa del pipeline:\n[contacto | cotizacion | negociacion | cierre_ganado | cierre_perdido]",
    ui.ButtonSet.OK_CANCEL
  );
  if (etapaPrompt.getSelectedButton() !== ui.Button.OK) return;

  const notas = ui.prompt("➕ Nuevo Cliente", "Notas adicionales (opcional):", ui.ButtonSet.OK_CANCEL);

  const resultado = crearCliente({
    nombre: nombre.getResponseText(),
    telefono: telefono.getResponseText(),
    ubicacion: ubicacion.getResponseText(),
    valorPropuesta: parseFloat(valorPropuesta.getResponseText()) || 0,
    potencia: potencia.getResponseText(),
    ahorro: parseFloat(ahorro.getResponseText()) || 0,
    beneficios: parseFloat(beneficios.getResponseText()) || 0,
    paneles: parseInt(paneles.getResponseText()) || 0,
    produccionAnual: produccionAnual.getResponseText(),
    etapa: etapaPrompt.getResponseText().trim().toLowerCase() || "contacto",
    notas: notas.getSelectedButton() === ui.Button.OK ? notas.getResponseText() : "",
  });

  ui.alert(resultado.ok ? "✅ Éxito" : "❌ Error", resultado.mensaje, ui.ButtonSet.OK);
}

// ─── READ ────────────────────────────────────────────────────────────────────

/**
 * Lee todos los clientes de la hoja.
 * @param {string} filtroEmbajador - Opcional: email/nombre del embajador para filtrar.
 * @returns {Object[]} Lista de leads.
 */
function leerTodosLosClientes(filtroEmbajador) {
  const sheet = getSheet();
  const ultimaFila = sheet.getLastRow();
  if (ultimaFila < 2) return [];

  const datos = sheet.getRange(2, 1, ultimaFila - 1, HEADERS.length).getValues();
  let leads = datos.map((fila, i) => _rowToLead(fila, i + 2));

  // Ignorar filas vacías (leads con nombre vacío)
  leads = leads.filter((lead) => lead.nombre.trim() !== "");

  if (filtroEmbajador) {
    return leads.filter(l => l.embajador && l.embajador.toLowerCase() === filtroEmbajador.toLowerCase());
  }
  
  return leads;
}

/**
 * Busca clientes por nombre (búsqueda parcial, insensible a mayúsculas).
 *
 * @param {string} nombre - Texto a buscar.
 * @returns {Object[]} Array de Leads que coinciden.
 *
 * @example
 *   const resultados = buscarClientesPorNombre("carlos");
 *   // → [{ nombre: "Carlos Martínez", ... }]
 */
function buscarClientesPorNombre(nombre) {
  if (!nombre) return [];
  const todos = leerTodosLosClientes();
  const busqueda = nombre.toString().toLowerCase().trim();
  return todos.filter((l) => l.nombre.toLowerCase().includes(busqueda));
}

/**
 * Obtiene un cliente por número de fila exacto.
 *
 * @param {number} fila - Número de fila en la hoja (≥ 2).
 * @returns {Object|null} Lead o null si no existe.
 */
function leerClientePorFila(fila) {
  if (!fila || fila < 2) return null;
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (fila > lastRow) return null;

  const row = sheet.getRange(fila, 1, 1, HEADERS.length).getValues()[0];
  return _rowToLead(row, fila);
}

/**
 * Busca clientes por etapa del pipeline.
 *
 * @param {string} etapa - "contacto" | "cotizacion" | "negociacion" | "cierre"
 * @returns {Object[]} Array de Leads en esa etapa.
 */
function leerClientesPorEtapa(etapa) {
  const todos = leerTodosLosClientes();
  return todos.filter((l) => l.etapa.toLowerCase() === etapa.toLowerCase());
}

/**
 * Busca clientes por ciudad/ubicación.
 *
 * @param {string} ciudad
 * @returns {Object[]} Array de Leads en esa ciudad.
 */
function leerClientesPorCiudad(ciudad) {
  const todos = leerTodosLosClientes();
  return todos.filter((l) =>
    l.ubicacion.toLowerCase().includes(ciudad.toLowerCase())
  );
}

/**
 * Calcula KPIs básicos del pipeline.
 * @returns {Object} { total, porEtapa, valorTotal, ahorroTotal }
 */
function obtenerKPIs() {
  const todos = leerTodosLosClientes();
  const porEtapa = {};
  ETAPAS_VALIDAS.forEach((e) => (porEtapa[e] = 0));

  let valorTotal = 0;
  let ahorroTotal = 0;

  todos.forEach((l) => {
    porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1;
    valorTotal += l.valorPropuesta || 0;
    ahorroTotal += l.ahorro || 0;
  });

  return {
    total: todos.length,
    porEtapa,
    valorTotal,
    valorTotalFormateado: _formatCOP(valorTotal),
    ahorroTotal,
    ahorroTotalFormateado: _formatCOP(ahorroTotal),
  };
}

/**
 * Muestra un diálogo con todos los clientes (menú).
 */
function verTodosLosClientes() {
  const ui = SpreadsheetApp.getUi();
  const clientes = leerTodosLosClientes();
  const kpis = obtenerKPIs();

  if (clientes.length === 0) {
    ui.alert("📊 Clientes", "No hay clientes registrados aún.", ui.ButtonSet.OK);
    return;
  }

  let mensaje = `📊 RESUMEN CRM (${clientes.length} clientes)\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💰 Valor total pipeline: ${kpis.valorTotalFormateado}\n`;
  mensaje += `💡 Ahorro total: ${kpis.ahorroTotalFormateado}\n\n`;
  mensaje += `📌 Por etapa:\n`;
  ETAPAS_VALIDAS.forEach((e) => {
    mensaje += `   • ${e}: ${kpis.porEtapa[e]} cliente(s)\n`;
  });
  mensaje += `\n👥 Lista de clientes:\n━━━━━━━━━━━━━━━━━━━\n`;

  clientes.slice(0, 20).forEach((c, i) => {
    mensaje += `${i + 1}. [Fila ${c._fila}] ${c.nombre} – ${c.ubicacion} – ${c.etapa}\n`;
  });
  if (clientes.length > 20) mensaje += `... y ${clientes.length - 20} más.`;

  ui.alert("📊 CRM – Todos los Clientes", mensaje, ui.ButtonSet.OK);
}

/**
 * Diálogo de búsqueda por nombre (menú).
 */
function buscarClientePorNombre() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt("🔍 Buscar Cliente", "Ingresa el nombre (parcial o completo):", ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const resultados = buscarClientesPorNombre(resp.getResponseText());
  if (resultados.length === 0) {
    ui.alert("🔍 Resultado", "No se encontraron clientes con ese nombre.", ui.ButtonSet.OK);
    return;
  }

  let msg = `Se encontraron ${resultados.length} resultado(s):\n\n`;
  resultados.forEach((c) => {
    msg += `📌 Fila ${c._fila}: ${c.nombre}\n`;
    msg += `   📍 ${c.ubicacion} | 📞 ${c.telefono}\n`;
    msg += `   💰 ${_formatCOP(c.valorPropuesta)} | ⚡ ${c.potencia}\n`;
    msg += `   🔖 Etapa: ${c.etapa}\n\n`;
  });

  ui.alert("🔍 Resultados de búsqueda", msg, ui.ButtonSet.OK);
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

/**
 * Actualiza un cliente existente por número de fila.
 *
 * @param {number} fila - Número de fila en la hoja (≥ 2).
 * @param {Object} cambios - Objeto con SOLO los campos a actualizar.
 *   No es necesario pasar todos los campos, solo los que cambian.
 * @returns {Object} Resultado con { ok, mensaje }
 *
 * @example
 *   actualizarCliente(3, { etapa: "negociacion", notas: "Llamada agendada" });
 *   actualizarCliente(5, { valorPropuesta: 38000000, paneles: 14 });
 */
function actualizarCliente(fila, cambios) {
  try {
    const leadActual = leerClientePorFila(fila);
    if (!leadActual) {
      return { ok: false, mensaje: `No existe un cliente en la fila ${fila}.` };
    }

    // Validar etapa si se está cambiando
    if (cambios.etapa && !ETAPAS_VALIDAS.includes(cambios.etapa.toLowerCase())) {
      return {
        ok: false,
        mensaje: `Etapa inválida. Valores permitidos: ${ETAPAS_VALIDAS.join(", ")}`,
      };
    }

    // Merge: combinar datos actuales con los cambios
    const leadActualizado = Object.assign({}, leadActual, cambios);
    const rowData = _leadToRow(leadActualizado);

    const sheet = getSheet();
    sheet.getRange(fila, 1, 1, HEADERS.length).setValues([rowData]);

    return {
      ok: true,
      mensaje: `✅ Cliente "${leadActualizado.nombre}" actualizado en fila ${fila}.`,
    };
  } catch (e) {
    return { ok: false, mensaje: "Error al actualizar cliente: " + e.message };
  }
}

/**
 * Actualiza únicamente la etapa/pipeline de un lead.
 *
 * @param {number} fila - Número de fila.
 * @param {string} nuevaEtapa - "contacto" | "cotizacion" | "negociacion" | "cierre"
 * @returns {Object} Resultado con { ok, mensaje }
 *
 * @example
 *   actualizarEtapa(4, "cierre");
 */
function actualizarEtapa(fila, nuevaEtapa) {
  if (!ETAPAS_VALIDAS.includes(nuevaEtapa.toLowerCase())) {
    return { ok: false, mensaje: `Etapa inválida: ${nuevaEtapa}` };
  }
  return actualizarCliente(fila, { etapa: nuevaEtapa.toLowerCase() });
}

/**
 * Agrega una nota a un cliente (se concatena con las existentes).
 *
 * @param {number} fila
 * @param {string} nota
 * @returns {Object} Resultado con { ok, mensaje }
 *
 * @example
 *   agregarNota(2, "Llamada agendada para el 25/02 a las 10 AM");
 */
function agregarNota(fila, nota) {
  const lead = leerClientePorFila(fila);
  if (!lead) return { ok: false, mensaje: `No existe cliente en fila ${fila}.` };

  const fechaNota = _getFechaActual();
  const notasExistentes = lead.notas ? lead.notas + "\n" : "";
  const nuevaNota = `[${fechaNota}] ${nota}`;

  return actualizarCliente(fila, { notas: notasExistentes + nuevaNota });
}

/**
 * Diálogo interactivo de edición (menú) – edita la fila actualmente seleccionada.
 */
function editarClienteSeleccionado() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet();
  const filaActiva = sheet.getActiveRange().getRow();

  if (filaActiva < 2) {
    ui.alert("⚠️ Aviso", "Selecciona una fila de datos (no el encabezado).", ui.ButtonSet.OK);
    return;
  }

  const leadActual = leerClientePorFila(filaActiva);
  if (!leadActual || !leadActual.nombre) {
    ui.alert("⚠️ Aviso", "La fila seleccionada no contiene datos de cliente.", ui.ButtonSet.OK);
    return;
  }

  ui.alert(
    "✏️ Editar Cliente",
    `Editando: "${leadActual.nombre}" (Fila ${filaActiva})\n\nDeja el campo vacío para mantener el valor actual.`,
    ui.ButtonSet.OK
  );

  const campos = [
    { key: "nombre",        label: "Nombre",                actual: leadActual.nombre },
    { key: "telefono",      label: "Teléfono",              actual: leadActual.telefono },
    { key: "ubicacion",     label: "Ciudad / Ubicación",    actual: leadActual.ubicacion },
    { key: "valorPropuesta",label: "Valor Propuesta (num)", actual: leadActual.valorPropuesta },
    { key: "potencia",      label: "Potencia (ej: 3.71 kWp)", actual: leadActual.potencia },
    { key: "ahorro",        label: "Ahorro mensual (num)",  actual: leadActual.ahorro },
    { key: "beneficios",    label: "Beneficios (num)",      actual: leadActual.beneficios },
    { key: "paneles",       label: "Número de paneles",     actual: leadActual.paneles },
    { key: "produccionAnual", label: "Producción Anual",    actual: leadActual.produccionAnual },
    {
      key: "etapa",
      label: "Etapa [contacto|cotizacion|negociacion|cierre_ganado|cierre_perdido]",
      actual: leadActual.etapa,
    },
    { key: "notas",         label: "Notas",                 actual: leadActual.notas },
  ];

  var cambios = {};
  var camposNumericos = ["valorPropuesta", "ahorro", "beneficios"];
  for (var ci = 0; ci < campos.length; ci++) {
    var campo = campos[ci];
    var resp = ui.prompt(
      "Editar",
      campo.label + ":\n(Actual: " + (campo.actual || "(vacio)") + ")",
      ui.ButtonSet.OK_CANCEL
    );
    if (resp.getSelectedButton() !== ui.Button.OK) {
      ui.alert("Cancelado", "Edicion cancelada.", ui.ButtonSet.OK);
      return;
    }
    var nuevoValor = resp.getResponseText().replace(/^\s+|\s+$/g, "");
    if (nuevoValor !== "") {
      var esNumerico = false;
      for (var ni = 0; ni < camposNumericos.length; ni++) {
        if (camposNumericos[ni] === campo.key) { esNumerico = true; break; }
      }
      if (esNumerico) {
        cambios[campo.key] = parseFloat(nuevoValor) || 0;
      } else if (campo.key === "paneles") {
        cambios[campo.key] = parseInt(nuevoValor) || 0;
      } else {
        cambios[campo.key] = nuevoValor;
      }
    }
  }

  if (Object.keys(cambios).length === 0) {
    ui.alert("ℹ️ Sin cambios", "No se realizó ninguna modificación.", ui.ButtonSet.OK);
    return;
  }

  const resultado = actualizarCliente(filaActiva, cambios);
  ui.alert(resultado.ok ? "✅ Éxito" : "❌ Error", resultado.mensaje, ui.ButtonSet.OK);
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

/**
 * Elimina un cliente por número de fila.
 * ⚠️ Esta operación es IRREVERSIBLE.
 *
 * @param {number} fila - Número de fila en la hoja (≥ 2).
 * @returns {Object} Resultado con { ok, mensaje, clienteEliminado }
 *
 * @example
 *   eliminarCliente(3); // Elimina la fila 3
 */
function eliminarCliente(fila) {
  try {
    if (!fila || fila < 2) {
      return { ok: false, mensaje: "El número de fila debe ser ≥ 2." };
    }

    const lead = leerClientePorFila(fila);
    if (!lead || !lead.nombre) {
      return { ok: false, mensaje: `No existe cliente en la fila ${fila}.` };
    }

    const sheet = getSheet();
    sheet.deleteRow(fila);

    return {
      ok: true,
      mensaje: `🗑️ Cliente "${lead.nombre}" eliminado de la fila ${fila}.`,
      clienteEliminado: lead,
    };
  } catch (e) {
    return { ok: false, mensaje: "Error al eliminar cliente: " + e.message };
  }
}

/**
 * Elimina clientes por nombre (elimina TODOS los que coincidan exactamente).
 *
 * @param {string} nombre - Nombre exacto del cliente a eliminar.
 * @returns {Object} Resultado con { ok, mensaje, eliminados }
 *
 * @example
 *   eliminarClientesPorNombre("Carlos Martínez");
 */
function eliminarClientesPorNombre(nombre) {
  if (!nombre) return { ok: false, mensaje: "Debe proporcionar un nombre." };

  const todos = leerTodosLosClientes();
  const coincidencias = todos.filter(
    (l) => l.nombre.toLowerCase() === nombre.toLowerCase()
  );

  if (coincidencias.length === 0) {
    return { ok: false, mensaje: `No se encontró cliente con nombre "${nombre}".` };
  }

  // Eliminar de abajo hacia arriba para no desplazar filas
  const filas = coincidencias.map((l) => l._fila).sort((a, b) => b - a);
  const sheet = getSheet();
  filas.forEach((f) => sheet.deleteRow(f));

  return {
    ok: true,
    mensaje: `🗑️ ${filas.length} cliente(s) con nombre "${nombre}" eliminados.`,
    eliminados: filas.length,
  };
}

/**
 * Diálogo interactivo de eliminación (menú) – elimina la fila activa.
 */
function eliminarClienteSeleccionado() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet();
  const filaActiva = sheet.getActiveRange().getRow();

  if (filaActiva < 2) {
    ui.alert("⚠️ Aviso", "Selecciona una fila de datos (no el encabezado).", ui.ButtonSet.OK);
    return;
  }

  const lead = leerClientePorFila(filaActiva);
  if (!lead || !lead.nombre) {
    ui.alert("⚠️ Aviso", "La fila seleccionada no contiene datos de cliente.", ui.ButtonSet.OK);
    return;
  }

  const confirmacion = ui.alert(
    "🗑️ Confirmar eliminación",
    `¿Estás seguro de eliminar a "${lead.nombre}"?\n\nFila: ${filaActiva}\nUbicación: ${lead.ubicacion}\nValor propuesta: ${_formatCOP(lead.valorPropuesta)}\n\n⚠️ Esta acción es IRREVERSIBLE.`,
    ui.ButtonSet.YES_NO
  );

  if (confirmacion !== ui.Button.YES) {
    ui.alert("ℹ️ Cancelado", "Eliminación cancelada.", ui.ButtonSet.OK);
    return;
  }

  const resultado = eliminarCliente(filaActiva);
  ui.alert(resultado.ok ? "✅ Eliminado" : "❌ Error", resultado.mensaje, ui.ButtonSet.OK);
}

// ─── IMPORTAR CSV ────────────────────────────────────────────────────────────

/**
 * Importa datos desde el CSV "Clientes  - Leads Potenciales.csv"
 * si está adjunto como archivo en el Drive o se copian sus filas.
 *
 * Esta función procesa un string CSV (contenido del archivo) y crea
 * los registros correspondientes en la hoja.
 *
 * @param {string} csvContent - Contenido completo del archivo CSV.
 * @returns {Object} Resultado con { ok, creados, errores }
 *
 * @example
 *   // Obtener el CSV desde Drive:
 *   const archivo = DriveApp.getFilesByName("Clientes  - Leads Potenciales.csv").next();
 *   const contenido = archivo.getBlob().getDataAsString("UTF-8");
 *   const resultado = importarDesdeCSV(contenido);
 *   Logger.log(resultado); // { ok: true, creados: 3, errores: 0 }
 */
function importarDesdeCSV(csvContent) {
  if (!csvContent) return { ok: false, mensaje: "Contenido CSV vacío." };

  const lineas = csvContent.split("\n").filter((l) => l.trim() !== "");
  if (lineas.length < 2) return { ok: false, mensaje: "CSV sin datos." };

  // Saltar la primera fila (headers)
  const filasDatos = lineas.slice(1);
  let creados = 0;
  let errores = 0;

  filasDatos.forEach((linea) => {
    try {
      const cols = _parsearLineaCSV(linea);
      const lead = {
        fecha: cols[0] || _getFechaActual(),
        nombre: cols[1] || "",
        telefono: cols[2] || "",
        ubicacion: cols[3] || "",
        motivo: cols[4] || "Cliente Potencial detectado (>300 kWh)",
        tipoAlerta: cols[5] || "OPORTUNIDAD VENTA",
        valorPropuesta: _parsearNumero(cols[6]),
        potencia: cols[7] || "",
        ahorro: _parsearNumero(cols[8]),
        beneficios: _parsearNumero(cols[9]),
        paneles: parseInt(cols[10]) || 0,
        produccionAnual: cols[11] || "",
        etapa: "contacto",
        notas: "",
      };
      if (lead.nombre.trim() === "") return;
      const res = crearCliente(lead);
      if (res.ok) creados++;
      else errores++;
    } catch (_) {
      errores++;
    }
  });

  return {
    ok: true,
    mensaje: `Importación finalizada: ${creados} creados, ${errores} errores.`,
    creados,
    errores,
  };
}

/**
 * Parsea una línea CSV respetando campos entre comillas.
 * @param {string} linea
 * @returns {string[]}
 */
function _parsearLineaCSV(linea) {
  const resultado = [];
  let campo = "";
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      dentroComillas = !dentroComillas;
    } else if (c === "," && !dentroComillas) {
      resultado.push(campo.trim());
      campo = "";
    } else {
      campo += c;
    }
  }
  resultado.push(campo.trim());
  return resultado;
}

/**
 * Función de conveniencia para importar el CSV desde Google Drive
 * buscando el archivo por nombre.
 */
function importarCSVdesdeDrive() {
  const ui = SpreadsheetApp.getUi();
  try {
    const archivos = DriveApp.getFilesByName("Clientes  - Leads Potenciales.csv");
    if (!archivos.hasNext()) {
      ui.alert(
        "❌ Archivo no encontrado",
        'No se encontró "Clientes  - Leads Potenciales.csv" en tu Drive.\n\nSube el archivo a Google Drive y vuelve a intentarlo.',
        ui.ButtonSet.OK
      );
      return;
    }
    const archivo = archivos.next();
    const contenido = archivo.getBlob().getDataAsString("UTF-8");
    const resultado = importarDesdeCSV(contenido);
    ui.alert("📥 Importación", resultado.mensaje, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert("❌ Error", "Error al importar CSV: " + e.message, ui.ButtonSet.OK);
  }
}

// ─── EXPORTAR ────────────────────────────────────────────────────────────────

/**
 * Exporta todos los datos de la hoja como string CSV.
 *
 * @returns {string} Contenido CSV con headers y datos.
 *
 * @example
 *   const csv = exportarComoCSV();
 *   Logger.log(csv);
 */
function exportarComoCSV() {
  const sheet = getSheet();
  const ultimaFila = sheet.getLastRow();
  if (ultimaFila < 1) return "";

  const datos = sheet.getRange(1, 1, ultimaFila, HEADERS.length).getValues();
  return datos
    .map((fila) =>
      fila
        .map((celda) => {
          const valor = celda.toString();
          return valor.includes(",") ? `"${valor}"` : valor;
        })
        .join(",")
    )
    .join("\n");
}

// ─── UTILIDADES DE PRUEBA ────────────────────────────────────────────────────

/**
 * Función de prueba: crea datos de ejemplo basados en el CSV original.
 * Útil para poblar la hoja desde cero.
 */
function cargarDatosEjemplo() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    "🧪 Cargar datos de ejemplo",
    "¿Deseas cargar los 3 clientes de ejemplo del CSV original?\n(No elimina datos existentes)",
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  inicializarHoja();

  const ejemplos = [
    {
      fecha: "2026-02-19 8:57",
      nombre: "Carlos Martínez",
      telefono: "573229132643",
      ubicacion: "Pasto",
      motivo: "Cliente Potencial detectado (>300 kWh)",
      tipoAlerta: "OPORTUNIDAD VENTA",
      valorPropuesta: 15422149,
      potencia: "3.71 kWp",
      ahorro: 287580,
      beneficios: 6168860,
      paneles: 6,
      produccionAnual: "4,948 kWh/año",
      etapa: "cotizacion",
      notas: "",
    },
    {
      fecha: "2026-02-19 10:22",
      nombre: "María López",
      telefono: "573104517149",
      ubicacion: "Pasto",
      motivo: "Cliente Potencial detectado (>300 kWh)",
      tipoAlerta: "OPORTUNIDAD VENTA",
      valorPropuesta: 53122120,
      potencia: "12.78 kWp",
      ahorro: 991700,
      beneficios: 21248848,
      paneles: 18,
      produccionAnual: "17,031 kWh/año",
      etapa: "negociacion",
      notas: "",
    },
    {
      fecha: "2026-02-19 11:33",
      nombre: "Jhon Pérez",
      telefono: "573150593888",
      ubicacion: "Medellín",
      motivo: "Cliente Potencial detectado (>300 kWh)",
      tipoAlerta: "OPORTUNIDAD VENTA",
      valorPropuesta: 42564843,
      potencia: "10.24 kWp",
      ahorro: 760000,
      beneficios: 17025937,
      paneles: 15,
      produccionAnual: "15,938 kWh/año",
      etapa: "contacto",
      notas: "",
    },
  ];

  var creados = 0;
  for (var ei = 0; ei < ejemplos.length; ei++) {
    var r = crearCliente(ejemplos[ei]);
    if (r.ok) creados++;
  }
  ui.alert("Listo", creados + " clientes de ejemplo cargados correctamente.", ui.ButtonSet.OK);
}

// ─── WEB APP ENTRY POINTS ────────────────────────────────────────────────────

/**
 * Punto de entrada HTTP GET para la Web App.
 * Desplegar en: Implementar → Nueva implementación → Aplicación web
 * Acceso: Cualquiera (o "Solo yo" según necesidad)
 *
 * @param {Object} e - Evento de solicitud GET.
 * @returns {HtmlOutput} Página HTML del CRM.
 */
function doGet(e) {
  // ── Modo API: llamada desde la app React via GET con ?action=xxx ──
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var datosInput = {};
    if (e.parameter.datos) {
      try { datosInput = JSON.parse(e.parameter.datos); } catch (_) {}
    }
    
    // Llamamos directo a la lógica de negocio pasando el objeto
    var resultado = _ejecutarAccion(action, datosInput);
    
    return ContentService
      .createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── Modo interfaz HTML (acceso directo desde el navegador) ──
  return HtmlService.createHtmlOutput(getHtmlContent())
    .setTitle("CRM Solar - Clientes")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/**
 * Función interna unificada para ejecutar acciones CRUD.
 */
function _ejecutarAccion(accion, datos) {
  try {
    if (accion === "ping") return { ok: true, mensaje: "Pong!", timestamp: new Date().toISOString() };
    if (accion === "login") return login(datos.email, datos.password);
    if (accion === "crearUsuario") return crearUsuario(datos);
    if (accion === "listarUsuarios") return { ok: true, datos: listarUsuarios() };
    if (accion === "crear") return crearCliente(datos);
    if (accion === "leerTodos") { var c = leerTodosLosClientes(datos.embajador); return { ok: true, datos: c }; }
    if (accion === "buscarNombre") { var r = buscarClientesPorNombre(datos.nombre); return { ok: true, datos: r }; }
    if (accion === "leerFila") { var lead = leerClientePorFila(datos.fila); return { ok: !!lead, datos: lead }; }
    if (accion === "actualizar") return actualizarCliente(datos.fila, datos.cambios);
    if (accion === "actualizarEtapa") return actualizarEtapa(datos.fila, datos.etapa);
    if (accion === "agregarNota") return agregarNota(datos.fila, datos.nota);
    if (accion === "eliminar") return eliminarCliente(datos.fila);
    if (accion === "kpis") { var k = obtenerKPIs(); return { ok: true, datos: k }; }
    if (accion === "inicializar") { inicializarHoja(); return { ok: true, mensaje: "Hoja inicializada." }; }

    return { ok: false, mensaje: "Accion desconocida: " + accion };
  } catch (err) {
    return { ok: false, mensaje: "Error servidor: " + err.message };
  }
}

/**
 * Punto de entrada HTTP POST para operaciones CRUD desde el frontend.
 * El frontend envía: { accion, datos }
 * Responde con JSON: { ok, mensaje, datos }
 *
 * @param {Object} e - Evento de solicitud POST.
 * @returns {TextOutput} JSON de respuesta.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var accion = body.accion;
    var datos = body.datos || {};
    var resultado;

    if (accion === "crear") {
      resultado = crearCliente(datos);
    } else if (accion === "leerTodos") {
      var clientes = leerTodosLosClientes(datos.embajador);
      resultado = { ok: true, datos: clientes };
    } else if (accion === "buscarNombre") {
      var res = buscarClientesPorNombre(datos.nombre);
      resultado = { ok: true, datos: res };
    } else if (accion === "leerFila") {
      var lead = leerClientePorFila(datos.fila);
      resultado = { ok: !!lead, datos: lead };
    } else if (accion === "actualizar") {
      resultado = actualizarCliente(datos.fila, datos.cambios);
    } else if (accion === "actualizarEtapa") {
      resultado = actualizarEtapa(datos.fila, datos.etapa);
    } else if (accion === "agregarNota") {
      resultado = agregarNota(datos.fila, datos.nota);
    } else if (accion === "eliminar") {
      resultado = eliminarCliente(datos.fila);
    } else if (accion === "kpis") {
      var kpis = obtenerKPIs();
      resultado = { ok: true, datos: kpis };
    } else if (accion === "inicializar") {
      inicializarHoja();
      resultado = { ok: true, mensaje: "Hoja inicializada." };
    } else {
      resultado = { ok: false, mensaje: "Accion desconocida: " + accion };
    }

    return ContentService
      .createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, mensaje: "Error servidor: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── HTML DE LA WEB APP ──────────────────────────────────────────────────────

/**
 * Retorna el HTML completo de la interfaz del CRM.
 * Se usa tanto en doGet (Web App) como en showSidebar (sidebar).
 * @returns {string} HTML completo.
 */
function getHtmlContent() {
  return '<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>CRM Solar - Clientes</title>\n' +
'<style>\n' +
'  * { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'  body { font-family: "Segoe UI", Arial, sans-serif; background: #0f1923; color: #e2e8f0; min-height: 100vh; }\n' +
'  .header { background: linear-gradient(135deg, #1a3a5c 0%, #0d2236 100%); padding: 18px 24px; display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #f59e0b; }\n' +
'  .header h1 { font-size: 20px; color: #f59e0b; font-weight: 700; letter-spacing: 0.5px; }\n' +
'  .header p { font-size: 12px; color: #94a3b8; margin-top: 2px; }\n' +
'  .kpi-bar { display: flex; gap: 12px; padding: 16px 24px; background: #111827; flex-wrap: wrap; border-bottom: 1px solid #1e3a5f; }\n' +
'  .kpi { background: #1a2a3a; border: 1px solid #1e3a5f; border-radius: 8px; padding: 12px 18px; min-width: 140px; flex: 1; }\n' +
'  .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
'  .kpi-val { font-size: 20px; font-weight: 700; color: #f59e0b; margin-top: 4px; }\n' +
'  .kpi-val.blue { color: #38bdf8; }\n' +
'  .kpi-val.green { color: #34d399; }\n' +
'  .toolbar { display: flex; gap: 8px; padding: 14px 24px; background: #111827; flex-wrap: wrap; align-items: center; }\n' +
'  .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }\n' +
'  .btn-primary { background: #f59e0b; color: #0f1923; }\n' +
'  .btn-primary:hover { background: #d97706; }\n' +
'  .btn-blue { background: #1d4ed8; color: #fff; }\n' +
'  .btn-blue:hover { background: #1e40af; }\n' +
'  .btn-danger { background: #dc2626; color: #fff; }\n' +
'  .btn-danger:hover { background: #b91c1c; }\n' +
'  .btn-ghost { background: #1e3a5f; color: #94a3b8; border: 1px solid #2d4a6a; }\n' +
'  .btn-ghost:hover { background: #243f6a; color: #e2e8f0; }\n' +
'  .search-box { flex: 1; min-width: 200px; padding: 8px 12px; background: #1a2a3a; border: 1px solid #2d4a6a; border-radius: 6px; color: #e2e8f0; font-size: 13px; }\n' +
'  .search-box::placeholder { color: #475569; }\n' +
'  .search-box:focus { outline: none; border-color: #f59e0b; }\n' +
'  .filter-select { padding: 8px 10px; background: #1a2a3a; border: 1px solid #2d4a6a; border-radius: 6px; color: #e2e8f0; font-size: 13px; cursor: pointer; }\n' +
'  .filter-select:focus { outline: none; border-color: #f59e0b; }\n' +
'  .table-wrap { overflow-x: auto; padding: 0 24px 24px; }\n' +
'  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }\n' +
'  thead tr { background: #1a3a5c; }\n' +
'  th { padding: 10px 12px; text-align: left; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }\n' +
'  tbody tr { border-bottom: 1px solid #1e3a5f; transition: background 0.15s; cursor: pointer; }\n' +
'  tbody tr:hover { background: #1a2a3a; }\n' +
'  td { padding: 11px 12px; color: #cbd5e1; vertical-align: middle; }\n' +
'  td.nombre-cell { color: #f1f5f9; font-weight: 600; }\n' +
'  td.valor-cell { color: #f59e0b; font-weight: 700; white-space: nowrap; }\n' +
'  .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }\n' +
'  .badge-contacto { background: #164e63; color: #38bdf8; }\n' +
'  .badge-cotizacion { background: #451a03; color: #f59e0b; }\n' +
'  .badge-negociacion { background: #312e81; color: #a78bfa; }\n' +
'  .badge-cierre_ganado { background: #14532d; color: #34d399; }\n' +
'  .badge-cierre_perdido { background: #450a0a; color: #f87171; }\n' +
'  .actions-cell { display: flex; gap: 6px; }\n' +
'  .icon-btn { background: none; border: 1px solid #2d4a6a; border-radius: 5px; color: #64748b; cursor: pointer; padding: 4px 8px; font-size: 13px; transition: all 0.15s; }\n' +
'  .icon-btn:hover.edit { color: #38bdf8; border-color: #38bdf8; }\n' +
'  .icon-btn:hover.del { color: #f87171; border-color: #f87171; }\n' +
'  .empty { text-align: center; padding: 48px; color: #475569; }\n' +
'  .empty-icon { font-size: 40px; margin-bottom: 12px; }\n' +
'  /* MODAL */\n' +
'  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; align-items: center; justify-content: center; }\n' +
'  .modal-overlay.open { display: flex; }\n' +
'  .modal { background: #1a2232; border: 1px solid #2d4a6a; border-radius: 12px; width: 100%; max-width: 560px; max-height: 92vh; overflow-y: auto; padding: 28px; }\n' +
'  .modal h2 { font-size: 17px; color: #f59e0b; margin-bottom: 20px; border-bottom: 1px solid #2d4a6a; padding-bottom: 12px; }\n' +
'  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }\n' +
'  .form-group { display: flex; flex-direction: column; gap: 5px; }\n' +
'  .form-group.full { grid-column: 1 / -1; }\n' +
'  label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
'  input, select, textarea { background: #0f1923; border: 1px solid #2d4a6a; border-radius: 6px; padding: 8px 10px; color: #e2e8f0; font-size: 13px; width: 100%; }\n' +
'  input:focus, select:focus, textarea:focus { outline: none; border-color: #f59e0b; }\n' +
'  textarea { resize: vertical; min-height: 70px; }\n' +
'  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid #2d4a6a; padding-top: 16px; }\n' +
'  .toast { position: fixed; bottom: 24px; right: 24px; background: #1e3a5f; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 20px; color: #f1f5f9; font-size: 13px; z-index: 999; transition: opacity 0.4s; max-width: 320px; }\n' +
'  .toast.error { border-color: #f87171; background: #3b0f0f; }\n' +
'  .loading { text-align: center; padding: 32px; color: #475569; }\n' +
'  @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .kpi-bar { gap: 8px; } .toolbar { gap: 6px; } }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'\n' +
'<div class="header">\n' +
'  <div style="font-size:28px">☀️</div>\n' +
'  <div>\n' +
'    <h1>CRM Solar — Clientes / Leads</h1>\n' +
'    <p>Gestión y seguimiento del pipeline solar</p>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="kpi-bar" id="kpiBar">\n' +
'  <div class="kpi"><div class="kpi-label">Total Clientes</div><div class="kpi-val blue" id="kTotal">—</div></div>\n' +
'  <div class="kpi"><div class="kpi-label">Valor Pipeline</div><div class="kpi-val" id="kValor">—</div></div>\n' +
'  <div class="kpi"><div class="kpi-label">Ahorro Total</div><div class="kpi-val green" id="kAhorro">—</div></div>\n' +
'  <div class="kpi"><div class="kpi-label">En Contacto</div><div class="kpi-val blue" id="kContacto">—</div></div>\n' +
'  <div class="kpi"><div class="kpi-label">Cotización</div><div class="kpi-val" id="kCotizacion">—</div></div>\n' +
'  <div class="kpi"><div class="kpi-label">Negociación</div><div class="kpi-val" id="kNegociacion">—</div></div>\n' +
'  <div class="kpi"><div class="kpi-label">Cierre Ganado</div><div class="kpi-val green" id="kCierreGanado">—</div></div>\n' +
'  <div class="kpi"><div class="kpi-label">Cierre Perdido</div><div class="kpi-val red" id="kCierrePerdido">—</div></div>\n' +
'</div>\n' +
'\n' +
'<div class="toolbar">\n' +
'  <input class="search-box" type="text" id="searchInput" placeholder="🔍 Buscar por nombre..." oninput="filtrarTabla()">\n' +
'  <select class="filter-select" id="filterEtapa" onchange="filtrarTabla()">\n' +
'    <option value="">Todas las etapas</option>\n' +
'    <option value="contacto">Contacto</option>\n' +
'    <option value="cotizacion">Cotización</option>\n' +
'    <option value="negociacion">Negociación</option>\n' +
'    <option value="cierre_ganado">Cierre Ganado</option>\n' +
'    <option value="cierre_perdido">Cierre Perdido</option>\n' +
'  </select>\n' +
'  <select class="filter-select" id="filterCiudad" onchange="filtrarTabla()">\n' +
'    <option value="">Todas las ciudades</option>\n' +
'  </select>\n' +
'  <button class="btn btn-primary" onclick="abrirModalCrear()">➕ Nuevo Cliente</button>\n' +
'  <button class="btn btn-ghost" onclick="cargarDatos()">🔄 Actualizar</button>\n' +
'  <button class="btn btn-ghost" onclick="inicializarHoja()">🛠️ Inicializar Hoja</button>\n' +
'</div>\n' +
'\n' +
'<div class="table-wrap">\n' +
'  <div id="loadingMsg" class="loading">Cargando clientes...</div>\n' +
'  <div id="emptyMsg" class="empty" style="display:none">\n' +
'    <div class="empty-icon">📋</div>\n' +
'    <p>No hay clientes registrados aún.</p>\n' +
'    <button class="btn btn-primary" style="margin-top:16px" onclick="abrirModalCrear()">➕ Agregar primer cliente</button>\n' +
'  </div>\n' +
'  <table id="tablaClientes" style="display:none">\n' +
'    <thead>\n' +
'      <tr>\n' +
'        <th>#</th><th>Nombre</th><th>Teléfono</th><th>Ciudad</th>\n' +
'        <th>Potencia</th><th>Valor Propuesta</th><th>Paneles</th>\n' +
'        <th>Etapa</th><th style="text-align:center">Acciones</th>\n' +
'      </tr>\n' +
'    </thead>\n' +
'    <tbody id="tbodyClientes"></tbody>\n' +
'  </table>\n' +
'</div>\n' +
'\n' +
'<!-- MODAL CREAR / EDITAR -->\n' +
'<div class="modal-overlay" id="modalOverlay">\n' +
'  <div class="modal">\n' +
'    <h2 id="modalTitle">Nuevo Cliente</h2>\n' +
'    <input type="hidden" id="editFila">\n' +
'    <div class="form-grid">\n' +
'      <div class="form-group"><label>Nombre *</label><input id="fNombre" placeholder="Carlos Martínez"></div>\n' +
'      <div class="form-group"><label>Teléfono *</label><input id="fTelefono" placeholder="573229132643"></div>\n' +
'      <div class="form-group"><label>Ciudad *</label><input id="fUbicacion" placeholder="Pasto"></div>\n' +
'      <div class="form-group"><label>Etapa</label>\n' +
'        <select id="fEtapa">\n' +
'          <option value="contacto">Contacto</option>\n' +
'          <option value="cotizacion">Cotización</option>\n' +
'          <option value="negociacion">Negociación</option>\n' +
'          <option value="cierre_ganado">Cierre Ganado</option>\n' +
'          <option value="cierre_perdido">Cierre Perdido</option>\n' +
'        </select>\n' +
'      </div>\n' +
'      <div class="form-group"><label>Valor Propuesta (COP)</label><input id="fValor" type="number" placeholder="15422149"></div>\n' +
'      <div class="form-group"><label>Potencia</label><input id="fPotencia" placeholder="3.71 kWp"></div>\n' +
'      <div class="form-group"><label>Ahorro Mensual (COP)</label><input id="fAhorro" type="number" placeholder="287580"></div>\n' +
'      <div class="form-group"><label>Beneficios Totales (COP)</label><input id="fBeneficios" type="number" placeholder="6168860"></div>\n' +
'      <div class="form-group"><label>N° Paneles</label><input id="fPaneles" type="number" placeholder="6"></div>\n' +
'      <div class="form-group"><label>Producción Anual</label><input id="fProduccion" placeholder="4,948 kWh/año"></div>\n' +
'      <div class="form-group full"><label>Tipo de Alerta</label><input id="fAlerta" placeholder="OPORTUNIDAD VENTA"></div>\n' +
'      <div class="form-group full"><label>Motivo</label><input id="fMotivo" placeholder="Cliente Potencial detectado (>300 kWh)"></div>\n' +
'      <div class="form-group full"><label>Notas</label><textarea id="fNotas" placeholder="Observaciones adicionales..."></textarea></div>\n' +
'    </div>\n' +
'    <div class="modal-footer">\n' +
'      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>\n' +
'      <button class="btn btn-primary" onclick="guardarCliente()">💾 Guardar</button>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="toast" id="toast" style="display:none"></div>\n' +
'\n' +
'<script>\n' +
'  var WEBAPP_URL = "";\n' +
'  var todosLosClientes = [];\n' +
'\n' +
'  // ── Detectar URL de la Web App ──────────────────────────────────\n' +
'  try { WEBAPP_URL = window.location.href.split("?")[0]; } catch(e) {}\n' +
'\n' +
'  // ── Utilidades ──────────────────────────────────────────────────\n' +
'  function formatCOP(n) {\n' +
'    if (!n && n !== 0) return "$0";\n' +
'    var num = Math.round(Number(n));\n' +
'    var neg = num < 0; var abs = neg ? -num : num;\n' +
'    var s = abs.toString(); var r = ""; var c = 0;\n' +
'    for (var i = s.length - 1; i >= 0; i--) {\n' +
'      if (c > 0 && c % 3 === 0) r = "." + r;\n' +
'      r = s[i] + r; c++;\n' +
'    }\n' +
'    return (neg ? "-$" : "$") + r;\n' +
'  }\n' +
'\n' +
'  function badgeClass(etapa) {\n' +
'    var map = { contacto:"badge-contacto", cotizacion:"badge-cotizacion", negociacion:"badge-negociacion", cierre_ganado:"badge-cierre_ganado", cierre_perdido:"badge-cierre_perdido" };\n' +
'    return "badge " + (map[etapa] || "badge-contacto");\n' +
'  }\n' +
'  function etapaLabel(e) {\n' +
'    var map = { contacto:"Contacto", cotizacion:"Cotizacion", negociacion:"Negociacion", cierre_ganado:"Cierre Ganado", cierre_perdido:"Cierre Perdido" };\n' +
'    return map[e] || e;\n' +
'  }\n' +
'\n' +
'  function toast(msg, esError) {\n' +
'    var t = document.getElementById("toast");\n' +
'    t.textContent = msg;\n' +
'    t.className = "toast" + (esError ? " error" : "");\n' +
'    t.style.display = "block";\n' +
'    setTimeout(function() { t.style.display = "none"; }, 3500);\n' +
'  }\n' +
'\n' +
'  // ── Comunicación con el servidor (google.script.run) ──────────\n' +
'  function llamarServidor(accion, datos, callback) {\n' +
'    var payload = { accion: accion, datos: datos || {} };\n' +
'    google.script.run\n' +
'      .withSuccessHandler(function(resp) { if (callback) callback(resp); })\n' +
'      .withFailureHandler(function(err) { toast("Error: " + err.message, true); })\n' +
'      .procesarAccion(JSON.stringify(payload));\n' +
'  }\n' +
'\n' +
'  // ── Cargar datos ─────────────────────────────────────────────\n' +
'  function cargarDatos() {\n' +
'    document.getElementById("loadingMsg").style.display = "block";\n' +
'    document.getElementById("tablaClientes").style.display = "none";\n' +
'    document.getElementById("emptyMsg").style.display = "none";\n' +
'    llamarServidor("leerTodos", {}, function(resp) {\n' +
'      todosLosClientes = resp.datos || [];\n' +
'      renderizarTabla(todosLosClientes);\n' +
'      cargarKPIs();\n' +
'      cargarCiudades();\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function cargarKPIs() {\n' +
'    llamarServidor("kpis", {}, function(resp) {\n' +
'      if (!resp.ok) return;\n' +
'      var k = resp.datos;\n' +
'      document.getElementById("kTotal").textContent = k.total;\n' +
'      document.getElementById("kValor").textContent = formatCOP(k.valorTotal);\n' +
'      document.getElementById("kAhorro").textContent = formatCOP(k.ahorroTotal);\n' +
'      document.getElementById("kContacto").textContent = k.porEtapa.contacto || 0;\n' +
'      document.getElementById("kCotizacion").textContent = k.porEtapa.cotizacion || 0;\n' +
'      document.getElementById("kNegociacion").textContent = k.porEtapa.negociacion || 0;\n' +
'      document.getElementById("kCierreGanado").textContent = k.porEtapa.cierre_ganado || 0;\n' +
'      document.getElementById("kCierrePerdido").textContent = k.porEtapa.cierre_perdido || 0;\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function cargarCiudades() {\n' +
'    var sel = document.getElementById("filterCiudad");\n' +
'    var ciudades = {};\n' +
'    for (var i = 0; i < todosLosClientes.length; i++) {\n' +
'      ciudades[todosLosClientes[i].ubicacion] = true;\n' +
'    }\n' +
'    sel.innerHTML = "<option value=\\"\\">Todas las ciudades</option>";\n' +
'    for (var c in ciudades) {\n' +
'      sel.innerHTML += "<option value=\\"" + c + "\\">" + c + "</option>";\n' +
'    }\n' +
'  }\n' +
'\n' +
'  // ── Renderizar tabla ─────────────────────────────────────────\n' +
'  function renderizarTabla(lista) {\n' +
'    document.getElementById("loadingMsg").style.display = "none";\n' +
'    var tbody = document.getElementById("tbodyClientes");\n' +
'    tbody.innerHTML = "";\n' +
'    if (lista.length === 0) {\n' +
'      document.getElementById("emptyMsg").style.display = "block";\n' +
'      document.getElementById("tablaClientes").style.display = "none";\n' +
'      return;\n' +
'    }\n' +
'    document.getElementById("emptyMsg").style.display = "none";\n' +
'    document.getElementById("tablaClientes").style.display = "table";\n' +
'    for (var i = 0; i < lista.length; i++) {\n' +
'      var c = lista[i];\n' +
'      var tr = document.createElement("tr");\n' +
'      tr.innerHTML =\n' +
'        "<td>" + i + 1 + "</td>" +\n' +
'        "<td class=\\"nombre-cell\\">" + esc(c.nombre) + "<br><small style=\\"color:#475569;font-size:11px\\">" + esc(c.fecha) + "</small></td>" +\n' +
'        "<td>" + esc(c.telefono) + "</td>" +\n' +
'        "<td>" + esc(c.ubicacion) + "</td>" +\n' +
'        "<td>" + esc(c.potencia) + "</td>" +\n' +
'        "<td class=\\"valor-cell\\">" + formatCOP(c.valorPropuesta) + "</td>" +\n' +
'        "<td style=\\"text-align:center\\">" + (c.paneles || 0) + "</td>" +\n' +
'        "<td><span class=\\"" + badgeClass(c.etapa) + "\\">" + etapaLabel(c.etapa) + "</span></td>" +\n' +
'        "<td><div class=\\"actions-cell\\">" +\n' +
'        "<button class=\\"icon-btn edit\\" onclick=\\"editarFila(" + c._fila + ")\\">✏️</button>" +\n' +
'        "<button class=\\"icon-btn del\\" data-fila=\\"" + c._fila + "\\" data-nombre=\\"" + esc(c.nombre) + "\\" onclick=\\"eliminarFilaBtn(this)\\">🗑️</button>" +\n' +
'        "</div></td>";\n' +
'      tbody.appendChild(tr);\n' +
'    }\n' +
'  }\n' +
'\n' +
'  function esc(s) { return (s || "").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }\n' +
'  function eliminarFilaBtn(btn) { var fila = parseInt(btn.getAttribute("data-fila")); var nombre = btn.getAttribute("data-nombre"); eliminarFila(fila, nombre); }\n' +
'\n' +
'  // ── Filtrar ──────────────────────────────────────────────────\n' +
'  function filtrarTabla() {\n' +
'    var busq = document.getElementById("searchInput").value.toLowerCase();\n' +
'    var etapa = document.getElementById("filterEtapa").value;\n' +
'    var ciudad = document.getElementById("filterCiudad").value;\n' +
'    var filtrados = todosLosClientes.filter(function(c) {\n' +
'      if (busq && c.nombre.toLowerCase().indexOf(busq) === -1) return false;\n' +
'      if (etapa && c.etapa !== etapa) return false;\n' +
'      if (ciudad && c.ubicacion !== ciudad) return false;\n' +
'      return true;\n' +
'    });\n' +
'    renderizarTabla(filtrados);\n' +
'  }\n' +
'\n' +
'  // ── Modal ────────────────────────────────────────────────────\n' +
'  function abrirModalCrear() {\n' +
'    document.getElementById("modalTitle").textContent = "Nuevo Cliente";\n' +
'    document.getElementById("editFila").value = "";\n' +
'    limpiarFormulario();\n' +
'    document.getElementById("modalOverlay").classList.add("open");\n' +
'  }\n' +
'\n' +
'  function cerrarModal() {\n' +
'    document.getElementById("modalOverlay").classList.remove("open");\n' +
'  }\n' +
'\n' +
'  function limpiarFormulario() {\n' +
'    ["fNombre","fTelefono","fUbicacion","fValor","fPotencia","fAhorro",\n' +
'     "fBeneficios","fPaneles","fProduccion","fAlerta","fMotivo","fNotas"].forEach(function(id) {\n' +
'      document.getElementById(id).value = "";\n' +
'    });\n' +
'    document.getElementById("fEtapa").value = "contacto";\n' +
'    document.getElementById("fAlerta").value = "OPORTUNIDAD VENTA";\n' +
'    document.getElementById("fMotivo").value = "Cliente Potencial detectado (>300 kWh)";\n' +
'  }\n' +
'\n' +
'  function editarFila(fila) {\n' +
'    llamarServidor("leerFila", { fila: fila }, function(resp) {\n' +
'      if (!resp.ok || !resp.datos) { toast("No se encontro el cliente.", true); return; }\n' +
'      var c = resp.datos;\n' +
'      document.getElementById("modalTitle").textContent = "Editar: " + c.nombre;\n' +
'      document.getElementById("editFila").value = fila;\n' +
'      document.getElementById("fNombre").value = c.nombre || "";\n' +
'      document.getElementById("fTelefono").value = c.telefono || "";\n' +
'      document.getElementById("fUbicacion").value = c.ubicacion || "";\n' +
'      document.getElementById("fEtapa").value = c.etapa || "contacto";\n' +
'      document.getElementById("fValor").value = c.valorPropuesta || "";\n' +
'      document.getElementById("fPotencia").value = c.potencia || "";\n' +
'      document.getElementById("fAhorro").value = c.ahorro || "";\n' +
'      document.getElementById("fBeneficios").value = c.beneficios || "";\n' +
'      document.getElementById("fPaneles").value = c.paneles || "";\n' +
'      document.getElementById("fProduccion").value = c.produccionAnual || "";\n' +
'      document.getElementById("fAlerta").value = c.tipoAlerta || "";\n' +
'      document.getElementById("fMotivo").value = c.motivo || "";\n' +
'      document.getElementById("fNotas").value = c.notas || "";\n' +
'      document.getElementById("modalOverlay").classList.add("open");\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function eliminarFila(fila, nombre) {\n' +
'    if (!confirm("¿Eliminar a " + nombre + "?\\nEsta accion es irreversible.")) return;\n' +
'    llamarServidor("eliminar", { fila: fila }, function(resp) {\n' +
'      toast(resp.mensaje, !resp.ok);\n' +
'      if (resp.ok) cargarDatos();\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function guardarCliente() {\n' +
'    var nombre = document.getElementById("fNombre").value.trim();\n' +
'    var telefono = document.getElementById("fTelefono").value.trim();\n' +
'    var ubicacion = document.getElementById("fUbicacion").value.trim();\n' +
'    if (!nombre || !telefono || !ubicacion) {\n' +
'      toast("Nombre, Telefono y Ciudad son obligatorios.", true); return;\n' +
'    }\n' +
'    var datos = {\n' +
'      nombre: nombre, telefono: telefono, ubicacion: ubicacion,\n' +
'      etapa: document.getElementById("fEtapa").value,\n' +
'      valorPropuesta: parseFloat(document.getElementById("fValor").value) || 0,\n' +
'      potencia: document.getElementById("fPotencia").value.trim(),\n' +
'      ahorro: parseFloat(document.getElementById("fAhorro").value) || 0,\n' +
'      beneficios: parseFloat(document.getElementById("fBeneficios").value) || 0,\n' +
'      paneles: parseInt(document.getElementById("fPaneles").value) || 0,\n' +
'      produccionAnual: document.getElementById("fProduccion").value.trim(),\n' +
'      tipoAlerta: document.getElementById("fAlerta").value.trim() || "OPORTUNIDAD VENTA",\n' +
'      motivo: document.getElementById("fMotivo").value.trim() || "Cliente Potencial detectado (>300 kWh)",\n' +
'      notas: document.getElementById("fNotas").value.trim()\n' +
'    };\n' +
'    var filaEditar = document.getElementById("editFila").value;\n' +
'    if (filaEditar) {\n' +
'      llamarServidor("actualizar", { fila: parseInt(filaEditar), cambios: datos }, function(resp) {\n' +
'        toast(resp.mensaje, !resp.ok);\n' +
'        if (resp.ok) { cerrarModal(); cargarDatos(); }\n' +
'      });\n' +
'    } else {\n' +
'      llamarServidor("crear", datos, function(resp) {\n' +
'        toast(resp.mensaje, !resp.ok);\n' +
'        if (resp.ok) { cerrarModal(); cargarDatos(); }\n' +
'      });\n' +
'    }\n' +
'  }\n' +
'\n' +
'  function inicializarHoja() {\n' +
'    llamarServidor("inicializar", {}, function(resp) {\n' +
'      toast(resp.mensaje || "Hoja inicializada.", !resp.ok);\n' +
'    });\n' +
'  }\n' +
'\n' +
'  document.getElementById("modalOverlay").addEventListener("click", function(e) {\n' +
'    if (e.target === this) cerrarModal();\n' +
'  });\n' +
'\n' +
'  cargarDatos();\n' +
'</script>\n' +
'</body>\n' +
'</html>';
}

/**
 * Función puente llamada desde el frontend HTML via google.script.run.
 * Parsea la accion JSON y despacha a la función CRUD correspondiente.
 *
 * @param {string} payloadJson - JSON string con { accion, datos }
 * @returns {Object} Resultado de la operación.
 */
function procesarAccion(payloadJson) {
  try {
    var body = JSON.parse(payloadJson);
    var accion = body.accion;
    var datos = body.datos || {};

    if (accion === "crear") return crearCliente(datos);
    if (accion === "leerTodos") { var c = leerTodosLosClientes(datos.embajador); return { ok: true, datos: c }; }
    if (accion === "buscarNombre") { var r = buscarClientesPorNombre(datos.nombre); return { ok: true, datos: r }; }
    if (accion === "leerFila") { var lead = leerClientePorFila(datos.fila); return { ok: !!lead, datos: lead }; }
    if (accion === "actualizar") return actualizarCliente(datos.fila, datos.cambios);
    if (accion === "actualizarEtapa") return actualizarEtapa(datos.fila, datos.etapa);
    if (accion === "agregarNota") return agregarNota(datos.fila, datos.nota);
    if (accion === "eliminar") return eliminarCliente(datos.fila);
    if (accion === "kpis") { var k = obtenerKPIs(); return { ok: true, datos: k }; }
    if (accion === "inicializar") { inicializarHoja(); return { ok: true, mensaje: "Hoja inicializada." }; }

    return { ok: false, mensaje: "Accion desconocida: " + accion };
  } catch (err) {
    return { ok: false, mensaje: "Error: " + err.message };
  }
}

/**
 * Muestra la Web App como panel lateral (sidebar) en el Spreadsheet.
 * Útil para pruebas sin necesitar despliegue como Web App.
 */
function mostrarSidebar() {
  var html = HtmlService.createHtmlOutput(getHtmlContent())
    .setTitle("CRM Solar")
    .setWidth(700);
  SpreadsheetApp.getUi().showSidebar(html);
}
/**
 * ─── GESTIÓN DE USUARIOS ──────────────────────────────────────────────────
 */

function getUsuariosSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(USUARIOS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(USUARIOS_SHEET_NAME);
    const range = sheet.getRange(1, 1, 1, USUARIOS_HEADERS.length);
    range.setValues([USUARIOS_HEADERS]).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    
    // Crear usuario admin por defecto
    crearUsuario({ email: "MONOZAM", password: "Zolaris4347/", nombre: "MONOZAM", rol: "ADMIN" }, true);
  }
  return sheet;
}

function login(email, password) {
  if (!email || !password) return { ok: false, mensaje: "Email y password requeridos" };
  const users = listarUsuariosRaw();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (!user) return { ok: false, mensaje: "Credenciales inválidas" };
  if (user.activo === "No") return { ok: false, mensaje: "Usuario desactivado" };
  
  // No devolver el password
  const { password: _, ...safeUser } = user;
  return { ok: true, datos: safeUser };
}

function listarUsuarios() {
  return listarUsuariosRaw().map(({ password: _, ...u }) => u);
}

function listarUsuariosRaw() {
  const sheet = getUsuariosSheet();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const vals = sheet.getRange(2, 1, last - 1, USUARIOS_HEADERS.length).getValues();
  return vals.map((r, i) => ({
    _fila: i + 2,
    id: r[0],
    email: r[1],
    password: r[2],
    nombre: r[3],
    rol: r[4],
    activo: r[5]
  }));
}

function crearUsuario(datos, ignoreAdminCheck) {
  // En producción, aquí verificaríamos si el llamador es ADMIN
  const sheet = getUsuariosSheet();
  const id = _generarId();
  const row = [id, datos.email, datos.password, datos.nombre, datos.rol || "USER", "Si"];
  sheet.appendRow(row);
  return { ok: true, mensaje: "Usuario creado exitosamente" };
}
