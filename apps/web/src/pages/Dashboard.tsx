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

import { Pie, Bar } from "react-chartjs-2"

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

    }catch(err:any){

      console.error("ERROR DASHBOARD:", err.message)

      setError("Error cargando dashboard")

    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    loadData()
  },[empresa,tipo,periodo])

  if(loading) return <div style={{padding:20}}>Cargando dashboard...</div>
  if(error) return <div style={{padding:20,color:"red"}}>{error}</div>
  if(!data) return <div style={{padding:20}}>Sin datos</div>

  const total =
    data.semaforo.verde +
    data.semaforo.amarillo +
    data.semaforo.rojo || 1

  /* ================= PIE ================= */
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

  /* ================= COMPETENCIAS ================= */
  const labels = Object.keys(data.competencias || {})
    .filter(k => !k.toLowerCase().includes("sumarse"))
    .sort((a,b)=>data.competencias[b]-data.competencias[a])

  const values = labels.map(l => data.competencias[l])

  const barData = {
    labels,
    datasets:[{
      data: values,
      backgroundColor: values.map(v => getColor(v))
    }]
  }

  /* ================= TOP / BOTTOM ================= */
  const top5 = labels.slice(0,5)
  const bottom5 = labels.slice(-5).reverse()

  const topData = {
    labels: top5,
    datasets:[{
      data: top5.map(l=>data.competencias[l]),
      backgroundColor:"#16a34a"
    }]
  }

  const bottomData = {
    labels: bottom5,
    datasets:[{
      data: bottom5.map(l=>data.competencias[l]),
      backgroundColor:"#dc2626"
    }]
  }

  return(
    <div style={{
      padding:"20px",
      display:"grid",
      gap:20,
      background:"#f9fafb",
      minHeight:"100vh"
    }}>

      {/* HEADER */}
      <div>
        <h2 style={{margin:0,fontWeight:700}}>Dashboard Ejecutivo</h2>
        <p style={{margin:0,color:"#6b7280",fontSize:13}}>
          Resultados generales de evaluaciones
        </p>
      </div>

      {/* KPI */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:15
      }}>
        <MiniCard title="Total Evaluados" value={total}/>
        <MiniCard title="Recomendables" value={data.semaforo.verde} color="#16a34a"/>
        <MiniCard title="Con Observaciones" value={data.semaforo.amarillo} color="#f59e0b"/>
        <MiniCard title="No Recomendables" value={data.semaforo.rojo} color="#dc2626"/>
      </div>

      {/* FILTROS */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr 1fr",
        gap:10
      }}>

        <select value={empresa} onChange={e=>setEmpresa(e.target.value)}>
          <option value="">Todas las empresas</option>
          {data.empresas?.map((e:any)=>(
            <option key={e.id} value={e.id}>{e.name}</option>
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
      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr",
        gap:20
      }}>

        <Card>
          <Title>Estado General</Title>
          <div style={{height:220}}>
            <Pie data={pieData} options={{maintainAspectRatio:false}}/>
          </div>
        </Card>

        <Card>
          <Title>Competencias</Title>
          <div style={{height:220}}>
            <Bar data={barData} options={{indexAxis:"y", maintainAspectRatio:false, plugins:{legend:{display:false}}}}/>
          </div>
        </Card>

      </div>

      {/* ANALÍTICA */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr",
        gap:20
      }}>

        <Card>
          <Title>Top 5 Fortalezas</Title>
          <div style={{height:180}}>
            <Bar data={topData} options={{indexAxis:"y", maintainAspectRatio:false, plugins:{legend:{display:false}}}}/>
          </div>
        </Card>

        <Card>
          <Title>Top 5 Riesgos</Title>
          <div style={{height:180}}>
            <Bar data={bottomData} options={{indexAxis:"y", maintainAspectRatio:false, plugins:{legend:{display:false}}}}/>
          </div>
        </Card>

      </div>

    </div>
  )
}

/* COMPONENTES */

function Title({children}:any){
  return(
    <h3 style={{
      fontSize:15,
      fontWeight:600,
      marginBottom:10
    }}>
      {children}
    </h3>
  )
}

function Card({children}:any){
  return(
    <div style={{
      background:"#fff",
      padding:"18px",
      borderRadius:"16px",
      boxShadow:"0 8px 25px rgba(0,0,0,0.05)"
    }}>
      {children}
    </div>
  )
}

function MiniCard({title,value,color}:any){
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