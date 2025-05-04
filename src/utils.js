const fs = require('fs').promises;

async function cleanup(tempDir) {
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
        console.warn(`Failed to clean up ${tempDir}: ${err.message}`);
    }
}

module.exports = { cleanup };