export const validateImageUrl = (req, res, next) => {
    if (req.file) {
        const host = req.get('host').replace(/^https?:\/\//, '');
        const url = `${req.protocol}://${host}/uploads/${req.file.filename}`;
        const urlPattern = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;

        if (!urlPattern.test(url)) {
            console.error('URL invalide:', url);
            return res.status(400).json({
                message: 'URL invalide générée',
                generatedUrl: url,
                details: 'Le format doit être http(s)://domain/path'
            });
        }

        // Ajoute l'URL validée à la requête pour utilisation ultérieure
        req.validatedImageUrl = url;
    }
    next();
};