import { useEffect, useState } from "react"
import { apiFetch } from "../api"

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js"

import { Pie, Bar } from "react-chartjs-2"

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
)

export default function Dashboard(){

  const [participants,setParticipants] = useState<any[]>([])
  const [results,setResults] = useState<any[]>([])

  useEffect(()=>{
    loadData()
  },[])

  async function loadData(){
    try{
      const p = await apiFetch("/api/participants")
      const r = await apiFetch("/api/results")

      setParticipants(p || [])
      setResults(r || [])

    }catch(err){
      console.error(err)
    }
  }

  function parse(r:any){
    return typeof r.resultJson === "string"
      ? JSON.parse(r.resultJson)
      : r.resultJson
  }

  function getKPIs(){

    let verde = 0
    let amarillo = 0
    let rojo = 0

    results.forEach(r=>{
      const raw = parse(r)
      const c = raw?.traffic?.color

      if(c==="VERDE") verde++
      else if(c==="AMARILLO") amarillo++
      else if(c==="ROJO") rojo++
    })

    const rendidos = results.length
    const total = participants.length
    const pendientes = total - rendidos

    return { total, rendidos, pendientes, verde, amarillo, rojo }
  }

  function getCompetencias(){

    const map:any = {}

    results.forEach(r=>{
      const raw = parse(r)
      const comps = raw?.competencies || []

      comps.forEach((c:any)=>{
        if(!c?.name) return
        if(!map[c.name]) map[c.name] = []
        map[c.name].push(c.score)
      })
    })

    const avg = Object.entries(map).map(([name,arr]:any)=>({
      name,
      score: arr.reduce((a:number,b:number)=>a+b,0) / arr.length
    }))

    const sorted = avg.sort((a,b)=>b.score-a.score)

    return {
      top: sorted.slice(0,5),
      bottom: sorted.slice(-5).reverse()
    }
  }

  const kpi = getKPIs()
  const comp = getCompetencias()

  const pieData = {
    labels:["Verde","Amarillo","Rojo"],
    datasets:[{
      data:[kpi.verde, kpi.amarillo, kpi.rojo],
      backgroundColor:["#16a34a","#eab308","#dc2626"]
    }]
  }

  const topBar = {
    labels: comp.top.map(c=>c.name),
    datasets:[{
      data: comp.top.map(c=>c.score),
      backgroundColor:"#2563eb"
    }]
  }

  const bottomBar = {
    labels: comp.bottom.map(c=>c.name),
    datasets:[{
      data: comp.bottom.map(c=>c.score),
      backgroundColor:"#dc2626"
    }]
  }

  return (
    <div style={{ padding:20 }}>

      <h1>Dashboard ECOS</h1>

      {/* KPIs */}
      <div style={styles.kpiGrid}>

        <KPI title="Total" value={kpi.total} />
        <KPI title="Rendidos" value={kpi.rendidos} />
        <KPI title="Pendientes" value={kpi.pendientes} />

        <KPI title="Verde" value={kpi.verde} color="#16a34a"/>
        <KPI title="Amarillo" value={kpi.amarillo} color="#eab308"/>
        <KPI title="Rojo" value={kpi.rojo} color="#dc2626"/>

      </div>

      {/* GRÁFICOS */}
      <div style={styles.grid}>

        <div style={styles.cardSmall}>
          <h3>Semáforo</h3>
          <Pie data={pieData} />
        </div>

        <div style={styles.cardSmall}>
          <h3>Top Competencias</h3>
          <Bar data={topBar} options={smallBarOptions}/>
        </div>

        <div style={styles.cardSmall}>
          <h3>Brechas (Bottom)</h3>
          <Bar data={bottomBar} options={smallBarOptions}/>
        </div>

      </div>

    </div>
  )
}

/* COMPONENTE KPI */
function KPI({title,value,color="#2563eb"}:any){
  return(
    <div style={{...styles.kpi, borderTop:`4px solid ${color}`}}>
      <div>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  )
}

/* OPCIONES PARA REDUCIR ALTURA */
const smallBarOptions = {
  responsive:true,
  maintainAspectRatio:false,
  plugins:{ legend:{ display:false } },
  scales:{
    y:{ beginAtZero:true }
  }
}

/* ESTILOS */
const styles:any = {

  kpiGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit, minmax(140px,1fr))",
    gap:10
  },

  kpi:{
    background:"#fff",
    padding:12,
    borderRadius:8,
    textAlign:"center"
  },

  kpiValue:{
    fontSize:22,
    fontWeight:"bold"
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(3, 1fr)",
    gap:15,
    marginTop:20
  },

  cardSmall:{
    background:"#fff",
    padding:12,
    borderRadius:8,
    height:260
  }

}