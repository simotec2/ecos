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

      // 🔥 limpieza + protección
      const clean = (data || []).filter((ev:any)=>
        ev &&
        ev.name &&
        ev.name !== "eee"
      )

      setEvaluations(clean)

    }catch(err){

      console.error("Error cargando evaluaciones",err)

    }finally{

      // 🔥 asegurar salida de loading SIEMPRE
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
    return <div style={{padding:40}}>Cargando evaluaciones...</div>
  }

  return(

    <div style={{padding:40}}>

      <h2>Evaluaciones</h2>

      <div style={{marginTop:10, marginBottom:20}}>

        <button
          onClick={()=>navigate("/app/evaluations/new")}
          style={{
            padding:"10px 16px",
            background:"#16a34a",
            color:"#fff",
            border:"none",
            borderRadius:6,
            cursor:"pointer"
          }}
        >
          Nueva evaluación
        </button>

      </div>

      <div style={{
        marginTop:10,
        background:"#fff",
        padding:20,
        borderRadius:10,
        boxShadow:"0 2px 8px rgba(0,0,0,0.1)"
      }}>

        <table style={{width:"100%",borderCollapse:"collapse"}}>

          <thead>
            <tr style={{textAlign:"left",borderBottom:"1px solid #ddd"}}>
              <th style={{padding:10}}>Nombre</th>
              <th style={{padding:10}}>Tipo</th>
              <th style={{padding:10}}>Acciones</th>
            </tr>
          </thead>

          <tbody>

            {evaluations.map(ev=>(

              <tr key={ev.id} style={{borderBottom:"1px solid #eee"}}>

                <td style={{padding:10}}>
                  {formatName(ev.name)}
                </td>

                <td style={{padding:10}}>
                  {ev.type}
                </td>

                <td style={{padding:10,display:"flex",gap:10}}>

                  <button
                    onClick={()=>viewEvaluation(ev.id)}
                    style={{
                      padding:"6px 12px",
                      background:"#16a34a",
                      color:"#fff",
                      border:"none",
                      borderRadius:6,
                      cursor:"pointer"
                    }}
                  >
                    Ver
                  </button>

                  <button
                    onClick={()=>editEvaluation(ev.id)}
                    style={{
                      padding:"6px 12px",
                      background:"#f59e0b",
                      color:"#fff",
                      border:"none",
                      borderRadius:6,
                      cursor:"pointer"
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={()=>testEvaluation(ev.id)}
                    style={{
                      padding:"6px 12px",
                      background:"#2563eb",
                      color:"#fff",
                      border:"none",
                      borderRadius:6,
                      cursor:"pointer"
                    }}
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