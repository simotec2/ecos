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

export default function Dashboard(){

  const [dashboard,setDashboard] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    loadData()
  },[])

  async function loadData(){

    try{

      const res = await apiFetch("/api/dashboard")

      console.log("DASHBOARD DATA", res)

      setDashboard(res?.data || null)

    }catch(err){

      console.error(err)

    }finally{

      setLoading(false)

    }

  }

  if(loading){

    return(

      <div style={{padding:40,color:"#fff"}}>
        Cargando dashboard...
      </div>

    )

  }

  if(!dashboard){

    return(

      <div style={{padding:40,color:"#fff"}}>
        No se pudo cargar el dashboard
      </div>

    )

  }

  const kpi = dashboard.kpis || {
    total:0,
    rendidos:0,
    pendientes:0,
    verde:0,
    amarillo:0,
    rojo:0
  }

  const comp = dashboard.competencias || {
    top:[],
    bottom:[]
  }

  const title =
    dashboard.scope === "COMPANY" && dashboard.company?.name
      ? `Dashboard ${dashboard.company.name}`
      : "Dashboard ECOS"

  const pieData = {

    labels:[
      "Verde",
      "Amarillo",
      "Rojo"
    ],

    datasets:[{

      data:[
        kpi.verde,
        kpi.amarillo,
        kpi.rojo
      ],

      backgroundColor:[
        "#16a34a",
        "#eab308",
        "#dc2626"
      ],

      borderWidth:0

    }]

  }

  const topBar = {

    labels:
      comp.top.map((c:any)=>c.name),

    datasets:[{

      data:
        comp.top.map((c:any)=>c.score),

      backgroundColor:"#2563eb",

      borderRadius:8

    }]

  }

  const bottomBar = {

    labels:
      comp.bottom.map((c:any)=>c.name),

    datasets:[{

      data:
        comp.bottom.map((c:any)=>c.score),

      backgroundColor:"#dc2626",

      borderRadius:8

    }]

  }

  return (

    <div style={{padding:20}}>

      <h1 style={styles.title}>
        {title}
      </h1>

      {dashboard.scope === "COMPANY" && (

        <div style={styles.scopeBox}>
          Vista restringida a los evaluados y resultados de esta empresa.
        </div>

      )}

      <div style={styles.kpiGrid}>

        <KPI
          title="Total evaluados"
          value={kpi.total}
        />

        <KPI
          title="Rendidos"
          value={kpi.rendidos}
        />

        <KPI
          title="Pendientes"
          value={kpi.pendientes}
        />

        <KPI
          title="Verde"
          value={kpi.verde}
          color="#16a34a"
        />

        <KPI
          title="Amarillo"
          value={kpi.amarillo}
          color="#eab308"
        />

        <KPI
          title="Rojo"
          value={kpi.rojo}
          color="#dc2626"
        />

      </div>

      <div style={styles.grid}>

        <div style={styles.card}>

          <h3 style={styles.cardTitle}>
            Resultados Generales
          </h3>

          <div style={styles.chartBox}>

            <Pie
              data={pieData}
              options={pieOptions}
            />

          </div>

        </div>

        <div style={styles.card}>

          <h3 style={styles.cardTitle}>
            Top Competencias
          </h3>

          <div style={styles.chartBox}>

            <Bar
              data={topBar}
              options={chartOptions}
            />

          </div>

        </div>

        <div style={styles.card}>

          <h3 style={styles.cardTitle}>
            Brechas Críticas
          </h3>

          <div style={styles.chartBox}>

            <Bar
              data={bottomBar}
              options={chartOptions}
            />

          </div>

        </div>

      </div>

    </div>

  )

}

function KPI({
  title,
  value,
  color="#2563eb"
}:any){

  return(

    <div
      style={{
        ...styles.kpi,
        borderTop:`4px solid ${color}`
      }}
    >

      <div style={styles.kpiTitle}>
        {title}
      </div>

      <div style={styles.kpiValue}>
        {value}
      </div>

    </div>

  )

}

const chartOptions:any = {

  responsive:true,

  maintainAspectRatio:false,

  plugins:{

    legend:{
      display:false
    }

  },

  scales:{

    x:{

      ticks:{
        color:"#cbd5e1"
      },

      grid:{
        color:"rgba(255,255,255,0.05)"
      }

    },

    y:{

      beginAtZero:true,

      ticks:{
        color:"#cbd5e1"
      },

      grid:{
        color:"rgba(255,255,255,0.05)"
      }

    }

  }

}

const pieOptions:any = {

  responsive:true,

  maintainAspectRatio:false,

  plugins:{

    legend:{

      labels:{
        color:"#ffffff"
      }

    }

  }

}

const styles:any = {

  title:{

    color:"#ffffff",

    fontSize:32,

    fontWeight:700,

    marginBottom:12

  },

  scopeBox:{

    color:"#bfdbfe",

    background:"rgba(37,99,235,0.12)",

    border:"1px solid rgba(96,165,250,0.25)",

    padding:"12px 16px",

    borderRadius:12,

    marginBottom:24,

    fontSize:14

  },

  kpiGrid:{

    display:"grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px,1fr))",

    gap:16

  },

  kpi:{

    background:
      "rgba(17,36,58,0.92)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:18,

    padding:20,

    textAlign:"center",

    boxShadow:
      "0 8px 30px rgba(0,0,0,0.35)",

    backdropFilter:
      "blur(10px)"

  },

  kpiTitle:{

    color:"#94a3b8",

    fontSize:14,

    marginBottom:8

  },

  kpiValue:{

    fontSize:34,

    fontWeight:"bold",

    color:"#ffffff"

  },

  grid:{

    display:"grid",

    gridTemplateColumns:
      "repeat(3, 1fr)",

    gap:20,

    marginTop:24

  },

  card:{

    background:
      "rgba(17,36,58,0.92)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:20,

    padding:20,

    height:360,

    boxShadow:
      "0 8px 30px rgba(0,0,0,0.35)",

    backdropFilter:
      "blur(10px)"

  },

  cardTitle:{

    color:"#ffffff",

    marginBottom:18,

    fontSize:18,

    fontWeight:600

  },

  chartBox:{

    height:260

  }

}