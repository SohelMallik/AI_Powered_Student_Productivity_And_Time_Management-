// ============================================================
// Vite Environment Type Declarations
// ============================================================
// This is a TypeScript-only file — it contains no executable code.
// Vite (our build tool) supports importing CSS files as small
// objects of class names ("CSS Modules"). This declaration teaches
// TypeScript what such an import looks like, so editors don't
// complain about `import styles from './Layout.module.css'`.

/**
 * Tells TypeScript that any file ending in `.module.css` exports a
 * default object whose keys are the class names defined in that CSS
 * file and whose values are the (hashed) class names to use in JSX.
 */
declare module '*.module.css' {
  const styles: Record<string, string>;
  export default styles;
}
