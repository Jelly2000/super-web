// The UI library ships plain JS with no type declarations yet. Minimal typing
// for the pieces super-web uses; replace with the library's own types if it
// starts publishing them.
declare module '@jelly2000/component-ui-library' {
  import type { ButtonHTMLAttributes, ReactNode } from 'react';

  export interface ButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children?: ReactNode;
  }

  export function Button(props: ButtonProps): JSX.Element;
}

declare module '@jelly2000/component-ui-library/styles';
