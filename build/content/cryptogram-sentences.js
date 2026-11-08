'use strict';
// Cryptogram plaintexts. Proverbs are traditional and unattributed; sayings were written for
// Gridlock Puzzle Co. No sentence is a quotation attributed to any person.

const proverbs = [
  'A stitch in time saves nine.',
  'Many hands make light work.',
  'Still waters run deep.',
  'The early bird catches the worm.',
  'Every cloud has a silver lining.',
  'Actions speak louder than words.',
  'Rome was not built in a day.',
  'Look before you leap.',
  'Too many cooks spoil the broth.',
  'A watched pot never boils.',
  'Absence makes the heart grow fonder.',
  'All that glitters is not gold.',
  'Better late than never.',
  'Birds of a feather flock together.',
  'Do not count your chickens before they hatch.',
  'Do not put all your eggs in one basket.',
  'Every dog has its day.',
  'Fortune favors the bold.',
  'Great oaks from little acorns grow.',
  'Half a loaf is better than none.',
  'Haste makes waste.',
  'Honesty is the best policy.',
  'If the shoe fits, wear it.',
  'Make hay while the sun shines.',
  'Necessity is the mother of invention.',
  'No news is good news.',
  'Practice makes perfect.',
  'Where there is a will, there is a way.',
  'You cannot judge a book by its cover.',
  'Two heads are better than one.',
  'When in Rome, do as the Romans do.',
  'A rolling stone gathers no moss.',
  'The grass is always greener on the other side of the fence.',
  'Beauty is in the eye of the beholder.',
  'Patience is a virtue.',
  'Slow and steady wins the race.',
  'The squeaky wheel gets the grease.',
  'Waste not, want not.',
  'You reap what you sow.',
  'Out of sight, out of mind.',
  'Easy come, easy go.',
  'Good things come to those who wait.',
  'Hope for the best, prepare for the worst.',
  'Measure twice, cut once.',
  'One good turn deserves another.',
  'There is no time like the present.',
  'Time and tide wait for no one.',
  'What goes around comes around.',
  'You can lead a horse to water, but you cannot make it drink.',
  'A bird in the hand is worth two in the bush.',
  'Do not cross the bridge until you come to it.',
  'Every little bit helps.',
  'There is no use crying over spilled milk.',
  'Strike while the iron is hot.',
  'The proof of the pudding is in the eating.',
  'All good things must come to an end.',
  'Do not bite the hand that feeds you.',
  'A friend in need is a friend indeed.',
  'Better safe than sorry.',
  'Do not look a gift horse in the mouth.',
  'Forewarned is forearmed.',
  'It never rains but it pours.',
  'Many a true word is spoken in jest.',
  'Nothing ventured, nothing gained.',
  'Practice what you preach.',
  'The apple does not fall far from the tree.',
  'The more the merrier.',
  'Two wrongs do not make a right.',
  'Well begun is half done.',
  'You cannot have your cake and eat it too.',
  'Barking dogs seldom bite.',
  'When the cat is away, the mice will play.',
  'Let sleeping dogs lie.',
  'Silence is golden.',
  'April showers bring May flowers.',
  'Do not make a mountain out of a molehill.',
  'Little by little, the bird builds its nest.',
  'Smooth seas do not make skillful sailors.',
  'Hunger is the best sauce.',
  'Empty vessels make the most noise.',
  'Tomorrow is another day.',
  'You catch more flies with honey than with vinegar.',
  'A chain is only as strong as its weakest link.',
];

