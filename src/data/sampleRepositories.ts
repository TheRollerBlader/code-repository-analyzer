import { RepositoryData, RepoNode, DependencyGraphNode, DependencyLink } from '../types/repository';
import { calculateDirectoryBusFactors, calculateHotspots } from '../services/busFactor';

// Helper to calculate language breakdown from flat files
function computeLanguages(files: RepoNode[]) {
  const map: { [lang: string]: { bytes: number; percentage: number; color: string; fileCount: number } } = {};
  let totalBytes = 0;

  for (const f of files) {
    if (f.type !== 'blob' || !f.language) continue;
    const size = f.size || 1000;
    totalBytes += size;
    if (!map[f.language]) {
      map[f.language] = { bytes: 0, percentage: 0, color: '', fileCount: 0 };
    }
    map[f.language].bytes += size;
    map[f.language].fileCount += 1;
  }

  const langColors: { [key: string]: string } = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3572A5',
    Rust: '#dea584',
    HTML: '#e34c26',
    CSS: '#563d7c',
    JSON: '#292929',
    Markdown: '#083fa1',
    Vue: '#41b883',
    Go: '#00ADD8',
    Other: '#6e7681',
  };

  for (const lang of Object.keys(map)) {
    map[lang].percentage = Number(((map[lang].bytes / (totalBytes || 1)) * 100).toFixed(1));
    map[lang].color = langColors[lang] || '#8b949e';
  }

  return { map, totalBytes };
}

// Build hierarchical tree from flat file array
export function buildHierarchyFromFlatFiles(files: RepoNode[], repoName: string): RepoNode {
  const root: RepoNode = {
    path: '',
    name: repoName,
    type: 'tree',
    children: [],
  };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        if (!current.children) current.children = [];
        current.children.push({
          ...file,
          name: part,
        });
      } else {
        if (!current.children) current.children = [];
        let nextDir = current.children.find(c => c.name === part && c.type === 'tree');
        if (!nextDir) {
          nextDir = {
            path: parts.slice(0, i + 1).join('/'),
            name: part,
            type: 'tree',
            children: [],
          };
          current.children.push(nextDir);
        }
        current = nextDir;
      }
    }
  }

  return root;
}

