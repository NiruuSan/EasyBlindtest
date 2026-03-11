import { useEffect, useState } from 'react'
import { fetchOneVOneMatch } from '../lib/competitive'

export default function MatchLobbyPage({
  currentUserId,
  waitingMatch,
  onStartMatch,
  onMatchStarted,
  onLeave,
}) {
  const [match, setMatch] = useState(waitingMatch)
  const [pollError, setPollError] = useState('')
  const isCreator = waitingMatch?.created_by === currentUserId
  const opponentJoined = !!match?.opponent_id

  useEffect(() => {
    if (!waitingMatch?.id) return

    const poll = async () => {
      try {
        const updated = await fetchOneVOneMatch(waitingMatch.id)
        setMatch(updated)

        if (!isCreator && updated.status === 'active') {
          onMatchStarted()
        }
      } catch {
        setPollError('Lost connection. Please refresh.')
      }
    }

    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [waitingMatch, isCreator, onMatchStarted])

  if (!waitingMatch) {
    return (
      <div className="page-container">
        <p>No active match lobby.</p>
        <button type="button" className="secondary-button" onClick={onLeave}>
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-hero">
        <p className="eyebrow">1V1 MODE</p>
        <h1>{isCreator ? 'Waiting room' : 'Waiting for host'}</h1>
        <p className="description">
          {isCreator
            ? 'Share the code below with your opponent. Start the game once they join.'
            : 'The host will start the game once both players are ready.'}
        </p>
      </div>

      <div className="panel">
        <div className="panel-section">
          <div className="match-meta">
            <div className="meta-item">
              <span className="meta-label">Artist</span>
              <span className="meta-value">{waitingMatch.source_name}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Rounds</span>
              <span className="meta-value">{waitingMatch.round_count} songs</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Type</span>
              <span className="meta-value">{waitingMatch.match_type}</span>
            </div>
          </div>
        </div>

        {isCreator && (
          <div className="panel-section">
            <p className="section-label">Match code</p>
            <div className="join-code-display">
              <span className="join-code-text">{waitingMatch.join_code}</span>
            </div>
            <p className="hint-text">Share this code with your opponent.</p>
          </div>
        )}

        <div className="panel-section">
          <p className="section-label">Status</p>
          {opponentJoined ? (
            <div className="status-ready">
              <span className="status-dot ready" />
              <span>Opponent has joined!</span>
            </div>
          ) : (
            <div className="status-waiting">
              <span className="status-dot waiting" />
              <span>Waiting for opponent…</span>
            </div>
          )}
        </div>

        {pollError && <p className="error-text">{pollError}</p>}

        <div className="panel-actions">
          {isCreator && opponentJoined && (
            <button type="button" className="primary-button" onClick={onStartMatch}>
              Start game
            </button>
          )}
          <button type="button" className="secondary-button" onClick={onLeave}>
            Leave lobby
          </button>
        </div>
      </div>
    </div>
  )
}
