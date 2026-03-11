import ModeBuilder from '../components/ModeBuilder'

function ArtistModePage(props) {
  return (
    <ModeBuilder
      {...props}
      eyebrow="Artist Mode"
      title="Build a blindtest around your favorite artists."
      description="Search artists, stack them together, and launch a solo run built from their catalog."
      submitLabel="Start artist blindtest"
      showArtistSearch
      showPlaylists={false}
    />
  )
}

export default ArtistModePage
