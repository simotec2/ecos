export default function Card({
  title,
  children
}: any){

  return(

    <div style={styles.card}>

      {title && (

        <h3 style={styles.title}>
          {title}
        </h3>

      )}

      {children}

    </div>

  )

}

const styles:any = {

  card:{

    background:
      "rgba(17,36,58,0.96)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:18,

    padding:24,

    boxShadow:
      "0 8px 30px rgba(0,0,0,0.35)",

    backdropFilter:
      "blur(10px)",

    marginBottom:30

  },

  title:{

    marginBottom:20,

    fontSize:20,

    fontWeight:600,

    color:"#ffffff"

  }

}