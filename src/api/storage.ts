function saveStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('localStorage 저장 실패 :', e);
    return false;
  }
}

function getStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T[]) : [];
  } catch (e) {
    console.error('localStorage 불러오기 실패 :', e);
    return [];
  }
}

function getStorageItem<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (e) {
    console.error('localStorage 불러오기 실패 :', e);
    return null;
  }
}

function deleteStorage<T extends { id: unknown }>(
  key: string,
  id: T['id']
): void {
  const items = getStorage<T>(key);
  saveStorage(
    key,
    items.filter((item) => item.id !== id)
  );
}

function deleteAllStorage(key: string): void {
  localStorage.removeItem(key);
}

export {
  saveStorage,
  getStorage,
  getStorageItem,
  deleteStorage,
  deleteAllStorage,
};
