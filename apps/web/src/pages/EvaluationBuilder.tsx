import { useState } from "react"
import { apiFetch } from "../api"
import { useNavigate } from "react-router-dom"

export default function EvaluationBuilder(){

  const navigate = useNavigate()

  const [name,setName] = useState("")
  const [type,setType] = useState("PETS")

  const [questions,setQuestions] = useState<any[]>([])

  function addQuestion(){

    setQuestions([
      ...questions,
      {
        text:"",
        competency:"",
        weight:1,
        options:["","","",""],
        correctAnswer:"",
        keywords:""
      }
    ])

  }

  function updateQuestion(index:number,field:string,value:any){

    const updated = [...questions]
    updated[index][field] = value
    setQuestions(updated)

  }

  async function save(){

    try{

      const evaluation = await apiFetch("/api/evaluations",{
        method:"POST",
        body:{ name, type }
      })

      for(const q of questions){

        await apiFetch("/api/questions",{
          method:"POST",
          body:{
            evaluationId: evaluation.id,
            text:q.text,
            type:
              type === "PETS" ? "OPEN" :
              type === "ICOM" ? "LIKERT" :
              "MCQ",
              evaluationType: type, // 🔥 NUEVO
            competency:q.competency,
            weight:q.weight,
            optionsJson:
              type === "SECURITY"
                ? JSON.stringify(q.options)
                : null,
            correctAnswer:
              type === "SECURITY"
                ? q.correctAnswer
                : null,
            keywordsJson:
              type === "PETS"
                ? JSON.stringify(q.keywords.split(","))
                : null
          }
        })

      }

      alert("Evaluación creada correctamente")
      navigate("/app/evaluations")

    }catch(err){
      console.error(err)
      alert("Error creando evaluación")
    }

  }

  return(

    <div style={{padding:40, maxWidth:1000}}>

      <h2>Nueva Evaluación</h2>

      <input
        placeholder="Nombre evaluación"
        value={name}
        onChange={e=>setName(e.target.value)}
        style={{width:"100%", marginBottom:10}}
      />

      <select
        value={type}
        onChange={e=>setType(e.target.value)}
        style={{marginBottom:20}}
      >
        <option value="PETS">PETS (Abierta)</option>
        <option value="ICOM">ICOM (Likert)</option>
        <option value="SECURITY">Seguridad (Alternativas)</option>
      </select>

      <button onClick={addQuestion}>
        Agregar pregunta
      </button>

      {questions.map((q,i)=>(

        <div key={i} style={{
          border:"1px solid #ddd",
          padding:15,
          marginTop:20,
          borderRadius:8
        }}>

          <textarea
            placeholder="Texto de la pregunta"
            value={q.text}
            onChange={e=>updateQuestion(i,"text",e.target.value)}
            style={{width:"100%", marginBottom:10}}
          />

          {/* COMPETENCIA */}
          <input
            placeholder="Competencia (ej: Trabajo en equipo)"
            value={q.competency}
            onChange={e=>updateQuestion(i,"competency",e.target.value)}
            style={{width:"100%", marginBottom:10}}
          />

          {/* PONDERACIÓN */}
          <input
            type="number"
            placeholder="Ponderación"
            value={q.weight}
            onChange={e=>updateQuestion(i,"weight",Number(e.target.value))}
            style={{width:"100%", marginBottom:10}}
          />

          {/* PETS */}
          {type === "PETS" && (
            <input
              placeholder="Keywords (separadas por coma)"
              value={q.keywords}
              onChange={e=>updateQuestion(i,"keywords",e.target.value)}
              style={{width:"100%"}}
            />
          )}

          {/* ICOM */}
          {type === "ICOM" && (
            <div style={{fontSize:12, opacity:0.7}}>
              Escala automática:
              Nunca / Casi nunca / A veces / Casi siempre / Siempre
            </div>
          )}

          {/* SECURITY */}
          {type === "SECURITY" && (
            <>
              {q.options.map((opt:string,idx:number)=>(
                <input
                  key={idx}
                  placeholder={`Opción ${idx+1}`}
                  value={opt}
                  onChange={e=>{
                    const opts=[...q.options]
                    opts[idx]=e.target.value
                    updateQuestion(i,"options",opts)
                  }}
                  style={{display:"block", marginBottom:5}}
                />
              ))}

              <input
                placeholder="Respuesta correcta (a,b,c,d)"
                value={q.correctAnswer}
                onChange={e=>updateQuestion(i,"correctAnswer",e.target.value)}
              />
            </>
          )}

        </div>

      ))}

      <button
        onClick={save}
        style={{
          marginTop:30,
          padding:"12px 20px",
          background:"#16a34a",
          color:"#fff",
          border:"none",
          borderRadius:6
        }}
      >
        Guardar evaluación
      </button>

    </div>

  )

}