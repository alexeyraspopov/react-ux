import { useLayoutEffect } from 'react';

let isMobileSafari =
  window.navigator != null &&
  /AppleWebKit/.test(navigator.userAgent) &&
  (/^(iPhone|iPad)$/.test(navigator.platform) ||
    // iPadOS 13 lies and says its a Mac, but we can distinguish by detecting touch support.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function usePreventScroll({ isPreventing, target }) {
  useLayoutEffect(() => {
    if (!isPreventing) {
      return;
    }
    let element = target.current;
    if (isMobileSafari) {
      return preventScrollMobileSafari(element);
    } else {
      return preventScrollStandard(element);
    }
  }, [isPreventing, target]);
}

function preventScrollMobileSafari(element) {
  // prevent touch events outside
  function handleTouch(event) {
    if (!element.contains(event.target)) {
      event.preventDefault();
    }
  }
  let overflow = document.body.style.getPropertyValue('overflow');
  document.body.style.setProperty('overflow', 'hidden');
  document.addEventListener('touchmove', handleTouch, { passive: false, capture: true });
  document.addEventListener('touchend', handleTouch, { passive: false, capture: true });

  // contain overscroll behavior
  function handleScroll() {
    let { scrollTop, scrollHeight, offsetHeight } = element;
    if (scrollTop === 0) {
      requestAnimationFrame(() => {
        element.scrollTop = 1;
      });
    } else if (scrollTop + offsetHeight === scrollHeight) {
      requestAnimationFrame(() => {
        element.scrollTop = scrollHeight - offsetHeight - 1;
      });
    }
  }
  element.addEventListener('scroll', handleScroll);
  element.scrollTo(1, 1);

  return () => {
    document.body.style.setProperty('overflow', overflow);
    document.removeEventListener('touchmove', handleTouch, { passive: false, capture: true });
    document.removeEventListener('touchend', handleTouch, { passive: false, capture: true });
    element.removeEventListener('scroll', handleScroll);
  };
}

function preventScrollStandard(element) {
  let overflow = document.body.style.getPropertyValue('overflow');
  document.body.style.setProperty('overflow', 'hidden');
  return () => {
    document.body.style.setProperty('overflow', overflow);
  };
}
