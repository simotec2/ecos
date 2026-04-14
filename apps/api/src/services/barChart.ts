import { ChartJSNodeCanvas } from "chartjs-node-canvas"

const width = 800
const height = 400

export async function generateBarChart(competencies:any[]){

  const safe = competencies || []

  // 🔥 TOP 3
  const top = [...safe]
    .sort((a,b)=>b.score - a.score)
    .slice(0,3)

  // 🔥 BOTTOM 3
  const bottom = [...safe]
    .sort((a,b)=>a.score - b.score)
    .slice(0,3)

  const labels = [
    ...top.map(c => c.name),
    ...bottom.map(c => c.name)
  ]

  const data = [
    ...top.map(c => Number(c.score || 0)),
    ...bottom.map(c => Number(c.score || 0))
  ]

  const colors = [
    ...top.map(()=>"#16a34a"),   // verde
    ...bottom.map(()=>"#dc2626") // rojo
  ]

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height
  })

  const configuration:any = {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      responsive:false,
      animation:false,
      plugins:{
        legend:{ display:false }
      },
      scales:{
        y:{
          beginAtZero:true,
          max:100,
          ticks:{
            stepSize:20
          }
        }
      }
    }
  }

  return await chartJSNodeCanvas.renderToDataURL(configuration)
}