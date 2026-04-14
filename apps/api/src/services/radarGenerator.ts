import { ChartJSNodeCanvas } from "chartjs-node-canvas"

const width = 600
const height = 600

/* ======================================
FORMATEAR LABELS (CLAVE)
====================================== */
function cleanLabel(text:string){

  if(!text) return ""

  const t = text.toLowerCase()

  if(t.includes("debe sumarse")) return null

  // 🔥 dividir en 2 líneas si es largo
  if(text.length > 20){
    const words = text.split(" ")
    const mid = Math.ceil(words.length / 2)

    return [
      words.slice(0, mid).join(" "),
      words.slice(mid).join(" ")
    ]
  }

  return text
}

/* ======================================
GENERAR RADAR
====================================== */
export async function generateRadarImage(competencies:any[]){

  const clean = (competencies || [])
    .map(c => ({
      ...c,
      name: cleanLabel(c.name)
    }))
    .filter(c => c.name)

  let labels = clean.map(c => c.name)
  let values = clean.map(c => Number(c.score || 0))

  // mínimo 3 puntos
  while(labels.length < 3){
    labels.push(" ")
    values.push(0)
  }

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height
  })

  const configuration:any = {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: "rgba(34,197,94,0.15)",
          borderColor: "#16a34a",
          borderWidth: 2,
          pointBackgroundColor: "#16a34a",
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,

      layout:{
        padding:40
      },

      scales: {
        r: {
          min: 0,
          max: 100,

          ticks:{
            stepSize:20,
            backdropColor:"transparent",
            color:"#6b7280",
            font:{ size:11 }
          },

          grid:{
            circular:true,
            color:"#e5e7eb"
          },

          angleLines:{
            color:"#e5e7eb"
          },

          pointLabels:{
            padding:20,
            color:"#111827",
            font:{
              size:14,
              weight:"bold"
            }
          }
        }
      },

      plugins:{
        legend:{ display:false }
      }
    }
  }

  return await chartJSNodeCanvas.renderToDataURL(configuration)
}