// ======================== SAMPLE 1: REACT ========================
const reactFiles: RepoNode[] = [
  { path: 'packages/react/src/React.js', name: 'React.js', type: 'blob', size: 14200, linesOfCode: 420, language: 'JavaScript', extension: 'js', commits: 148, churnScore: 88, complexity: 18, authors: { 'gaearon': 42, 'sebmarkbage': 36, 'acdlite': 28, 'zpao': 24, 'bvaughn': 18 }, dependencies: ['ReactSharedInternals', 'ReactCurrentDispatcher'] },
  { path: 'packages/react/src/ReactHooks.js', name: 'ReactHooks.js', type: 'blob', size: 28400, linesOfCode: 780, language: 'JavaScript', extension: 'js', commits: 195, churnScore: 94, complexity: 34, authors: { 'acdlite': 72, 'sebmarkbage': 58, 'gaearon': 35, 'sophiebits': 15, 'bvaughn': 15 }, dependencies: ['ReactCurrentDispatcher', 'ReactSharedInternals'] },
  { path: 'packages/react/src/ReactElement.js', name: 'ReactElement.js', type: 'blob', size: 22100, linesOfCode: 610, language: 'JavaScript', extension: 'js', commits: 130, churnScore: 76, complexity: 26, authors: { 'sebmarkbage': 60, 'gaearon': 38, 'sophiebits': 22, 'chenglou': 10 }, dependencies: ['ReactCurrentOwner', 'ReactSymbols'] },
  { path: 'packages/react/src/ReactSharedInternals.js', name: 'ReactSharedInternals.js', type: 'blob', size: 5400, linesOfCode: 150, language: 'JavaScript', extension: 'js', commits: 88, churnScore: 62, complexity: 8, authors: { 'sebmarkbage': 45, 'acdlite': 32, 'gaearon': 11 }, dependencies: ['ReactCurrentDispatcher', 'ReactCurrentOwner'] },
  { path: 'packages/react/src/ReactCurrentDispatcher.js', name: 'ReactCurrentDispatcher.js', type: 'blob', size: 3100, linesOfCode: 85, language: 'JavaScript', extension: 'js', commits: 45, churnScore: 40, complexity: 4, authors: { 'acdlite': 25, 'sebmarkbage': 15, 'gaearon': 5 } },
  { path: 'packages/react/src/ReactSymbols.js', name: 'ReactSymbols.js', type: 'blob', size: 4800, linesOfCode: 130, language: 'JavaScript', extension: 'js', commits: 64, churnScore: 52, complexity: 6, authors: { 'gaearon': 30, 'sebmarkbage': 22, 'sophiebits': 12 } },
  { path: 'packages/react/src/ReactContext.js', name: 'ReactContext.js', type: 'blob', size: 9800, linesOfCode: 260, language: 'JavaScript', extension: 'js', commits: 72, churnScore: 58, complexity: 14, authors: { 'acdlite': 40, 'sebmarkbage': 22, 'gaearon': 10 }, dependencies: ['ReactSymbols'] },
  { path: 'packages/react-dom/src/client/ReactDOMRoot.js', name: 'ReactDOMRoot.js', type: 'blob', size: 38200, linesOfCode: 1040, language: 'JavaScript', extension: 'js', commits: 210, churnScore: 96, complexity: 42, authors: { 'acdlite': 88, 'sebmarkbage': 74, 'bvaughn': 32, 'gaearon': 16 }, dependencies: ['ReactFiberReconciler', 'ReactDOMComponentTree'] },
  { path: 'packages/react-dom/src/client/ReactDOMComponentTree.js', name: 'ReactDOMComponentTree.js', type: 'blob', size: 18900, linesOfCode: 520, language: 'JavaScript', extension: 'js', commits: 95, churnScore: 68, complexity: 22, authors: { 'sebmarkbage': 52, 'trueadm': 28, 'acdlite': 15 } },
  { path: 'packages/react-reconciler/src/ReactFiberWorkLoop.js', name: 'ReactFiberWorkLoop.js', type: 'blob', size: 94500, linesOfCode: 3120, language: 'JavaScript', extension: 'js', commits: 380, churnScore: 99, complexity: 85, authors: { 'acdlite': 160, 'sebmarkbage': 140, 'bvaughn': 50, 'gaearon': 30 }, dependencies: ['ReactFiberBeginWork', 'ReactFiberCompleteWork', 'ReactFiberCommitWork', 'Scheduler'] },
  { path: 'packages/react-reconciler/src/ReactFiberBeginWork.js', name: 'ReactFiberBeginWork.js', type: 'blob', size: 68400, linesOfCode: 2240, language: 'JavaScript', extension: 'js', commits: 275, churnScore: 92, complexity: 64, authors: { 'acdlite': 115, 'sebmarkbage': 105, 'sophiebits': 35, 'bvaughn': 20 }, dependencies: ['ReactFiberHooks', 'ReactChildFiber'] },
  { path: 'packages/react-reconciler/src/ReactFiberHooks.js', name: 'ReactFiberHooks.js', type: 'blob', size: 76200, linesOfCode: 2510, language: 'JavaScript', extension: 'js', commits: 310, churnScore: 97, complexity: 72, authors: { 'acdlite': 175, 'sebmarkbage': 95, 'bvaughn': 25, 'gaearon': 15 }, dependencies: ['ReactFiberWorkLoop', 'Scheduler'] },
  { path: 'packages/react-reconciler/src/ReactFiberCommitWork.js', name: 'ReactFiberCommitWork.js', type: 'blob', size: 58100, linesOfCode: 1890, language: 'JavaScript', extension: 'js', commits: 220, churnScore: 89, complexity: 58, authors: { 'sebmarkbage': 110, 'bvaughn': 65, 'acdlite': 45 }, dependencies: ['ReactFiberWorkLoop'] },
  { path: 'packages/scheduler/src/Scheduler.js', name: 'Scheduler.js', type: 'blob', size: 21500, linesOfCode: 650, language: 'JavaScript', extension: 'js', commits: 140, churnScore: 78, complexity: 28, authors: { 'acdlite': 85, 'sebmarkbage': 40, 'kassens': 15 } },
  { path: 'scripts/rollup/build.js', name: 'build.js', type: 'blob', size: 19800, linesOfCode: 560, language: 'JavaScript', extension: 'js', commits: 115, churnScore: 65, complexity: 19, authors: { 'gaearon': 65, 'trueadm': 30, 'sophiebits': 20 } },
  { path: 'packages/react/package.json', name: 'package.json', type: 'blob', size: 2100, linesOfCode: 65, language: 'JSON', extension: 'json', commits: 85, churnScore: 50, complexity: 2, authors: { 'gaearon': 50, 'acdlite': 35 } },
  { path: 'README.md', name: 'README.md', type: 'blob', size: 8400, linesOfCode: 180, language: 'Markdown', extension: 'md', commits: 160, churnScore: 45, complexity: 1, authors: { 'gaearon': 90, 'bvaughn': 40, 'sophiebits': 30 } },
];

