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

import { Doughnut, Bar } from "react-chartjs-2"

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
)

/* ================= COLOR ================= */
function getColor(value:number){
  if(value >= 70) return "#16a34a"
  if(value >= 50) return "#f59e0b"
  return "#dc2626"
}

/* ================= FORMATEO ================= */
function formatName(name:string){

  if(!name) return ""

  const n = name.toLowerCase().trim()

  if(n.includes("icom")) return "Evaluación Psicolaboral"
  if(n.includes("pets")) return "Evaluación Conductual"

  if(n.includes("seguridad")){
    let label = name.replace(/seguridad/i,"").trim()
    label = label.split("_").join(" ")
    label = label
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")

    return label
      ? `Evaluación Seguridad - ${label}`
      : "Evaluación Seguridad"
  }

  return name
}

export default function Dashboard(){

  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")

  const [empresa,setEmpresa] = useState("")
  const [tipo,setTipo] = useState("")
  const [periodo,setPeriodo] = useState("30")

  const loadData = async ()=>{
    try{
      setLoading(true)
      setError("")

      const query = `?empresa=${empresa}&tipo=${tipo}&periodo=${periodo}`
      const res = await apiFetch(`/api/dashboard${query}`)

      setData(res.data)

    }catch(err){
      console.error(err)
      setError("Error cargando dashboard")
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ loadData() },[empresa,tipo,periodo])

  if(loading) return <div style={{padding:20}}>Cargando dashboard...</div>
  if(error) return <div style={{padding:20,color:"red"}}>{error}</div>
  if(!data) return <div style={{padding:20}}>Sin datos</div>

  const total =
    data.semaforo.verde +
    data.semaforo.amarillo +
    data.semaforo.rojo || 1

  const pct = (v:number)=> Math.round((v/total)*100)

  /* ================= DONUT ================= */
  const pieData = {
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

  /* ================= COMPETENCIAS ================= */
  const competenciasEntries = Object.entries(data.competencias || {})

  const labels = competenciasEntries.map(([k])=>formatName(k))
  const values = competenciasEntries.map(([_,v]:any)=>v)

  const barData = {
    labels,
    datasets:[{
      data: values,
      backgroundColor: values.map(v => getColor(v))
    }]
  }

  return(
    <div style={styles.container}>

      {/* HEADER */}
      <div>
        <h2 style={styles.title}>Dashboard Ejecutivo</h2>
        <p style={styles.subtitle}>
          Visión general de riesgo y desempeño
        </p>
      </div>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <MiniCard title="Evaluados" value={total}/>
        <MiniCard title="Recomendables" value={`${pct(data.semaforo.verde)}%`} sub={data.semaforo.verde} color="#16a34a"/>
        <MiniCard title="Observaciones" value={`${pct(data.semaforo.amarillo)}%`} sub={data.semaforo.amarillo} color="#f59e0b"/>
        <MiniCard title="Críticos" value={`${pct(data.semaforo.rojo)}%`} sub={data.semaforo.rojo} color="#dc2626"/>
      </div>

      {/* FILTROS */}
      <div style={styles.filters}>

        <select value={empresa} onChange={e=>setEmpresa(e.target.value)}>
          <option value="">Todas las empresas</option>
          {(data.empresas || []).map((e:any)=>(
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <select value={tipo} onChange={e=>setTipo(e.target.value)}>
          <option value="">Todas</option>
          <option value="PETS">PETS</option>
          <option value="ICOM">ICOM</option>
          <option value="SECURITY">SEGURIDAD</option>
        </select>

        <select value={periodo} onChange={e=>setPeriodo(e.target.value)}>
          <option value="7">7 días</option>
          <option value="30">30 días</option>
          <option value="90">90 días</option>
        </select>

      </div>

      {/* PRINCIPAL */}
      <div style={styles.grid}>

        <Card>
          <Title>Nivel de Riesgo</Title>
          <div style={{height:240}}>
            <Doughnut 
            data={pieData} 
            options={{
              cutout:"70%",
              plugins:{
                legend:{ position:"bottom" },
                tooltip:{
                  callbacks:{
                    label:(ctx:any)=>{
                      const total = ctx.dataset.data.reduce((a:number,b:number)=>a+b,0)
                      const val = ctx.raw
                      const pct = total > 0 ? Math.round((val/total)*100) : 0
                      return `${ctx.label}: ${val} (${pct}%)`
                    }
                  }
                }
              }
            }}
          />
           {/* TEXTO CENTRAL */}
  <div style={{
    position:"absolute",
    top:"50%",
    left:"50%",
    transform:"translate(-50%, -50%)",
    textAlign:"center"
  }}>
    <div style={{fontSize:26,fontWeight:700}}>
      {porcentajeCritico}%
    </div>
    <div style={{fontSize:12,color:"#6b7280"}}>
      Riesgo crítico
    </div>
  </div>

</div>
          </div>
        </Card>

        <Card>
          <Title>Competencias</Title>
          <div style={{height:240}}>
            <Bar
              data={barData}
              options={{
                indexAxis:"y",
                maintainAspectRatio:false,
                plugins:{legend:{display:false}}
              }}
            />
          </div>
        </Card>

      </div>

      {/* FORTALEZAS / RIESGOS */}
      <div style={styles.grid}>

        <Card>
          <Title>Fortalezas clave</Title>

          {data.mejores?.length === 0 ? (
            <div style={{color:"#6b7280"}}>Sin datos</div>
          ) : data.mejores.map(([name,value]:any)=>(
            <Item key={name} text={`${formatName(name)} (${value}%)`} color="#16a34a"/>
          ))}

        </Card>

        <Card>
          <Title>Riesgos críticos</Title>

          {data.criticas?.length === 0 ? (
            <div style={{color:"#6b7280"}}>Sin datos</div>
          ) : data.criticas.map(([name,value]:any)=>(
            <Item key={name} text={`${formatName(name)} (${value}%)`} color="#dc2626"/>
          ))}

        </Card>

      </div>

    </div>
  )
}

/* COMPONENTES */

function MiniCard({title,value,sub,color}:any){
  return(
    <div style={{
      ...styles.card,
      borderTop:`4px solid ${color || "#ddd"}`
    }}>
      <div style={styles.kpiTitle}>{title}</div>
      <div style={{...styles.kpiValue,color:color || "#111"}}>
        {value}
      </div>
      {sub !== undefined && (
        <div style={styles.kpiSub}>{sub} personas</div>
      )}
    </div>
  )
}

function Item({text,color}:any){
  return(
    <div style={{
      padding:"6px 0",
      display:"flex",
      alignItems:"center",
      gap:8
    }}>
      <div style={{
        width:8,
        height:8,
        borderRadius:"50%",
        background:color
      }}/>
      {text}
    </div>
  )
}

function Title({children}:any){
  return <h3 style={{marginBottom:10}}>{children}</h3>
}

function Card({children}:any){
  return <div style={styles.card}>{children}</div>
}

/* ================= ESTILOS ================= */

const styles:any = {

  container:{
    padding:20,
    display:"grid",
    gap:20,
    background:"#f9fafb"
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

  filters:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr 1fr",
    gap:10
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:20
  },

  card:{
    background:"#fff",
    padding:18,
    borderRadius:16,
    boxShadow:"0 8px 25px rgba(0,0,0,0.05)"
  },

  kpiTitle:{
    fontSize:12,
    color:"#6b7280"
  },

  kpiValue:{
    fontSize:28,
    fontWeight:700
  },

  kpiSub:{
    fontSize:12,
    color:"#6b7280"
  }

}