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

  const isMobile = window.innerWidth < 768

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

      window.scrollTo({
        top:0,
        behavior:"smooth"
      })

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

    return(

      <div style={styles.loading}>
        Cargando evaluación...
      </div>

    )

  }

  if(!questions.length){

    return(

      <div style={styles.loading}>
        Sin preguntas
      </div>

    )

  }

  const q = questions[index]

  return(

    <div style={styles.page}>

      <div style={styles.container}>

        <h2 style={styles.title}>
          Evaluación
        </h2>

        <div style={styles.progress}>
          Pregunta {index + 1} de {questions.length}
        </div>

        <div style={styles.card}>

          <div style={styles.question}>
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
                style={styles.textarea}
              />

              <button
                onClick={()=>
                  handleAnswer(answers[q.id] || "")
                }
                style={styles.primaryButton}
              >
                Siguiente
              </button>

            </>

          )}

          {/* ================= ICOM ================= */}

          {q.type === "LIKERT" && (

            <div style={{
              display:"flex",
              flexDirection:
                isMobile
                ? "column"
                : "row",
              gap:12
            }}>

              {[
                "Nunca",
                "Casi nunca",
                "A veces",
                "Casi siempre",
                "Siempre"
              ].map(label=>(

                <button
                  key={label}
                  onClick={()=>
                    handleAnswer(label)
                  }
                  style={{
                    ...styles.optionButton,
                    width:
                      isMobile
                      ? "100%"
                      : "auto"
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

                const letter =
                  String.fromCharCode(97+i)

                return(

                  <button
                    key={i}
                    onClick={()=>
                      handleAnswer(letter)
                    }
                    style={styles.mcqButton}
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
            style={styles.finishButton}
          >
            {saving
              ? "Finalizando..."
              : "Finalizar evaluación"}
          </button>

        )}

      </div>

    </div>

  )

}

const styles:any = {

  page:{

    minHeight:"100vh",

    background:
      "linear-gradient(180deg,#0f172a 0%,#111827 100%)",

    padding:"20px"

  },

  container:{

    width:"100%",

    maxWidth:900,

    margin:"0 auto"

  },

  loading:{

    padding:40,

    color:"#fff",

    background:"#0f172a",

    minHeight:"100vh"

  },

  title:{

    color:"#fff",

    fontSize:"clamp(24px,4vw,34px)",

    marginBottom:10

  },

  progress:{

    color:"#94a3b8",

    marginBottom:20,

    fontSize:14

  },

  card:{

    background:
      "rgba(15,23,42,0.92)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:20,

    padding:"clamp(18px,4vw,32px)",

    backdropFilter:"blur(12px)",

    boxShadow:
      "0 10px 40px rgba(0,0,0,0.45)"

  },

  question:{

    color:"#fff",

    fontWeight:700,

    fontSize:"clamp(18px,3vw,24px)",

    lineHeight:1.5,

    marginBottom:25

  },

  textarea:{

    width:"100%",

    minHeight:140,

    padding:16,

    borderRadius:12,

    border:"1px solid rgba(255,255,255,0.1)",

    background:"#1e293b",

    color:"#fff",

    fontSize:16,

    resize:"vertical",

    boxSizing:"border-box"

  },

  primaryButton:{

    marginTop:16,

    width:"100%",

    padding:"14px",

    border:"none",

    borderRadius:12,

    background:
      "linear-gradient(135deg,#2563eb,#1d4ed8)",

    color:"#fff",

    fontWeight:700,

    fontSize:16,

    cursor:"pointer"

  },

  optionButton:{

    flex:1,

    padding:"16px 14px",

    borderRadius:12,

    border:"1px solid rgba(255,255,255,0.1)",

    background:"#1e293b",

    color:"#fff",

    cursor:"pointer",

    fontWeight:600,

    fontSize:15

  },

  mcqButton:{

    display:"block",

    width:"100%",

    textAlign:"left",

    padding:"16px",

    marginBottom:14,

    borderRadius:12,

    border:"1px solid rgba(255,255,255,0.1)",

    background:"#1e293b",

    color:"#fff",

    cursor:"pointer",

    fontSize:15,

    lineHeight:1.5

  },

  finishButton:{

    marginTop:24,

    width:"100%",

    padding:"18px",

    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",

    color:"#fff",

    border:"none",

    borderRadius:14,

    fontWeight:700,

    fontSize:18,

    cursor:"pointer",

    boxShadow:
      "0 8px 25px rgba(34,197,94,0.35)"

  }

}