const reactContributors = [
  { id: 'acdlite', name: 'Andrew Clark', avatarUrl: 'https://avatars.githubusercontent.com/u/3624098?v=4', commits: 1240, additions: 184500, deletions: 124000, topDirectories: ['packages/react-reconciler', 'packages/react', 'packages/scheduler'] },
  { id: 'sebmarkbage', name: 'Sebastian Markbåge', avatarUrl: 'https://avatars.githubusercontent.com/u/63648?v=4', commits: 1680, additions: 242000, deletions: 165000, topDirectories: ['packages/react-reconciler', 'packages/react-dom', 'packages/react'] },
  { id: 'gaearon', name: 'Dan Abramov', avatarUrl: 'https://avatars.githubusercontent.com/u/810438?v=4', commits: 1540, additions: 198000, deletions: 140000, topDirectories: ['packages/react', 'scripts', 'README.md'] },
  { id: 'bvaughn', name: 'Brian Vaughn', avatarUrl: 'https://avatars.githubusercontent.com/u/197597?v=4', commits: 890, additions: 112000, deletions: 78000, topDirectories: ['packages/react-devtools', 'packages/react-dom'] },
  { id: 'sophiebits', name: 'Sophie Alpert', avatarUrl: 'https://avatars.githubusercontent.com/u/6820?v=4', commits: 760, additions: 89000, deletions: 65000, topDirectories: ['packages/react-dom', 'scripts'] },
  { id: 'trueadm', name: 'Dominic Gannaway', avatarUrl: 'https://avatars.githubusercontent.com/u/1519870?v=4', commits: 450, additions: 62000, deletions: 41000, topDirectories: ['packages/react-dom'] },
];

const reactGraphNodes: DependencyGraphNode[] = [
  { id: 'React.js', name: 'React', path: 'packages/react/src/React.js', group: 'react', size: 14200, language: 'JavaScript', inDegree: 12, outDegree: 2, churnScore: 88 },
  { id: 'ReactHooks.js', name: 'ReactHooks', path: 'packages/react/src/ReactHooks.js', group: 'react', size: 28400, language: 'JavaScript', inDegree: 8, outDegree: 2, churnScore: 94 },
  { id: 'ReactElement.js', name: 'ReactElement', path: 'packages/react/src/ReactElement.js', group: 'react', size: 22100, language: 'JavaScript', inDegree: 6, outDegree: 2, churnScore: 76 },
  { id: 'ReactSharedInternals.js', name: 'SharedInternals', path: 'packages/react/src/ReactSharedInternals.js', group: 'react', size: 5400, language: 'JavaScript', inDegree: 14, outDegree: 2, churnScore: 62 },
  { id: 'ReactCurrentDispatcher.js', name: 'CurrentDispatcher', path: 'packages/react/src/ReactCurrentDispatcher.js', group: 'react', size: 3100, language: 'JavaScript', inDegree: 10, outDegree: 0, churnScore: 40 },
  { id: 'ReactDOMRoot.js', name: 'ReactDOMRoot', path: 'packages/react-dom/src/client/ReactDOMRoot.js', group: 'react-dom', size: 38200, language: 'JavaScript', inDegree: 4, outDegree: 2, churnScore: 96 },
  { id: 'ReactFiberWorkLoop.js', name: 'FiberWorkLoop', path: 'packages/react-reconciler/src/ReactFiberWorkLoop.js', group: 'reconciler', size: 94500, language: 'JavaScript', inDegree: 18, outDegree: 4, churnScore: 99 },
  { id: 'ReactFiberBeginWork.js', name: 'FiberBeginWork', path: 'packages/react-reconciler/src/ReactFiberBeginWork.js', group: 'reconciler', size: 68400, language: 'JavaScript', inDegree: 9, outDegree: 2, churnScore: 92 },
  { id: 'ReactFiberHooks.js', name: 'FiberHooks', path: 'packages/react-reconciler/src/ReactFiberHooks.js', group: 'reconciler', size: 76200, language: 'JavaScript', inDegree: 8, outDegree: 2, churnScore: 97 },
  { id: 'Scheduler.js', name: 'Scheduler', path: 'packages/scheduler/src/Scheduler.js', group: 'scheduler', size: 21500, language: 'JavaScript', inDegree: 15, outDegree: 0, churnScore: 78 },
];

