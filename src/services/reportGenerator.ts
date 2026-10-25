import { RepositoryData } from '../types/repository';
import { formatBytes, formatNumber } from '../utils/colors';

export function generateMarkdownReport(data: RepositoryData): string {
  const { metadata, languages, directoryBusFactors, churnHotspots, contributors, totalSize, totalFiles, totalLinesOfCode, overallBusFactor } = data;

  const topLanguages = Object.entries(languages)
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .slice(0, 8);

  const langTable = topLanguages
    .map(([lang, info]) => `| ${lang} | ${formatBytes(info.bytes)} | ${info.percentage}% | ${formatNumber(info.fileCount)} |`)
    .join('\n');

  const busFactorTable = directoryBusFactors
    .slice(0, 10)
    .map(d => `| \`${d.path}\` | **${d.busFactor}** | ${d.riskLevel.toUpperCase()} | ${d.primaryOwner} (${d.primaryOwnerPercentage}%) | ${d.shannonEntropy} | ${d.hhiScore} |`)
    .join('\n');

  const hotspotTable = churnHotspots
    .slice(0, 10)
    .map(h => `| \`${h.path}\` | ${h.linesOfCode || '-'} | ${h.commits || 1} | ${h.churnScore || '-'} / 100 | ${h.complexity || '-'} |`)
    .join('\n');

  const topContributors = contributors
    .slice(0, 5)
    .map(c => `- **${c.name}**: ${formatNumber(c.commits)} commits (+${formatNumber(c.additions)} / -${formatNumber(c.deletions)})`)
    .join('\n');

  return `# CodebaseRadar Analysis Report: ${metadata.fullName}

> Generated on **${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}** via CodebaseRadar Repository Analyzer.
> Source: [github.com/${metadata.fullName}](https://github.com/${metadata.fullName})

---

## 1. Executive Summary

- **Repository**: \`${metadata.fullName}\`
- **Description**: ${metadata.description || 'N/A'}
- **Stars / Forks**: ⭐ ${formatNumber(metadata.stars)} / 🍴 ${formatNumber(metadata.forks)}
- **License**: ${metadata.license || 'N/A'}
- **Analyzed Code Volume**: ${formatBytes(totalSize)} across ${formatNumber(totalFiles)} files (~${formatNumber(totalLinesOfCode)} lines of code)
- **Overall Project Bus Factor**: **${overallBusFactor}** (${overallBusFactor <= 1 ? 'CRITICAL RISK - Single point of failure detected' : overallBusFactor === 2 ? 'MODERATE RISK' : 'HEALTHY RESILIENCE'})

---

## 2. Language Composition

| Language | Volume | Share | File Count |
| :--- | :--- | :--- | :--- |
${langTable}

---

## 3. Directory Bus Factor & Knowledge Distribution

Bus Factor is determined using the **Herfindahl-Hirschman Index ($HHI$)** and **Shannon Entropy ($H$)** over commit author distributions. A Bus Factor of 1 indicates that over 75% of commits in that subsystem belong to a single developer.

| Directory / Subsystem | Bus Factor | Risk Level | Primary Owner (% Commits) | Shannon Entropy | HHI Score |
| :--- | :---: | :---: | :--- | :---: | :---: |
${busFactorTable}

### Top Contributors
${topContributors}

---

## 4. Code Churn & Technical Debt Hotspots

Hotspots are files exhibiting both high historical commit velocity (churn) and elevated structural complexity. These files carry the highest probability of latent bugs and merge conflicts.

| File Path | Est. LOC | Commits | Churn Index | Cognitive Complexity |
| :--- | :---: | :---: | :---: | :---: |
${hotspotTable}

---

## 5. Architectural Recommendations

1. **Knowledge Redundancy**: Subsystems marked **CRITICAL** (e.g. \`${directoryBusFactors[0]?.path || 'core'}\`) require active pair programming and secondary code review assignments to prevent catastrophic knowledge drain.
2. **Refactoring Targets**: Top churn hotspots (such as \`${churnHotspots[0]?.path || 'core files'}\`) should be prioritized for modular decoupling and increased unit test coverage.
3. **Dependency Decoupling**: Centralized coordinator modules with high in-degree centrality should enforce strict API contracts.

---
*Report exported by CodebaseRadar Engine v1.0.0*
`;
}

export function generateJsonReport(data: RepositoryData): string {
  return JSON.stringify(
    {
      reportVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      metadata: data.metadata,
      summary: {
        totalSize: data.totalSize,
        totalFiles: data.totalFiles,
        totalLinesOfCode: data.totalLinesOfCode,
        overallBusFactor: data.overallBusFactor,
      },
      languages: data.languages,
      directoryBusFactors: data.directoryBusFactors,
      churnHotspots: data.churnHotspots.slice(0, 20),
      contributors: data.contributors.slice(0, 15),
      dependencies: {
        nodeCount: data.dependencies.nodes.length,
        linkCount: data.dependencies.links.length,
        nodes: data.dependencies.nodes,
      },
    },
    null,
    2
  );
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
