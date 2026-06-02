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

    if (parts[0] === 'en' || parts[0] === 'de' || parts[0] === 'fr' || parts[0] === 'zh') {
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
    if (relativePath.indexOf('fr/') === 0) return 'fr';
    if (relativePath.indexOf('zh/') === 0) return 'zh';
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
      '.topbar .qartia-language-switcher{border-left:1px solid rgba(255,255,255,.28);gap:4px;margin-left:4px;padding-left:12px}',
      '.topbar .qartia-language-switcher a{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.35);color:#fff!important;padding:6px 7px}',
      '.topbar .qartia-language-switcher a:hover,.topbar .qartia-language-switcher a:focus{background:rgba(255,255,255,.16);border-color:#72d8c8;color:#72d8c8!important}',
      '.topbar .qartia-language-switcher a.is-active{background:#fff;border-color:#fff;color:#144e9c!important}',
      '@media (max-width: 900px){.qartia-language-switcher{margin-left:0}.topbar .qartia-language-switcher{border-left:0;margin-left:0;padding-left:0}.site-header .header-inner{align-items:flex-start}}'
    ].join('');

    document.head.appendChild(style);
  }

  function render() {
    if (document.querySelector('.qartia-language-switcher')) return;

    var header = document.querySelector('.topbar .topbar-inner') || document.querySelector('.l-subheader.at_top .l-subheader-h') || document.querySelector('.site-header .header-inner') || document.querySelector('.header .header-inner') || document.querySelector('header') || document.body;
    var route = getBaseAndPath();
    var activeLanguage = currentLanguage(route.relative);
    var labels = [
      ['es', 'ES'],
      ['en', 'EN'],
      ['de', 'DE'],
      ['fr', 'FR'],
      ['zh', 'ZH']
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
