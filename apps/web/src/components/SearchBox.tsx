import { useState } from "react"

export default function SearchBox({ onSearch }: any){

const [value,setValue] = useState("")

function handle(e:any){

const v = e.target.value

setValue(v)

onSearch(v)

}

return(

<input
placeholder="Buscar..."
value={value}
onChange={handle}
style={{
width:300,
padding:"8px 10px",
borderRadius:6,
border:"1px solid #ddd",
marginBottom:20
}}
/>

)

}