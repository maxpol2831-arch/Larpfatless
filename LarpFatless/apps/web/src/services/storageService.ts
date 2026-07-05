import type { DiaryEntry, UserProfile } from "../types/nutrition";

const DB_NAME = "larpfatless-pwa";
const DB_VERSION = 2;
const DIARY_STORE = "diary";
const PROFILE_STORE = "profile";
const PROFILE_KEY = "current";

export async function getDiaryEntries() {
  const db = await openDb();
  return new Promise<DiaryEntry[]>((resolve, reject) => {
    const request = db.transaction(DIARY_STORE, "readonly").objectStore(DIARY_STORE).getAll();
    request.onsuccess = () => resolve((request.result as DiaryEntry[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

export async function saveDiaryEntry(entry: DiaryEntry) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(DIARY_STORE, "readwrite").objectStore(DIARY_STORE).put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDiaryEntry(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(DIARY_STORE, "readwrite").objectStore(DIARY_STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearDiary() {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(DIARY_STORE, "readwrite").objectStore(DIARY_STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getProfile() {
  const db = await openDb();
  return new Promise<UserProfile | null>((resolve, reject) => {
    const request = db.transaction(PROFILE_STORE, "readonly").objectStore(PROFILE_STORE).get(PROFILE_KEY);
    request.onsuccess = () => resolve((request.result as UserProfile | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProfile(profile: UserProfile) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(PROFILE_STORE, "readwrite").objectStore(PROFILE_STORE).put(profile, PROFILE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DIARY_STORE)) {
        db.createObjectStore(DIARY_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