const sayings = [
  'A sharp pencil and a quiet morning can solve almost anything.',
  'The last square is never as hard as the first one looked.',
  'Good maps are drawn by people who got lost first.',
  'Every kettle sings when it is ready, never before.',
  'A tidy desk is just a puzzle that has already been solved.',
  'The best gardens begin with a handful of patient seeds.',
  'Some answers arrive only after you put the pen down.',
  'Bread rises in its own time, no matter how often you check.',
  'A long walk turns big worries into small pebbles.',
  'The crossword is finished when the coffee is cold.',
  'Write the easy answers first and the hard ones will follow.',
  'Even the longest river starts as a trickle in the hills.',
  'A good question is often worth more than a quick answer.',
  'Keep your pencil sharp and your eraser close.',
  'The moon does not hurry, yet it is never late.',
  'A borrowed book should come home with a new bookmark.',
  'Small boats learn the sea one wave at a time.',
  'Kind words cost nothing and travel a long way.',
  'An open window lets in more than fresh air.',
  'Every recipe is a story that ends with dinner.',
  'The quiet player often wins the longest game.',
  'A clue that seems impossible is usually just shy.',
  'A lighthouse keeps its promise every single night.',
  'The best seat on a train is the one facing forward.',
  'Footprints in the snow tell the story of the morning.',
  'A wise cook tastes the soup before adding more salt.',
  'Rain on the roof makes every book more interesting.',
  'A map shows the road, but you still have to walk it.',
  'Each puzzle you finish makes the next one friendlier.',
  'The clock on the wall cannot hurry a good idea.',
  'A garden teaches patience better than any lecture.',
  'When the grid looks hopeless, look for the smallest gap.',
  'A warm loaf and a full teapot make any visit longer.',
  'The tide returns whether or not we watch it.',
  'Old letters keep their warmth long after the ink fades.',
  'Every mountain trail is easier with good company.',
  'The hardest knot comes loose with gentle fingers.',
  'A blank page is just an invitation in disguise.',
  'Fresh snow makes the whole town sound softer.',
  'Ask the baker which loaf came out of the oven last.',
  'The sea is always busy, even when it looks calm.',
  'A good friend notices when your cup is empty.',
  'Sometimes the right answer is hiding in the clue itself.',
  'A careful reader finds treasure in the footnotes.',
  'Leave the campsite cleaner than you found it.',
  'The orchard remembers every gardener who pruned it well.',
  'Winter evenings were made for puzzles and soup.',
  'A pocket notebook catches ideas before they fly away.',
  'Every street has a story if you walk it slowly enough.',
  'The kettle and the crossword are old friends.',
  'Count the stars until you lose track, then start again.',
  'A wobbly table can be fixed with a folded postcard.',
  'Good neighbors share their tomatoes in August.',
  'One honest mistake teaches more than ten lucky guesses.',
  'An empty grid is the most hopeful thing on the page.',
  'A sailor reads the clouds the way a baker reads the dough.',
  'The first sip of tea is the best part of the morning.',
  'Bright scarves make gray days a little shorter.',
  'A chair by the window is worth two by the door.',
  'Even a small candle can make a dark room friendly.',
  'Every bridge was once just an idea and a sketch.',
  'The best stories are told twice and remembered for years.',
  'Pack an umbrella and the sun will follow you all day.',
  'A slow breakfast is the start of a good weekend.',
  'Nobody regrets the extra minute spent checking the grid.',
];

// Longer sentences for The Black Label Collection, shown with spaces and punctuation removed.
const unspaced = [
  'Every great puzzle hides its first step in plain sight, waiting for a patient eye to notice it.',
  'The mapmaker walked every lane twice, once to measure it and once simply to enjoy the view.',
  'A lighthouse cannot sail out to meet anyone, but it can stand steady and shine all night long.',
  'The baker rose before the birds and filled the quiet street with the scent of warm bread.',
  'Somewhere between the third cup of tea and the last clue, the whole grid finally made sense.',
  'A good traveler packs light, listens closely, and always leaves room in the bag for surprises.',
  'The old clock in the hallway kept perfect time for years, as long as someone remembered to wind it.',
  'When the river floods the meadow each spring, the farmers smile because the soil grows richer.',
  'A careful gardener learns the name of every weed before deciding which ones to pull.',
  'The violinist practiced the same eight bars all week until they sounded effortless.',
  'Under the bridge, the canal boats pass so slowly that the ducks have time to race them.',
  'Every winter the village builds a snowman taller than the one before, and nobody knows who started it.',
  'The librarian could find any book in the building, even the ones that had been misplaced for years.',
  'A sudden summer storm sent the picnic guests running, but the strawberries stayed perfectly dry.',
  'The ferry crosses the bay at dawn, carrying newspapers, bread, and one very sleepy dog.',
  'Hidden in the attic was a trunk of postcards from every harbor town along the northern coast.',
  'The night sky over the desert is so clear that the stars seem close enough to collect.',
  'Halfway up the mountain the hikers stopped for lunch and watched the clouds drift below them.',
  'The puzzle editor tested every clue on her grandmother, who solved them faster than anyone.',
  'A market stall full of ripe peaches is the surest sign that summer has truly arrived.',
  'The train pulled into the station exactly on time, which surprised every passenger aboard.',
  'Our kitchen window faces east, so breakfast always comes with a sunrise on the side.',
  'The best way to learn a city is to get pleasantly lost and ask a stranger for directions.',
  'Each autumn the maple tree in the square turns red, then orange, then a brilliant gold.',
  'The beekeeper moves slowly and speaks softly, and the bees seem to appreciate the courtesy.',
  'A tiny bookshop on the corner sold maps, marmalade, and the finest pencils in the county.',
];

