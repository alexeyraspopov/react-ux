import { useLayoutEffect } from 'react';

export function useFocusScope({ isLocking, target }) {
  useLayoutEffect(() => {
    if (!isLocking) {
      return;
    }

    let previousActiveElement = document.activeElement;
    let element = target.current;

    let preContentSentinel = document.createElement('div');
    element.insertBefore(preContentSentinel, element.firstElementChild);
    preContentSentinel.tabIndex = 0;

    let postContentSentinel = document.createElement('div');
    element.appendChild(postContentSentinel);
    postContentSentinel.tabIndex = 0;

    let walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        return isNodeFocusable(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });

    function handleKeyDown(event) {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;

      event.preventDefault();

      let nextActiveElement = event.shiftKey ? walker.previousNode() : walker.nextNode();

      if (nextActiveElement === postContentSentinel) {
        walker.currentNode = preContentSentinel;
        nextActiveElement = walker.nextNode();
      } else if (nextActiveElement === preContentSentinel) {
        walker.currentNode = postContentSentinel;
        nextActiveElement = walker.previousNode();
      }

      if (nextActiveElement != null) {
        nextActiveElement.focus();
      }
    }

    function handleFocus(event) {
      let eventTarget = event.target;
      if (element.contains(eventTarget)) {
        walker.currentNode = eventTarget;
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocus, true);
    preContentSentinel.focus();

    return () => {
      preContentSentinel.remove();
      postContentSentinel.remove();
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocus, true);
      previousActiveElement.focus();
    };
  }, [isLocking, target]);
}

let focusableNodeSelector = [
  'input:not([disabled]):not([type=hidden])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'a[href]',
  'area[href]',
  'summary',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]',
  '[tabindex]',
].join(',');

function isNodeFocusable(node) {
  return node.matches(focusableNodeSelector);
}
