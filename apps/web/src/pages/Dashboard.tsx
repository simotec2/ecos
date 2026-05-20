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

    try{

      return typeof r.resultJson === "string"
        ? JSON.parse(r.resultJson)
        : r.resultJson

    }catch{

      return {}

    }

  }

  /* ===============================
  KPI CONSOLIDADO
  =============================== */

  function getKPIs(){

    const map:any = {}

    results.forEach(r=>{

      const pid = r.participantId

      if(!map[pid]){

        map[pid] = []

      }

      const raw = parse(r)

      const score =
        Number(raw?.score || 0)

      let color = "VERDE"

      if(score < 55){

        color = "ROJO"

      }else if(score < 85){

        color = "AMARILLO"

      }

      map[pid].push(color)

    })

    let verde = 0
    let amarillo = 0
    let rojo = 0

    Object.values(map).forEach((colors:any)=>{

      if(colors.includes("ROJO")){

        rojo++

      }else if(colors.includes("AMARILLO")){

        amarillo++

      }else{

        verde++

      }

    })

    const total = participants.length

    const rendidos =
      Object.keys(map).length

    const pendientes =
      total - rendidos

    return {

      total,
      rendidos,
      pendientes,
      verde,
      amarillo,
      rojo

    }

  }

  /* ===============================
  COMPETENCIAS
  =============================== */

  function getCompetencias(){

    const map:any = {}

    results.forEach(r=>{

      const raw = parse(r)

      const comps =
        raw?.competencies || []

      comps.forEach((c:any)=>{

        if(!c?.name) return

        if(!map[c.name]){

          map[c.name] = []

        }

        map[c.name].push(c.score)

      })

    })

    const avg = Object.entries(map).map(([name,arr]:any)=>({

      name,

      score:
        arr.reduce((a:number,b:number)=>a+b,0)
        / arr.length

    }))

    const sorted =
      avg.sort((a,b)=>b.score-a.score)

    return {

      top:
        sorted.slice(0,5),

      bottom:
        sorted.slice(-5).reverse()

    }

  }

  const kpi = getKPIs()
  const comp = getCompetencias()

  /* ===============================
  PIE DATA
  =============================== */

  const pieData = {

    labels:[
      "Verde",
      "Amarillo",
      "Rojo"
    ],

    datasets:[{

      data:[
        kpi.verde,
        kpi.amarillo,
        kpi.rojo
      ],

      backgroundColor:[
        "#16a34a",
        "#eab308",
        "#dc2626"
      ],

      borderWidth:0

    }]

  }

  /* ===============================
  TOP BAR
  =============================== */

  const topBar = {

    labels:
      comp.top.map(c=>c.name),

    datasets:[{

      data:
        comp.top.map(c=>c.score),

      backgroundColor:"#2563eb",

      borderRadius:8

    }]

  }

  /* ===============================
  BOTTOM BAR
  =============================== */

  const bottomBar = {

    labels:
      comp.bottom.map(c=>c.name),

    datasets:[{

      data:
        comp.bottom.map(c=>c.score),

      backgroundColor:"#dc2626",

      borderRadius:8

    }]

  }

  return (

    <div style={{padding:20}}>

      <h1 style={styles.title}>
        Dashboard ECOS
      </h1>

      {/* KPI */}

      <div style={styles.kpiGrid}>

        <KPI
          title="Total"
          value={kpi.total}
        />

        <KPI
          title="Rendidos"
          value={kpi.rendidos}
        />

        <KPI
          title="Pendientes"
          value={kpi.pendientes}
        />

        <KPI
          title="Verde"
          value={kpi.verde}
          color="#16a34a"
        />

        <KPI
          title="Amarillo"
          value={kpi.amarillo}
          color="#eab308"
        />

        <KPI
          title="Rojo"
          value={kpi.rojo}
          color="#dc2626"
        />

      </div>

      {/* GRAFICOS */}

      <div style={styles.grid}>

        <div style={styles.card}>

          <h3 style={styles.cardTitle}>
            Resultados Generales
          </h3>

          <div style={styles.chartBox}>

            <Pie
              data={pieData}
              options={pieOptions}
            />

          </div>

        </div>

        <div style={styles.card}>

          <h3 style={styles.cardTitle}>
            Top Competencias
          </h3>

          <div style={styles.chartBox}>

            <Bar
              data={topBar}
              options={chartOptions}
            />

          </div>

        </div>

        <div style={styles.card}>

          <h3 style={styles.cardTitle}>
            Brechas Críticas
          </h3>

          <div style={styles.chartBox}>

            <Bar
              data={bottomBar}
              options={chartOptions}
            />

          </div>

        </div>

      </div>

    </div>

  )

}

/* KPI */

function KPI({
  title,
  value,
  color="#2563eb"
}:any){

  return(

    <div
      style={{
        ...styles.kpi,
        borderTop:`4px solid ${color}`
      }}
    >

      <div style={styles.kpiTitle}>
        {title}
      </div>

      <div style={styles.kpiValue}>
        {value}
      </div>

    </div>

  )

}

/* OPTIONS */

const chartOptions:any = {

  responsive:true,

  maintainAspectRatio:false,

  plugins:{

    legend:{
      display:false
    }

  },

  scales:{

    x:{

      ticks:{
        color:"#cbd5e1"
      },

      grid:{
        color:"rgba(255,255,255,0.05)"
      }

    },

    y:{

      beginAtZero:true,

      ticks:{
        color:"#cbd5e1"
      },

      grid:{
        color:"rgba(255,255,255,0.05)"
      }

    }

  }

}

const pieOptions:any = {

  responsive:true,

  maintainAspectRatio:false,

  plugins:{

    legend:{

      labels:{
        color:"#ffffff"
      }

    }

  }

}

/* STYLES */

const styles:any = {

  title:{

    color:"#ffffff",

    fontSize:32,

    fontWeight:700,

    marginBottom:24

  },

  kpiGrid:{

    display:"grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px,1fr))",

    gap:16

  },

  kpi:{

    background:
      "rgba(17,36,58,0.92)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:18,

    padding:20,

    textAlign:"center",

    boxShadow:
      "0 8px 30px rgba(0,0,0,0.35)",

    backdropFilter:
      "blur(10px)"

  },

  kpiTitle:{

    color:"#94a3b8",

    fontSize:14,

    marginBottom:8

  },

  kpiValue:{

    fontSize:34,

    fontWeight:"bold",

    color:"#ffffff"

  },

  grid:{

    display:"grid",

    gridTemplateColumns:
      "repeat(3, 1fr)",

    gap:20,

    marginTop:24

  },

  card:{

    background:
      "rgba(17,36,58,0.92)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:20,

    padding:20,

    height:360,

    boxShadow:
      "0 8px 30px rgba(0,0,0,0.35)",

    backdropFilter:
      "blur(10px)"

  },

  cardTitle:{

    color:"#ffffff",

    marginBottom:18,

    fontSize:18,

    fontWeight:600

  },

  chartBox:{

    height:260

  }

}