const reactGraphLinks: DependencyLink[] = [
  { source: 'React.js', target: 'ReactSharedInternals.js', type: 'internal', strength: 0.9 },
  { source: 'ReactHooks.js', target: 'ReactCurrentDispatcher.js', type: 'internal', strength: 0.9 },
  { source: 'ReactElement.js', target: 'ReactSharedInternals.js', type: 'internal', strength: 0.8 },
  { source: 'ReactSharedInternals.js', target: 'ReactCurrentDispatcher.js', type: 'internal', strength: 0.95 },
  { source: 'ReactDOMRoot.js', target: 'ReactFiberWorkLoop.js', type: 'import', strength: 0.85 },
  { source: 'ReactFiberWorkLoop.js', target: 'ReactFiberBeginWork.js', type: 'internal', strength: 0.9 },
  { source: 'ReactFiberWorkLoop.js', target: 'ReactFiberHooks.js', type: 'internal', strength: 0.9 },
  { source: 'ReactFiberWorkLoop.js', target: 'Scheduler.js', type: 'import', strength: 0.8 },
  { source: 'ReactFiberBeginWork.js', target: 'ReactFiberHooks.js', type: 'internal', strength: 0.85 },
  { source: 'ReactFiberHooks.js', target: 'Scheduler.js', type: 'import', strength: 0.75 },
];

export function createReactSample(): RepositoryData {
  const { map: languages, totalBytes } = computeLanguages(reactFiles);
  const busFactors = calculateDirectoryBusFactors(reactFiles);
  const hotspots = calculateHotspots(reactFiles);

  return {
    metadata: {
      owner: 'facebook',
      name: 'react',
      fullName: 'facebook/react',
      description: 'The library for web and native user interfaces.',
      stars: 231500,
      forks: 46200,
      openIssues: 1240,
      watchers: 6600,
      defaultBranch: 'main',
      language: 'JavaScript',
      license: 'MIT',
      createdAt: '2013-05-24T16:15:54Z',
      updatedAt: '2025-02-20T11:42:10Z',
    },
    rootTree: buildHierarchyFromFlatFiles(reactFiles, 'react'),
    flatFiles: reactFiles,
    contributors: reactContributors,
    directoryBusFactors: busFactors,
    dependencies: {
      nodes: reactGraphNodes,
      links: reactGraphLinks,
    },
    languages,
    churnHotspots: hotspots,
    overallBusFactor: 2,
    totalSize: totalBytes,
    totalFiles: reactFiles.length,
    totalLinesOfCode: reactFiles.reduce((acc, f) => acc + (f.linesOfCode || 0), 0),
    isCached: true,
  };
}

