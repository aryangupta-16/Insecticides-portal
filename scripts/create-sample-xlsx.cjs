const ExcelJS = require('../backend/node_modules/exceljs');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'samples', 'monthly-data-sample.csv');
const xlsxPath = path.join(root, 'samples', 'monthly-data-sample.xlsx');

const csv = fs.readFileSync(csvPath, 'utf8').trim();
const rows = csv.split(/\r?\n/).map((line) => line.split(','));

async function main() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Monthly Data');

  rows.forEach((row, index) => {
    const added = worksheet.addRow(row);
    if (index === 0) {
      added.font = { bold: true };
    }
  });

  worksheet.columns = [
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 22 },
    { width: 14 },
    { width: 18 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 32 },
    { width: 32 },
  ];

  await workbook.xlsx.writeFile(xlsxPath);
  console.log(`Created ${xlsxPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
