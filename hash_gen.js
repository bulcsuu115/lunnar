const bcrypt = require('bcryptjs');
bcrypt.hash('levi123', 10, (err, hash) => {
    if (err) console.error(err);
    console.log('HASH:', hash);
});