// ======================== SAMPLE 2: EXPRESS ========================
const expressFiles: RepoNode[] = [
  { path: 'lib/express.js', name: 'express.js', type: 'blob', size: 4500, linesOfCode: 130, language: 'JavaScript', extension: 'js', commits: 140, churnScore: 72, complexity: 10, authors: { 'dougwilson': 65, 'tj': 45, 'wesleytodd': 30 }, dependencies: ['application', 'request', 'response', 'router'] },
  { path: 'lib/application.js', name: 'application.js', type: 'blob', size: 24500, linesOfCode: 680, language: 'JavaScript', extension: 'js', commits: 260, churnScore: 92, complexity: 38, authors: { 'dougwilson': 140, 'tj': 75, 'wesleytodd': 45 }, dependencies: ['router', 'middleware/init', 'middleware/query'] },
  { path: 'lib/request.js', name: 'request.js', type: 'blob', size: 16800, linesOfCode: 510, language: 'JavaScript', extension: 'js', commits: 180, churnScore: 84, complexity: 26, authors: { 'dougwilson': 95, 'tj': 55, 'jonathanong': 30 }, dependencies: ['utils'] },
  { path: 'lib/response.js', name: 'response.js', type: 'blob', size: 31200, linesOfCode: 950, language: 'JavaScript', extension: 'js', commits: 290, churnScore: 96, complexity: 46, authors: { 'dougwilson': 160, 'tj': 80, 'jonathanong': 50 }, dependencies: ['utils'] },
  { path: 'lib/router/index.js', name: 'index.js', type: 'blob', size: 28900, linesOfCode: 840, language: 'JavaScript', extension: 'js', commits: 240, churnScore: 90, complexity: 40, authors: { 'dougwilson': 130, 'tj': 70, 'wesleytodd': 40 }, dependencies: ['layer', 'route'] },
  { path: 'lib/router/layer.js', name: 'layer.js', type: 'blob', size: 6800, linesOfCode: 190, language: 'JavaScript', extension: 'js', commits: 95, churnScore: 56, complexity: 12, authors: { 'dougwilson': 55, 'tj': 25, 'wesleytodd': 15 } },
  { path: 'lib/router/route.js', name: 'route.js', type: 'blob', size: 8400, linesOfCode: 240, language: 'JavaScript', extension: 'js', commits: 110, churnScore: 64, complexity: 15, authors: { 'dougwilson': 60, 'tj': 30, 'wesleytodd': 20 }, dependencies: ['layer'] },
  { path: 'lib/utils.js', name: 'utils.js', type: 'blob', size: 9200, linesOfCode: 270, language: 'JavaScript', extension: 'js', commits: 125, churnScore: 68, complexity: 16, authors: { 'dougwilson': 70, 'tj': 35, 'jonathanong': 20 } },
  { path: 'package.json', name: 'package.json', type: 'blob', size: 3400, linesOfCode: 110, language: 'JSON', extension: 'json', commits: 190, churnScore: 70, complexity: 2, authors: { 'dougwilson': 120, 'wesleytodd': 70 } },
  { path: 'Readme.md', name: 'Readme.md', type: 'blob', size: 5200, linesOfCode: 140, language: 'Markdown', extension: 'md', commits: 80, churnScore: 35, complexity: 1, authors: { 'dougwilson': 45, 'tj': 35 } },
];

const expressContributors = [
  { id: 'dougwilson', name: 'Douglas Christopher Wilson', avatarUrl: 'https://avatars.githubusercontent.com/u/675127?v=4', commits: 1980, additions: 145000, deletions: 112000, topDirectories: ['lib', 'lib/router'] },
  { id: 'tj', name: 'TJ Holowaychuk', avatarUrl: 'https://avatars.githubusercontent.com/u/25254?v=4', commits: 1320, additions: 180000, deletions: 140000, topDirectories: ['lib'] },
  { id: 'wesleytodd', name: 'Wes Todd', avatarUrl: 'https://avatars.githubusercontent.com/u/1027776?v=4', commits: 380, additions: 35000, deletions: 28000, topDirectories: ['lib/router', 'package.json'] },
  { id: 'jonathanong', name: 'jongleberry', avatarUrl: 'https://avatars.githubusercontent.com/u/1792396?v=4', commits: 310, additions: 28000, deletions: 21000, topDirectories: ['lib'] },
];

