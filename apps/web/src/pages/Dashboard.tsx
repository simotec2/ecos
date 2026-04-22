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

  const pct = (v:number)=> Math.round((v/total)*100)

  const pieData = {
    labels:["Verde","Amarillo","Rojo"],
    datasets:[{
      data:[
        data.semaforo.verde,
        data.semaforo.amarillo,
        data.semaforo.rojo
      ],
      backgroundColor:["#16a34a","#f59e0b","#dc2626"]
    }]
  }

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
    <div style={{padding:20, display:"grid", gap:20}}>

      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:15}}>
        <MiniCard title="Evaluados" value={total}/>
        <MiniCard title="Recomendables" value={`${pct(data.semaforo.verde)}%`} color="#16a34a"/>
        <MiniCard title="Observaciones" value={`${pct(data.semaforo.amarillo)}%`} color="#f59e0b"/>
        <MiniCard title="Críticos" value={`${pct(data.semaforo.rojo)}%`} color="#dc2626"/>
      </div>

      {/* GRÁFICOS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

        <Card>
          <h3>Nivel de Riesgo</h3>

          <div style={{position:"relative", height:240}}>

            <Doughnut 
              data={pieData}
              options={{
                cutout:"70%",
                plugins:{
                  legend:{position:"bottom"},
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

            <div style={{
              position:"absolute",
              top:"50%",
              left:"50%",
              transform:"translate(-50%,-50%)",
              textAlign:"center"
            }}>
              <div style={{fontSize:28,fontWeight:700}}>
                {pct(data.semaforo.rojo)}%
              </div>
              <div style={{fontSize:12,color:"#6b7280"}}>
                Riesgo crítico
              </div>
            </div>

          </div>
        </Card>

        <Card>
          <h3>Competencias</h3>

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

      {/* LISTAS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

        <Card>
          <h3>Fortalezas</h3>

          {(data.mejores || []).map(([name,value]:any)=>(
            <Item key={name} text={`${formatName(name)} (${value}%)`} color="#16a34a"/>
          ))}
        </Card>

        <Card>
          <h3>Riesgos</h3>

          {(data.criticas || []).map(([name,value]:any)=>(
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
    <div style={{
      background:"#fff",
      padding:20,
      borderRadius:12,
      boxShadow:"0 8px 20px rgba(0,0,0,0.05)"
    }}>
      {children}
    </div>
  )
}

function MiniCard({title,value,color}:any){
  return (
    <div style={{
      background:"#fff",
      padding:15,
      borderRadius:12,
      borderTop:`4px solid ${color || "#ddd"}`
    }}>
      <div style={{fontSize:12,color:"#6b7280"}}>{title}</div>
      <div style={{fontSize:26,fontWeight:700,color:color || "#111"}}>{value}</div>
    </div>
  )
}

function Item({text,color}:any){
  return (
    <div style={{display:"flex",gap:8,marginBottom:6}}>
      <div style={{
        width:8,
        height:8,
        borderRadius:"50%",
        background:color,
        marginTop:6
      }}/>
      {text}
    </div>
  )
}