import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import { fetchLeaderboard, submitLeaderboardEntries } from './lib/leaderboards'
import { isSupabaseConfigured } from './lib/supabase'

const ROUND_OPTIONS = [5, 10, 15, 20]
const ROUND_DURATION_MS = 30000
const SEARCH_RESULT_LIMIT = 12
const SONG_FETCH_LIMIT = 200
const MAX_PLAYLIST_ARTISTS_PER_GAME = 20
const MIN_PLAYLIST_ARTISTS_PER_GAME = 10
const PREMADE_PLAYLISTS = [
  {
    id: 'pop-icons',
    title: 'Pop Icons',
    category: 'Genre',
    description: 'Big choruses, chart-topping hooks, and instant-recognition singles.',
    artists: [
      'Taylor Swift',
      'Dua Lipa',
      'Ariana Grande',
      'Lady Gaga',
      'Katy Perry',
      'Billie Eilish',
      'Olivia Rodrigo',
      'Ed Sheeran',
      'Shawn Mendes',
      'Miley Cyrus',
      'Sabrina Carpenter',
      'Justin Bieber',
      'Selena Gomez',
      'Bruno Mars',
      'Harry Styles',
      'The Weeknd',
      'Ava Max',
      'Camila Cabello',
      'Sia',
      'Charli xcx',
      'Mabel',
      'Zara Larsson',
      'Anne-Marie',
      'Jessie J',
      'Ellie Goulding',
      'Bebe Rexha',
      'Demi Lovato',
      'Meghan Trainor',
      'Lorde',
      'Halsey',
      'Kesha',
      'Lizzo',
      'Tate McRae',
      'Conan Gray',
      'Rita Ora',
      'Lauv',
      'OneRepublic',
      'Jonas Brothers',
      'Leona Lewis',
      'Jason Derulo',
      'Flo Rida',
      'Clean Bandit',
      'Marina',
      'Alicia Keys',
      'Sam Smith',
      'Jordin Sparks',
      'Nelly Furtado',
      'Khalid',
      'Little Mix',
      'Lewis Capaldi',
    ],
  },
  {
    id: 'rock-legends',
    title: 'Rock Legends',
    category: 'Genre',
    description: 'Classic riffs and arena anthems from rock staples.',
    artists: [
      'Queen',
      'The Rolling Stones',
      'Nirvana',
      'Red Hot Chili Peppers',
      'Foo Fighters',
      'Led Zeppelin',
      'AC/DC',
      'The Beatles',
      'Pink Floyd',
      'U2',
      'Green Day',
      'The Killers',
      'Guns N Roses',
      'Aerosmith',
      'Metallica',
      'The Who',
      'Bon Jovi',
      'Muse',
      'Linkin Park',
      'Arctic Monkeys',
      'The Doors',
      'Deep Purple',
      'The Clash',
      'Paramore',
      'Kings of Leon',
      'The Strokes',
      'The Smashing Pumpkins',
      'Pearl Jam',
      'Soundgarden',
      'Van Halen',
      'Scorpions',
      'Journey',
      'Def Leppard',
      'Evanescence',
      'Rage Against the Machine',
      'Blink-182',
      'The White Stripes',
      'Franz Ferdinand',
      'Placebo',
      'The Cure',
      'INXS',
      'The Kinks',
      'The Offspring',
      'The Black Keys',
      'Thirty Seconds to Mars',
      'My Chemical Romance',
      'Iron Maiden',
      'Fall Out Boy',
    ],
  },
  {
    id: 'hip-hop-hits',
    title: 'Hip-Hop Hits',
    category: 'Genre',
    description: 'Mainstream rap favorites with instantly recognizable tracks.',
    artists: [
      'Drake',
      'Kendrick Lamar',
      'Eminem',
      'Travis Scott',
      'Nicki Minaj',
      'Kanye West',
      'Lil Wayne',
      'Post Malone',
      'Cardi B',
      'J. Cole',
      'Jay-Z',
      'Doja Cat',
      'Megan Thee Stallion',
      'Future',
      '21 Savage',
      'A$AP Rocky',
      'Tyler, The Creator',
      'Mac Miller',
      'Childish Gambino',
      'Lil Uzi Vert',
      'Snoop Dogg',
      '2Pac',
      'The Notorious B.I.G.',
      'Nas',
      'Wu-Tang Clan',
      'Macklemore & Ryan Lewis',
      'French Montana',
      'Big Sean',
      'Pusha T',
      'Joey Bada$$',
      'YG',
      'Lil Baby',
      'Gunna',
      'Pop Smoke',
      'Roddy Ricch',
      'Ice Spice',
      'Latto',
      'Saweetie',
      'B.o.B',
      'T.I.',
      'Rick Ross',
      'Ludacris',
      'Nelly',
      '50 Cent',
      'Kid Cudi',
      'The Game',
      'Logic',
    ],
  },
  {
    id: 'electro-party',
    title: 'Electro Party',
    category: 'Genre',
    description: 'Club-ready electronic stars and dancefloor staples.',
    artists: [
      'Daft Punk',
      'David Guetta',
      'Calvin Harris',
      'Justice',
      'Avicii',
      'Martin Garrix',
      'Swedish House Mafia',
      'Tiësto',
      'Kygo',
      'Robin Schulz',
      'Major Lazer',
      'Dillon Francis',
      'Marshmello',
      'The Chainsmokers',
      'Alan Walker',
      'Zedd',
      'MEDUZA',
      'Armin van Buuren',
      'Skrillex',
      'Kungs',
      'Bob Sinclar',
      'DJ Snake',
      'Don Diablo',
      'Hardwell',
      'Porter Robinson',
      'Nicky Romero',
      'Steve Aoki',
      'Alesso',
      'deadmau5',
      'M83',
      'Rudimental',
      'Diplo',
      'Ofenbach',
      'Lost Frequencies',
      'Purple Disco Machine',
      'R3HAB',
      'Clean Bandit',
      'Benny Benassi',
      'Eric Prydz',
      'Disclosure',
      'Sigala',
      'Joel Corry',
      'Gorgon City',
      'Tchami',
      'Martin Solveig',
      'Vengaboys',
      'Darude',
    ],
  },
  {
    id: 'seventies',
    title: '70s Flashback',
    category: 'Decade',
    description: 'Disco, glam, and timeless 70s pop-rock classics.',
    artists: [
      'ABBA',
      'Bee Gees',
      'Elton John',
      'David Bowie',
      'Fleetwood Mac',
      'Donna Summer',
      'Earth, Wind & Fire',
      'The Jackson 5',
      'Billy Joel',
      'Stevie Wonder',
      'The Eagles',
      'Blondie',
      'Chicago',
      'Rod Stewart',
      'Carpenters',
      'Boney M.',
      'Supertramp',
      'T. Rex',
      'The Doobie Brothers',
      'Electric Light Orchestra',
      'Gloria Gaynor',
      'KC and the Sunshine Band',
      'Village People',
      'Paul McCartney',
      'John Lennon',
      'Eric Clapton',
      'Aerosmith',
      'Kiss',
      'Heart',
      'Cheap Trick',
      'Boston',
      'Meat Loaf',
      'Billy Ocean',
      'Hall & Oates',
      'Barry White',
      'Marvin Gaye',
      'Carole King',
      'Lou Reed',
      'The Runaways',
      'Ramones',
      'Sex Pistols',
      'The B-52s',
      'The Commodores',
      'Dire Straits',
      'Foreigner',
      'Harry Nilsson',
      'Jackson Browne',
    ],
  },
  {
    id: 'eighties',
    title: '80s Essentials',
    category: 'Decade',
    description: 'Synths, neon, and blockbuster pop anthems from the 80s.',
    artists: [
      'Michael Jackson',
      'Madonna',
      'Prince',
      'Whitney Houston',
      'a-ha',
      'Cyndi Lauper',
      'George Michael',
      'Duran Duran',
      'Tears for Fears',
      'Bon Jovi',
      'Phil Collins',
      'Pet Shop Boys',
      'Eurythmics',
      'Roxette',
      'The Police',
      'Simple Minds',
      'Depeche Mode',
      'Toto',
      'Billy Idol',
      'Culture Club',
      'Van Halen',
      'Bryan Adams',
      'Foreigner',
      'A Flock of Seagulls',
      'Journey',
      'Survivor',
      'Pat Benatar',
      'Joan Jett & The Blackhearts',
      'Hall & Oates',
      'Kool & The Gang',
      'The Human League',
      'Wham!',
      'Bananarama',
      'New Order',
      'Erasure',
      'The Bangles',
      'Soft Cell',
      'Laura Branigan',
      'Kim Wilde',
      'Gloria Estefan',
      'Belinda Carlisle',
      'Rick Astley',
      'Sandra',
      'Falco',
      'Men At Work',
      'The Pointer Sisters',
      'UB40',
    ],
  },
  {
    id: 'nineties',
    title: '90s Throwback',
    category: 'Decade',
    description: 'A mix of 90s pop, rock, and alt classics.',
    artists: [
      'Britney Spears',
      'Oasis',
      'Backstreet Boys',
      'Alanis Morissette',
      'Radiohead',
      'Spice Girls',
      'Mariah Carey',
      'Celine Dion',
      'No Doubt',
      'Blur',
      'The Cranberries',
      'R.E.M.',
      'TLC',
      'Destiny\'s Child',
      'Green Day',
      'The Verve',
      'Shania Twain',
      'Red Hot Chili Peppers',
      'Will Smith',
      'Ricky Martin',
      'Jennifer Lopez',
      'Natalie Imbruglia',
      'Savage Garden',
      'Ace of Base',
      'Roxette',
      'Jamiroquai',
      'Jam & Spoon',
      'Eiffel 65',
      'Aqua',
      'Vengaboys',
      'Lou Bega',
      'Hanson',
      'Boyz II Men',
      'Brandy',
      'Monica',
      'Christina Aguilera',
      'NSYNC',
      'Westlife',
      'Take That',
      'Robbie Williams',
      'Lenny Kravitz',
      'Garbage',
      'Smash Mouth',
      'Spin Doctors',
      'All Saints',
      'S Club 7',
    ],
  },
  {
    id: 'two-thousands',
    title: '2000s Rewind',
    category: 'Decade',
    description: 'Peak ringtone-era bangers and MTV-era singalongs.',
    artists: [
      'Rihanna',
      'Usher',
      'Beyonce',
      'Coldplay',
      'Linkin Park',
      'Nelly Furtado',
      'Akon',
      'Black Eyed Peas',
      'Kelly Clarkson',
      'P!nk',
      'Fergie',
      'Timbaland',
      'Gwen Stefani',
      'Maroon 5',
      'Avril Lavigne',
      'Christina Aguilera',
      'Shakira',
      'Justin Timberlake',
      'Sean Paul',
      'The Pussycat Dolls',
      'Natasha Bedingfield',
      'Dido',
      'Sugababes',
      'Girls Aloud',
      'Mika',
      'James Blunt',
      'Snow Patrol',
      'The Fray',
      'Plain White T\'s',
      'Owl City',
      'Keane',
      'The Script',
      'Ne-Yo',
      'Taio Cruz',
      'Iyaz',
      'Cascada',
      'September',
      'Alex Gaudino',
      'Pitbull',
      'Enrique Iglesias',
      'Colbie Caillat',
      'Sara Bareilles',
      'Corinne Bailey Rae',
      'Duffy',
      'Jesse McCartney',
      'Kevin Rudolf',
      'Gym Class Heroes',
    ],
  },
]

