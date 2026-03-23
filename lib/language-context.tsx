'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'de' | 'en' | 'bg';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
    // Footer
    'footer.demo_version': { de: 'Demo Version', en: 'Demo Version', bg: 'Демо версия' },
    'footer.example_data': { de: 'Nur Beispieldaten', en: 'Example data only', bg: 'Само примерни данни' },
    'footer.partner_of': { de: 'Partner der', en: 'Partner of', bg: 'Партньор на' },
    'footer.legal_notices': { de: 'Rechtliche Hinweise', en: 'Legal Notices', bg: 'Правна информация' },
    'footer.cookie_settings': { de: 'Cookie-Einstellungen', en: 'Cookie Settings', bg: 'Настройки за бисквитки' },
    'footer.disconnect_app': { de: 'App Trennen', en: 'Disconnect App', bg: 'Изключи приложението' },
    'footer.disconnect_confirm': {
        de: 'Möchten Sie die Verbindung zu diesem Dashboard trennen? Die App kehrt zum Setup-Bildschirm zurück.',
        en: 'Do you want to disconnect from this dashboard? The app will return to the setup screen.',
        bg: 'Искате ли да прекъснете връзката с таблото? Приложението ще се върне към екрана за настройка.',
    },
    'footer.disconnect_title': {
        de: 'Dashboard Verbindung trennen',
        en: 'Disconnect Dashboard',
        bg: 'Прекъсване на връзката с таблото',
    },

    // Privacy Modal
    'privacy.title': { de: 'Datenschutzerklärung', en: 'Privacy Policy', bg: 'Политика за поверителност' },
    'privacy.text': {
        de: 'Bei {project} handelt es sich um ein Open-Source-Projekt. Sämtliche Rechtstexte (Datenschutz, Impressum, AGB) müssen vom jeweiligen Betreiber individuell erstellt werden.',
        en: '{project} is an open-source project. All legal texts (privacy policy, imprint, terms) must be created individually by the respective operator.',
        bg: '{project} е проект с отворен код. Всички правни текстове (политика за поверителност, импресум, общи условия) трябва да бъдат създадени индивидуално от съответния оператор.',
    },
    'privacy.recommendation': {
        de: 'Wir empfehlen für die Erstellung rechtssicherer Texte die:',
        en: 'For legally compliant texts, we recommend:',
        bg: 'За правно съответстващи текстове препоръчваме:',
    },

    // Imprint Modal
    'imprint.title': { de: 'Impressum', en: 'Imprint', bg: 'Импресум' },
    'imprint.text': {
        de: 'Dieses Dashboard ist ein Open-Source-Projekt. Der Betreiber ist verpflichtet, ein eigenes Impressum gemäß den gesetzlichen Anforderungen zu erstellen.',
        en: 'This dashboard is an open-source project. The operator is required to create their own imprint in accordance with legal requirements.',
        bg: 'Това табло е проект с отворен код. Операторът е длъжен да създаде собствен импресум в съответствие със законовите изисквания.',
    },
    'imprint.recommendation': {
        de: 'Für rechtssichere Texte und Abmahnschutz empfehlen wir:',
        en: 'For legally compliant texts and protection against warnings, we recommend:',
        bg: 'За правно съответстващи текстове и защита препоръчваме:',
    },

    // Terms Modal
    'terms.title': { de: 'Allgemeine Geschäftsbedingungen', en: 'Terms and Conditions', bg: 'Общи условия' },
    'terms.text': {
        de: 'Als Open-Source-Software liefert {project} keine vordefinierten AGB aus. Jeder Nutzer ist für die Erstellung und Einbindung rechtlich korrekter AGB selbst verantwortlich.',
        en: 'As open-source software, {project} does not provide predefined terms and conditions. Each user is responsible for creating and integrating legally correct terms.',
        bg: 'Като софтуер с отворен код, {project} не предоставя предварително дефинирани общи условия. Всеки потребител е отговорен за създаването и интегрирането на правно коректни условия.',
    },
    'terms.recommendation': {
        de: 'Wir empfehlen die Nutzung spezialisierter Dienste wie:',
        en: 'We recommend using specialized services such as:',
        bg: 'Препоръчваме използването на специализирани услуги като:',
    },

    // General
    'general.please_secure': {
        de: 'Bitte achte darauf, dein Dashboard gemäß den lokalen gesetzlichen Bestimmungen abzusichern.',
        en: 'Please make sure to secure your dashboard in accordance with local legal requirements.',
        bg: 'Моля, уверете се, че таблото ви е защитено в съответствие с местните законови изисквания.',
    },

    // Demo
    'demo.readonly': {
        de: 'Die öffentliche Demo ist schreibgeschützt.',
        en: 'The public demo is read-only.',
        bg: 'Публичната демо версия е само за четене.',
    },
    'demo.no_changes': {
        de: 'Demo-Modus: Keine Änderungen möglich.',
        en: 'Demo mode: No changes possible.',
        bg: 'Демо режим: Промените не са възможни.',
    },
    'demo.readonly_entry': {
        de: 'Die öffentliche Demo ist schreibgeschützt. Neue Immobilien können hier nur in selbst gehosteten Installationen angelegt werden.',
        en: 'The public demo is read-only. New properties can only be created in self-hosted installations.',
        bg: 'Публичната демо версия е само за четене. Нови имоти могат да бъдат създадени само в самостоятелно хоствани инсталации.',
    },
    'demo.password_disabled': {
        de: 'Demo-Modus: Passwortänderungen sind deaktiviert.',
        en: 'Demo mode: Password changes are disabled.',
        bg: 'Демо режим: Промяната на паролата е деактивирана.',
    },

    // CRM
    'crm.open': { de: 'Öffnen', en: 'Open', bg: 'Отвори' },
    'crm.open_link': { de: 'Link öffnen', en: 'Open link', bg: 'Отвори линк' },
    'crm.open_paylink': { de: 'PayLink öffnen', en: 'Open PayLink', bg: 'Отвори PayLink' },
    'crm.copy': { de: 'Kopieren', en: 'Copy', bg: 'Копирай' },
    'crm.link_copied': { de: 'Link kopiert!', en: 'Link copied!', bg: 'Линкът е копиран!' },
    'crm.paylink_copied': { de: 'PayLink kopiert!', en: 'PayLink copied!', bg: 'PayLink е копиран!' },
    'crm.select_please': { de: '-- Bitte wählen --', en: '-- Please select --', bg: '-- Моля, изберете --' },
    'crm.iban_label': { de: 'IBAN (für Vorkasse)', en: 'IBAN (for prepayment)', bg: 'IBAN (за авансово плащане)' },

    // Agent Login
    'agent.select_supervisor': { de: 'Betreuer auswählen', en: 'Select supervisor', bg: 'Изберете ръководител' },
    'agent.select_supervisor_prompt': { de: 'Betreuer auswählen...', en: 'Select supervisor...', bg: 'Изберете ръководител...' },
    'agent.select_and_password': {
        de: 'Betreuer auswählen und Passwort eingeben',
        en: 'Select supervisor and enter password',
        bg: 'Изберете ръководител и въведете парола',
    },
    'agent.select_valid': {
        de: 'Bitte einen gültigen Betreuer auswählen',
        en: 'Please select a valid supervisor',
        bg: 'Моля, изберете валиден ръководител',
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('de');

    useEffect(() => {
        const saved = localStorage.getItem('app_language') as Language;
        if (saved && (saved === 'de' || saved === 'en' || saved === 'bg')) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app_language', lang);
    };

    const t = (key: string) => {
        const entry = translations[key];
        if (!entry) return key;
        return entry[language] || entry['de'] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
