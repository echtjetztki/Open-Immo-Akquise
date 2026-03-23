'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'de' | 'en' | 'bg';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
    // ============ NAVIGATION / SIDEBAR ============
    'nav.team_dashboard': { de: 'Team-Dashboard', en: 'Team Dashboard', bg: 'Табло на екипа' },
    'nav.crm_invoices': { de: 'CRM & Rechnungen', en: 'CRM & Invoices', bg: 'CRM и фактури' },
    'nav.user_management': { de: 'Benutzer-Verwaltung', en: 'User Management', bg: 'Управление на потребители' },
    'nav.settings': { de: 'Einstellungen', en: 'Settings', bg: 'Настройки' },
    'nav.ai_chat': { de: 'KI Chat', en: 'AI Chat', bg: 'AI Чат' },
    'nav.statistics': { de: 'Statistik', en: 'Statistics', bg: 'Статистика' },
    'nav.entry': { de: 'Eingabe', en: 'New Entry', bg: 'Нов запис' },
    'nav.my_dashboard': { de: 'Mein Dashboard', en: 'My Dashboard', bg: 'Моето табло' },
    'nav.profile_password': { de: 'Profil & Passwort', en: 'Profile & Password', bg: 'Профил и парола' },
    'nav.logout': { de: 'Abmelden', en: 'Log out', bg: 'Изход' },
    'nav.logged_in_as': { de: 'Angemeldet als', en: 'Logged in as', bg: 'Влезли като' },
    'nav.immo_dashboard': { de: 'Immo Dashboard', en: 'Real Estate Dashboard', bg: 'Табло за имоти' },
    'nav.toggle_menu': { de: 'Menü umschalten', en: 'Toggle menu', bg: 'Превключи менюто' },

    // ============ COOKIE CONSENT ============
    'cookie.title': { de: 'Cookie-Einstellungen', en: 'Cookie Settings', bg: 'Настройки за бисквитки' },
    'cookie.description': {
        de: 'Wir verwenden Cookies und Google Analytics, um die Nutzung unserer Webseite zu analysieren und unser Angebot zu verbessern. Ihre Daten werden gemäß der DSGVO verarbeitet.',
        en: 'We use cookies and Google Analytics to analyze the usage of our website and improve our services. Your data is processed in accordance with the GDPR.',
        bg: 'Използваме бисквитки и Google Analytics, за да анализираме използването на уебсайта и да подобрим услугите си. Данните ви се обработват в съответствие с GDPR.',
    },
    'cookie.necessary': { de: 'Notwendige Cookies', en: 'Necessary Cookies', bg: 'Необходими бисквитки' },
    'cookie.necessary_desc': {
        de: 'Erforderlich für den Betrieb der Webseite (z.B. Login-Session). Diese können nicht deaktiviert werden.',
        en: 'Required for the operation of the website (e.g., login session). These cannot be disabled.',
        bg: 'Необходими за работата на уебсайта (напр. сесия за вход). Те не могат да бъдат деактивирани.',
    },
    'cookie.analytics': { de: 'Analyse-Cookies', en: 'Analytics Cookies', bg: 'Аналитични бисквитки' },
    'cookie.analytics_desc': {
        de: 'erfasst anonymisierte Nutzungsdaten wie Seitenaufrufe und Verweildauer, um das Dashboard zu verbessern.',
        en: 'collects anonymized usage data such as page views and time spent to improve the dashboard.',
        bg: 'събира анонимизирани данни за използването, като прегледи на страници и прекарано време, за подобряване на таблото.',
    },
    'cookie.legal_basis': {
        de: 'Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Sie können Ihre Einwilligung jederzeit widerrufen.',
        en: 'Legal basis: Art. 6 (1) (a) GDPR (consent). You may withdraw your consent at any time.',
        bg: 'Правно основание: чл. 6, ал. 1, буква а от GDPR (съгласие). Можете да оттеглите съгласието си по всяко време.',
    },
    'cookie.accept_all': { de: 'Alle akzeptieren', en: 'Accept all', bg: 'Приеми всички' },
    'cookie.necessary_only': { de: 'Nur notwendige', en: 'Necessary only', bg: 'Само необходимите' },
    'cookie.show_details': { de: 'Details anzeigen', en: 'Show details', bg: 'Покажи детайли' },
    'cookie.hide_details': { de: 'Details ausblenden', en: 'Hide details', bg: 'Скрий детайли' },

    // ============ IOS INSTALL PROMPT ============
    'ios.install_app': { de: 'App installieren', en: 'Install App', bg: 'Инсталирай приложението' },
    'ios.install_desc': {
        de: 'Installieren Sie dieses Dashboard als App für den schnellen Zugriff und ein besseres Erlebnis.',
        en: 'Install this dashboard as an app for quick access and a better experience.',
        bg: 'Инсталирайте това табло като приложение за бърз достъп и по-добро изживяване.',
    },
    'ios.step1': {
        de: 'Tippe unten in der Leiste auf das',
        en: 'Tap the',
        bg: 'Натиснете',
    },
    'ios.share_icon': { de: 'Teilen-Symbol', en: 'Share icon', bg: 'иконата за споделяне' },
    'ios.step1_suffix': { de: '', en: 'at the bottom of the bar', bg: 'в долната лента' },
    'ios.step2': {
        de: 'Wähle "Zum Home-Bildschirm" aus der Liste',
        en: 'Select "Add to Home Screen" from the list',
        bg: 'Изберете „Добави към началния екран" от списъка',
    },

    // ============ FOOTER ============
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
    'footer.disconnect_title': { de: 'Dashboard Verbindung trennen', en: 'Disconnect Dashboard', bg: 'Прекъсване на връзката с таблото' },

    // ============ PRIVACY / LEGAL MODALS ============
    'privacy.title': { de: 'Datenschutzerklärung', en: 'Privacy Policy', bg: 'Политика за поверителност' },
    'privacy.text': {
        de: 'Bei {project} handelt es sich um ein Open-Source-Projekt. Sämtliche Rechtstexte (Datenschutz, Impressum, AGB) müssen vom jeweiligen Betreiber individuell erstellt werden.',
        en: '{project} is an open-source project. All legal texts (privacy policy, imprint, terms) must be created individually by the respective operator.',
        bg: '{project} е проект с отворен код. Всички правни текстове (политика за поверителност, импресум, общи условия) трябва да бъдат създадени индивидуално от съответния оператор.',
    },
    'privacy.recommendation': { de: 'Wir empfehlen für die Erstellung rechtssicherer Texte die:', en: 'For legally compliant texts, we recommend:', bg: 'За правно съответстващи текстове препоръчваме:' },
    'imprint.title': { de: 'Impressum', en: 'Imprint', bg: 'Импресум' },
    'imprint.text': {
        de: 'Dieses Dashboard ist ein Open-Source-Projekt. Der Betreiber ist verpflichtet, ein eigenes Impressum gemäß den gesetzlichen Anforderungen zu erstellen.',
        en: 'This dashboard is an open-source project. The operator is required to create their own imprint in accordance with legal requirements.',
        bg: 'Това табло е проект с отворен код. Операторът е длъжен да създаде собствен импресум в съответствие със законовите изисквания.',
    },
    'imprint.recommendation': { de: 'Für rechtssichere Texte und Abmahnschutz empfehlen wir:', en: 'For legally compliant texts and protection against warnings, we recommend:', bg: 'За правно съответстващи текстове и защита препоръчваме:' },
    'terms.title': { de: 'Allgemeine Geschäftsbedingungen', en: 'Terms and Conditions', bg: 'Общи условия' },
    'terms.text': {
        de: 'Als Open-Source-Software liefert {project} keine vordefinierten AGB aus. Jeder Nutzer ist für die Erstellung und Einbindung rechtlich korrekter AGB selbst verantwortlich.',
        en: 'As open-source software, {project} does not provide predefined terms and conditions. Each user is responsible for creating and integrating legally correct terms.',
        bg: 'Като софтуер с отворен код, {project} не предоставя предварително дефинирани общи условия. Всеки потребител е отговорен за създаването и интегрирането на правно коректни условия.',
    },
    'terms.recommendation': { de: 'Wir empfehlen die Nutzung spezialisierter Dienste wie:', en: 'We recommend using specialized services such as:', bg: 'Препоръчваме използването на специализирани услуги като:' },
    'general.please_secure': {
        de: 'Bitte achte darauf, dein Dashboard gemäß den lokalen gesetzlichen Bestimmungen abzusichern.',
        en: 'Please make sure to secure your dashboard in accordance with local legal requirements.',
        bg: 'Моля, уверете се, че таблото ви е защитено в съответствие с местните законови изисквания.',
    },

    // ============ DEMO ============
    'demo.readonly': { de: 'Die öffentliche Demo ist schreibgeschützt.', en: 'The public demo is read-only.', bg: 'Публичната демо версия е само за четене.' },
    'demo.no_changes': { de: 'Demo-Modus: Keine Änderungen möglich.', en: 'Demo mode: No changes possible.', bg: 'Демо режим: Промените не са възможни.' },
    'demo.readonly_entry': {
        de: 'Die öffentliche Demo ist schreibgeschützt. Neue Immobilien können hier nur in selbst gehosteten Installationen angelegt werden.',
        en: 'The public demo is read-only. New properties can only be created in self-hosted installations.',
        bg: 'Публичната демо версия е само за четене. Нови имоти могат да бъдат създадени само в самостоятелно хоствани инсталации.',
    },
    'demo.password_disabled': { de: 'Demo-Modus: Passwortänderungen sind deaktiviert.', en: 'Demo mode: Password changes are disabled.', bg: 'Демо режим: Промяната на паролата е деактивирана.' },
    'demo.users_readonly': {
        de: 'Demo-Modus: Benutzer können angesehen, aber nicht angelegt oder gelöscht werden.',
        en: 'Demo mode: Users can be viewed but not created or deleted.',
        bg: 'Демо режим: Потребителите могат да се преглеждат, но не и да се създават или изтриват.',
    },

    // ============ PROPERTY LABELS ============
    'property.purchase_price': { de: 'Kaufpreis', en: 'Purchase Price', bg: 'Покупна цена' },
    'property.commission': { de: 'Provision', en: 'Commission', bg: 'Комисиона' },
    'property.supervised_by': { de: 'Betreut von', en: 'Supervised by', bg: 'Отговорник' },
    'property.date': { de: 'Datum', en: 'Date', bg: 'Дата' },
    'property.status': { de: 'Status', en: 'Status', bg: 'Статус' },
    'property.notes': { de: 'Notizen', en: 'Notes', bg: 'Бележки' },
    'property.no_phone': { de: 'Keine Telefonnummer', en: 'No phone number', bg: 'Няма телефонен номер' },
    'property.report_link_copied': { de: 'Report-Link kopiert!', en: 'Report link copied!', bg: 'Линкът за доклад е копиран!' },
    'property.copy_report_link': { de: 'Report-Link kopieren', en: 'Copy report link', bg: 'Копирай линк за доклад' },
    'property.listing': { de: 'Anzeige', en: 'Listing', bg: 'Обява' },
    'property.customer_reply': { de: 'Antwort vom Kunden:', en: 'Customer reply:', bg: 'Отговор от клиента:' },
    'property.no_reply': { de: 'Keine Antwort vorhanden', en: 'No reply available', bg: 'Няма наличен отговор' },
    'property.no_notes': { de: 'Keine Notizen vorhanden', en: 'No notes available', bg: 'Няма налични бележки' },
    'property.notes_placeholder': { de: 'Notizen zur Immobilie hinzufügen...', en: 'Add notes about the property...', bg: 'Добавете бележки за имота...' },
    'property.delete_confirm': {
        de: 'Möchtest du diese Immobilie wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
        en: 'Do you really want to permanently delete this property? This action cannot be undone.',
        bg: 'Наистина ли искате да изтриете трайно този имот? Това действие не може да бъде отменено.',
    },
    'property.delete_error': { de: 'Fehler beim Löschen der Immobilie', en: 'Error deleting property', bg: 'Грешка при изтриване на имота' },
    'property.select_status': { de: 'Status auswählen', en: 'Select status', bg: 'Изберете статус' },

    // ============ COMMON ACTIONS ============
    'action.edit': { de: 'Bearbeiten', en: 'Edit', bg: 'Редактирай' },
    'action.delete': { de: 'Löschen', en: 'Delete', bg: 'Изтрий' },
    'action.save': { de: 'Speichern', en: 'Save', bg: 'Запази' },
    'action.cancel': { de: 'Abbrechen', en: 'Cancel', bg: 'Отказ' },
    'action.add': { de: 'Hinzufügen', en: 'Add', bg: 'Добави' },
    'action.close': { de: 'Schließen', en: 'Close', bg: 'Затвори' },
    'action.refresh': { de: 'Aktualisieren', en: 'Refresh', bg: 'Обнови' },
    'action.loading': { de: 'Lädt...', en: 'Loading...', bg: 'Зареждане...' },
    'action.search': { de: 'Suchen...', en: 'Search...', bg: 'Търсене...' },
    'action.filter': { de: 'Filter', en: 'Filter', bg: 'Филтър' },
    'action.copy': { de: 'Kopieren', en: 'Copy', bg: 'Копирай' },
    'action.open': { de: 'Öffnen', en: 'Open', bg: 'Отвори' },

    // ============ DASHBOARD ============
    'dashboard.loading': { de: 'Lade Dashboard...', en: 'Loading dashboard...', bg: 'Зареждане на таблото...' },
    'dashboard.user_title': { de: 'Benutzer Dashboard', en: 'User Dashboard', bg: 'Потребителско табло' },
    'dashboard.welcome': { de: 'Willkommen im Open-Akquise Dashboard', en: 'Welcome to the Open-Akquise Dashboard', bg: 'Добре дошли в Open-Akquise таблото' },
    'dashboard.new_property': { de: 'Neue Immobilie', en: 'New Property', bg: 'Нов имот' },
    'dashboard.total_properties': { de: 'Gesamt Immobilien', en: 'Total Properties', bg: 'Общо имоти' },
    'dashboard.total_commission': { de: 'Gesamt Provision', en: 'Total Commission', bg: 'Обща комисиона' },
    'dashboard.total_earned': { de: 'Gesamt Verdient (10%)', en: 'Total Earned (10%)', bg: 'Общо спечелено (10%)' },
    'dashboard.sold': { de: 'Verkauft', en: 'Sold', bg: 'Продадено' },
    'dashboard.status_overview': { de: 'Status Übersicht', en: 'Status Overview', bg: 'Преглед на статуса' },
    'dashboard.all_properties': { de: 'Alle Immobilien', en: 'All Properties', bg: 'Всички имоти' },
    'dashboard.properties_desc': { de: 'Sie können Status ändern und Notizen bearbeiten', en: 'You can change status and edit notes', bg: 'Можете да променяте статуса и да редактирате бележки' },
    'dashboard.entry': { de: 'Eintrag', en: 'Entry', bg: 'Запис' },
    'dashboard.entries': { de: 'Einträge', en: 'Entries', bg: 'Записи' },
    'dashboard.overview': { de: 'Übersicht aller Immobilien', en: 'Overview of all properties', bg: 'Преглед на всички имоти' },

    // ============ ENTRY PAGE ============
    'entry.title': { de: 'Neue Immobilie Eingeben', en: 'Add New Property', bg: 'Добави нов имот' },
    'entry.description': { de: 'Erstellen Sie ein neues Immobilienangebot mit automatischer Provisions-Berechnung', en: 'Create a new property listing with automatic commission calculation', bg: 'Създайте нова обява за имот с автоматично изчисляване на комисионата' },
    'entry.hints': { de: 'Hinweise', en: 'Notes', bg: 'Бележки' },
    'entry.hint_source_id': { de: 'Die external_source ID wird automatisch aus dem Link extrahiert', en: 'The external_source ID is automatically extracted from the link', bg: 'Идентификаторът external_source се извлича автоматично от линка' },
    'entry.hint_commission': { de: 'Die Berechnung zeigt automatisch 10% der Gesamtprovision', en: 'The calculation automatically shows 10% of the total commission', bg: 'Изчислението автоматично показва 10% от общата комисиона' },
    'entry.hint_date': { de: 'Das Tagesdatum wird automatisch auf heute gesetzt', en: 'The date is automatically set to today', bg: 'Датата се задава автоматично на днешната дата' },
    'entry.redirect_hint': { de: 'Nach dem Speichern werden Sie zum Dashboard weitergeleitet', en: 'After saving you will be redirected to the dashboard', bg: 'След запазване ще бъдете пренасочени към таблото' },

    // ============ LOGIN ============
    'login.loading': { de: 'Lade Login...', en: 'Loading login...', bg: 'Зареждане на вход...' },
    'login.wrong_credentials': { de: 'Falsche Zugangsdaten', en: 'Wrong credentials', bg: 'Грешни данни за достъп' },
    'login.error_occurred': { de: 'Ein Fehler ist aufgetreten', en: 'An error occurred', bg: 'Възникна грешка' },
    'login.network_error': { de: 'Netzwerkfehler', en: 'Network error', bg: 'Мрежова грешка' },
    'login.password': { de: 'Passwort', en: 'Password', bg: 'Парола' },
    'login.admin_prompt': { de: 'Teamleiter/Admin: Passwort eingeben', en: 'Team Leader/Admin: Enter password', bg: 'Тиймлидер/Админ: Въведете парола' },
    'login.submit': { de: 'JETZT ANMELDEN', en: 'LOG IN NOW', bg: 'ВХОД' },
    'login.agent_login': { de: 'Betreuer Login', en: 'Agent Login', bg: 'Вход за агент' },
    'login.checking': { de: 'Prüfe Verbindung...', en: 'Checking connection...', bg: 'Проверка на връзката...' },
    'login.system_status': { de: 'System-Status', en: 'System Status', bg: 'Системен статус' },
    'login.db_online': { de: 'Datenbank Online', en: 'Database Online', bg: 'Базата данни е онлайн' },
    'login.db_error': { de: 'Verbindungsfehler', en: 'Connection error', bg: 'Грешка при свързване' },
    'login.free_start': { de: 'Kostenlos starten', en: 'Start for free', bg: 'Започнете безплатно' },
    'login.choose_entry': { de: 'Wähle deinen Einstieg...', en: 'Choose your entry...', bg: 'Изберете начин на вход...' },
    'login.request_license': { de: 'Basis Lizenz anfordern (kostenlos)', en: 'Request basic license (free)', bg: 'Заявете основен лиценз (безплатно)' },
    'login.request_demo': { de: 'Demo Daten anfordern (kostenlos)', en: 'Request demo data (free)', bg: 'Заявете демо данни (безплатно)' },
    'login.enter_code': { de: 'Bereits Code erhalten? Hier eingeben', en: 'Already received a code? Enter it here', bg: 'Вече получихте код? Въведете го тук' },
    'login.code_placeholder': { de: 'Basis-Code eingeben', en: 'Enter basic code', bg: 'Въведете основен код' },
    'login.checking_code': { de: 'Prüfe Code...', en: 'Checking code...', bg: 'Проверка на кода...' },
    'login.activate_code': { de: 'Code aktivieren', en: 'Activate code', bg: 'Активирай кода' },
    'login.invalid_code': { de: 'Ungültiger Basis-Code.', en: 'Invalid basic code.', bg: 'Невалиден основен код.' },

    // ============ SETTINGS ============
    'settings.title': { de: 'Einstellungen', en: 'Settings', bg: 'Настройки' },
    'settings.description': { de: 'System-Verwaltung und Datenbank-Diagnose', en: 'System management and database diagnostics', bg: 'Системно управление и диагностика на базата данни' },
    'settings.db_connection': { de: 'Datenbank-Verbindung', en: 'Database Connection', bg: 'Връзка с базата данни' },
    'settings.db_test_desc': { de: 'Teste die Verbindung und zeige detaillierte Diagnose-Informationen', en: 'Test the connection and show detailed diagnostic information', bg: 'Тествайте връзката и покажете подробна диагностична информация' },
    'settings.testing': { de: 'Teste Verbindung...', en: 'Testing connection...', bg: 'Тестване на връзката...' },
    'settings.test_db': { de: 'DB-Verbindung prüfen', en: 'Check DB connection', bg: 'Провери връзката с БД' },
    'settings.connected': { de: 'Verbindung erfolgreich!', en: 'Connection successful!', bg: 'Успешна връзка!' },
    'settings.failed': { de: 'Verbindung fehlgeschlagen', en: 'Connection failed', bg: 'Неуспешна връзка' },
    'settings.diagnostic_log': { de: 'Diagnose-Log', en: 'Diagnostic Log', bg: 'Диагностичен лог' },
    'settings.system_info': { de: 'System-Information', en: 'System Information', bg: 'Системна информация' },
    'settings.saved': { de: 'Einstellungen gespeichert!', en: 'Settings saved!', bg: 'Настройките са запазени!' },
    'settings.save_error': { de: 'Fehler beim Speichern', en: 'Error saving', bg: 'Грешка при запазване' },
    'settings.demo_disabled': {
        de: 'Admin-Aktionen und Diagnosen sind in der öffentlichen Demo deaktiviert.',
        en: 'Admin actions and diagnostics are disabled in the public demo.',
        bg: 'Администраторските действия и диагностиката са деактивирани в публичната демо версия.',
    },
    'settings.supabase_guide': { de: 'Supabase Setup-Guide:', en: 'Supabase Setup Guide:', bg: 'Ръководство за настройка на Supabase:' },
    'settings.supabase_guide_text_de': {
        de: 'Stellen Sie sicher, dass im <strong class="text-foreground">Vercel Dashboard</strong> unter <em class="italic">Project Settings &gt; Environment Variables</em> die Variable <code class="bg-primary/10 text-primary px-1 rounded mx-1">SUPABASE_DATABASE_URL</code> mit dem Connection-Pooling-Port (6543) von Supabase hinterlegt ist. Für die Frontend-Aktionen werden zudem <code class="bg-primary/10 text-primary px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_URL</code> und <code class="bg-primary/10 text-primary px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> benötigt.',
        en: 'Make sure that <code class="bg-primary/10 text-primary px-1 rounded mx-1">SUPABASE_DATABASE_URL</code> with the Supabase connection pooling port (6543) is configured in the <strong class="text-foreground">Vercel Dashboard</strong> under <em class="italic">Project Settings &gt; Environment Variables</em>. For frontend actions, <code class="bg-primary/10 text-primary px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_URL</code> and <code class="bg-primary/10 text-primary px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are also required.',
        bg: 'Уверете се, че <code class="bg-primary/10 text-primary px-1 rounded mx-1">SUPABASE_DATABASE_URL</code> с порта за пулиране на връзки (6543) на Supabase е конфигуриран в <strong class="text-foreground">Vercel Dashboard</strong> под <em class="italic">Project Settings &gt; Environment Variables</em>. За действия от фронтенда са необходими също <code class="bg-primary/10 text-primary px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_URL</code> и <code class="bg-primary/10 text-primary px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.',
    },
    'settings.n8n_activation': { de: 'n8n Premium Aktivierung', en: 'n8n Premium Activation', bg: 'n8n Премиум активиране' },
    'settings.n8n_activation_desc': {
        de: 'Geben Sie Ihren Lizenzschlüssel ein, um die erweiterten Automatisierungs-Funktionen freizuschalten.',
        en: 'Enter your license key to unlock the advanced automation features.',
        bg: 'Въведете лицензния си ключ, за да отключите разширените функции за автоматизация.',
    },
    'settings.n8n_features_title': { de: 'Funktion & Lösung', en: 'Features & Solutions', bg: 'Функции и решения' },
    'settings.n8n_feature_1': {
        de: 'Automatischer Import neuer Objekte aus n8n-Workflows (Webhook/API).',
        en: 'Automatic import of new objects from n8n workflows (Webhook/API).',
        bg: 'Автоматичен импорт на нови обекти от n8n работни потоци (Webhook/API).',
    },
    'settings.n8n_feature_2': {
        de: 'Sicherer Datenaustausch mit geschütztem Endpunkt und App-Key.',
        en: 'Secure data exchange with protected endpoint and app key.',
        bg: 'Сигурен обмен на данни със защитена крайна точка и ключ за приложението.',
    },
    'settings.n8n_feature_3': {
        de: 'Sync-Tools für schnelleren Abgleich mit weniger manuellen Schritten.',
        en: 'Sync tools for faster synchronization with fewer manual steps.',
        bg: 'Инструменти за синхронизация за по-бърз обмен с по-малко ръчни стъпки.',
    },
    'settings.n8n_benefit': {
        de: 'Nutzen: kürzere Reaktionszeiten, weniger Fehler und ein reproduzierbarer Team-Prozess.',
        en: 'Benefits: shorter response times, fewer errors, and a reproducible team process.',
        bg: 'Ползи: по-кратки времена за реакция, по-малко грешки и възпроизводим екипен процес.',
    },
    'settings.n8n_learn_more': { de: 'Mehr zu n8n ansehen', en: 'Learn more about n8n', bg: 'Научете повече за n8n' },
    'settings.license_key': { de: 'Lizenzschlüssel', en: 'License Key', bg: 'Лицензен ключ' },
    'settings.checking': { de: 'Prüfe...', en: 'Checking...', bg: 'Проверка...' },
    'settings.unlock_now': { de: 'Jetzt freischalten', en: 'Unlock now', bg: 'Отключи сега' },
    'settings.no_license': { de: 'Noch keinen Lizenzschlüssel?', en: 'No license key yet?', bg: 'Все още нямате лицензен ключ?' },
    'settings.buy_premium': { de: 'Premium direkt buchen', en: 'Buy premium directly', bg: 'Купете премиум директно' },
    'settings.contact_support': { de: 'Support kontaktieren', en: 'Contact support', bg: 'Свържете се с поддръжката' },
    'settings.n8n_integration': { de: 'n8n API Integration', en: 'n8n API Integration', bg: 'n8n API интеграция' },
    'settings.n8n_integration_desc': {
        de: 'Aktiviert Webhook-Automatisierung, sicheren Datenaustausch und schnelleren Objekt-Abgleich.',
        en: 'Enables webhook automation, secure data exchange, and faster object synchronization.',
        bg: 'Активира уебхук автоматизация, сигурен обмен на данни и по-бърза синхронизация на обекти.',
    },
    'settings.n8n_code_label': { de: 'n8n Aktivierungscode (einmalig)', en: 'n8n Activation Code (one-time)', bg: 'n8n код за активиране (еднократен)' },
    'settings.n8n_code_placeholder': { de: 'Aktivierungscode eingeben', en: 'Enter activation code', bg: 'Въведете код за активиране' },
    'settings.activate': { de: 'Aktivieren', en: 'Activate', bg: 'Активирай' },
    'settings.api_endpoint': { de: 'API Endpunkt (POST / GET)', en: 'API Endpoint (POST / GET)', bg: 'API крайна точка (POST / GET)' },
    'settings.copy_endpoint': { de: 'Endpunkt kopieren', en: 'Copy endpoint', bg: 'Копирай крайна точка' },
    'settings.app_password': { de: 'App-Passwort (Header: x-api-key)', en: 'App Password (Header: x-api-key)', bg: 'Парола на приложението (Header: x-api-key)' },
    'settings.app_password_hidden': {
        de: 'Aus Sicherheitsgründen nicht im Frontend sichtbar (ENV: N8N_API_KEY)',
        en: 'Not visible in frontend for security reasons (ENV: N8N_API_KEY)',
        bg: 'Не се показва във фронтенда от съображения за сигурност (ENV: N8N_API_KEY)',
    },
    'settings.security_webhook_test': { de: 'Security Webhook Test', en: 'Security Webhook Test', bg: 'Тест на уебхук за сигурност' },
    'settings.not_configured': { de: 'Nicht konfiguriert', en: 'Not configured', bg: 'Не е конфигурирано' },
    'settings.webhook_env_missing': {
        de: 'Mindestens eine Webhook-URL ist nicht gesetzt. Buttons bleiben deaktiviert, bis die ENV-Variablen vorhanden sind.',
        en: 'At least one webhook URL is not set. Buttons remain disabled until the ENV variables are present.',
        bg: 'Поне един уебхук URL не е зададен. Бутоните остават деактивирани, докато ENV променливите не бъдат налични.',
    },
    'settings.send_test_webhook': { de: 'Test-Webhook senden', en: 'Send test webhook', bg: 'Изпрати тестов уебхук' },
    'settings.test_live_once': { de: 'Live einmal testen', en: 'Test live once', bg: 'Тествай на живо веднъж' },
    'settings.sync_listings': { de: 'Anzeigen-Abgleich (Sync)', en: 'Listing Sync', bg: 'Синхронизация на обяви' },
    'settings.test_external_db': { de: 'Externe DB testen', en: 'Test external DB', bg: 'Тествай външна БД' },
    'settings.premium_active': { de: 'Premium-Funktionen sind aktiv', en: 'Premium features are active', bg: 'Премиум функциите са активни' },
    'settings.version': { de: 'Version', en: 'Version', bg: 'Версия' },
    'settings.framework': { de: 'Framework', en: 'Framework', bg: 'Фреймуърк' },
    'settings.n8n_activated': { de: 'n8n API Integration ist aktiviert.', en: 'n8n API integration is activated.', bg: 'n8n API интеграцията е активирана.' },
    'settings.n8n_code_required': { de: 'n8n Aktivierungscode erforderlich.', en: 'n8n activation code required.', bg: 'Необходим е n8n код за активиране.' },
    'settings.n8n_status_error': {
        de: 'n8n Aktivierungsstatus konnte nicht geladen werden.',
        en: 'Could not load n8n activation status.',
        bg: 'Статусът на активиране на n8n не можа да бъде зареден.',
    },
    'settings.enter_code_please': { de: 'Bitte Aktivierungscode eingeben.', en: 'Please enter activation code.', bg: 'Моля, въведете код за активиране.' },
    'settings.n8n_activated_success': {
        de: 'n8n API Integration wurde erfolgreich aktiviert.',
        en: 'n8n API integration has been successfully activated.',
        bg: 'n8n API интеграцията беше успешно активирана.',
    },
    'settings.invalid_code': { de: 'Ungültiger Aktivierungscode.', en: 'Invalid activation code.', bg: 'Невалиден код за активиране.' },
    'settings.network_error_activation': { de: 'Netzwerkfehler bei der Aktivierung.', en: 'Network error during activation.', bg: 'Мрежова грешка при активиране.' },
    'settings.unknown_error': { de: 'Unbekannter Fehler', en: 'Unknown error', bg: 'Неизвестна грешка' },
    'settings.webhook_test_url_missing': {
        de: 'Webhook-Test URL ist nicht gesetzt (SECURITY_WEBHOOK_TEST_URL).',
        en: 'Webhook test URL is not set (SECURITY_WEBHOOK_TEST_URL).',
        bg: 'URL за тест на уебхук не е зададен (SECURITY_WEBHOOK_TEST_URL).',
    },
    'settings.webhook_live_url_missing': {
        de: 'Live Webhook URL ist nicht gesetzt (SECURITY_WEBHOOK_URL).',
        en: 'Live webhook URL is not set (SECURITY_WEBHOOK_URL).',
        bg: 'URL на уебхук на живо не е зададен (SECURITY_WEBHOOK_URL).',
    },
    'settings.invalid_response': {
        de: 'Ungültige Server-Antwort (kein JSON)',
        en: 'Invalid server response (not JSON)',
        bg: 'Невалиден отговор от сървъра (не е JSON)',
    },
    'settings.network_error_prefix': { de: 'Netzwerkfehler: ', en: 'Network error: ', bg: 'Мрежова грешка: ' },
    'settings.connection_error_prefix': { de: 'Verbindungsfehler: ', en: 'Connection error: ', bg: 'Грешка при свързване: ' },
    'settings.network_step': { de: 'Netzwerk', en: 'Network', bg: 'Мрежа' },

    // ============ PROFILE ============
    'profile.title': { de: 'Mein Profil', en: 'My Profile', bg: 'Моят профил' },
    'profile.manage': { de: 'Verwalte deine Kontoeinstellungen und Sicherheit', en: 'Manage your account settings and security', bg: 'Управлявайте настройките и сигурността на акаунта си' },
    'profile.username': { de: 'Benutzername', en: 'Username', bg: 'Потребителско име' },
    'profile.change_password': { de: 'Passwort ändern', en: 'Change Password', bg: 'Промяна на паролата' },
    'profile.current_password': { de: 'Aktuelles Passwort', en: 'Current Password', bg: 'Текуща парола' },
    'profile.new_password': { de: 'Neues Passwort', en: 'New Password', bg: 'Нова парола' },
    'profile.confirm_password': { de: 'Neues Passwort bestätigen', en: 'Confirm New Password', bg: 'Потвърдете новата парола' },
    'profile.passwords_mismatch': { de: 'Die neuen Passwörter stimmen nicht überein', en: 'New passwords do not match', bg: 'Новите пароли не съвпадат' },
    'profile.password_min': { de: 'Das neue Passwort muss mindestens 6 Zeichen lang sein', en: 'The new password must be at least 6 characters long', bg: 'Новата парола трябва да е поне 6 символа' },
    'profile.password_changed': { de: 'Passwort wurde erfolgreich geändert', en: 'Password changed successfully', bg: 'Паролата е променена успешно' },
    'profile.password_error': { de: 'Fehler beim Ändern des Passworts', en: 'Error changing password', bg: 'Грешка при промяна на паролата' },
    'profile.placeholder_current_password': { de: 'Altes Passwort eingeben', en: 'Enter current password', bg: 'Въведете текущата парола' },
    'profile.placeholder_new_password': { de: 'Min. 6 Zeichen', en: 'Min. 6 characters', bg: 'Мин. 6 символа' },
    'profile.placeholder_confirm_password': { de: 'Gleiches Passwort erneut', en: 'Re-enter same password', bg: 'Въведете същата парола отново' },
    'profile.save_password': { de: 'Passwort jetzt speichern', en: 'Save password now', bg: 'Запази паролата сега' },
    'profile.password_save_note': { de: 'Bitte speichere dein neues Passwort sicher ab. Nach der Änderung wirst du nicht automatisch abgemeldet.', en: 'Please save your new password securely. You will not be automatically logged out after the change.', bg: 'Моля, запазете новата си парола на сигурно място. Няма да бъдете автоматично отписани след промяната.' },
    'profile.loading': { de: 'Lade Einstellungen...', en: 'Loading settings...', bg: 'Зареждане на настройките...' },
    'profile.administrator': { de: 'Administrator', en: 'Administrator', bg: 'Администратор' },
    'profile.agent': { de: 'Betreuer', en: 'Agent', bg: 'Агент' },
    'profile.teamlead': { de: 'Teamleiter', en: 'Team Leader', bg: 'Тиймлидер' },

    // ============ STATISTICS ============
    'stats.loading': { de: 'Lade Statistiken...', en: 'Loading statistics...', bg: 'Зареждане на статистиките...' },
    'stats.no_data': { de: 'Keine Daten verfügbar.', en: 'No data available.', bg: 'Няма налични данни.' },
    'stats.sales_stats': { de: 'Verkaufsstatistik', en: 'Sales Statistics', bg: 'Статистика на продажбите' },
    'stats.sales_overview': { de: 'Alle Verkaufszahlen auf einen Blick', en: 'All sales figures at a glance', bg: 'Всички данни за продажбите на един поглед' },
    'stats.new_entries': { de: 'Neueingaben', en: 'New Entries', bg: 'Нови записи' },
    'stats.today': { de: 'Heute', en: 'Today', bg: 'Днес' },
    'stats.this_week': { de: 'Diese Woche', en: 'This Week', bg: 'Тази седмица' },
    'stats.this_month': { de: 'Diesen Monat', en: 'This Month', bg: 'Този месец' },
    'stats.last_month': { de: 'Vormonat', en: 'Last Month', bg: 'Миналия месец' },
    'stats.monthly_entries': { de: 'Monatliche Neueingaben', en: 'Monthly New Entries', bg: 'Месечни нови записи' },
    'stats.status_distribution': { de: 'Status Verteilung', en: 'Status Distribution', bg: 'Разпределение по статус' },
    'stats.export_data': { de: 'Daten exportieren', en: 'Export Data', bg: 'Експорт на данни' },

    // ============ AI CHAT ============
    'chat.title': { de: 'KI Assistent', en: 'AI Assistant', bg: 'AI Асистент' },
    'chat.description': { de: 'Stelle Fragen, um optimale Antworten für Kunden zu generieren.', en: 'Ask questions to generate optimal responses for clients.', bg: 'Задавайте въпроси, за да генерирате оптимални отговори за клиенти.' },
    'chat.disabled': { de: 'KI-Anfragen sind in der öffentlichen Demo deaktiviert.', en: 'AI queries are disabled in the public demo.', bg: 'AI заявките са деактивирани в публичната демо версия.' },
    'chat.placeholder': { de: 'Frage stellen...', en: 'Ask a question...', bg: 'Задайте въпрос...' },
    'chat.thinking': { de: 'Die KI denkt nach...', en: 'AI is thinking...', bg: 'AI обмисля...' },
    'chat.submit': { de: 'Frage stellen', en: 'Ask question', bg: 'Задай въпрос' },
    'chat.archive': { de: 'Archiv der Fragen', en: 'Question Archive', bg: 'Архив на въпросите' },
    'chat.no_archive': { de: 'Noch keine Fragen im Archiv.', en: 'No questions in the archive yet.', bg: 'Все още няма въпроси в архива.' },

    // ============ USERS MANAGEMENT ============
    'users.title': { de: 'Benutzer-Verwaltung', en: 'User Management', bg: 'Управление на потребители' },
    'users.description': { de: 'Betreuer, Teamleiter und Admins verwalten', en: 'Manage agents, team leaders and admins', bg: 'Управление на агенти, тиймлидери и администратори' },
    'users.new_user': { de: 'Neuer Benutzer', en: 'New User', bg: 'Нов потребител' },
    'users.loading': { de: 'Lade Benutzerliste...', en: 'Loading user list...', bg: 'Зареждане на списъка с потребители...' },
    'users.load_error': { de: 'Benutzerverwaltung konnte nicht geladen werden', en: 'User management could not be loaded', bg: 'Управлението на потребители не можа да бъде заредено' },
    'users.user': { de: 'Benutzer', en: 'User', bg: 'Потребител' },
    'users.display_name': { de: 'Anzeigename', en: 'Display Name', bg: 'Показвано име' },
    'users.role': { de: 'Rolle', en: 'Role', bg: 'Роля' },
    'users.created_at': { de: 'Erstellt am', en: 'Created on', bg: 'Създаден на' },
    'users.actions': { de: 'Aktionen', en: 'Actions', bg: 'Действия' },
    'users.no_users': { de: 'Keine Benutzer gefunden.', en: 'No users found.', bg: 'Няма намерени потребители.' },
    'users.username_login': { de: 'Benutzername (Login)', en: 'Username (Login)', bg: 'Потребителско име (Вход)' },
    'users.username_placeholder': { de: 'z.B. max.mustermann', en: 'e.g. john.doe', bg: 'напр. ivan.ivanov' },
    'users.initial_password': { de: 'Initial-Passwort setzen', en: 'Set initial password', bg: 'Задайте начална парола' },
    'users.display_name_placeholder': { de: 'z.B. Max Mustermann', en: 'e.g. John Doe', bg: 'напр. Иван Иванов' },
    'users.create_now': { de: 'Benutzer jetzt anlegen', en: 'Create user now', bg: 'Създай потребител сега' },
    'users.created_success': { de: 'Benutzer erfolgreich angelegt', en: 'User created successfully', bg: 'Потребителят е създаден успешно' },
    'users.delete_confirm': { de: 'Möchten Sie den Benutzer wirklich löschen?', en: 'Do you really want to delete this user?', bg: 'Наистина ли искате да изтриете този потребител?' },

    // ============ CRM ============
    'crm.open': { de: 'Öffnen', en: 'Open', bg: 'Отвори' },
    'crm.open_link': { de: 'Link öffnen', en: 'Open link', bg: 'Отвори линк' },
    'crm.open_paylink': { de: 'PayLink öffnen', en: 'Open PayLink', bg: 'Отвори PayLink' },
    'crm.copy': { de: 'Kopieren', en: 'Copy', bg: 'Копирай' },
    'crm.link_copied': { de: 'Link kopiert!', en: 'Link copied!', bg: 'Линкът е копиран!' },
    'crm.paylink_copied': { de: 'PayLink kopiert!', en: 'PayLink copied!', bg: 'PayLink е копиран!' },
    'crm.select_please': { de: '-- Bitte wählen --', en: '-- Please select --', bg: '-- Моля, изберете --' },
    'crm.iban_label': { de: 'IBAN (für Vorkasse)', en: 'IBAN (for prepayment)', bg: 'IBAN (за авансово плащане)' },
    'crm.enter_amount': { de: 'Bitte Betrag eingeben', en: 'Please enter amount', bg: 'Моля, въведете сума' },
    'crm.description': { de: 'Angebote, Exposes und Rechnungen verwalten – mit Stripe & Vorkasse.', en: 'Manage offers, exposes, and invoices – with Stripe & bank transfer.', bg: 'Управлявайте оферти, експозета и фактури – със Stripe и банков превод.' },

    // ============ AGENT ============
    'agent.select_supervisor': { de: 'Betreuer auswählen', en: 'Select supervisor', bg: 'Изберете ръководител' },
    'agent.select_supervisor_prompt': { de: 'Betreuer auswählen...', en: 'Select supervisor...', bg: 'Изберете ръководител...' },
    'agent.select_and_password': { de: 'Betreuer auswählen und Passwort eingeben', en: 'Select supervisor and enter password', bg: 'Изберете ръководител и въведете парола' },
    'agent.select_valid': { de: 'Bitte einen gültigen Betreuer auswählen', en: 'Please select a valid supervisor', bg: 'Моля, изберете валиден ръководител' },

    // ============ PROPERTY TABLE ============
    'table.all_statuses': { de: 'Alle Status', en: 'All statuses', bg: 'Всички статуси' },
    'table.all_locations': { de: 'Alle Standorte', en: 'All locations', bg: 'Всички локации' },
    'table.all_periods': { de: 'Alle Zeiträume', en: 'All periods', bg: 'Всички периоди' },
    'table.all_agents': { de: 'Alle Betreuer', en: 'All agents', bg: 'Всички агенти' },
    'table.property': { de: 'Immobilie', en: 'Property', bg: 'Имот' },
    'table.location': { de: 'Standort', en: 'Location', bg: 'Локация' },
    'table.published': { de: 'Veröffentlicht', en: 'Published', bg: 'Публикувано' },
    'table.note_placeholder': { de: 'Notiz hinzufügen...', en: 'Add note...', bg: 'Добави бележка...' },
    'table.save_error': { de: 'Fehler beim Speichern', en: 'Error saving', bg: 'Грешка при запазване' },
    'table.delete_confirm': { de: 'Wirklich löschen?', en: 'Really delete?', bg: 'Наистина ли да се изтрие?' },
    'table.property_and_type': { de: 'Immobilie & Typ', en: 'Property & Type', bg: 'Имот & Тип' },
    'table.status_and_update': { de: 'Status & Update', en: 'Status & Update', bg: 'Статус & Актуализация' },
    'table.contact_and_price': { de: 'Kontakt & Preis', en: 'Contact & Price', bg: 'Контакт & Цена' },
    'table.agent': { de: 'Betreuer', en: 'Agent', bg: 'Агент' },
    'table.action': { de: 'Aktion', en: 'Action', bg: 'Действие' },
    'table.clear_filters': { de: 'Alle Filter zurücksetzen', en: 'Clear all filters', bg: 'Изчисти всички филтри' },
    'table.clear_search': { de: 'Suche löschen', en: 'Clear search', bg: 'Изчисти търсенето' },
    'table.of': { de: 'von', en: 'of', bg: 'от' },
    'table.no_properties': { de: 'Keine Immobilien gefunden', en: 'No properties found', bg: 'Няма намерени имоти' },
    'table.create_first': { de: 'Erstellen Sie Ihre erste Immobilie über die Eingabe-Seite', en: 'Create your first property via the input page', bg: 'Създайте първия си имот чрез страницата за въвеждане' },
    'table.filter_status': { de: 'Status filtern', en: 'Filter by status', bg: 'Филтриране по статус' },
    'table.filter_location': { de: 'Standort filtern', en: 'Filter by location', bg: 'Филтриране по локация' },
    'table.filter_period': { de: 'Veröffentlichungszeitraum filtern', en: 'Filter by publication period', bg: 'Филтриране по период на публикуване' },
    'table.filter_agent': { de: 'Betreuer filtern', en: 'Filter by agent', bg: 'Филтриране по агент' },
    'table.updating_status': { de: 'Status wird aktualisiert...', en: 'Updating status...', bg: 'Статусът се актуализира...' },
    'table.status_error': { de: 'Fehler beim Aktualisieren des Status', en: 'Error updating status', bg: 'Грешка при актуализиране на статуса' },
    'table.note_empty': { de: 'Bitte eine Notiz eingeben', en: 'Please enter a note', bg: 'Моля, въведете бележка' },
    'table.note_add_error': { de: 'Fehler beim Hinzufügen der Notiz', en: 'Error adding note', bg: 'Грешка при добавяне на бележка' },
    'table.no_phone': { de: 'kein Tel.', en: 'no phone', bg: 'няма тел.' },
    'table.id_and_type': { de: 'ID & Typ', en: 'ID & Type', bg: 'ID & Тип' },
    'table.agent_date': { de: 'Betreut von / Am', en: 'Supervised by / On', bg: 'Отговорник / На' },
    'table.external_link': { de: 'external_source Link', en: 'external_source Link', bg: 'external_source линк' },
    'table.open_link': { de: 'Link öffnen', en: 'Open link', bg: 'Отвори линк' },

    // ============ PROPERTY MODAL / FORM ============
    'property.edit_title': { de: 'Immobilie bearbeiten', en: 'Edit Property', bg: 'Редактиране на имот' },
    'property.created_at': { de: 'Erstellt', en: 'Created', bg: 'Създаден' },
    'property.close': { de: 'Schließen', en: 'Close', bg: 'Затвори' },
    'property.link_label': { de: 'Link zur Immobilie', en: 'Property Link', bg: 'Линк към имота' },
    'property.open_listing': { de: 'Anzeige öffnen', en: 'Open listing', bg: 'Отвори обявата' },
    'property.published_at': { de: 'Veröffentlicht am:', en: 'Published on:', bg: 'Публикувано на:' },
    'property.listing_title': { de: 'Titel der Anzeige', en: 'Listing Title', bg: 'Заглавие на обявата' },
    'property.listing_title_placeholder': { de: 'z.B. Schöne 3-Zimmer Wohnung', en: 'e.g. Beautiful 3-room apartment', bg: 'напр. Красив 3-стаен апартамент' },
    'property.external_id': { de: 'external_source ID', en: 'external_source ID', bg: 'external_source ID' },
    'property.seller_commission': { de: 'Abgeber Prov. (%)', en: 'Seller Commission (%)', bg: 'Комисиона продавач (%)' },
    'property.seller_commission_title': { de: 'Abgeber Provision', en: 'Seller Commission', bg: 'Комисиона продавач' },
    'property.buyer_commission': { de: 'Käufer Prov. (%)', en: 'Buyer Commission (%)', bg: 'Комисиона купувач (%)' },
    'property.buyer_commission_title': { de: 'Käufer Provision', en: 'Buyer Commission', bg: 'Комисиона купувач' },
    'property.postal_code': { de: 'PLZ', en: 'Postal Code', bg: 'Пощ. код' },
    'property.postal_code_title': { de: 'Postleitzahl', en: 'Postal code', bg: 'Пощенски код' },
    'property.city': { de: 'Ort', en: 'City', bg: 'Град' },
    'property.property_type': { de: 'Objekttyp', en: 'Property Type', bg: 'Тип имот' },
    'property.property_type_select': { de: 'Objekttyp auswählen', en: 'Select property type', bg: 'Изберете тип имот' },
    'property.type_purchase': { de: 'Kauf', en: 'Purchase', bg: 'Покупка' },
    'property.type_rent': { de: 'Miete', en: 'Rent', bg: 'Наем' },
    'property.type_land': { de: 'Grundstück', en: 'Land', bg: 'Парцел' },
    'property.type_garage': { de: 'Garage', en: 'Garage', bg: 'Гараж' },
    'property.type_commercial': { de: 'Gewerblich', en: 'Commercial', bg: 'Търговски' },
    'property.purchase_price_label': { de: 'Kaufpreis (€)', en: 'Purchase Price (€)', bg: 'Покупна цена (€)' },
    'property.purchase_price_title': { de: 'Kaufpreis in Euro', en: 'Purchase price in Euro', bg: 'Покупна цена в евро' },
    'property.status_label': { de: 'Status', en: 'Status', bg: 'Статус' },
    'property.status_change': { de: 'Status ändern', en: 'Change status', bg: 'Промяна на статус' },
    'property.managed_by': { de: 'Betreut von:', en: 'Managed by:', bg: 'Отговорник:' },
    'property.select_agent': { de: 'Betreuer auswählen', en: 'Select agent', bg: 'Изберете агент' },
    'property.email': { de: 'E-Mail', en: 'E-Mail', bg: 'Имейл' },
    'property.email_optional': { de: 'E-Mail (optional)', en: 'E-Mail (optional)', bg: 'Имейл (по избор)' },
    'property.phone': { de: 'Telefon', en: 'Phone', bg: 'Телефон' },
    'property.phone_optional': { de: 'Telefonnummer (optional)', en: 'Phone number (optional)', bg: 'Телефонен номер (по избор)' },
    'property.phone_title': { de: 'Telefonnummer', en: 'Phone number', bg: 'Телефонен номер' },
    'property.whatsapp_send': { de: 'WhatsApp Nachricht senden', en: 'Send WhatsApp message', bg: 'Изпрати WhatsApp съобщение' },
    'property.total_6': { de: 'Gesamt (6%)', en: 'Total (6%)', bg: 'Общо (6%)' },
    'property.seller_3': { de: 'Abgeber (3%)', en: 'Seller (3%)', bg: 'Продавач (3%)' },
    'property.buyer_3': { de: 'Käufer (3%)', en: 'Buyer (3%)', bg: 'Купувач (3%)' },
    'property.earnings_10': { de: 'Verdienst (10%)', en: 'Earnings (10%)', bg: 'Печалба (10%)' },
    'property.activities_reports': { de: 'Aktivitäten & Berichte (Status-Updates):', en: 'Activities & Reports (Status Updates):', bg: 'Дейности и доклади (актуализации на статуса):' },
    'property.entries_count': { de: 'Einträge', en: 'Entries', bg: 'Записи' },
    'property.no_reports': { de: 'Noch keine Berichte eingegangen', en: 'No reports received yet', bg: 'Все още няма получени доклади' },
    'property.logged_by_ip': { de: 'Protokolliert von IP:', en: 'Logged by IP:', bg: 'Записано от IP:' },
    'property.customer_interactions': { de: 'KUNDEN-Interaktionen:', en: 'Customer Interactions:', bg: 'Клиентски взаимодействия:' },
    'property.message_num': { de: 'Nachricht', en: 'Message', bg: 'Съобщение' },
    'property.no_interactions': { de: 'Keine Interaktionen', en: 'No interactions', bg: 'Няма взаимодействия' },
    'property.demo_mode_hint': { de: 'Demo-Modus: Bearbeiten und Loeschen sind deaktiviert.', en: 'Demo mode: Editing and deleting are disabled.', bg: 'Демо режим: Редактирането и изтриването са деактивирани.' },
    'property.delete_property': { de: 'Immobilie löschen', en: 'Delete property', bg: 'Изтрий имот' },
    'property.save_changes': { de: 'Änderungen speichern', en: 'Save changes', bg: 'Запази промените' },
    'property.saving': { de: 'Speichert...', en: 'Saving...', bg: 'Запазване...' },
    'property.save_error': { de: 'Fehler beim Speichern', en: 'Error saving', bg: 'Грешка при запазване' },
    'property.success_saved': { de: 'Immobilie erfolgreich gespeichert!', en: 'Property saved successfully!', bg: 'Имотът е запазен успешно!' },
    'property.auto_calculations': { de: 'Automatische Berechnungen', en: 'Automatic Calculations', bg: 'Автоматични изчисления' },
    'property.total_provision_label': { de: 'Gesamtprovision (6%)', en: 'Total Commission (6%)', bg: 'Обща комисиона (6%)' },
    'property.total_provision_desc': { de: '6% des Kaufpreises', en: '6% of purchase price', bg: '6% от покупната цена' },
    'property.our_share_label': { de: 'Unser Anteil (10%)', en: 'Our Share (10%)', bg: 'Нашият дял (10%)' },
    'property.our_share_desc': { de: '10% der Gesamtprovision', en: '10% of total commission', bg: '10% от общата комисиона' },
    'property.provision_seller_label': { de: 'Provision Abgeber (3%)', en: 'Seller Commission (3%)', bg: 'Комисиона продавач (3%)' },
    'property.provision_seller_desc': { de: '3% des Kaufpreises', en: '3% of purchase price', bg: '3% от покупната цена' },
    'property.provision_buyer_label': { de: 'Provision Käufer (3%)', en: 'Buyer Commission (3%)', bg: 'Комисиона купувач (3%)' },
    'property.provision_buyer_desc': { de: '3% des Kaufpreises', en: '3% of purchase price', bg: '3% от покупната цена' },
    'property.today_date': { de: 'Tagesdatum', en: "Today's Date", bg: 'Днешна дата' },
    'property.additional_info': { de: 'Zusätzliche Informationen...', en: 'Additional information...', bg: 'Допълнителна информация...' },
    'property.create': { de: 'Immobilie Erstellen', en: 'Create Property', bg: 'Създай имот' },
    'property.update': { de: 'Aktualisieren', en: 'Update', bg: 'Актуализирай' },
    'property.reset': { de: 'Zurücksetzen', en: 'Reset', bg: 'Нулиране' },
    'property.auto_extracted': { de: 'Wird automatisch aus Link extrahiert', en: 'Automatically extracted from link', bg: 'Автоматично извлечено от линка' },
    'property.published_date_title': { de: 'Veröffentlichungsdatum', en: 'Publication date', bg: 'Дата на публикуване' },
    'property.listing_title_placeholder_full': { de: 'z.B. Schöne 3-Zimmer Wohnung in Wien', en: 'e.g. Beautiful 3-room apartment in Vienna', bg: 'напр. Красив 3-стаен апартамент във Виена' },
    'property.save_error_full': { de: 'Fehler beim Speichern der Immobilie', en: 'Error saving property', bg: 'Грешка при запазване на имота' },
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
