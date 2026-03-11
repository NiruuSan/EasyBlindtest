import { isSupabaseConfigured } from '../lib/supabase'

function LeaderboardGroup({ title, boards, roundCount }) {
  if (boards.length === 0) {
    return null
  }

  return (
    <section className="leaderboard-section">
      <div className="section-header">
        <div>
          <h3>{title}</h3>
          <p>Top scores for the {roundCount}-song version of the sources used in this run.</p>
        </div>
      </div>

      <div className="leaderboard-grid">
        {boards.map((board) => (
          <div key={`${board.type}-${board.id}`} className="leaderboard-card">
            <div className="leaderboard-card-header">
              <strong>{board.name}</strong>
              <small>
                {board.type === 'artist' ? 'Artist leaderboard' : 'Playlist leaderboard'} •{' '}
                {board.roundCount} songs
              </small>
            </div>

            {board.entries.length === 0 ? (
              <div className="empty-state leaderboard-empty">No scores yet. Be the first to submit one.</div>
            ) : (
              <div className="leaderboard-list">
                {board.entries.map((entry, index) => (
                  <div key={entry.id} className="leaderboard-item">
                    <span className="leaderboard-rank">#{index + 1}</span>
                    <div className="leaderboard-entry-text">
                      <strong>{entry.display_name}</strong>
                      <small>
                        {entry.score} pts • {entry.correct_answers}/{entry.total_rounds} correct •{' '}
                        {entry.accuracy}% accuracy
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function GamePage({
  audioBlocked,
  audioReady,
  currentRound,
  finalAccuracy,
  formatScoreLabel,
  gameState,
  goToNextRound,
  hasRounds,
  history,
  leaderboardError,
  leaderboardState,
  leaderboardTargets,
  liveScoreboard,
  onBackToSetup,
  onNameChange,
  onSubmitScore,
  playerName,
  progressPercent,
  replaySnippet,
  restartGame,
  roundCount,
  roundIndex,
  roundResult,
  rounds,
  score,
  sessionMode,
  submissionError,
  submissionState,
  submitAnswer,
  timeLeftMs,
}) {
  if (!hasRounds) {
    return (
      <main className="page game-page">
        <section className="panel game-panel empty-game-panel">
          <div className="panel-header">
            <div>
              <h2>No active blindtest</h2>
              <p>Go back to a mode page to create or join a new session.</p>
            </div>
          </div>

          <button type="button" className="primary-button" onClick={onBackToSetup}>
            Go back
          </button>
        </section>
      </main>
    )
  }

  const maxPossibleScore = rounds.length * 100

  return (
    <main className="page game-page">
      <section className="panel game-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{sessionMode === 'one_v_one' ? '1v1 match' : sessionMode === 'multiplayer' ? 'Multiplayer lobby' : 'Solo run'}</p>
            <h2>Game</h2>
            <p>Listen fast, answer faster, and protect your score.</p>
          </div>
          <div className="game-header-actions">
            <button type="button" className="text-button" onClick={onBackToSetup}>
              Back
            </button>
            <span className="score-pill">
              {score} / {maxPossibleScore}
            </span>
          </div>
        </div>

        {(gameState === 'playing' || gameState === 'review') && currentRound ? (
          <div className="game-round">
            <div className="progress-row">
              <span>
                Round {roundIndex + 1} / {rounds.length}
              </span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-value" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="timer-card">
              <div>
                <strong>{Math.max(0, Math.ceil(timeLeftMs / 1000))} seconds left</strong>
                <p>{formatScoreLabel(timeLeftMs)}</p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={replaySnippet}
                disabled={!audioReady}
              >
                Replay clip
              </button>
            </div>

            {audioBlocked ? (
              <div className="warning-banner">
                Your browser blocked autoplay. Press replay clip to start the audio.
              </div>
            ) : null}

            <div className="choices-grid">
              {currentRound.options.map((option, optionIndex) => {
                const isCorrectChoice = roundResult?.correctTrack.id === option.id
                const isSelectedChoice = roundResult?.selectedOption?.id === option.id
                const choiceClassName =
                  gameState === 'review'
                    ? isCorrectChoice
                      ? 'choice-button correct'
                      : isSelectedChoice
                        ? 'choice-button incorrect'
                        : 'choice-button muted'
                    : 'choice-button'

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={choiceClassName}
                    onClick={() => submitAnswer(option)}
                    disabled={gameState !== 'playing'}
                  >
                    <span className="choice-index">{optionIndex + 1}</span>
                    {option.artwork ? (
                      <img src={option.artwork} alt={option.collectionName} className="choice-artwork" />
                    ) : (
                      <div className="choice-artwork placeholder" aria-hidden="true" />
                    )}
                    <div>
                      <strong>{option.displayTitle ?? option.title}</strong>
                      <small>{option.displaySubtitle ?? option.artistName}</small>
                    </div>
                  </button>
                )
              })}
            </div>

            {gameState === 'review' && roundResult ? (
              <div className={roundResult.isCorrect ? 'result-card success' : 'result-card fail'}>
                <div className={roundResult.isCorrect ? 'result-banner success' : 'result-banner fail'}>
                  <span>{roundResult.isCorrect ? 'Correct answer' : 'Wrong answer'}</span>
                  <strong className={roundResult.isCorrect ? 'points-burst success' : 'points-burst fail'}>
                    {roundResult.earnedPoints} pts
                  </strong>
                </div>

                <div className="track-reveal">
                  {roundResult.correctTrack.artwork ? (
                    <img
                      src={roundResult.correctTrack.artwork}
                      alt={roundResult.correctTrack.displayTitle ?? roundResult.correctTrack.title}
                      className="artwork"
                    />
                  ) : null}

                  <div>
                    <p className="reveal-label">Correct answer</p>
                    <h3>{roundResult.correctTrack.displayTitle ?? roundResult.correctTrack.title}</h3>
                    <p>
                      {roundResult.correctTrack.displayTitle &&
                      roundResult.correctTrack.displayTitle !== roundResult.correctTrack.title
                        ? `${roundResult.correctTrack.title} • ${roundResult.correctTrack.artistName}`
                        : roundResult.correctTrack.artistName}
                    </p>
                    <small>{roundResult.correctTrack.collectionName}</small>
                  </div>
                </div>

                <button type="button" className="primary-button" onClick={goToNextRound}>
                  {roundIndex === rounds.length - 1 ? 'See final score' : 'Next song'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {gameState === 'finished' ? (
          <div className="final-score">
            <p className="eyebrow">EasyBlindtest complete</p>
            <h2>{score} points</h2>
            <p>
              You answered {history.filter((item) => item.isCorrect).length} of {history.length} songs
              correctly with an accuracy of {finalAccuracy}%.
            </p>

            <div className="history-list">
              {history.map((item) => (
                <div key={item.roundNumber} className="history-item">
                  <div>
                    <strong>
                      Round {item.roundNumber}: {item.correctTrack.displayTitle ?? item.correctTrack.title}
                    </strong>
                    <small>
                      {item.correctTrack.displayTitle &&
                      item.correctTrack.displayTitle !== item.correctTrack.title
                        ? `${item.correctTrack.title} • ${item.correctTrack.artistName}`
                        : item.correctTrack.artistName}
                    </small>
                  </div>
                  <span className={item.isCorrect ? 'history-score success-text' : 'history-score'}>
                    {item.earnedPoints} pts
                  </span>
                </div>
              ))}
            </div>

            {sessionMode === 'multiplayer' && liveScoreboard.length > 0 ? (
              <section className="leaderboard-section">
                <div className="section-header">
                  <div>
                    <h3>Live room standings</h3>
                    <p>The scoreboard updates from lobby answer data.</p>
                  </div>
                </div>
                <div className="leaderboard-list">
                  {liveScoreboard.map((entry, index) => (
                    <div key={entry.user_id ?? entry.id} className="leaderboard-item">
                      <span className="leaderboard-rank">#{index + 1}</span>
                      <div className="leaderboard-entry-text">
                        <strong>{entry.display_name}</strong>
                        <small>
                          {entry.score} pts • {entry.correctAnswers ?? 0} correct
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="final-score-actions">
              <button type="button" className="secondary-button" onClick={onBackToSetup}>
                Back
              </button>
              <button type="button" className="primary-button" onClick={restartGame}>
                Build another blindtest
              </button>
            </div>

            {isSupabaseConfigured && sessionMode === 'solo' ? (
              <div className="leaderboard-submit-card">
                <div className="section-header">
                  <div>
                    <h3>Submit your score</h3>
                    <p>
                      Your score will be posted to {leaderboardTargets.length} relevant leaderboard
                      {leaderboardTargets.length === 1 ? '' : 's'} for the {roundCount}-song mode.
                    </p>
                  </div>
                </div>

                <div className="leaderboard-submit-row">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(event) => onNameChange(event.target.value)}
                    maxLength={32}
                  />
                  <button
                    type="button"
                    className="primary-button compact-button"
                    onClick={onSubmitScore}
                    disabled={submissionState === 'submitting' || playerName.trim().length === 0}
                  >
                    {submissionState === 'submitting' ? 'Submitting...' : 'Submit score'}
                  </button>
                </div>

                {submissionState === 'success' ? (
                  <p className="helper-text">Score submitted successfully.</p>
                ) : null}
                {submissionError ? <p className="error-text">{submissionError}</p> : null}
              </div>
            ) : null}

            {leaderboardState === 'loading' ? <p className="helper-text">Loading leaderboards...</p> : null}
            {leaderboardError ? <p className="error-text">{leaderboardError}</p> : null}

            {leaderboardState === 'loaded' ? (
              <>
                <LeaderboardGroup
                  title="Artist leaderboards"
                  boards={leaderboardTargets.filter((board) => board.type === 'artist')}
                  roundCount={roundCount}
                />
                <LeaderboardGroup
                  title="Playlist leaderboards"
                  boards={leaderboardTargets.filter((board) => board.type === 'playlist')}
                  roundCount={roundCount}
                />
              </>
            ) : null}
          </div>
        ) : null}

        {gameState === 'loading' ? (
          <div className="game-placeholder single-column">
            <div className="placeholder-card">
              <span className="placeholder-number">Loading</span>
              <p>Preparing tracks and answer choices for your next blindtest.</p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default GamePage
