import { useEffect, useState } from "react"
import { apiFetch } from "../api"

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
    return <div style={{padding:30}}>Cargando...</div>
  }

  const total = data.participantes
  const empresas = data.companies.length

  const riesgoGlobal = total > 0
    ? Math.round((data.semaforo.rojo / total) * 100)
    : null

  const topCompanies = [...data.companies]
    .sort((a:any,b:any)=> b.riesgo - a.riesgo)
    .slice(0,3)

  const brechas = Object.entries(data.competencias || {})
    .sort((a:any,b:any)=> a[1] - b[1])
    .slice(0,3)

  return(
    <div style={styles.container}>

      {/* HERO */}
      <div style={styles.hero}>

        <div>

          <div style={styles.heroLabel}>
            {total < 5 ? "SISTEMA ACTIVO" : "RIESGO GLOBAL"}
          </div>

          <div style={{
            ...styles.heroValue,
            color: riesgoGlobal === null ? "#22c55e" : getColor(riesgoGlobal)
          }}>
            {riesgoGlobal === null ? "OK" : `${riesgoGlobal}%`}
          </div>

          <div style={styles.heroSub}>
            {total < 5
              ? "Esperando volumen de datos"
              : riesgoGlobal! >= 50
              ? "Nivel crítico"
              : riesgoGlobal! >= 25
              ? "Nivel moderado"
              : "Nivel controlado"}
          </div>

        </div>

        <div style={styles.stats}>

          <Stat title="Empresas" value={empresas}/>
          <Stat title="Evaluados" value={total}/>
          <Stat title="Críticos" value={data.semaforo.rojo}/>

        </div>

      </div>

      {/* EMPRESAS */}
      <div style={styles.card}>

        <div style={styles.title}>
          Empresas con mayor riesgo
        </div>

        {topCompanies.length === 0 && (
          <div style={styles.empty}>
            Sin datos suficientes
          </div>
        )}

        {topCompanies.map((c:any,i:number)=>{

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
                fontWeight:800,
                fontSize:22,
                color
              }}>
                {total < 5 ? "-" : `${c.riesgo}%`}
              </div>

            </div>
          )
        })}

      </div>

      {/* BRECHAS */}
      <div style={styles.card}>

        <div style={styles.title}>
          Principales brechas
        </div>

        {brechas.length === 0 && (
          <div style={styles.empty}>
            Se activará con mayor volumen de datos
          </div>
        )}

        {brechas.map((b:any,i:number)=>{

          const val = Number(b[1])
          const color = getColor(val)

          return(
            <div key={i} style={styles.row}>

              <div style={styles.rank}>
                {b[0]}
              </div>

              <div style={{
                fontWeight:700,
                color
              }}>
                {val}%
              </div>

            </div>
          )
        })}

      </div>

      {/* GRID EMPRESAS */}
      <div style={styles.grid}>

        {data.companies.map((c:any)=>{

          const color = getColor(c.riesgo)

          return(
            <div key={c.id} style={{
              ...styles.company,
              borderTop:`4px solid ${color}`
            }}>

              <div style={styles.companyName}>
                {c.name}
              </div>

              <div style={styles.sub}>
                {c.total} evaluados
              </div>

              <div style={{
                fontSize:26,
                fontWeight:800,
                color
              }}>
                {total < 5 ? "-" : `${c.riesgo}%`}
              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}

/* COMPONENTES */

function Stat({title,value}:any){
  return(
    <div style={styles.stat}>
      <div style={styles.statLabel}>{title}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  )
}

/* ESTILOS */

const styles:any = {

  container:{
    padding:30,
    display:"grid",
    gap:20,
    background:"#f1f5f9",
    minHeight:"100vh"
  },

  hero:{
    background:"#fff",
    padding:30,
    borderRadius:20,
    display:"flex",
    justifyContent:"space-between",
    boxShadow:"0 10px 25px rgba(0,0,0,0.08)"
  },

  heroLabel:{fontSize:12,color:"#6b7280"},
  heroValue:{fontSize:60,fontWeight:800},
  heroSub:{fontSize:14,color:"#6b7280"},

  stats:{display:"flex",gap:20},

  stat:{textAlign:"center"},
  statLabel:{fontSize:12,color:"#6b7280"},
  statValue:{fontSize:20,fontWeight:700},

  card:{
    background:"#fff",
    padding:20,
    borderRadius:16,
    boxShadow:"0 10px 20px rgba(0,0,0,0.05)"
  },

  title:{
    fontWeight:600,
    marginBottom:10
  },

  row:{
    display:"flex",
    justifyContent:"space-between",
    padding:"10px 0",
    borderBottom:"1px solid #e5e7eb"
  },

  rank:{fontWeight:600},
  sub:{fontSize:12,color:"#6b7280"},

  empty:{
    color:"#6b7280",
    fontSize:13,
    padding:10
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
    gap:15
  },

  company:{
    background:"#fff",
    padding:20,
    borderRadius:16,
    boxShadow:"0 10px 20px rgba(0,0,0,0.05)"
  },

  companyName:{fontWeight:600}

}