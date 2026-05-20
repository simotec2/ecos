import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "../api"

export default function Evaluations(){

  const navigate = useNavigate()

  const [evaluations,setEvaluations]=useState<any[]>([])
  const [loading,setLoading]=useState(true)

  const role = localStorage.getItem("role")

  if(
    role !== "SUPERADMIN" &&
    role !== "PSYCHOLOGIST"
  ){

    return (

      <div style={{padding:40,color:"#fff"}}>
        No tienes acceso a este módulo
      </div>

    )

  }

  useEffect(()=>{

    load()

  },[])

  async function load(){

    try{

      const data = await apiFetch("/api/evaluations")

      const clean = (data || []).filter((ev:any)=>
        ev &&
        ev.name &&
        ev.name !== "eee"
      )

      setEvaluations(clean)

    }catch(err){

      console.error(
        "Error cargando evaluaciones",
        err
      )

    }finally{

      setLoading(false)

    }

  }

  function formatName(name:string){

    return name
      .split("_").join(" ")
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())

  }

  function testEvaluation(id:string){

    navigate(`/app/evaluations/${id}/test`)

  }

  function editEvaluation(id:string){

    navigate(`/app/evaluations/${id}/edit`)

  }

  function viewEvaluation(id:string){

    navigate(`/app/evaluations/${id}/view`)

  }

  if(loading){

    return (
      <div style={{
        padding:40,
        color:"#fff"
      }}>
        Cargando evaluaciones...
      </div>
    )

  }

  return(

    <div style={styles.page}>

      <h2 style={styles.title}>
        Evaluaciones
      </h2>

      <div style={{
        marginBottom:20
      }}>

        <button
          onClick={()=>
            navigate("/app/evaluations/new")
          }
          style={styles.newButton}
        >
          Nueva evaluación
        </button>

      </div>

      <div style={styles.card}>

        <table style={styles.table}>

          <thead>

            <tr style={styles.headerRow}>

              <th style={styles.th}>
                Nombre
              </th>

              <th style={styles.th}>
                Tipo
              </th>

              <th style={styles.th}>
                Acciones
              </th>

            </tr>

          </thead>

          <tbody>

            {evaluations.map(ev=>(

              <tr
                key={ev.id}
                style={styles.row}
              >

                <td style={styles.td}>
                  {formatName(ev.name)}
                </td>

                <td style={styles.td}>
                  {ev.type}
                </td>

                <td style={{
                  ...styles.td,
                  display:"flex",
                  gap:10
                }}>

                  <button
                    onClick={()=>
                      viewEvaluation(ev.id)
                    }
                    style={styles.greenButton}
                  >
                    Ver
                  </button>

                  <button
                    onClick={()=>
                      editEvaluation(ev.id)
                    }
                    style={styles.yellowButton}
                  >
                    Editar
                  </button>

                  <button
                    onClick={()=>
                      testEvaluation(ev.id)
                    }
                    style={styles.blueButton}
                  >
                    Probar
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}

const styles:any = {

  page:{

    minHeight:"100vh",

    padding:40,

    background:
      "linear-gradient(180deg,#0f172a 0%,#111827 100%)"

  },

  title:{

    color:"#ffffff",

    fontSize:32,

    fontWeight:700,

    marginBottom:20

  },

  newButton:{

    padding:"10px 18px",

    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",

    color:"#fff",

    border:"none",

    borderRadius:12,

    cursor:"pointer",

    fontWeight:700,

    boxShadow:
      "0 4px 15px rgba(34,197,94,0.25)"

  },

  card:{

    background:
      "rgba(15,23,42,0.88)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:20,

    padding:24,

    backdropFilter:"blur(12px)",

    boxShadow:
      "0 10px 40px rgba(0,0,0,0.45)"

  },

  table:{

    width:"100%",

    borderCollapse:"collapse"

  },

  headerRow:{

    borderBottom:
      "1px solid rgba(255,255,255,0.08)"

  },

  row:{

    borderBottom:
      "1px solid rgba(255,255,255,0.05)"

  },

  th:{

    textAlign:"left",

    padding:16,

    color:"#f8fafc",

    fontSize:14,

    fontWeight:700

  },

  td:{

    padding:16,

    color:"#cbd5e1",

    fontSize:14

  },

  greenButton:{

    padding:"8px 14px",

    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",

    color:"#fff",

    border:"none",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:700

  },

  yellowButton:{

    padding:"8px 14px",

    background:
      "linear-gradient(135deg,#f59e0b,#fbbf24)",

    color:"#fff",

    border:"none",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:700

  },

  blueButton:{

    padding:"8px 14px",

    background:
      "linear-gradient(135deg,#2563eb,#1d4ed8)",

    color:"#fff",

    border:"none",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:700

  }

}