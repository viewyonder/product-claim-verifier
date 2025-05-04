#!/usr/bin/env node

const { Command } = require('commander');
const parseClaims = require('./parseClaims');
const downloadRepo = require('./downloadRepo');
const readFiles = require('./readFiles');
const analyze = require('./analyze');
const generateReport = require('./generateReport');
const { cleanup } = require('./utils');

const program = new Command();

program
    .name('verifier')
    .description('CLI to verify product claims against a GitHub repository')
    .command('analyze')
    .description('Analyze claims against a GitHub repo')
    .option('--claims <claims>', 'Comma-separated claims or path to claims file')
    .option('--repo <url>', 'GitHub repository URL')
    .action(async (options) => {
        let tempDir;
        try {
            // Step 1: Parse Claims
            const claims = await parseClaims(options.claims);
            console.log('Structured Claims:');
            console.log(`<claims>${claims.map(c => `<claim id="${c.id}">${c.text}</claim>`).join('')}</claims>`);

            // Step 2: Download and Index Repository
            const { tempDir: downloadedDir, filteredFiles } = await downloadRepo(options.repo);
            tempDir = downloadedDir;
            console.log('Filtered Files:');
            console.log(filteredFiles.map(f => f.path).join('\n'));

            // Step 3: Read Filtered Files
            const codebaseText = await readFiles(tempDir, filteredFiles);

            // Step 4: Analyze Claims
            const report = await analyze(claims, codebaseText);

            // Step 5: Generate and Save Report
            await generateReport(report);
        } catch (err) {
            console.error(`Error: ${err.message}`);
            process.exit(1);
        } finally {
            if (tempDir) {
                await cleanup(tempDir);
            }
        }
    });

program.parse();