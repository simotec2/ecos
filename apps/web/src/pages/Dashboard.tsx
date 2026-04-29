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

  function getTraffic(){

    let verde = 0
    let amarillo = 0
    let rojo = 0

    results.forEach((r:any)=>{

      const raw = typeof r.resultJson === "string"
        ? JSON.parse(r.resultJson)
        : r.resultJson

      const color = raw?.traffic?.color

      if(color === "VERDE") verde++
      else if(color === "AMARILLO") amarillo++
      else if(color === "ROJO") rojo++

    })

    return { verde, amarillo, rojo }

  }

  function getTopCompetencies(){

    const map:any = {}

    results.forEach((r:any)=>{

      const raw = typeof r.resultJson === "string"
        ? JSON.parse(r.resultJson)
        : r.resultJson

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

    return avg
      .sort((a,b)=>b.score - a.score)
      .slice(0,5)

  }

  const traffic = getTraffic()
  const top = getTopCompetencies()

  const pieData = {
    labels:["Verde","Amarillo","Rojo"],
    datasets:[{
      data:[traffic.verde, traffic.amarillo, traffic.rojo],
      backgroundColor:["#16a34a","#eab308","#dc2626"]
    }]
  }

  const barData = {
    labels: top.map(t=>t.name),
    datasets:[{
      label:"Competencias",
      data: top.map(t=>t.score),
      backgroundColor:"#2563eb"
    }]
  }

  return (

    <div style={{ padding:20 }}>

      <h1>Dashboard ECOS</h1>

      {/* KPIs */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h3>Participantes</h3>
          <p style={styles.value}>{participants.length}</p>
        </div>

        <div style={styles.card}>
          <h3>Evaluaciones</h3>
          <p style={styles.value}>{results.length}</p>
        </div>

      </div>

      {/* GRÁFICOS */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h3>Semáforo</h3>
          <Pie data={pieData} />
        </div>

        <div style={styles.card}>
          <h3>Top Competencias</h3>
          <Bar data={barData} />
        </div>

      </div>

    </div>

  )

}

const styles:any = {

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))",
    gap:20,
    marginTop:20
  },

  card:{
    background:"#fff",
    padding:20,
    borderRadius:10,
    boxShadow:"0 4px 10px rgba(0,0,0,0.05)"
  },

  value:{
    fontSize:28,
    fontWeight:"bold"
  }

}