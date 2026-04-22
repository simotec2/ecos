import { useEffect, useState } from "react"
import { apiFetch } from "../api"

/* ================= COLOR ================= */
function getColor(value:number){
  if(value >= 50) return "#dc2626"
  if(value >= 25) return "#f59e0b"
  return "#16a34a"
}

/* ================= LABEL ================= */
function getLabel(value:number){
  if(value >= 50) return "Crítico"
  if(value >= 25) return "Moderado"
  return "Controlado"
}

export default function Dashboard(){

  const [data,setData] = useState<any>({
    participantes: 0,
    semaforo: { verde:0, amarillo:0, rojo:0 },
    companies: []
  })

  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")

  useEffect(()=>{
    load()
  },[])

  async function load(){
    try{
      setLoading(true)
      setError("")

      const res = await apiFetch("/api/dashboard")

      if(!res?.data){
        throw new Error("Respuesta inválida")
      }

      setData({
        participantes: res.data.participantes || 0,
        semaforo: res.data.semaforo || { verde:0, amarillo:0, rojo:0 },
        companies: res.data.companies || []
      })

    }catch(err:any){
      console.error(err)
      setError("Error cargando dashboard")
    }finally{
      setLoading(false)
    }
  }

  /* ================= ESTADOS ================= */

  if(loading){
    return <div style={{padding:20}}>Cargando dashboard...</div>
  }

  if(error){
    return <div style={{padding:20,color:"red"}}>{error}</div>
  }

  /* ================= UI ================= */

  return(
    <div style={styles.container}>

      {/* HEADER */}
      <div>
        <h2 style={styles.title}>Dashboard Ejecutivo</h2>
        <p style={styles.subtitle}>
          Estado de riesgo por empresa
        </p>
      </div>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <KPI title="Evaluados" value={data.participantes}/>
        <KPI title="Verde" value={data.semaforo.verde} color="#16a34a"/>
        <KPI title="Amarillo" value={data.semaforo.amarillo} color="#f59e0b"/>
        <KPI title="Rojo" value={data.semaforo.rojo} color="#dc2626"/>
      </div>

      {/* EMPRESAS */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Empresas</h3>

        {data.companies.length === 0 && (
          <div style={{padding:20,color:"#6b7280"}}>
            Sin datos disponibles
          </div>
        )}

        {data.companies.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Empresa</th>
                <th style={styles.th}>Evaluados</th>
                <th style={styles.th}>Críticos</th>
                <th style={styles.th}>Riesgo</th>
                <th style={styles.th}>Recomendación</th>
              </tr>
            </thead>

            <tbody>
              {data.companies.map((c:any)=>{

                const riesgo = Number(c.riesgo || 0)
                const color = getColor(riesgo)

                return(
                  <tr key={c.id}>
                    <td style={styles.td}>{c.name || "-"}</td>

                    <td style={styles.td}>
                      {c.total || 0}
                    </td>

                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background:"#dc2626"
                      }}>
                        {c.rojo || 0}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{
                          ...styles.riskBar,
                          background: color,
                          width: `${riesgo}%`
                        }}/>
                        <span style={{color,fontWeight:600}}>
                          {riesgo}%
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span style={{color}}>
                        {c.recomendacion || "-"}
                      </span>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

      </div>

    </div>
  )
}

/* ================= KPI ================= */
function KPI({title,value,color}:any){
  return(
    <div style={{
      background:"#fff",
      padding:"18px",
      borderRadius:"16px",
      boxShadow:"0 8px 25px rgba(0,0,0,0.05)",
      borderLeft:`5px solid ${color || "#ddd"}`
    }}>
      <div style={{fontSize:12,color:"#6b7280"}}>
        {title}
      </div>
      <div style={{
        fontSize:28,
        fontWeight:700,
        color:color || "#111"
      }}>
        {value}
      </div>
    </div>
  )
}

/* ================= ESTILOS ================= */
const styles:any = {

  container:{
    padding:"20px",
    background:"#f9fafb",
    minHeight:"100vh",
    display:"grid",
    gap:20
  },

  title:{
    margin:0,
    fontWeight:700
  },

  subtitle:{
    margin:0,
    color:"#6b7280",
    fontSize:13
  },

  kpiGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(4,1fr)",
    gap:15
  },

  card:{
    background:"#fff",
    padding:"20px",
    borderRadius:"16px",
    boxShadow:"0 8px 25px rgba(0,0,0,0.05)"
  },

  sectionTitle:{
    marginBottom:10,
    fontSize:15,
    fontWeight:600
  },

  table:{
    width:"100%",
    borderCollapse:"collapse"
  },

  th:{
    textAlign:"left",
    padding:"10px",
    borderBottom:"1px solid #e5e7eb",
    fontSize:13,
    color:"#6b7280"
  },

  td:{
    padding:"12px",
    borderBottom:"1px solid #f1f5f9"
  },

  badge:{
    color:"#fff",
    padding:"4px 10px",
    borderRadius:6,
    fontSize:12
  },

  riskBar:{
    height:8,
    borderRadius:6
  }

}