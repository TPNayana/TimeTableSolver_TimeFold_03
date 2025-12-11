// Simple uploader to test /api/upload-csv against port 5000
const fs = require('fs');
const path = require('path');

async function main() {
  const filePath = path.resolve(__dirname, '../assets/minimal_timetable.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error('Sample XLSX not found at', filePath);
    process.exit(1);
  }
  const data = await fs.promises.readFile(filePath);
  const formData = new FormData();
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  formData.append('file', blob, path.basename(filePath));

  const url = 'http://127.0.0.1:5000/api/upload-csv';
  console.log('POST', url, '->', path.basename(filePath));
  const res = await fetch(url, { method: 'POST', body: formData });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}

main().catch((e) => { console.error(e); process.exit(1); });
