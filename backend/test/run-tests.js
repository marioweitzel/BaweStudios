(async ()=>{
  try{
    const res1 = await fetch('http://localhost:3000/api/hello');
    const j1 = await res1.json();
    if(j1.message !== 'Hola desde backend') throw new Error('Unexpected /api/hello response: '+JSON.stringify(j1));
    const res2 = await fetch('http://localhost:3000/health');
    const j2 = await res2.json();
    if(j2.status !== 'ok') throw new Error('Unexpected /health response: '+JSON.stringify(j2));
    console.log('ALL_TESTS_PASSED');
    process.exit(0);
  }catch(e){
    console.error('TEST_FAILED', e);
    process.exit(2);
  }
})();
