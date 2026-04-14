export default function Thanks(){

  return(

    <div style={{
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      height:"100vh",
      background:"#f8fafc"
    }}>

      <div style={{
        textAlign:"center",
        background:"#fff",
        padding:40,
        borderRadius:12,
        boxShadow:"0 10px 30px rgba(0,0,0,0.1)"
      }}>

        <h2 style={{marginBottom:20}}>
          Evaluación finalizada
        </h2>

        <p style={{marginBottom:30}}>
          Gracias por completar la evaluación, comunícate con tu empresa para saber los resultados.
        </p>

        <button
          onClick={()=>window.location.href="/"}
          style={{
            padding:"10px 20px",
            background:"#2563eb",
            color:"#fff",
            border:"none",
            borderRadius:6,
            cursor:"pointer"
          }}
        >
          Volver
        </button>

      </div>

    </div>

  )

}