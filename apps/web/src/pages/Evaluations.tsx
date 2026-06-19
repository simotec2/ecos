import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "../api"

function getStoredPermissions(){

  try{

    const raw =
      localStorage.getItem("permissions")

    if(!raw){
      return []
    }

    const parsed =
      JSON.parse(raw)

    return Array.isArray(parsed)
      ? parsed
      : []

  }catch{

    return []

  }

}

function hasPermission(permission:string){

  const role =
    localStorage.getItem("role") || ""

  if(role === "SUPERADMIN"){
    return true
  }

  return getStoredPermissions()
    .includes(permission)

}

export default function Evaluations(){

  const navigate = useNavigate()

  const [evaluations,setEvaluations] =
    useState<any[]>([])

  const [loading,setLoading] =
    useState(true)

  const [deletingId,setDeletingId] =
    useState<string | null>(null)

  const canView =
    hasPermission("EVALUATIONS_VIEW")

  const canCreate =
    hasPermission("EVALUATIONS_CREATE")

  const canEdit =
    hasPermission("EVALUATIONS_EDIT")

  const canDelete =
    hasPermission("EVALUATIONS_DELETE")

  const canTest =
    hasPermission("EVALUATIONS_TEST")

  useEffect(()=>{

    if(canView){
      load()
    }else{
      setLoading(false)
    }

  },[])

  async function load(){

    try{

      const data =
        await apiFetch("/api/evaluations")

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

    if(!canTest){
      alert("No tienes permisos para probar evaluaciones")
      return
    }

    navigate(`/app/evaluations/${id}/test`)

  }

  function editEvaluation(id:string){

    if(!canEdit){
      alert("No tienes permisos para editar evaluaciones")
      return
    }

    navigate(`/app/evaluations/${id}/edit`)

  }

  function viewEvaluation(id:string){

    if(
      !canView &&
      !canEdit &&
      !canTest
    ){
      alert("No tienes permisos para ver evaluaciones")
      return
    }

    navigate(`/app/evaluations/${id}/view`)

  }

  async function deleteEvaluation(ev:any){

    if(!canDelete){
      alert("No tienes permisos para eliminar evaluaciones")
      return
    }

    const name =
      ev?.name
        ? formatName(ev.name)
        : "esta evaluación"

    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar la evaluación "${name}"?\n\nEsta acción no se puede deshacer.`
    )

    if(!confirmDelete){
      return
    }

    try{

      setDeletingId(ev.id)

      await apiFetch(`/api/evaluations/${ev.id}`,{
        method:"DELETE"
      })

      alert("Evaluación eliminada correctamente")

      await load()

    }catch(err:any){

      console.error(
        "Error eliminando evaluación",
        err
      )

      alert(
        err?.message ||
        err?.error ||
        "No se pudo eliminar la evaluación. Puede que ya tenga asignaciones, sesiones o resultados asociados."
      )

    }finally{

      setDeletingId(null)

    }

  }

  if(!canView){

    return (

      <div style={{
        padding:40,
        color:"#fff"
      }}>
        No tienes acceso a este módulo
      </div>

    )

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

      {canCreate && (

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

      )}

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
                  gap:10,
                  flexWrap:"wrap"
                }}>

                  {(canView || canEdit || canTest) && (

                    <button
                      onClick={()=>
                        viewEvaluation(ev.id)
                      }
                      style={styles.greenButton}
                    >
                      Ver
                    </button>

                  )}

                  {canEdit && (

                    <button
                      onClick={()=>
                        editEvaluation(ev.id)
                      }
                      style={styles.yellowButton}
                    >
                      Editar
                    </button>

                  )}

                  {canTest && (

                    <button
                      onClick={()=>
                        testEvaluation(ev.id)
                      }
                      style={styles.blueButton}
                    >
                      Probar
                    </button>

                  )}

                  {canDelete && (

                    <button
                      onClick={()=>
                        deleteEvaluation(ev)
                      }
                      disabled={deletingId === ev.id}
                      style={{
                        ...styles.redButton,
                        opacity:
                          deletingId === ev.id
                            ? 0.6
                            : 1
                      }}
                    >
                      {deletingId === ev.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>

                  )}

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
      "0 10px 40px rgba(0,0,0,0.45)",

    overflowX:"auto"

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

  },

  redButton:{

    padding:"8px 14px",

    background:
      "linear-gradient(135deg,#dc2626,#ef4444)",

    color:"#fff",

    border:"none",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:700

  }

}