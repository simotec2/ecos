import { useNavigate } from "react-router-dom"

export default function ImpersonationBar(){

const navigate = useNavigate()

const originalRole = localStorage.getItem("originalRole")
const role = localStorage.getItem("role")

if(originalRole !== "SUPERADMIN") return null
if(role === "SUPERADMIN") return null

function backToAdmin(){

localStorage.setItem("role","SUPERADMIN")
localStorage.removeItem("originalRole")

navigate("/app")

}

return(

<div style={{
position:"fixed",
top:0,
left:0,
right:0,
background:"#dc2626",
color:"#fff",
padding:"8px 20px",
display:"flex",
justifyContent:"space-between",
alignItems:"center",
zIndex:9999
}}>

<div>
Estás viendo el sistema como <b>{role}</b>
</div>

<button
onClick={backToAdmin}
style={{
background:"#fff",
color:"#dc2626",
border:"none",
padding:"6px 12px",
borderRadius:6,
cursor:"pointer"
}}
>
Volver a superadministrador
</button>

</div>

)

}