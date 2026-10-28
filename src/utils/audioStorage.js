// IndexedDB Storage for User's Custom Audio Files (e.g. 5-minute MP3s, WAV, M4A from phone)
const DB_NAME = 'OpenTick_Audio_DB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_audio';
const RECORD_KEY = 'active_custom_alarm';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save custom audio file (reads as Data URL and stores in IndexedDB)
 * @param {File} file 
 * @returns {Promise<{name: string, size: number, type: string, dataUrl: string}>}
 */
export async function saveCustomAudioFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const record = {
          name: file.name,
          size: file.size,
          type: file.type || 'audio/mpeg',
          dataUrl: reader.result,
          updatedAt: new Date().toISOString()
        };
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record, RECORD_KEY);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Retrieve stored custom audio record
 * @returns {Promise<{name: string, size: number, type: string, dataUrl: string} | null>}
 */
export async function getCustomAudioFile() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(RECORD_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Error reading custom audio from IndexedDB', e);
    return null;
  }
}

/**
 * Remove stored custom audio file
 */
export async function removeCustomAudioFile() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(RECORD_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Error removing custom audio', e);
    return false;
  }
}
