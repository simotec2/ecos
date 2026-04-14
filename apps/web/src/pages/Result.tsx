import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { apiFetch } from "../api"

export default function Result(){

  const { sessionId } = useParams()

  const [data,setData] = useState<any>(null)

  useEffect(()=>{
    load()
  },[])

  async function load(){

    const res = await apiFetch(`/api/result/${sessionId}`)

    setData(res)

  }

  if(!data){
    return <div style={{padding:40}}>Cargando resultado...</div>
  }

  return(

    <div style={{maxWidth:800,margin:"auto",padding:40}}>

      <h2>Resultado de Evaluación</h2>

      <p><b>Puntaje:</b> {data.score ?? "Sin calcular"}</p>

      <p><b>Detalle:</b></p>

      <pre>
        {data.resultJson}
      </pre>

    </div>

  )

}