// Разблокировка платных пакетов кодом.
// Прототип: проверка в браузере. Перед запуском продаж её нужно перенести на сервер,
// который выдаёт код после оплаты и проверяет его.

const STORAGE_KEY = 'detective-game:unlocked'

// SHA-256 от кода → id пакета
const CODE_HASHES: Record<string, string> = {
  '9471045d44f4b516a702b14719444a5eb86179444350d4073a41c9a0ee991c8b': 'port',
  f80906b2596da63588022d3154aacd8ef91e8a68d1538d9d0383227f04785067: 'snow',
}

const sha256 = async (text: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const loadUnlocked = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

// Возвращает id открытого пакета или null, если код неверный.
export const redeemCode = async (code: string): Promise<string | null> => {
  const packId = CODE_HASHES[await sha256(code.trim().toUpperCase())]
  if (!packId) return null
  const unlocked = new Set([...loadUnlocked(), packId])
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]))
  } catch {
    // без хранилища пакет откроется только до перезагрузки страницы
  }
  return packId
}
