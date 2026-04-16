import { useNavigate } from "react-router-dom"

export default function ParticipantFinished(){

  const navigate = useNavigate()

  function goHome(){
    localStorage.removeItem("participantToken")
    navigate("/")
  }

  return(

    <div style={{
      minHeight:"100vh",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      background:"#f4f6f8",
      padding:20
    }}>

      <div style={{
        maxWidth:600,
        width:"100%",
        background:"#fff",
        borderRadius:12,
        padding:40,
        textAlign:"center",
        boxShadow:"0 4px 20px rgba(0,0,0,0.08)"
      }}>

        {/* LOGO */}
        <div style={{marginBottom:30}}>
          <img 
            src="/ecos-logo.png" 
            alt="ECOS" 
            style={{height:60}}
          />
        </div>

        {/* MENSAJE */}
        <h2 style={{marginBottom:20}}>
          Evaluaciones Finalizadas
        </h2>

        <p style={{
          fontSize:16,
          color:"#555",
          lineHeight:1.6,
          marginBottom:30
        }}>
          Muchas gracias por completar todas las evaluaciones asignadas.
        </p>

        <p style={{
          fontSize:14,
          color:"#777",
          marginBottom:40
        }}>
          Su participación ha sido registrada correctamente y los resultados serán entregados a su empresa, muchas gracias.
        </p>

        {/* BOTÓN */}
        <button
          onClick={goHome}
          style={{
            padding:"12px 24px",
            borderRadius:8,
            border:"none",
            background:"#0A7C66",
            color:"#fff",
            fontSize:14,
            cursor:"pointer"
          }}
        >
          Finalizar
        </button>

      </div>

    </div>
  )
}