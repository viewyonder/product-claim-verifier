const fs = require('fs').promises;

async function parseClaims(claimsInput) {
    if (!claimsInput) {
        throw new Error('Claims are required.');
    }

    let claims = [];
    if (claimsInput.includes(',')) {
        claims = claimsInput.split(',').map((text, i) => ({ id: i + 1, text: text.trim() }));
    } else if (await fs.access(claimsInput).then(() => true).catch(() => false)) {
        const fileContent = await fs.readFile(claimsInput, 'utf-8');
        claims = fileContent.split('\n').filter(line => line.trim()).map((text, i) => ({ id: i + 1, text: text.trim() }));
    } else {
        throw new Error('Invalid claims input. Provide a comma-separated string or a file path.');
    }

    return claims;
}

module.exports = parseClaims;