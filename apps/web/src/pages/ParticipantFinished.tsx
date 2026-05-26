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
      background:"#0f172a",
      padding:20
    }}>

      <div style={{
        maxWidth:650,
        width:"100%",
        background:"#1e293b",
        borderRadius:20,
        padding:50,
        textAlign:"center",
        border:"1px solid #334155",
        boxShadow:"0 10px 40px rgba(0,0,0,0.4)"
      }}>

        {/* LOGO */}
        <div style={{
          marginBottom:35
        }}>

          <img
            src="/ecos-logo.png"
            alt="ECOS"
            style={{
              height:65
            }}
          />

        </div>

        {/* ICONO */}
        <div style={{
          fontSize:60,
          marginBottom:20
        }}>
          ✅
        </div>

        {/* TITULO */}
        <h2 style={{
          marginBottom:20,
          color:"#ffffff",
          fontSize:32,
          fontWeight:700
        }}>
          Evaluaciones Finalizadas
        </h2>

        {/* TEXTO PRINCIPAL */}
        <p style={{
          fontSize:17,
          color:"#cbd5e1",
          lineHeight:1.8,
          marginBottom:25
        }}>
          Muchas gracias por completar todas las evaluaciones asignadas.
        </p>

        {/* TEXTO SECUNDARIO */}
        <p style={{
          fontSize:15,
          color:"#94a3b8",
          lineHeight:1.7,
          marginBottom:45
        }}>
          Su participación ha sido registrada correctamente y los resultados serán entregados a su empresa para su correspondiente análisis.
        </p>

        {/* BOTON */}
        <button
          onClick={goHome}
          style={{
            padding:"14px 32px",
            borderRadius:12,
            border:"none",
            background:"#0A7C66",
            color:"#ffffff",
            fontSize:15,
            fontWeight:600,
            cursor:"pointer",
            transition:"0.2s ease",
            boxShadow:"0 4px 14px rgba(10,124,102,0.35)"
          }}
        >
          Finalizar
        </button>

      </div>

    </div>

  )

}