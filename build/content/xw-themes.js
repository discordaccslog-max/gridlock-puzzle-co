'use strict';
// Crossword themes and theme-entry clues, written for Gridlock Puzzle Co.
// Every entry is a real word, name or common phrase that genuinely belongs to its theme.
// Spaces in an entry are word breaks shown in the clue's enumeration, e.g. (7,4).

const mini = [
  { title: 'Breakfast Table', entries: [
    ['PANCAKE', 'Flat griddle cake stacked and syruped'], ['OATMEAL', 'Warm bowl of rolled grain'],
    ['MUFFINS', 'Domed bakes often studded with blueberries'], ['SAUSAGE', 'Breakfast link from the frying pan'] ] },
  { title: 'The Garden Shed', entries: [
    ['SHOVELS', 'Tools for moving soil'], ['PRUNERS', 'Snippers for overgrown roses'],
    ['PLANTER', 'Container for a potted shrub'], ['COMPOST', 'Rotted scraps that feed a vegetable bed'] ] },
  { title: 'Under the Sea', entries: [
    ['SEAWEED', 'Kelp, for one'], ['DOLPHIN', 'Clicking mammal that rides bow waves'],
    ['OCTOPUS', 'Eight-armed master of disguise'], ['MANATEE', 'Gentle sea cow of warm coastal waters'] ] },
  { title: 'Band Practice', entries: [
    ['BASSOON', 'Low woodwind with a long folded tube'], ['TRUMPET', 'Valved brass instrument with a bright tone'],
    ['UKULELE', 'Small four-stringed instrument from Hawaii'], ['PICCOLO', 'Half-sized flute with a piercing voice'], ['BAGPIPE', 'Instrument with drones and a bag'] ] },
  { title: 'Weather Report', entries: [
    ['DRIZZLE', 'Fine, light rain'], ['TORNADO', 'Twisting funnel cloud'],
    ['THUNDER', 'Rumble after a flash'], ['MONSOON', 'Seasonal wind that brings heavy rain'], ['CYCLONE', 'Rotating storm system'] ] },
  { title: 'The Bakery', entries: [
    ['CRUMPET', 'Griddle cake full of holes'], ['PRETZEL', 'Knotted bake with coarse salt'],
    ['STRUDEL', 'Pastry rolled around spiced apple'], ['BRIOCHE', 'Rich, buttery French bread'], ['CUPCAKE', 'Single-serving frosted cake'] ] },
  { title: 'Down on the Farm', entries: [
    ['ROOSTER', 'Bird that crows at dawn'], ['TRACTOR', 'Vehicle that pulls a plow'],
    ['PIGLETS', 'Young pigs'], ['HAYLOFT', 'Storage space above the barn'], ['STABLES', 'Buildings where horses are kept'] ] },
  { title: 'Shades of Color', entries: [
    ['CRIMSON', 'Deep red'], ['EMERALD', 'Rich jewel green'],
    ['SCARLET', 'Bright red with a hint of orange'], ['MAGENTA', 'Purplish pink of printer ink'] ] },
  { title: 'Under the Big Top', entries: [
    ['ACROBAT', 'Tumbler in a spangled costume'], ['JUGGLER', 'Performer who keeps clubs in the air'],
    ['TRAPEZE', 'Swinging bar high above the ring'] ] },
  { title: 'Space Trip', entries: [
    ['JUPITER', 'Largest planet in the solar system'], ['MERCURY', 'Planet closest to the sun'],
    ['ROCKETS', 'Vehicles that lift off from a launch pad'], ['PLANETS', 'Bodies that orbit a star'] ] },
  { title: 'Fruit Bowl', entries: [
    ['APRICOT', 'Small orange stone fruit'], ['BANANAS', 'Yellow fruits sold in bunches'],
    ['PAPAYAS', 'Tropical fruits with black seeds'], ['KUMQUAT', 'Tiny citrus eaten peel and all'] ] },
  { title: 'Winter Wardrobe', entries: [
    ['EARMUFF', 'One of a pair of fuzzy ear warmers'], ['SWEATER', 'Knitted pullover'],
    ['BEANIES', 'Snug knitted caps'] ] },
  { title: 'Beach Day', entries: [
    ['SANDALS', 'Open-toed summer shoes'], ['SURFERS', 'Riders of the breakers'],
    ['PICNICS', 'Meals on a blanket'], ['SANDBAR', 'Ridge exposed at low tide'] ] },
  { title: 'Dog Show', entries: [
    ['BEAGLES', 'Floppy-eared scent hounds'], ['POODLES', 'Curly-coated dogs in three sizes'],
    ['TERRIER', 'Feisty breed bred to dig'], ['SPANIEL', 'Silky-eared sporting breed'], ['COLLIES', 'Herding dogs with long snouts'] ] },
  { title: 'Cheese Board', entries: [
    ['CHEDDAR', 'Firm cheese named for an English village'], ['GRUYERE', 'Swiss cheese used in fondue'],
    ['STILTON', 'Blue-veined English cheese'], ['RICOTTA', 'Soft Italian cheese used in lasagna'] ] },
  { title: 'Spice Rack', entries: [
    ['OREGANO', 'Herb sprinkled on pizza'], ['PAPRIKA', 'Red powder made from dried peppers'],
    ['SAFFRON', 'Costly golden threads from a crocus'], ['CARAWAY', 'Seed that flavors rye bread'] ] },
  { title: 'At the Library', entries: [
    ['AUTHORS', 'Writers of books'], ['CATALOG', 'Index of every book on the shelves'],
    ['FICTION', 'Section for novels'], ['READERS', 'Borrowers with cards'] ] },
  { title: 'The Toolbox', entries: [
    ['HAMMERS', 'Tools for driving nails'], ['CHISELS', 'Sharp-edged tools for shaping wood'],
    ['SPANNER', 'Wrench, in British English'], ['MALLETS', 'Wooden-headed hammers'] ] },
  { title: 'Big Cats', entries: [
    ['CHEETAH', 'Spotted sprinter of the savanna'], ['LEOPARD', 'Spotted cat that rests in trees'],
    ['PANTHER', 'Black-coated big cat'], ['OCELOTS', 'Small spotted cats of the Americas'] ] },
  { title: 'The Sweet Shop', entries: [
    ['TOFFEES', 'Chewy buttery candies'], ['CARAMEL', 'Cooked sugar with a golden color'],
    ['GUMDROP', 'Sugar-coated chewy candy'], ['BONBONS', 'Chocolate-covered sweets'] ] },
  { title: 'Flower Garden', entries: [
    ['PETUNIA', 'Trumpet-shaped bedding plant'], ['ORCHIDS', 'Exotic blooms often grown indoors'],
    ['PEONIES', 'Big, ruffled late-spring flowers'], ['VIOLETS', 'Small purple woodland flowers'] ] },
  { title: 'Ballroom', entries: [
    ['FOXTROT', 'Smooth ballroom dance'], ['WALTZES', 'Dances in three-four time'],
    ['MAZURKA', 'Lively Polish folk dance'], ['TWO STEP', 'Simple country dance in quick time'], ['RHUMBAS', 'Cuban ballroom dances with hip sway'] ] },
  { title: 'Precious Stones', entries: [
    ['DIAMOND', 'Hardest natural gemstone'], ['GARNETS', 'Deep red January birthstones'],
    ['PERIDOT', 'Olive-green August birthstone'], ['EMERALD', 'Green gem of the beryl family'] ] },
  { title: 'Bug Hunt', entries: [
    ['BEETLES', 'Insects with hard wing cases'], ['CRICKET', 'Insect that chirps by rubbing its wings'],
    ['LADYBUG', 'Spotted red beetle'], ['TERMITE', 'Insect that builds tall mounds'] ] },
  { title: 'Pasta Night', entries: [
    ['RAVIOLI', 'Stuffed pasta squares'], ['LASAGNA', 'Layered baked pasta dish'],
    ['FUSILLI', 'Corkscrew-shaped pasta'], ['GNOCCHI', 'Little potato dumplings'] ] },
];

