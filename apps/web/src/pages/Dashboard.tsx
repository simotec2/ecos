import { useEffect, useState } from "react"
import { apiFetch } from "../api"

export default function Dashboard(){

  const [participants,setParticipants] = useState<any[]>([])
  const [results,setResults] = useState<any[]>([])

  useEffect(()=>{
    loadData()
  },[])

  async function loadData(){

    try{

      const p = await apiFetch("/api/participants")
      setParticipants(p || [])

      const r = await apiFetch("/api/results")
      setResults(r || [])

    }catch(err){
      console.error(err)
    }

  }

  function getTrafficCounts(){

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

  const traffic = getTrafficCounts()

  return (

    <div style={{ padding:20 }}>

      <h1 style={{ marginBottom:20 }}>Dashboard ECOS</h1>

      {/* KPIs */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h3>Total Participantes</h3>
          <p style={styles.value}>{participants.length}</p>
        </div>

        <div style={{ ...styles.card, borderLeft:"6px solid #16a34a" }}>
          <h3>Verde</h3>
          <p style={styles.value}>{traffic.verde}</p>
        </div>

        <div style={{ ...styles.card, borderLeft:"6px solid #eab308" }}>
          <h3>Amarillo</h3>
          <p style={styles.value}>{traffic.amarillo}</p>
        </div>

        <div style={{ ...styles.card, borderLeft:"6px solid #dc2626" }}>
          <h3>Rojo</h3>
          <p style={styles.value}>{traffic.rojo}</p>
        </div>

      </div>

    </div>

  )

}

const styles:any = {

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))",
    gap:20
  },

  card:{
    background:"#fff",
    padding:20,
    borderRadius:10,
    boxShadow:"0 4px 10px rgba(0,0,0,0.05)"
  },

  value:{
    fontSize:28,
    fontWeight:"bold",
    marginTop:10
  }

}