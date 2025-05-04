const fetch = require('node-fetch');
const AdmZip = require('adm-zip');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function downloadRepo(repoUrl) {
    if (!repoUrl || !repoUrl.startsWith('https://github.com/')) {
        throw new Error('Valid GitHub repo URL required (e.g., https://github.com/owner/repo).');
    }

    const cleanRepoUrl = repoUrl.replace(/\.git$/, '');
    const zipUrlMain = `${cleanRepoUrl}/archive/main.zip`;
    const zipUrlMaster = `${cleanRepoUrl}/archive/master.zip`;

    let response = await fetch(zipUrlMain);
    if (!response.ok) {
        response = await fetch(zipUrlMaster);
    }

    if (!response.ok) {
        throw new Error(
            `Failed to download repo: ${zipUrlMain} and ${zipUrlMaster} are both unavailable`
        );
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'verifier-'));
    const zipPath = path.join(tempDir, 'repo.zip');
    const buffer = await response.buffer();
    await fs.writeFile(zipPath, buffer);

    const zip = new AdmZip(zipPath);
    const maxRepoSize = 50 * 1024 * 1024; // 50 MB
    let totalSize = 0;
    const entries = zip.getEntries();
    const index = entries.map(entry => ({
        path: entry.entryName,
        extension: path.extname(entry.entryName),
        size: entry.header.size
    }));

    // Filter Files
    const includedFolders = ['/src', '/lib', '/app', '/docs', '/tests', '/examples'];
    const excludedFolders = ['/node_modules', '/dist', '/build', '/vendor', '/public', '/assets'];
    const includedExts = ['.js', '.ts', '.py', '.java', '.md', '.txt', '.json', '.yaml', '.yml', '.html', '.css'];
    const excludedExts = ['.exe', '.png', '.jpg', '.gif', '.pdf', '.zip', '.tar', '.gz', '.bin', '.o', '.a'];
    const maxFileSize = 1 * 1024 * 1024; // 1 MB

    const filteredFiles = index.filter(entry => {
        const isRootFile = !entry.path.includes('/');
        return (
            (isRootFile || includedFolders.some(folder => entry.path.includes(folder))) &&
            !excludedFolders.some(folder => entry.path.includes(folder)) &&
            includedExts.includes(entry.extension) &&
            !excludedExts.includes(entry.extension) &&
            entry.size <= maxFileSize &&
            (totalSize += entry.size) <= maxRepoSize
        );
    });

    zip.extractAllTo(tempDir, true);
    return { tempDir, filteredFiles };
}

module.exports = downloadRepo;