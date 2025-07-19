const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const { Currency } = require('../models');

class InternationalizationService {
  constructor() {
    this.supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar', 'hi'];
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AED', 'CAD', 'AUD'];
    this.exchangeRates = new Map();
    this.lastUpdate = null;
  }

  async initialize() {
    await i18next
      .use(Backend)
      .use(middleware.LanguageDetector)
      .init({
        fallbackLng: 'en',
        preload: this.supportedLanguages,
        ns: ['common', 'booking', 'wallet', 'admin'],
        defaultNS: 'common',
        backend: {
          loadPath: './locales/{{lng}}/{{ns}}.json',
        },
        detection: {
          order: ['header', 'querystring', 'cookie'],
          lookupHeader: 'accept-language',
          lookupQuerystring: 'lng',
          lookupCookie: 'i18next',
          caches: ['cookie'],
        },
      });
  }

  // Currency conversion and formatting
  async convertCurrency(amount, fromCurrency, toCurrency, date = new Date()) {
    if (fromCurrency === toCurrency) return amount;

    const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);
    return amount * rate;
  }

  async getExchangeRate(fromCurrency, toCurrency, date = new Date()) {
    const key = `${fromCurrency}_${toCurrency}_${date.toISOString().split('T')[0]}`;
    
    if (this.exchangeRates.has(key)) {
      return this.exchangeRates.get(key);
    }

    // Fetch from external API (e.g., Fixer.io, ExchangeRate-API)
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      const data = await response.json();
      const rate = data.rates[toCurrency];
      
      this.exchangeRates.set(key, rate);
      return rate;
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      return 1; // Fallback to 1:1 ratio
    }
  }

  formatCurrency(amount, currency, locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatDate(date, locale = 'en-US', timezone = 'UTC') {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  // Timezone handling
  getTimezoneOffset(fromTimezone, toTimezone) {
    const fromDate = new Date().toLocaleString('en-US', { timeZone: fromTimezone });
    const toDate = new Date().toLocaleString('en-US', { timeZone: toTimezone });
    return new Date(toDate) - new Date(fromDate);
  }

  // Localized content
  getLocalizedContent(key, language, namespace = 'common') {
    return i18next.t(key, { lng: language, ns: namespace });
  }

  // Country-specific regulations
  getCountryRegulations(countryCode) {
    const regulations = {
      'US': {
        requiresPassport: false,
        requiresVisa: false,
        covidRestrictions: true,
        taxRate: 0.07,
      },
      'EU': {
        requiresPassport: false,
        requiresVisa: false,
        covidRestrictions: false,
        taxRate: 0.20,
      },
      'IN': {
        requiresPassport: true,
        requiresVisa: true,
        covidRestrictions: true,
        taxRate: 0.18,
      },
      // Add more countries
    };
    
    return regulations[countryCode] || regulations['US'];
  }
}

module.exports = new InternationalizationService();