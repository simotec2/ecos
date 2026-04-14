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

<h1 style={styles.title}>Empresas</h1>

<div style={styles.formGrid}>

<input style={styles.input} name="name" placeholder="Nombre empresa" onChange={update}/>
<input style={styles.input} name="razonSocial" placeholder="Razón social" onChange={update}/>

<input style={styles.input} name="rut" placeholder="RUT empresa" onChange={update}/>
<input style={styles.input} name="direccion" placeholder="Dirección" onChange={update}/>

<input style={styles.input} name="giro" placeholder="Giro" onChange={update}/>

</div>

<h3 style={styles.sectionTitle}>Contacto empresa</h3>

<div style={styles.formGrid}>

<input style={styles.input} name="contactoNombre" placeholder="Nombre contacto" onChange={update}/>
<input style={styles.input} name="contactoTelefono" placeholder="Teléfono contacto" onChange={update}/>

<input style={styles.input} name="contactoEmail" placeholder="Email contacto" onChange={update}/>

</div>

<h3 style={styles.sectionTitle}>Usuario empresa</h3>

<div style={styles.formGrid}>

<input style={styles.input} name="usuarioEmpresaNombre" placeholder="Nombre usuario empresa" onChange={update}/>
<input style={styles.input} name="usuarioEmpresaTelefono" placeholder="Teléfono usuario empresa" onChange={update}/>

<input style={styles.input} name="usuarioEmpresaEmail" placeholder="Email usuario empresa" onChange={update}/>

</div>

<button style={styles.button} onClick={create}>
Crear empresa
</button>

<hr style={{margin:"40px 0"}}/>

<h2>Listado</h2>

<div style={styles.list}>

{companies.map(c=>(

<div key={c.id} style={styles.companyItem}>

<strong>{c.name}</strong>

<div>{c.rut}</div>

</div>

))}

</div>

</div>

)

}

const styles:any={

page:{
width:"100%",
maxWidth:"1600px",
margin:"0 auto"
},

title:{
marginBottom:30,
fontSize:24,
fontWeight:600
},

sectionTitle:{
marginTop:30,
marginBottom:10
},

formGrid:{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(350px,1fr))",
gap:20,
width:"100%"
},

input:{
width:"100%",
padding:"10px",
border:"1px solid #d1d5db",
borderRadius:6,
fontSize:14
},

button:{
marginTop:20,
padding:"10px 18px",
background:"#2563eb",
color:"#fff",
border:"none",
borderRadius:6,
cursor:"pointer"
},

list:{
display:"flex",
flexDirection:"column",
gap:12
},

companyItem:{
background:"#fff",
padding:16,
borderRadius:8,
boxShadow:"0 2px 6px rgba(0,0,0,0.05)"
}

}
