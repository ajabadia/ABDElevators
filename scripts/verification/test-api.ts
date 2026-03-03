async function testApi() {
    try {
        const response = await fetch('http://localhost:3000/api/intelligence/causal-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                finding: "Corrosión detectada en cables de tracción",
                context: "Inspección técnica de mantenimiento preventivo"
            })
        });

        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testApi();
