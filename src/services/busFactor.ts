import { DirectoryBusFactor, RepoNode } from '../types/repository';

/**
 * Calculates Directory-level Bus Factor, Shannon Entropy, and HHI.
 *
 * Formulas:
 * 1. Shannon Entropy: H = - SUM( p_i * log2(p_i) )
 * 2. Herfindahl-Hirschman Index: HHI = SUM( (p_i * 100)^2 )
 *    - HHI < 1500: Unconcentrated (Healthy)
 *    - 1500 <= HHI <= 2500: Moderate Concentration (Warning)
 *    - HHI > 2500: High Concentration (Critical)
 * 3. Minimal Bus Factor: Smallest k such that SUM_{j=1..k} p_j >= 0.75
 */
export function calculateDirectoryBusFactors(flatFiles: RepoNode[]): DirectoryBusFactor[] {
  const dirMap = new Map<string, { commits: number; authors: Map<string, number> }>();

  // Aggregate commits and authors per directory (depth 1 or 2)
  for (const file of flatFiles) {
    if (file.type !== 'blob') continue;
    const parts = file.path.split('/');
    // Directory key (e.g. "packages/core", "src/components", or top-level "src")
    const dirKey = parts.length > 2 ? `${parts[0]}/${parts[1]}` : (parts.length > 1 ? parts[0] : 'root');

    if (!dirMap.has(dirKey)) {
      dirMap.set(dirKey, { commits: 0, authors: new Map() });
    }
    const entry = dirMap.get(dirKey)!;
    const fileCommits = file.commits || 1;
    entry.commits += fileCommits;

    if (file.authors) {
      for (const [author, count] of Object.entries(file.authors)) {
        entry.authors.set(author, (entry.authors.get(author) || 0) + count);
      }
    } else {
      // Fallback author if unknown
      entry.authors.set('core-team', (entry.authors.get('core-team') || 0) + fileCommits);
    }
  }

  const results: DirectoryBusFactor[] = [];

  dirMap.forEach((entry, dirPath) => {
    if (entry.commits < 3) return; // Skip tiny directories

    const totalCommits = entry.commits;
    const authorList = Array.from(entry.authors.entries())
      .map(([name, count]) => ({
        name,
        commits: count,
        percentage: Number(((count / totalCommits) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.commits - a.commits);

    if (authorList.length === 0) return;

    // Shannon Entropy: H = - SUM( p_i * log2(p_i) )
    let shannonEntropy = 0;
    // HHI: SUM( (p_i * 100)^2 )
    let hhi = 0;

    for (const a of authorList) {
      const p = a.commits / totalCommits;
      if (p > 0) {
        shannonEntropy -= p * Math.log2(p);
        hhi += Math.pow(p * 100, 2);
      }
    }

    // Determine cumulative Bus Factor (contributors needed for >= 75% commits)
    let cumulative = 0;
    let busFactor = 0;
    for (const a of authorList) {
      cumulative += a.percentage;
      busFactor++;
      if (cumulative >= 75) break;
    }
    busFactor = Math.max(1, busFactor);

    const primaryOwner = authorList[0].name;
    const primaryPercentage = authorList[0].percentage;

    let riskLevel: 'critical' | 'warning' | 'healthy' = 'healthy';
    if (busFactor === 1 || primaryPercentage > 75 || hhi > 3500) {
      riskLevel = 'critical';
    } else if (busFactor === 2 || primaryPercentage > 50 || hhi > 2200) {
      riskLevel = 'warning';
    }

    results.push({
      path: dirPath,
      totalCommits,
      busFactor,
      riskLevel,
      primaryOwner,
      primaryOwnerPercentage: primaryPercentage,
      shannonEntropy: Number(shannonEntropy.toFixed(2)),
      hhiScore: Math.round(hhi),
      contributors: authorList.slice(0, 5),
    });
  });

  return results.sort((a, b) => {
    // Sort critical first, then total commits desc
    const riskWeight = { critical: 3, warning: 2, healthy: 1 };
    if (riskWeight[b.riskLevel] !== riskWeight[a.riskLevel]) {
      return riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
    }
    return b.totalCommits - a.totalCommits;
  });
}

/**
 * Calculates Code Churn Hotspots.
 * High Churn + High Complexity/Size = Technical Debt Risk.
 */
export function calculateHotspots(flatFiles: RepoNode[]): RepoNode[] {
  return [...flatFiles]
    .filter(f => f.type === 'blob' && (f.size || 0) > 200)
    .sort((a, b) => {
      const scoreA = (a.churnScore || 0) * Math.log2((a.linesOfCode || 10) + 1);
      const scoreB = (b.churnScore || 0) * Math.log2((b.linesOfCode || 10) + 1);
      return scoreB - scoreA;
    })
    .slice(0, 25);
}
