export default function FormGrid({ children }: any){

return(

<div style={styles.grid}>
{children}
</div>

)

}

const styles:any={

grid:{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
gap:16
}

}