import { useEffect, useState } from "react"
import { apiFetch } from "../api"

export default function CompanySelector(){

const role = localStorage.getItem("role")

const [companies,setCompanies] = useState<any[]>([])
const [active,setActive] = useState(localStorage.getItem("activeCompanyId") || "")

useEffect(()=>{
load()
},[])

async function load(){

try{

const data = await apiFetch("/api/companies")

setCompanies(data || [])

}catch(err){

console.error("Error cargando empresas",err)

}

}

function changeCompany(id:string){

localStorage.setItem("activeCompanyId",id)

setActive(id)

/* recargar datos del sistema */

window.location.reload()

}

if(role !== "SUPERADMIN") return null

return(

<div style={styles.container}>

<div style={styles.label}>
Empresa activa
</div>

<select
value={active}
onChange={(e)=>changeCompany(e.target.value)}
style={styles.select}
>

<option value="">Todas</option>

{companies.map((c:any)=>(

<option key={c.id} value={c.id}>
{c.name}
</option>

))}

</select>

</div>

)

}

const styles:any={

container:{
display:"flex",
alignItems:"center",
gap:10
},

label:{
fontSize:12,
color:"#6b7280"
},

select:{
padding:"6px 10px",
borderRadius:6,
border:"1px solid #ddd"
}

}