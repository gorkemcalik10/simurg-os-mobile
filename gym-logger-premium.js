(function () {
  'use strict';

  var mobileQuery = window.matchMedia('(max-width: 900px)');
  var queued = false;

  function setHeader(section, eyebrow, title, subtitle) {
    var topbar = section && section.querySelector(':scope > .topbar');
    if (!topbar) return;
    topbar.classList.add('premiumRouteHeader');
    var titleNode = topbar.querySelector('.title');
    if (!titleNode) return;
    var heading = titleNode.querySelector('h1');
    var sub = titleNode.querySelector('.sub');
    var icon = titleNode.querySelector('.titleIcon');
    if (icon) icon.setAttribute('aria-hidden', 'true');
    if (heading) heading.textContent = title;
    if (sub) sub.textContent = subtitle;
    if (!titleNode.querySelector('.premiumRouteEyebrow')) {
      var label = document.createElement('small');
      label.className = 'premiumRouteEyebrow';
      label.textContent = eyebrow;
      titleNode.querySelector('div:last-child').insertBefore(label, heading);
    }
  }

  function refreshGym() {
    var section = document.getElementById('gym');
    if (!section) return;
    section.classList.toggle('simurgGymPremiumV1', mobileQuery.matches);
    if (!mobileQuery.matches) return;
    setHeader(section, 'SIMURG TRAINING', 'Gym', 'Hızlı set girişi ve güvenli antrenman kaydı');
    section.querySelectorAll('.gymCard').forEach(function (card, index) {
      card.classList.add('premiumGymExercise');
      card.style.setProperty('--exercise-index', index);
    });
    section.querySelectorAll('.gymMiniBtn').forEach(function (button) {
      button.classList.toggle('isDanger', button.dataset.gymAction === 'delete');
    });
  }

  function refreshLogger() {
    var section = document.getElementById('workout');
    if (!section) return;
    section.classList.toggle('simurgLoggerPremiumV1', mobileQuery.matches);
    if (!mobileQuery.matches) return;
    setHeader(section, 'SIMURG JOURNAL', 'Günlük', 'Seçili günün antrenman kaydı ve hacim özeti');
    section.querySelectorAll('#workoutGroups > div, .exercise, .panel').forEach(function (node) {
      node.classList.add('premiumLoggerSurface');
    });
    var trend = document.getElementById('trendBars');
    if (trend) {
      trend.setAttribute('aria-label', 'Hacim trendi');
      trend.dataset.interaction = 'disabled-mobile';
    }
  }

  function refresh() {
    queued = false;
    refreshGym();
    refreshLogger();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(refresh);
  }

  function start() {
    refresh();
    var roots = [document.getElementById('gym'), document.getElementById('workout')].filter(Boolean);
    roots.forEach(function (root) {
      new MutationObserver(schedule).observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    });
    mobileQuery.addEventListener ? mobileQuery.addEventListener('change', refresh) : mobileQuery.addListener(refresh);
    window.addEventListener('resize', schedule, { passive: true });
  }

  window.SimurgGymLoggerPremium = {
    refresh: refresh,
    refreshGym: refreshGym,
    refreshLogger: refreshLogger
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', start, { once: true })
    : start();
})();
