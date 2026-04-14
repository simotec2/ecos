import bcrypt from "bcryptjs";

async function run() {

const password = "123456";

const hash = await bcrypt.hash(password, 10);

console.log("HASH NUEVO:");
console.log(hash);

}

run();