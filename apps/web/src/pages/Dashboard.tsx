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
  if(value >= 50) return "#dc2626"
  if(value >= 25) return "#f59e0b"
  return "#16a34a"
}

export default function Dashboard(){

  const [data,setData] = useState<any>({
    participantes: 0,
    semaforo: { verde:0, amarillo:0, rojo:0 },
    companies: [],
    brechas: {}
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
        brechas: res.data.competencias || {}
      })

    }catch(err){
      console.error(err)
    }finally{
      setLoading(false)
    }
  }

  if(loading){
    return <div style={{padding:20}}>Cargando dashboard...</div>
  }

  const companies = data.companies || []

  /* ================= DONUT ================= */
  const donutData = {
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

  /* ================= RANKING EMPRESAS ================= */
  const sortedCompanies = [...companies]
    .sort((a:any,b:any)=> b.riesgo - a.riesgo)
    .slice(0,5)

  const rankingData = {
    labels: sortedCompanies.map((c:any)=>c.name),
    datasets:[{
      data: sortedCompanies.map((c:any)=>c.riesgo),
      backgroundColor: sortedCompanies.map((c:any)=>getColor(c.riesgo))
    }]
  }

  /* ================= BRECHAS ================= */
  const brechasEntries = Object.entries(data.brechas || {})
    .sort((a:any,b:any)=> a[1] - b[1])
    .slice(0,4)

  const brechasData = {
    labels: brechasEntries.map((b:any)=>b[0]),
    datasets:[{
      data: brechasEntries.map((b:any)=>b[1]),
      backgroundColor:"#dc2626"
    }]
  }

  /* ================= ALERTA ================= */
  const worst = sortedCompanies[0]

  return(
    <div style={styles.container}>

      {/* HEADER */}
      <div>
        <h2 style={styles.title}>Dashboard Ejecutivo</h2>
        <p style={styles.subtitle}>
          Gestión de riesgo operacional
        </p>
      </div>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <KPI title="Evaluados" value={data.participantes}/>
        <KPI title="Verde" value={data.semaforo.verde} color="#16a34a"/>
        <KPI title="Amarillo" value={data.semaforo.amarillo} color="#f59e0b"/>
        <KPI title="Rojo" value={data.semaforo.rojo} color="#dc2626"/>
      </div>

      {/* ALERTA */}
      {worst && worst.riesgo >= 25 && (
        <div style={{
          background: worst.riesgo >= 50 ? "#fee2e2" : "#fef3c7",
          borderLeft: `6px solid ${getColor(worst.riesgo)}`,
          padding: "16px",
          borderRadius: "12px"
        }}>
          ⚠ {worst.name} presenta un riesgo de {worst.riesgo}%
        </div>
      )}

      {/* GRÁFICOS PRINCIPALES */}
      <div style={styles.grid2}>

        {/* DONUT */}
        <Card title="Estado general">
          <div style={{height:250}}>
            <Doughnut data={donutData} options={{maintainAspectRatio:false}}/>
          </div>
        </Card>

        {/* RANKING */}
        <Card title="Empresas con mayor riesgo">
          <div style={{height:250}}>
            <Bar data={rankingData} options={{
              maintainAspectRatio:false,
              plugins:{legend:{display:false}}
            }}/>
          </div>
        </Card>

      </div>

      {/* BRECHAS */}
      <Card title="Brechas críticas del sistema">
        <div style={{height:250}}>
          <Bar data={brechasData} options={{
            indexAxis:"y",
            maintainAspectRatio:false,
            plugins:{legend:{display:false}}
          }}/>
        </div>
      </Card>

      {/* TARJETAS EMPRESA */}
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

            </div>
          )
        })}

      </div>

    </div>
  )
}

/* ================= COMPONENTES ================= */

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

function Card({title,children}:any){
  return(
    <div style={{
      background:"#fff",
      padding:"20px",
      borderRadius:"16px",
      boxShadow:"0 8px 25px rgba(0,0,0,0.05)"
    }}>
      <h3 style={{marginBottom:10,fontSize:15,fontWeight:600}}>
        {title}
      </h3>
      {children}
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

  grid2:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:20
  },

  card:{
    background:"#fff",
    padding:"20px",
    borderRadius:"16px",
    boxShadow:"0 8px 25px rgba(0,0,0,0.05)"
  },

  companyName:{
    fontWeight:600,
    fontSize:16
  },

  companySub:{
    fontSize:12,
    color:"#6b7280"
  }

}