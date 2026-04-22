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

/* ================= UTIL ================= */

function getColor(value:number){
  if(value >= 70) return "#16a34a"
  if(value >= 50) return "#f59e0b"
  return "#dc2626"
}

function formatName(name:string){
  if(!name) return ""

  const n = name.toLowerCase()

  if(n.includes("icom")) return "Evaluación Psicolaboral"
  if(n.includes("pets")) return "Evaluación Conductual"
  if(n.includes("seguridad")) return "Evaluación Seguridad"

  return name
}

/* ================= COMPONENT ================= */

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

  const pct = (v:number)=> total > 0 ? Math.round((v/total)*100) : 0

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

  return (
    <div style={styles.container}>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <MiniCard title="Evaluados" value={total}/>
        <MiniCard title="Recomendables" value={`${pct(data.semaforo.verde)}%`} color="#16a34a"/>
        <MiniCard title="Observaciones" value={`${pct(data.semaforo.amarillo)}%`} color="#f59e0b"/>
        <MiniCard title="Críticos" value={`${pct(data.semaforo.rojo)}%`} color="#dc2626"/>
      </div>

      {/* MAIN */}
      <div style={styles.grid}>

        {/* DONUT */}
        <Card>
          <h3 style={styles.title}>Nivel de Riesgo</h3>

          <div style={{position:"relative", height:240}}>

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
                        const pct = total ? Math.round((val/total)*100) : 0
                        return `${ctx.label}: ${val} (${pct}%)`
                      }
                    }
                  }
                }
              }}
            />

            {/* TEXTO CENTRADO */}
            <div style={{
              position:"absolute",
              inset:0,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              pointerEvents:"none"
            }}>
              <div style={{textAlign:"center"}}>
                <div style={styles.bigNumber}>
                  {pct(data.semaforo.rojo)}%
                </div>
                <div style={styles.subText}>
                  Riesgo crítico
                </div>
              </div>
            </div>

          </div>
        </Card>

        {/* COMPETENCIAS */}
        <Card>
          <h3 style={styles.title}>Competencias</h3>

          {values.length === 0 ? (
            <div style={styles.empty}>
              Sin datos suficientes
            </div>
          ) : (
            <div style={{height:240}}>
              <Bar
                data={barData}
                options={{
                  indexAxis:"y",
                  maintainAspectRatio:false,
                  plugins:{ legend:{display:false} }
                }}
              />
            </div>
          )}

        </Card>

      </div>

      {/* LISTAS */}
      <div style={styles.grid}>

        <Card>
          <h3 style={styles.title}>Fortalezas</h3>

          {data.mejores?.length === 0 ? (
            <div style={styles.empty}>Sin datos</div>
          ) : data.mejores.map(([name,value]:any)=>(
            <Item key={name} text={`${formatName(name)} (${value}%)`} color="#16a34a"/>
          ))}

        </Card>

        <Card>
          <h3 style={styles.title}>Riesgos</h3>

          {data.criticas?.length === 0 ? (
            <div style={styles.empty}>Sin datos</div>
          ) : data.criticas.map(([name,value]:any)=>(
            <Item key={name} text={`${formatName(name)} (${value}%)`} color="#dc2626"/>
          ))}

        </Card>

      </div>

    </div>
  )
}

/* ================= UI ================= */

function Card({children}:any){
  return (
    <div style={styles.card}>
      {children}
    </div>
  )
}

function MiniCard({title,value,color}:any){
  return (
    <div style={{
      ...styles.card,
      borderTop:`4px solid ${color || "#ddd"}`
    }}>
      <div style={styles.kpiTitle}>{title}</div>
      <div style={{...styles.kpiValue, color:color || "#111"}}>
        {value}
      </div>
    </div>
  )
}

function Item({text,color}:any){
  return (
    <div style={styles.item}>
      <div style={{...styles.dot, background:color}} />
      {text}
    </div>
  )
}

/* ================= ESTILOS ================= */

const styles:any = {

  container:{
    padding:20,
    display:"grid",
    gap:20,
    background:"#f9fafb"
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
    borderRadius:14,
    boxShadow:"0 8px 20px rgba(0,0,0,0.05)"
  },

  title:{
    marginBottom:10,
    fontWeight:600
  },

  kpiTitle:{
    fontSize:12,
    color:"#6b7280"
  },

  kpiValue:{
    fontSize:26,
    fontWeight:700
  },

  bigNumber:{
    fontSize:32,
    fontWeight:800,
    color:"#111827"
  },

  subText:{
    fontSize:12,
    color:"#9ca3af"
  },

  empty:{
    height:240,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    color:"#9ca3af"
  },

  item:{
    display:"flex",
    gap:8,
    marginBottom:6,
    alignItems:"center"
  },

  dot:{
    width:8,
    height:8,
    borderRadius:"50%"
  }

}