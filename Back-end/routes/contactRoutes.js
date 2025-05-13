const express = require('express');
const router = express.Router();
const { submitContact, getMessages } = require('../controllers/contactController');

// Debug logging for requests
router.use((req, res, next) => {
    console.log(`Contact route accessed: ${req.method} ${req.url}`);
    next();
});

router.post('/submit', submitContact);
router.get('/messages', getMessages);

module.exports = router;
