export default function Finished(){

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
        padding:50,
        borderRadius:16,
        maxWidth:700,
        width:"100%",
        boxShadow:"0 4px 25px rgba(0,0,0,0.08)",
        textAlign:"center"
      }}>

        {/* ======================================
        LOGO
        ====================================== */}

        <div style={{
          marginBottom:25
        }}>

          <img
            src="/ecos-logo.png"
            alt="ECOS"
            style={{height:65}}
          />

        </div>

        {/* ======================================
        ICONO
        ====================================== */}

        <div style={{
          width:90,
          height:90,
          borderRadius:"50%",
          background:"#dcfce7",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          margin:"0 auto 30px auto",
          fontSize:42
        }}>

          ✅

        </div>

        {/* ======================================
        TITULO
        ====================================== */}

        <h1 style={{
          marginBottom:20,
          color:"#111827",
          fontSize:32
        }}>
          Evaluaciones Finalizadas
        </h1>

        {/* ======================================
        MENSAJES
        ====================================== */}

        <p style={{
          marginBottom:20,
          lineHeight:1.8,
          fontSize:17,
          color:"#374151"
        }}>

          Muchas gracias por realizar la Evaluación ECOS, su proceso de evaluación ha sido completado correctamente.

        </p>

        <p style={{
          marginBottom:20,
          lineHeight:1.8,
          fontSize:16,
          color:"#4b5563"
        }}>

          Sus respuestas fueron registradas exitosamente en la plataforma ECOS y serán analizadas como parte del proceso de evaluación.

        </p>

        <p style={{
          marginBottom:20,
          lineHeight:1.8,
          fontSize:15,
          color:"#6b7280"
        }}>

          Los resultados serán gestionados directamente por su organización.

        </p>

        <p style={{
          marginBottom:35,
          lineHeight:1.8,
          fontSize:15,
          color:"#6b7280",
          fontWeight:"bold"
        }}>

          Ya no es necesario volver a ingresar a la plataforma.
          Puede cerrar esta ventana con tranquilidad.

        </p>

        {/* ======================================
        MENSAJE FINAL
        ====================================== */}

        <div style={{
          padding:15,
          borderRadius:10,
          background:"#f0fdf4",
          border:"1px solid #bbf7d0",
          color:"#166534",
          fontSize:14
        }}>

          Gracias por participar en la Evaluación de Competencias en Seguridad ECOS.

        </div>

      </div>

    </div>

  )

}