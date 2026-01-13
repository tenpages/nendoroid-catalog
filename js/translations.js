// Translation Module
const Translations = (function() {
    'use strict';

    // Available languages
    const LANGUAGES = {
        en: { name: 'English', nativeName: 'English', file: 'en' },
        zh: { name: 'Chinese (Simplified)', nativeName: '简体中文', file: 'zh' },
        zh_TW: { name: 'Chinese (Traditional)', nativeName: '繁體中文', file: 'zh_TW' },
        ja: { name: 'Japanese', nativeName: '日本語', file: 'ja' }
    };

    let currentLang = 'en';
    let translations = {};
    let inventoryTranslations = {};

    // Load all translation files
    async function loadTranslations(lang) {
        try {
            // Load UI translations
            const uiResponse = await fetch(`locales/${lang}.json`);
            if (uiResponse.ok) {
                translations = await uiResponse.json();
            }

            // Load inventory translations (same file, different structure)
            const invResponse = await fetch(`data/inventory-${lang}.json`);
            if (invResponse.ok) {
                inventoryTranslations = await invResponse.json();
            }

            currentLang = lang;
            return true;
        } catch (error) {
            console.error(`Error loading translations for ${lang}:`, error);
            return false;
        }
    }

    // Get translated UI string
    function t(key, params = {}) {
        let text = translations[key] || key;

        // Replace parameters
        if (params && typeof params === 'object') {
            for (const [placeholder, value] of Object.entries(params)) {
                text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
            }
        }

        return text;
    }

    // Get translated inventory data
    function tInventory(nendoroid, field) {
        // Check if we have translations for this nendoroid
        const nendoroidId = nendoroid.id;
        
        if (inventoryTranslations[nendoroidId] && inventoryTranslations[nendoroidId][field]) {
            return inventoryTranslations[nendoroidId][field];
        }
        
        // Fall back to original
        return nendoroid[field] || '';
    }

    // Get translated fandom name by looking up any nendoroid with that fandom
    // Requires nendoroids array to be passed for matching
    function getTranslatedFandom(fandomName, nendoroidsArray) {
        if (!nendoroidsArray || nendoroidsArray.length === 0) {
            return fandomName; // Fallback
        }
        
        // Find a nendoroid with this fandom
        const nendoroid = nendoroidsArray.find(n => n.fandom === fandomName);
        if (nendoroid) {
            // Look up translation for this nendoroid
            if (inventoryTranslations[nendoroid.id] && inventoryTranslations[nendoroid.id].fandom) {
                return inventoryTranslations[nendoroid.id].fandom;
            }
        }
        
        return fandomName; // Fallback to original
    }

    // Get all translations for a nendoroid
    function getTranslatedNendoroid(nendoroid) {
        const translated = { ...nendoroid };
        const nendoroidId = nendoroid.id;

        if (inventoryTranslations[nendoroidId]) {
            const invTrans = inventoryTranslations[nendoroidId];
            
            // Translate text fields
            if (invTrans.name) translated.name = invTrans.name;
            if (invTrans.series) translated.series = invTrans.series;
            if (invTrans.fandom) translated.fandom = invTrans.fandom;
            if (invTrans.description) translated.description = invTrans.description;
            
            // Translate parts
            if (invTrans.parts && Array.isArray(invTrans.parts)) {
                translated.parts = invTrans.parts;
            }
        }

        return translated;
    }

    // Get current language
    function getCurrentLang() {
        return currentLang;
    }

    // Set language
    async function setLanguage(lang) {
        if (!LANGUAGES[lang]) {
            console.warn(`Language ${lang} not supported, falling back to English`);
            lang = 'en';
        }

        await loadTranslations(lang);
        saveLanguagePreference(lang);
        
        // Apply translations to DOM
        applyTranslations();
        
        // Dispatch event for other components to react
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    // Save language preference
    function saveLanguagePreference(lang) {
        localStorage.setItem('preferredLanguage', lang);
    }

    // Load language preference
    function loadLanguagePreference() {
        const saved = localStorage.getItem('preferredLanguage');
        if (saved && LANGUAGES[saved]) {
            return saved;
        }
        
        // Try browser language
        const browserLang = navigator.language.split('-')[0];
        if (LANGUAGES[browserLang]) {
            return browserLang;
        }
        
        return 'en';
    }

    // Get available languages
    function getAvailableLanguages() {
        return LANGUAGES;
    }

    // Apply translations to HTML elements with data-i18n attribute
    function applyTranslations() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translated = t(key);
            // Always update, translation might be same as key for fallback
            if (element.tagName === 'TITLE') {
                document.title = translated;
            } else {
                element.textContent = translated;
            }
        });

        // Update elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translated = t(key);
            element.setAttribute('placeholder', translated);
        });

        // Update option elements with data-i18n attribute
        document.querySelectorAll('option[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translated = t(key);
            element.textContent = translated;
        });
    }

    // Initialize translations
    async function init() {
        const lang = loadLanguagePreference();
        await setLanguage(lang);
    }

    return {
        init,
        t,
        tInventory,
        getTranslatedNendoroid,
        getCurrentLang,
        setLanguage,
        getAvailableLanguages,
        loadTranslations,
        applyTranslations,
        getTranslatedFandom
    };
})();
