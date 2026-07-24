const DEFAULT_TOLERANCE = 1;

export const AUDIT_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 900, height: 900 },
  { width: 901, height: 900 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1728, height: 1117 },
];

const CARD_SELECTOR = [
  '.card', '.panel', '.group', '.exerciseCard', '.gymCard', '.gymAddCard',
  '.gp-card', '.gp-ring-card', '.gp-home-content > *', '.polarCard',
  '.dlWorkspace section', '.dlActivity', '.dlGroup', '.cloudSyncCard',
  '.universalImportCard', '.polarBridgeCard', '.dataHealthCard',
].join(',');

const CONTROL_SELECTOR = 'button,input,select,textarea,.badge,[class*="Badge"],[class*="Pill"],[class*="Metric"]';
const INTENTIONAL_SCROLL_SELECTOR = [
  '.dayProgram', '.weekStrip', '.v4Tabs', '.polarWeekRow', '.polarSegment',
  '.gp-home-tabs', '.dlTabs', '.gymWeekStrip', '.historyCalendarStrip',
  '.actions', '.mobileOnlyQuick', '.table-wrap', '.scroll-x',
  '[data-horizontal-scroll]',
].join(',');
const NATIVE_TEXT_SCROLL_SELECTOR = 'input,select,textarea';

function shortText(element) {
  return String(element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function descriptor(element) {
  return {
    tag: element.tagName,
    id: element.id || null,
    className: typeof element.className === 'string' ? element.className : '',
    text: shortText(element),
  };
}

export function collectOverflowIssues(options = {}) {
  if (typeof document === 'undefined') {
    throw new Error('collectOverflowIssues must run in a browser page context.');
  }

  const tolerance = Number(options.tolerance ?? DEFAULT_TOLERANCE);
  const doc = document.documentElement;
  const viewportWidth = doc.clientWidth;
  const viewportHeight = doc.clientHeight;
  const activeSection = document.querySelector('main > .section.active, .section.active');
  const issues = [];

  const isClosedOverlay = (element) => (
    element.closest('#simurgV8Sheet:not(.open),#simurgV8Shade:not(.open),.modal:not(.active),[aria-hidden="true"]')
  );
  const isVisible = (element) => {
    if (!element || element.nodeType !== 1 || isClosedOverlay(element)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity || 1) !== 0 &&
      rect.width > 0 &&
      rect.height > 0;
  };
  const isIntentionalScroller = (element) => {
    if (element.closest(INTENTIONAL_SCROLL_SELECTOR)) return true;
    if (element.matches(INTENTIONAL_SCROLL_SELECTOR)) return true;
    const style = getComputedStyle(element);
    return ['auto', 'scroll'].includes(style.overflowX) &&
      (element.matches('table,.table-wrap,.scroll-x,[data-horizontal-scroll]') || !!element.querySelector('table'));
  };
  const push = (type, element, detail = {}) => {
    issues.push({ type, ...descriptor(element), ...detail });
  };

  if (doc.scrollWidth > doc.clientWidth + tolerance) {
    issues.push({
      type: 'document-horizontal-overflow',
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    });
  }
  if (document.body.scrollWidth > document.body.clientWidth + tolerance) {
    issues.push({
      type: 'body-horizontal-overflow',
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
    });
  }
  if (activeSection && activeSection.scrollWidth > activeSection.clientWidth + tolerance) {
    push('active-section-horizontal-overflow', activeSection, {
      scrollWidth: activeSection.scrollWidth,
      clientWidth: activeSection.clientWidth,
    });
  }

  document.querySelectorAll('body *').forEach((element) => {
    if (!isVisible(element) || isIntentionalScroller(element)) return;
    if (element.matches('svg,svg *,canvas,.mark')) return;

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const transformed = style.transform && style.transform !== 'none';
    if (!transformed && (rect.right > viewportWidth + tolerance || rect.left < -tolerance)) {
      push('viewport-overflow', element, {
        left: Math.round(rect.left * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        viewportWidth,
      });
    }
    if (
      !element.matches(NATIVE_TEXT_SCROLL_SELECTOR) &&
      element.scrollWidth > element.clientWidth + tolerance &&
      !['auto', 'scroll'].includes(style.overflowX) &&
      style.whiteSpace !== 'nowrap'
    ) {
      push('element-horizontal-overflow', element, {
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      });
    }
  });

  document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
    if (!isVisible(card)) return;
    const style = getComputedStyle(card);
    const rect = card.getBoundingClientRect();
    const contentLeft = rect.left + parseFloat(style.paddingLeft || 0);
    const contentRight = rect.right - parseFloat(style.paddingRight || 0);
    card.querySelectorAll(':scope > *, :scope > * > *').forEach((child) => {
      if (!isVisible(child) || isIntentionalScroller(child)) return;
      const childStyle = getComputedStyle(child);
      if (childStyle.position === 'absolute' || childStyle.position === 'fixed' || childStyle.transform !== 'none') return;
      const childRect = child.getBoundingClientRect();
      if (childRect.left < contentLeft - tolerance || childRect.right > contentRight + tolerance) {
        push('card-boundary-overflow', child, {
          parent: descriptor(card),
          left: Math.round(childRect.left * 10) / 10,
          right: Math.round(childRect.right * 10) / 10,
          contentLeft: Math.round(contentLeft * 10) / 10,
          contentRight: Math.round(contentRight * 10) / 10,
        });
      }
    });
  });

  document.querySelectorAll(CONTROL_SELECTOR).forEach((control) => {
    if (!isVisible(control)) return;
    const rect = control.getBoundingClientRect();
    const parent = control.parentElement;
    if (!parent || !isVisible(parent) || isIntentionalScroller(parent)) return;
    const parentRect = parent.getBoundingClientRect();
    if (rect.left < parentRect.left - tolerance || rect.right > parentRect.right + tolerance) {
      push('control-parent-overflow', control, {
        parent: descriptor(parent),
        left: Math.round(rect.left * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        parentLeft: Math.round(parentRect.left * 10) / 10,
        parentRight: Math.round(parentRect.right * 10) / 10,
      });
    }
  });

  const nav = document.getElementById('simurgV8Nav');
  if (nav && isVisible(nav) && activeSection) {
    const navRect = nav.getBoundingClientRect();
    const sectionStyle = getComputedStyle(activeSection);
    const bottomSpace = parseFloat(sectionStyle.paddingBottom || 0);
    const required = viewportHeight - navRect.top;
    if (bottomSpace + tolerance < required) {
      push('fixed-navigation-overlap-risk', nav, {
        activeSection: activeSection.id,
        paddingBottom: bottomSpace,
        requiredBottomSpace: Math.ceil(required),
      });
    }
  }

  const desktopAside = document.querySelector('body > .app > aside');
  const desktopMain = document.querySelector('body > .app > main');
  if (isVisible(desktopAside) && isVisible(desktopMain)) {
    const asideRect = desktopAside.getBoundingClientRect();
    const mainRect = desktopMain.getBoundingClientRect();
    if (asideRect.right > mainRect.left + tolerance) {
      push('desktop-sidebar-overlap', desktopAside, {
        sidebarRight: asideRect.right,
        mainLeft: mainRect.left,
      });
    }
  }

  return {
    screenName: options.screenName || activeSection?.id || 'unknown',
    viewport: options.viewport || { width: viewportWidth, height: viewportHeight },
    documentHorizontalOverflow: !issues.some((issue) => issue.type === 'document-horizontal-overflow' || issue.type === 'body-horizontal-overflow'),
    activeScreenOverflow: !issues.some((issue) => issue.type === 'active-section-horizontal-overflow' || issue.type === 'viewport-overflow' || issue.type === 'element-horizontal-overflow'),
    cardBoundaryOverflow: !issues.some((issue) => issue.type === 'card-boundary-overflow' || issue.type === 'control-parent-overflow'),
    fixedNavigationOverlap: !issues.some((issue) => issue.type === 'fixed-navigation-overlap-risk' || issue.type === 'desktop-sidebar-overlap'),
    issues,
  };
}

if (typeof window !== 'undefined') {
  window.SimurgOverflowAudit = { collectOverflowIssues, viewports: AUDIT_VIEWPORTS };
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  console.log(`Simurg overflow audit helper ready: ${AUDIT_VIEWPORTS.length} viewports.`);
}
