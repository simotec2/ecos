import { useEffect, useState } from "react"
import { apiFetch } from "../api"

function getColor(value:number){
  if(value >= 50) return "#dc2626"
  if(value >= 25) return "#f59e0b"
  return "#16a34a"
}

export default function Dashboard(){

  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    load()
  },[])

  async function load(){
    try{
      const res = await apiFetch("/api/dashboard")
      setData(res.data || {})
    }catch(e){
      console.error(e)
      setData({})
    }finally{
      setLoading(false)
    }
  }

  if(loading){
    return <div style={{padding:30}}>Cargando...</div>
  }

  const participantes = data?.participantes || 0
  const semaforo = data?.semaforo || { verde:0, amarillo:0, rojo:0 }
  const companies = data?.companies || []
  const competencias = data?.competencias || {}

  const riesgoGlobal = participantes > 0
    ? Math.round((semaforo.rojo / participantes) * 100)
    : null

  const topCompanies = [...companies]
    .sort((a:any,b:any)=> b.riesgo - a.riesgo)
    .slice(0,3)

  const brechas = Object.entries(competencias)
    .sort((a:any,b:any)=> a[1] - b[1])
    .slice(0,3)

  return(
    <div style={styles.container}>

      {/* HERO */}
      <div style={styles.hero}>

        <div>
          <div style={styles.label}>
            {participantes === 0 ? "SISTEMA ACTIVO" : "RIESGO GLOBAL"}
          </div>

          <div style={{
            ...styles.value,
            color: riesgoGlobal === null ? "#16a34a" : getColor(riesgoGlobal)
          }}>
            {riesgoGlobal === null ? "OK" : `${riesgoGlobal}%`}
          </div>

          <div style={styles.sub}>
            {participantes === 0
              ? "Sin evaluaciones aún"
              : riesgoGlobal! >= 50
              ? "Nivel crítico"
              : riesgoGlobal! >= 25
              ? "Nivel moderado"
              : "Nivel controlado"}
          </div>
        </div>

        <div style={styles.stats}>
          <Stat title="Empresas" value={companies.length}/>
          <Stat title="Evaluados" value={participantes}/>
          <Stat title="Críticos" value={semaforo.rojo}/>
        </div>

      </div>

      {/* EMPRESAS */}
      <div style={styles.card}>
        <Title text="Empresas con mayor riesgo"/>

        {topCompanies.length === 0 && (
          <Empty text="Sin datos suficientes"/>
        )}

        {topCompanies.map((c:any,i:number)=>(
          <Row
            key={c.id}
            left={`${i+1}. ${c.name}`}
            sub={`${c.total} evaluados`}
            right={participantes === 0 ? "-" : `${c.riesgo}%`}
            color={getColor(c.riesgo)}
          />
        ))}

      </div>

      {/* BRECHAS */}
      <div style={styles.card}>
        <Title text="Principales brechas"/>

        {brechas.length === 0 && (
          <Empty text="Se activará con más evaluaciones"/>
        )}

        {brechas.map((b:any,i:number)=>(
          <Row
            key={i}
            left={b[0]}
            right={`${b[1]}%`}
            color={getColor(Number(b[1]))}
          />
        ))}

      </div>

      {/* GRID EMPRESAS */}
      <div style={styles.grid}>

        {companies.map((c:any)=>(
          <div key={c.id} style={{
            ...styles.company,
            borderTop:`4px solid ${getColor(c.riesgo)}`
          }}>

            <div style={styles.companyName}>{c.name}</div>

            <div style={styles.sub}>
              {c.total} evaluados
            </div>

            <div style={{
              fontSize:24,
              fontWeight:700,
              color:getColor(c.riesgo)
            }}>
              {participantes === 0 ? "-" : `${c.riesgo}%`}
            </div>

          </div>
        ))}

      </div>

    </div>
  )
}

/* COMPONENTES */

function Stat({title,value}:any){
  return(
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:12,color:"#6b7280"}}>{title}</div>
      <div style={{fontSize:20,fontWeight:700}}>{value}</div>
    </div>
  )
}

function Row({left,sub,right,color}:any){
  return(
    <div style={styles.row}>
      <div>
        <div style={{fontWeight:600}}>{left}</div>
        {sub && <div style={styles.sub}>{sub}</div>}
      </div>
      <div style={{fontWeight:700,color}}>{right}</div>
    </div>
  )
}

function Title({text}:any){
  return <div style={styles.title}>{text}</div>
}

function Empty({text}:any){
  return <div style={styles.empty}>{text}</div>
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
    borderRadius:16,
    display:"flex",
    justifyContent:"space-between",
    boxShadow:"0 6px 20px rgba(0,0,0,0.06)"
  },

  label:{fontSize:12,color:"#6b7280"},
  value:{fontSize:56,fontWeight:800},
  sub:{fontSize:13,color:"#6b7280"},

  stats:{display:"flex",gap:20},

  card:{
    background:"#fff",
    padding:20,
    borderRadius:16,
    boxShadow:"0 6px 20px rgba(0,0,0,0.05)"
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
    boxShadow:"0 6px 20px rgba(0,0,0,0.05)"
  },

  companyName:{fontWeight:600}

}