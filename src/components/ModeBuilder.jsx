const ROUND_OPTIONS = [5, 10, 15, 20]

function ModeBuilder({
  title,
  eyebrow,
  description,
  badgeLabel,
  gameState,
  gameError,
  playlistError,
  searchError,
  searchResults,
  searchState,
  searchTerm,
  setSearchError,
  setSearchResults,
  setSearchState,
  setSearchTerm,
  addArtist,
  applyPlaylist,
  manualArtists,
  selectedPlaylists,
  removeArtist,
  removePlaylist,
  clearSelectedArtists,
  roundCount,
  setRoundCount,
  submitLabel,
  onSubmit,
  submitDisabled,
  showArtistSearch = true,
  showPlaylists = true,
  playlists = [],
  beforeAction = null,
}) {
  const selectionCount = manualArtists.length + selectedPlaylists.length

  return (
    <main className="page mode-page">
      <section className="hero hero-panel">
        <p className="eyebrow">{eyebrow}</p>
        <div className="hero-stack">
          <div>
            <h1>{title}</h1>
            <p className="hero-copy">{description}</p>
          </div>
          {badgeLabel ? <span className="badge">{badgeLabel}</span> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Build your blindtest</h2>
            <p>Choose your source, tune the length, then launch the game.</p>
          </div>
          {selectionCount > 0 ? <span className="badge">{selectionCount} sources selected</span> : null}
        </div>

        {showArtistSearch ? (
          <>
            <label className="field-label" htmlFor="artist-search">
              Search artists
            </label>
            <input
              id="artist-search"
              className="search-input"
              type="text"
              placeholder="Try Daft Punk, Adele, Stromae..."
              value={searchTerm}
              onChange={(event) => {
                const nextValue = event.target.value
                setSearchTerm(nextValue)

                if (nextValue.trim().length < 2) {
                  setSearchResults([])
                  setSearchError('')
                  setSearchState('idle')
                }
              }}
              disabled={gameState === 'loading'}
            />

            {searchState === 'loading' ? <p className="helper-text">Searching artists...</p> : null}
            {searchError ? <p className="error-text">{searchError}</p> : null}

            {searchResults.length > 0 ? (
              <div className="search-results">
                {searchResults.map((artist) => (
                  <button
                    key={artist.artistId}
                    type="button"
                    className="search-result"
                    onClick={() => addArtist(artist)}
                  >
                    {artist.artwork ? (
                      <img src={artist.artwork} alt={artist.artistName} className="artist-artwork" />
                    ) : (
                      <div className="artist-artwork placeholder" aria-hidden="true" />
                    )}
                    <div className="search-result-content">
                      <span>{artist.artistName}</span>
                      <small>{artist.primaryGenreName}</small>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {showPlaylists ? (
          <div className="section-spacer">
            <div className="section-header">
              <div>
                <h3>Premade playlists</h3>
                <p>Browse curated playlists and thematic blindtests.</p>
              </div>
            </div>

            <div className="playlist-row">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="playlist-card">
                  <div className="playlist-meta">
                    <span className="playlist-tag">{playlist.category}</span>
                    <h4>{playlist.title}</h4>
                    <p>{playlist.description}</p>
                    <small>
                      {playlist.type === 'track'
                        ? `${playlist.queries.length} prompts curated`
                        : `${playlist.artists.length} artists curated`}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="secondary-button playlist-action"
                    onClick={() => applyPlaylist(playlist)}
                    disabled={
                      gameState === 'loading' ||
                      selectedPlaylists.some((selectedPlaylist) => selectedPlaylist.id === playlist.id)
                    }
                  >
                    {selectedPlaylists.some((selectedPlaylist) => selectedPlaylist.id === playlist.id)
                      ? 'Added'
                      : 'Add playlist'}
                  </button>
                </div>
              ))}
            </div>

            {playlistError ? <p className="error-text">{playlistError}</p> : null}
          </div>
        ) : null}

        <div className="section-spacer">
          <div className="section-header">
            <div>
              <h3>Selected sources</h3>
              <p>Mix manual artists with playlists, or focus on one approach.</p>
            </div>
          </div>

          {selectionCount > 0 ? (
            <button type="button" className="text-button" onClick={clearSelectedArtists}>
              Clear all selections
            </button>
          ) : null}

          {selectionCount === 0 ? (
            <div className="empty-state">Add at least one artist or playlist to continue.</div>
          ) : (
            <div className="chip-list">
              {selectedPlaylists.map((playlist) => (
                <div key={playlist.id} className="artist-chip playlist-chip">
                  <div>
                    <strong>{playlist.title}</strong>
                    <small>
                      {playlist.category} playlist •{' '}
                      {playlist.type === 'track'
                        ? `${playlist.queries.length} prompts`
                        : `${playlist.artists.length} artists`}
                    </small>
                  </div>
                  <button type="button" onClick={() => removePlaylist(playlist.id)}>
                    Remove
                  </button>
                </div>
              ))}

              {manualArtists.map((artist) => (
                <div key={artist.artistId} className="artist-chip">
                  <div>
                    <strong>{artist.artistName}</strong>
                    <small>{artist.primaryGenreName}</small>
                  </div>
                  <button type="button" onClick={() => removeArtist(artist.artistId)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-spacer">
          <div className="section-header">
            <div>
              <h3>Blindtest length</h3>
              <p>Each round lasts 30 seconds with 4 possible answers.</p>
            </div>
          </div>

          <div className="length-grid">
            {ROUND_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={option === roundCount ? 'length-option active' : 'length-option'}
                onClick={() => setRoundCount(option)}
                disabled={gameState === 'loading'}
              >
                {option} songs
              </button>
            ))}
          </div>
        </div>

        {beforeAction}

        {gameError ? <p className="error-text">{gameError}</p> : null}

        <button
          type="button"
          className="primary-button"
          onClick={onSubmit}
          disabled={submitDisabled || gameState === 'loading'}
        >
          {gameState === 'loading' ? 'Preparing blindtest...' : submitLabel}
        </button>
      </section>
    </main>
  )
}

export default ModeBuilder
