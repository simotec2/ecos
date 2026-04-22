import { useEffect, useState } from "react"
import { apiFetch } from "../api"

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js"

import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Dashboard(){

  const [data,setData] = useState<any>(null)

  useEffect(()=>{
    load()
  },[])

  async function load(){
    const res = await apiFetch("/api/dashboard")
    setData(res.data)
  }

  if(!data) return <div style={{padding:20}}>Cargando...</div>

  const total =
    data.semaforo.verde +
    data.semaforo.amarillo +
    data.semaforo.rojo || 1

  const pct = (v:number)=> Math.round((v/total)*100)

  /* ================= COMPETENCIAS ================= */

  const entries = Object.entries(data.competencias || {})
  const sorted = [...entries].sort((a:any,b:any)=> b[1] - a[1])

  const top3 = sorted.slice(0,3)
  const bottom3 = [...sorted].reverse().slice(0,3)

  /* ================= CRÍTICOS ================= */

  const criticos = data.ranking
    .filter((p:any)=>p.estado === "ROJO")
    .slice(0,5)

  /* ================= DONUT ================= */

  const donutData = {
    labels:["Verde","Amarillo","Rojo"],
    datasets:[{
      data:[
        data.semaforo.verde,
        data.semaforo.amarillo,
        data.semaforo.rojo
      ],
      backgroundColor:["#16a34a","#f59e0b","#dc2626"],
      borderWidth:0
    }]
  }

  return(
    <div style={styles.container}>

      <h2 style={styles.title}>Dashboard Ejecutivo</h2>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <KPI title="Evaluados" value={total}/>
        <KPI title="Recomendables" value={`${pct(data.semaforo.verde)}%`} color="#16a34a"/>
        <KPI title="Observaciones" value={`${pct(data.semaforo.amarillo)}%`} color="#f59e0b"/>
        <KPI title="Críticos" value={`${pct(data.semaforo.rojo)}%`} color="#dc2626"/>
      </div>

      {/* RIESGO */}
      <div style={styles.card}>
        <h3 style={styles.subtitle}>Nivel de riesgo</h3>

        <div style={styles.donutWrap}>
          <Doughnut data={donutData}/>
          <div style={styles.center}>
            {pct(data.semaforo.rojo)}%
            <span style={styles.centerLabel}>riesgo crítico</span>
          </div>
        </div>
      </div>

      {/* COMPETENCIAS */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h3 style={styles.subtitle}>Fortalezas</h3>
          {top3.map((c:any)=>(
            <Row key={c[0]} label={c[0]} value={c[1]} color="#16a34a"/>
          ))}
        </div>

        <div style={styles.card}>
          <h3 style={styles.subtitle}>Brechas críticas</h3>
          {bottom3.map((c:any)=>(
            <Row key={c[0]} label={c[0]} value={c[1]} color="#dc2626"/>
          ))}
        </div>

      </div>

      {/* INSIGHT (CORTO Y LIMPIO) */}
      <div style={styles.insight}>
        {data.insight}
      </div>

      {/* FOCO */}
      <div style={styles.card}>
        <h3 style={styles.subtitle}>Foco de intervención</h3>

        <p style={styles.note}>
          {criticos.length} trabajadores en condición crítica
        </p>

        {criticos.map((p:any, i:number)=>(
          <div key={i} style={styles.row}>
            <span>{p.nombre}</span>
            <strong style={{color:"#dc2626"}}>
              {p.score}%
            </strong>
          </div>
        ))}

      </div>

    </div>
  )
}

/* ================= COMPONENTES ================= */

function KPI({title,value,color}:any){
  return(
    <div style={{
      ...styles.kpi,
      borderTop:`4px solid ${color || "#e5e7eb"}`
    }}>
      <span style={styles.kpiLabel}>{title}</span>
      <strong style={{color}}>
        {value}
      </strong>
    </div>
  )
}

function Row({label,value,color}:any){
  return(
    <div style={styles.row}>
      <span>{label}</span>
      <strong style={{color}}>
        {value}%
      </strong>
    </div>
  )
}

/* ================= ESTILOS ================= */

const styles:any = {

  container:{
    padding:20,
    background:"#f9fafb",
    display:"grid",
    gap:20
  },

  title:{
    fontSize:20,
    fontWeight:700
  },

  subtitle:{
    fontSize:14,
    fontWeight:600,
    marginBottom:10
  },

  kpiGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(4,1fr)",
    gap:15
  },

  kpi:{
    background:"#fff",
    padding:15,
    borderRadius:10,
    display:"flex",
    flexDirection:"column",
    gap:5
  },

  kpiLabel:{
    fontSize:12,
    color:"#6b7280"
  },

  card:{
    background:"#fff",
    padding:20,
    borderRadius:12
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:20
  },

  donutWrap:{
    position:"relative",
    height:220,
    display:"flex",
    alignItems:"center",
    justifyContent:"center"
  },

  center:{
    position:"absolute",
    textAlign:"center",
    fontSize:28,
    fontWeight:700
  },

  centerLabel:{
    display:"block",
    fontSize:12,
    fontWeight:400,
    color:"#6b7280"
  },

  insight:{
    background:"#fff",
    padding:16,
    borderRadius:12,
    fontSize:14,
    color:"#374151",
    lineHeight:1.4,
    borderLeft:"4px solid #2563eb"
  },

  note:{
    fontSize:13,
    color:"#6b7280",
    marginBottom:10
  },

  row:{
    display:"flex",
    justifyContent:"space-between",
    padding:"8px 0",
    borderBottom:"1px solid #eee"
  }

}