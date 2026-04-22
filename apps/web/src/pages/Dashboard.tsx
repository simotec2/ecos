import { useEffect, useState } from "react"
import { apiFetch } from "../api"

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js"

import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Dashboard(){

  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")

  useEffect(()=>{
    load()
  },[])

  async function load(){
    try{
      setLoading(true)
      const res = await apiFetch("/api/dashboard")
      setData(res.data)
    }catch(e:any){
      console.error(e)
      setError("Error cargando dashboard")
    }finally{
      setLoading(false)
    }
  }

  if(loading) return <div style={{padding:20}}>Cargando...</div>
  if(error) return <div style={{padding:20,color:"red"}}>{error}</div>
  if(!data) return <div style={{padding:20}}>Sin datos</div>

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
      backgroundColor:["#16a34a","#f59e0b","#dc2626"],
      borderWidth:0
    }]
  }

  return(
    <div style={styles.container}>

      <h2>Dashboard Ejecutivo</h2>

      <div style={styles.card}>

        <h3>Nivel de Riesgo</h3>

        <div style={styles.donutContainer}>

          <Doughnut
            data={pieData}
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

      </div>

      <div style={styles.card}>
        <h3>Datos</h3>

        <pre style={{fontSize:12}}>
          {JSON.stringify(data, null, 2)}
        </pre>

      </div>

    </div>
  )
}

/* ================= ESTILOS ================= */

const styles:any = {

  container:{
    padding:20,
    display:"grid",
    gap:20
  },

  card:{
    background:"#fff",
    padding:20,
    borderRadius:12
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
    justifyContent:"center",
    pointerEvents:"none"
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
  }

}