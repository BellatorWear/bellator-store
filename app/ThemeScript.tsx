// Inline script um Theme-Flash beim Laden zu verhindern
// Wird im <head> eingebunden, läuft vor React-Hydration
export default function ThemeScript() {
  const script = `
    (function() {
      try {
        var theme = document.cookie.match(/bellator-theme=([^;]+)/)?.[1] || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch(e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
