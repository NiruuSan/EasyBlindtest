import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import { fetchGlobalLeaderboard, fetchLeaderboard, submitLeaderboardEntries } from './lib/leaderboards'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  createMultiplayerLobby,
  createOneVOneMatch,
  ensureProfile,
  fetchLobbyByCode,
  fetchLobbyPlayers,
  fetchMultiplayerScoreboard,
  fetchPreset,
  fetchProfile,
  fetchOneVOneMatchByCode,
  fetchPublicLobbies,
  fetchPublicOneVOneMatches,
  fetchSession,
  fetchTrendingBlindtests,
  fetchUserOneVOneMatches,
  finishMultiplayerLobby,
  joinMultiplayerLobby,
  joinOneVOneMatch,
  recordPlayActivities,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  startMultiplayerLobby,
  submitMultiplayerAnswer,
  submitOneVOneResult,
  subscribeToLobby,
  updateProfile,
} from './lib/competitive'
import HomePage from './pages/HomePage'
import ArtistModePage from './pages/ArtistModePage'
import PlaylistModePage from './pages/PlaylistModePage'
import OneVOnePage from './pages/OneVOnePage'
import MultiplayerPage from './pages/MultiplayerPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AccountPage from './pages/AccountPage'
import CompetitiveGamePage from './pages/GamePage'

