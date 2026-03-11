function AccountPage({
  session,
  profile,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authDisplayName,
  setAuthDisplayName,
  authError,
  authNotice,
  authState,
  onSubmitAuth,
  onSignOut,
  onSaveDisplayName,
}) {
  return (
    <main className="page account-page">
      <section className="hero hero-panel">
        <p className="eyebrow">Account</p>
        <h1>{session ? 'Manage your profile and ranked identity.' : 'Sign in to unlock ranked and competitive modes.'}</h1>
        <p className="hero-copy">
          Ranked 1v1, profile history, ELO, and multiplayer identity all rely on a persistent account.
        </p>
      </section>

      <section className="home-split-grid">
        <section className="panel">
          <div className="section-header">
            <div>
              <h2>{session ? 'Profile' : 'Authenticate'}</h2>
              <p>{session ? 'Update your display name and review your ranked snapshot.' : 'Use email and password authentication through Supabase Auth.'}</p>
            </div>
          </div>

          {session ? (
            <div className="stack-list">
              <div className="stack-card stack-card-strong">
                <strong>{profile?.display_name ?? 'Player'}</strong>
                <small>{session.user.email}</small>
              </div>
              <div className="inline-form-row">
                <input
                  type="text"
                  className="search-input"
                  value={authDisplayName}
                  onChange={(event) => setAuthDisplayName(event.target.value)}
                  placeholder="Update display name"
                />
                <button type="button" className="secondary-button compact-button" onClick={onSaveDisplayName}>
                  Save
                </button>
              </div>
              <div className="stat-grid">
                <article className="stack-card">
                  <strong>{profile?.ranked_elo ?? 1000}</strong>
                  <small>Ranked ELO</small>
                </article>
                <article className="stack-card">
                  <strong>{profile?.ranked_wins ?? 0}</strong>
                  <small>Wins</small>
                </article>
                <article className="stack-card">
                  <strong>{profile?.ranked_losses ?? 0}</strong>
                  <small>Losses</small>
                </article>
              </div>
              <button type="button" className="primary-button" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <div className="stack-list">
              <div className="segmented-row">
                <button
                  type="button"
                  className={authMode === 'signin' ? 'length-option active' : 'length-option'}
                  onClick={() => setAuthMode('signin')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={authMode === 'signup' ? 'length-option active' : 'length-option'}
                  onClick={() => setAuthMode('signup')}
                >
                  Create account
                </button>
              </div>
              {authMode === 'signup' ? (
                <input
                  type="text"
                  className="search-input"
                  placeholder="Display name"
                  value={authDisplayName}
                  onChange={(event) => setAuthDisplayName(event.target.value)}
                />
              ) : null}
              <input
                type="email"
                className="search-input"
                placeholder="Email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
              />
              <input
                type="password"
                className="search-input"
                placeholder="Password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
              />
              {authNotice ? <p className="helper-text">{authNotice}</p> : null}
              {authError ? <p className="error-text">{authError}</p> : null}
              <button type="button" className="primary-button" onClick={onSubmitAuth} disabled={authState === 'loading'}>
                {authState === 'loading'
                  ? 'Working...'
                  : authMode === 'signin'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <h2>Competitive unlocks</h2>
              <p>Accounts are used to keep async matches, ranked standings, and room identity consistent.</p>
            </div>
          </div>
          <div className="stack-list">
            <article className="stack-card">
              <strong>Ranked 1v1</strong>
              <small>Persistent ELO, wins, losses, and future matchmaking improvements.</small>
            </article>
            <article className="stack-card">
              <strong>Async challenge history</strong>
              <small>Track public and private matches you created, joined, won, or lost.</small>
            </article>
            <article className="stack-card">
              <strong>Multiplayer identity</strong>
              <small>Your lobby presence and scoreboard name stay consistent across sessions.</small>
            </article>
          </div>
        </section>
      </section>
    </main>
  )
}

export default AccountPage
