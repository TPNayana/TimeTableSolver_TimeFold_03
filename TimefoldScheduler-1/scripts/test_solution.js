const jobId = process.argv[2];
if (!jobId) {
  console.error('Usage: node scripts/test_solution.js <jobId>');
  process.exit(1);
}

async function main(){
  const url = `http://127.0.0.1:5001/api/solution?jobId=${encodeURIComponent(jobId)}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : String(e));
  }
}

main();