function shuffle(array) {
  const copy = [...array]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

function pickRandomItems(items, count) {
  return shuffle(items).slice(0, count)
}

function calculatePoints(timeLeftMs) {
  return Math.max(0, Math.round((timeLeftMs / ROUND_DURATION_MS) * 100))
}

function formatSeconds(ms) {
  return Math.max(0, Math.ceil(ms / 1000))
}

function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function createSongKey(artistName, title) {
  return `${normalizeText(artistName)}::${normalizeText(title)}`
}

async function fetchItunes(endpoint, params, signal) {
  const response = await fetch(`/api/itunes/${endpoint}?${params.toString()}`, signal ? { signal } : undefined)

  if (!response.ok) {
    throw new Error(`iTunes ${endpoint} request failed.`)
  }

  return response.json()
}

function buildLeaderboardSources(manualArtists, selectedPlaylists) {
  return [
    ...manualArtists.map((artist) => ({
      type: 'artist',
      id: String(artist.artistId),
      name: artist.artistName,
    })),
    ...selectedPlaylists.map((playlist) => ({
      type: 'playlist',
      id: playlist.id,
      name: playlist.title,
    })),
  ]
}

function getPlaylistSampleSize(roundCount, playlistCount) {
  return Math.max(
    MIN_PLAYLIST_ARTISTS_PER_GAME,
    Math.min(MAX_PLAYLIST_ARTISTS_PER_GAME, Math.ceil((roundCount + 8) / Math.max(1, playlistCount))),
  )
}

function mergeUniqueArtists(existingArtists, nextArtists) {
  const seenArtistIds = new Set(existingArtists.map((artist) => artist.artistId))
  const mergedArtists = [...existingArtists]

  nextArtists.forEach((artist) => {
    if (!seenArtistIds.has(artist.artistId)) {
      seenArtistIds.add(artist.artistId)
      mergedArtists.push(artist)
    }
  })

  return mergedArtists
}

function createRounds(tracks, roundCount) {
  if (tracks.length < 4) {
    throw new Error('Select artists with at least 4 previewable tracks to start a blindtest.')
  }

  if (tracks.length < roundCount) {
    throw new Error(
      `Not enough unique preview clips were found for ${roundCount} rounds. Try fewer rounds or add more artists.`,
    )
  }

  const correctTracks = pickRandomItems(tracks, roundCount)

  return correctTracks.map((correctTrack) => {
    const distractors = pickRandomItems(
      tracks.filter((track) => track.songKey !== correctTrack.songKey),
      3,
    )

    if (distractors.length < 3) {
      throw new Error('Not enough distinct songs were found to build 4 answer choices.')
    }

    return {
      id: correctTrack.id,
      correctTrack,
      options: shuffle([correctTrack, ...distractors]),
    }
  })
}

async function searchArtists(query, signal) {
  const params = new URLSearchParams({
    term: query,
    entity: 'song',
    attribute: 'artistTerm',
    limit: String(SEARCH_RESULT_LIMIT * 4),
  })

  const data = await fetchItunes('search', params, signal)
  const seenArtists = new Set()

  return (data.results ?? [])
    .filter((item) => item.artistId && item.artistName)
    .filter((item) => {
      if (seenArtists.has(item.artistId)) {
        return false
      }

      seenArtists.add(item.artistId)
      return true
    })
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((item) => ({
      artistId: item.artistId,
      artistName: item.artistName,
      primaryGenreName: item.primaryGenreName ?? 'Unknown genre',
      artwork:
        item.artworkUrl100?.replace('100x100bb', '300x300bb') ?? item.artworkUrl100 ?? '',
    }))
}

async function fetchSongsForArtist(artist) {
  const params = new URLSearchParams({
    id: String(artist.artistId),
    entity: 'song',
    limit: String(SONG_FETCH_LIMIT),
  })

  const data = await fetchItunes('lookup', params)
  const seenTracks = new Set()

  return (data.results ?? [])
    .filter((item) => item.wrapperType === 'track' && item.kind === 'song')
    .filter((item) => item.previewUrl && item.trackName)
    .filter((item) => {
      const key = createSongKey(item.artistName ?? artist.artistName, item.trackName)

      if (seenTracks.has(key)) {
        return false
      }

      seenTracks.add(key)
      return true
    })
    .map((track) => ({
      id: String(track.trackId ?? `${track.artistId}-${track.trackName}`),
      songKey: createSongKey(track.artistName ?? artist.artistName, track.trackName),
      title: track.trackName,
      artistName: track.artistName ?? artist.artistName,
      previewUrl: track.previewUrl,
      artwork:
        track.artworkUrl100?.replace('100x100bb', '300x300bb') ?? track.artworkUrl100 ?? '',
      collectionName: track.collectionName ?? 'Single',
    }))
}

async function resolveSelectedPlaylistArtists(playlists, roundCount) {
  if (playlists.length === 0) {
    return []
  }

  const sampleSize = getPlaylistSampleSize(roundCount, playlists.length)
  const sampledArtistNames = playlists.flatMap((playlist) =>
    shuffle(playlist.artists).slice(0, Math.min(sampleSize, playlist.artists.length)),
  )

  const uniqueArtistNames = [...new Set(sampledArtistNames.map((artistName) => normalizeText(artistName)))]

  const artistMatches = await Promise.all(
    uniqueArtistNames.map(async (normalizedArtistName) => {
      const originalArtistName = sampledArtistNames.find(
        (artistName) => normalizeText(artistName) === normalizedArtistName,
      )

      if (!originalArtistName) {
        return null
      }

      const matches = await searchArtists(originalArtistName)

      return (
        matches.find((artist) => normalizeText(artist.artistName) === normalizedArtistName) ??
        matches[0] ??
        null
      )
    }),
  )

  return artistMatches.filter(Boolean)
}

async function fetchLeaderboardsForSources(sources, roundCount) {
  const entries = await Promise.all(
    sources.map(async (source) => ({
      ...source,
      roundCount,
      entries: await fetchLeaderboard(source.type, source.id, roundCount),
    })),
  )

  return entries
}

function SetupPage({
  addArtist,
  applyPlaylist,
  clearSelectedArtists,
  gameError,
  gameState,
  hasResumeGame,
  manualArtists,
  onResumeGame,
  playlistError,
  removePlaylist,
  removeArtist,
  roundCount,
  searchError,
  searchResults,
  searchState,
  searchTerm,
  selectedPlaylists,
  selectionCount,
  setRoundCount,
  setSearchError,
  setSearchResults,
  setSearchState,
  setSearchTerm,
  startGame,
}) {
  return (
    <main className="page setup-page">
      <section className="hero">
        <p className="eyebrow">EasyBlindtest</p>
        <h1>Build your blindtest on one page, then play it on another.</h1>
        <p className="hero-copy">
          Search artists, load curated genre or decade playlists, pick a round length, then jump to
          the dedicated game page for the quiz itself.
        </p>

        {hasResumeGame ? (
          <div className="hero-actions">
            <button type="button" className="secondary-button" onClick={onResumeGame}>
              Resume current game
            </button>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Setup</h2>
            <p>Choose artists, load premade playlists, and launch a timed challenge.</p>
          </div>
          {selectionCount > 0 ? <span className="badge">{selectionCount} sources selected</span> : null}
        </div>

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

        <div className="section-spacer">
          <div className="section-header">
            <div>
              <h3>Premade playlists</h3>
              <p>Browse ready-made genres and decade-based selections.</p>
            </div>
          </div>

          <div className="playlist-row">
            {PREMADE_PLAYLISTS.map((playlist) => (
              <div key={playlist.id} className="playlist-card">
                <div className="playlist-meta">
                  <span className="playlist-tag">{playlist.category}</span>
                  <h4>{playlist.title}</h4>
                  <p>{playlist.description}</p>
                  <small>{playlist.artists.length} artists curated</small>
                  <small className="playlist-preview">
                    {playlist.artists.slice(0, 6).join(' • ')}
                    {playlist.artists.length > 6 ? ' • ...' : ''}
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

        <div className="section-spacer">
          <div className="section-header">
            <div>
              <h3>Selected artists</h3>
              <p>Playlist names stay grouped here while manual picks remain individual.</p>
            </div>
          </div>

          {selectionCount > 0 ? (
            <button type="button" className="text-button" onClick={clearSelectedArtists}>
              Clear all selections
            </button>
          ) : null}

          {selectionCount === 0 ? (
            <div className="empty-state">Add at least one artist to unlock the blindtest.</div>
          ) : (
            <div className="chip-list">
              {selectedPlaylists.map((playlist) => (
                <div key={playlist.id} className="artist-chip playlist-chip">
                  <div>
                    <strong>{playlist.title}</strong>
                    <small>
                      {playlist.category} playlist • {playlist.artists.length} artists
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

        {gameError ? <p className="error-text">{gameError}</p> : null}

        <button
          type="button"
          className="primary-button"
          onClick={startGame}
          disabled={gameState === 'loading'}
        >
          {gameState === 'loading' ? 'Preparing blindtest...' : 'Start blindtest'}
        </button>
      </section>
    </main>
  )
}

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
              <div className="empty-state leaderboard-empty">
                No scores yet. Be the first to submit one.
              </div>
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
              <p>Go back to the setup page to choose artists and create a new game.</p>
            </div>
          </div>

          <button type="button" className="primary-button" onClick={onBackToSetup}>
            Go to setup
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
            <h2>Game</h2>
            <p>Listen fast, answer faster, and protect your score.</p>
          </div>
          <div className="game-header-actions">
            <button type="button" className="text-button" onClick={onBackToSetup}>
              Back to setup
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
                <strong>{formatSeconds(timeLeftMs)} seconds left</strong>
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
                      <strong>{option.title}</strong>
                      <small>{option.artistName}</small>
                    </div>
                  </button>
                )
              })}
            </div>

            {gameState === 'review' && roundResult ? (
              <div className={roundResult.isCorrect ? 'result-card success' : 'result-card fail'}>
                <div className={roundResult.isCorrect ? 'result-banner success' : 'result-banner fail'}>
                  <span>
                    {roundResult.isCorrect ? 'Correct answer' : 'Wrong answer'}
                  </span>
                  <strong className={roundResult.isCorrect ? 'points-burst success' : 'points-burst fail'}>
                    {roundResult.earnedPoints} pts
                  </strong>
                </div>

                <div className="track-reveal">
                  {roundResult.correctTrack.artwork ? (
                    <img
                      src={roundResult.correctTrack.artwork}
                      alt={roundResult.correctTrack.title}
                      className="artwork"
                    />
                  ) : null}

                  <div>
                    <p className="reveal-label">Correct answer</p>
                    <h3>{roundResult.correctTrack.title}</h3>
                    <p>{roundResult.correctTrack.artistName}</p>
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
                      Round {item.roundNumber}: {item.correctTrack.title}
                    </strong>
                    <small>{item.correctTrack.artistName}</small>
                  </div>
                  <span className={item.isCorrect ? 'history-score success-text' : 'history-score'}>
                    {item.earnedPoints} pts
                  </span>
                </div>
              ))}
            </div>

            <div className="final-score-actions">
              <button type="button" className="secondary-button" onClick={onBackToSetup}>
                Back to setup
              </button>
              <button type="button" className="primary-button" onClick={restartGame}>
                Build another blindtest
              </button>
            </div>

            {isSupabaseConfigured ? (
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
            ) : (
              <p className="helper-text">
                Supabase is not configured yet, so leaderboard submission is unavailable.
              </p>
            )}

            {leaderboardState === 'loading' ? (
              <p className="helper-text">Loading leaderboards...</p>
            ) : null}
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

function App() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchState, setSearchState] = useState('idle')
  const [searchError, setSearchError] = useState('')
  const [manualArtists, setManualArtists] = useState([])
  const [selectedPlaylists, setSelectedPlaylists] = useState([])
  const [roundCount, setRoundCount] = useState(10)
  const [gameState, setGameState] = useState('setup')
  const [gameError, setGameError] = useState('')
  const [rounds, setRounds] = useState([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_DURATION_MS)
  const [roundResult, setRoundResult] = useState(null)
  const [history, setHistory] = useState([])
  const [gameContext, setGameContext] = useState(null)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [playlistError, setPlaylistError] = useState('')
  const [leaderboardTargets, setLeaderboardTargets] = useState([])
  const [leaderboardState, setLeaderboardState] = useState('idle')
  const [leaderboardError, setLeaderboardError] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [submissionState, setSubmissionState] = useState('idle')
  const [submissionError, setSubmissionError] = useState('')

  const searchAbortRef = useRef(null)
  const audioRef = useRef(null)
  const roundStartTimeRef = useRef(0)
  const playbackStartTimeRef = useRef(0)
  const submitAnswerRef = useRef(() => {})

  const currentRound = rounds[roundIndex] ?? null
  const canSearch = searchTerm.trim().length >= 2
  const selectedPlaylistArtistNames = useMemo(
    () => new Set(selectedPlaylists.flatMap((playlist) => playlist.artists.map((artist) => normalizeText(artist)))),
    [selectedPlaylists],
  )
  const selectionCount = manualArtists.length + selectedPlaylists.length
  const progressPercent = currentRound
    ? ((roundIndex + (gameState === 'review' ? 1 : 0)) / rounds.length) * 100
    : 0
  const hasResumeGame = rounds.length > 0 && gameState !== 'loading'

  const finalAccuracy = useMemo(() => {
    if (history.length === 0) {
      return 0
    }

    const correctAnswers = history.filter((item) => item.isCorrect).length
    return Math.round((correctAnswers / history.length) * 100)
  }, [history])

  useEffect(() => {
    if (gameState !== 'finished' || !gameContext || !isSupabaseConfigured) {
      return
    }

    let isCancelled = false

    async function loadLeaderboards() {
      setLeaderboardState('loading')
      setLeaderboardError('')

      try {
        const boards = await fetchLeaderboardsForSources(
          gameContext.leaderboardSources,
          gameContext.roundCount,
        )

        if (!isCancelled) {
          setLeaderboardTargets(boards)
          setLeaderboardState('loaded')
        }
      } catch {
        if (!isCancelled) {
          setLeaderboardTargets([])
          setLeaderboardState('error')
          setLeaderboardError('Could not load leaderboard data.')
        }
      }
    }

    loadLeaderboards()

    return () => {
      isCancelled = true
    }
  }, [gameContext, gameState])

  useEffect(() => {
    if (!canSearch) {
      searchAbortRef.current?.abort()
      return undefined
    }

    const timeoutId = window.setTimeout(async () => {
      searchAbortRef.current?.abort()
      const controller = new AbortController()
      searchAbortRef.current = controller
      setSearchState('loading')
      setSearchError('')

      try {
        const artists = await searchArtists(searchTerm.trim(), controller.signal)
        setSearchResults(
          artists.filter(
            (artist) =>
              !manualArtists.some((selectedArtist) => selectedArtist.artistId === artist.artistId) &&
              !selectedPlaylistArtistNames.has(normalizeText(artist.artistName)),
          ),
        )
        setSearchState('success')
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        setSearchResults([])
        setSearchState('error')
        setSearchError('Could not search artists. Check your connection and try again.')
      }
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [canSearch, manualArtists, searchTerm, selectedPlaylistArtistNames])

  useEffect(() => {
    if (gameState !== 'playing') {
      return undefined
    }

    roundStartTimeRef.current = performance.now()

    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - roundStartTimeRef.current
      const nextTimeLeft = Math.max(0, ROUND_DURATION_MS - elapsed)
      setTimeLeftMs(nextTimeLeft)

      if (nextTimeLeft <= 0) {
        window.clearInterval(intervalId)
        submitAnswerRef.current(null)
      }
    }, 100)

    return () => window.clearInterval(intervalId)
  }, [gameState, roundIndex])

  useEffect(() => {
    if (gameState !== 'playing' || !currentRound) {
      return undefined
    }

    const audio = new Audio(currentRound.correctTrack.previewUrl)
    audioRef.current = audio
    audio.preload = 'auto'

    const playFromRandomTime = async () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 30
      const maxStartTime = Math.max(0, duration - 8)
      playbackStartTimeRef.current = Math.random() * maxStartTime
      audio.currentTime = playbackStartTimeRef.current
      setAudioReady(true)

      try {
        await audio.play()
      } catch {
        setAudioBlocked(true)
      }
    }

    const replayFromChosenTime = async () => {
      if (gameState !== 'playing') {
        return
      }

      audio.currentTime = playbackStartTimeRef.current

      try {
        await audio.play()
      } catch {
        setAudioBlocked(true)
      }
    }

    audio.addEventListener('loadedmetadata', playFromRandomTime)
    audio.addEventListener('ended', replayFromChosenTime)

    if (audio.readyState >= 1) {
      playFromRandomTime()
    }

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', playFromRandomTime)
      audio.removeEventListener('ended', replayFromChosenTime)
      audioRef.current = null
    }
  }, [currentRound, gameState])

  const submitAnswer = useCallback(
    (option) => {
      if (gameState !== 'playing' || !currentRound) {
        return
      }

      const remainingTime = Math.max(
        0,
        ROUND_DURATION_MS - (performance.now() - roundStartTimeRef.current),
      )
      const isCorrect = option?.id === currentRound.correctTrack.id
      const earnedPoints = isCorrect ? calculatePoints(remainingTime) : 0
      const result = {
        roundNumber: roundIndex + 1,
        isCorrect,
        earnedPoints,
        selectedOption: option,
        correctTrack: currentRound.correctTrack,
      }

      audioRef.current?.pause()
      setAudioBlocked(false)
      setAudioReady(false)
      setScore((currentScore) => currentScore + earnedPoints)
      setHistory((currentHistory) => [...currentHistory, result])
      setRoundResult(result)
      setTimeLeftMs(remainingTime)
      setGameState('review')
    },
    [currentRound, gameState, roundIndex],
  )

  useEffect(() => {
    submitAnswerRef.current = submitAnswer
  }, [submitAnswer])

  function addArtist(artist) {
    setManualArtists((currentArtists) => mergeUniqueArtists(currentArtists, [artist]))
    setSearchTerm('')
    setSearchResults([])
    setSearchError('')
    setSearchState('idle')
    setPlaylistError('')
  }

  function removeArtist(artistId) {
    setManualArtists((currentArtists) =>
      currentArtists.filter((artist) => artist.artistId !== artistId),
    )
  }

  async function applyPlaylist(playlist) {
    setPlaylistError('')

    try {
      setSelectedPlaylists((currentPlaylists) => {
        if (currentPlaylists.some((currentPlaylist) => currentPlaylist.id === playlist.id)) {
          return currentPlaylists
        }

        return [...currentPlaylists, playlist]
      })
      setSearchTerm('')
      setSearchResults([])
      setSearchError('')
      setSearchState('idle')
    } catch (error) {
      setPlaylistError(error.message || 'Could not load that playlist.')
    }
  }

  function removePlaylist(playlistId) {
    setSelectedPlaylists((currentPlaylists) =>
      currentPlaylists.filter((playlist) => playlist.id !== playlistId),
    )
  }

  function clearSelectedArtists() {
    setManualArtists([])
    setSelectedPlaylists([])
    setPlaylistError('')
  }

  async function startGame() {
    if (manualArtists.length === 0 && selectedPlaylists.length === 0) {
      setGameError('Select at least one artist before starting.')
      return
    }

    setGameError('')
    setGameState('loading')
    setRoundResult(null)
    setHistory([])
    setRounds([])
    setRoundIndex(0)
    setScore(0)
    setGameContext(null)
    setLeaderboardTargets([])
    setLeaderboardState('idle')
    setLeaderboardError('')
    setPlayerName('')
    setSubmissionState('idle')
    setSubmissionError('')

    try {
      const playlistArtists = await resolveSelectedPlaylistArtists(selectedPlaylists, roundCount)
      const effectiveSelectedArtists = mergeUniqueArtists(manualArtists, playlistArtists)

      if (effectiveSelectedArtists.length === 0) {
        throw new Error('Could not load enough artists from the selected playlists.')
      }

      const trackGroups = await Promise.all(effectiveSelectedArtists.map(fetchSongsForArtist))
      const tracks = shuffle(trackGroups.flat())
      const nextRounds = createRounds(tracks, roundCount)
      setGameContext({
        leaderboardSources: buildLeaderboardSources(manualArtists, selectedPlaylists),
        manualArtists,
        roundCount,
        selectedPlaylists,
      })
      setRounds(nextRounds)
      setTimeLeftMs(ROUND_DURATION_MS)
      setAudioBlocked(false)
      setAudioReady(false)
      setGameState('playing')
      navigate('/game')
    } catch (error) {
      setGameState('setup')
      setGameError(error.message || 'Could not start the blindtest.')
    }
  }

  function goToNextRound() {
    setRoundResult(null)

    if (roundIndex >= rounds.length - 1) {
      setGameState('finished')
      return
    }

    setTimeLeftMs(ROUND_DURATION_MS)
    setAudioBlocked(false)
    setAudioReady(false)
    setRoundIndex((currentIndex) => currentIndex + 1)
    setGameState('playing')
  }

  function restartGame() {
    audioRef.current?.pause()
    setGameState('setup')
    setGameError('')
    setRoundResult(null)
    setHistory([])
    setRounds([])
    setRoundIndex(0)
    setScore(0)
    setGameContext(null)
    setLeaderboardTargets([])
    setLeaderboardState('idle')
    setLeaderboardError('')
    setPlayerName('')
    setSubmissionState('idle')
    setSubmissionError('')
    setTimeLeftMs(ROUND_DURATION_MS)
    setAudioBlocked(false)
    setAudioReady(false)
    navigate('/')
  }

  function goBackToSetup() {
    audioRef.current?.pause()
    setAudioBlocked(false)
    setAudioReady(false)
    navigate('/')
  }

  async function replaySnippet() {
    if (!audioRef.current) {
      return
    }

    audioRef.current.currentTime = playbackStartTimeRef.current

    try {
      await audioRef.current.play()
      setAudioBlocked(false)
    } catch {
      setAudioBlocked(true)
    }
  }

  function formatScoreLabel(timeLeft) {
    return gameState === 'playing'
      ? `${calculatePoints(timeLeft)} points still available`
      : `${roundResult?.earnedPoints ?? 0} points earned this round`
  }

  async function submitScore() {
    if (!gameContext || playerName.trim().length === 0) {
      return
    }

    setSubmissionState('submitting')
    setSubmissionError('')

    try {
      await submitLeaderboardEntries({
        accuracy: finalAccuracy,
        correctAnswers: history.filter((item) => item.isCorrect).length,
        displayName: playerName.trim(),
        roundCount: gameContext.roundCount,
        score,
        sources: gameContext.leaderboardSources,
        totalRounds: history.length,
      })

      const boards = await fetchLeaderboardsForSources(
        gameContext.leaderboardSources,
        gameContext.roundCount,
      )
      setLeaderboardTargets(boards)
      setLeaderboardState('loaded')
      setSubmissionState('success')
    } catch {
      setSubmissionState('error')
      setSubmissionError('Could not submit your score. Make sure the Supabase table is set up.')
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand-link">
          EasyBlindtest
        </Link>

        <nav className="site-nav">
          <Link to="/" className="nav-link">
            Setup
          </Link>
          <Link to="/game" className="nav-link">
            Game
          </Link>
        </nav>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <SetupPage
              addArtist={addArtist}
              applyPlaylist={applyPlaylist}
              clearSelectedArtists={clearSelectedArtists}
              gameError={gameError}
              gameState={gameState}
              hasResumeGame={hasResumeGame}
              manualArtists={manualArtists}
              onResumeGame={() => navigate('/game')}
              playlistError={playlistError}
              removePlaylist={removePlaylist}
              removeArtist={removeArtist}
              roundCount={roundCount}
              searchError={searchError}
              searchResults={searchResults}
              searchState={searchState}
              searchTerm={searchTerm}
              selectedPlaylists={selectedPlaylists}
              selectionCount={selectionCount}
              setRoundCount={setRoundCount}
              setSearchError={setSearchError}
              setSearchResults={setSearchResults}
              setSearchState={setSearchState}
              setSearchTerm={setSearchTerm}
              startGame={startGame}
            />
          }
        />
        <Route
          path="/game"
          element={
            <GamePage
              audioBlocked={audioBlocked}
              audioReady={audioReady}
              currentRound={currentRound}
              finalAccuracy={finalAccuracy}
              formatScoreLabel={formatScoreLabel}
              gameState={gameState}
              goToNextRound={goToNextRound}
              hasRounds={rounds.length > 0}
              history={history}
              leaderboardError={leaderboardError}
              leaderboardState={leaderboardState}
              leaderboardTargets={leaderboardTargets}
              onBackToSetup={goBackToSetup}
              onNameChange={setPlayerName}
              onSubmitScore={submitScore}
              playerName={playerName}
              progressPercent={progressPercent}
              replaySnippet={replaySnippet}
              restartGame={restartGame}
              roundCount={gameContext?.roundCount ?? roundCount}
              roundIndex={roundIndex}
              roundResult={roundResult}
              rounds={rounds}
              score={score}
              submissionError={submissionError}
              submissionState={submissionState}
              submitAnswer={submitAnswer}
              timeLeftMs={timeLeftMs}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