const expressGraphNodes: DependencyGraphNode[] = [
  { id: 'express.js', name: 'express', path: 'lib/express.js', group: 'core', size: 4500, language: 'JavaScript', inDegree: 2, outDegree: 4, churnScore: 72 },
  { id: 'application.js', name: 'application', path: 'lib/application.js', group: 'core', size: 24500, language: 'JavaScript', inDegree: 5, outDegree: 2, churnScore: 92 },
  { id: 'request.js', name: 'request', path: 'lib/request.js', group: 'http', size: 16800, language: 'JavaScript', inDegree: 4, outDegree: 1, churnScore: 84 },
  { id: 'response.js', name: 'response', path: 'lib/response.js', group: 'http', size: 31200, language: 'JavaScript', inDegree: 4, outDegree: 1, churnScore: 96 },
  { id: 'router/index.js', name: 'router', path: 'lib/router/index.js', group: 'routing', size: 28900, language: 'JavaScript', inDegree: 6, outDegree: 2, churnScore: 90 },
  { id: 'router/layer.js', name: 'layer', path: 'lib/router/layer.js', group: 'routing', size: 6800, language: 'JavaScript', inDegree: 4, outDegree: 0, churnScore: 56 },
  { id: 'router/route.js', name: 'route', path: 'lib/router/route.js', group: 'routing', size: 8400, language: 'JavaScript', inDegree: 3, outDegree: 1, churnScore: 64 },
  { id: 'utils.js', name: 'utils', path: 'lib/utils.js', group: 'utility', size: 9200, language: 'JavaScript', inDegree: 8, outDegree: 0, churnScore: 68 },
];

const expressGraphLinks: DependencyLink[] = [
  { source: 'express.js', target: 'application.js', type: 'internal', strength: 0.9 },
  { source: 'express.js', target: 'request.js', type: 'internal', strength: 0.8 },
  { source: 'express.js', target: 'response.js', type: 'internal', strength: 0.8 },
  { source: 'express.js', target: 'router/index.js', type: 'internal', strength: 0.9 },
  { source: 'application.js', target: 'router/index.js', type: 'internal', strength: 0.95 },
  { source: 'router/index.js', target: 'router/route.js', type: 'internal', strength: 0.85 },
  { source: 'router/index.js', target: 'router/layer.js', type: 'internal', strength: 0.85 },
  { source: 'router/route.js', target: 'router/layer.js', type: 'internal', strength: 0.75 },
  { source: 'request.js', target: 'utils.js', type: 'internal', strength: 0.7 },
  { source: 'response.js', target: 'utils.js', type: 'internal', strength: 0.7 },
];

export function createExpressSample(): RepositoryData {
  const { map: languages, totalBytes } = computeLanguages(expressFiles);
  const busFactors = calculateDirectoryBusFactors(expressFiles);
  const hotspots = calculateHotspots(expressFiles);

  return {
    metadata: {
      owner: 'expressjs',
      name: 'express',
      fullName: 'expressjs/express',
      description: 'Fast, unopinionated, minimalist web framework for node.',
      stars: 65400,
      forks: 15800,
      openIssues: 180,
      watchers: 1900,
      defaultBranch: 'master',
      language: 'JavaScript',
      license: 'MIT',
      createdAt: '2009-06-26T18:56:01Z',
      updatedAt: '2025-02-19T08:14:20Z',
    },
    rootTree: buildHierarchyFromFlatFiles(expressFiles, 'express'),
    flatFiles: expressFiles,
    contributors: expressContributors,
    directoryBusFactors: busFactors,
    dependencies: {
      nodes: expressGraphNodes,
      links: expressGraphLinks,
    },
    languages,
    churnHotspots: hotspots,
    overallBusFactor: 1, // High concentration on dougwilson
    totalSize: totalBytes,
    totalFiles: expressFiles.length,
    totalLinesOfCode: expressFiles.reduce((acc, f) => acc + (f.linesOfCode || 0), 0),
    isCached: true,
  };
}

