export default function PageContainer({ title, children }: any){

return(

<div style={styles.page}>

<h1 style={styles.title}>
{title}
</h1>

{children}

</div>

)

}

const styles:any={

page:{
width:"100%",
maxWidth:"1400px",
margin:"0 auto",
paddingTop:10
},

title:{
marginBottom:20,
fontSize:24,
fontWeight:600
}

}