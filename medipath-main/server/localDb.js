import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'local_db.json');

// Initialize DB if it doesn't exist
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({ sessions: {}, reminders: [] }, null, 2));
  }
}

export async function readDB() {
  await initDB();
  let data = await fs.readFile(DB_PATH, 'utf-8');
  // Strip UTF-8 BOM if present (Windows PowerShell adds it)
  data = data.replace(/^\uFEFF/, '');
  return JSON.parse(data);
}

export async function writeDB(data) {
  // Write without BOM using explicit utf8 encoding via Buffer
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), { encoding: 'utf8' });
}

export async function getSession(from) {
  const db = await readDB();
  return db.sessions[from] || null;
}

export async function saveSession(from, sessionData) {
  const db = await readDB();
  db.sessions[from] = sessionData;
  await writeDB(db);
}

export async function addReminder(reminder) {
  const db = await readDB();
  db.reminders.push(reminder);
  await writeDB(db);
}

export async function getPendingReminders(timeStr) {
  const db = await readDB();
  return db.reminders.filter(r => r.time === timeStr && !r.sent);
}

export async function markReminderSent(reminderIndex) {
  const db = await readDB();
  db.reminders[reminderIndex].sent = true;
  await writeDB(db);
}