// ======================== SAMPLE 3: VUE ========================
const vueFiles: RepoNode[] = [
  { path: 'packages/reactivity/src/ref.ts', name: 'ref.ts', type: 'blob', size: 18200, linesOfCode: 520, language: 'TypeScript', extension: 'ts', commits: 165, churnScore: 88, complexity: 24, authors: { 'yyx990803': 110, 'HcySunYang': 35, 'antfu': 20 }, dependencies: ['dep', 'effect'] },
  { path: 'packages/reactivity/src/reactive.ts', name: 'reactive.ts', type: 'blob', size: 14500, linesOfCode: 410, language: 'TypeScript', extension: 'ts', commits: 140, churnScore: 82, complexity: 22, authors: { 'yyx990803': 95, 'HcySunYang': 25, 'antfu': 20 }, dependencies: ['baseHandlers', 'collectionHandlers'] },
  { path: 'packages/reactivity/src/effect.ts', name: 'effect.ts', type: 'blob', size: 23400, linesOfCode: 680, language: 'TypeScript', extension: 'ts', commits: 190, churnScore: 94, complexity: 36, authors: { 'yyx990803': 125, 'HcySunYang': 40, 'antfu': 25 }, dependencies: ['dep'] },
  { path: 'packages/runtime-core/src/renderer.ts', name: 'renderer.ts', type: 'blob', size: 84200, linesOfCode: 2650, language: 'TypeScript', extension: 'ts', commits: 340, churnScore: 98, complexity: 78, authors: { 'yyx990803': 220, 'HcySunYang': 70, 'antfu': 50 }, dependencies: ['vnode', 'component', 'componentRenderUtils'] },
  { path: 'packages/runtime-core/src/vnode.ts', name: 'vnode.ts', type: 'blob', size: 29800, linesOfCode: 890, language: 'TypeScript', extension: 'ts', commits: 210, churnScore: 89, complexity: 35, authors: { 'yyx990803': 140, 'HcySunYang': 45, 'antfu': 25 }, dependencies: ['shapeFlags'] },
  { path: 'packages/runtime-core/src/component.ts', name: 'component.ts', type: 'blob', size: 36400, linesOfCode: 1100, language: 'TypeScript', extension: 'ts', commits: 245, churnScore: 91, complexity: 44, authors: { 'yyx990803': 160, 'HcySunYang': 55, 'antfu': 30 }, dependencies: ['vnode', 'componentProps', 'componentSlots'] },
  { path: 'packages/compiler-core/src/parse.ts', name: 'parse.ts', type: 'blob', size: 48900, linesOfCode: 1480, language: 'TypeScript', extension: 'ts', commits: 220, churnScore: 86, complexity: 52, authors: { 'yyx990803': 150, 'HcySunYang': 40, 'sodatea': 30 }, dependencies: ['ast', 'tokenizer'] },
  { path: 'packages/compiler-core/src/transform.ts', name: 'transform.ts', type: 'blob', size: 32100, linesOfCode: 980, language: 'TypeScript', extension: 'ts', commits: 175, churnScore: 80, complexity: 38, authors: { 'yyx990803': 120, 'sodatea': 35, 'HcySunYang': 20 }, dependencies: ['ast'] },
  { path: 'packages/vue/src/index.ts', name: 'index.ts', type: 'blob', size: 4200, linesOfCode: 120, language: 'TypeScript', extension: 'ts', commits: 90, churnScore: 60, complexity: 6, authors: { 'yyx990803': 70, 'antfu': 20 }, dependencies: ['runtime-dom', 'compiler-dom'] },
  { path: 'package.json', name: 'package.json', type: 'blob', size: 6800, linesOfCode: 180, language: 'JSON', extension: 'json', commits: 280, churnScore: 85, complexity: 2, authors: { 'yyx990803': 180, 'antfu': 100 } },
];

const vueContributors = [
  { id: 'yyx990803', name: 'Evan You', avatarUrl: 'https://avatars.githubusercontent.com/u/499550?v=4', commits: 4850, additions: 420000, deletions: 310000, topDirectories: ['packages/runtime-core', 'packages/reactivity', 'packages/compiler-core'] },
  { id: 'antfu', name: 'Anthony Fu', avatarUrl: 'https://avatars.githubusercontent.com/u/11247099?v=4', commits: 720, additions: 68000, deletions: 45000, topDirectories: ['packages/reactivity', 'packages/runtime-core'] },
  { id: 'HcySunYang', name: 'HcySunYang', avatarUrl: 'https://avatars.githubusercontent.com/u/14142636?v=4', commits: 540, additions: 52000, deletions: 38000, topDirectories: ['packages/reactivity', 'packages/compiler-core'] },
  { id: 'sodatea', name: 'Haoqun Jiang', avatarUrl: 'https://avatars.githubusercontent.com/u/3277634?v=4', commits: 380, additions: 34000, deletions: 26000, topDirectories: ['packages/compiler-core', 'packages/compiler-sfc'] },
];

