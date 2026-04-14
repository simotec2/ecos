import { ChartJSNodeCanvas } from "chartjs-node-canvas"

const width = 400
const height = 400

export async function generatePieChart(results:any[]){

  const counts = {
    VERDE:0,
    AMARILLO:0,
    ROJO:0
  }

  results.forEach(r=>{
    const c = r.traffic?.color
    if(counts[c] !== undefined){
      counts[c]++
    }
  })

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height })

  const configuration:any = {
    type: "pie",
    data: {
      labels: ["Recomendable", "Observaciones", "No recomendable"],
      datasets: [
        {
          data: [
            counts.VERDE,
            counts.AMARILLO,
            counts.ROJO
          ],
          backgroundColor: [
            "#16a34a",
            "#f59e0b",
            "#dc2626"
          ]
        }
      ]
    },
    options:{
      plugins:{
        legend:{
          position:"bottom"
        }
      }
    }
  }

  return await chartJSNodeCanvas.renderToDataURL(configuration)
}