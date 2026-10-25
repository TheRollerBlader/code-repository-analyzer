export interface RepoNode {
  path: string;
  name: string;
  type: 'blob' | 'tree';
  size?: number;
  linesOfCode?: number;
  language?: string;
  extension?: string;
  commits?: number;
  lastModified?: string;
  authors?: { [author: string]: number };
  dependencies?: string[];
  imports?: string[];
  children?: RepoNode[];
  complexity?: number; // Cyclomatic estimate or cognitive load
  churnScore?: number; // 0-100 normalized score
}

export interface HierarchyNodeData {
  name: string;
  path: string;
  size?: number;
  language?: string;
  children?: HierarchyNodeData[];
  type?: 'blob' | 'tree';
  commits?: number;
  churnScore?: number;
  busFactor?: number;
  color?: string;
}

export interface Contributor {
  id: string;
  name: string;
  avatarUrl: string;
  commits: number;
  additions: number;
  deletions: number;
  pullRequests?: number;
  topDirectories: string[];
}

export interface DirectoryBusFactor {
  path: string;
  totalCommits: number;
  busFactor: number; // 1 to 5+
  riskLevel: 'critical' | 'warning' | 'healthy';
  primaryOwner: string;
  primaryOwnerPercentage: number;
  shannonEntropy: number;
  hhiScore: number;
  contributors: { name: string; percentage: number; commits: number }[];
}

export interface DependencyLink {
  source: string; // node id/path
  target: string; // node id/path
  type: 'import' | 'require' | 'internal' | 'peer';
  strength?: number;
}

export interface DependencyGraphNode {
  id: string;
  name: string;
  path: string;
  group: string;
  size: number;
  language: string;
  inDegree: number;
  outDegree: number;
  churnScore: number;
}

export interface RepositoryMetadata {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  defaultBranch: string;
  language: string;
  license?: string;
  updatedAt: string;
  createdAt: string;
}

export interface RepositoryData {
  metadata: RepositoryMetadata;
  rootTree: RepoNode;
  flatFiles: RepoNode[];
  contributors: Contributor[];
  directoryBusFactors: DirectoryBusFactor[];
  dependencies: {
    nodes: DependencyGraphNode[];
    links: DependencyLink[];
  };
  languages: { [language: string]: { bytes: number; percentage: number; color: string; fileCount: number } };
  churnHotspots: RepoNode[];
  overallBusFactor: number;
  totalSize: number;
  totalFiles: number;
  totalLinesOfCode: number;
  isCached?: boolean;
}
