import { Link } from 'react-router-dom'

function HomePage({ trendingBlindtests, publicMatches, publicLobbies }) {
  const modeCards = [
    {
      title: 'Artist Mode',
      description: 'Build a solo blindtest around one or more artists you choose yourself.',
      href: '/artist-mode',
    },
    {
      title: 'Playlist Mode',
      description: 'Jump into premade decade, genre, movie, game, anime, and Disney playlists.',
      href: '/playlist-mode',
    },
    {
      title: '1v1 Mode',
      description: 'Create async public or private matches and battle on the exact same round set.',
      href: '/one-v-one',
    },
    {
      title: 'Multiplayer Mode',
      description: 'Host a same-room lobby, share a join code, and start everyone together.',
      href: '/multiplayer',
    },
  ]

  return (
    <main className="page home-page">
      <section className="hero home-hero">
        <div className="hero-copy-block">
          <p className="eyebrow">EasyBlindtest</p>
          <h1>Play solo, challenge friends, or host the room.</h1>
          <p className="hero-copy">
            Discover trending blindtests, launch solo runs by artist or playlist, create async 1v1
            matches, and host local multiplayer sessions from one hub.
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/artist-mode" className="primary-button compact-link-button">
            Start a blindtest
          </Link>
          <Link to="/one-v-one" className="secondary-button compact-link-button">
            Open 1v1 hub
          </Link>
        </div>
      </section>

      <section className="panel discovery-panel">
        <div className="section-header">
          <div>
            <h2>Trending Blindtests</h2>
            <p>The most-played artists and playlists on EasyBlindtest right now.</p>
          </div>
        </div>

        <div className="media-card-grid">
          {(trendingBlindtests.length > 0 ? trendingBlindtests : Array.from({ length: 6 })).map((entry, index) => (
            <article key={entry?.source_id ?? `placeholder-${index}`} className="media-card">
              {entry?.cover_url ? (
                <img src={entry.cover_url} alt={entry.source_name} className="media-card-cover" />
              ) : (
                <div className="media-card-cover placeholder" aria-hidden="true" />
              )}
              <div className="media-card-body">
                <strong>{entry?.source_name ?? 'Coming soon'}</strong>
                <small>
                  {entry ? `${entry.play_count} recent plays` : 'Popular modes and sources will appear here'}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h2>Choose a mode</h2>
            <p>Each mode is built around a dedicated flow instead of one overloaded setup page.</p>
          </div>
        </div>

        <div className="mode-card-grid">
          {modeCards.map((card) => (
            <Link key={card.href} to={card.href} className="mode-card">
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <span className="mode-card-link">Open mode</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-split-grid">
        <section className="panel">
          <div className="section-header">
            <div>
              <h2>Public 1v1 Matches</h2>
              <p>Join waiting public challenges and replay the same snapshot as your opponent.</p>
            </div>
          </div>
          <div className="stack-list">
            {publicMatches.length > 0 ? (
              publicMatches.slice(0, 5).map((match) => (
                <article key={match.id} className="stack-card">
                  <strong>{match.source_name}</strong>
                  <small>
                    {match.match_type} • {match.round_count} songs
                  </small>
                </article>
              ))
            ) : (
              <div className="empty-state">No public matches are waiting yet.</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <h2>Live Multiplayer Lobbies</h2>
              <p>Same-room lobbies can be created in seconds and shared with a short code.</p>
            </div>
          </div>
          <div className="stack-list">
            {publicLobbies.length > 0 ? (
              publicLobbies.slice(0, 5).map((lobby) => (
                <article key={lobby.id} className="stack-card">
                  <strong>{lobby.source_name}</strong>
                  <small>
                    Code {lobby.join_code} • {lobby.round_count} songs
                  </small>
                </article>
              ))
            ) : (
              <div className="empty-state">No multiplayer lobbies are waiting right now.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default HomePage
