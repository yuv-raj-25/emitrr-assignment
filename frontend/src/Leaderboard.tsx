import { useEffect, useState } from 'react'

type LeaderboardEntry = {
  username: string
  wins: number
}

type LeaderboardProps = {
  refreshKey: number
}

const Leaderboard = ({ refreshKey }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const apiBase =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      ''

    const loadLeaderboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/leaderboard`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load leaderboard')
        }
        const data = await response.json()
        const normalized = Array.isArray(data) ? data : data?.leaderboard
        setEntries(normalized ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Unable to load leaderboard')
        }
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()

    return () => controller.abort()
  }, [refreshKey])

  return (
    <div className="leaderboard">
      <h3>Leaderboard</h3>
      {loading && <p className="muted">Loading...</p>}
      {error && <p className="muted">{error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p className="muted">No games yet.</p>
      )}
      <ul>
        {entries.map((entry) => (
          <li key={entry.username}>
            <span>{entry.username}</span>
            <span className="wins">{entry.wins}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Leaderboard
