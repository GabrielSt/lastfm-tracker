import fs from 'fs';
import path from 'path';
import { Config, Snapshot } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// ── Config ──────────────────────────────────────────────────────────────────

export function readConfig(): Config {
  ensureDirs();
  if (!fs.existsSync(CONFIG_FILE)) {
    return { username: '', apiKey: '', maxPages: 0 };
  }
  const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(raw) as Config;
}

export function writeConfig(config: Config): void {
  ensureDirs();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// ── Snapshots ────────────────────────────────────────────────────────────────

export function listSnapshots(): string[] {
  ensureDirs();
  return fs
    .readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort(); // YYYY-MM-DD.json → ordem cronológica
}

export function readSnapshot(date: string): Snapshot | null {
  const file = path.join(SNAPSHOTS_DIR, `${date}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as Snapshot;
}

export function writeSnapshot(snapshot: Snapshot): void {
  ensureDirs();
  const file = path.join(SNAPSHOTS_DIR, `${snapshot.date}.json`);
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf-8');
}

export function getLatestSnapshot(): Snapshot | null {
  const snapshots = listSnapshots();
  if (snapshots.length === 0) return null;
  const latest = snapshots[snapshots.length - 1].replace('.json', '');
  return readSnapshot(latest);
}

export function getPreviousSnapshot(): Snapshot | null {
  const snapshots = listSnapshots();
  if (snapshots.length < 2) return null;
  const prev = snapshots[snapshots.length - 2].replace('.json', '');
  return readSnapshot(prev);
}

export function getAllSnapshotDates(): string[] {
  return listSnapshots().map(f => f.replace('.json', ''));
}
