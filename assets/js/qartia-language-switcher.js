(function () {
  'use strict';

  function getBaseAndPath() {
    var path = window.location.pathname;
    var marker = '/web_Qartia/';
    var markerIndex = path.indexOf(marker);
    var base = markerIndex >= 0 ? path.slice(0, markerIndex + marker.length) : '/';
    var relative = markerIndex >= 0 ? path.slice(markerIndex + marker.length) : path.replace(/^\/+/, '');

    return {
      base: base,
      relative: relative || 'index.html'
    };
  }

  function makeUrl(base, language, relativePath) {
    var cleanPath = relativePath.replace(/^\/+/, '');
    var parts = cleanPath.split('/');

    if (parts[0] === 'en' || parts[0] === 'de') {
      parts.shift();
    }

    cleanPath = parts.join('/') || 'index.html';

    if (language === 'es') {
      return base + cleanPath;
    }

    return base + language + '/' + cleanPath;
  }

  function currentLanguage(relativePath) {
    if (relativePath.indexOf('en/') === 0) return 'en';
    if (relativePath.indexOf('de/') === 0) return 'de';
    return 'es';
  }

  function addStyles() {
    if (document.getElementById('qartia-language-switcher-css')) return;

    var style = document.createElement('style');
    style.id = 'qartia-language-switcher-css';
    style.textContent = [
      '.qartia-language-switcher{align-items:center;display:flex;gap:6px;margin-left:14px;white-space:nowrap}',
      '.qartia-language-switcher a{border:1px solid rgba(42,80,150,.18);border-radius:6px;color:#244f98;font-size:12px;font-weight:800;line-height:1;padding:7px 8px;text-decoration:none;text-transform:uppercase}',
      '.qartia-language-switcher a.is-active{background:#244f98;color:#fff}',
      '@media (max-width: 900px){.qartia-language-switcher{margin-left:0;margin-top:10px}.site-header .header-inner{align-items:flex-start}}'
    ].join('');

    document.head.appendChild(style);
  }

  function render() {
    if (document.querySelector('.qartia-language-switcher')) return;

    var header = document.querySelector('.site-header .header-inner') || document.querySelector('header') || document.body;
    var route = getBaseAndPath();
    var activeLanguage = currentLanguage(route.relative);
    var labels = [
      ['es', 'ES'],
      ['en', 'EN'],
      ['de', 'DE']
    ];
    var nav = document.createElement('nav');
    nav.className = 'qartia-language-switcher';
    nav.setAttribute('aria-label', 'Selector de idioma');

    labels.forEach(function (item) {
      var language = item[0];
      var label = item[1];
      var link = document.createElement('a');
      link.href = makeUrl(route.base, language, route.relative);
      link.textContent = label;
      if (language === activeLanguage) link.className = 'is-active';
      nav.appendChild(link);
    });

    header.appendChild(nav);
  }

  addStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
