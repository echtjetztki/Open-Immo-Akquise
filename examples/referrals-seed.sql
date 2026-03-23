-- Beispiel-Daten fuer Empfehlungsmodul
-- Optional: Vorhandene Demo-Eintraege entfernen
-- DELETE FROM public.referrals;

INSERT INTO public.referrals (
    client_name,
    client_address,
    client_phone,
    recommender_name,
    recommender_email,
    commission_pct,
    status,
    notes,
    agent_id
) VALUES
(
    'Max Mustermann',
    'Musterstrasse 10, 1010 Wien',
    '+43 660 1234567',
    'Anna Beispiel',
    'anna@example.com',
    10,
    'Neu',
    'Eigentumswohnung, Verkauf in den naechsten 2 Monaten',
    2
),
(
    'Julia Berger',
    'Hauptplatz 3, 5020 Salzburg',
    '+43 664 9876543',
    'Thomas Leitner',
    'thomas@example.com',
    5,
    'Kontaktiert',
    'Einfamilienhaus, Erstgespraech erfolgt',
    3
),
(
    'Peter Hofer',
    'Seegasse 7, 6020 Innsbruck',
    '+43 676 5566778',
    'Maria Klein',
    'maria@example.com',
    15,
    'Qualifiziert',
    'Gewerbeobjekt, Unterlagen bereits vorhanden',
    NULL
);
