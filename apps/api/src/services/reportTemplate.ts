import { safeText } from "../utils/safeText"

export function generateReportHTML(report:any){

  let data:any = {}

  try {

    data =
      typeof report.resultJson === "string"
        ? JSON.parse(report.resultJson || "{}")
        : report.resultJson || {}

  } catch(error){

    console.error("ERROR PARSING RESULT JSON:", error)

    data = {}

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
        ${safeText(report.participant?.nombre)}
        ${safeText(report.participant?.apellido)}
      </div>

      <div>
        <b>Empresa:</b>
        ${safeText(report.participant?.company?.name || "N/A")}
      </div>

      <div>
        <b>Evaluación:</b>
        ${safeText(report.evaluation?.name)}
      </div>

      <div class="score">
        <b>Puntaje:</b>
        ${safeText(data.score)}%
      </div>

      <div class="badge ${
        data.traffic?.color === "VERDE"
          ? "verde"
          : data.traffic?.color === "AMARILLO"
          ? "amarillo"
          : "rojo"
      }">
        ${safeText(data.traffic?.result)}
      </div>
    </div>

    <div class="section">
      <div class="title">
        <b>Análisis General</b>
      </div>

      <div class="card">
        ${safeText(data.aiText)
          .replace(/\n/g,"<br/>")}
      </div>
    </div>

    <div class="section">

      <div class="title">
        <b>Competencias</b>
      </div>

      ${
        (data.competencies || [])
          .map((c:any)=>`

          <div class="card competency">

            <b>${safeText(c.name)}</b><br/>

            Nivel:
            ${safeText(c.level)}
            <br/>

            Puntaje:
            ${safeText(c.score)}%

          </div>

        `)
        .join("")
      }

    </div>

  </body>
  </html>
  `
}