const crypto = require('crypto');
const { Pool } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;
if (!dbUrl) { console.error('Keine DB URL'); process.exit(1); }

const salt = crypto.randomBytes(16).toString('hex');
const derived = crypto.scryptSync('TestTest', salt, 64).toString('hex');
const hash = 'scrypt$' + salt + '$' + derived;

console.log('Passwort-Hash erstellt fuer User "test" / "TestTest"');

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        // Prüfe ob username-Constraint existiert
        const checkResult = await pool.query(
            "SELECT id, username, role FROM users WHERE username = 'test'"
        );
        
        if (checkResult.rows.length > 0) {
            // User existiert, update
            await pool.query(
                "UPDATE users SET password_hash = $1, display_name = 'Test', role = 'user' WHERE username = 'test'",
                [hash]
            );
            console.log('User "test" aktualisiert (Rolle: user, nur Ansicht)');
        } else {
            // User anlegen
            await pool.query(
                "INSERT INTO users (username, display_name, role, password_hash) VALUES ('test', 'Test', 'user', $1)",
                [hash]
            );
            console.log('User "test" angelegt (Rolle: user, nur Ansicht)');
        }
        
        // Verifizierung
        const verify = await pool.query("SELECT id, username, display_name, role FROM users WHERE username = 'test'");
        console.log('Ergebnis:', verify.rows[0]);
    } catch (err) {
        console.error('Fehler:', err.message);
    } finally {
        await pool.end();
    }
}

run();
