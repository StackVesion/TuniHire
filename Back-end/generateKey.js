const { v4: uuidv4 } = require('uuid');

const generateKey = () => {
    return uuidv4();
};

console.log(generateKey());
