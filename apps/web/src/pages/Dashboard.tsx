import { useEffect, useState } from "react"
import { apiFetch } from "../api"

/* ================= COLOR ================= */
function getColor(value:number){
  if(value >= 50) return "#dc2626"
  if(value >= 25) return "#f59e0b"
  return "#16a34a"
}

export default function Dashboard(){

  const [data,setData] = useState<any>({
    participantes: 0,
    semaforo: { verde:0, amarillo:0, rojo:0 },
    companies: [],
    competencias: {}
  })

  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    load()
  },[])

  async function load(){
    try{
      const res = await apiFetch("/api/dashboard")

      setData({
        participantes: res.data.participantes || 0,
        semaforo: res.data.semaforo || { verde:0, amarillo:0, rojo:0 },
        companies: res.data.companies || [],
        competencias: res.data.competencias || {}
      })

    }catch(e){
      console.error(e)
    }finally{
      setLoading(false)
    }
  }

  if(loading){
    return <div style={{padding:20}}>Cargando...</div>
  }

  const total = data.participantes || 1
  const riesgoGlobal = Math.round((data.semaforo.rojo / total) * 100)

  const companies = [...data.companies]
    .sort((a:any,b:any)=> b.riesgo - a.riesgo)
    .slice(0,3)

  const brechas = Object.entries(data.competencias || {})
    .sort((a:any,b:any)=> a[1] - b[1])
    .slice(0,3)

  return(
    <div style={styles.container}>

      {/* ================= HERO ================= */}
      <div style={styles.hero}>

        <div>
          <div style={styles.heroLabel}>RIESGO DEL SISTEMA</div>

          <div style={{
            ...styles.heroValue,
            color:getColor(riesgoGlobal)
          }}>
            {riesgoGlobal}%
          </div>

          <div style={styles.heroSub}>
            {riesgoGlobal >= 50
              ? "Nivel crítico"
              : riesgoGlobal >= 25
              ? "Nivel moderado"
              : "Nivel controlado"}
          </div>
        </div>

        <div style={styles.heroRight}>
          <Stat title="Empresas" value={data.companies.length}/>
          <Stat title="Evaluados" value={data.participantes}/>
          <Stat title="Críticos" value={data.semaforo.rojo}/>
        </div>

      </div>

      {/* ================= TOP EMPRESAS ================= */}
      <div style={styles.card}>

        <div style={styles.sectionTitle}>
          Empresas con mayor riesgo
        </div>

        {companies.map((c:any, i:number)=>{

          const color = getColor(c.riesgo)

          return(
            <div key={c.id} style={styles.row}>

              <div>
                <div style={styles.rank}>
                  {i+1}. {c.name}
                </div>
                <div style={styles.sub}>
                  {c.total} evaluados
                </div>
              </div>

              <div style={{
                fontWeight:700,
                fontSize:20,
                color
              }}>
                {c.riesgo}%
              </div>

            </div>
          )
        })}

      </div>

      {/* ================= BRECHAS ================= */}
      <div style={styles.card}>

        <div style={styles.sectionTitle}>
          Principales brechas del sistema
        </div>

        {brechas.map((b:any, i:number)=>{

          const value = Number(b[1])
          const color = getColor(value)

          return(
            <div key={i} style={styles.row}>

              <div style={styles.rank}>
                {b[0]}
              </div>

              <div style={{
                fontWeight:700,
                color
              }}>
                {value}%
              </div>

            </div>
          )
        })}

      </div>

      {/* ================= EMPRESAS GRID ================= */}
      <div style={styles.grid}>

        {data.companies.map((c:any)=>{

          const color = getColor(c.riesgo)

          return(
            <div key={c.id} style={{
              ...styles.companyCard,
              borderTop:`5px solid ${color}`
            }}>

              <div style={styles.companyName}>
                {c.name}
              </div>

              <div style={styles.sub}>
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

            </div>
          )
        })}

      </div>

    </div>
  )
}

/* ================= COMPONENTES ================= */

function Stat({title,value}:any){
  return(
    <div style={styles.stat}>
      <div style={styles.statLabel}>{title}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  )
}

/* ================= ESTILOS ================= */

const styles:any = {

  container:{
    padding:"30px",
    background:"#f8fafc",
    minHeight:"100vh",
    display:"grid",
    gap:25
  },

  hero:{
    background:"#fff",
    padding:"30px",
    borderRadius:"20px",
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    boxShadow:"0 10px 30px rgba(0,0,0,0.08)"
  },

  heroLabel:{
    fontSize:12,
    color:"#6b7280"
  },

  heroValue:{
    fontSize:64,
    fontWeight:800
  },

  heroSub:{
    fontSize:14,
    color:"#6b7280"
  },

  heroRight:{
    display:"flex",
    gap:20
  },

  stat:{
    textAlign:"center"
  },

  statLabel:{
    fontSize:12,
    color:"#6b7280"
  },

  statValue:{
    fontSize:22,
    fontWeight:700
  },

  card:{
    background:"#fff",
    padding:"20px",
    borderRadius:"16px",
    boxShadow:"0 10px 25px rgba(0,0,0,0.05)"
  },

  sectionTitle:{
    fontWeight:600,
    marginBottom:10
  },

  row:{
    display:"flex",
    justifyContent:"space-between",
    padding:"10px 0",
    borderBottom:"1px solid #f1f5f9"
  },

  rank:{
    fontWeight:600
  },

  sub:{
    fontSize:12,
    color:"#6b7280"
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
    gap:20
  },

  companyCard:{
    background:"#fff",
    padding:"20px",
    borderRadius:"16px",
    boxShadow:"0 10px 25px rgba(0,0,0,0.05)"
  },

  companyName:{
    fontWeight:600
  }

}