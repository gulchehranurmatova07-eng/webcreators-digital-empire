import type { AnchorHTMLAttributes } from 'react';

/** Accessible link for the hash router. */
export function Link({ to, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return <a href={`#${to}`} {...rest} />;
}
