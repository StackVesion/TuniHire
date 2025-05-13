const getPasswordResetTemplate = (resetUrl, firstName) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #007bff;
        color: white;
        padding: 15px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        color: #333;
      }
      .button {
        display: inline-block;
        background-color: #007bff;
        color: white !important;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        margin-top: 20px;
        margin-bottom: 20px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        padding: 15px;
        font-size: 12px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Réinitialisation de mot de passe</h2>
      </div>
      <div class="content">
        <h3>Bonjour ${firstName},</h3>
        <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte TuniHire.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
        <p>Pour réinitialiser votre mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        </div>
        <p>Ou copiez et collez ce lien dans votre navigateur :</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
        <p>Si vous rencontrez des problèmes, contactez notre équipe de support à support@tunihire.com</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 TuniHire. Tous droits réservés.</p>
        <p>Ce message a été envoyé à ${firstName} concernant votre compte TuniHire.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = { getPasswordResetTemplate }; 