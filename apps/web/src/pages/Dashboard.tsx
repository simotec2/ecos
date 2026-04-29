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

  /* ===============================
  KPI CONSOLIDADO POR PARTICIPANTE
  =============================== */
  function getKPIs(){

    const map:any = {}

    results.forEach(r=>{

      const pid = r.participantId

      if(!map[pid]) map[pid] = []

      const raw = parse(r)
      map[pid].push(raw?.traffic?.color)

    })

    let verde = 0
    let amarillo = 0
    let rojo = 0

    Object.values(map).forEach((colors:any)=>{

      if(colors.includes("ROJO")) rojo++
      else if(colors.includes("AMARILLO")) amarillo++
      else verde++

    })

    const total = participants.length
    const rendidos = Object.keys(map).length
    const pendientes = total - rendidos

    return { total, rendidos, pendientes, verde, amarillo, rojo }
  }

  /* ===============================
  COMPETENCIAS (PROMEDIO GLOBAL)
  =============================== */
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

  /* ===============================
  DATA GRAFICOS
  =============================== */
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

      {/* KPI */}
      <div style={styles.kpiGrid}>

        <KPI title="Total" value={kpi.total} />
        <KPI title="Rendidos" value={kpi.rendidos} />
        <KPI title="Pendientes" value={kpi.pendientes} />

        <KPI title="Verde" value={kpi.verde} color="#16a34a"/>
        <KPI title="Amarillo" value={kpi.amarillo} color="#eab308"/>
        <KPI title="Rojo" value={kpi.rojo} color="#dc2626"/>

      </div>

      {/* GRAFICOS */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h3>Semáforo</h3>
          <Pie data={pieData} />
        </div>

        <div style={styles.card}>
          <h3>Top Competencias</h3>
          <Bar data={topBar} options={chartOptions}/>
        </div>

        <div style={styles.card}>
          <h3>Brechas (Bottom)</h3>
          <Bar data={bottomBar} options={chartOptions}/>
        </div>

      </div>

    </div>

  )
}

/* KPI COMPONENT */
function KPI({title,value,color="#2563eb"}:any){
  return(
    <div style={{...styles.kpi, borderTop:`4px solid ${color}`}}>
      <div>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  )
}

/* CHART OPTIONS */
const chartOptions = {
  responsive:true,
  maintainAspectRatio:false,
  plugins:{ legend:{ display:false } },
  scales:{ y:{ beginAtZero:true } }
}

/* STYLES */
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

  card:{
    background:"#fff",
    padding:12,
    borderRadius:8,
    height:260
  }

}