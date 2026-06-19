import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type SdlcRunMemory = {
  runId: string;
  userId: string;
  requirement: string;
  demoFailureMode: string;
  status: string;
  blockerCount: number;
  overallScore?: number;
  createdAtUtc: string;
};

const memoryDir = path.join(process.cwd(), 'data');
const memoryFile = path.join(memoryDir, 'sdlc-memory.json');

const ensureMemoryFile = async () => {
  await mkdir(memoryDir, { recursive: true });

  try {
    await readFile(memoryFile, 'utf-8');
  } catch {
    await writeFile(memoryFile, JSON.stringify([], null, 2), 'utf-8');
  }
};

export const readSdlcMemory = async (): Promise<SdlcRunMemory[]> => {
  await ensureMemoryFile();

  const raw = await readFile(memoryFile, 'utf-8');

  try {
    return JSON.parse(raw) as SdlcRunMemory[];
  } catch {
    return [];
  }
};

export const appendSdlcMemory = async (entry: SdlcRunMemory) => {
  const existing = await readSdlcMemory();

  existing.push(entry);

  await writeFile(memoryFile, JSON.stringify(existing, null, 2), 'utf-8');
};

export const getRecentSdlcMemorySummary = async (
  userId: string,
  maxItems = 5,
): Promise<string> => {
  const memory = await readSdlcMemory();

  const recent = memory
    .filter((item) => item.userId === userId)
    .slice(-maxItems)
    .reverse();

  if (recent.length === 0) {
    return 'No previous SDLC run memory found for this user.';
  }

  const rows = recent
    .map(
      (item) =>
        `| ${item.createdAtUtc} | ${item.demoFailureMode} | ${item.status} | ${item.blockerCount} | ${item.overallScore ?? 'N/A'} |`,
    )
    .join('\n');

  return `
# SDLC MEMORY SUMMARY

## Recent Runs
| Created UTC | Failure Mode | Status | Blockers | Score |
|---|---|---|---:|---:|
${rows}
`;
};