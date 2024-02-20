// shamelessly stolen form https://dev.to/n8tb1t/tracking-scroll-position-with-react-hooks-3bbj
import { useRef, useLayoutEffect, useEffect } from 'react';
import fastdom from 'fastdom';
import { isBrowser } from '@wix/editor-elements-common-utils';

export type Pos = { x: number; y: number; isAtPageBottom: boolean };

function getScrollPosition(): Pos {
  if (!isBrowser()) {
    return { x: 0, y: 0, isAtPageBottom: false };
  }

  const { left, top } = document.body.getBoundingClientRect();
  const isAtPageBottom =
    window.innerHeight + window.scrollY === document.body.scrollHeight;
  return { x: left, y: top, isAtPageBottom };
}

export type useScrollPositionOptions = {
  waitFor?: number;
  disabled?: boolean;
};

export function useScrollPosition(
  effect: ({ prevPos, currPos }: { prevPos: Pos; currPos: Pos }) => void,
  deps: Array<any>,
  options: useScrollPositionOptions = {},
) {
  options = {
    waitFor: 100,
    disabled: false,
    ...options,
  };

  const position = useRef(getScrollPosition());
  let throttleTimeout: number | null = null;
  const callBack = () => {
    fastdom.measure(() => {
      const currPos = getScrollPosition();
      const prevPos = position.current;
      position.current = currPos;
      throttleTimeout = null;
      fastdom.mutate(() => effect({ prevPos, currPos }));
    });
  };
  const useIsomorphicLayoutEffect = isBrowser() ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    if (!isBrowser()) {
      return;
    }
    const handleScroll = () => {
      if (throttleTimeout === null) {
        throttleTimeout = window.setTimeout(callBack, options.waitFor);
      }
    };

    if (!options.disabled) {
      window.addEventListener('scroll', handleScroll);
      // cleanup callback
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (throttleTimeout) {
          window.clearTimeout(throttleTimeout);
        }
      };
    }
    return () => {};
  }, deps);
}
