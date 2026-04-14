import { useEffect,useState } from "react"
import { apiFetch } from "../api"

export default function MyEvaluations(){

  const [assignments,setAssignments] = useState<any[]>([])

  useEffect(()=>{
    load()
  },[])

  async function load(){

    const participantId = localStorage.getItem("participantId")

    const data = await apiFetch(`/api/assignments/participant/${participantId}`)

    setAssignments(data || [])

  }

  async function start(evaluationId:string){

    const participantId = localStorage.getItem("participantId")

    const session = await apiFetch("/api/session",{
      method:"POST",
      body: JSON.stringify({
        participantId,
        evaluationId
      })
    })

    if(!session || !session.id){
      alert("No se pudo crear la sesión")
      return
    }

    window.location.href = `/session/${session.id}`

  }

  return(

    <div style={{padding:40}}>

      <h2>Mis Evaluaciones</h2>

      {assignments.map(a=>(
        <div key={a.id} style={{marginBottom:20}}>

          <b>{a.evaluation.name}</b>

          <br/>

          <button onClick={()=>start(a.evaluation.id)}>
            Rendir
          </button>

        </div>
      ))}

    </div>

  )

}