const ROUND_OPTIONS = [5, 10, 15, 20]
const ROUND_DURATION_MS = 30000
const SEARCH_RESULT_LIMIT = 12
const SONG_FETCH_LIMIT = 200
const DEEZER_SONG_FETCH_LIMIT = 100
const MAX_PLAYLIST_ARTISTS_PER_GAME = 20
const MIN_PLAYLIST_ARTISTS_PER_GAME = 10
const MAX_TRACK_QUERIES_PER_GAME = 18
const MIN_TRACK_QUERIES_PER_GAME = 10
const TRACK_QUERY_DISPLAY_LABELS = {
  'Let It Go Frozen': 'Frozen',
  'Into the Unknown Frozen 2': 'Frozen 2',
  'For the First Time in Forever Frozen': 'Frozen',
  "How Far I'll Go Moana": 'Moana',
  "You're Welcome Moana": 'Moana',
  'Part of Your World The Little Mermaid': 'The Little Mermaid',
  'Under the Sea The Little Mermaid': 'The Little Mermaid',
  'A Whole New World Aladdin': 'Aladdin',
  'Friend Like Me Aladdin': 'Aladdin',
  'Prince Ali Aladdin': 'Aladdin',
  'Belle Beauty and the Beast': 'Beauty and the Beast',
  'Be Our Guest Beauty and the Beast': 'Beauty and the Beast',
  'Circle of Life The Lion King': 'The Lion King',
  'Hakuna Matata The Lion King': 'The Lion King',
  'Can You Feel the Love Tonight The Lion King': 'The Lion King',
  "I Just Can't Wait to Be King The Lion King": 'The Lion King',
  "I'll Make a Man Out of You Mulan": 'Mulan',
  'Reflection Mulan': 'Mulan',
  'Colors of the Wind Pocahontas': 'Pocahontas',
  'Just Around the Riverbend Pocahontas': 'Pocahontas',
  'Go the Distance Hercules': 'Hercules',
  'Zero to Hero Hercules': 'Hercules',
  "You'll Be in My Heart Tarzan": 'Tarzan',
  'Strangers Like Me Tarzan': 'Tarzan',
  'When Will My Life Begin Tangled': 'Tangled',
  'I See the Light Tangled': 'Tangled',
  'Almost There Princess and the Frog': 'The Princess and the Frog',
  'Dig a Little Deeper Princess and the Frog': 'The Princess and the Frog',
  'Surface Pressure Encanto': 'Encanto',
  "We Don't Talk About Bruno Encanto": 'Encanto',
  'Dos Oruguitas Encanto': 'Encanto',
  'Remember Me Coco': 'Coco',
  'Un Poco Loco Coco': 'Coco',
  'Try Everything Zootopia': 'Zootopia',
  'Speechless Aladdin 2019': 'Aladdin',
  'How Does a Moment Last Forever Beauty and the Beast': 'Beauty and the Beast',
  'Breaking Free High School Musical': 'High School Musical',
  'Start of Something New High School Musical': 'High School Musical',
  'Bop to the Top High School Musical': 'High School Musical',
  'What Time Is It High School Musical 2': 'High School Musical 2',
  'Gotta Go My Own Way High School Musical 2': 'High School Musical 2',
  'This Is Me Camp Rock': 'Camp Rock',
  "Wouldn't Change a Thing Camp Rock 2": 'Camp Rock 2',
  'The Climb Hannah Montana': 'Hannah Montana',
  'Best of Both Worlds Hannah Montana': 'Hannah Montana',
  'Rotten to the Core Descendants': 'Descendants',
  'If Only Descendants': 'Descendants',
  'Call Me Beep Me Kim Possible': 'Kim Possible',
  'Hawaiian Roller Coaster Ride Lilo & Stitch': 'Lilo & Stitch',
  'Once Upon a Dream Sleeping Beauty Disney': 'Sleeping Beauty',
  'Gurenge Demon Slayer': 'Demon Slayer',
  'Homura Demon Slayer': 'Demon Slayer',
  'Blue Bird Naruto': 'Naruto',
  'Silhouette Naruto Shippuden': 'Naruto Shippuden',
  'Haruka Kanata Naruto': 'Naruto',
  'Sign Naruto Shippuden': 'Naruto Shippuden',
  'Cha-La Head-Cha-La Dragon Ball Z': 'Dragon Ball Z',
  'Limit Break x Survivor Dragon Ball Super': 'Dragon Ball Super',
  'Unravel Tokyo Ghoul': 'Tokyo Ghoul',
  'Again Fullmetal Alchemist Brotherhood': 'Fullmetal Alchemist: Brotherhood',
  'The Hero One Punch Man': 'One Punch Man',
  "A Cruel Angel's Thesis Neon Genesis Evangelion": 'Neon Genesis Evangelion',
  'Tank Cowboy Bebop': 'Cowboy Bebop',
  'We Are One Piece': 'One Piece',
  'The World Death Note': 'Death Note',
  'Guren no Yumiya Attack on Titan': 'Attack on Titan',
  'Shinzou wo Sasageyo Attack on Titan': 'Attack on Titan',
  'Red Swan Attack on Titan': 'Attack on Titan',
  'My War Attack on Titan': 'Attack on Titan',
  'Crossing Field Sword Art Online': 'Sword Art Online',
  'Ignite Sword Art Online': 'Sword Art Online',
  'This Game No Game No Life': 'No Game No Life',
  'Again Your Lie in April': 'Your Lie in April',
  'Sparkle Your Name': 'Your Name',
  'Zenzenzense Your Name': 'Your Name',
  'Grand Escape Weathering With You': 'Weathering With You',
  'Kyouran Hey Kids Noragami': 'Noragami',
  'GO!!! Naruto': 'Naruto',
  'Kaikai Kitan Jujutsu Kaisen': 'Jujutsu Kaisen',
  'Specialz Jujutsu Kaisen': 'Jujutsu Kaisen',
  'Kick Back Chainsaw Man': 'Chainsaw Man',
  'Mixed Nuts Spy x Family': 'Spy x Family',
  'Idol Oshi no Ko': 'Oshi no Ko',
  'Peace Sign My Hero Academia': 'My Hero Academia',
  'Odd Future My Hero Academia': 'My Hero Academia',
  'Inferno Fire Force': 'Fire Force',
  'Cry Baby Tokyo Revengers': 'Tokyo Revengers',
  'Colors Code Geass': 'Code Geass',
  'Black Rover Black Clover': 'Black Clover',
  'Fly High Haikyuu': 'Haikyuu!!',
  'Imagination Haikyuu': 'Haikyuu!!',
  'Touch Off The Promised Neverland': 'The Promised Neverland',
  'Brave Shine Fate Stay Night': 'Fate/stay night',
  'History Maker Yuri on Ice': 'Yuri on Ice',
  'Hikaru Nara Your Lie in April': 'Your Lie in April',
  'Renai Circulation Bakemonogatari': 'Bakemonogatari',
  'Moonlight Densetsu Sailor Moon': 'Sailor Moon',
  'Melissa Fullmetal Alchemist': 'Fullmetal Alchemist',
  'Kimi no Shiranai Monogatari Bakemonogatari': 'Bakemonogatari',
  'Again Black Clover': 'Black Clover',
  'Super Mario Bros theme': 'Super Mario Bros.',
  'Bob-Omb Battlefield Super Mario 64': 'Super Mario 64',
  'Dire Dire Docks Super Mario 64': 'Super Mario 64',
  'Gusty Garden Galaxy Super Mario Galaxy': 'Super Mario Galaxy',
  'Jump Up Super Star Super Mario Odyssey': 'Super Mario Odyssey',
  'Zelda overworld theme': 'The Legend of Zelda',
  'Gerudo Valley Zelda': 'The Legend of Zelda',
  'Song of Storms Zelda': 'The Legend of Zelda',
  'Ballad of the Goddess Skyward Sword': 'The Legend of Zelda: Skyward Sword',
  'Lost Woods Zelda': 'The Legend of Zelda',
  'Pokemon Red Blue opening theme': 'Pokemon Red/Blue',
  'Littleroot Town Pokemon': 'Pokemon',
  'Battle Cynthia Pokemon': 'Pokemon',
  'Driftveil City Pokemon': 'Pokemon',
  'Route 1 Pokemon Black White': 'Pokemon Black/White',
  'Green Hill Zone Sonic': 'Sonic the Hedgehog',
  'City Escape Sonic Adventure 2': 'Sonic Adventure 2',
  'Live and Learn Sonic Adventure 2': 'Sonic Adventure 2',
  'Escape From the City Sonic': 'Sonic Adventure 2',
  'Open Your Heart Sonic Adventure': 'Sonic Adventure',
  'Simple and Clean Kingdom Hearts': 'Kingdom Hearts',
  'Sanctuary Kingdom Hearts': 'Kingdom Hearts',
  'Dearly Beloved Kingdom Hearts': 'Kingdom Hearts',
  'One Winged Angel Final Fantasy VII': 'Final Fantasy VII',
  'Aerith Theme Final Fantasy VII': 'Final Fantasy VII',
  'To Zanarkand Final Fantasy X': 'Final Fantasy X',
  'Eyes On Me Final Fantasy VIII': 'Final Fantasy VIII',
  'Prelude Final Fantasy': 'Final Fantasy',
  'Megalovania Undertale': 'Undertale',
  'Hopes and Dreams Undertale': 'Undertale',
  'Spider Dance Undertale': 'Undertale',
  'Bergentrückung Asgore Undertale': 'Undertale',
  'Still Alive Portal': 'Portal',
  'Want You Gone Portal 2': 'Portal 2',
  'Baba Yetu Civilization IV': 'Civilization IV',
  'Dragonborn Skyrim': 'The Elder Scrolls V: Skyrim',
  'Ezio Family Assassin Creed 2': "Assassin's Creed II",
  'The Wolven Storm Witcher 3': 'The Witcher 3',
  'Weight of the World Nier Automata': 'NieR:Automata',
  'Amusement Park Nier Automata': 'NieR:Automata',
  'BFG Division Doom': 'DOOM',
  'Rip & Tear Doom': 'DOOM',
  'I Was Born For This Journey': 'Journey',
  'Nate Theme Uncharted': 'Uncharted',
  'The Last of Us main theme': 'The Last of Us',
  'Snake Eater Metal Gear Solid 3': 'Metal Gear Solid 3',
  'Tetris theme Korobeiniki': 'Tetris',
  'Halo theme': 'Halo',
  'Never Fade Away Cyberpunk 2077': 'Cyberpunk 2077',
  'Rules of Nature Metal Gear Rising': 'Metal Gear Rising: Revengeance',
  'My Heart Will Go On Titanic': 'Titanic',
  'Titanic theme': 'Titanic',
  'Shallow A Star Is Born': 'A Star Is Born',
  'City of Stars La La Land': 'La La Land',
  'Another Day of Sun La La Land': 'La La Land',
  'Eye of the Tiger Rocky III': 'Rocky III',
  'Gonna Fly Now Rocky': 'Rocky',
  'Lose Yourself 8 Mile': '8 Mile',
  'Footloose movie soundtrack': 'Footloose',
  'Flashdance What a Feeling': 'Flashdance',
  'Take My Breath Away Top Gun': 'Top Gun',
  'Danger Zone Top Gun': 'Top Gun',
  'Top Gun Maverick Hold My Hand': 'Top Gun: Maverick',
  'Ghostbusters theme movie': 'Ghostbusters',
  'Power of Love Back to the Future': 'Back to the Future',
  'Back in Time Back to the Future': 'Back to the Future',
  'Mrs Robinson The Graduate': 'The Graduate',
  'Stayin Alive Saturday Night Fever': 'Saturday Night Fever',
  'Night Fever Saturday Night Fever': 'Saturday Night Fever',
  'What Ive Done Transformers': 'Transformers',
  'I Dont Want to Miss a Thing Armageddon': 'Armageddon',
  'Kiss From a Rose Batman Forever': 'Batman Forever',
  'Everything I Do I Do It For You Robin Hood Prince of Thieves': 'Robin Hood: Prince of Thieves',
  'Gangstas Paradise Dangerous Minds': 'Dangerous Minds',
  'Dont You Forget About Me The Breakfast Club': 'The Breakfast Club',
  'Unchained Melody Ghost movie': 'Ghost',
  'Pretty Woman soundtrack': 'Pretty Woman',
  'Happy Despicable Me 2': 'Despicable Me 2',
  'Sunflower Spider-Man Into the Spider-Verse': 'Spider-Man: Into the Spider-Verse',
  'Calling Spider-Man Across the Spider-Verse': 'Spider-Man: Across the Spider-Verse',
  'This Is Halloween Nightmare Before Christmas': 'The Nightmare Before Christmas',
  'Ghostbusters Ray Parker Jr': 'Ghostbusters',
  'The Imperial March Star Wars': 'Star Wars',
  'Star Wars main theme': 'Star Wars',
  'Hedwig Theme Harry Potter': 'Harry Potter',
  'Concerning Hobbits Lord of the Rings': 'The Lord of the Rings',
  'Misty Mountains The Hobbit': 'The Hobbit',
  'James Bond theme': 'James Bond',
  'Skyfall James Bond': 'Skyfall',
  'Writings on the Wall Spectre': 'Spectre',
  'Time Inception': 'Inception',
  'Cornfield Chase Interstellar': 'Interstellar',
  'Now We Are Free Gladiator': 'Gladiator',
  'He Is a Pirate Pirates of the Caribbean': 'Pirates of the Caribbean',
  'A Thousand Years Twilight Breaking Dawn': 'Twilight: Breaking Dawn',
  'Can You Feel the Love Tonight movie': 'The Lion King',
  'The Time of My Life Dirty Dancing': 'Dirty Dancing',
  'Jai Ho Slumdog Millionaire': 'Slumdog Millionaire',
  'Falling Slowly Once movie': 'Once',
  'Remember Me Coco movie': 'Coco',
}
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
  {
    id: 'french-variety',
    title: 'French Variety',
    category: 'Genre',
    description: 'Classic chanson and grand French mainstream staples across generations.',
    artists: [
      'Charles Aznavour',
      'Edith Piaf',
      'Gilbert Becaud',
      'Joe Dassin',
      'Julien Clerc',
      'Michel Delpech',
      'Michel Fugain',
      'Serge Lama',
      'Yves Duteil',
      'Maxime Le Forestier',
      'Francis Cabrel',
      'Alain Souchon',
      'Laurent Voulzy',
      'Jean-Jacques Goldman',
      'Johnny Hallyday',
      'Michel Sardou',
      'Florent Pagny',
      'Pascal Obispo',
      'Patrick Bruel',
      'Daniel Balavoine',
      'Claude Francois',
      'Mireille Mathieu',
      'Liane Foly',
      'Herve Vilard',
      'Salvatore Adamo',
      'Nana Mouskouri',
      'Patricia Kaas',
      'Christophe Maé',
      'Bénabar',
      'Calogero',
      'Véronique Sanson',
      'Zaz',
      'Axelle Red',
      'Nicoletta',
      'Stone et Charden',
      'France Gall',
      'Marc Lavoine',
      'Didier Barbelivien',
      'Helene Segara',
      'Garou',
      'M. Pokora',
      'Amel Bent',
      'Chimène Badi',
      'Lara Fabian',
      'Kendji Girac',
      'Christophe Willem',
      'Slimane',
      'Vitaa',
      'Claudio Capéo',
      'Céline Dion',
    ],
  },
  {
    id: 'french-pop',
    title: 'French Pop',
    category: 'Genre',
    description: 'Melodic French pop favorites from radio hits to modern crossover acts.',
    artists: [
      'Angèle',
      'Clara Luciani',
      'Juliette Armanet',
      'Christine and the Queens',
      'Jain',
      'Pomme',
      'Louane',
      'Jenifer',
      'Tal',
      'Shy\'m',
      'Zazie',
      'Vanessa Paradis',
      'Etienne Daho',
      'Mylène Farmer',
      'Indila',
      'Camélia Jordana',
      'Lorie',
      'Yelle',
      'Emilie Simon',
      'Alizée',
      'Rose',
      'Olivia Ruiz',
      'Cœur de pirate',
      'Mika',
      'Soprano',
      'Amir',
      'Fréro Delavega',
      'Boulevard des Airs',
      'Kyo',
      'BB Brunes',
      'Superbus',
      'Mademoiselle K',
      'Brigitte',
      'Les Frangines',
      'Carla Bruni',
      'Vianney',
      'Zaho de Sagazan',
      'Noir Désir',
      'Cats on Trees',
      'Arcadian',
      'Hoshi',
      'Santa',
      'Izia',
      'Nolwenn Leroy',
      'Sofia Essaïdi',
      'Joyce Jonathan',
      'M Pokora',
      'Les Innocents',
      'Cali',
      'Ycare',
    ],
  },
  {
    id: 'french-rap-hiphop',
    title: 'French Rap / Hip-Hop',
    category: 'Genre',
    description: 'A broad mix of French rap classics, street hits, and modern chart leaders.',
    artists: [
      'IAM',
      'NTM',
      'MC Solaar',
      'Booba',
      'Rohff',
      'La Fouine',
      'Soprano',
      'Sexion d\'Assaut',
      'Maître Gims',
      'Ninho',
      'SCH',
      'Jul',
      'PLK',
      'Niska',
      'Damso',
      'Orelsan',
      'Vald',
      'Nekfeu',
      'Lomepal',
      'Kaaris',
      'Kery James',
      'Sniper',
      '113',
      'Médine',
      'Disiz',
      'Youssoupha',
      'Lacrim',
      'Zola',
      'Heuss L\'Enfoiré',
      'Gazo',
      'Tiakola',
      'SDM',
      'Soolking',
      'PNL',
      'Moha La Squale',
      'Alonzo',
      'Mister You',
      'Seth Gueko',
      'Lefa',
      'Naza',
      'MHD',
      'Naps',
      'Kalash Criminel',
      'RK',
      'Keblack',
      'Vegedream',
      'Hornet La Frappe',
      'Dosseh',
      'Hamza',
      'Dinos',
    ],
  },
  {
    id: 'french-70s',
    title: 'French 70s',
    category: 'Decade',
    description: 'French-language staples from the 70s, from yéyé leftovers to chanson icons.',
    artists: [
      'Claude Francois',
      'Joe Dassin',
      'Michel Sardou',
      'Serge Gainsbourg',
      'France Gall',
      'Michel Polnareff',
      'Julien Clerc',
      'Véronique Sanson',
      'Alain Souchon',
      'Maxime Le Forestier',
      'Michel Delpech',
      'Daniel Guichard',
      'Renaud',
      'Michel Berger',
      'Sheila',
      'Dalida',
      'C. Jérôme',
      'Nicole Croisille',
      'Dave',
      'Herve Vilard',
      'Serge Lama',
      'Mireille Mathieu',
      'Nino Ferrer',
      'Nicolas Peyrac',
      'Yves Duteil',
      'Pierre Bachelet',
      'Lio',
      'Marie-Paule Belle',
      'Richard Cocciante',
      'William Sheller',
      'Gilbert Montagné',
      'Stone et Charden',
      'Thierry Pastor',
      'François Valéry',
      'Didier Barbelivien',
      'Patrick Juvet',
    ],
  },
  {
    id: 'french-80s',
    title: 'French 80s',
    category: 'Decade',
    description: 'Big synths, variety hits, and French pop essentials from the 80s.',
    artists: [
      'Jean-Jacques Goldman',
      'France Gall',
      'Daniel Balavoine',
      'Mylène Farmer',
      'Etienne Daho',
      'Images',
      'Début de Soirée',
      'Gold',
      'Jean-Luc Lahaye',
      'Julie Pietri',
      'Jeanne Mas',
      'Cookie Dingler',
      'Desireless',
      'Niagara',
      'Elsa',
      'Liane Foly',
      'Indochine',
      'Téléphone',
      'Renaud',
      'Patricia Kaas',
      'Marc Lavoine',
      'Florent Pagny',
      'Jean-Pierre Mader',
      'Partenaire Particulier',
      'Corynne Charby',
      'Bibie',
      'Peter et Sloane',
      'Philippe Lavil',
      'François Feldman',
      'Les Rita Mitsouko',
      'Princess Erika',
      'Bernard Lavilliers',
      'Jakie Quartz',
      'Lio',
      'Sabrina',
      'Confetti\'s',
      'Gérard Blanc',
      'Thierry Hazard',
      'Hervé Cristiani',
      'Richard Gotainer',
    ],
  },
  {
    id: 'french-90s',
    title: 'French 90s',
    category: 'Decade',
    description: 'French pop, dance, and alternative hits that defined the 90s.',
    artists: [
      'Manau',
      'Zebda',
      'MC Solaar',
      'Alliage',
      '2Be3',
      'Doc Gynéco',
      'Noir Désir',
      'Indochine',
      'Pascal Obispo',
      'Hélène Ségara',
      'Lara Fabian',
      'Axelle Red',
      'Native',
      'Ophelie Winter',
      'Ménélik',
      'Nuttea',
      'Poetic Lover',
      'Khaled',
      'Cheb Mami',
      'Faudel',
      'Alliance Ethnik',
      'Assia',
      'Princess Erika',
      'Stomy Bugsy',
      'Ragga Sonic',
      'Les Innocents',
      'Kyo',
      'Louise Attaque',
      'Zazie',
      'Mylène Farmer',
      'Lââm',
      'Larusso',
      'Daft Punk',
      'Cassius',
      'Les Négresses Vertes',
      'Saian Supa Crew',
      'Matmatah',
      'Sinsemilia',
      'M People',
      'Alizée',
    ],
  },
  {
    id: 'french-2000s',
    title: 'French 2000s',
    category: 'Decade',
    description: 'French-language hits from the 2000s, from pop ballads to club anthems.',
    artists: [
      'Diam\'s',
      'Amel Bent',
      'Vitaa',
      'Christophe Willem',
      'Jenifer',
      'Lorie',
      'M Pokora',
      'Soprano',
      'Kenza Farah',
      'Sinik',
      'Laam',
      'Koxie',
      'Yannick Noah',
      'Calogero',
      'Kyo',
      'Superbus',
      'BB Brunes',
      'Shy\'m',
      'Tal',
      'Grégoire',
      'Camélia Jordana',
      'Coeur de pirate',
      'Sexion d\'Assaut',
      'Colonel Reyel',
      'Collectif Métissé',
      'Fatal Bazooka',
      'Helmut Fritz',
      'Renan Luce',
      'Rose',
      'Emmanuel Moire',
      'Mickael Miro',
      'Mozart l\'Opéra Rock',
      'Zaho',
      'Jessy Matador',
      'Keen\'V',
      'Tunisiano',
      'Psy 4 de la Rime',
      'Willy Denzey',
      'Leslie',
      'Tragédie',
      'Matt Houston',
      'Rohff',
      'Sniper',
      'K-Maro',
      'Vox Angeli',
      'Nadiya',
      'David Hallyday',
      'Corneille',
      'Ilona Mitrecey',
      'Priscilla',
    ],
  },
  {
    id: 'disney-magic',
    title: 'Disney',
    category: 'Theme',
    type: 'track',
    description: 'Animated classics, Disney Channel hits, and soundtrack favorites.',
    queries: [
      'Let It Go Frozen',
      'Into the Unknown Frozen 2',
      'For the First Time in Forever Frozen',
      'How Far I\'ll Go Moana',
      'You\'re Welcome Moana',
      'Part of Your World The Little Mermaid',
      'Under the Sea The Little Mermaid',
      'A Whole New World Aladdin',
      'Friend Like Me Aladdin',
      'Prince Ali Aladdin',
      'Belle Beauty and the Beast',
      'Be Our Guest Beauty and the Beast',
      'Circle of Life The Lion King',
      'Hakuna Matata The Lion King',
      'Can You Feel the Love Tonight The Lion King',
      'I Just Can\'t Wait to Be King The Lion King',
      'I\'ll Make a Man Out of You Mulan',
      'Reflection Mulan',
      'Colors of the Wind Pocahontas',
      'Just Around the Riverbend Pocahontas',
      'Go the Distance Hercules',
      'Zero to Hero Hercules',
      'You\'ll Be in My Heart Tarzan',
      'Strangers Like Me Tarzan',
      'When Will My Life Begin Tangled',
      'I See the Light Tangled',
      'Almost There Princess and the Frog',
      'Dig a Little Deeper Princess and the Frog',
      'Surface Pressure Encanto',
      'We Don\'t Talk About Bruno Encanto',
      'Dos Oruguitas Encanto',
      'Remember Me Coco',
      'Un Poco Loco Coco',
      'Try Everything Zootopia',
      'Speechless Aladdin 2019',
      'How Does a Moment Last Forever Beauty and the Beast',
      'Breaking Free High School Musical',
      'Start of Something New High School Musical',
      'Bop to the Top High School Musical',
      'What Time Is It High School Musical 2',
      'Gotta Go My Own Way High School Musical 2',
      'This Is Me Camp Rock',
      'Wouldn\'t Change a Thing Camp Rock 2',
      'The Climb Hannah Montana',
      'Best of Both Worlds Hannah Montana',
      'Rotten to the Core Descendants',
      'If Only Descendants',
      'Call Me Beep Me Kim Possible',
      'Hawaiian Roller Coaster Ride Lilo & Stitch',
      'Once Upon a Dream Sleeping Beauty Disney',
    ],
  },
  {
    id: 'anime-anthems',
    title: 'Anime',
    category: 'Theme',
    type: 'track',
    description: 'Openings, endings, and iconic anime soundtrack songs.',
    queries: [
      'Gurenge Demon Slayer',
      'Homura Demon Slayer',
      'Blue Bird Naruto',
      'Silhouette Naruto Shippuden',
      'Haruka Kanata Naruto',
      'Sign Naruto Shippuden',
      'Cha-La Head-Cha-La Dragon Ball Z',
      'Limit Break x Survivor Dragon Ball Super',
      'Unravel Tokyo Ghoul',
      'Again Fullmetal Alchemist Brotherhood',
      'The Hero One Punch Man',
      'A Cruel Angel\'s Thesis Neon Genesis Evangelion',
      'Tank Cowboy Bebop',
      'We Are One Piece',
      'The World Death Note',
      'Guren no Yumiya Attack on Titan',
      'Shinzou wo Sasageyo Attack on Titan',
      'Red Swan Attack on Titan',
      'My War Attack on Titan',
      'Crossing Field Sword Art Online',
      'Ignite Sword Art Online',
      'This Game No Game No Life',
      'Again Your Lie in April',
      'Sparkle Your Name',
      'Zenzenzense Your Name',
      'Grand Escape Weathering With You',
      'Kyouran Hey Kids Noragami',
      'GO!!! Naruto',
      'Kaikai Kitan Jujutsu Kaisen',
      'Specialz Jujutsu Kaisen',
      'Kick Back Chainsaw Man',
      'Mixed Nuts Spy x Family',
      'Idol Oshi no Ko',
      'Peace Sign My Hero Academia',
      'Odd Future My Hero Academia',
      'Inferno Fire Force',
      'Cry Baby Tokyo Revengers',
      'Colors Code Geass',
      'Black Rover Black Clover',
      'Fly High Haikyuu',
      'Imagination Haikyuu',
      'Touch Off The Promised Neverland',
      'Brave Shine Fate Stay Night',
      'History Maker Yuri on Ice',
      'Hikaru Nara Your Lie in April',
      'Renai Circulation Bakemonogatari',
      'Moonlight Densetsu Sailor Moon',
      'Melissa Fullmetal Alchemist',
      'Kimi no Shiranai Monogatari Bakemonogatari',
      'Again Black Clover',
    ],
  },
  {
    id: 'game-music',
    title: 'Game Music',
    category: 'Theme',
    type: 'track',
    description: 'Iconic songs and themes from Nintendo, PlayStation, RPG, and indie classics.',
    queries: [
      'Super Mario Bros theme',
      'Bob-Omb Battlefield Super Mario 64',
      'Dire Dire Docks Super Mario 64',
      'Gusty Garden Galaxy Super Mario Galaxy',
      'Jump Up Super Star Super Mario Odyssey',
      'Zelda overworld theme',
      'Gerudo Valley Zelda',
      'Song of Storms Zelda',
      'Ballad of the Goddess Skyward Sword',
      'Lost Woods Zelda',
      'Pokemon Red Blue opening theme',
      'Littleroot Town Pokemon',
      'Battle Cynthia Pokemon',
      'Driftveil City Pokemon',
      'Route 1 Pokemon Black White',
      'Green Hill Zone Sonic',
      'City Escape Sonic Adventure 2',
      'Live and Learn Sonic Adventure 2',
      'Escape From the City Sonic',
      'Open Your Heart Sonic Adventure',
      'Simple and Clean Kingdom Hearts',
      'Sanctuary Kingdom Hearts',
      'Dearly Beloved Kingdom Hearts',
      'One Winged Angel Final Fantasy VII',
      'Aerith Theme Final Fantasy VII',
      'To Zanarkand Final Fantasy X',
      'Eyes On Me Final Fantasy VIII',
      'Prelude Final Fantasy',
      'Megalovania Undertale',
      'Hopes and Dreams Undertale',
      'Spider Dance Undertale',
      'Bergentrückung Asgore Undertale',
      'Still Alive Portal',
      'Want You Gone Portal 2',
      'Baba Yetu Civilization IV',
      'Dragonborn Skyrim',
      'Ezio Family Assassin Creed 2',
      'The Wolven Storm Witcher 3',
      'Weight of the World Nier Automata',
      'Amusement Park Nier Automata',
      'BFG Division Doom',
      'Rip & Tear Doom',
      'I Was Born For This Journey',
      'Nate Theme Uncharted',
      'The Last of Us main theme',
      'Snake Eater Metal Gear Solid 3',
      'Tetris theme Korobeiniki',
      'Halo theme',
      'Never Fade Away Cyberpunk 2077',
      'Rules of Nature Metal Gear Rising',
    ],
  },
  {
    id: 'movies-music',
    title: 'Movies Music',
    category: 'Theme',
    type: 'track',
    description: 'Famous songs and themes from cult films, blockbusters, musicals, and animated movies.',
    queries: [
      'My Heart Will Go On Titanic',
      'Titanic theme',
      'Shallow A Star Is Born',
      'City of Stars La La Land',
      'Another Day of Sun La La Land',
      'Eye of the Tiger Rocky III',
      'Gonna Fly Now Rocky',
      'Lose Yourself 8 Mile',
      'Footloose movie soundtrack',
      'Flashdance What a Feeling',
      'Take My Breath Away Top Gun',
      'Danger Zone Top Gun',
      'Top Gun Maverick Hold My Hand',
      'Ghostbusters theme movie',
      'Power of Love Back to the Future',
      'Back in Time Back to the Future',
      'Mrs Robinson The Graduate',
      'Stayin Alive Saturday Night Fever',
      'Night Fever Saturday Night Fever',
      'What Ive Done Transformers',
      'I Dont Want to Miss a Thing Armageddon',
      'Kiss From a Rose Batman Forever',
      'Everything I Do I Do It For You Robin Hood Prince of Thieves',
      'Gangstas Paradise Dangerous Minds',
      'Dont You Forget About Me The Breakfast Club',
      'Unchained Melody Ghost movie',
      'Pretty Woman soundtrack',
      'Happy Despicable Me 2',
      'Sunflower Spider-Man Into the Spider-Verse',
      'Calling Spider-Man Across the Spider-Verse',
      'This Is Halloween Nightmare Before Christmas',
      'Ghostbusters Ray Parker Jr',
      'The Imperial March Star Wars',
      'Star Wars main theme',
      'Hedwig Theme Harry Potter',
      'Concerning Hobbits Lord of the Rings',
      'Misty Mountains The Hobbit',
      'James Bond theme',
      'Skyfall James Bond',
      'Writings on the Wall Spectre',
      'Time Inception',
      'Cornfield Chase Interstellar',
      'Now We Are Free Gladiator',
      'He Is a Pirate Pirates of the Caribbean',
      'A Thousand Years Twilight Breaking Dawn',
      'Can You Feel the Love Tonight movie',
      'The Time of My Life Dirty Dancing',
      'Jai Ho Slumdog Millionaire',
      'Falling Slowly Once movie',
      'Remember Me Coco movie',
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
  return (text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function createSongKey(artistName, title) {
  return `${normalizeText(artistName)}::${normalizeText(title)}`
}

function createArtistKey(artistName) {
  return normalizeText(artistName)
}

function normalizeItunesArtwork(url) {
  return url?.replace('100x100bb', '300x300bb') ?? url ?? ''
}

function normalizeTrackTitle(title) {
  return normalizeText(
    title
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\s+-\s+(remix|mix|edit|version|ver\.?|live|acoustic|instrumental|karaoke|remaster(?:ed)?).*$/i, '')
      .trim(),
  )
}

function shouldRejectTrackVersion(track) {
  const searchableText = `${track.trackName ?? track.title ?? ''} ${track.collectionName ?? track.album?.title ?? ''} ${track.artistName ?? track.artist?.name ?? ''}`
  const normalized = normalizeText(searchableText)
  const blockedPatterns = [
    /\bremix\b/,
    /\bremaster(?:ed)?\b/,
    /\bre recorded\b/,
    /\bkaraoke\b/,
    /\binstrumental\b/,
    /\bacoustic\b/,
    /\blo fi\b/,
    /\blofi\b/,
    /\bchill mix\b/,
    /\bchill version\b/,
    /\blive\b/,
    /\bcover\b/,
    /\btribute\b/,
    /\bsped up\b/,
    /\breverb\b/,
    /\bslowed reverb\b/,
    /\bslowed\b/,
    /\bnightcore\b/,
    /\b8d\b/,
    /\bmix\b/,
    /\bedit\b/,
    /\bextended\b/,
    /\bclub\b/,
    /\bdance version\b/,
    /\brework\b/,
    /\breimagined\b/,
    /\breimagining\b/,
    /\barrangement\b/,
    /\barranged\b/,
    /\bmedley\b/,
    /\bmashup\b/,
    /\bcover version\b/,
    /\btheme version\b/,
    /\bmovie version\b/,
    /\btv size\b/,
    /\bfull version\b/,
    /\btheme song\b/,
    /\bshort ver\b/,
    /\bshort version\b/,
    /\blong version\b/,
    /\benglish ver\b/,
    /\benglish version\b/,
    /\bjapanese ver\b/,
    /\bjapanese version\b/,
    /\bpiano version\b/,
    /\bstrings version\b/,
    /\bviolin version\b/,
    /\bguitar version\b/,
    /\borchestral version\b/,
  ]

  return blockedPatterns.some((pattern) => pattern.test(normalized))
}

function getPlaylistType(playlist) {
  return playlist.type ?? 'artist'
}

function createNormalizedArtist({
  artistName,
  primaryGenreName,
  artwork,
  itunesArtistId = null,
  deezerArtistId = null,
}) {
  return {
    artistId: createArtistKey(artistName),
    artistName,
    primaryGenreName: primaryGenreName ?? 'Unknown genre',
    artwork: artwork ?? '',
    itunesArtistId,
    deezerArtistId,
  }
}

function createNormalizedTrack({
  provider,
  id,
  artistName,
  title,
  previewUrl,
  artwork,
  collectionName,
}) {
  return {
    id: `${provider}:${id}`,
    songKey: createSongKey(artistName, title),
    titleKey: normalizeTrackTitle(title),
    answerKey: normalizeTrackTitle(title),
    displayTitle: title,
    displaySubtitle: artistName,
    title,
    artistName,
    previewUrl,
    artwork: artwork ?? '',
    collectionName: collectionName ?? 'Single',
  }
}

function normalizeItunesArtist(item) {
  if (!item.artistName) {
    return null
  }

  return createNormalizedArtist({
    artistName: item.artistName,
    primaryGenreName: item.primaryGenreName,
    artwork: normalizeItunesArtwork(item.artworkUrl100),
    itunesArtistId: item.artistId ? String(item.artistId) : null,
  })
}

function normalizeDeezerArtist(item) {
  if (!item?.name) {
    return null
  }

  return createNormalizedArtist({
    artistName: item.name,
    primaryGenreName: item.nb_fan ? 'Deezer artist' : 'Unknown genre',
    artwork: item.picture_xl ?? item.picture_big ?? item.picture_medium ?? item.picture ?? '',
    deezerArtistId: item.id ? String(item.id) : null,
  })
}

function normalizeItunesTrack(track, fallbackArtistName = '') {
  const artistName = track.artistName ?? fallbackArtistName

  if (!artistName || !track.trackName || !track.previewUrl) {
    return null
  }

  return createNormalizedTrack({
    provider: 'itunes',
    id: String(track.trackId ?? `${track.artistId ?? artistName}-${track.trackName}`),
    artistName,
    title: track.trackName,
    previewUrl: track.previewUrl,
    artwork: normalizeItunesArtwork(track.artworkUrl100),
    collectionName: track.collectionName,
  })
}

function normalizeDeezerTrack(track, fallbackArtistName = '') {
  const artistName = track.artist?.name ?? fallbackArtistName

  if (!artistName || !track.title || !track.preview) {
    return null
  }

  return createNormalizedTrack({
    provider: 'deezer',
    id: String(track.id ?? `${artistName}-${track.title}`),
    artistName,
    title: track.title,
    previewUrl: track.preview,
    artwork:
      track.album?.cover_xl ??
      track.album?.cover_big ??
      track.album?.cover_medium ??
      track.album?.cover ??
      '',
    collectionName: track.album?.title,
  })
}

function scoreArtistRelevance(artistName, query) {
  if (!artistName || !query) return 0
  const n = normalizeText(artistName)
  const q = normalizeText(query)
  if (!n || !q) return 0
  if (n === q) return 100
  if (n.startsWith(q)) return 80
  if (n.includes(q)) return 60
  const qWords = q.split(/\s+/).filter(Boolean)
  const matchCount = qWords.filter((w) => n.includes(w)).length
  return matchCount > 0 ? 20 + matchCount * 10 : 0
}

function mergeArtistResults(artistGroups, query) {
  const mergedArtists = new Map()

  artistGroups.flat().forEach((artist) => {
    if (!artist?.artistName) {
      return
    }

    const artistKey = createArtistKey(artist.artistName)
    const currentArtist = mergedArtists.get(artistKey)

    if (!currentArtist) {
      mergedArtists.set(artistKey, artist)
      return
    }

    mergedArtists.set(artistKey, {
      ...currentArtist,
      primaryGenreName:
        currentArtist.primaryGenreName !== 'Unknown genre'
          ? currentArtist.primaryGenreName
          : artist.primaryGenreName,
      artwork: currentArtist.artwork || artist.artwork,
      itunesArtistId: currentArtist.itunesArtistId ?? artist.itunesArtistId ?? null,
      deezerArtistId: currentArtist.deezerArtistId ?? artist.deezerArtistId ?? null,
    })
  })

  const list = Array.from(mergedArtists.values())
  if (!query?.trim()) return list

  return list.sort((a, b) => {
    const scoreA = scoreArtistRelevance(a.artistName, query)
    const scoreB = scoreArtistRelevance(b.artistName, query)
    return scoreB - scoreA
  })
}

function mergeTrackResults(trackGroups) {
  const mergedTracks = new Map()

  trackGroups.flat().forEach((track) => {
    if (!track?.previewUrl || !track.songKey) {
      return
    }

    if (!mergedTracks.has(track.songKey)) {
      mergedTracks.set(track.songKey, track)
    }
  })

  return Array.from(mergedTracks.values())
}

function applyTrackDisplayMetadata(track, query) {
  const displayLabel = TRACK_QUERY_DISPLAY_LABELS[query]

  if (!displayLabel) {
    return track
  }

  return {
    ...track,
    answerKey: normalizeText(displayLabel),
    displayTitle: displayLabel,
    displaySubtitle: track.artistName,
  }
}

async function fetchItunes(endpoint, params, signal) {
  const response = await fetch(`/api/itunes/${endpoint}?${params.toString()}`, signal ? { signal } : undefined)

  if (!response.ok) {
    throw new Error(`iTunes ${endpoint} request failed.`)
  }

  return response.json()
}

async function fetchDeezer(path, params, signal) {
  const response = await fetch(`/api/deezer/${path}?${params.toString()}`, signal ? { signal } : undefined)

  if (!response.ok) {
    throw new Error(`Deezer ${path} request failed.`)
  }

  return response.json()
}

async function settleProviderResults(requests) {
  const results = await Promise.allSettled(requests)
  const fulfilledValues = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)

  if (fulfilledValues.length > 0) {
    return fulfilledValues
  }

  const abortError = results.find(
    (result) => result.status === 'rejected' && result.reason?.name === 'AbortError',
  )

  if (abortError?.status === 'rejected') {
    throw abortError.reason
  }

  const rejection = results.find((result) => result.status === 'rejected')

  if (rejection?.status === 'rejected') {
    throw rejection.reason
  }

  return []
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

function getTrackPlaylistSampleSize(roundCount, playlistCount) {
  return Math.max(
    MIN_TRACK_QUERIES_PER_GAME,
    Math.min(MAX_TRACK_QUERIES_PER_GAME, roundCount + Math.max(4, playlistCount * 2)),
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

  const uniqueCorrectTracks = []
  const seenAnswers = new Set()

  shuffle(tracks).forEach((track) => {
    const answerKey = track.answerKey ?? track.titleKey

    if (!seenAnswers.has(answerKey) && uniqueCorrectTracks.length < roundCount) {
      seenAnswers.add(answerKey)
      uniqueCorrectTracks.push(track)
    }
  })

  if (uniqueCorrectTracks.length < roundCount) {
    throw new Error(
      `Not enough unique preview clips were found for ${roundCount} rounds. Try fewer rounds or add more artists.`,
    )
  }

  return uniqueCorrectTracks.map((correctTrack) => {
    const distractors = pickRandomItems(
      tracks.filter(
        (track) =>
          track.songKey !== correctTrack.songKey &&
          track.titleKey !== correctTrack.titleKey &&
          (track.answerKey ?? track.titleKey) !== (correctTrack.answerKey ?? correctTrack.titleKey),
      ),
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

async function searchItunesArtists(query, signal) {
  const params = new URLSearchParams({
    term: query,
    entity: 'song',
    attribute: 'artistTerm',
    limit: String(SEARCH_RESULT_LIMIT * 4),
  })

  const data = await fetchItunes('search', params, signal)
  return (data.results ?? [])
    .filter((item) => item.artistId && item.artistName)
    .map(normalizeItunesArtist)
    .filter(Boolean)
}

async function searchDeezerArtists(query, signal) {
  const params = new URLSearchParams({
    q: query,
    limit: String(SEARCH_RESULT_LIMIT * 4),
  })

  const data = await fetchDeezer('search/artist', params, signal)
  return (data.data ?? []).map(normalizeDeezerArtist).filter(Boolean)
}

async function searchArtists(query, signal) {
  const artistGroups = await settleProviderResults([
    searchItunesArtists(query, signal),
    searchDeezerArtists(query, signal),
  ])

  return mergeArtistResults(artistGroups, query).slice(0, SEARCH_RESULT_LIMIT)
}

async function fetchItunesSongsForArtist(artist) {
  let itunesArtistId = artist.itunesArtistId

  if (!itunesArtistId) {
    const matches = await searchItunesArtists(artist.artistName)
    const matchingArtist =
      matches.find((match) => normalizeText(match.artistName) === normalizeText(artist.artistName)) ??
      matches[0]

    itunesArtistId = matchingArtist?.itunesArtistId ?? null
  }

  if (!itunesArtistId) {
    return []
  }

  const params = new URLSearchParams({
    id: itunesArtistId,
    entity: 'song',
    limit: String(SONG_FETCH_LIMIT),
  })

  const data = await fetchItunes('lookup', params)
  return (data.results ?? [])
    .filter((item) => item.wrapperType === 'track' && item.kind === 'song')
    .map((track) => normalizeItunesTrack(track, artist.artistName))
    .filter(Boolean)
}

async function fetchDeezerSongsForArtist(artist) {
  let deezerArtistId = artist.deezerArtistId

  if (!deezerArtistId) {
    const matches = await searchDeezerArtists(artist.artistName)
    const matchingArtist =
      matches.find((match) => normalizeText(match.artistName) === normalizeText(artist.artistName)) ??
      matches[0]

    deezerArtistId = matchingArtist?.deezerArtistId ?? null
  }

  if (!deezerArtistId) {
    return []
  }

  const params = new URLSearchParams({
    limit: String(DEEZER_SONG_FETCH_LIMIT),
  })
  const data = await fetchDeezer(`artist/${deezerArtistId}/top`, params)

  return (data.data ?? []).map((track) => normalizeDeezerTrack(track, artist.artistName)).filter(Boolean)
}

async function fetchSongsForArtist(artist) {
  const trackGroups = await settleProviderResults([
    fetchItunesSongsForArtist(artist),
    fetchDeezerSongsForArtist(artist),
  ])

  return mergeTrackResults(trackGroups)
}

async function searchItunesTracksByQuery(query) {
  const params = new URLSearchParams({
    term: query,
    entity: 'song',
    limit: '10',
  })
  const data = await fetchItunes('search', params)

  return (data.results ?? [])
    .filter((item) => item.wrapperType === 'track' && item.kind === 'song')
    .map((track) => normalizeItunesTrack(track))
    .filter(Boolean)
}

async function searchDeezerTracksByQuery(query) {
  const params = new URLSearchParams({
    q: query,
    limit: '10',
  })
  const data = await fetchDeezer('search/track', params)

  return (data.data ?? []).map((track) => normalizeDeezerTrack(track)).filter(Boolean)
}

async function searchTracksByQuery(query) {
  const trackGroups = await settleProviderResults([
    searchItunesTracksByQuery(query),
    searchDeezerTracksByQuery(query),
  ])
  const candidates = mergeTrackResults(trackGroups)
    .filter((track) => !shouldRejectTrackVersion(track))
    .map((track) => applyTrackDisplayMetadata(track, query))

  if (candidates.length > 0) {
    return [candidates[0]]
  }

  return []
}

async function resolveSelectedPlaylistArtists(playlists, roundCount) {
  const artistPlaylists = playlists.filter((playlist) => getPlaylistType(playlist) === 'artist')

  if (artistPlaylists.length === 0) {
    return []
  }

  const sampleSize = getPlaylistSampleSize(roundCount, artistPlaylists.length)
  const sampledArtistNames = artistPlaylists.flatMap((playlist) =>
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

async function resolveTrackPlaylistTracks(playlists, roundCount) {
  const trackPlaylists = playlists.filter((playlist) => getPlaylistType(playlist) === 'track')

  if (trackPlaylists.length === 0) {
    return []
  }

  const sampleSize = getTrackPlaylistSampleSize(roundCount, trackPlaylists.length)
  const sampledQueries = trackPlaylists.flatMap((playlist) =>
    shuffle(playlist.queries).slice(0, Math.min(sampleSize, playlist.queries.length)),
  )
  const trackGroups = await Promise.all(sampledQueries.map(searchTracksByQuery))
  const seenTracks = new Set()
  const seenTitles = new Set()
  const seenAnswers = new Set()

  return trackGroups
    .flat()
    .filter((track) => {
      const answerKey = track.answerKey ?? track.titleKey

      if (seenTracks.has(track.songKey) || seenTitles.has(track.titleKey) || seenAnswers.has(answerKey)) {
        return false
      }

      seenTracks.add(track.songKey)
      seenTitles.add(track.titleKey)
      seenAnswers.add(answerKey)
      return true
    })
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
                  <small>
                    {getPlaylistType(playlist) === 'track'
                      ? `${playlist.queries.length} songs curated`
                      : `${playlist.artists.length} artists curated`}
                  </small>
                  <small className="playlist-preview">
                    {getPlaylistType(playlist) === 'track'
                      ? playlist.queries.slice(0, 4).join(' • ')
                      : playlist.artists.slice(0, 6).join(' • ')}
                    {(getPlaylistType(playlist) === 'track'
                      ? playlist.queries.length > 4
                      : playlist.artists.length > 6)
                      ? ' • ...'
                      : ''}
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
            <div className="empty-state">Add at least one artist or playlist to unlock the blindtest.</div>
          ) : (
            <div className="chip-list">
              {selectedPlaylists.map((playlist) => (
                <div key={playlist.id} className="artist-chip playlist-chip">
                  <div>
                    <strong>{playlist.title}</strong>
                    <small>
                      {playlist.category} playlist •{' '}
                      {getPlaylistType(playlist) === 'track'
                        ? `${playlist.queries.length} songs`
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
  const location = useLocation()
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
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authMode, setAuthMode] = useState('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authDisplayName, setAuthDisplayName] = useState('')
  const [authState, setAuthState] = useState('idle')
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [trendingBlindtests, setTrendingBlindtests] = useState([])
  const [globalLeaderboard, setGlobalLeaderboard] = useState([])
  const [publicMatches, setPublicMatches] = useState([])
  const [myMatches, setMyMatches] = useState([])
  const [oneVOneTab, setOneVOneTab] = useState('unranked')
  const [oneVOneVisibility, setOneVOneVisibility] = useState('public')
  const [matchJoinCode, setMatchJoinCode] = useState('')
  const [publicLobbies, setPublicLobbies] = useState([])
  const [lobbyJoinCode, setLobbyJoinCode] = useState('')
  const [currentLobby, setCurrentLobby] = useState(null)
  const [lobbyPlayers, setLobbyPlayers] = useState([])
  const [liveScoreboard, setLiveScoreboard] = useState([])

  const searchAbortRef = useRef(null)
  const audioRef = useRef(null)
  const roundStartTimeRef = useRef(0)
  const playbackStartTimeRef = useRef(0)
  const submitAnswerRef = useRef(() => {})
  const lobbyChannelRef = useRef(null)
  const persistedRunIdsRef = useRef(new Set())

  const currentRound = rounds[roundIndex] ?? null
  const canSearch = searchTerm.trim().length >= 2
  const selectedPlaylistArtistNames = useMemo(
    () =>
      new Set(
        selectedPlaylists.flatMap((playlist) =>
          getPlaylistType(playlist) === 'artist'
            ? playlist.artists.map((artist) => normalizeText(artist))
            : [],
        ),
      ),
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
  const currentUserId = session?.user?.id ?? null
  const currentDisplayName = profile?.display_name ?? session?.user?.user_metadata?.display_name ?? 'Player'

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined
    }

    let isCancelled = false

    async function syncSession() {
      try {
        const nextSession = await fetchSession()

        if (isCancelled) {
          return
        }

        setSession(nextSession)

        if (nextSession?.user) {
          const nextProfile = await ensureProfile(nextSession.user)

          if (!isCancelled) {
            setProfile(nextProfile)
            setAuthDisplayName(nextProfile.display_name ?? '')
          }
        } else {
          setProfile(null)
        }
      } catch {
        if (!isCancelled) {
          setSession(null)
          setProfile(null)
        }
      }
    }

    syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user) {
        const nextProfile = await ensureProfile(nextSession.user)
        setProfile(nextProfile)
        setAuthDisplayName(nextProfile.display_name ?? '')
      } else {
        setProfile(null)
      }
    })

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isCancelled = false

    async function loadDiscoveryData() {
      try {
        const [nextTrending, nextGlobal, nextPublicMatches, nextPublicLobbies] = await Promise.all([
          fetchTrendingBlindtests(8),
          fetchGlobalLeaderboard(8),
          currentUserId ? fetchPublicOneVOneMatches(oneVOneTab) : Promise.resolve([]),
          currentUserId ? fetchPublicLobbies() : Promise.resolve([]),
        ])

        if (!isCancelled) {
          setTrendingBlindtests(nextTrending)
          setGlobalLeaderboard(nextGlobal)
          setPublicMatches(nextPublicMatches)
          setPublicLobbies(nextPublicLobbies)
        }
      } catch {
        if (!isCancelled) {
          setTrendingBlindtests([])
          setGlobalLeaderboard([])
          setPublicMatches([])
          setPublicLobbies([])
        }
      }
    }

    loadDiscoveryData()

    return () => {
      isCancelled = true
    }
  }, [currentUserId, oneVOneTab])

  useEffect(() => {
    if (!currentUserId || !isSupabaseConfigured) {
      setMyMatches([])
      return undefined
    }

    let isCancelled = false

    async function loadUserMatches() {
      try {
        const matches = await fetchUserOneVOneMatches(currentUserId)

        if (!isCancelled) {
          setMyMatches(matches)
        }
      } catch {
        if (!isCancelled) {
          setMyMatches([])
        }
      }
    }

    loadUserMatches()

    return () => {
      isCancelled = true
    }
  }, [currentUserId])

  useEffect(() => {
    if (!currentLobby || !isSupabaseConfigured) {
      lobbyChannelRef.current?.unsubscribe?.()
      lobbyChannelRef.current = null
      return undefined
    }

    let isCancelled = false

    async function refreshLobbyState() {
      try {
        const [{ data: latestLobby, error: latestLobbyError }, players, scoreboard] = await Promise.all([
          supabase.from('multiplayer_lobbies').select('*').eq('id', currentLobby.id).single(),
          fetchLobbyPlayers(currentLobby.id),
          fetchMultiplayerScoreboard(currentLobby.id),
        ])

        if (latestLobbyError) {
          throw latestLobbyError
        }

        if (!isCancelled) {
          setCurrentLobby(latestLobby)
          setLobbyPlayers(players)
          setLiveScoreboard(scoreboard)

          if (latestLobby.status === 'live' && location.pathname !== '/game' && latestLobby.preset_id) {
            const preset = await fetchPreset(latestLobby.preset_id)
            setRounds(preset.rounds)
            setRoundIndex(0)
            setScore(0)
            setHistory([])
            setRoundResult(null)
            setTimeLeftMs(ROUND_DURATION_MS)
            setGameContext({
              leaderboardSources: [],
              mode: 'multiplayer',
              lobby: latestLobby,
              roundCount: latestLobby.round_count,
            })
            setGameState('playing')
            navigate('/game')
          }
        }
      } catch {
        if (!isCancelled) {
          setLobbyPlayers([])
          setLiveScoreboard([])
        }
      }
    }

    refreshLobbyState()
    lobbyChannelRef.current?.unsubscribe?.()
    lobbyChannelRef.current = subscribeToLobby(currentLobby.id, refreshLobbyState)

    return () => {
      isCancelled = true
      lobbyChannelRef.current?.unsubscribe?.()
      lobbyChannelRef.current = null
    }
  }, [currentLobby, location.pathname, navigate])

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
    if (gameState !== 'finished' || !gameContext || history.length === 0 || !isSupabaseConfigured) {
      return
    }

    const runKey = `${gameContext.mode ?? 'solo'}:${gameContext.match?.id ?? gameContext.lobby?.id ?? 'solo'}:${history.length}:${score}`

    if (persistedRunIdsRef.current.has(runKey)) {
      return
    }

    persistedRunIdsRef.current.add(runKey)

    const correctAnswers = history.filter((item) => item.isCorrect).length

    async function persistRun() {
      try {
        const activitySources =
          gameContext.mode === 'one_v_one' && gameContext.match
            ? [
                {
                  type: gameContext.match.source_type,
                  id:
                    gameContext.match.source_id?.replace(
                      `${gameContext.match.source_type}:`,
                      '',
                    ) ?? gameContext.match.id,
                  name: gameContext.match.source_name,
                },
              ]
            : gameContext.leaderboardSources ?? []

        if (activitySources.length) {
          await recordPlayActivities({
            userId: currentUserId,
            mode: gameContext.mode ?? 'solo',
            sources: activitySources,
            roundCount: gameContext.roundCount,
            score,
            accuracy: finalAccuracy,
            correctAnswers,
            totalRounds: history.length,
          })
        }

        if (gameContext.mode === 'one_v_one' && currentUserId) {
          await submitOneVOneResult({
            matchId: gameContext.match.id,
            userId: currentUserId,
            displayName: currentDisplayName,
            score,
            accuracy: finalAccuracy,
            correctAnswers,
            totalRounds: history.length,
          })

          const nextMatches = await fetchUserOneVOneMatches(currentUserId)
          setMyMatches(nextMatches)
        }

        if (gameContext.mode === 'multiplayer' && gameContext.lobby && currentUserId) {
          await recordPlayActivities({
            userId: currentUserId,
            mode: 'multiplayer',
            sources: [
              {
                type: gameContext.lobby.source_type,
                id: gameContext.lobby.source_id?.replace(`${gameContext.lobby.source_type}:`, '') ?? gameContext.lobby.id,
                name: gameContext.lobby.source_name,
              },
            ],
            roundCount: gameContext.roundCount,
            score,
            accuracy: finalAccuracy,
            correctAnswers,
            totalRounds: history.length,
          })

          const scoreboard = await fetchMultiplayerScoreboard(gameContext.lobby.id)
          setLiveScoreboard(scoreboard)

          if (
            currentUserId === gameContext.lobby.host_id &&
            scoreboard.length > 0 &&
            scoreboard.every((entry) => entry.answersCount >= gameContext.roundCount)
          ) {
            await finishMultiplayerLobby(gameContext.lobby.id)
          }
        }
      } catch {
        persistedRunIdsRef.current.delete(runKey)
      }
    }

    persistRun()
  }, [currentDisplayName, currentUserId, finalAccuracy, gameContext, gameState, history, score])

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

  useEffect(() => {
    if (!roundResult || gameContext?.mode !== 'multiplayer' || !gameContext.lobby || !currentUserId) {
      return
    }

    submitMultiplayerAnswer({
      lobbyId: gameContext.lobby.id,
      userId: currentUserId,
      roundNumber: roundResult.roundNumber,
      selectedTrackId: roundResult.selectedOption?.id ?? null,
      isCorrect: roundResult.isCorrect,
      earnedPoints: roundResult.earnedPoints,
    }).catch(() => {})
  }, [currentUserId, gameContext, roundResult])

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

  function getPrimarySelectedSource() {
    if (manualArtists.length + selectedPlaylists.length !== 1) {
      throw new Error('Competitive modes require exactly one artist or one playlist.')
    }

    if (manualArtists.length === 1) {
      const artist = manualArtists[0]

      return {
        type: 'artist',
        id: String(artist.artistId),
        name: artist.artistName,
        coverUrl: artist.artwork,
        metadata: {
          primaryGenreName: artist.primaryGenreName,
        },
      }
    }

    const playlist = selectedPlaylists[0]

    return {
      type: 'playlist',
      id: playlist.id,
      name: playlist.title,
      coverUrl: '',
      metadata: {
        category: playlist.category,
        type: getPlaylistType(playlist),
      },
    }
  }

  async function buildBlindtestSnapshot({ requireSingleSource = false } = {}) {
    const playlistArtists = await resolveSelectedPlaylistArtists(selectedPlaylists, roundCount)
    const curatedTracks = await resolveTrackPlaylistTracks(selectedPlaylists, roundCount)
    const effectiveSelectedArtists = mergeUniqueArtists(manualArtists, playlistArtists)

    if (effectiveSelectedArtists.length === 0 && curatedTracks.length === 0) {
      throw new Error('Could not load enough songs from the selected artists or playlists.')
    }

    const trackGroups = await Promise.all(effectiveSelectedArtists.map(fetchSongsForArtist))
    const tracks = shuffle([...curatedTracks, ...trackGroups.flat()])
    const nextRounds = createRounds(tracks, roundCount)

    return {
      rounds: nextRounds,
      sources: buildLeaderboardSources(manualArtists, selectedPlaylists),
      source: requireSingleSource ? getPrimarySelectedSource() : null,
    }
  }

  async function startGame() {
    if (manualArtists.length === 0 && selectedPlaylists.length === 0) {
      setGameError('Select at least one artist or playlist before starting.')
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
      const snapshot = await buildBlindtestSnapshot()
      setGameContext({
        leaderboardSources: snapshot.sources,
        manualArtists,
        mode: 'solo',
        roundCount,
        selectedPlaylists,
      })
      setRounds(snapshot.rounds)
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

  async function handleAuthSubmit() {
    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured.')
      return
    }

    setAuthState('loading')
    setAuthError('')
    setAuthNotice('')

    try {
      if (authMode === 'signin') {
        const { user } = await signInWithEmail({
          email: authEmail.trim(),
          password: authPassword,
        })

        const nextProfile = await fetchProfile(user.id)
        setProfile(nextProfile)
        setAuthNotice('Signed in successfully.')
      } else {
        const { user, session: signUpSession } = await signUpWithEmail({
          email: authEmail.trim(),
          password: authPassword,
          displayName: authDisplayName.trim(),
        })

        if (signUpSession?.user) {
          const nextProfile = await fetchProfile(user.id)
          setProfile(nextProfile)
          setAuthNotice('Account created successfully.')
        } else {
          setAuthNotice('Account created. Check your email to confirm your account, then sign in.')
        }
      }

      setAuthState('success')
      setAuthPassword('')
      if (authMode === 'signin') {
        navigate('/account')
      }
    } catch (error) {
      setAuthState('error')
      setAuthError(error.message || 'Could not authenticate.')
    }
  }

  async function handleSaveProfileName() {
    if (!currentUserId) {
      return
    }

    try {
      const nextProfile = await updateProfile(currentUserId, {
        display_name: authDisplayName.trim() || currentDisplayName,
      })
      setProfile(nextProfile)
      setAuthNotice('Profile updated successfully.')
      setAuthError('')
    } catch (error) {
      setAuthError(error.message || 'Could not save your profile.')
    }
  }

  async function handleCreateOneVOneMatch() {
    if (!currentUserId) {
      setGameError('Sign in to create a 1v1 match.')
      navigate('/account')
      return
    }

    if (manualArtists.length === 0 && selectedPlaylists.length === 0) {
      setGameError('Select exactly one artist or playlist before creating a 1v1 match.')
      return
    }

    setGameState('loading')
    setGameError('')

    try {
      const snapshot = await buildBlindtestSnapshot({ requireSingleSource: true })
      const match = await createOneVOneMatch({
        createdBy: currentUserId,
        visibility: oneVOneTab === 'ranked' ? 'public' : oneVOneVisibility,
        matchType: oneVOneTab,
        source: snapshot.source,
        roundCount,
        rounds: snapshot.rounds,
      })

      setMyMatches((prev) => [match, ...prev])
      if (match.visibility === 'public') {
        setPublicMatches((prev) => [match, ...prev])
      }

      setRounds(snapshot.rounds)
      setRoundIndex(0)
      setScore(0)
      setHistory([])
      setRoundResult(null)
      setTimeLeftMs(ROUND_DURATION_MS)
      setGameContext({
        leaderboardSources: snapshot.sources,
        mode: 'one_v_one',
        match,
        roundCount,
      })
      setGameState('playing')
      navigate('/game')
    } catch (error) {
      setGameState('setup')
      setGameError(error.message || 'Could not create the 1v1 match.')
    }
  }

  async function handleJoinPrivateMatch() {
    if (!currentUserId) {
      navigate('/account')
      return
    }

    try {
      const match = await fetchOneVOneMatchByCode(matchJoinCode.trim())

      if (!match) {
        throw new Error('No match was found for that code.')
      }

      const claimedMatch =
        match.opponent_id || match.created_by === currentUserId
          ? match
          : await joinOneVOneMatch(match.id, currentUserId)
      const preset = await fetchPreset(claimedMatch.preset_id)

      setRounds(preset.rounds)
      setRoundIndex(0)
      setScore(0)
      setHistory([])
      setRoundResult(null)
      setTimeLeftMs(ROUND_DURATION_MS)
      setGameContext({
        leaderboardSources: [],
        mode: 'one_v_one',
        match: claimedMatch,
        roundCount: claimedMatch.round_count,
      })
      setGameState('playing')
      navigate('/game')
    } catch (error) {
      setGameError(error.message || 'Could not join the private match.')
    }
  }

  async function handleJoinPublicMatch(matchId) {
    if (!currentUserId) {
      navigate('/account')
      return
    }

    try {
      const match = publicMatches.find((entry) => entry.id === matchId)

      if (!match) {
        throw new Error('This public match is no longer available.')
      }

      const claimedMatch =
        match.opponent_id || match.created_by === currentUserId
          ? match
          : await joinOneVOneMatch(match.id, currentUserId)
      const preset = await fetchPreset(claimedMatch.preset_id)

      setRounds(preset.rounds)
      setRoundIndex(0)
      setScore(0)
      setHistory([])
      setRoundResult(null)
      setTimeLeftMs(ROUND_DURATION_MS)
      setGameContext({
        leaderboardSources: [],
        mode: 'one_v_one',
        match: claimedMatch,
        roundCount: claimedMatch.round_count,
      })
      setGameState('playing')
      navigate('/game')
    } catch (error) {
      setGameError(error.message || 'Could not join the public match.')
    }
  }

  async function handleCreateLobby() {
    if (!currentUserId) {
      navigate('/account')
      return
    }

    setGameState('loading')
    setGameError('')

    try {
      const snapshot = await buildBlindtestSnapshot({ requireSingleSource: true })
      const lobby = await createMultiplayerLobby({
        hostId: currentUserId,
        source: snapshot.source,
        roundCount,
        rounds: snapshot.rounds,
      })

      await joinMultiplayerLobby({
        lobbyId: lobby.id,
        userId: currentUserId,
        displayName: currentDisplayName,
        isHost: true,
      })

      setCurrentLobby(lobby)
      setGameState('setup')
      navigate('/multiplayer')
    } catch (error) {
      setGameState('setup')
      setGameError(error.message || 'Could not create the multiplayer lobby.')
    }
  }

  async function handleJoinLobby() {
    if (!currentUserId) {
      navigate('/account')
      return
    }

    try {
      const lobby = await fetchLobbyByCode(lobbyJoinCode.trim())

      if (!lobby) {
        throw new Error('No lobby was found for that code.')
      }

      await joinMultiplayerLobby({
        lobbyId: lobby.id,
        userId: currentUserId,
        displayName: currentDisplayName,
        isHost: lobby.host_id === currentUserId,
      })

      setCurrentLobby(lobby)

      if (lobby.status === 'live' && lobby.preset_id) {
        const preset = await fetchPreset(lobby.preset_id)
        setRounds(preset.rounds)
        setRoundIndex(0)
        setScore(0)
        setHistory([])
        setRoundResult(null)
        setTimeLeftMs(ROUND_DURATION_MS)
        setGameContext({
          leaderboardSources: [],
          mode: 'multiplayer',
          lobby,
          roundCount: lobby.round_count,
        })
        setGameState('playing')
        navigate('/game')
      }
    } catch (error) {
      setGameError(error.message || 'Could not join the lobby.')
    }
  }

  async function handleStartLobby() {
    if (!currentLobby) {
      return
    }

    try {
      const startedLobby = await startMultiplayerLobby(currentLobby.id)
      const preset = await fetchPreset(startedLobby.preset_id)

      setCurrentLobby(startedLobby)
      setRounds(preset.rounds)
      setRoundIndex(0)
      setScore(0)
      setHistory([])
      setRoundResult(null)
      setTimeLeftMs(ROUND_DURATION_MS)
      setGameContext({
        leaderboardSources: [],
        mode: 'multiplayer',
        lobby: startedLobby,
        roundCount: startedLobby.round_count,
      })
      setGameState('playing')
      navigate('/game')
    } catch (error) {
      setGameError(error.message || 'Could not start the lobby.')
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
    navigate(
      gameContext?.mode === 'one_v_one'
        ? '/one-v-one'
        : gameContext?.mode === 'multiplayer'
          ? '/multiplayer'
          : '/artist-mode',
    )
  }

  function goBackToSetup() {
    audioRef.current?.pause()
    setAudioBlocked(false)
    setAudioReady(false)
    navigate(
      gameContext?.mode === 'one_v_one'
        ? '/one-v-one'
        : gameContext?.mode === 'multiplayer'
          ? '/multiplayer'
          : '/artist-mode',
    )
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
        <NavLink to="/" className="brand-link">
          EasyBlindtest
        </NavLink>

        <nav className="site-nav">
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>
          <NavLink to="/artist-mode" className="nav-link">
            Artist Mode
          </NavLink>
          <NavLink to="/playlist-mode" className="nav-link">
            Playlist Mode
          </NavLink>
          <NavLink to="/one-v-one" className="nav-link">
            1v1
          </NavLink>
          <NavLink to="/multiplayer" className="nav-link">
            Multiplayer
          </NavLink>
          <NavLink to="/leaderboard" className="nav-link">
            Leaderboard
          </NavLink>
          <NavLink to="/account" className="nav-link">
            {session ? currentDisplayName : 'Account'}
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              trendingBlindtests={trendingBlindtests}
              publicMatches={publicMatches}
              publicLobbies={publicLobbies}
            />
          }
        />
        <Route
          path="/artist-mode"
          element={
            <ArtistModePage
              addArtist={addArtist}
              applyPlaylist={applyPlaylist}
              gameError={gameError}
              gameState={gameState}
              manualArtists={manualArtists}
              playlistError={playlistError}
              playlists={PREMADE_PLAYLISTS}
              removePlaylist={removePlaylist}
              removeArtist={removeArtist}
              roundCount={roundCount}
              searchError={searchError}
              searchResults={searchResults}
              searchState={searchState}
              searchTerm={searchTerm}
              selectedPlaylists={selectedPlaylists}
              setRoundCount={setRoundCount}
              setSearchError={setSearchError}
              setSearchResults={setSearchResults}
              setSearchState={setSearchState}
              setSearchTerm={setSearchTerm}
              clearSelectedArtists={clearSelectedArtists}
              onSubmit={startGame}
              submitDisabled={false}
            />
          }
        />
        <Route
          path="/playlist-mode"
          element={
            <PlaylistModePage
              addArtist={addArtist}
              applyPlaylist={applyPlaylist}
              gameError={gameError}
              gameState={gameState}
              manualArtists={manualArtists}
              playlistError={playlistError}
              playlists={PREMADE_PLAYLISTS}
              removePlaylist={removePlaylist}
              removeArtist={removeArtist}
              roundCount={roundCount}
              searchError={searchError}
              searchResults={searchResults}
              searchState={searchState}
              searchTerm={searchTerm}
              selectedPlaylists={selectedPlaylists}
              setRoundCount={setRoundCount}
              setSearchError={setSearchError}
              setSearchResults={setSearchResults}
              setSearchState={setSearchState}
              setSearchTerm={setSearchTerm}
              clearSelectedArtists={clearSelectedArtists}
              onSubmit={startGame}
              submitDisabled={false}
            />
          }
        />
        <Route
          path="/one-v-one"
          element={
            <OneVOnePage
              activeTab={oneVOneTab}
              addArtist={addArtist}
              applyPlaylist={applyPlaylist}
              clearSelectedArtists={clearSelectedArtists}
              gameError={gameError}
              gameState={gameState}
              joinCode={matchJoinCode}
              manualArtists={manualArtists}
              myMatches={myMatches}
              onJoinPublicMatch={handleJoinPublicMatch}
              onJoinPrivateMatch={handleJoinPrivateMatch}
              onSubmit={handleCreateOneVOneMatch}
              playlistError={playlistError}
              playlists={PREMADE_PLAYLISTS}
              publicMatches={publicMatches}
              removePlaylist={removePlaylist}
              removeArtist={removeArtist}
              roundCount={roundCount}
              searchError={searchError}
              searchResults={searchResults}
              searchState={searchState}
              searchTerm={searchTerm}
              selectedPlaylists={selectedPlaylists}
              setActiveTab={setOneVOneTab}
              setJoinCode={setMatchJoinCode}
              setRoundCount={setRoundCount}
              setSearchError={setSearchError}
              setSearchResults={setSearchResults}
              setSearchState={setSearchState}
              setSearchTerm={setSearchTerm}
              setVisibility={setOneVOneVisibility}
              submitDisabled={false}
              visibility={oneVOneVisibility}
            />
          }
        />
        <Route
          path="/multiplayer"
          element={
            <MultiplayerPage
              addArtist={addArtist}
              applyPlaylist={applyPlaylist}
              clearSelectedArtists={clearSelectedArtists}
              currentLobby={currentLobby}
              gameError={gameError}
              gameState={gameState}
              joinCode={lobbyJoinCode}
              liveScoreboard={liveScoreboard}
              lobbyPlayers={lobbyPlayers}
              manualArtists={manualArtists}
              onJoinLobby={handleJoinLobby}
              onStartLobby={handleStartLobby}
              onSubmit={handleCreateLobby}
              playlistError={playlistError}
              playlists={PREMADE_PLAYLISTS}
              publicLobbies={publicLobbies}
              removePlaylist={removePlaylist}
              removeArtist={removeArtist}
              roundCount={roundCount}
              searchError={searchError}
              searchResults={searchResults}
              searchState={searchState}
              searchTerm={searchTerm}
              selectedPlaylists={selectedPlaylists}
              setJoinCode={setLobbyJoinCode}
              setRoundCount={setRoundCount}
              setSearchError={setSearchError}
              setSearchResults={setSearchResults}
              setSearchState={setSearchState}
              setSearchTerm={setSearchTerm}
              submitDisabled={false}
            />
          }
        />
        <Route
          path="/leaderboard"
          element={
            <LeaderboardPage
              globalLeaderboard={globalLeaderboard}
              trendingBlindtests={trendingBlindtests}
            />
          }
        />
        <Route
          path="/account"
          element={
            <AccountPage
              authDisplayName={authDisplayName}
              authEmail={authEmail}
              authError={authError}
              authNotice={authNotice}
              authMode={authMode}
              authPassword={authPassword}
              authState={authState}
              onSaveDisplayName={handleSaveProfileName}
              onSignOut={signOutUser}
              onSubmitAuth={handleAuthSubmit}
              profile={profile}
              session={session}
              setAuthDisplayName={setAuthDisplayName}
              setAuthEmail={setAuthEmail}
              setAuthMode={setAuthMode}
              setAuthPassword={setAuthPassword}
            />
          }
        />
        <Route
          path="/legacy-setup"
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
            <CompetitiveGamePage
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
              matchJoinCode={gameContext?.match?.join_code ?? null}
              sessionMode={gameContext?.mode ?? 'solo'}
              submissionError={submissionError}
              submissionState={submissionState}
              submitAnswer={submitAnswer}
              timeLeftMs={timeLeftMs}
              liveScoreboard={liveScoreboard}
            />
          }
        />
        <Route
          path="/legacy-game"
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
