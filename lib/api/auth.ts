import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function validateApiKey(req: Request): Promise<{ userId: string } | null> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const key = auth.slice(7).trim()
  if (!key) return null

  const keyHash = createHash('sha256').update(key).digest('hex')

  const [found] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1)

  if (!found) return null

  // fire-and-forget lastUsedAt update
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, found.id))
    .catch(() => {})

  return { userId: found.userId }
}
