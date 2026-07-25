(function () {
  'use strict';

  var routeMeta = {
    coaching: ['COACH DECISION', 'Koçluk', 'Hazırlık, risk ve sonraki seans kararı'],
    program: ['TRAINING PLAN', 'Program', 'Haftalık plan ve gelişim stratejisi'],
    weekly: ['WEEKLY REVIEW', 'Haftalık', 'Yedi günlük yük ve performans özeti'],
    monthly: ['MONTHLY REVIEW', 'Aylık', 'Aylık gelişim ve antrenman dengesi'],
    data: ['SIMURG CLOUD', 'Veri Merkezi', 'Hesap, senkronizasyon ve veri yönetimi']
  };
  var mobileQuery = window.matchMedia('(max-width: 900px)');
  var queued = false;

  function decorateMenu() {
    var sheet = document.getElementById('simurgV8Sheet');
    if (!sheet || !mobileQuery.matches) return;
    sheet.classList.add('simurgMenuPremiumV1');
    var head = sheet.querySelector('.simurgV8SheetHead');
    if (head && !head.querySelector('.menuPremiumEyebrow')) {
      var title = head.querySelector('div');
      title.insertAdjacentHTML('afterbegin', '<small class="menuPremiumEyebrow">SIMURG OS</small>');
    }
    var routes = ['coaching', 'program', 'weekly', 'monthly', 'data'];
    sheet.querySelectorAll('.simurgV8Grid button').forEach(function (button, index) {
      button.dataset.premiumRoute = routes[index] || '';
      var small = button.querySelector('small');
      if (small) small.setAttribute('aria-hidden', 'false');
    });
  }

  function decorateRoute(id) {
    var section = document.getElementById(id);
    if (!section) return;
    section.classList.toggle('simurgMenuRoutePremiumV1', mobileQuery.matches);
    section.dataset.premiumAccent = id;
    if (!mobileQuery.matches) return;
    var meta = routeMeta[id];
    var topbar = section.querySelector(':scope > .topbar');
    if (topbar) {
      topbar.classList.add('premiumMenuRouteHeader');
      var heading = topbar.querySelector('h1');
      if (heading) heading.textContent = meta[1];
      var sub = topbar.querySelector('.sub');
      if (sub) sub.textContent = meta[2];
      if (!topbar.querySelector('.premiumMenuRouteEyebrow')) {
        var eyebrow = document.createElement('small');
        eyebrow.className = 'premiumMenuRouteEyebrow';
        eyebrow.textContent = meta[0];
        var target = heading && heading.parentElement ? heading.parentElement : topbar;
        target.insertBefore(eyebrow, heading || target.firstChild);
      }
    }
    section.querySelectorAll('.card, .weeklyPremiumCard, .programIntelCard, .monthlyReviewCard, .panel').forEach(function (card) {
      card.classList.add('premiumMenuDataCard');
    });
  }

  function refresh() {
    queued = false;
    decorateMenu();
    Object.keys(routeMeta).forEach(decorateRoute);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(refresh);
  }

  function start() {
    refresh();
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    mobileQuery.addEventListener ? mobileQuery.addEventListener('change', refresh) : mobileQuery.addListener(refresh);
    window.addEventListener('resize', schedule, { passive: true });
  }

  window.SimurgMenuPremium = {
    refresh: refresh,
    decorateMenu: decorateMenu,
    decorateRoute: decorateRoute
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', start, { once: true })
    : start();
})();
