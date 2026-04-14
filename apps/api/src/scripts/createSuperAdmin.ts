import prisma from "../db";
import bcrypt from "bcrypt";

async function main() {

 const rut = "12222412-0";
 const password = "admin123";

 const hash = await bcrypt.hash(password, 10);

 const existing = await prisma.user.findUnique({
  where: { rut }
 });

 if (existing) {
  console.log("SUPERADMIN ya existe");
  return;
 }

 await prisma.user.create({
  data: {
   rut,
   name: "SUPERADMIN",
   password: hash,
   role: "SUPERADMIN"
  }
 });

 console.log("SUPERADMIN creado correctamente");

}

main();