import ModeBuilder from '../components/ModeBuilder'

function OneVOnePage({
  activeTab,
  setActiveTab,
  visibility,
  setVisibility,
  joinCode,
  setJoinCode,
  onJoinPrivateMatch,
  onJoinPublicMatch,
  myMatches,
  publicMatches,
  ...builderProps
}) {
  const beforeAction = (
    <>
      <div className="section-spacer">
        <div className="section-header">
          <div>
            <h3>Match type</h3>
            <p>Create private challenges or publish a match in the open queue.</p>
          </div>
        </div>
        <div className="segmented-row">
          <button
            type="button"
            className={activeTab === 'unranked' ? 'length-option active' : 'length-option'}
            onClick={() => setActiveTab('unranked')}
          >
            Unranked
          </button>
          <button
            type="button"
            className={activeTab === 'ranked' ? 'length-option active' : 'length-option'}
            onClick={() => setActiveTab('ranked')}
          >
            Ranked
          </button>
        </div>
      </div>

      <div className="section-spacer">
        <div className="section-header">
          <div>
            <h3>Visibility</h3>
            <p>Public matches appear in the queue, private matches generate a friend code.</p>
          </div>
        </div>
        <div className="segmented-row">
          <button
            type="button"
            className={visibility === 'public' ? 'length-option active' : 'length-option'}
            onClick={() => setVisibility('public')}
          >
            Public
          </button>
          <button
            type="button"
            className={visibility === 'private' ? 'length-option active' : 'length-option'}
            onClick={() => setVisibility('private')}
          >
            Private
          </button>
        </div>
      </div>

      <div className="section-spacer">
        <div className="section-header">
          <div>
            <h3>Join a private match</h3>
            <p>Paste the code a friend shared to load the exact same challenge snapshot.</p>
          </div>
        </div>
        <div className="inline-form-row">
          <input
            type="text"
            className="search-input"
            placeholder="Enter match code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          />
          <button type="button" className="secondary-button compact-button" onClick={onJoinPrivateMatch}>
            Join
          </button>
        </div>
      </div>

      <div className="section-spacer">
        <div className="section-header">
          <div>
            <h3>Public queue</h3>
            <p>Waiting matches are visible here until an opponent claims them.</p>
          </div>
        </div>
        <div className="split-board">
          <div className="stack-list">
            <h4>Waiting matches</h4>
            {publicMatches.length > 0 ? (
              publicMatches.map((match) => (
                <article key={match.id} className="stack-card">
                  <strong>{match.source_name}</strong>
                  <small>
                    {match.match_type} • {match.round_count} songs
                  </small>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    onClick={() => onJoinPublicMatch(match.id)}
                  >
                    Join match
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">No public matches are currently waiting for an opponent.</div>
            )}
          </div>
          <div className="stack-list">
            <h4>My matches</h4>
            {myMatches.length > 0 ? (
              myMatches.map((match) => (
                <article key={match.id} className="stack-card">
                  <strong>{match.source_name}</strong>
                  <small>
                    {match.status} • {match.match_type}
                  </small>
                  {match.join_code ? <small>Private code: {match.join_code}</small> : null}
                </article>
              ))
            ) : (
              <div className="empty-state">You have not created or joined a 1v1 match yet.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <ModeBuilder
      {...builderProps}
      eyebrow="1v1 Mode"
      title="Create async duels and settle them on identical blindtest snapshots."
      description="Choose a source, create a private or public match, play immediately, and let the other player answer whenever they join."
      submitLabel={activeTab === 'ranked' ? 'Create ranked match' : 'Create unranked match'}
      showArtistSearch
      showPlaylists
      beforeAction={beforeAction}
    />
  )
}

export default OneVOnePage
