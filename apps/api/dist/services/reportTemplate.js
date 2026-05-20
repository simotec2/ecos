"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportHTML = generateReportHTML;
const safeText_1 = require("../utils/safeText");
function generateReportHTML(report) {
    let data = {};
    try {
        data =
            typeof report.resultJson === "string"
                ? JSON.parse(report.resultJson || "{}")
                : report.resultJson || {};
    }
    catch (error) {
        console.error("ERROR PARSING RESULT JSON:", error);
        data = {};
    }
    return `
  <html>
  <head>
    <style>

      body{
        font-family: Arial, sans-serif;
        padding:40px;
        color:#1f2937;
      }

      h1{
        text-align:center;
        margin-bottom:30px;
      }

      .section{
        margin-bottom:25px;
      }

      .title{
        font-size:16px;
        margin-bottom:10px;
      }

      .card{
        background:#f9fafb;
        padding:15px;
        border-radius:8px;
      }

      .competency{
        margin-bottom:10px;
      }

      .score{
        font-size:20px;
        margin-top:10px;
      }

      .badge{
        display:inline-block;
        padding:5px 10px;
        border-radius:6px;
        color:white;
      }

      .verde{ background:#16a34a }
      .amarillo{ background:#eab308 }
      .rojo{ background:#dc2626 }

    </style>
  </head>

  <body>

    <h1>Informe ECOS</h1>

    <div class="section card">
      <div>
        <b>Participante:</b>
        ${(0, safeText_1.safeText)(report.participant?.nombre)}
        ${(0, safeText_1.safeText)(report.participant?.apellido)}
      </div>

      <div>
        <b>Empresa:</b>
        ${(0, safeText_1.safeText)(report.participant?.company?.name || "N/A")}
      </div>

      <div>
        <b>Evaluación:</b>
        ${(0, safeText_1.safeText)(report.evaluation?.name)}
      </div>

      <div class="score">
        <b>Puntaje:</b>
        ${(0, safeText_1.safeText)(data.score)}%
      </div>

      <div class="badge ${data.traffic?.color === "VERDE"
        ? "verde"
        : data.traffic?.color === "AMARILLO"
            ? "amarillo"
            : "rojo"}">
        ${(0, safeText_1.safeText)(data.traffic?.result)}
      </div>
    </div>

    <div class="section">
      <div class="title">
        <b>Análisis General</b>
      </div>

      <div class="card">
        ${(0, safeText_1.safeText)(data.aiText)
        .replace(/\n/g, "<br/>")}
      </div>
    </div>

    <div class="section">

      <div class="title">
        <b>Competencias</b>
      </div>

      ${(data.competencies || [])
        .map((c) => `

          <div class="card competency">

            <b>${(0, safeText_1.safeText)(c.name)}</b><br/>

            Nivel:
            ${(0, safeText_1.safeText)(c.level)}
            <br/>

            Puntaje:
            ${(0, safeText_1.safeText)(c.score)}%

          </div>

        `)
        .join("")}

    </div>

  </body>
  </html>
  `;
}
