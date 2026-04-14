import prisma from "../db";
import bcrypt from "bcryptjs";

async function run() {

  const rut = "12222412-0";
  const password = "123456";

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { rut },
    data: {
      password: hash
    }
  });

  console.log("PASSWORD ACTUALIZADO");
  console.log("RUT:", rut);
  console.log("HASH:", hash);

}

run()
  .catch(console.error)
  .finally(() => process.exit());