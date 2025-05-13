const Contact = require('../models/Contact');

const submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        console.log('Contact form submission:', req.body);

        // Vérification des champs requis
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis'
            });
        }

        // Créer le message avec l'ID de l'utilisateur s'il est connecté
        const contactData = {
            name,
            email,
            subject,
            message,
            ...(req.user && { userId: req.user.userId })
        };

        const contact = await Contact.create(contactData);

        res.status(201).json({
            success: true,
            message: 'Message envoyé avec succès',
            data: contact
        });
    } catch (error) {
        console.error('Erreur soumission contact:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message'
        });
    }
};

const getMessages = async (req, res) => {
    try {
        const messages = await Contact.find()
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        // Formater les messages pour l'affichage
        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            name: msg.userId ? `${msg.userId.firstName} ${msg.userId.lastName}` : msg.name,
            email: msg.userId ? msg.userId.email : msg.email,
            subject: msg.subject,
            message: msg.message,
            createdAt: msg.createdAt,
            isRegisteredUser: !!msg.userId
        }));

        res.status(200).json(formattedMessages);
    } catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages'
        });
    }
};

module.exports = {
    submitContact,
    getMessages
};
