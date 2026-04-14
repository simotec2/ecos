import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiFetch } from "../api"

export default function EvaluationEditor(){

  const { id } = useParams()
  const navigate = useNavigate()

  const [evaluation,setEvaluation] = useState<any>(null)
  const [questions,setQuestions] = useState<any[]>([])

  useEffect(()=>{
    load()
  },[id])

  async function load(){

    if(!id) return

    const data = await apiFetch(`/api/evaluations/${id}`)

    if(!data) return

    setEvaluation(data)

    const qs = (data.questions || []).map((q:any)=>{

      let options:any[] = []

      // 🔥 CORRECTO: usar optionsJson
      if(q.optionsJson){
        try{
          options = JSON.parse(q.optionsJson)
        }catch{
          options = []
        }
      }

      let keywords:any[] = []

      if(q.keywords){
        try{
          keywords = typeof q.keywords === "string"
            ? JSON.parse(q.keywords)
            : q.keywords
        }catch{
          keywords = []
        }
      }

      return{
        ...q,
        options,
        keywords
      }

    })

    setQuestions(qs)

  }

  function updateQuestion(index:number,field:string,value:any){

    const copy=[...questions]
    copy[index][field]=value
    setQuestions(copy)

  }

  function updateOption(qIndex:number,oIndex:number,value:string){

    const copy=[...questions]

    const options=[...(copy[qIndex].options||[])]

    options[oIndex]=value

    copy[qIndex].options=options

    setQuestions(copy)

  }

  function updateKeyword(qIndex:number,kIndex:number,value:string){

    const copy=[...questions]

    const kws=[...(copy[qIndex].keywords||[])]

    kws[kIndex]=value

    copy[qIndex].keywords=kws

    setQuestions(copy)

  }

  function addKeyword(qIndex:number){

    const copy=[...questions]

    const kws=[...(copy[qIndex].keywords||[])]

    kws.push("")

    copy[qIndex].keywords=kws

    setQuestions(copy)

  }

  function removeKeyword(qIndex:number,kIndex:number){

    const copy=[...questions]

    const kws=[...(copy[qIndex].keywords||[])]

    kws.splice(kIndex,1)

    copy[qIndex].keywords=kws

    setQuestions(copy)

  }

  async function save(){

    const payload = questions.map(q=>({
      ...q,
      optionsJson: JSON.stringify(q.options || [])
    }))

    await apiFetch(`/api/evaluations/${evaluation.id}`,{
      method:"PUT",
      body:JSON.stringify({questions:payload})
    })

    alert("Evaluación guardada")

  }

  function renderQuestion(q:any,index:number){

    /* ====================
    OPEN / PETS
    ==================== */

    if(q.type==="OPEN"){

      return(

        <div style={{marginBottom:40}}>

          <div style={{fontWeight:600,marginBottom:10}}>
            Pregunta {index+1}
          </div>

          <textarea
            style={{width:"100%",height:120,marginBottom:15}}
            value={q.text}
            onChange={(e)=>updateQuestion(index,"text",e.target.value)}
          />

        </div>

      )

    }

    /* ====================
    LIKERT (ICOM)
    ==================== */

    if(q.type==="LIKERT"){

      const options = q.options || []

      return(

        <div style={{marginBottom:30}}>

          <div style={{fontWeight:600}}>
            Pregunta {index+1}
          </div>

          <input
            style={{width:"100%",marginBottom:10}}
            value={q.text}
            onChange={(e)=>updateQuestion(index,"text",e.target.value)}
          />

          {options.map((opt:any,i:number)=>(
            <div key={i}>{opt}</div>
          ))}

        </div>

      )

    }

    /* ====================
    MCQ (SECURITY)
    ==================== */

    if(q.type==="MCQ"){

      const options = q.options || []

      return(

        <div style={{marginBottom:30}}>

          <div style={{fontWeight:600}}>
            Pregunta {index+1}
          </div>

          <input
            style={{width:"100%",marginBottom:10}}
            value={q.text}
            onChange={(e)=>updateQuestion(index,"text",e.target.value)}
          />

          {options.map((opt:any,i:number)=>(

            <div key={i} style={{marginBottom:5}}>

              <input
                style={{width:"70%"}}
                value={opt}
                onChange={(e)=>updateOption(index,i,e.target.value)}
              />

              <input
                type="radio"
                name={`correct-${index}`}
                checked={q.correctAnswer === opt}
                onChange={()=>updateQuestion(index,"correctAnswer",opt)}
              />

            </div>

          ))}

        </div>

      )

    }

    return null

  }

  if(!evaluation){
    return <div style={{padding:40}}>Cargando evaluación...</div>
  }

  return(

    <div style={{padding:40}}>

      <h2>Editor de evaluación</h2>

      <div style={{marginBottom:20}}>
        <b>{evaluation.name}</b>
      </div>

      {questions.map((q,i)=>(
        <div key={q.id}>
          {renderQuestion(q,i)}
        </div>
      ))}

      <div style={{marginTop:40}}>

        <button onClick={save}>
          Guardar cambios
        </button>

        <button onClick={()=>navigate(`/app/evaluations/${evaluation.id}/test`)}>
          Probar evaluación
        </button>

        <button onClick={()=>navigate("/app/evaluations")}>
          Volver
        </button>

      </div>

    </div>

  )

}