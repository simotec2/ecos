import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiFetch } from "../api"
import { evaluationLabels } from "../utils/evaluationLabels"

export default function ParticipantAccess(){

  const { token } = useParams()
  const navigate = useNavigate()

  const [loading,setLoading]=useState(true)
  const [data,setData]=useState<any>(null)

  useEffect(()=>{
    if(token){
      localStorage.setItem("participantToken", token)
      load()
    }
  },[token])

  async function load(){

    try{

      const res = await apiFetch(
        `/api/participant/access/${token}`
      )

      const uniqueEvaluations = Object.values(

        (res.evaluations || []).reduce((acc:any, a:any)=>{

          const key = a.type

          if(!acc[key]){
            acc[key] = a
            return acc
          }

          if(
            acc[key].status === "COMPLETED" &&
            a.status !== "COMPLETED"
          ){
            acc[key] = a
            return acc
          }

          if(a.createdAt > acc[key].createdAt){
            acc[key] = a
          }

          return acc

        },{})

      )

      setData({
        ...res,
        evaluations: uniqueEvaluations
      })

    }catch(err){

      console.error(
        "Error cargando participante",
        err
      )

    }finally{

      setLoading(false)

    }

  }

  async function goToEvaluation(
    evaluationId:string,
    status:string
  ){

    if(status === "COMPLETED"){

      alert("Esta evaluación ya fue realizada")
      return

    }

    try{

      const res = await apiFetch("/api/session",{

        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body: JSON.stringify({
          participantId: data.participant.id,
          evaluationId
        })

      })

      if(!res || !res.id){

        alert(
          "Error: no se pudo crear la sesión"
        )

        return

      }

      navigate(`/evaluation/${res.id}`)

    }catch(err:any){

      if(
        err?.message?.includes(
          "Evaluación ya completada"
        )
      ){

        alert(
          "Esta evaluación ya fue realizada"
        )

      }else{

        alert(
          "No se pudo iniciar la evaluación"
        )

      }

    }

  }

  function getStatus(status:string){

    if(status === "COMPLETED"){
      return "Ya realizada"
    }

    if(status === "STARTED"){
      return "Continuar"
    }

    return "Rendir"

  }

  function getButtonStyle(status:string){

    if(status === "COMPLETED"){

      return {
        background:"#475569",
        cursor:"not-allowed"
      }

    }

    return {
      background:"#0A7C66",
      cursor:"pointer"
    }

  }

  if(loading){

    return (
      <div style={{
        minHeight:"100vh",
        background:"#0f172a",
        color:"#fff",
        display:"flex",
        alignItems:"center",
        justifyContent:"center"
      }}>
        Cargando...
      </div>
    )

  }

  if(!data || !data.participant){

    return (
      <div style={{
        minHeight:"100vh",
        background:"#0f172a",
        color:"#fff",
        display:"flex",
        alignItems:"center",
        justifyContent:"center"
      }}>
        Sin datos
      </div>
    )

  }

  const participant = data.participant

  return(

    <div style={{
      minHeight:"100vh",
      background:"#0f172a",
      padding:40,
      color:"#fff"
    }}>

      <div style={{
        maxWidth:900,
        margin:"0 auto"
      }}>

        {/* ======================================
        LOGO
        ====================================== */}

        <div style={{
          display:"flex",
          justifyContent:"center",
          marginBottom:30
        }}>

          <img
            src="/ecos-logo.png"
            alt="ECOS"
            style={{height:60}}
          />

        </div>

        {/* ======================================
        BIENVENIDA
        ====================================== */}

        <div style={{
          background:"#1e293b",
          borderRadius:16,
          padding:30,
          marginBottom:30,
          border:"1px solid #334155",
          boxShadow:"0 10px 30px rgba(0,0,0,0.35)"
        }}>

          <h2 style={{
            marginTop:0,
            marginBottom:20,
            color:"#ffffff"
          }}>
            Bienvenido a ECOS
          </h2>

          <p style={{
            color:"#cbd5e1",
            lineHeight:1.8
          }}>
            Estimado{" "}
            <strong>
              {participant.nombre} {participant.apellido}
            </strong>,
          </p>

          <p style={{
            color:"#cbd5e1",
            lineHeight:1.8
          }}>
            {participant.company?.name
              ? `La empresa ${participant.company.name} lo ha invitado a realizar la evaluación ECOS.`
              : "Su empresa lo ha invitado a realizar las siguientes evaluaciones."
            }
          </p>

        </div>

        {/* ======================================
        INSTRUCCIONES
        ====================================== */}

        <div style={{
          background:"#1e293b",
          borderRadius:16,
          padding:30,
          marginBottom:30,
          border:"1px solid #334155",
          boxShadow:"0 10px 30px rgba(0,0,0,0.35)"
        }}>

          <h3 style={{
            marginTop:0,
            marginBottom:20,
            color:"#22c55e"
          }}>
            Instrucciones Generales
          </h3>

          <div style={{
            lineHeight:1.9,
            fontSize:15,
            color:"#cbd5e1"
          }}>

            <p>
              A continuación, daremos inicio a la Evaluación de Competencias en Seguridad ECOS.
              Esta evaluación tiene por objetivo evaluar competencias asociadas al trabajo seguro y al desempeño en entornos laborales de alta exigencia.
            </p>

            <p>
              La evaluación completa tiene una duración aproximada entre 60 y 90 minutos.
              Recomendamos responder en un lugar tranquilo, sin interrupciones y utilizando un computador o dispositivo con conexión estable.
            </p>

            <p>
              Durante la evaluación PETS se presentarán preguntas orientadas a conocer experiencias reales de trabajo.
              En sus respuestas deberá describir:
            </p>

            <ul style={{
              paddingLeft:25
            }}>
              <li>La situación enfrentada</li>
              <li>Las acciones realizadas</li>
              <li>El resultado obtenido</li>
              <li>Los aprendizajes logrados</li>
            </ul>

            <p>
              En la evaluación Psicolaboral (ICOM) encontrará afirmaciones relacionadas con su comportamiento habitual en el trabajo.
              Deberá seleccionar la frecuencia con que cada situación representa su forma de actuar:
              Nunca, Casi nunca, A veces, Casi siempre o Siempre.
            </p>

            <p>
              No existen respuestas correctas o incorrectas.
              Responda de manera natural, honesta y espontánea.
            </p>

            <p style={{
              marginTop:20,
              fontWeight:"bold",
              color:"#22c55e"
            }}>
              Le deseamos mucho éxito en su evaluación.
            </p>

          </div>

        </div>

        {/* ======================================
        EVALUACIONES
        ====================================== */}

        <h3 style={{
          marginBottom:20,
          color:"#ffffff"
        }}>
          Evaluaciones Asignadas
        </h3>

        {(data.evaluations || []).map((a:any)=>(

          <div
            key={a.id}
            style={{
              background:"#1e293b",
              border:"1px solid #334155",
              borderRadius:14,
              padding:22,
              marginBottom:15,
              display:"flex",
              justifyContent:"space-between",
              alignItems:"center",
              boxShadow:"0 6px 20px rgba(0,0,0,0.25)"
            }}
          >

            <div>

              <strong style={{
                color:"#ffffff",
                fontSize:16
              }}>
                {evaluationLabels[a.type] || a.name}
              </strong>

              <div style={{
                fontSize:12,
                color:"#94a3b8",
                marginTop:5
              }}>
                {a.type}
              </div>

            </div>

            <button
              onClick={()=>goToEvaluation(
                a.id,
                a.status
              )}

              disabled={
                a.status === "COMPLETED"
              }

              style={{
                padding:"12px 24px",
                borderRadius:10,
                border:"none",
                color:"#fff",
                fontWeight:600,
                fontSize:14,
                transition:"0.2s",
                ...getButtonStyle(a.status)
              }}
            >

              {getStatus(a.status)}

            </button>

          </div>

        ))}

      </div>

    </div>

  )

}