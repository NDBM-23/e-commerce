import bcrypt from 'bcryptjs';
const passwordPlana = 'Admin1234';
const saltRounds = 10;
const hash = await bcrypt.hash(passwordPlana, saltRounds);
console.log("Hash generado:", hash);