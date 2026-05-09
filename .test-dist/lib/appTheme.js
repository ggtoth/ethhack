"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_THEMES = exports.APP_THEME_DEFAULT = exports.APP_THEME_EXPLICIT_COOKIE_KEY = exports.APP_THEME_EXPLICIT_STORAGE_KEY = exports.APP_THEME_COOKIE_KEY = exports.APP_THEME_STORAGE_KEY = void 0;
exports.isAppTheme = isAppTheme;
exports.getAppThemeInitScript = getAppThemeInitScript;
exports.APP_THEME_STORAGE_KEY = "app-theme";
exports.APP_THEME_COOKIE_KEY = "app-theme";
exports.APP_THEME_EXPLICIT_STORAGE_KEY = "app-theme-explicit";
exports.APP_THEME_EXPLICIT_COOKIE_KEY = "app-theme-explicit";
exports.APP_THEME_DEFAULT = "light";
exports.APP_THEMES = ["light", "dark"];
function isAppTheme(value) {
    return value === "light" || value === "dark";
}
function getAppThemeInitScript() {
    return `
;(function () {
  try {
    var themeKey = ${JSON.stringify(exports.APP_THEME_STORAGE_KEY)};
    var explicitKey = ${JSON.stringify(exports.APP_THEME_EXPLICIT_STORAGE_KEY)};
    var cookieThemeKey = ${JSON.stringify(exports.APP_THEME_COOKIE_KEY)};
    var cookieExplicitKey = ${JSON.stringify(exports.APP_THEME_EXPLICIT_COOKIE_KEY)};
    var defaultTheme = ${JSON.stringify(exports.APP_THEME_DEFAULT)};
    var theme = defaultTheme;
    var explicit = false;
    var cookies = document.cookie ? document.cookie.split("; ") : [];
    var cookieMap = {};

    for (var i = 0; i < cookies.length; i += 1) {
      var parts = cookies[i].split("=");
      var key = decodeURIComponent(parts.shift() || "");
      cookieMap[key] = decodeURIComponent(parts.join("=") || "");
    }

    try {
      explicit = window.localStorage.getItem(explicitKey) === "1";
      if (explicit) {
        var storedTheme = window.localStorage.getItem(themeKey);
        if (storedTheme === "light" || storedTheme === "dark") {
          theme = storedTheme;
        }
      }
    } catch (storageError) {}

    if (!explicit && cookieMap[cookieExplicitKey] === "1") {
      var cookieTheme = cookieMap[cookieThemeKey];
      if (cookieTheme === "light" || cookieTheme === "dark") {
        theme = cookieTheme;
      }
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = ${JSON.stringify(exports.APP_THEME_DEFAULT)};
    document.documentElement.style.colorScheme = ${JSON.stringify(exports.APP_THEME_DEFAULT)};
  }
})();`;
}
