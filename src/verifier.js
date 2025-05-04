#!/usr/bin/env node

const { Command } = require('commander');
const fetch = require('node-fetch');
const AdmZip = require('adm-zip');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const program = new Command();

program
  .name('verifier')
  .description('CLI to verify product claims against a GitHub repository')
  .command('analyze')
  .description('Analyze claims against a GitHub repo')
  .option('--claims <claims>', 'Comma-separated claims or path to claims file')
  .option('--repo <url>', 'GitHub repository URL')
  .action(async (options) => {
    try {
      // Step 1: Parse Claims
      let claims = [];
      if (options.claims) {
        if (options.claims.includes(',')) {
          claims = options.claims.split(',').map((text, i) => ({ id: i + 1, text: text.trim() }));
        } else if (await fs.access(options.claims).then(() => true).catch(() => false)) {
          const fileContent = await fs.readFile(options.claims, 'utf-8');
          claims = fileContent.split('\n').filter(line => line.trim()).map((text, i) => ({ id: i + 1, text: text.trim() }));
        } else {
          throw new Error('Invalid claims input. Provide a comma-separated string or a file path.');
        }
      } else {
        throw new Error('Claims are required.');
      }
      console.log('Structured Claims:');
      console.log(`<claims>${claims.map(c => `<claim id="${c.id}">${c.text}</claim>`).join('')}</claims>`);

      // Step 2: Download and Index Repository
      if (!options.repo || !options.repo.startsWith('https://github.com/')) {
        throw new Error('Valid GitHub repo URL required (e.g., https://github.com/owner/repo).');
      }
      const repoUrl = options.repo.replace(/\.git$/, '');
      const zipUrl = `${repoUrl}/archive/main.zip`;
      const response = await fetch(zipUrl);
      if (!response.ok) throw new Error(`Failed to download repo: ${response.statusText}`);

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

      console.log('Filtered Files:');
      console.log(filteredFiles.map(f => f.path).join('\n'));

      // Step 3: Read Filtered Files
      zip.extractAllTo(tempDir, true);
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

      // Step 4: Mock LLM Analysis
      const report = claims.map(claim => ({
        claim: claim.text,
        status: 'Ambiguous', // Mock status
        evidence: `Mock evidence for ${claim.text}`,
        explanation: `This is a mock analysis. Replace with xAI Grok API call (see https://x.ai/api).`
      }));

      // Step 5: Output Report
      console.log('Verification Report:');
      console.log(JSON.stringify(report, null, 2));
      await fs.writeFile('report.json', JSON.stringify(report, null, 2));
      console.log('Report saved to report.json');

      // Cleanup
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();