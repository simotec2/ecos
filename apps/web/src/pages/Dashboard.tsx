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

/* ================= UTILS ================= */

function getColor(value:number){
  if(value >= 70) return "#16a34a"
  if(value >= 50) return "#f59e0b"
  return "#dc2626"
}

function estadoColor(estado:string){
  if(estado === "ROJO") return "#dc2626"
  if(estado === "AMARILLO") return "#f59e0b"
  return "#16a34a"
}

/* ================= COMPONENT ================= */

export default function Dashboard(){

  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    load()
  },[])

  async function load(){
    try{
      const res = await apiFetch("/api/dashboard")
      setData(res.data)
    }catch(e){
      console.error(e)
    }finally{
      setLoading(false)
    }
  }

  if(loading) return <div style={{padding:20}}>Cargando dashboard...</div>
  if(!data) return <div style={{padding:20}}>Sin datos</div>

  const total =
    data.semaforo.verde +
    data.semaforo.amarillo +
    data.semaforo.rojo || 1

  const pct = (v:number)=> Math.round((v/total)*100)

  /* ================= DONUT ================= */

  const donutData = {
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

  const labels = Object.keys(data.competencias || {})
  const values = Object.values(data.competencias || {})

  const barData = {
    labels,
    datasets:[{
      data: values,
      backgroundColor: values.map((v:any)=>getColor(v))
    }]
  }

  return(
    <div style={styles.container}>

      {/* HEADER */}
      <div>
        <h2 style={{margin:0}}>Dashboard Ejecutivo</h2>
        <p style={{margin:0,color:"#6b7280"}}>
          Resultados generales de evaluación
        </p>
      </div>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <MiniCard title="Evaluados" value={total}/>
        <MiniCard title="Recomendables" value={`${pct(data.semaforo.verde)}%`} color="#16a34a"/>
        <MiniCard title="Observaciones" value={`${pct(data.semaforo.amarillo)}%`} color="#f59e0b"/>
        <MiniCard title="Críticos" value={`${pct(data.semaforo.rojo)}%`} color="#dc2626"/>
      </div>

      {/* GRID PRINCIPAL */}
      <div style={styles.grid}>

        {/* DONUT */}
        <Card>
          <h3 style={styles.title}>Nivel de Riesgo</h3>

          <div style={styles.donutContainer}>

            <Doughnut
              data={donutData}
              options={{
                cutout:"75%",
                plugins:{
                  legend:{ position:"bottom" }
                }
              }}
            />

            <div style={styles.centerOverlay}>
              <div style={styles.centerContent}>
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
            <div style={styles.empty}>Sin datos</div>
          ) : (
            <div style={{height:250}}>
              <Bar
                data={barData}
                options={{
                  indexAxis:"y",
                  maintainAspectRatio:false,
                  plugins:{legend:{display:false}}
                }}
              />
            </div>
          )}

        </Card>

      </div>

      {/* FORTALEZAS / RIESGOS */}
      <div style={styles.grid}>

        <Card>
          <h3 style={styles.title}>Fortalezas clave</h3>

          {data.mejores.map((m:any)=>(
            <Row key={m[0]} label={m[0]} value={m[1]} color="#16a34a"/>
          ))}

        </Card>

        <Card>
          <h3 style={styles.title}>Riesgos críticos</h3>

          {data.criticas.map((c:any)=>(
            <Row key={c[0]} label={c[0]} value={c[1]} color="#dc2626"/>
          ))}

        </Card>

      </div>

      {/* 🔥 RANKING + RECOMENDACIONES */}
      <Card>
        <h3 style={styles.title}>Trabajadores críticos</h3>

        {data.ranking.slice(0,10).map((p:any, i:number)=>(
          <div key={i} style={styles.cardPersona}>

            <div style={styles.rowTop}>
              <span style={{fontWeight:500}}>{p.nombre}</span>
              <strong style={{color: estadoColor(p.estado)}}>
                {p.score}%
              </strong>
            </div>

            <div style={styles.badge}>
              {p.estado}
            </div>

            <div style={styles.recomendacion}>
              {p.recomendacion}
            </div>

          </div>
        ))}

      </Card>

    </div>
  )
}

/* ================= COMPONENTES UI ================= */

function Card({children}:any){
  return <div style={styles.card}>{children}</div>
}

function MiniCard({title,value,color}:any){
  return(
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

function Row({label,value,color}:any){
  return(
    <div style={styles.row}>
      <span>{label}</span>
      <strong style={{color}}>
        {value}%
      </strong>
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

  donutContainer:{
    position:"relative",
    width:"100%",
    height:240
  },

  centerOverlay:{
    position:"absolute",
    inset:0,
    display:"flex",
    alignItems:"center",
    justifyContent:"center"
  },

  centerContent:{
    textAlign:"center"
  },

  bigNumber:{
    fontSize:32,
    fontWeight:800
  },

  subText:{
    fontSize:12,
    color:"#9ca3af"
  },

  empty:{
    height:250,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    color:"#9ca3af"
  },

  row:{
    display:"flex",
    justifyContent:"space-between",
    padding:"8px 0",
    borderBottom:"1px solid #eee"
  },

  cardPersona:{
    padding:"12px 0",
    borderBottom:"1px solid #f1f5f9"
  },

  rowTop:{
    display:"flex",
    justifyContent:"space-between",
    marginBottom:4
  },

  badge:{
    display:"inline-block",
    fontSize:11,
    padding:"3px 6px",
    borderRadius:6,
    background:"#111",
    color:"#fff",
    marginBottom:6
  },

  recomendacion:{
    fontSize:13,
    color:"#6b7280"
  }

}