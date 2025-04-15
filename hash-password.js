const bcrypt = require('bcrypt');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default number of salt rounds
const saltRounds = 10;

// Prompt for password
rl.question('Enter password to hash: ', (password) => {
  // Hash the password
  bcrypt.hash(password, saltRounds)
    .then(hash => {
      console.log('\nHashed password:');
      console.log(hash);
      
      // Verify the password matches the hash
      return bcrypt.compare(password, hash).then(result => {
        console.log(`\nVerification: ${result ? 'Password matches hash' : 'Password does not match hash'}`);
        return hash;
      });
    })
    .catch(err => {
      console.error('Error hashing password:', err);
    })
    .finally(() => {
      rl.close();
    });
}); 