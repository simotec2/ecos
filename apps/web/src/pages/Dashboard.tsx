import { useEffect, useState } from "react"
import { apiFetch } from "../api"

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

  const entries = Object.entries(data.competencias || {})
  const sorted = [...entries].sort((a:any,b:any)=> b[1] - a[1])

  const top3 = sorted.slice(0,3)
  const bottom3 = [...sorted].reverse().slice(0,3)

  const criticos = data.ranking.filter((p:any)=>p.estado === "ROJO")

  return(
    <div style={styles.container}>

      <h2>Dashboard Ejecutivo</h2>

      {/* 🔥 INSIGHT PRINCIPAL */}
      <div style={styles.insightBox}>
        <h3>Insight Organizacional</h3>
        <p>{data.insight}</p>
      </div>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <Card title="Evaluados" value={total}/>
        <Card title="Recomendables" value={`${pct(data.semaforo.verde)}%`} color="#16a34a"/>
        <Card title="Observaciones" value={`${pct(data.semaforo.amarillo)}%`} color="#f59e0b"/>
        <Card title="Críticos" value={`${pct(data.semaforo.rojo)}%`} color="#dc2626"/>
      </div>

      {/* COMPETENCIAS */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h3>Fortalezas organizacionales</h3>
          {top3.map((c:any)=>(
            <Row key={c[0]} label={c[0]} value={c[1]} color="#16a34a"/>
          ))}
        </div>

        <div style={styles.card}>
          <h3>Brechas críticas</h3>
          {bottom3.map((c:any)=>(
            <Row key={c[0]} label={c[0]} value={c[1]} color="#dc2626"/>
          ))}
        </div>

      </div>

      {/* FOCO */}
      <div style={styles.card}>
        <h3>Foco de intervención</h3>

        <p style={{color:"#6b7280"}}>
          {criticos.length} trabajadores en condición crítica
        </p>

        {criticos.slice(0,3).map((p:any, i:number)=>(
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

/* UI */

function Card({title,value,color}:any){
  return(
    <div style={{
      ...styles.card,
      borderTop:`4px solid ${color || "#ddd"}`
    }}>
      <div style={{fontSize:12,color:"#6b7280"}}>{title}</div>
      <div style={{fontSize:26,fontWeight:700,color}}>
        {value}
      </div>
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

/* estilos */

const styles:any = {

  container:{
    padding:20,
    background:"#f9fafb",
    display:"grid",
    gap:20
  },

  insightBox:{
    background:"#111",
    color:"#fff",
    padding:20,
    borderRadius:12,
    fontSize:14,
    lineHeight:1.5
  },

  kpiGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(4,1fr)",
    gap:15
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:20
  },

  card:{
    background:"#fff",
    padding:20,
    borderRadius:12
  },

  row:{
    display:"flex",
    justifyContent:"space-between",
    padding:"8px 0",
    borderBottom:"1px solid #eee"
  }

}