import { useEffect, useRef, useState } from "react"
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

  const [remainingSeconds,setRemainingSeconds] = useState<number | null>(null)
  const [expired,setExpired] = useState(false)

  const answersRef = useRef<any>({})
  const finishingRef = useRef(false)

  const token = localStorage.getItem("participantToken")

  const isMobile = window.innerWidth < 768

  /* ======================================
  MANTENER RESPUESTAS ACTUALIZADAS EN REF
  ====================================== */
  useEffect(()=>{

    answersRef.current = answers

  },[answers])

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

      if(
        res.expired ||
        res.status === "COMPLETED" ||
        res.completedAt
      ){

        alert("Esta evaluación ya fue finalizada y no puede retomarse.")

        navigate(`/participant/${token}`)

        return

      }

      setQuestions(res.questions || [])

      /* ======================================
      CARGAR RESPUESTAS EXISTENTES NO VACÍAS
      ====================================== */
      if(res.answers){

        const loadedAnswers:any = {}

        res.answers.forEach((a:any)=>{

          if(
            a.answer !== null &&
            a.answer !== undefined &&
            String(a.answer).trim() !== ""
          ){

            loadedAnswers[a.questionId] = a.answer

          }

        })

        setAnswers(loadedAnswers)

      }

      /* ======================================
      CALCULAR TIEMPO RESTANTE
      ====================================== */
      if(res.expiresAt){

        const expires =
          new Date(res.expiresAt).getTime()

        const now =
          new Date().getTime()

        const seconds =
          Math.max(
            0,
            Math.floor((expires - now) / 1000)
          )

        setRemainingSeconds(seconds)

      }

    }catch(err){

      console.error(err)

      alert("Error cargando evaluación")

    }finally{

      setLoading(false)

    }

  }

  /* ======================================
  TIMER
  ====================================== */
  useEffect(()=>{

    if(remainingSeconds === null){
      return
    }

    if(remainingSeconds <= 0){

      if(!finishingRef.current){
        finishByTimeout()
      }

      return
    }

    const timer = window.setTimeout(()=>{

      setRemainingSeconds(prev => {

        if(prev === null){
          return null
        }

        return prev - 1

      })

    },1000)

    return ()=>{
      window.clearTimeout(timer)
    }

  },[remainingSeconds])

  function formatTime(totalSeconds:number | null){

    if(totalSeconds === null){
      return "--:--"
    }

    const minutes =
      Math.floor(totalSeconds / 60)

    const seconds =
      totalSeconds % 60

    return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`

  }

  function answeredCount(){

    return questions.filter(q => {

      const value =
        answersRef.current[q.id]

      return (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
      )

    }).length

  }

  /* ======================================
  RESPONDER
  ====================================== */
  function handleAnswer(value:string){

    if(expired || saving){
      return
    }

    const current = questions[index]

    if(!current){
      return
    }

    if(String(value || "").trim() === ""){

      alert("Debe responder esta pregunta para continuar")

      return

    }

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
  CIERRE AUTOMÁTICO POR TIEMPO
  ====================================== */
  async function finishByTimeout(){

    try{

      finishingRef.current = true
      setExpired(true)
      setSaving(true)

      const res = await apiFetch(`/api/evaluationFinish/${sessionId}`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          answers: answersRef.current
        })
      })

      alert("El tiempo terminó. La evaluación fue cerrada automáticamente.")

      if(res.pending > 0){

        navigate(`/participant/${token}`)

      }else{

        navigate(`/participant/${token}/final`)

      }

    }catch(err){

      console.error(err)

      alert("El tiempo terminó, pero ocurrió un error al cerrar la evaluación.")

      navigate(`/participant/${token}`)

    }finally{

      setSaving(false)

    }

  }

  /* ======================================
  FINISH MANUAL
  ====================================== */
  async function finishEvaluation(){

    if(expired || saving){
      return
    }

    if(answeredCount() !== questions.length){

      alert("Debe responder todas las preguntas")

      return

    }

    try{

      finishingRef.current = true
      setSaving(true)

      const res = await apiFetch(`/api/evaluationFinish/${sessionId}`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          answers: answersRef.current
        })
      })

      if(res.pending > 0){

        navigate(`/participant/${token}`)

      }else{

        navigate(`/participant/${token}/final`)

      }

    }catch(err){

      finishingRef.current = false

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

        <div style={styles.topBar}>

          <div>

            <h2 style={styles.title}>
              Evaluación
            </h2>

            <div style={styles.progress}>
              Pregunta {index + 1} de {questions.length}
            </div>

          </div>

          <div style={{
            ...styles.timer,
            ...(remainingSeconds !== null && remainingSeconds <= 300
              ? styles.timerDanger
              : {})
          }}>

            <div style={styles.timerLabel}>
              Tiempo restante
            </div>

            <div style={styles.timerValue}>
              {formatTime(remainingSeconds)}
            </div>

          </div>

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
                disabled={expired || saving}
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
                disabled={expired || saving}
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
                  disabled={expired || saving}
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
                    disabled={expired || saving}
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
            disabled={saving || expired}
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

  topBar:{

    display:"flex",

    justifyContent:"space-between",

    alignItems:"center",

    gap:16,

    marginBottom:20,

    flexWrap:"wrap"

  },

  title:{

    color:"#fff",

    fontSize:"clamp(24px,4vw,34px)",

    marginBottom:10

  },

  progress:{

    color:"#94a3b8",

    fontSize:14

  },

  timer:{

    minWidth:150,

    padding:"12px 16px",

    borderRadius:16,

    background:"rgba(15,23,42,0.95)",

    border:"1px solid rgba(255,255,255,0.12)",

    color:"#fff",

    textAlign:"center",

    boxShadow:"0 8px 24px rgba(0,0,0,0.35)"

  },

  timerDanger:{

    border:"1px solid rgba(239,68,68,0.7)",

    boxShadow:"0 8px 24px rgba(239,68,68,0.25)"

  },

  timerLabel:{

    fontSize:12,

    color:"#94a3b8",

    marginBottom:4

  },

  timerValue:{

    fontSize:26,

    fontWeight:800,

    letterSpacing:1

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