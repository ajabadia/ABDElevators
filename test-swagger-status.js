async function run() {
    try {
        const res = await fetch('http://localhost:3000/api/swagger/spec');
        console.log("STATUS:", res.status);
        const text = await res.text();
        console.log("BODY length:", text.length);
        if (res.status !== 200) {
            console.log("ERROR BODY:", text);
        }
    } catch (e) { console.error(e); }
}
run();