const vueGraphNodes: DependencyGraphNode[] = [
  { id: 'ref.ts', name: 'ref', path: 'packages/reactivity/src/ref.ts', group: 'reactivity', size: 18200, language: 'TypeScript', inDegree: 8, outDegree: 2, churnScore: 88 },
  { id: 'reactive.ts', name: 'reactive', path: 'packages/reactivity/src/reactive.ts', group: 'reactivity', size: 14500, language: 'TypeScript', inDegree: 7, outDegree: 2, churnScore: 82 },
  { id: 'effect.ts', name: 'effect', path: 'packages/reactivity/src/effect.ts', group: 'reactivity', size: 23400, language: 'TypeScript', inDegree: 12, outDegree: 1, churnScore: 94 },
  { id: 'renderer.ts', name: 'renderer', path: 'packages/runtime-core/src/renderer.ts', group: 'runtime', size: 84200, language: 'TypeScript', inDegree: 6, outDegree: 3, churnScore: 98 },
  { id: 'vnode.ts', name: 'vnode', path: 'packages/runtime-core/src/vnode.ts', group: 'runtime', size: 29800, language: 'TypeScript', inDegree: 14, outDegree: 1, churnScore: 89 },
  { id: 'component.ts', name: 'component', path: 'packages/runtime-core/src/component.ts', group: 'runtime', size: 36400, language: 'TypeScript', inDegree: 10, outDegree: 2, churnScore: 91 },
  { id: 'parse.ts', name: 'parse', path: 'packages/compiler-core/src/parse.ts', group: 'compiler', size: 48900, language: 'TypeScript', inDegree: 5, outDegree: 1, churnScore: 86 },
  { id: 'transform.ts', name: 'transform', path: 'packages/compiler-core/src/transform.ts', group: 'compiler', size: 32100, language: 'TypeScript', inDegree: 4, outDegree: 1, churnScore: 80 },
];

const vueGraphLinks: DependencyLink[] = [
  { source: 'ref.ts', target: 'effect.ts', type: 'internal', strength: 0.9 },
  { source: 'reactive.ts', target: 'effect.ts', type: 'internal', strength: 0.9 },
  { source: 'component.ts', target: 'vnode.ts', type: 'internal', strength: 0.85 },
  { source: 'renderer.ts', target: 'vnode.ts', type: 'internal', strength: 0.9 },
  { source: 'renderer.ts', target: 'component.ts', type: 'internal', strength: 0.9 },
  { source: 'renderer.ts', target: 'effect.ts', type: 'import', strength: 0.8 },
  { source: 'parse.ts', target: 'transform.ts', type: 'internal', strength: 0.75 },
];

export function createVueSample(): RepositoryData {
  const { map: languages, totalBytes } = computeLanguages(vueFiles);
  const busFactors = calculateDirectoryBusFactors(vueFiles);
  const hotspots = calculateHotspots(vueFiles);

  return {
    metadata: {
      owner: 'vuejs',
      name: 'core',
      fullName: 'vuejs/core',
      description: 'Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web.',
      stars: 46800,
      forks: 8200,
      openIssues: 420,
      watchers: 1200,
      defaultBranch: 'main',
      language: 'TypeScript',
      license: 'MIT',
      createdAt: '2018-09-18T16:12:01Z',
      updatedAt: '2025-02-20T09:18:40Z',
    },
    rootTree: buildHierarchyFromFlatFiles(vueFiles, 'core'),
    flatFiles: vueFiles,
    contributors: vueContributors,
    directoryBusFactors: busFactors,
    dependencies: {
      nodes: vueGraphNodes,
      links: vueGraphLinks,
    },
    languages,
    churnHotspots: hotspots,
    overallBusFactor: 1, // Evan You dominant
    totalSize: totalBytes,
    totalFiles: vueFiles.length,
    totalLinesOfCode: vueFiles.reduce((acc, f) => acc + (f.linesOfCode || 0), 0),
    isCached: true,
  };
}

export const SAMPLE_REPOS: { [key: string]: () => RepositoryData } = {
  'facebook/react': createReactSample,
  'expressjs/express': createExpressSample,
  'vuejs/core': createVueSample,
};
