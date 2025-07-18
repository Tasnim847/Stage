// routes/email.js
import express from 'express';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/send', async (req, res) => {
    const { to, subject, text, html } = req.body;

    const result = await sendEmail({ to, subject, text, html });

    if (result.error) {
        return res.status(500).json(result);
    }
    res.status(200).json({ message: "Email envoyé avec succès !" });
});

export default router;