const midi = [
  { title: 'Around the House', entries: [
    ['KITCHEN', 'Room with a stove'], ['HALLWAY', 'Corridor between rooms'], ['BEDROOM', 'Room for sleeping'], ['LANDING', 'Floor area at the top of the stairs'],
    ['ATTIC', 'Storage space under the roof'], ['PORCH', 'Covered area by the front door'], ['STUDY', 'Room for reading and writing'], ['FOYER', 'Entrance hall'] ] },
  { title: 'Picnic Basket', entries: [
    ['BLANKET', 'Something to spread on the grass'], ['NAPKINS', 'Paper squares for sticky fingers'], ['HAMPERS', 'Wicker baskets with lids'],
    ['GRAPE', 'Fruit eaten in bunches'], ['BREAD', 'Loaf for sandwiches'], ['SALAD', 'Bowl of greens'], ['CIDER', 'Pressed apple drink'], ['PEACH', 'Fuzzy summer fruit'] ] },
  { title: 'Camping Trip', entries: [
    ['SLEEPING BAG', 'Zip-up bed for a tent'], ['MARSHMALLOW', 'Sweet toasted on a stick'],
    ['LANTERN', 'Light that hangs from the tent pole'], ['COMPASS', 'Instrument that points north'], ['CANTEEN', 'Water bottle for the trail'], ['HAMMOCK', 'Bed strung between trees'],
    ['TENTS', 'Canvas shelters'], ['CANOE', 'Boat paddled across the lake'], ['TRAIL', 'Path through the woods'], ['HIKER', 'One who walks the trail'] ] },
  { title: 'Office Supplies', entries: [
    ['HIGHLIGHTER', 'Marker that makes text glow'], ['STICKY NOTES', 'Small squares that cling to a monitor'],
    ['STAPLER', 'Device that binds pages'], ['MARKERS', 'Felt-tip pens'], ['FOLDERS', 'Card sleeves for papers'], ['PENCILS', 'Writing tools with erasers'],
    ['CLIPS', 'Bent wires that hold pages'], ['RULER', 'Straight edge with inches'], ['PAPER', 'Printer supply'], ['CHALK', 'Stick for a board'] ] },
  { title: 'Sports Day', entries: [
    ['HURDLES', 'Barriers to leap in a race'], ['PODIUMS', 'Platforms for the top three'], ['WINNERS', 'Those who come first'], ['RIBBONS', 'Rosettes for the top three'],
    ['MEDAL', 'Disc on a ribbon'], ['RELAY', 'Team race with handovers'], ['BATON', 'Stick passed between runners'], ['TRACK', 'Oval for running'] ] },
  { title: 'Tea Party', entries: [
    ['TEAPOTS', 'Vessels for brewing leaves'], ['SAUCERS', 'Small plates under cups'], ['TEACUPS', 'Dainty cups with handles'], ['DOILIES', 'Lacy mats under cakes'],
    ['SCONE', 'Teatime bake with jam'], ['SUGAR', 'Lumps for sweetening'], ['CREAM', 'Clotted topping'], ['LEMON', 'Slice for black tea'] ] },
  { title: 'Science Lab', entries: [
    ['EXPERIMENTS', 'Tests of a hypothesis'], ['MICROSCOPES', 'Lenses for tiny things'],
    ['BEAKERS', 'Glass cups with spouts'], ['BURNERS', 'Lab flames'], ['MAGNETS', 'They attract iron'], ['FORMULA', 'Chemical recipe'],
    ['FLASK', 'Narrow-necked lab bottle'], ['PRISM', 'Glass that splits light'], ['LASER', 'Focused light beam'], ['ATOMS', 'Tiny building blocks'] ] },
  { title: 'Art Class', entries: [
    ['WATERCOLORS', 'Colors thinned with water'],
    ['PALETTE', 'Board for mixing colors'], ['CRAYONS', 'Wax drawing sticks'], ['PASTELS', 'Soft chalky colors'], ['BRUSHES', 'Bristled tools for an artist'],
    ['EASEL', 'Stand for a canvas'], ['PAINT', 'Color in a tube'], ['GLAZE', 'Glassy coating for pottery'], ['MURAL', 'Picture on a wall'] ] },
  { title: 'Birthday Party', entries: [
    ['CELEBRATION', 'Festive occasion'],
    ['BALLOON', 'Inflated party decoration'], ['CANDLES', 'Lights on a cake'], ['PRESENT', 'Wrapped gift'], ['PINATAS', 'Papier-mache figures full of candy'],
    ['GIFTS', 'Presents'], ['GAMES', 'Party activities'], ['CARDS', 'Greetings in envelopes'], ['CAKES', 'Frosted bakes'] ] },
  { title: 'Bird Watching', entries: [
    ['NIGHTINGALE', 'Bird known for evening song'], ['WOODPECKERS', 'Birds that drum on bark'],
    ['SPARROW', 'Small brown songbird'], ['PELICAN', 'Bird with a pouched bill'], ['PENGUIN', 'Flightless swimmer'], ['OSTRICH', 'Fastest bird on land'],
    ['ROBIN', 'Red-breasted songbird'], ['HERON', 'Long-legged wader'], ['EGRET', 'White wading bird'], ['RAVEN', 'Large black bird'] ] },
  { title: 'Movie Night', entries: [
    ['POPCORN', 'Buttery snack in a bucket'], ['TICKETS', 'Stubs for admission'], ['TRAILER', 'Preview before the feature'], ['SEQUELS', 'Follow-up films'],
    ['ACTOR', 'Performer on screen'], ['SCENE', 'Part of a film'], ['DRAMA', 'Serious film genre'], ['VIDEO', 'Recorded footage'] ] },
  { title: 'Fairy Tales', entries: [
    ['ENCHANTMENT', 'Bewitchment'],
    ['WIZARDS', 'Sorcerers in pointed hats'], ['CASTLES', 'Turreted royal homes'], ['GOBLINS', 'Mischievous little creatures'], ['DRAGONS', 'Winged beasts guarding gold'],
    ['FAIRY', 'Winged sprite'], ['MAGIC', 'Wand power'], ['GIANT', 'Beanstalk dweller'], ['SPELL', 'Words of power'] ] },
  { title: 'Market Day', entries: [
    ['VENDORS', 'Sellers at the booths'], ['BARGAIN', 'Good deal'], ['PRODUCE', 'Fresh greens and roots'], ['BASKETS', 'Carriers for shopping'],
    ['STALL', 'Market booth'], ['PRICE', 'What a tag shows'], ['FRUIT', 'Apples or plums'], ['HONEY', 'Golden jar from a beekeeper'] ] },
  { title: 'Sewing Box', entries: [
    ['EMBROIDERED', 'Stitched with decoration'],
    ['THIMBLE', 'Finger cap for sewing'], ['BUTTONS', 'Fasteners with holes'], ['NEEDLES', 'Pointed sewing tools'], ['BOBBINS', 'Spools in a sewing machine'],
    ['SPOOL', 'Reel of thread'], ['PATCH', 'Fabric mend'], ['PLEAT', 'Fold in a skirt'], ['SEAMS', 'Stitched joins'] ] },
  { title: 'Snow Day', entries: [
    ['SNOWMAN', 'Figure with a carrot nose'], ['SLEDGES', 'Runners for the hill'], ['ICICLES', 'Frozen drips from the eaves'], ['MITTENS', 'Thumbed gloves'],
    ['FROST', 'Icy coating on the lawn'], ['SLEET', 'Mix of rain and snow'], ['IGLOO', 'Dome made of blocks'], ['SKATE', 'Glide on the pond'] ] },
  { title: 'Herb Garden', entries: [
    ['PARSLEY', 'Curly garnish herb'], ['CHERVIL', 'Delicate herb with an anise note'], ['CATMINT', 'Herb that cats adore'],
    ['BASIL', 'Herb in pesto'], ['THYME', 'Herb with tiny leaves'], ['CHIVE', 'Oniony herb snipped onto potatoes'], ['ANISE', 'Licorice-flavored herb'] ] },
  { title: 'Ice Cream Parlor', entries: [
    ['SUNDAES', 'Dishes with sauce and a cherry'], ['VANILLA', 'Classic flavor from a pod'], ['SORBETS', 'Fruity frozen desserts'], ['TOPPING', 'Sprinkles, for one'],
    ['WAFER', 'Thin crisp biscuit'], ['SCOOP', 'Ball of ice cream'], ['FUDGE', 'Hot ___ (sundae sauce)'], ['CONES', 'Edible holders'] ] },
  { title: 'Toy Box', entries: [
    ['PUPPETS', 'Toys worked by hand or string'], ['PUZZLES', 'Brainteasing toys'], ['JIGSAWS', 'Picture puzzles in pieces'], ['MARBLES', 'Glass balls for a game'],
    ['KITES', 'Flyers on strings'], ['DOLLS', 'Toy figures'], ['TEDDY', 'Stuffed bear'], ['YOYOS', 'Toys on strings'] ] },
  { title: 'Sunday Brunch', entries: [
    ['OMELETS', 'Folded egg dishes'], ['WAFFLES', 'Grid-patterned cakes'], ['GRANOLA', 'Toasted oat cereal'], ['KIPPERS', 'Smoked herrings'],
    ['TOAST', 'Browned bread'], ['BACON', 'Crispy strips'], ['JUICE', 'Squeezed orange drink'], ['CREPE', 'Thin French pancake'] ] },
  { title: 'Rainforest', entries: [
    ['TOUCANS', 'Birds with huge bills'], ['PARROTS', 'Talking birds'], ['MONKEYS', 'Tree-swinging primates'], ['IGUANAS', 'Large lizards'],
    ['SLOTH', 'Slow tree-dweller'], ['MACAW', 'Colorful parrot'], ['VINES', 'Climbing plants'], ['FROGS', 'Croaking amphibians'] ] },
  { title: 'Garden Pond', entries: [
    ['LILYPAD', 'Floating leaf for a frog'], ['TADPOLE', 'Young frog'], ['BULRUSH', 'Tall reed at the water edge'],
    ['NEWTS', 'Small amphibians'], ['REEDS', 'Waterside grasses'], ['FROGS', 'Pond hoppers'], ['SNAIL', 'Slow shelled grazer'] ] },
  { title: 'Pet Shop', entries: [
    ['HAMSTER', 'Small pet in a wheel'], ['PUPPIES', 'Young dogs'], ['RABBITS', 'Long-eared pets'], ['GERBILS', 'Desert rodents kept as pets'],
    ['LEASH', 'Lead for a walk'], ['TREAT', 'Reward for a good dog'], ['PERCH', 'Bird cage rod'], ['BONES', 'Chew toys'] ] },
  { title: 'Woodworking', entries: [
    ['SAWDUST', 'Fine shavings on the floor'], ['VARNISH', 'Glossy finish'], ['SANDERS', 'Smoothing machines'], ['JOINERY', 'Craft of fitting wood together'],
    ['PLANE', 'Tool for shaving wood'], ['LATHE', 'Spinning shaper'], ['MAPLE', 'Hard pale wood'], ['CEDAR', 'Fragrant wood'] ] },
  { title: 'Music Festival', entries: [
    ['ENCORES', 'Extra songs'], ['GUITARS', 'Six-stringers'], ['DRUMMER', 'Keeper of the beat'], ['CONCERT', 'Live show'],
    ['BANDS', 'Musical groups'], ['SONGS', 'Tunes'], ['STAGE', 'Platform for performers'], ['CROWD', 'Audience'] ] },
  { title: 'Chess Club', entries: [
    ['KNIGHTS', 'Pieces that move in an L'], ['GAMBITS', 'Openings that sacrifice a pawn'], ['OPENING', 'First moves of a game'], ['ENDGAME', 'Final phase of a game'],
    ['PAWNS', 'Smallest chessmen'], ['ROOKS', 'Castle-shaped pieces'], ['QUEEN', 'Most powerful piece'], ['CHECK', 'Threat to the king'] ] },
];

