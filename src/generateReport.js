const fs = require('fs').promises;

async function generateReport(report) {
    console.log('Verification Report:');
    console.log(JSON.stringify(report, null, 2));
    await fs.writeFile('report.json', JSON.stringify(report, null, 2));
    console.log('Report saved to report.json');
}

module.exports = generateReport;