/**
 * i18n-loader.js
 * 用于加载本地化语言文件的工具函数
 */

// 支持的语言列表（仅在此维护；新增语言时，只需在 /locales 下添加同名 json 并把代码加到这里，然后更新index.html即可）
const SUPPORTED_LANGUAGES = [
  'en',     // 英语
  'zh-CN',  // 简体中文
  'zh-TW',  // 繁体中文
  'ja',     // 日语
  'fr',     // 法语 
  'ru',     // 俄语
  'es',     // 西班牙语
  'ar',     // 阿拉伯语
  'ko'      // 韩语
];

// 语言代码显示（用于 UI 上的语言缩写徽标）
const LANGUAGE_CODES = {
  'zh-CN': '中',
  'zh-TW': '繁',
  'en': 'En',
  'ja': '日',
  'fr': 'Fr',
  'ru': 'Ru',
  'es': 'Es',
  'ar': 'ع',
  'ko': '한'
};

/**
 * 判断是否为受支持语言
 */
function isSupportedLanguage(lang) {
  return SUPPORTED_LANGUAGES.includes(lang);
}

/**
 * 将浏览器语言标准化为受支持的语言代码，不支持时回落到 en
 */
function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || 'en';

  if (browserLang.startsWith('zh')) {
    return browserLang.includes('TW') || browserLang.includes('HK') ? 'zh-TW' : 'zh-CN';
  }

  // e.g. fr-CA -> fr, es-419 -> es
  for (const lang of SUPPORTED_LANGUAGES) {
    if (browserLang.toLowerCase().startsWith(lang.toLowerCase())) {
      return lang;
    }
  }

  // 默认返回英语
  return 'en';
}

/**
 * 选择最佳语言：优先使用传入 / 存储 / 浏览器语言；若不支持，一律使用 en
 */
async function getBestLanguage(preferred) {
  try {
    // 优先使用入参
    let lang = preferred || null;

    // 其次使用已存储设置
    if (!lang && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      const res = await chrome.storage.sync.get(['currentLanguage']);
      lang = res && res.currentLanguage ? res.currentLanguage : null;
    }

    // 再次使用浏览器检测
    if (!lang) lang = detectBrowserLanguage();

    // 若不支持则强制回落到 en
    if (!isSupportedLanguage(lang)) lang = 'en';
    return lang;
  } catch (_) {
    return 'en';
  }
}

/**
 * 加载指定语言的翻译文件（路径适配扩展环境）
 */
async function loadLanguageFile(lang) {
  try {
    const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
      ? chrome.runtime.getURL(`locales/${lang}.json`)
      : `/locales/${lang}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`无法加载语言文件: ${lang}，使用英语作为备用`);
      if (lang !== 'en') {
        return loadLanguageFile('en');
      }
      return {};
    }
    return await response.json();
  } catch (error) {
    console.error(`加载语言文件时出错: ${lang}`, error);
    return {};
  }
}

/**
 * 初始化 i18n：返回当前语言、英文回退以及便捷 t 函数
 */
async function initI18n(preferred) {
  const lang = await getBestLanguage(preferred);
  const translations = await loadLanguageFile(lang);
  const fallback = lang === 'en' ? translations : await loadLanguageFile('en');

  const t = (key, fb = null) => {
    // 优先当前语言，其次英文回退
    const val = (translations && translations[key]) || (fallback && fallback[key]);
    return val || fb || key;
  };

  return { lang, translations, fallback, t };
}

/**
 * 加载所有支持的语言文件
 */
async function loadAllLanguages() {
  const translations = {};
  for (const lang of SUPPORTED_LANGUAGES) {
    translations[lang] = await loadLanguageFile(lang);
  }
  return translations;
}

export {
  SUPPORTED_LANGUAGES,
  LANGUAGE_CODES,
  isSupportedLanguage,
  detectBrowserLanguage,
  getBestLanguage,
  loadLanguageFile,
  loadAllLanguages,
  initI18n
};
