'use strict';
// The Logic Casebook: original, lighthearted mysteries written for Gridlock Puzzle Co.
// Stories set the scene only; every fact needed to solve a case comes from its clues, and the
// closing paragraph is filled in from the verified solution, so story and clues always agree.
// Reveal placeholders: {Category|KeyCategory=key item} -> the Category item of whoever holds the key item.

const mins = m => {
  if (m < 60) return m + ' minutes';
  const h = Math.floor(m / 60), r = m % 60;
  return h + (h === 1 ? ' hour' : ' hours') + (r ? ' and ' + r + ' minutes' : '');
};
const clock = (name, items, stepMin, p) => ({
  name, ordinal: true, items, np: p.np, pred: p.pred, neg: p.neg, less: p.less, by: p.by, step: d => mins(d * stepMin),
});
const num = (name, items, np, pred, neg, less, by) => ({ name, ordinal: true, items, np, pred, neg, less, by, step: d => String(d) });

const five = [
  { id: 'locket', title: 'The Misplaced Heirloom',
    story: [
      'Every summer the Hartwell cousins gather at their grandmother\'s farmhouse, and every summer something goes astray. This year it was her silver locket, which she had left on the hall table beside a jumble of borrowed odds and ends.',
      'By evening the five cousins had gone home, each having scooped up one item from the table and hung a coat in one room of the house before heading off. Grandmother is not worried, only curious, and she has pieced together a few facts from the cousins\' phone calls.',
    ],
    question: 'Which cousin carried the locket home, and in which room had they left their coat?',
    entityPlural: 'cousins',
    people: ['Mabel', 'Rupert', 'Tamsin', 'Oscar', 'Winnie'],
    cats: [
      { name: 'Item', items: ['the silver locket', 'the garden shears', 'the cake tin', 'the road atlas', 'the spare umbrella'], np: 'the cousin who took {x}', pred: 'took {x}', neg: 'did not take {x}' },
      { name: 'Room', items: ['kitchen', 'parlor', 'sunroom', 'library', 'back porch'], np: 'the cousin whose coat was in the {x}', pred: 'left a coat in the {x}', neg: 'did not leave a coat in the {x}' },
      { name: 'Coat', items: ['tweed', 'yellow', 'quilted', 'denim', 'navy'], np: 'the cousin in the {x} coat', pred: 'wore the {x} coat', neg: 'did not wear the {x} coat' },
      clock('Arrival', ['10:00', '10:15', '10:30', '10:45', '11:00'], 15, { np: 'the cousin who arrived at {x}', pred: 'arrived at {x}', neg: 'did not arrive at {x}', less: 'arrived earlier than', by: 'arrived exactly {x} before' }),
    ],
    reveal: 'Case closed. {Name|Item=the silver locket} had picked up the locket along with a coat from the {Room|Item=the silver locket}, and it traveled home in the pocket of the {Coat|Item=the silver locket} coat. It was posted back the next morning, wrapped in three layers of tissue.' },

  { id: 'cakes', title: 'The Mixed-Up Delivery',
    story: [
      'Primrose Bakery sent out five celebration cakes on Saturday morning, each in a box tied with a different ribbon. The driver, flustered by roadworks on the high street, delivered every box to the right street but checked none of the labels.',
      'Now five neighbors on Linden Row each have a cake, and one of them is holding the three-tier anniversary cake meant for the Pembertons. The bakery has gathered a handful of facts and needs to know who has it before the party at four.',
    ],
    question: 'Who received the anniversary cake, and at which house number?',
    entityPlural: 'neighbors',
    people: ['Mrs. Albright', 'Mr. Chen', 'Ms. Okafor', 'Mr. Lindqvist', 'Mrs. Duarte'],
    cats: [
      { name: 'Cake', items: ['the anniversary cake', 'the birthday cake', 'the retirement cake', 'the christening cake', 'the graduation cake'], np: 'the neighbor who received {x}', pred: 'received {x}', neg: 'did not receive {x}' },
      { name: 'Ribbon', items: ['gold', 'blue', 'pink', 'green', 'silver'], np: 'the neighbor whose box had a {x} ribbon', pred: 'got a box with a {x} ribbon', neg: 'did not get a box with a {x} ribbon' },
      { name: 'Time', ordinal: true, items: ['9:00', '9:20', '9:40', '10:00', '10:20'], np: 'the neighbor who got a delivery at {x}', pred: 'got a delivery at {x}', neg: 'did not get a delivery at {x}', less: 'got a delivery earlier than', by: 'got a delivery exactly {x} before', step: d => mins(d * 20) },
      Object.assign(num('House', ['2', '4', '6', '8', '10'], 'the neighbor at number {x}', 'lives at number {x}', 'does not live at number {x}', 'lives at a lower number than', 'lives at a number exactly {x} lower than'), { step: d => String(d * 2) }),
    ],
    reveal: 'Case closed. The anniversary cake, in the box with the {Ribbon|Cake=the anniversary cake} ribbon, went to {Name|Cake=the anniversary cake} at number {House|Cake=the anniversary cake}. It reached the Pembertons with an hour to spare and only one smudged rosette.' },

  { id: 'seating', title: 'The Scrambled Seating Plan',
    story: [
      'An afternoon wedding in a walled garden was going perfectly until a gust of wind lifted the seating cards from their easel and scattered them across the lawn. The planner recovered every card, but not the order they had been in.',
      'Five guests are still waiting to be shown to their tables, each with a different meal choice and a different connection to the happy couple. The planner remembers a few details and is determined to seat everyone before the speeches.',
    ],
    question: 'Which guest belongs at table one, and what meal did they choose?',
    entityPlural: 'guests',
    people: ['Aunt Philippa', 'Mr. Osei', 'Ms. Varga', 'Dr. Quill', 'Cousin Lottie'],
    cats: [
      { name: 'Meal', items: ['salmon', 'mushroom risotto', 'roast chicken', 'lentil pie', 'beef stew'], np: 'the guest who chose the {x}', pred: 'chose the {x}', neg: 'did not choose the {x}' },
      { name: 'Connection', items: ['school friend', 'neighbor', 'godparent', 'colleague', 'choir friend'], np: 'the guest who is a {x}', pred: 'is a {x} of the couple', neg: 'is not a {x} of the couple' },
      { name: 'Card', items: ['ivory', 'sage', 'blush', 'lavender', 'gold-edged'], np: 'the guest with the {x} card', pred: 'had the {x} card', neg: 'did not have the {x} card' },
      num('Table', ['1', '2', '3', '4', '5'], 'the guest at table {x}', 'belongs at table {x}', 'does not belong at table {x}', 'belongs at a lower-numbered table than', 'belongs at a table numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. Table one belonged to {Name|Table=1}, who had chosen the {Meal|Table=1} and carried the {Card|Table=1} card. Everyone was seated before the first toast, and the easel was weighed down with a watering can.' },

  { id: 'suitcases', title: 'The Swapped Suitcases',
    story: [
      'Five travelers bought the same green suitcase from the same shop, and on Friday all five passed through the same small station. Somewhere between the luggage rack and the platform, the suitcases were shuffled.',
      'Each traveler tied a different colored tag to the handle, was heading to a different town, and packed something rather important. The station master has collected their statements and wants to reunite one very anxious knitter with her half-finished sweater.',
    ],
    question: 'Who packed the half-finished sweater, and which town were they heading to?',
    entityPlural: 'travelers',
    people: ['Ingrid', 'Bastian', 'Clementine', 'Marcus', 'Odile'],
    cats: [
      { name: 'Contents', items: ['a half-finished sweater', 'a birthday present', 'a stack of maps', 'a box of seeds', 'a pair of skates'], np: 'the traveler who packed {x}', pred: 'packed {x}', neg: 'did not pack {x}' },
      { name: 'Tag', items: ['red', 'orange', 'white', 'purple', 'yellow'], np: 'the traveler with the {x} tag', pred: 'tied on a {x} tag', neg: 'did not tie on a {x} tag' },
      { name: 'Destination', items: ['Ashcombe', 'Brightwater', 'Fenwick', 'Larkhill', 'Westmere'], np: 'the traveler bound for {x}', pred: 'was heading to {x}', neg: 'was not heading to {x}' },
      clock('Departure', ['8:10', '8:25', '8:40', '8:55', '9:10'], 15, { np: 'the traveler who left at {x}', pred: 'left at {x}', neg: 'did not leave at {x}', less: 'left earlier than', by: 'left exactly {x} before' }),
    ],
    reveal: 'Case closed. The sweater belonged to {Name|Contents=a half-finished sweater}, bound for {Destination|Contents=a half-finished sweater} with a {Tag|Contents=a half-finished sweater} tag on the handle. Every case now carries a second tag, just to be sure.' },

  { id: 'library', title: 'The Library Book Return',
    story: [
      'The returns slot at Wren Street Library is busy all week, but one quiet book caused a stir: a long-overdue copy of a beloved field guide, returned without any slip at all. The librarian would simply like to thank its borrower.',
      'Five regulars returned books that week, each a different title from a different section, on a different day, and each left a different bookmark inside. The librarian has noted a few things from the returns trolley.',
    ],
    question: 'Who returned the field guide, and on which day?',
    entityPlural: 'borrowers',
    people: ['Hollis', 'Saoirse', 'Benedikt', 'Yusuf', 'Clemency'],
    cats: [
      { name: 'Book', items: ['the field guide', 'the sailing manual', 'the jam cookbook', 'the star atlas', 'the knitting almanac'], np: 'the borrower who returned {x}', pred: 'returned {x}', neg: 'did not return {x}' },
      { name: 'Section', items: ['nature', 'hobbies', 'cookery', 'science', 'crafts'], np: 'the borrower who usually browses {x}', pred: 'usually browses {x}', neg: 'does not usually browse {x}' },
      { name: 'Bookmark', items: ['bus ticket', 'pressed leaf', 'receipt', 'postcard', 'ribbon'], np: 'the borrower who left a {x} inside', pred: 'left a {x} inside', neg: 'did not leave a {x} inside' },
      { name: 'Day', ordinal: true, items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], np: 'the borrower who returned a book on {x}', pred: 'returned a book on {x}', neg: 'did not return a book on {x}', less: 'returned a book earlier in the week than', by: 'returned a book exactly {x} before', step: d => d + (d === 1 ? ' day' : ' days') },
    ],
    reveal: 'Case closed. The field guide came back on {Day|Book=the field guide} from {Name|Book=the field guide}, with a {Bookmark|Book=the field guide} still marking the page on herons. A thank-you note is now pinned to the noticeboard.' },

  { id: 'ribbons', title: 'The Garden Show Ribbons',
    story: [
      'The judges at the Millbrook Garden Show worked through the marquee at a brisk pace, pinning a rosette beside each winning entry. Unfortunately a curious toddler unpinned every one of them and dropped them in a flower pot.',
      'Five exhibitors each won a different award for a different entry, displayed on a different stand. The show secretary wrote down a few remarks during judging and now needs to put the rosettes back before the photographs.',
    ],
    question: 'Who won the best in show rosette, and for which entry?',
    entityPlural: 'exhibitors',
    people: ['Mr. Fairweather', 'Mrs. Gupta', 'Ms. Hallam', 'Mr. Ibsen', 'Mrs. Jolly'],
    cats: [
      { name: 'Award', items: ['best in show', 'first prize', 'second prize', 'highly commended', 'judges\' favorite'], np: 'the exhibitor awarded {x}', pred: 'was awarded {x}', neg: 'was not awarded {x}' },
      { name: 'Entry', items: ['giant marrow', 'sweet peas', 'onion string', 'dahlia bowl', 'rhubarb stalks'], np: 'the exhibitor who showed the {x}', pred: 'showed the {x}', neg: 'did not show the {x}' },
      { name: 'Hat', items: ['panama', 'sun bonnet', 'flat cap', 'straw boater', 'bucket hat'], np: 'the exhibitor in the {x}', pred: 'wore the {x}', neg: 'did not wear the {x}' },
      num('Stand', ['1', '2', '3', '4', '5'], 'the exhibitor at stand {x}', 'displayed at stand {x}', 'did not display at stand {x}', 'displayed at a lower-numbered stand than', 'displayed at a stand numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. Best in show went to {Name|Award=best in show} for the {Entry|Award=best in show} at stand {Stand|Award=best in show}. The toddler was given a rosette of their own and promptly lost interest in the others.' },

  { id: 'bake-sale', title: 'The Bake Sale Labels',
    story: [
      'The school bake sale tables were laid out beautifully until the fans were switched on and every handwritten label took flight. The cakes stayed put; the labels did not.',
      'Five parents each baked one cake in a different flavor, set it on a different plate, and placed it at a different spot along the table. One customer has already asked twice who made the lemon cake, hoping to buy a second one.',
    ],
    question: 'Who baked the lemon cake, and where on the table was it?',
    entityPlural: 'bakers',
    people: ['Priya', 'Tobias', 'Ruth', 'Kwame', 'Siobhan'],
    cats: [
      { name: 'Flavor', items: ['lemon', 'carrot', 'coffee', 'cherry', 'banana'], np: 'the parent who baked the {x} cake', pred: 'baked the {x} cake', neg: 'did not bake the {x} cake' },
      { name: 'Plate', items: ['blue willow', 'glass', 'white', 'floral', 'gold-rimmed'], np: 'the parent who used the {x} plate', pred: 'used the {x} plate', neg: 'did not use the {x} plate' },
      { name: 'Topping', items: ['icing sugar', 'buttercream', 'walnuts', 'glaze', 'sprinkles'], np: 'the parent whose cake had {x} on top', pred: 'finished the cake with {x}', neg: 'did not finish the cake with {x}' },
      num('Spot', ['1', '2', '3', '4', '5'], 'the parent whose cake was in spot {x}', 'had spot {x}', 'did not have spot {x}', 'had a spot nearer the door than', 'had a spot numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The lemon cake was baked by {Name|Flavor=lemon}, sat on the {Plate|Flavor=lemon} plate in spot {Spot|Flavor=lemon}, and was finished with {Topping|Flavor=lemon}. A second one has been promised for next week.' },

  { id: 'robes', title: 'The Choir Robe Muddle',
    story: [
      'After the winter concert the choir hung their robes on the numbered hooks in the music room, then went off for mince pies. When they returned, someone had tidied up, and the robes were all on the wrong hooks.',
      'Five singers each sing a different part, wear a different scarf over their robe, and carry a different folder. The choir director wants each robe back on its proper hook before next week, and she remembers a few useful things.',
    ],
    question: 'Whose robe belongs on hook one, and which part do they sing?',
    entityPlural: 'singers',
    people: ['Beatrice', 'Ferdinand', 'Lavinia', 'Percival', 'Rosalind'],
    cats: [
      { name: 'Part', items: ['soprano', 'alto', 'tenor', 'baritone', 'bass'], np: 'the {x}', pred: 'sings {x}', neg: 'does not sing {x}' },
      { name: 'Scarf', items: ['cranberry', 'forest green', 'ivory', 'navy', 'mustard'], np: 'the singer in the {x} scarf', pred: 'wears the {x} scarf', neg: 'does not wear the {x} scarf' },
      { name: 'Folder', items: ['black', 'maroon', 'blue', 'green', 'brown'], np: 'the singer with the {x} folder', pred: 'carries the {x} folder', neg: 'does not carry the {x} folder' },
      num('Hook', ['1', '2', '3', '4', '5'], 'the singer whose hook is number {x}', 'uses hook {x}', 'does not use hook {x}', 'uses a lower-numbered hook than', 'uses a hook numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. Hook one belongs to {Name|Hook=1}, who sings {Part|Hook=1} and wears the {Scarf|Hook=1} scarf. The hooks now have name labels, written in very large letters.' },

  { id: 'umbrellas', title: 'The Missing Umbrella',
    story: [
      'It rained all afternoon outside the Copper Kettle cafe, and the umbrella stand by the door filled up quickly. When the shower stopped, five customers grabbed an umbrella each and left in a hurry.',
      'One customer reached home with a tartan umbrella that was not hers. Each customer sat at a different table, drank something different, and left at a different time. The owner of the cafe would like to make the swap right.',
    ],
    question: 'Who left with the tartan umbrella, and at what time?',
    entityPlural: 'customers',
    people: ['Mr. Ashdown', 'Ms. Bellamy', 'Mr. Castellano', 'Mrs. Dunmore', 'Ms. Everly'],
    cats: [
      { name: 'Umbrella', items: ['tartan', 'polka-dot', 'clear', 'black', 'yellow'], np: 'the customer who took the {x} umbrella', pred: 'took the {x} umbrella', neg: 'did not take the {x} umbrella' },
      { name: 'Drink', items: ['hot chocolate', 'Earl Grey', 'flat white', 'mint tea', 'apple juice'], np: 'the customer drinking {x}', pred: 'drank {x}', neg: 'did not drink {x}' },
      { name: 'Seat', items: ['window', 'counter', 'corner', 'fireside', 'garden door'], np: 'the customer at the {x} table', pred: 'sat at the {x} table', neg: 'did not sit at the {x} table' },
      clock('Departure', ['3:00', '3:10', '3:20', '3:30', '3:40'], 10, { np: 'the customer who left at {x}', pred: 'left at {x}', neg: 'did not leave at {x}', less: 'left earlier than', by: 'left exactly {x} before' }),
    ],
    reveal: 'Case closed. The tartan umbrella left at {Departure|Umbrella=tartan} with {Name|Umbrella=tartan}, who had been at the {Seat|Umbrella=tartan} table drinking {Drink|Umbrella=tartan}. It was returned the next day with a box of shortbread.' },

  { id: 'jam', title: 'The Jam Jar Puzzle',
    story: [
      'The jam stall at the village fete is famous, but this year a steamy kitchen made every label peel away overnight. Five makers each brought one batch, and now five unlabeled jars sit on the stall shelves.',
      'Each maker used fruit from a different place, chose a different lid, and put their jar on a different shelf. The judge has tasted them all and declared the damson jam the best she has ever eaten. Now she needs to know whose it is.',
    ],
    question: 'Who made the damson jam, and where did the fruit come from?',
    entityPlural: 'makers',
    people: ['Mrs. Pargeter', 'Mr. Quayle', 'Ms. Rimmer', 'Mr. Satterly', 'Mrs. Treadwell'],
    cats: [
      { name: 'Jam', items: ['damson', 'gooseberry', 'raspberry', 'apricot', 'blackcurrant'], np: 'the maker of the {x} jam', pred: 'made the {x} jam', neg: 'did not make the {x} jam' },
      { name: 'Fruit', items: ['the church hedge', 'an allotment', 'a back garden', 'a farm shop', 'the old orchard'], np: 'the maker whose fruit came from {x}', pred: 'picked fruit from {x}', neg: 'did not pick fruit from {x}' },
      { name: 'Lid', items: ['gingham', 'gold', 'plain white', 'red', 'brown paper'], np: 'the maker who used a {x} lid', pred: 'used a {x} lid', neg: 'did not use a {x} lid' },
      num('Shelf', ['1', '2', '3', '4', '5'], 'the maker whose jar was on shelf {x}', 'had a jar on shelf {x}', 'did not have a jar on shelf {x}', 'had a jar on a lower shelf than', 'had a jar on a shelf numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The prize-winning damson jam was made by {Name|Jam=damson} from fruit picked at {Fruit|Jam=damson}, sealed under a {Lid|Jam=damson} lid on shelf {Shelf|Jam=damson}. The recipe remains a closely guarded secret.' },

  { id: 'props', title: 'The School Play Props',
    story: [
      'Opening night of the school play was twenty minutes away when the stage manager discovered that every prop had been set down in the wrong dressing room. Nobody was to blame; the props cupboard had simply been reorganized.',
      'Five actors each play a different role, need a different prop, and wear a different costume color. The stage manager has a few notes scribbled on the back of a script and must get the golden key to the right actor before the second scene.',
    ],
    question: 'Which actor needs the golden key, and which role do they play?',
    entityPlural: 'actors',
    people: ['Aurora', 'Barnaby', 'Celeste', 'Dashiell', 'Esmeralda'],
    cats: [
      { name: 'Prop', items: ['the golden key', 'the lantern', 'the teapot', 'the map', 'the umbrella'], np: 'the actor who needs {x}', pred: 'needs {x}', neg: 'does not need {x}' },
      { name: 'Role', items: ['the innkeeper', 'the sea captain', 'the duchess', 'the gardener', 'the inventor'], np: 'the actor playing {x}', pred: 'plays {x}', neg: 'does not play {x}' },
      { name: 'Costume', items: ['emerald', 'crimson', 'silver', 'mustard', 'violet'], np: 'the actor in {x}', pred: 'wears {x}', neg: 'does not wear {x}' },
      num('Room', ['1', '2', '3', '4', '5'], 'the actor in dressing room {x}', 'uses dressing room {x}', 'does not use dressing room {x}', 'uses a lower-numbered dressing room than', 'uses a dressing room numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The golden key went to {Name|Prop=the golden key}, who plays {Role|Prop=the golden key} in {Costume|Prop=the golden key} and dresses in room {Room|Prop=the golden key}. The curtain went up exactly on time.' },

  { id: 'postcards', title: 'The Unsigned Postcards',
    story: [
      'Every summer the members of the walking club send postcards from their holidays to the clubhouse noticeboard. This year five cards arrived, and in the excitement of travel, not one of them was signed.',
      'Each card came from a different place, showed a different picture, carried a different stamp, and arrived on a different day. The club secretary has a few facts from members\' chatter and wants to label every card.',
    ],
    question: 'Who sent the card showing the lighthouse, and from where?',
    entityPlural: 'members',
    people: ['Ottilie', 'Leopold', 'Marguerite', 'Thaddeus', 'Wilhelmina'],
    cats: [
      { name: 'Place', items: ['the Scottish Highlands', 'the Algarve', 'Lake Bled', 'the Dolomites', 'Cornwall'], np: 'the member who wrote from {x}', pred: 'wrote from {x}', neg: 'did not write from {x}' },
      { name: 'Picture', items: ['a lighthouse', 'a stone bridge', 'a mountain hut', 'a fishing harbor', 'a castle'], np: 'the member whose card showed {x}', pred: 'sent a card showing {x}', neg: 'did not send a card showing {x}' },
      { name: 'Stamp', items: ['a puffin', 'a tram', 'a sunflower', 'a lighthouse keeper', 'a sailboat'], np: 'the member whose stamp showed {x}', pred: 'used a stamp showing {x}', neg: 'did not use a stamp showing {x}' },
      { name: 'Day', ordinal: true, items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], np: 'the member whose card arrived on {x}', pred: 'had a card arrive on {x}', neg: 'did not have a card arrive on {x}', less: 'had a card arrive earlier than', by: 'had a card arrive exactly {x} before', step: d => d + (d === 1 ? ' day' : ' days') },
    ],
    reveal: 'Case closed. The lighthouse card came from {Name|Picture=a lighthouse}, writing from {Place|Picture=a lighthouse}, and it arrived on {Day|Picture=a lighthouse}. All five cards now hang in a neat row with names underneath.' },

  { id: 'bicycles', title: 'The Borrowed Bicycles',
    story: [
      'The village keeps five bicycles in a shed by the green for anyone to borrow, and on Sunday all five went out. One came back with a basket full of wildflowers and no indication of who had been riding it.',
      'Each rider took a different bicycle, followed a different route, carried something different in the basket, and returned at a different time. The volunteer who looks after the shed would like to thank the rider for the flowers.',
    ],
    question: 'Who brought back the wildflowers, and on which bicycle?',
    entityPlural: 'riders',
    people: ['Fenwick', 'Juniper', 'Lysander', 'Marisol', 'Peregrine'],
    cats: [
      { name: 'Bicycle', items: ['the red tandem', 'the green roadster', 'the blue folding bike', 'the yellow tricycle', 'the black town bike'], np: 'the rider of {x}', pred: 'rode {x}', neg: 'did not ride {x}' },
      { name: 'Route', items: ['the canal towpath', 'the hill road', 'the forest track', 'the coast lane', 'the old railway line'], np: 'the rider who followed {x}', pred: 'followed {x}', neg: 'did not follow {x}' },
      { name: 'Basket', items: ['wildflowers', 'a picnic', 'library books', 'a kite', 'blackberries'], np: 'the rider whose basket held {x}', pred: 'carried {x}', neg: 'did not carry {x}' },
      clock('Return', ['2:00', '2:20', '2:40', '3:00', '3:20'], 20, { np: 'the rider who returned at {x}', pred: 'returned at {x}', neg: 'did not return at {x}', less: 'returned earlier than', by: 'returned exactly {x} before' }),
    ],
    reveal: 'Case closed. The wildflowers came back on {Bicycle|Basket=wildflowers} with {Name|Basket=wildflowers}, who had followed {Route|Basket=wildflowers} and returned at {Return|Basket=wildflowers}. They now stand in a jar on the shed windowsill.' },

  { id: 'pencils', title: 'The Puzzle Club Pencils',
    story: [
      'At the monthly meeting of the puzzle club, every member brings a favorite pencil, and every member is very particular about it. After a lively tea break, five pencils were found in the middle of the table and five members were looking for theirs.',
      'Each member solved a different kind of puzzle, sat in a different seat, and favors a different pencil. The club chair, who notices everything, has offered a few observations to settle it.',
    ],
    question: 'Whose is the green pencil, and which puzzle were they solving?',
    entityPlural: 'members',
    people: ['Ambrose', 'Bettina', 'Cuthbert', 'Dorcas', 'Ernestine'],
    cats: [
      { name: 'Pencil', items: ['green', 'striped', 'silver', 'red', 'stubby yellow'], np: 'the owner of the {x} pencil', pred: 'owns the {x} pencil', neg: 'does not own the {x} pencil' },
      { name: 'Puzzle', items: ['a cryptic crossword', 'a killer sudoku', 'a logic grid', 'a cryptogram', 'a word search'], np: 'the member solving {x}', pred: 'was solving {x}', neg: 'was not solving {x}' },
      { name: 'Biscuit', items: ['shortbread', 'ginger snap', 'custard cream', 'oat cookie', 'fig roll'], np: 'the member who took the {x}', pred: 'took the {x}', neg: 'did not take the {x}' },
      num('Seat', ['1', '2', '3', '4', '5'], 'the member in seat {x}', 'sat in seat {x}', 'did not sit in seat {x}', 'sat in a lower-numbered seat than', 'sat in a seat numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The green pencil belongs to {Name|Pencil=green}, who was solving {Puzzle|Pencil=green} in seat {Seat|Pencil=green}. From next month, pencils will be initialed.' },

  { id: 'recipes', title: 'The Recipe Card Riddle',
    story: [
      'The community cookbook was nearly ready for the printer when the box of recipe cards slipped off the editor\'s desk. The cards were gathered up, but the contributors\' names had been written on separate slips.',
      'Five contributors each sent one recipe with a different key ingredient, on a different colored card, to appear on a different page. The editor kept a few notes and must match them up before the deadline.',
    ],
    question: 'Who contributed the fish pie recipe, and on which page will it appear?',
    entityPlural: 'contributors',
    people: ['Mrs. Haverford', 'Mr. Ilunga', 'Ms. Jessop', 'Mr. Kowalczyk', 'Mrs. Lindgren'],
    cats: [
      { name: 'Recipe', items: ['fish pie', 'lentil soup', 'plum crumble', 'cheese scones', 'vegetable curry'], np: 'the contributor of the {x}', pred: 'sent in the {x}', neg: 'did not send in the {x}' },
      { name: 'Ingredient', items: ['nutmeg', 'smoked paprika', 'fresh dill', 'brown sugar', 'mustard seeds'], np: 'the contributor whose recipe needs {x}', pred: 'included {x}', neg: 'did not include {x}' },
      { name: 'Card', items: ['pink', 'blue', 'cream', 'mint', 'lemon'], np: 'the contributor who used a {x} card', pred: 'wrote on a {x} card', neg: 'did not write on a {x} card' },
      { name: 'Page', ordinal: true, items: ['12', '18', '24', '30', '36'], np: 'the contributor on page {x}', pred: 'appears on page {x}', neg: 'does not appear on page {x}', less: 'appears earlier in the book than', by: 'appears exactly {x} pages earlier than', step: d => String(d * 6) },
    ],
    reveal: 'Case closed. The fish pie came from {Name|Recipe=fish pie}, written on a {Card|Recipe=fish pie} card with a generous pinch of {Ingredient|Recipe=fish pie}. It will appear on page {Page|Recipe=fish pie}.' },
];

const six = [
  { id: 'harbor', title: 'The Harbor Lost and Found',
    story: [
      'The harbor office keeps a basket for things left behind on the quay. After the busy regatta weekend, six items were handed in, and six visitors called asking about something they had lost.',
      'Each item was found in a different spot and handed in at a different time, and each owner had arrived on a different boat. The harbor master, who prides herself on a tidy basket, has written down a few details.',
    ],
    question: 'Who lost the brass telescope, and where was it found?',
    entityPlural: 'owners',
    people: ['Achille', 'Bronwen', 'Caius', 'Dagmar', 'Emeric', 'Ffion'],
    cats: [
      { name: 'Item', items: ['the brass telescope', 'a straw hat', 'a flask of tea', 'a sketchbook', 'a pair of oars', 'a wool scarf'], np: 'the owner of {x}', pred: 'lost {x}', neg: 'did not lose {x}' },
      { name: 'Spot', items: ['the fish market', 'the slipway', 'the ice cream kiosk', 'the bench by the crane', 'the ferry ramp', 'the lifeboat station'], np: 'the owner whose item turned up at {x}', pred: 'had an item found at {x}', neg: 'did not have an item found at {x}' },
      { name: 'Boat', items: ['Kittiwake', 'Seraphina', 'Tern', 'Bluebottle', 'Morwenna', 'Puffin'], np: 'the owner who came in on the {x}', pred: 'came in on the {x}', neg: 'did not come in on the {x}' },
      clock('Handed in', ['9:00', '9:30', '10:00', '10:30', '11:00', '11:30'], 30, { np: 'the owner whose item was handed in at {x}', pred: 'had an item handed in at {x}', neg: 'did not have an item handed in at {x}', less: 'had an item handed in earlier than', by: 'had an item handed in exactly {x} before' }),
    ],
    reveal: 'Case closed. The brass telescope belonged to {Name|Item=the brass telescope}, who had come in on the {Boat|Item=the brass telescope}. It had been found at {Spot|Item=the brass telescope} and handed in at {Handed in|Item=the brass telescope}.' },

  { id: 'keys', title: 'The Holiday Cottage Keys',
    story: [
      'Six cottages share a key board in the farmhouse porch, and the farmer\'s grandson decided to be helpful by giving every key ring a polish. He put them all back, but on the wrong hooks.',
      'Six guests each rented a different cottage, arrived on a different day, brought a different pet, and have a key with a different colored ring. The farmer has collected a few facts from the guest book.',
    ],
    question: 'Which guest is staying in Swallow Cottage, and which pet did they bring?',
    entityPlural: 'guests',
    people: ['Mr. Abernathy', 'Ms. Bancroft', 'Dr. Calloway', 'Mrs. Delacroix', 'Mr. Ellsworth', 'Ms. Fairbanks'],
    cats: [
      { name: 'Cottage', items: ['Swallow', 'Hayloft', 'Dairy', 'Granary', 'Orchard', 'Stable'], np: 'the guest in {x} Cottage', pred: 'is staying in {x} Cottage', neg: 'is not staying in {x} Cottage' },
      { name: 'Pet', items: ['a spaniel', 'a tabby cat', 'a pair of rabbits', 'a greyhound', 'a parrot', 'a tortoise'], np: 'the guest who brought {x}', pred: 'brought {x}', neg: 'did not bring {x}' },
      { name: 'Ring', items: ['red', 'blue', 'green', 'yellow', 'white', 'orange'], np: 'the guest with the {x} key ring', pred: 'has the {x} key ring', neg: 'does not have the {x} key ring' },
      { name: 'Arrival', ordinal: true, items: ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'], np: 'the guest who arrived on {x}', pred: 'arrived on {x}', neg: 'did not arrive on {x}', less: 'arrived earlier than', by: 'arrived exactly {x} before', step: d => d + (d === 1 ? ' day' : ' days') },
    ],
    reveal: 'Case closed. Swallow Cottage belongs this week to {Name|Cottage=Swallow}, who arrived on {Arrival|Cottage=Swallow} with {Pet|Cottage=Swallow}; their key has the {Ring|Cottage=Swallow} ring. The hooks have since been labeled.' },

  { id: 'scarecrows', title: 'The Allotment Scarecrows',
    story: [
      'The allotment society holds a scarecrow contest every autumn, and this year six gardeners entered. The judge was charmed by every one of them, but the entry forms were soaked in a downpour and became unreadable.',
      'Each scarecrow stands on a different plot, wears a different hat, guards a different crop, and was given a different name by its builder. The judge would like to award the winner\'s rosette to the right person.',
    ],
    question: 'Who built the scarecrow named Sir Turnip, and on which plot does it stand?',
    entityPlural: 'gardeners',
    people: ['Albert', 'Blossom', 'Cedric', 'Delphine', 'Erasmus', 'Fennimore'],
    cats: [
      { name: 'Scarecrow', items: ['Sir Turnip', 'Lady Marrow', 'Old Tom', 'Duchess Kale', 'Captain Pea', 'Mister Mangold'], np: 'the builder of {x}', pred: 'built {x}', neg: 'did not build {x}' },
      { name: 'Hat', items: ['top hat', 'sou\'wester', 'bowler', 'beret', 'straw boater', 'knitted cap'], np: 'the gardener whose scarecrow wears a {x}', pred: 'gave the scarecrow a {x}', neg: 'did not give the scarecrow a {x}' },
      { name: 'Crop', items: ['runner beans', 'strawberries', 'cabbages', 'pumpkins', 'onions', 'peas'], np: 'the gardener growing {x}', pred: 'grows {x}', neg: 'does not grow {x}' },
      num('Plot', ['1', '2', '3', '4', '5', '6'], 'the gardener on plot {x}', 'tends plot {x}', 'does not tend plot {x}', 'tends a lower-numbered plot than', 'tends a plot numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. Sir Turnip was built by {Name|Scarecrow=Sir Turnip}, stands guard over {Crop|Scarecrow=Sir Turnip} on plot {Plot|Scarecrow=Sir Turnip}, and wears a dashing {Hat|Scarecrow=Sir Turnip}.' },

  { id: 'audio-guides', title: 'The Museum Audio Guides',
    story: [
      'At closing time the museum\'s audio guides go back into a charging rack, one per numbered slot. On Tuesday, six visitors returned their guides at once, and the attendant has to record who used which slot.',
      'Each visitor listened in a different language, spent the longest in a different gallery, and held a ticket of a different color. The attendant remembers a few details from the busy hour.',
    ],
    question: 'Who returned their guide to slot one, and which gallery did they favor?',
    entityPlural: 'visitors',
    people: ['Adriana', 'Bertrand', 'Constanza', 'Dietrich', 'Eulalia', 'Fitzgerald'],
    cats: [
      { name: 'Language', items: ['Spanish', 'German', 'Mandarin', 'Dutch', 'Swedish', 'Greek'], np: 'the visitor who listened in {x}', pred: 'listened in {x}', neg: 'did not listen in {x}' },
      { name: 'Gallery', items: ['clocks and watches', 'sailing ships', 'Roman glass', 'folk costume', 'early maps', 'musical instruments'], np: 'the visitor who lingered over {x}', pred: 'lingered over {x}', neg: 'did not linger over {x}' },
      { name: 'Ticket', items: ['orange', 'lilac', 'teal', 'peach', 'gray', 'lime'], np: 'the visitor with the {x} ticket', pred: 'held the {x} ticket', neg: 'did not hold the {x} ticket' },
      num('Slot', ['1', '2', '3', '4', '5', '6'], 'the visitor who used slot {x}', 'used slot {x}', 'did not use slot {x}', 'used a lower-numbered slot than', 'used a slot numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. Slot one was used by {Name|Slot=1}, who listened in {Language|Slot=1} and lingered longest over {Gallery|Slot=1}.' },

  { id: 'raffle', title: 'The Village Fete Raffle',
    story: [
      'The raffle at the village fete drew six winners, and the prizes were laid out on a trestle table to be collected. In the confusion of the brass band starting up, nobody wrote down which prize went with which ticket.',
      'Each winner held a ticket of a different color, chose a different prize, had been running a different stall, and won in a different draw. The fete organizer has a few notes and is determined to get it right.',
    ],
    question: 'Who won the hamper, and which stall were they running?',
    entityPlural: 'winners',
    people: ['Mrs. Arbuthnot', 'Mr. Blackwood', 'Ms. Chandra', 'Mr. Dempsey', 'Mrs. Eklund', 'Mr. Fitzroy'],
    cats: [
      { name: 'Prize', items: ['the hamper', 'a bottle of cordial', 'a garden voucher', 'a knitted blanket', 'a box of chocolates', 'a teapot'], np: 'the winner of {x}', pred: 'won {x}', neg: 'did not win {x}' },
      { name: 'Ticket', items: ['pink', 'blue', 'green', 'yellow', 'white', 'orange'], np: 'the winner with a {x} ticket', pred: 'held a {x} ticket', neg: 'did not hold a {x} ticket' },
      { name: 'Stall', items: ['tombola', 'cake stand', 'plant sale', 'book stall', 'hoopla', 'tea tent'], np: 'the winner who was running the {x}', pred: 'was running the {x}', neg: 'was not running the {x}' },
      num('Draw', ['1', '2', '3', '4', '5', '6'], 'the winner of draw {x}', 'won in draw {x}', 'did not win in draw {x}', 'won in an earlier draw than', 'won in a draw numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The hamper went to {Name|Prize=the hamper}, who held a {Ticket|Prize=the hamper} ticket and had been running the {Stall|Prize=the hamper}. It was carried home with some difficulty.' },

  { id: 'mailroom', title: 'The Mixed-Up Mail Room',
    story: [
      'A new assistant started in the mail room of a small office building on Monday and sorted every parcel with great enthusiasm and not quite enough care. Six parcels went up in the lift to six offices, each to the wrong person.',
      'Each parcel held something different, was wrapped differently, came from a different town, and was addressed to someone on a different floor. The office manager has gathered a few facts to put things right.',
    ],
    question: 'Who was the parcel of seed packets meant for, and on which floor do they work?',
    entityPlural: 'recipients',
    people: ['Ms. Aldana', 'Mr. Brennan', 'Mrs. Castillo', 'Mr. Dorsey', 'Ms. Ekwueme', 'Mr. Faulkner'],
    cats: [
      { name: 'Contents', items: ['seed packets', 'a desk lamp', 'a wall calendar', 'a box of tea', 'a jigsaw puzzle', 'new mugs'], np: 'the recipient expecting {x}', pred: 'was expecting {x}', neg: 'was not expecting {x}' },
      { name: 'Wrapping', items: ['brown paper', 'bubble envelope', 'striped paper', 'cardboard box', 'padded bag', 'tissue'], np: 'the recipient whose parcel came in {x}', pred: 'had a parcel in {x}', neg: 'did not have a parcel in {x}' },
      { name: 'From', items: ['Aberdeen', 'Bristol', 'Carlisle', 'Dover', 'Exeter', 'Falmouth'], np: 'the recipient whose parcel came from {x}', pred: 'had a parcel from {x}', neg: 'did not have a parcel from {x}' },
      num('Floor', ['1', '2', '3', '4', '5', '6'], 'the recipient on floor {x}', 'works on floor {x}', 'does not work on floor {x}', 'works on a lower floor than', 'works on a floor numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The seed packets were meant for {Name|Contents=seed packets} on floor {Floor|Contents=seed packets}, arriving from {From|Contents=seed packets} in {Wrapping|Contents=seed packets}.' },

  { id: 'mittens', title: 'The Ski Lodge Mittens',
    story: [
      'At the end of a snowy day, six skiers hung their wet mittens on the long radiator in the ski lodge and went to find hot drinks. When they came back, the mittens had been rearranged by a helpful attendant to dry more evenly.',
      'Each skier wore a different pair of mittens, skied a different run, ordered a different hot drink, and keeps their skis in a different locker. The lodge owner has a few facts from the afternoon.',
    ],
    question: 'Whose are the reindeer mittens, and which run did they ski?',
    entityPlural: 'skiers',
    people: ['Anneliese', 'Bjorn', 'Coralie', 'Didier', 'Elke', 'Felipe'],
    cats: [
      { name: 'Mittens', items: ['reindeer', 'striped', 'red', 'snowflake', 'gray', 'leather'], np: 'the owner of the {x} mittens', pred: 'owns the {x} mittens', neg: 'does not own the {x} mittens' },
      { name: 'Run', items: ['Pine Glade', 'Eagle Bowl', 'Bunny Hill', 'Summit Ridge', 'Fox Trail', 'Long Meadow'], np: 'the skier who skied {x}', pred: 'skied {x}', neg: 'did not ski {x}' },
      { name: 'Drink', items: ['hot chocolate', 'mulled apple', 'chai', 'black coffee', 'peppermint tea', 'warm milk'], np: 'the skier who ordered {x}', pred: 'ordered {x}', neg: 'did not order {x}' },
      num('Locker', ['1', '2', '3', '4', '5', '6'], 'the skier with locker {x}', 'uses locker {x}', 'does not use locker {x}', 'uses a lower-numbered locker than', 'uses a locker numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The reindeer mittens belong to {Name|Mittens=reindeer}, who skied {Run|Mittens=reindeer}, ordered {Drink|Mittens=reindeer}, and keeps their skis in locker {Locker|Mittens=reindeer}.' },

  { id: 'kiln', title: 'The Pottery Kiln Shuffle',
    story: [
      'Every piece in the community studio is supposed to be stamped on its base before firing, but the new batch of students forgot. The kiln was unloaded onto the shelves, and six potters arrived to collect six unmarked pieces.',
      'Each potter made a different piece in a different glaze, used a different clay, and set their work on a different kiln shelf. The studio manager has a few facts written on the firing log.',
    ],
    question: 'Who made the teapot, and which glaze did they use?',
    entityPlural: 'potters',
    people: ['Anwen', 'Bartholomew', 'Clarabel', 'Dimitri', 'Esperanza', 'Florimond'],
    cats: [
      { name: 'Piece', items: ['the teapot', 'a fruit bowl', 'a bud vase', 'a pair of mugs', 'a pitcher', 'a butter dish'], np: 'the potter who made {x}', pred: 'made {x}', neg: 'did not make {x}' },
      { name: 'Glaze', items: ['celadon', 'tenmoku', 'cobalt blue', 'oatmeal', 'copper red', 'satin white'], np: 'the potter who used {x}', pred: 'glazed in {x}', neg: 'did not glaze in {x}' },
      { name: 'Clay', items: ['stoneware', 'porcelain', 'terracotta', 'speckled buff', 'red earthenware', 'raku'], np: 'the potter working in {x}', pred: 'used {x} clay', neg: 'did not use {x} clay' },
      num('Shelf', ['1', '2', '3', '4', '5', '6'], 'the potter whose piece was on shelf {x}', 'fired on shelf {x}', 'did not fire on shelf {x}', 'fired on a lower shelf than', 'fired on a shelf numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The teapot was made by {Name|Piece=the teapot} in {Clay|Piece=the teapot} clay, glazed in {Glaze|Piece=the teapot}, and fired on shelf {Shelf|Piece=the teapot}. The stamps now hang on a string by the door.' },

  { id: 'coat-check', title: 'The Concert Coat Check',
    story: [
      'The coat check at the concert hall issues numbered tickets, and on Friday the attendant dropped the stack of stubs down the back of the counter. Six concertgoers came back at the interval for something from their coat pockets.',
      'Each concertgoer left a different coat, held a different ticket number, sat in a different section of the hall, and carried a different program. The attendant has a few details and a very long queue to deal with.',
    ],
    question: 'Whose is the velvet coat, and which ticket number did they hold?',
    entityPlural: 'concertgoers',
    people: ['Mr. Achterberg', 'Ms. Barrowclough', 'Dr. Coutinho', 'Mrs. Dahlberg', 'Mr. Eastwood', 'Ms. Fontaine'],
    cats: [
      { name: 'Coat', items: ['velvet', 'tweed', 'camel', 'trench', 'quilted', 'cape'], np: 'the owner of the {x} coat', pred: 'checked the {x} coat', neg: 'did not check the {x} coat' },
      { name: 'Section', items: ['stalls', 'circle', 'gallery', 'box', 'choir seats', 'balcony'], np: 'the concertgoer seated in the {x}', pred: 'sat in the {x}', neg: 'did not sit in the {x}' },
      { name: 'Program', items: ['symphony', 'string quartet', 'piano recital', 'brass band', 'choral', 'film music'], np: 'the concertgoer with the {x} program', pred: 'carried the {x} program', neg: 'did not carry the {x} program' },
      num('Ticket', ['1', '2', '3', '4', '5', '6'], 'the concertgoer with ticket {x}', 'held ticket {x}', 'did not hold ticket {x}', 'held a lower ticket number than', 'held a ticket numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The velvet coat belongs to {Name|Coat=velvet}, who held ticket {Ticket|Coat=velvet} and sat in the {Section|Coat=velvet}.' },

  { id: 'birdhouses', title: 'The Birdhouse Contest',
    story: [
      'The woodworking club ran a birdhouse contest, and six members submitted entries. Each builder was meant to sign the underside of the roof, but every one of them was too excited to remember.',
      'Each birdhouse has a different roof color, was made from a different wood, is designed for a different bird, and was given a different entry number. The club chair has a few notes from the judging table.',
    ],
    question: 'Who built the birdhouse for wrens, and what was its entry number?',
    entityPlural: 'builders',
    people: ['Alder', 'Bramwell', 'Cressida', 'Dunstan', 'Elowen', 'Florian'],
    cats: [
      { name: 'Bird', items: ['wrens', 'bluebirds', 'swallows', 'chickadees', 'nuthatches', 'robins'], np: 'the builder of the house for {x}', pred: 'built a house for {x}', neg: 'did not build a house for {x}' },
      { name: 'Roof', items: ['red', 'green', 'slate', 'copper', 'thatched', 'striped'], np: 'the builder of the {x}-roofed house', pred: 'gave it a {x} roof', neg: 'did not give it a {x} roof' },
      { name: 'Wood', items: ['cedar', 'pine', 'oak', 'birch', 'reclaimed barn wood', 'larch'], np: 'the builder who used {x}', pred: 'worked in {x}', neg: 'did not work in {x}' },
      num('Entry', ['1', '2', '3', '4', '5', '6'], 'the builder of entry {x}', 'submitted entry {x}', 'did not submit entry {x}', 'submitted a lower-numbered entry than', 'submitted an entry numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The wren house was built by {Name|Bird=wrens} from {Wood|Bird=wrens}, with a {Roof|Bird=wrens} roof, as entry {Entry|Bird=wrens}.' },

  { id: 'hampers', title: 'The Picnic Hamper Swap',
    story: [
      'Six families brought identical wicker hampers to the park for the summer concert, and the hampers spent the afternoon in a neat row under a tree. When the music ended, the families picked them up in a rush, and every hamper went home with the wrong family.',
      'Each family packed a different main dish, sat on a different blanket in a different part of the park, and arrived at a different time. A park keeper who watched the afternoon unfold has a few observations.',
    ],
    question: 'Which family packed the strawberry tart, and where did they sit?',
    entityPlural: 'families',
    plural: true,
    people: ['the Ashbys', 'the Brightmans', 'the Coopers', 'the Dalgleishes', 'the Emersons', 'the Foyles'],
    cats: [
      { name: 'Dish', items: ['the strawberry tart', 'a quiche', 'cold chicken', 'a pasta salad', 'sausage rolls', 'cheese and pickles'], np: 'the family who packed {x}', pred: 'packed {x}', neg: 'did not pack {x}' },
      { name: 'Blanket', items: ['tartan', 'striped', 'yellow', 'patchwork', 'navy', 'paisley'], np: 'the family on the {x} blanket', pred: 'sat on the {x} blanket', neg: 'did not sit on the {x} blanket' },
      { name: 'Spot', items: ['the bandstand', 'the duck pond', 'the rose garden', 'the old oak', 'the fountain', 'the café terrace'], np: 'the family near {x}', pred: 'sat near {x}', neg: 'did not sit near {x}' },
      clock('Arrival', ['1:00', '1:10', '1:20', '1:30', '1:40', '1:50'], 10, { np: 'the family who arrived at {x}', pred: 'arrived at {x}', neg: 'did not arrive at {x}', less: 'arrived earlier than', by: 'arrived exactly {x} before' }),
    ],
    reveal: 'Case closed. The strawberry tart was packed by {Name|Dish=the strawberry tart}, who sat near {Spot|Dish=the strawberry tart} on the {Blanket|Dish=the strawberry tart} blanket. All six hampers were swapped back over lemonade.' },

  { id: 'logbook', title: 'The Lighthouse Logbook Pages',
    story: [
      'An old lighthouse logbook was being rebound when its pages came loose. Six pages were written by six different relief keepers, and the binder needs to know who wrote which before sewing them back in order.',
      'Each keeper wrote in a different ink, noted different weather, recorded a different ship passing, and filled a different page. The archive has a few facts from the keepers\' letters.',
    ],
    question: 'Which keeper recorded the tall ship, and on which page?',
    entityPlural: 'keepers',
    people: ['Abel', 'Bartholomew', 'Cornelius', 'Drusilla', 'Ebenezer', 'Fidelma'],
    cats: [
      { name: 'Ship', items: ['a tall ship', 'a mail steamer', 'a fishing fleet', 'a tugboat', 'a ferry', 'a cargo schooner'], np: 'the keeper who recorded {x}', pred: 'recorded {x}', neg: 'did not record {x}' },
      { name: 'Weather', items: ['fog', 'a gale', 'calm seas', 'drizzle', 'bright sun', 'sleet'], np: 'the keeper who noted {x}', pred: 'noted {x}', neg: 'did not note {x}' },
      { name: 'Ink', items: ['black', 'blue-black', 'green', 'brown', 'violet', 'red'], np: 'the keeper who wrote in {x} ink', pred: 'wrote in {x} ink', neg: 'did not write in {x} ink' },
      num('Page', ['1', '2', '3', '4', '5', '6'], 'the keeper who wrote page {x}', 'wrote page {x}', 'did not write page {x}', 'wrote an earlier page than', 'wrote a page numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The tall ship was recorded by {Name|Ship=a tall ship} on page {Page|Ship=a tall ship}, in {Ink|Ship=a tall ship} ink, on a day of {Weather|Ship=a tall ship}.' },

  { id: 'name-tags', title: 'The Science Fair Name Tags',
    story: [
      'The science fair was in full swing when the gym doors opened, a draft swept down the hall, and six name tags drifted off six project tables. The judges, clipboard in hand, need to know whose project is whose.',
      'Each student built a different project, made a different color poster, sat at a different table, and won a different ribbon. The judges compared notes and offered a few facts.',
    ],
    question: 'Who built the rain gauge, and which ribbon did it win?',
    entityPlural: 'students',
    people: ['Ayodele', 'Benedetta', 'Cosmo', 'Dagny', 'Evander', 'Filippa'],
    cats: [
      { name: 'Project', items: ['the rain gauge', 'a crystal garden', 'a wind turbine', 'a bean plant study', 'a pinhole camera', 'a water clock'], np: 'the student who built {x}', pred: 'built {x}', neg: 'did not build {x}' },
      { name: 'Poster', items: ['orange', 'turquoise', 'lavender', 'lime', 'coral', 'gold'], np: 'the student with the {x} poster', pred: 'made the {x} poster', neg: 'did not make the {x} poster' },
      { name: 'Ribbon', items: ['first place', 'second place', 'third place', 'best idea', 'neatest notes', 'judges\' choice'], np: 'the student awarded {x}', pred: 'won {x}', neg: 'did not win {x}' },
      num('Table', ['1', '2', '3', '4', '5', '6'], 'the student at table {x}', 'sat at table {x}', 'did not sit at table {x}', 'sat at a lower-numbered table than', 'sat at a table numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The rain gauge was built by {Name|Project=the rain gauge} at table {Table|Project=the rain gauge}, and it won {Ribbon|Project=the rain gauge}.' },

  { id: 'breakfast', title: 'The Hotel Breakfast Trays',
    story: [
      'The kitchen of a seaside hotel prepares breakfast trays the night before, each with a card for the room. On Sunday the cards were slipped under the wrong trays, and six guests opened their doors to someone else\'s breakfast.',
      'Each guest ordered a different breakfast, a different juice, and a different newspaper section, and is staying on a different floor. The night manager has a few facts from the order sheets.',
    ],
    question: 'Who ordered the kippers, and on which floor are they staying?',
    entityPlural: 'guests',
    people: ['Mr. Asquith', 'Ms. Brightwell', 'Mrs. Coburn', 'Mr. Danvers', 'Ms. Elmore', 'Mr. Fenwick'],
    cats: [
      { name: 'Breakfast', items: ['kippers', 'porridge', 'pancakes', 'eggs Benedict', 'fruit and yogurt', 'a full breakfast'], np: 'the guest who ordered {x}', pred: 'ordered {x}', neg: 'did not order {x}' },
      { name: 'Juice', items: ['orange', 'apple', 'grapefruit', 'tomato', 'cranberry', 'pineapple'], np: 'the guest who asked for {x} juice', pred: 'asked for {x} juice', neg: 'did not ask for {x} juice' },
      { name: 'Paper', items: ['sports', 'crossword', 'travel', 'gardening', 'business', 'arts'], np: 'the guest who wanted the {x} section', pred: 'wanted the {x} section', neg: 'did not want the {x} section' },
      num('Floor', ['1', '2', '3', '4', '5', '6'], 'the guest on floor {x}', 'is staying on floor {x}', 'is not staying on floor {x}', 'is staying on a lower floor than', 'is staying on a floor numbered exactly {x} lower than'),
    ],
    reveal: 'Case closed. The kippers belonged to {Name|Breakfast=kippers} on floor {Floor|Breakfast=kippers}, along with {Juice|Breakfast=kippers} juice and the {Paper|Breakfast=kippers} section.' },

  { id: 'scarves', title: 'The Knitting Circle Scarves',
    story: [
      'The knitting circle spent the winter making scarves for a charity sale, and six finished scarves were laid on a bench for a photograph. Before the photographer arrived, the knitters\' name labels were blown into the hedge.',
      'Each knitter used a different color, a different stitch pattern, and a different yarn, and each scarf is a different length. The circle\'s organizer kept a few notes in her pattern book.',
    ],
    question: 'Who knitted the cable-stitch scarf, and what color is it?',
    entityPlural: 'knitters',
    people: ['Agatha', 'Bridget', 'Constance', 'Dorothy', 'Euphemia', 'Felicity'],
    cats: [
      { name: 'Stitch', items: ['cable', 'seed', 'rib', 'garter', 'herringbone', 'moss'], np: 'the knitter who used {x} stitch', pred: 'used {x} stitch', neg: 'did not use {x} stitch' },
      { name: 'Color', items: ['heather', 'cranberry', 'teal', 'oatmeal', 'charcoal', 'marigold'], np: 'the knitter of the {x} scarf', pred: 'knitted in {x}', neg: 'did not knit in {x}' },
      { name: 'Yarn', items: ['merino', 'alpaca', 'cotton', 'mohair', 'cashmere blend', 'tweed wool'], np: 'the knitter who used {x}', pred: 'used {x} yarn', neg: 'did not use {x} yarn' },
      { name: 'Length', ordinal: true, items: ['120 cm', '130 cm', '140 cm', '150 cm', '160 cm', '170 cm'], np: 'the knitter whose scarf is {x} long', pred: 'made a scarf {x} long', neg: 'did not make a scarf {x} long', less: 'made a shorter scarf than', by: 'made a scarf exactly {x} shorter than', step: d => (d * 10) + ' cm' },
    ],
    reveal: 'Case closed. The cable-stitch scarf was knitted by {Name|Stitch=cable} in {Color|Stitch=cable} {Yarn|Stitch=cable}, and it measures {Length|Stitch=cable}.' },
];

module.exports = { five, six };
