const fs = require('fs').promises;
const path = require('path');

async function readFiles(tempDir, filteredFiles) {
    let codebaseText = '';
    const maxTokens = 100000; // Rough token limit
    const charsPerToken = 4; // Approximate
    let currentChars = 0;

    for (const file of filteredFiles) {
        const filePath = path.join(tempDir, file.path);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const fileText = `// File: ${file.path}\n${content}\n\n`;
            if (currentChars + fileText.length <= maxTokens * charsPerToken) {
                codebaseText += fileText;
                currentChars += fileText.length;
            } else {
                break;
            }
        } catch (err) {
            console.warn(`Skipping file ${file.path}: ${err.message}`);
        }
    }

    return codebaseText;
}

module.exports = readFiles;