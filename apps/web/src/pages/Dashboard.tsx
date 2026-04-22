import { useEffect, useState } from "react"
import { apiFetch } from "../api"

/* ================= COLOR ================= */
function getColor(value:number){
  if(value >= 50) return "#dc2626"
  if(value >= 25) return "#f59e0b"
  return "#16a34a"
}

/* ================= COMPONENTE ================= */
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

  const companies = data.companies || []

  /* ================= EMPRESA MÁS CRÍTICA ================= */

  const topCompany =
    companies.length > 0
      ? [...companies].sort((a:any,b:any)=> b.riesgo - a.riesgo)[0]
      : null

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

      {/* EMPRESA CRÍTICA */}
      {topCompany && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Empresa con mayor riesgo</h3>

          <div style={styles.topRow}>
            <div>
              <div style={styles.companyName}>
                {topCompany.name}
              </div>
              <div style={styles.companySub}>
                {topCompany.total} evaluados
              </div>
            </div>

            <div style={{
              fontSize:32,
              fontWeight:700,
              color: getColor(topCompany.riesgo)
            }}>
              {topCompany.riesgo}%
            </div>
          </div>

          <div style={{
            marginTop:10,
            color:"#6b7280",
            fontSize:13
          }}>
            {topCompany.recomendacion}
          </div>
        </div>
      )}

      {/* TARJETAS EMPRESAS */}
      <div style={styles.grid}>

        {companies.map((c:any)=>{

          const color = getColor(c.riesgo)

          return(
            <div key={c.id} style={{
              ...styles.card,
              borderTop:`4px solid ${color}`
            }}>

              <div style={styles.companyName}>
                {c.name}
              </div>

              <div style={styles.companySub}>
                {c.total} evaluados
              </div>

              <div style={{
                fontSize:26,
                fontWeight:700,
                color,
                marginTop:10
              }}>
                {c.riesgo}%
              </div>

              <div style={{
                marginTop:10,
                fontSize:12,
                color:"#6b7280"
              }}>
                {c.recomendacion}
              </div>

            </div>
          )
        })}

      </div>

      {/* TABLA */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Detalle por empresa</h3>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Empresa</th>
              <th style={styles.th}>Evaluados</th>
              <th style={styles.th}>Críticos</th>
              <th style={styles.th}>Riesgo</th>
            </tr>
          </thead>

          <tbody>
            {companies.map((c:any)=>(
              <tr key={c.id}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>{c.total}</td>
                <td style={styles.td}>
                  <span style={styles.badge}>
                    {c.rojo}
                  </span>
                </td>
                <td style={{
                  ...styles.td,
                  color:getColor(c.riesgo),
                  fontWeight:600
                }}>
                  {c.riesgo}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
    gap:20
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

  topRow:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  },

  companyName:{
    fontWeight:600,
    fontSize:16
  },

  companySub:{
    fontSize:12,
    color:"#6b7280"
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
    background:"#dc2626",
    color:"#fff",
    padding:"4px 10px",
    borderRadius:6,
    fontSize:12
  }

}