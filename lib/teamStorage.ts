import fs from 'fs';
import path from 'path';

export interface TeamConfigStored {
  id: string;
  teamName: string;
  mission: string;
  projectDescription: string;
  userStoryTemplate: string;
  teamRoles: string;
}

export interface SavedStoryRecord {
  id: string;
  teamId: string;
  originalInput: string;
  formattedStory: string;
  suggestions: string[];
  createdAt: string;
  teamConfigSnapshot: TeamConfigStored;
  tweakHistory: Array<{
    id: string;
    tweakInstructions: string;
    formattedStory: string;
    suggestions: string[];
    createdAt: string;
  }>;
}

// Use writable temp dir on serverless (e.g., Vercel), local .data during dev
const ROOT_BASE = process.env.VERCEL ? (process.env.TMPDIR || '/tmp') : process.cwd();
const DATA_DIR = path.join(ROOT_BASE, '.data');
const DATA_FILE = path.join(DATA_DIR, 'team-stories.json');
const TEAM_DIR = path.join(DATA_DIR, 'teams');

function ensureDataFileExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ stories: [] }), 'utf-8');
  }
  if (!fs.existsSync(TEAM_DIR)) {
    fs.mkdirSync(TEAM_DIR, { recursive: true });
  }
}

function readAllStories(): SavedStoryRecord[] {
  try {
    ensureDataFileExists();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.stories) ? parsed.stories : [];
  } catch {
    return [];
  }
}

function writeAllStories(stories: SavedStoryRecord[]): void {
  try {
    ensureDataFileExists();
    const payload = { stories } as const;
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // ignore write errors in non-writable environments
  }
}

export function saveNewStory(params: {
  teamId: string;
  originalInput: string;
  formattedStory: string;
  suggestions: string[];
  teamConfig: TeamConfigStored;
}): SavedStoryRecord {
  const currentStories = readAllStories();
  const record: SavedStoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    teamId: params.teamId,
    originalInput: params.originalInput,
    formattedStory: params.formattedStory,
    suggestions: params.suggestions ?? [],
    createdAt: new Date().toISOString(),
    teamConfigSnapshot: params.teamConfig,
    tweakHistory: [],
  };
  currentStories.push(record);
  writeAllStories(currentStories);
  // Update cached context file
  try { updateTeamContextFile(params.teamId); } catch {}
  return record;
}

export function addTweakToStory(params: {
  storyId: string;
  formattedStory: string;
  suggestions: string[];
  tweakInstructions: string;
}): SavedStoryRecord | null {
  const currentStories = readAllStories();
  const index = currentStories.findIndex(s => s.id === params.storyId);
  if (index === -1) return null;
  const updated = { ...currentStories[index] } as SavedStoryRecord;
  const tweakItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tweakInstructions: params.tweakInstructions,
    formattedStory: params.formattedStory,
    suggestions: params.suggestions ?? [],
    createdAt: new Date().toISOString(),
  };
  updated.formattedStory = params.formattedStory;
  updated.suggestions = params.suggestions ?? [];
  updated.tweakHistory = [tweakItem, ...(updated.tweakHistory ?? [])];
  currentStories[index] = updated;
  writeAllStories(currentStories);
  // Update cached context file
  try { updateTeamContextFile(updated.teamId); } catch {}
  return updated;
}

export function getRecentStoriesForTeam(teamId: string, limit: number = 5): SavedStoryRecord[] {
  const currentStories = readAllStories();
  return currentStories
    .filter(s => s.teamId === teamId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getAllStoriesForTeam(teamId: string): SavedStoryRecord[] {
  const currentStories = readAllStories();
  return currentStories
    .filter(s => s.teamId === teamId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function generateTeamContextText(teamId: string): string {
  const stories = getAllStoriesForTeam(teamId);
  if (stories.length === 0) return 'No prior stories for this team.';
  const lines: string[] = [];
  lines.push(`Team Stories Count: ${stories.length}`);
  lines.push('');
  stories.forEach((s, idx) => {
    lines.push(`Story #${idx + 1} (Created: ${s.createdAt})`);
    lines.push(`Original Input: ${s.originalInput}`);
    lines.push(`User Story: ${s.formattedStory}`);
    if (s.suggestions?.length) {
      lines.push('Suggestions:');
      s.suggestions.forEach(sug => lines.push(`- ${sug}`));
    }
    if (s.tweakHistory?.length) {
      lines.push(`Edits (${s.tweakHistory.length}):`);
      s.tweakHistory.forEach((t, tIdx) => {
        lines.push(`  Edit #${tIdx + 1} at ${t.createdAt}`);
        lines.push(`  Request: ${t.tweakInstructions}`);
        lines.push(`  Updated Story: ${t.formattedStory}`);
        if (t.suggestions?.length) {
          lines.push('  Suggestions:');
          t.suggestions.forEach(sug => lines.push(`  - ${sug}`));
        }
      });
    }
    lines.push('');
  });
  return lines.join('\n');
}

export function updateTeamContextFile(teamId: string): string {
  const context = generateTeamContextText(teamId);
  try {
    if (!fs.existsSync(TEAM_DIR)) {
      fs.mkdirSync(TEAM_DIR, { recursive: true });
    }
    const filePath = path.join(TEAM_DIR, `${teamId}-context.txt`);
    fs.writeFileSync(filePath, context, 'utf-8');
    return context;
  } catch {
    // ignore write errors in non-writable environments
    return context;
  }
}

export function getTeamContextFilePath(teamId: string): string {
  return path.join(TEAM_DIR, `${teamId}-context.txt`);
} 