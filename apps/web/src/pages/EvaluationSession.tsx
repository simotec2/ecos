import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiFetch } from "../api"

export default function EvaluationSession(){

  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)

  const [questions,setQuestions] = useState<any[]>([])
  const [answers,setAnswers] = useState<any>({})
  const [index,setIndex] = useState(0)

  const token = localStorage.getItem("participantToken")

  /* ======================================
  LOAD
  ====================================== */
  useEffect(()=>{
    if(sessionId){
      load()
    }
  },[sessionId])

  async function load(){
    try{
      const res = await apiFetch(`/api/session/${sessionId}`)
      setQuestions(res.questions || [])
    }catch(err){
      console.error(err)
      alert("Error cargando evaluación")
    }finally{
      setLoading(false)
    }
  }

  /* ======================================
  RESPONDER
  ====================================== */
  function handleAnswer(value:string){

    const current = questions[index]

    setAnswers((prev:any)=>({
      ...prev,
      [current.id]: value
    }))

    if(index < questions.length - 1){
      setIndex(index + 1)
    }
  }

  /* ======================================
  SAVE
  ====================================== */
  async function saveAnswers(){

    const entries = Object.entries(answers)

    for(const [questionId,answer] of entries){

      await apiFetch("/api/evaluationAnswer",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          sessionId,
          questionId,
          answer
        })
      })

    }
  }

  /* ======================================
  FINISH
  ====================================== */
  async function finishEvaluation(){

    if(Object.keys(answers).length !== questions.length){
      alert("Debe responder todas las preguntas")
      return
    }

    try{

      setSaving(true)

      await saveAnswers()

      const res = await apiFetch(`/api/evaluationFinish/${sessionId}`,{
        method:"POST"
      })

      if(res.pending > 0){
        navigate(`/participant/${token}`)
      }else{
        navigate(`/participant/${token}/final`)
      }

    }catch(err){
      console.error(err)
      alert("Error al finalizar evaluación")
    }finally{
      setSaving(false)
    }
  }

  /* ======================================
  UI
  ====================================== */
  if(loading){
    return <div style={{padding:40}}>Cargando evaluación...</div>
  }

  if(!questions.length){
    return <div style={{padding:40}}>Sin preguntas</div>
  }

  const q = questions[index]

  return(

    <div style={{
      padding:40,
      maxWidth:700,
      margin:"0 auto"
    }}>

      <h2>Evaluación</h2>

      <div style={{marginBottom:20, fontSize:14, color:"#666"}}>
        Pregunta {index + 1} de {questions.length}
      </div>

      <div style={{
        padding:20,
        border:"1px solid #ddd",
        borderRadius:10
      }}>

        <div style={{
          marginBottom:20,
          fontWeight:"bold"
        }}>
          {q.text}
        </div>

        {/* ================= PETS ================= */}
        {q.type === "OPEN" && (
          <>
            <textarea
              value={answers[q.id] || ""}
              onChange={(e)=>{
                const value = e.target.value

                setAnswers((prev:any)=>({
                  ...prev,
                  [q.id]: value
                }))
              }}
              style={{
                width:"100%",
                minHeight:120,
                padding:12,
                borderRadius:8,
                border:"1px solid #ccc",
                fontSize:14
              }}
            />

            <button
              onClick={()=>handleAnswer(answers[q.id] || "")}
              style={{
                marginTop:10,
                padding:"8px 16px"
              }}
            >
              Siguiente
            </button>
          </>
        )}

        {/* ================= ICOM ================= */}
        {q.type === "LIKERT" && (
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {["Nunca","Casi nunca","A veces","Casi siempre","Siempre"].map(label=>(
              <button
                key={label}
                onClick={()=>handleAnswer(label)}
                style={{
                  padding:"10px",
                  borderRadius:6,
                  border:"1px solid #ccc",
                  cursor:"pointer"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ================= SECURITY ================= */}
        {q.type === "MCQ" && (
          <div>
            {(JSON.parse(q.optionsJson || "[]") || []).map((opt:any,i:number)=>{

              const letter = String.fromCharCode(97+i)

              return(
                <button
                  key={i}
                  onClick={()=>handleAnswer(letter)}
                  style={{
                    display:"block",
                    width:"100%",
                    textAlign:"left",
                    padding:"10px",
                    marginBottom:10,
                    borderRadius:6,
                    border:"1px solid #ccc",
                    cursor:"pointer"
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

      </div>

      {index === questions.length - 1 && (
        <button
          onClick={finishEvaluation}
          disabled={saving}
          style={{
            marginTop:20,
            padding:"14px 24px",
            background:"#0A7C66",
            color:"#fff",
            border:"none",
            borderRadius:8
          }}
        >
          {saving ? "Finalizando..." : "Finalizar evaluación"}
        </button>
      )}

    </div>
  )
}