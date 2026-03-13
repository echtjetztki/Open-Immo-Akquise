const { Client } = require('pg');

async function testConnection() {
    // URL aus deinem Screenshot
    const connectionString = 'postgresql://postgres:CqM8KBng1Dm7uwmn@db.bhetbfebpbaeuzgffxzx.supabase.co:5432/postgres';
    
    console.log('Teste Verbindung zu:', 'db.bhetbfebpbaeuzgffxzx.supabase.co');
    
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Verbindung erfolgreich!');
        const res = await client.query('SELECT current_database();');
        console.log('Datenbank:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Fehler-Details:');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        if (err.message.includes('getaddrinfo ENOTFOUND')) {
            console.error('HINWEIS: Die Adresse existiert nicht im Internet. Prüfe die Project ID bei Supabase!');
        }
    }
}

testConnection();
