export const LANGUAGE_COLORS: { [key: string]: string } = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  JSON: '#292929',
  Markdown: '#083fa1',
  YAML: '#cb171e',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Other: '#6e7681',
};

export const EXTENSION_MAP: { [ext: string]: string } = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  py: 'Python',
  rs: 'Rust',
  go: 'Go',
  java: 'Java',
  cpp: 'C++',
  cc: 'C++',
  cxx: 'C++',
  c: 'C',
  h: 'C',
  hpp: 'C++',
  cs: 'C#',
  rb: 'Ruby',
  php: 'PHP',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  md: 'Markdown',
  markdown: 'Markdown',
  yml: 'YAML',
  yaml: 'YAML',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  vue: 'Vue',
  svelte: 'Svelte',
  swift: 'Swift',
  kt: 'Kotlin',
};

export function getLanguageFromPath(path: string): string {
  const parts = path.split('.');
  if (parts.length <= 1) return 'Other';
  const ext = parts[parts.length - 1].toLowerCase();
  return EXTENSION_MAP[ext] || 'Other';
}

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || '#94a3b8';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
