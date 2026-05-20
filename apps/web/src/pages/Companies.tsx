import { useEffect, useState } from "react"
import { apiFetch } from "../api"

export default function Companies(){

  const [companies,setCompanies] = useState<any[]>([])

  const [form,setForm] = useState({

    name:"",
    razonSocial:"",
    rut:"",
    direccion:"",
    giro:"",
    contactoNombre:"",
    contactoTelefono:"",
    contactoEmail:"",
    usuarioEmpresaNombre:"",
    usuarioEmpresaTelefono:"",
    usuarioEmpresaEmail:""

  })

  function update(e:any){

    setForm({

      ...form,
      [e.target.name]:e.target.value

    })

  }

  async function load(){

    const data = await apiFetch("/api/companies")

    setCompanies(data)

  }

  async function create(){

    await apiFetch("/api/companies",{

      method:"POST",

      body:JSON.stringify(form)

    })

    load()

  }

  useEffect(()=>{

    load()

  },[])

  return(

    <div style={styles.page}>

      {/* TITLE */}

      <h1 style={styles.title}>
        Empresas
      </h1>

      {/* FORM CARD */}

      <div style={styles.card}>

        <div style={styles.formGrid}>

          <input
            style={styles.input}
            name="name"
            placeholder="Nombre empresa"
            onChange={update}
          />

          <input
            style={styles.input}
            name="razonSocial"
            placeholder="Razón social"
            onChange={update}
          />

          <input
            style={styles.input}
            name="rut"
            placeholder="RUT empresa"
            onChange={update}
          />

          <input
            style={styles.input}
            name="direccion"
            placeholder="Dirección"
            onChange={update}
          />

          <input
            style={styles.input}
            name="giro"
            placeholder="Giro"
            onChange={update}
          />

        </div>

        {/* CONTACTO */}

        <h3 style={styles.sectionTitle}>
          Contacto empresa
        </h3>

        <div style={styles.formGrid}>

          <input
            style={styles.input}
            name="contactoNombre"
            placeholder="Nombre contacto"
            onChange={update}
          />

          <input
            style={styles.input}
            name="contactoTelefono"
            placeholder="Teléfono contacto"
            onChange={update}
          />

          <input
            style={styles.input}
            name="contactoEmail"
            placeholder="Email contacto"
            onChange={update}
          />

        </div>

        {/* USUARIO EMPRESA */}

        <h3 style={styles.sectionTitle}>
          Usuario empresa
        </h3>

        <div style={styles.formGrid}>

          <input
            style={styles.input}
            name="usuarioEmpresaNombre"
            placeholder="Nombre usuario empresa"
            onChange={update}
          />

          <input
            style={styles.input}
            name="usuarioEmpresaTelefono"
            placeholder="Teléfono usuario empresa"
            onChange={update}
          />

          <input
            style={styles.input}
            name="usuarioEmpresaEmail"
            placeholder="Email usuario empresa"
            onChange={update}
          />

        </div>

        <button
          style={styles.button}
          onClick={create}
        >

          Crear empresa

        </button>

      </div>

      {/* LISTADO */}

      <h2 style={styles.listTitle}>
        Listado
      </h2>

      <div style={styles.list}>

        {companies.map(c=>(

          <div
            key={c.id}
            style={styles.companyItem}
          >

            <div style={styles.companyName}>
              {c.name}
            </div>

            <div style={styles.companyRut}>
              {c.rut}
            </div>

          </div>

        ))}

      </div>

    </div>

  )

}

const styles:any = {

  page:{

    width:"100%",

    maxWidth:"1600px",

    margin:"0 auto"

  },

  title:{

    marginBottom:30,

    fontSize:32,

    fontWeight:700,

    color:"#ffffff"

  },

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
      "blur(10px)"

  },

  sectionTitle:{

    marginTop:30,

    marginBottom:12,

    color:"#ffffff",

    fontSize:20,

    fontWeight:600

  },

  formGrid:{

    display:"grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(350px,1fr))",

    gap:20,

    width:"100%"

  },

  input:{

    width:"100%",

    padding:"12px 14px",

    background:"#081226",

    border:"1px solid #223548",

    borderRadius:12,

    fontSize:14,

    color:"#ffffff",

    outline:"none"

  },

  button:{

    marginTop:24,

    padding:"12px 18px",

    background:
      "linear-gradient(135deg,#2563eb,#1d4ed8)",

    color:"#fff",

    border:"none",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:600

  },

  listTitle:{

    marginTop:40,

    marginBottom:20,

    color:"#ffffff",

    fontSize:28,

    fontWeight:700

  },

  list:{

    display:"flex",

    flexDirection:"column",

    gap:14

  },

  companyItem:{

    background:
      "rgba(17,36,58,0.96)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    padding:18,

    borderRadius:16,

    boxShadow:
      "0 8px 20px rgba(0,0,0,0.25)"

  },

  companyName:{

    color:"#ffffff",

    fontSize:18,

    fontWeight:600,

    marginBottom:6

  },

  companyRut:{

    color:"#cbd5e1",

    fontSize:14

  }

}