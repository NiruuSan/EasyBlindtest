function LeaderboardPage({ globalLeaderboard, trendingBlindtests }) {
  return (
    <main className="page leaderboard-page">
      <section className="hero hero-panel">
        <p className="eyebrow">Leaderboard</p>
        <h1>Track the strongest scores and the most-played sources.</h1>
        <p className="hero-copy">
          Trending blindtests reflect actual play activity, while the global board highlights the best
          recent performances submitted across the app.
        </p>
      </section>

      <section className="home-split-grid">
        <section className="panel">
          <div className="section-header">
            <div>
              <h2>Trending blindtests</h2>
              <p>Sources with the most recent play activity in the last two weeks.</p>
            </div>
          </div>
          <div className="stack-list">
            {trendingBlindtests.length > 0 ? (
              trendingBlindtests.map((entry) => (
                <article key={entry.source_id} className="stack-card">
                  <strong>{entry.source_name}</strong>
                  <small>{entry.play_count} recent plays</small>
                </article>
              ))
            ) : (
              <div className="empty-state">Trending sources will appear after players complete games.</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <h2>Recent high scores</h2>
              <p>Top scores submitted across leaderboard-enabled runs.</p>
            </div>
          </div>
          <div className="stack-list">
            {globalLeaderboard.length > 0 ? (
              globalLeaderboard.map((entry) => (
                <article key={entry.id} className="stack-card">
                  <strong>{entry.display_name}</strong>
                  <small>
                    {entry.score} pts • {entry.source_name} • {entry.round_count} songs
                  </small>
                </article>
              ))
            ) : (
              <div className="empty-state">Global scores will appear once players submit leaderboard runs.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default LeaderboardPage
