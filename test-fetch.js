async function run() {
    try {
        const res1 = await fetch('http://localhost:3000/api/swagger/spec');
        const text1 = await res1.text();
        console.log("SWAGGER RESPONSE:", text1);
    } catch (e) { console.error(e); }

    try {
        const res2 = await fetch('http://localhost:3000/api/admin/global-stats');
        const text2 = await res2.text();
        console.log("GLOBAL STATS RESPONSE:", text2);
    } catch (e) { console.error(e); }
}
run();
