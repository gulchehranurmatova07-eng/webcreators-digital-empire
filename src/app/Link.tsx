import type { AnchorHTMLAttributes } from 'react';
import { navigate } from './router';

/** Accessible link for the router: a real <a> (keyboard, middle-click) that routes in-app. */
export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return (
    <a href={`#${to}`} {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }} />
  );
}
