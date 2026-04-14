import { useNavigate } from "react-router-dom"

export default function Finished(){

  const navigate = useNavigate()

  return(

    <div style={{
      minHeight:"100vh",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      background:"#f5f7fa",
      padding:20
    }}>

      <div style={{
        background:"#fff",
        padding:40,
        borderRadius:12,
        maxWidth:600,
        width:"100%",
        boxShadow:"0 4px 20px rgba(0,0,0,0.08)",
        textAlign:"center"
      }}>

        {/* LOGO */}
        <div style={{marginBottom:20}}>
          <img src="/ecos-logo.png" alt="ECOS" style={{height:60}} />
        </div>

        {/* TITULO */}
        <h2 style={{marginBottom:20}}>
          Evaluación finalizada
        </h2>

        {/* MENSAJE */}
        <p style={{marginBottom:15,lineHeight:1.6}}>
          Muchas gracias por completar la evaluación.
        </p>

        <p style={{marginBottom:15,lineHeight:1.6}}>
          Sus respuestas han sido registradas correctamente y serán analizadas como parte del proceso.
        </p>

        <p style={{marginBottom:15,lineHeight:1.6}}>
          Los resultados serán gestionados directamente por su organización, por lo que le recomendamos contactar con ellos para obtener información sobre sus resultados y próximos pasos.
        </p>

        <p style={{marginBottom:25,lineHeight:1.6}}>
          Agradecemos su participación.
        </p>

        {/* BOTON OPCIONAL */}
        <button
          onClick={()=>navigate("/")}
          style={{
            padding:"10px 20px",
            background:"#0A7C66",
            color:"#fff",
            border:"none",
            borderRadius:8,
            cursor:"pointer"
          }}
        >
          Finalizar
        </button>

      </div>

    </div>

  )
}