// Everyday English words (the team's own list). Used only by the uniqueness checker, which
// searches for any second readable decoding built from these and every other word in the catalog.
const common = `a about above across act add after again against age ago agree air all almost alone along already also always am among an and
animal another answer any anyone anything appear are area arm around arrive art as ask at away baby back bad bag ball bank bar base be bear
beat became because become bed been before began begin behind being believe below best better between big bill bird bit black blood blue board
boat body bone book born both bottom box boy bread break bring broke brother brought brown build built burn busy but buy by call came camp can
cannot car card care carry case cat catch cause center chair chance change cheap check child choose city class clean clear climb close cloth
cloud cold color come common cook cool copy corner cost could count country course cover cross crowd cry cup cut dark day dead deal dear decide
deep did die different dinner direct do does dog done door double down draw dream dress drink drive drop dry during each ear early earth easy
eat edge egg eight either else end enough even evening ever every exact example eye face fact fair fall family far farm fast fat father fear
feed feel feet fell felt few field fight fill final find fine finger finish fire first fish fit five flat floor flower fly follow food foot
for force forest form forward found four free fresh friend from front fruit full fun game garden gave get gift girl give glad glass go goes gold
gone good got grass gray great green grew ground group grow guess guide had hair half hall hand happen happy hard has hat have he head hear
heard heart heat heavy held help her here high hill him his hit hold hole home hope horse hot hour house how huge hundred hunt hurry idea if
in inch inside into iron is island it its job join joy jump just keep kept key kind king knew know lady lake land large last late laugh law
lay lead learn least leave led left leg less let letter level lie life lift light like line list listen little live long look lose lost lot
loud love low made main make man many map mark market may me mean meant meet men middle might mile milk mind minute miss moon more morning most
mother mountain move much music must my name near need never new next nice night nine no noise none noon nor north nose not note nothing notice
now number of off offer often oil old on once one only open or order other our out over own page paint pair paper part party pass past path
pay people pick picture piece place plain plan plant play please point poor post pound power press pretty pull push put quick quiet quite race
rain raise ran rather reach read ready real red remember rest rich ride right ring rise river road rock roll room round row rule run said same
sat save saw say school sea season seat second see seem seen sell send sent serve set seven shall shape share she ship shoe shop short should
show shut sick side sight sign simple since sing sister sit six size skin sky sleep slow small smile snow so soft soil some son song soon sound
south space speak special spend spoke spot spring square stand star start state stay step stick still stone stood stop store story straight
strange street strong student study such sudden suit summer sun sure surprise sweet table tail take talk tall taste teach tear tell ten than
thank that the their them then there these they thick thin thing think third this those though thought three through throw tie till time tiny
tire to today together told tomorrow tone too took top touch toward town track trade train tree trip trouble true try turn twelve twenty two
under until up upon us use usual very view visit voice wait walk wall want warm was wash watch water wave way we wear weather week weight well
went were west what wheel when where which while white who whole why wide wife wild will win wind window wing winter wire wise wish with
within without woman women wonder wood word work world worry would write wrong yard year yellow yes yet you young your`;

module.exports = { proverbs, sayings, unspaced, common: common.split(/\s+/).filter(Boolean) };
