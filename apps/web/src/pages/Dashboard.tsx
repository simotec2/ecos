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
  if(value >= 70) return "#22c55e"
  if(value >= 50) return "#facc15"
  return "#ef4444"
}

export default function Dashboard(){

  const [data,setData] = useState<any>(null)
  const [role,setRole] = useState("")
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
      setRole(res.role)

    }catch(err:any){

      console.error("ERROR DASHBOARD:", err.message)

      if(err.message.includes("No autorizado")){
        setError("Sesión expirada. Vuelve a iniciar sesión.")
      }else{
        setError("Error cargando dashboard")
      }

    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    loadData()
  },[empresa,tipo,periodo])

  if(loading) return <div style={{padding:20}}>Cargando dashboard...</div>

  if(error){
    return(
      <div style={{padding:20,color:"red"}}>
        {error}
      </div>
    )
  }

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
      backgroundColor:["#22c55e","#facc15","#ef4444"]
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

  /* ================= DISTRIBUCIÓN ================= */
  const distribution = [0,0,0,0,0]

  values.forEach((v:any)=>{
    if(v < 20) distribution[0]++
    else if(v < 40) distribution[1]++
    else if(v < 60) distribution[2]++
    else if(v < 80) distribution[3]++
    else distribution[4]++
  })

  const distData = {
    labels:["0-20","20-40","40-60","60-80","80-100"],
    datasets:[{
      data:distribution,
      backgroundColor:"#3b82f6"
    }]
  }

  /* ================= TOP / BOTTOM ================= */
  const top5 = labels.slice(0,5)
  const bottom5 = labels.slice(-5).reverse()

  const topData = {
    labels: top5,
    datasets:[{
      data: top5.map(l=>data.competencias[l]),
      backgroundColor:"#22c55e"
    }]
  }

  const bottomData = {
    labels: bottom5,
    datasets:[{
      data: bottom5.map(l=>data.competencias[l]),
      backgroundColor:"#ef4444"
    }]
  }

  return(
    <div style={{
      padding:"0px 15px 10px 15px",
      display:"grid",
      gap:20
    }}>

      {/* KPI */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:10
      }}>
        <MiniCard title="Total Evaluados" value={total}/>
        <MiniCard title="Recomendables" value={data.semaforo.verde} color="#22c55e"/>
        <MiniCard title="Con Observaciones" value={data.semaforo.amarillo} color="#facc15"/>
        <MiniCard title="No Recomendables" value={data.semaforo.rojo} color="#ef4444"/>
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
          <option value="">Todas las evaluaciones</option>
          <option value="PETS">PETS</option>
          <option value="ICOM">ICOM</option>
          <option value="SECURITY">SEGURIDAD</option>
        </select>

        <select value={periodo} onChange={e=>setPeriodo(e.target.value)}>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>

      </div>

      {/* PRINCIPAL */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr",
        gap:20,
        alignItems:"start"
      }}>

        <Card>
          <h4>Estado General de Resultados</h4>

          {/* 🔥 PIE MÁS PEQUEÑO */}
          <div style={{
            height:200,
            display:"flex",
            justifyContent:"center",
            alignItems:"center"
          }}>
            <div style={{width:180, height:180}}>
              <Pie 
                data={pieData}
                options={{
                  maintainAspectRatio:false,
                  plugins:{
                    legend:{
                      position:"bottom"
                    }
                  }
                }}
              />
            </div>
          </div>

        </Card>

        <Card>
          <h4>Competencias</h4>
          <div style={{minHeight:200}}>
            <Bar data={barData} options={{indexAxis:"y", maintainAspectRatio:false, plugins:{legend:{display:false}}}}/>
          </div>
        </Card>

      </div>

      {/* ANALÍTICA */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr 1fr",
        gap:15,
        alignItems:"start"
      }}>

        <Card>
          <h4>Distribución de Competencias</h4>
          <div style={{minHeight:140}}>
            <Bar data={distData} options={{plugins:{legend:{display:false}}, maintainAspectRatio:false}}/>
          </div>
        </Card>

        <Card>
          <h4>5 Competencias más Fuertes</h4>
          <div style={{minHeight:140}}>
            <Bar data={topData} options={{indexAxis:"y", plugins:{legend:{display:false}}, maintainAspectRatio:false}}/>
          </div>
        </Card>

        <Card>
          <h4>5 Competencias más Críticas</h4>
          <div style={{minHeight:140}}>
            <Bar data={bottomData} options={{indexAxis:"y", plugins:{legend:{display:false}}, maintainAspectRatio:false}}/>
          </div>
        </Card>

      </div>

    </div>
  )
}

/* COMPONENTES */

function Card({children}:any){
  return(
    <div style={{
      background:"#fff",
      padding:10,
      borderRadius:10,
      boxShadow:"0 1px 5px rgba(0,0,0,0.1)"
    }}>
      {children}
    </div>
  )
}

function MiniCard({title,value,color}:any){
  return(
    <div style={{
      background:"#fff",
      padding:12,
      borderRadius:10,
      boxShadow:"0 1px 5px rgba(0,0,0,0.1)"
    }}>
      <div style={{fontSize:12,color:"#666"}}>{title}</div>
      <div style={{
        fontSize:20,
        fontWeight:"bold",
        color:color || "#111"
      }}>
        {value}
      </div>
    </div>
  )
}