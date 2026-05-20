import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "../api"

export default function Evaluations(){

  const navigate = useNavigate()

  const [evaluations,setEvaluations]=useState<any[]>([])
  const [loading,setLoading]=useState(true)

  const role = localStorage.getItem("role")

  if(role !== "SUPERADMIN" && role !== "PSYCHOLOGIST"){

    return (

      <div style={{padding:40}}>
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
      <div style={{padding:40}}>
        Cargando evaluaciones...
      </div>
    )

  }

  return(

    <div style={{padding:40}}>

      <h2 style={styles.title}>
        Evaluaciones
      </h2>

      <div style={{
        marginTop:10,
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

      {/* CARD */}

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

                  {/* VER */}

                  <button
                    onClick={()=>
                      viewEvaluation(ev.id)
                    }
                    style={styles.greenButton}
                  >
                    Ver
                  </button>

                  {/* EDITAR */}

                  <button
                    onClick={()=>
                      editEvaluation(ev.id)
                    }
                    style={styles.yellowButton}
                  >
                    Editar
                  </button>

                  {/* PROBAR */}

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

  title:{

    color:"#ffffff",

    fontSize:32,

    fontWeight:700,

    marginBottom:20

  },

  newButton:{

    padding:"10px 16px",

    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",

    color:"#fff",

    border:"none",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:600

  },

  card:{

    marginTop:10,

    background:
      "rgba(17,36,58,0.96)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    padding:20,

    borderRadius:18,

    boxShadow:
      "0 8px 30px rgba(0,0,0,0.35)",

    backdropFilter:
      "blur(10px)"

  },

  table:{

    width:"100%",

    borderCollapse:"collapse"

  },

  headerRow:{

    textAlign:"left",

    borderBottom:
      "1px solid rgba(255,255,255,0.08)"

  },

  row:{

    borderBottom:
      "1px solid rgba(255,255,255,0.05)"

  },

  th:{

    padding:14,

    color:"#ffffff",

    fontWeight:600

  },

  td:{

    padding:14,

    color:"#e2e8f0"

  },

  greenButton:{

    padding:"6px 12px",

    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",

    color:"#fff",

    border:"none",

    borderRadius:8,

    cursor:"pointer",

    fontWeight:600

  },

  yellowButton:{

    padding:"6px 12px",

    background:
      "linear-gradient(135deg,#f59e0b,#fbbf24)",

    color:"#fff",

    border:"none",

    borderRadius:8,

    cursor:"pointer",

    fontWeight:600

  },

  blueButton:{

    padding:"6px 12px",

    background:
      "linear-gradient(135deg,#2563eb,#1d4ed8)",

    color:"#fff",

    border:"none",

    borderRadius:8,

    cursor:"pointer",

    fontWeight:600

  }

}