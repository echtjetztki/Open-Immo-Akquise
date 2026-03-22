const { Client } = require('pg');

async function testConnection() {
    const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error('Fehler: Bitte SUPABASE_DATABASE_URL oder SUPABASE_DB_URL als Umgebungsvariable setzen.');
        process.exitCode = 1;
        return;
    }

    let host = '<unbekannt>';
    try {
        host = new URL(connectionString).hostname || host;
    } catch (_error) {
        // Ignore malformed URLs here; the pg client will report the real error.
    }

    console.log('Teste Verbindung zu:', host);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Verbindung erfolgreich.');
        const res = await client.query('SELECT current_database();');
        console.log('Datenbank:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Fehler-Details:');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        if (err.message && err.message.includes('getaddrinfo ENOTFOUND')) {
            console.error('Hinweis: Die Adresse existiert nicht im Internet. Pruefe die Project ID bei Supabase.');
        }
        process.exitCode = 1;
    }
}

testConnection();
