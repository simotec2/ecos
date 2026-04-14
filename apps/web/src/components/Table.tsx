export default function Table({ columns, data }:{ columns:string[], data:any[] }){

  const th = {
    textAlign:"left" as const,
    padding:12,
    borderBottom:"1px solid #e5e7eb",
    fontWeight:600
  }

  const td = {
    padding:12,
    borderBottom:"1px solid #e5e7eb"
  }

  return(

    <div style={{overflowX:"auto"}}>

      <table
        style={{
          width:"100%",
          borderCollapse:"collapse",
          background:"#fff"
        }}
      >

        <thead>

          <tr>

            {columns.map((c,i)=>(
              <th key={i} style={th}>
                {c}
              </th>
            ))}

          </tr>

        </thead>

        <tbody>

          {data.map((row,i)=>(

            <tr key={i}>

              {Object.values(row).map((v:any,j)=>(
                <td key={j} style={td}>
                  {v}
                </td>
              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}