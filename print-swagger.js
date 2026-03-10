fetch('http://localhost:3000/api/swagger/spec').then(r => r.json()).then(j => console.log("SWAGGER ERROR MSG:", j.message)).catch(console.error);
