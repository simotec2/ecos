export default function Card({ title, children }: any){

return(

<div style={styles.card}>

{title && (
<h3 style={styles.title}>{title}</h3>
)}

{children}

</div>

)

}

const styles:any={

card:{
background:"#ffffff",
borderRadius:12,
padding:24,
boxShadow:"0 4px 12px rgba(0,0,0,0.05)",
marginBottom:30
},

title:{
marginBottom:20,
fontSize:16,
fontWeight:600
}

}