const cartographer = [
  { title: 'Rivers of the World', entries: [
    ['MISSISSIPPI', 'River that flows past Memphis on its way to the Gulf'], ['AMAZON RIVER', 'South American waterway that carries more water than any other'],
    ['RIO GRANDE', 'River that forms part of the boundary between Texas and Mexico'], ['EUPHRATES', 'River that meets the Tigris in Iraq'], ['MACKENZIE', 'Canada\'s longest river'],
    ['SAINT LAWRENCE', 'River linking the Great Lakes to the Atlantic'], ['COLUMBIA RIVER', 'Waterway dividing Washington from Oregon for much of its length'],
    ['ZAMBEZI', 'African river that plunges over Victoria Falls'], ['YANGTZE', 'Longest river in Asia'], ['ORINOCO', 'Major river of Venezuela'], ['RIVER THAMES', 'Waterway that flows through London to the North Sea'], ['YELLOW RIVER', 'Chinese waterway named for the color of its silt'], ['IRRAWADDY', 'Great river that runs the length of Myanmar'] ] },
  { title: 'Peaks and Ranges', entries: [
    ['HIMALAYAS', 'Range that includes the world\'s highest peak'], ['DOLOMITES', 'Jagged pale mountains of northern Italy'], ['BLUE RIDGE', 'Appalachian range famous for its parkway'],
    ['MONT BLANC', 'Highest summit in the Alps'], ['ANNAPURNA', 'Himalayan massif in central Nepal'], ['ACONCAGUA', 'Highest mountain in the Americas'],
    ['CARPATHIANS', 'Mountain arc across central and eastern Europe'], ['KILIMANJARO', 'Snow-capped peak in Tanzania'], ['SIERRA MADRE', 'Mountain system running through Mexico'],
    ['URAL MOUNTAINS', 'Range often taken as the boundary between Europe and Asia'], ['EVEREST', 'Peak on the Nepal-China border'], ['ROCKIES', 'Range spanning Canada and the western US'] ] },
  { title: 'Island Hopping', entries: [
    ['GREENLAND', 'World\'s largest island'], ['GALAPAGOS', 'Islands famous for giant tortoises'], ['SANTORINI', 'Greek island of white villages on a caldera'],
    ['ISLE OF WIGHT', 'Island off England\'s south coast, across the Solent'], ['CANARY ISLANDS', 'Spanish archipelago off northwest Africa'], ['CAYMAN ISLANDS', 'Caribbean territory south of Cuba, famed for Seven Mile Beach'],
    ['VANCOUVER ISLAND', 'Large landmass off British Columbia, home to the city of Victoria'], ['MARTHAS VINEYARD', 'Island south of Cape Cod'],
    ['ICELAND', 'Island nation of geysers and glaciers'], ['CORSICA', 'Mountainous French island in the Mediterranean'], ['JAMAICA', 'Caribbean island with Blue Mountain coffee'], ['OKINAWA', 'Subtropical island in southern Japan'], ['ISLE OF MAN', 'Irish Sea island known for its tailless cats'], ['LANZAROTE', 'Volcanic Canary island with black-sand beaches'], ['FIJI ISLANDS', 'South Pacific archipelago whose capital is Suva'] ] },
  { title: 'Capital Cities', entries: [
    ['AMSTERDAM', 'Capital of the Netherlands, ringed by canals'], ['STOCKHOLM', 'Swedish capital spread across islands'], ['REYKJAVIK', 'World\'s northernmost national capital'],
    ['KATHMANDU', 'Capital of Nepal'], ['BUENOS AIRES', 'Argentina\'s capital on the Rio de la Plata'], ['KUALA LUMPUR', 'Malaysian capital with twin towers'],
    ['GUATEMALA CITY', 'Capital of the Central American country that borders Mexico'], ['NAIROBI', 'Capital of Kenya'], ['BEIJING', 'Capital of China'], ['BANGKOK', 'Capital of Thailand'], ['CARACAS', 'Capital of Venezuela'], ['JAKARTA', 'Capital of Indonesia'] ] },
  { title: 'Reading the Map', entries: [
    ['MAP LEGEND', 'Box that explains the little icons'], ['LONGITUDE', 'Measure east or west of Greenwich'], ['TRUE NORTH', 'Direction of the geographic pole'],
    ['COMPASS ROSE', 'Star-shaped direction marker on a chart'], ['CONTOUR LINE', 'Map curve joining points of equal height'], ['COORDINATES', 'Pair of numbers that pin a location'],
    ['GRID REFERENCE', 'Square-by-square way to name a spot'], ['PRIME MERIDIAN', 'Line through Greenwich at zero degrees'], ['MAGNETIC NORTH', 'Where a compass needle actually points'],
    ['SYMBOLS', 'Little icons for churches and campsites'], ['EQUATOR', 'Line of zero latitude'], ['GRID LINES', 'Ruled rows and columns that divide a map into squares'], ['BENCH MARK', 'Surveyor\'s reference point of known height'], ['TOPOGRAPHIC', 'Like a map that shows the shape of the land'] ] },
  { title: 'Great Deserts', entries: [
    ['SAND DUNES', 'Wind-built hills of grit'], ['SANDSTORM', 'Gritty gale that blots out the sun'], ['NAMIB DESERT', 'Coastal dryland with towering red dunes'],
    ['GREAT VICTORIA', 'Australia\'s largest desert, named for a queen'], ['ATACAMA DESERT', 'Exceptionally dry region of northern Chile'],
    ['SONORAN', 'Desert of saguaro cactuses'], ['ARABIAN', 'Desert covering much of a peninsula'], ['SIMPSON', 'Australian desert of parallel red dunes'], ['MIRAGES', 'Shimmering illusions of water'], ['SALT FLATS', 'Dry lake beds crusted white'], ['DESERT OASIS', 'Watering hole among the dunes'], ['CAMEL TRAINS', 'Lines of pack animals crossing the sand'], ['TUMBLEWEEDS', 'Dry plants that roll along in the wind'] ] },
  { title: 'Seas and Oceans', entries: [
    ['CARIBBEAN', 'Sea of turquoise water and many islands'], ['BALTIC SEA', 'Sea bordered by Sweden and Finland'], ['AEGEAN SEA', 'Sea between Greece and Turkey'],
    ['TASMAN SEA', 'Sea between Australia and New Zealand'], ['BERING SEA', 'Sea between Alaska and Siberia'],
    ['INDIAN OCEAN', 'Waters between Africa and Australia'], ['ARCTIC OCEAN', 'Smallest and coldest of the five great waters'], ['ADRIATIC SEA', 'Sea along Italy\'s eastern coast'], ['SARGASSO SEA', 'Sea with no coastline, known for floating seaweed'],
    ['MEDITERRANEAN', 'Sea between Europe and North Africa'], ['ATLANTIC OCEAN', 'Waters between the Americas and Europe'], ['SOUTHERN OCEAN', 'Waters that circle Antarctica'] ] },
  { title: 'All Aboard', entries: [
    ['TIMETABLE', 'Schedule of departures'], ['DINING CAR', 'Carriage where meals are served'], ['CONDUCTOR', 'Official who checks tickets on board'], ['SIGNAL BOX', 'Trackside building with levers'],
    ['SLEEPING CAR', 'Carriage with bunks for overnight trips'], ['LUGGAGE RACK', 'Shelf above the seats for bags'], ['WAITING ROOM', 'Place to sit before the train arrives'], ['STEAM ENGINE', 'Locomotive that burns coal'],
    ['STATION MASTER', 'Person in charge of a railway stop'], ['RAILWAY CARRIAGE', 'Passenger car pulled along the tracks'], ['CABOOSE', 'Last car of a freight train'], ['SIDINGS', 'Short tracks off the main line'] ] },
  { title: 'Packing for a Trip', entries: [
    ['SUNSCREEN', 'Lotion that guards against burning'], ['GUIDEBOOK', 'Paperback with maps and tips'], ['BACKPACKS', 'Bags carried on the shoulders'],
    ['TOILETRY BAG', 'Pouch for a toothbrush and soap'], ['PACKING LIST', 'Rundown of things to bring along'], ['HAND LUGGAGE', 'Bag kept with you in the cabin'], ['FIRST AID KIT', 'Box with bandages and plasters'],
    ['TRAVEL ADAPTER', 'Plug converter for foreign sockets'], ['TRAVEL JOURNAL', 'Diary of a journey'], ['CHARGER', 'Cable that tops up a phone'] ] },
  { title: 'At the Airport', entries: [
    ['JET BRIDGE', 'Walkway from gate to plane'], ['AISLE SEAT', 'Spot with easy access to the gangway'], ['CABIN CREW', 'Flight attendants, collectively'],
    ['CHECK IN DESK', 'Counter where bags are dropped off'], ['CHECKED BAGS', 'Luggage handed over at the counter to travel in the hold'],
    ['DEPARTURE GATE', 'Where passengers wait to board'], ['MOVING WALKWAY', 'Flat escalator in a long corridor'],
    ['PASSPORT CONTROL', 'Desk where travel documents are checked'], ['BAGGAGE CAROUSEL', 'Revolving belt for checked bags'],
    ['LAYOVER', 'Stop between connecting flights'], ['TAKEOFF', 'Moment the wheels leave the runway'], ['TAXIWAY', 'Path between runway and terminal'] ] },
  { title: 'Lakes of the World', entries: [
    ['LAKE HURON', 'Fresh water between Michigan and Ontario, with Georgian Bay'], ['LAKE TAHOE', 'Alpine waters on the California-Nevada line'], ['OXBOW LAKE', 'Curved pool left by a meandering river'], ['LAKE GARDA', 'Italy\'s largest body of fresh water'],
    ['LAKE ONTARIO', 'Easternmost of North America\'s five great inland waters'], ['LAKE BALATON', 'Hungary\'s largest body of fresh water'], ['LAKE LUCERNE', 'Swiss waters with four cantons on their shores'],
    ['GREAT SALT LAKE', 'Briny inland sea in Utah'], ['LAKE NICARAGUA', 'Largest body of fresh water in Central America'], ['LAKE CHAMPLAIN', 'Waters between Vermont and New York'] ] },
  { title: 'Fire and Steam', entries: [
    ['MOUNT ETNA', 'Active volcano on Sicily'], ['MOUNT FUJI', 'Snow-topped cone that is Japan\'s highest peak'], ['STROMBOLI', 'Italian island volcano that erupts almost constantly'], ['HOT SPRING', 'Naturally heated pool'],
    ['OLD FAITHFUL', 'Famously regular geyser in Yellowstone'], ['VOLCANIC ASH', 'Fine powder blown out in an eruption'], ['SULFUR VENTS', 'Steaming cracks that smell of eggs'],
    ['KILAUEA', 'Very active volcano on Hawaii\'s Big Island'], ['GEYSERS', 'Springs that spout water skyward'], ['CALDERA', 'Large crater left after an eruption'] ] },
  { title: 'Shapes of the Land', entries: [
    ['PENINSULA', 'Land almost surrounded by water'], ['WATERSHED', 'Ridge dividing river systems'], ['TABLELAND', 'Broad, flat elevated region'], ['SALT MARSH', 'Coastal wetland flooded by tides'],
    ['ARCHIPELAGO', 'Chain or cluster of islands'], ['FLOODPLAINS', 'Flat land beside rivers that overflow'], ['ESCARPMENTS', 'Long, steep slopes or cliffs'],
    ['GLACIAL VALLEY', 'U-shaped trough carved by ice'], ['ISTHMUS', 'Narrow strip joining two landmasses'], ['PLATEAU', 'Raised flat area'], ['ESTUARY', 'Where a river meets the tide'] ] },
  { title: 'Navigating at Sea', entries: [
    ['CROWS NEST', 'Lookout platform high on a mast'], ['STARBOARD', 'Right-hand side of a ship'], ['PORTHOLES', 'Round windows in a hull'], ['ANCHORAGE', 'Sheltered place to drop the hook'],
    ['MARINE RADAR', 'Shipboard screen that spots other vessels'], ['CHRONOMETER', 'Precise clock used to find longitude'], ['LIGHTHOUSES', 'Coastal towers that warn ships'],
    ['NAUTICAL CHART', 'Map showing depths and hazards'], ['SHIPPING LANES', 'Busy routes across the ocean'],
    ['SEXTANT', 'Instrument for measuring a star\'s angle'], ['FOGHORN', 'Booming signal in poor visibility'], ['LOGBOOK', 'Daily record of a voyage'] ] },
  { title: 'The Open Road', entries: [
    ['MILEPOSTS', 'Markers counting the distance'], ['ROAD SIGNS', 'Boards that tell drivers where to go'], ['MOTORWAYS', 'Highways, in Britain'], ['TOLL BOOTH', 'Where drivers pay to pass'], ['CAMPER VAN', 'Vehicle with a bed in the back'],
    ['SCENIC ROUTE', 'The long way round, for the views'], ['COUNTRY LANE', 'Narrow road between hedges'],
    ['CRUISE CONTROL', 'Setting that holds a steady speed'], ['PASSENGER SEAT', 'Where the navigator sits'], ['ROADSIDE DINER', 'Spot for pie and coffee on a long drive'], ['ROAD MAP', 'Folded guide for a driver'] ] },
  { title: 'European Cities', entries: [
    ['BARCELONA', 'Catalan city of Gaudi buildings'], ['EDINBURGH', 'Scottish city crowned by a castle'], ['MARSEILLE', 'French port on the Mediterranean'], ['ROTTERDAM', 'Dutch city with Europe\'s biggest port'],
    ['LIVERPOOL', 'English city on the Mersey'], ['DUBROVNIK', 'Walled city on the Croatian coast'], ['INNSBRUCK', 'Austrian city ringed by Alps'], ['FRANKFURT', 'German city on the Main'],
    ['BOURNEMOUTH', 'English seaside town with a pier'], ['SOUTHAMPTON', 'English port where great liners docked'], ['SAINT TROPEZ', 'Glamorous harbor town on the Riviera'],
    ['SEVILLE', 'Andalusian city of flamenco'], ['BOLOGNA', 'Italian city of arcades and pasta'], ['ANTWERP', 'Belgian city famous for diamonds'] ] },
  { title: 'Cities of Asia', entries: [
    ['SINGAPORE', 'City-state at the tip of the Malay Peninsula'], ['BANGALORE', 'Indian city known for technology firms'], ['CHIANG MAI', 'Northern Thai city of temples and night markets'], ['HYDERABAD', 'Indian city famous for biryani'],
    ['SAMARKAND', 'Ancient city on the Silk Road'], ['GUANGZHOU', 'Southern Chinese city on the Pearl River'], ['PHNOM PENH', 'Capital of Cambodia'], ['VIENTIANE', 'Capital of Laos on the Mekong'],
    ['ULAANBAATAR', 'Capital of Mongolia'], ['KOLKATA', 'Indian city on the Hooghly'], ['SAPPORO', 'Japanese city famous for its snow festival'], ['INCHEON', 'South Korean port with a major airport'], ['THIMPHU', 'Capital of Bhutan'] ] },
  { title: 'Every Direction', entries: [
    ['NORTHWEST', 'Direction halfway between north and west'], ['SOUTHEAST', 'Direction a compass shows at 135 degrees'], ['NORTHEAST', 'Direction from which some storms blow in'], ['SOUTHWEST', 'Region of deserts and mesas, in the US'],
    ['NORTH STAR', 'Polaris'], ['NORTH POLE', 'Top of the globe'], ['SOUTH POLE', 'Antarctic point of convergence'],
    ['WEATHERVANE', 'Rooftop pointer that shows wind direction'], ['SOUTHERN CROSS', 'Constellation used to find south'], ['COMPASS NEEDLE', 'Magnetized pointer in a navigation tool'] ] },
  { title: 'Bridges and Crossings', entries: [
    ['UNDERPASS', 'Road beneath another road'], ['CROSSINGS', 'Places to get across'],
    ['TOWER BRIDGE', 'London crossing whose roadway lifts for tall ships'], ['CHAIN BRIDGE', 'Suspension crossing over the Danube in Budapest'], ['SWING BRIDGE', 'Crossing that pivots to let boats through'],
    ['CHARLES BRIDGE', 'Statue-lined stone crossing in Prague'], ['BRIDGE OF SIGHS', 'Enclosed crossing over a canal in Venice'], ['MILLAU VIADUCT', 'Soaring cable-stayed bridge in southern France'],
    ['FERRY CROSSING', 'Boat route across a strait'], ['ZEBRA CROSSING', 'Striped place to cross the street'], ['COVERED BRIDGE', 'Roofed wooden crossing of New England'],
    ['VIADUCT', 'Bridge of many arches'], ['GANGWAY', 'Ramp onto a ship'], ['CAUSEWAYS', 'Raised roads across wet ground'], ['FORTH BRIDGE', 'Red cantilever railway crossing near Edinburgh'], ['MENAI BRIDGE', 'Suspension crossing to the Welsh island of Anglesey'] ] },
  { title: 'National Parks', entries: [
    ['SERENGETI', 'Tanzanian park of the great migration'], ['FIORDLAND', 'New Zealand park of deep sounds'], ['SNOWDONIA', 'Welsh national park around a high peak'], ['MESA VERDE', 'Colorado park of cliff dwellings'], ['HALEAKALA', 'Maui park around a huge volcanic crater'],
    ['YELLOWSTONE', 'First national park in the US'], ['GRAND CANYON', 'Arizona chasm carved by the Colorado'], ['BRYCE CANYON', 'Utah park of hoodoos'], ['KINGS CANYON', 'California park of deep granite gorges'],
    ['ROCKY MOUNTAIN', 'Colorado park with Trail Ridge Road'], ['GLACIER', 'Montana park with the Going-to-the-Sun Road'], ['SEQUOIA', 'Park home to the General Sherman tree'], ['REDWOOD', 'Park of the tallest trees on the California coast'], ['OLYMPIC', 'Washington park with temperate rainforest'] ] },
  { title: 'Polar Expedition', entries: [
    ['SNOWFIELD', 'Wide expanse of permanent snow'], ['POLAR BEAR', 'White hunter of the Arctic ice'], ['SNOWSHOES', 'Footwear for walking on deep snow'], ['CREVASSES', 'Deep cracks in a glacier'],
    ['ICEBREAKERS', 'Ships that cut through frozen seas'], ['MIDNIGHT SUN', 'Summer phenomenon of round-the-clock daylight'],
    ['AURORA AUSTRALIS', 'Southern lights'], ['ANTARCTIC CIRCLE', 'Line of latitude around the far south'],
    ['PACK ICE', 'Floating sea ice jammed together'], ['HUSKIES', 'Sled dogs'], ['SLEDGES', 'Runners pulled across the ice'] ] },
  { title: 'Old Trade Routes', entries: [
    ['AMBER ROAD', 'Ancient route carrying resin from the Baltic'], ['MERCHANTS', 'Traders with goods to sell'], ['DOCKYARDS', 'Places where ships load and unload'], ['BARTERING', 'Trading without money'],
    ['MARKETPLACE', 'Square full of stalls'], ['TRADING POST', 'Frontier store for swapping goods'], ['PEPPERCORNS', 'Spice berries once highly prized by traders'], ['SILK WEAVERS', 'Makers of fine cloth from cocoons'], ['SPICE MARKET', 'Bazaar fragrant with cumin and cloves'],
    ['HANSEATIC LEAGUE', 'Medieval alliance of northern European trading towns'], ['SAFFRON', 'Costly spice from crocus flowers'], ['BAZAARS', 'Covered markets'] ] },
  { title: 'Harbors and Ports', entries: [
    ['BOATHOUSE', 'Shed for storing boats'], ['GANGPLANK', 'Board for walking onto a boat'], ['BARNACLES', 'Shellfish clinging to a hull'], ['SALT SPRAY', 'Fine mist off the waves'],
    ['LOBSTER POTS', 'Traps stacked on a fishing quay'],
    ['CONTAINER SHIP', 'Vessel stacked with steel boxes'], ['FERRY TERMINAL', 'Building where boat passengers wait'], ['PORT AUTHORITY', 'Body that runs a harbor'], ['NAUTICAL FLAGS', 'Signal pennants flown from a mast'],
    ['DRY DOCK', 'Basin drained for hull repairs'], ['SLIPWAY', 'Ramp for launching boats'], ['SEA WALL', 'Barrier against the waves'], ['HARBOR LIGHT', 'Beacon at the end of a breakwater'], ['FISHING QUAY', 'Landing where the catch comes ashore'], ['MOORING POST', 'Bollard for tying up a boat'] ] },
  { title: 'Going Hiking', entries: [
    ['TRAILHEAD', 'Where a path begins'], ['RIDGELINE', 'Crest of a mountain'],
    ['SWITCHBACKS', 'Zigzag turns on a steep trail'], ['HIKING BOOTS', 'Sturdy footwear for the trail'], ['WATER BOTTLE', 'Refillable drink holder'], ['MOUNTAIN HUT', 'Simple shelter high on a route'], ['NATURE TRAIL', 'Path with signs about plants and animals'], ['BACKCOUNTRY', 'Remote land far from roads'],
    ['WAYMARKED PATH', 'Route signed with arrows and blazes'], ['DAYPACK', 'Small rucksack for a short walk'], ['CANTEEN', 'Flask for water'] ] },
  { title: 'Climate Zones', entries: [
    ['TEMPERATE', 'Mild, with four seasons'], ['MANGROVES', 'Salt-tolerant coastal trees'], ['DRY SEASON', 'Months with little rain'], ['WET SEASON', 'Months of heavy rain'], ['DECIDUOUS', 'Like trees that drop their leaves'],
    ['RAINFORESTS', 'Dense, wet tropical woods'], ['SUBTROPICAL', 'Just beyond the tropics, climate-wise'], ['POLAR ICE CAP', 'Frozen dome at a pole'], ['CLOUD FOREST', 'Misty mountain woodland'], ['KELP FORESTS', 'Underwater groves of seaweed'],
    ['SAVANNA', 'Grassland with scattered trees'], ['MONSOON', 'Seasonal rainy wind'], ['STEPPES', 'Vast treeless plains'] ] },
  { title: 'Wonders Old and New', entries: [
    ['GREAT WALL', 'Ancient barrier across northern China'], ['COLOSSEUM', 'Ancient amphitheater in Rome'], ['PARTHENON', 'Marble temple to Athena in Athens'], ['ANGKOR WAT', 'Vast temple complex in Cambodia'], ['ACROPOLIS', 'Rocky citadel above Athens'],
    ['EIFFEL TOWER', 'Iron landmark on the Champ de Mars'], ['MACHU PICCHU', 'Inca citadel high in the Andes'], ['CHICHEN ITZA', 'Maya city with a stepped pyramid'], ['IGUAZU FALLS', 'Cascades on the Argentina-Brazil border'],
    ['VICTORIA FALLS', 'Cascade between Zambia and Zimbabwe'], ['FORBIDDEN CITY', 'Palace complex in the heart of Beijing'], ['STATUE OF LIBERTY', 'Torch-bearing figure in New York Harbor'] ] },
  { title: 'South America', entries: [
    ['ARGENTINA', 'Country of the pampas and tango'], ['VENEZUELA', 'Country home to Angel Falls'], ['PATAGONIA', 'Windswept region at the continent\'s tip'], ['CARTAGENA', 'Walled Caribbean city in Colombia'],
    ['AMAZON BASIN', 'Area drained by the world\'s largest river system'],
    ['URUGUAY', 'Small country on the north bank of the Rio de la Plata'], ['ECUADOR', 'Country named for the line it straddles'], ['BOLIVIA', 'Landlocked country with salt flats'], ['ATACAMA', 'Desert in northern Chile'], ['SUGARLOAF', 'Granite peak above the harbor at Rio'], ['GRAN CHACO', 'Hot, dry lowland plain in the heart of the continent'], ['CORCOVADO', 'Rio peak topped by a famous statue'], ['BAHIA BLANCA', 'Argentine port whose name means white bay'], ['PUERTO MONTT', 'Chilean port at the start of the lake district'] ] },
  { title: 'Across Africa', entries: [
    ['MARRAKESH', 'Moroccan city of souks'], ['NILE DELTA', 'Fertile fan where Egypt\'s great river meets the Mediterranean'],
    ['DRAKENSBERG', 'Mountain range in southern Africa'], ['DAR ES SALAAM', 'Largest city in Tanzania'],
    ['TABLE MOUNTAIN', 'Flat-topped peak above Cape Town'], ['OKAVANGO DELTA', 'Inland wetland fan in Botswana'], ['GREAT RIFT VALLEY', 'Long trench running through East Africa'],
    ['MOROCCO', 'Country across the strait from Spain'], ['NAMIBIA', 'Country of the Namib Desert'], ['SENEGAL', 'West African country with Dakar as its capital'], ['LESOTHO', 'Kingdom surrounded by South Africa'], ['MAURITIUS', 'Island nation east of Madagascar'], ['ABU SIMBEL', 'Temples carved into a cliff beside Lake Nasser'] ] },
  { title: 'Life at Sea', entries: [
    ['LIFEBOATS', 'Small craft carried by a liner'], ['STATEROOM', 'Private cabin on a ship'], ['DECK CHAIR', 'Folding seat by the rail'], ['SHIPS BELL', 'Brass signal that marks the watches'], ['CHART ROOM', 'Where the navigator works'],
    ['QUARTERDECK', 'Raised deck near the stern'], ['LIFE JACKETS', 'Vests that keep you afloat'],
    ['PROMENADE DECK', 'Level for an evening stroll on a liner'], ['CAPTAINS TABLE', 'Seat of honor at dinner on board'], ['OCEAN CROSSING', 'Voyage from one continent to another'],
    ['SEA LEGS', 'Balance gained after days aboard'], ['SUNDECK', 'Open deck for lounging'] ] },
  { title: 'Around the Clock', entries: [
    ['TIME ZONES', 'Bands of the globe that share an hour'], ['GREENWICH', 'London district on the prime meridian'], ['MERIDIANS', 'Lines running pole to pole'], ['LOCAL TIME', 'Hour where you happen to be'],
    ['ALARM CLOCKS', 'Bedside wake-up devices'], ['TIMEKEEPING', 'Measuring the hours'], ['ATOMIC CLOCK', 'Extremely precise timepiece'],
    ['UNIVERSAL TIME', 'Global standard hour'], ['SUNRISE', 'Dawn'], ['EQUINOX', 'Day of equal light and dark'] ] },
];

module.exports = { mini, midi, cartographer };
