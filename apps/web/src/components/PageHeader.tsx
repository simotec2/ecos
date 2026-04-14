export default function PageHeader({title}:{title:string}){

  return(

    <div style={{marginBottom:30}}>

      <h1
        style={{
          fontSize:34,
          fontWeight:700
        }}
      >
        {title}
      </h1>

    </div>

  )

}