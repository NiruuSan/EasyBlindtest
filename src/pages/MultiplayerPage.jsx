import ModeBuilder from '../components/ModeBuilder'

function MultiplayerPage({
  joinCode,
  setJoinCode,
  onJoinLobby,
  currentLobby,
  lobbyPlayers,
  liveScoreboard,
  onStartLobby,
  publicLobbies,
  ...builderProps
}) {
  const beforeAction = (
    <>
      <div className="section-spacer">
        <div className="section-header">
          <div>
            <h3>Join a lobby</h3>
            <p>Same-room sessions use a short code that the host can share with everyone.</p>
          </div>
        </div>
        <div className="inline-form-row">
          <input
            type="text"
            className="search-input"
            placeholder="Enter lobby code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          />
          <button type="button" className="secondary-button compact-button" onClick={onJoinLobby}>
            Join lobby
          </button>
        </div>
      </div>

      <div className="section-spacer split-board">
        <div className="stack-list">
          <h4>Open lobbies</h4>
          {publicLobbies.length > 0 ? (
            publicLobbies.map((lobby) => (
              <article key={lobby.id} className="stack-card">
                <strong>{lobby.source_name}</strong>
                <small>
                  Code {lobby.join_code} • {lobby.round_count} songs
                </small>
              </article>
            ))
          ) : (
            <div className="empty-state">No open lobbies are currently waiting.</div>
          )}
        </div>

        <div className="stack-list">
          <h4>Current lobby</h4>
          {currentLobby ? (
            <div className="stack-card stack-card-strong">
              <strong>{currentLobby.source_name}</strong>
              <small>
                Code {currentLobby.join_code} • {currentLobby.status}
              </small>
              <div className="stack-list compact-list">
                <strong>Players</strong>
                {lobbyPlayers.map((player) => (
                  <small key={player.id}>
                    {player.display_name}
                    {player.is_host ? ' (host)' : ''}
                  </small>
                ))}
              </div>
              <button type="button" className="primary-button compact-button" onClick={onStartLobby}>
                Start lobby
              </button>
            </div>
          ) : (
            <div className="empty-state">Create or join a lobby to prepare a shared room session.</div>
          )}
        </div>
      </div>

      {currentLobby ? (
        <div className="section-spacer">
          <div className="section-header">
            <div>
              <h3>Live scoreboard</h3>
              <p>Player answers stream into the room scoreboard as the lobby progresses.</p>
            </div>
          </div>
          <div className="stack-list">
            {liveScoreboard.length > 0 ? (
              liveScoreboard.map((entry) => (
                <article key={entry.id} className="stack-card">
                  <strong>{entry.display_name}</strong>
                  <small>
                    {entry.score} pts • {entry.correctAnswers} correct
                  </small>
                </article>
              ))
            ) : (
              <div className="empty-state">Scores will appear here once players begin answering.</div>
            )}
          </div>
        </div>
      ) : null}
    </>
  )

  return (
    <ModeBuilder
      {...builderProps}
      eyebrow="Multiplayer Mode"
      title="Host a same-room blindtest and launch everyone together."
      description="Create a lobby, share the join code, and start a synchronized room session when everyone is ready."
      submitLabel="Create multiplayer lobby"
      showArtistSearch
      showPlaylists
      beforeAction={beforeAction}
    />
  )
}

export default MultiplayerPage
