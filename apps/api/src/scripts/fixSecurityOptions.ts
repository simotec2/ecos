/// <reference types="node" />

async function main(){

  try{

    console.log(
      "Script deshabilitado"
    )

    process.exit(0)

  }catch(err){

    console.error(err)

    process.exit(1)

  }

}

main()