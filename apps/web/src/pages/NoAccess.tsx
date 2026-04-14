import { useNavigate } from "react-router-dom"

export default function NoAccess(){

const navigate = useNavigate()

function goDashboard(){

navigate("/app")

}

return(

<div style={{
display:"flex",
flexDirection:"column",
alignItems:"center",
justifyContent:"center",
height:"70vh",
textAlign:"center"
}}>

<h2>No tienes acceso a esta página</h2>

<p style={{marginTop:10}}>
Tu usuario no tiene permisos para acceder a esta sección.
</p>

<div style={{marginTop:20,display:"flex",gap:10}}>

<button
style={{
padding:"10px 20px",
background:"#2563eb",
color:"#fff",
border:"none",
borderRadius:6,
cursor:"pointer"
}}
onClick={()=>navigate(-1)}
>
Volver
</button>

<button
style={{
padding:"10px 20px",
background:"#16a34a",
color:"#fff",
border:"none",
borderRadius:6,
cursor:"pointer"
}}
onClick={goDashboard}
>
Ir al dashboard
</button>

</div>

</div>

)

}