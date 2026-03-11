import ModeBuilder from '../components/ModeBuilder'

function PlaylistModePage(props) {
  return (
    <ModeBuilder
      {...props}
      eyebrow="Playlist Mode"
      title="Play curated blindtests by decade, genre, movie, game, or anime."
      description="Browse premade playlists, mix them with artists if you want, and launch a solo run instantly."
      submitLabel="Start playlist blindtest"
      showArtistSearch={false}
      showPlaylists
    />
  )
}

export default PlaylistModePage
