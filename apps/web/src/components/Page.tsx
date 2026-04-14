export default function Page({children}:{children:any}){

return(

<div style={{

width:"100%",
display:"flex",
flexDirection:"column",
gap:24

}}>

{children}

</div>

)

}