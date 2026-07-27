type StoredMessage = {
  id: string;
  recipient_id: string;
  sender_id: string;
  sender_role: 'teacher' | 'student';
  content: string;
  sender_name?: string;
  subject?: string;
  created_at: string;
  read_at?: string | null;
};

const STORAGE_KEY = 'edu-nova-student-messages';

function readStorage(): Record<string, StoredMessage[]> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage(data: Record<string, StoredMessage[]>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStoredMessages(recipientId: string): StoredMessage[] {
  const storage = readStorage();
  return storage[recipientId] || [];
}

export function addStoredMessage(message: StoredMessage) {
  const storage = readStorage();
  const recipientMessages = storage[message.recipient_id] || [];
  storage[message.recipient_id] = [...recipientMessages, message];
  writeStorage(storage);
  return message;
}

export function getStoredMessagesBySender(senderId: string): StoredMessage[] {
  const storage = readStorage();
  const allMessages = Object.values(storage).flat();
  return allMessages.filter((message) => message.sender_id === senderId);
}
