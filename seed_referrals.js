const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhetbfebpbaeuzgffxzx:CqM8KBng1Dm7uwmn@aws-1-eu-north-1.pooler.supabase.com:6543/postgres'
});

const examples = [
    { 
        client_name: 'Max Schmidt', 
        client_address: 'Hauptstraße 1, 1010 Wien', 
        client_phone: '+43 1 234567', 
        recommender_name: 'Anna Maier', 
        recommender_email: 'anna@example.com', 
        commission_pct: 10, 
        status: 'Neu', 
        notes: 'Interesse an Eigentumswohnung.',
        agent_id: 3
    },
    { 
        client_name: 'Sabine Weber', 
        client_address: 'Ringstraße 10, 8010 Graz', 
        client_phone: '+43 316 7890', 
        recommender_name: 'Thomas Müller', 
        recommender_email: 'thomas@muller.at', 
        commission_pct: 15, 
        status: 'Kontaktiert', 
        notes: 'Hausverkauf geplant im Frühjahr.',
        agent_id: 3
    },
    { 
        client_name: 'Karl Heinz Gruber', 
        client_address: 'Salzburg-Süd 5', 
        client_phone: '0664 111222', 
        recommender_name: 'Peter Lustig', 
        recommender_email: 'peter@lustig.de', 
        commission_pct: 5, 
        status: 'Abgelehnt', 
        notes: 'Kein wirkliches Verkaufsinteresse aktuell.',
        agent_id: 1
    },
    { 
        client_name: 'Doris Berger', 
        client_address: 'Linz Landstr 2', 
        client_phone: '0732 334455', 
        recommender_name: 'Self', 
        recommender_email: 'agent@agent.com', 
        commission_pct: 10, 
        status: 'Neu', 
        notes: 'Kundenanfrage über Telefon.',
        agent_id: 3
    }
];

async function seed() {
  const client = await pool.connect();
  try {
    // Prüfe ob schon Daten existieren - nicht überschreiben
    const { rows } = await client.query('SELECT COUNT(*) as cnt FROM public.referrals');
    const count = parseInt(rows[0].cnt);
    if (count > 0) {
      console.log(`Es existieren bereits ${count} Empfehlungen. Seed wird übersprungen.`);
      return;
    }
    for (const ex of examples) {
      await client.query(
        `INSERT INTO public.referrals (client_name, client_address, client_phone, recommender_name, recommender_email, commission_pct, status, notes, agent_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [ex.client_name, ex.client_address, ex.client_phone, ex.recommender_name, ex.recommender_email, ex.commission_pct, ex.status, ex.notes, ex.agent_id]
      );
    }
    console.log('Example referrals seeded successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => console.error(e));
