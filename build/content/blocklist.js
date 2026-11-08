'use strict';
// Content filter applied to every word that appears in a puzzle (answers, word lists,
// cryptogram sentences, logic-grid items and story text).
// Offensive terms are stored ROT13-encoded so they do not appear in the source as plain text.

const rot13 = s => s.replace(/[a-z]/gi, ch => {
  const base = ch <= 'Z' ? 65 : 97;
  return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
});

// Scanned for anywhere in a word-search grid (rarely occur inside ordinary words).
const gridScan = ['fuvg', 'shpx', 'phag', 'gjng', 'jnax', 'fyhg', 'juber', 'ovgpu', 'onfgneq', 'qvyqb', 'cbea', 'anmv',
  'avttre', 'snttbg', 'ergneq', 'xvxr', 'puvax'].map(w => rot13(w).toUpperCase());

const offensive = gridScan.concat(['encr', 'pbpx', 'nefr', 'qnza', 'penc', 'gvgf', 'cvff', 'nff', 'qvpx', 'ubeal', 'frkl', 'frk', 'aneq', 'fcvp']
  .map(w => rot13(w).toUpperCase()));

const violent = ['KILL', 'KILLS', 'KILLED', 'KILLING', 'MURDER', 'GUN', 'GUNS', 'RIFLE', 'PISTOL', 'BOMB', 'BOMBS', 'BULLET',
  'WEAPON', 'WEAPONS', 'SWORD', 'DAGGER', 'SPEAR', 'LANCE', 'WAR', 'WARS', 'BATTLE', 'DEATH', 'DEAD', 'DIE', 'DIED', 'BLOOD',
  'BLOODY', 'STAB', 'SHOOT', 'SHOT', 'ATTACK', 'ASSAULT', 'TERROR', 'POISON', 'SLAY', 'CORPSE', 'WARRIOR', 'ARMY', 'MILITARY',
  'SOLDIER', 'CANNON', 'MISSILE', 'TORPEDO', 'GRENADE', 'EXPLODE', 'HOSTAGE', 'CRIME', 'CRIMINAL', 'PRISON', 'PRISONER',
  'THIEF', 'ROBBER', 'BURGLAR', 'ARSON', 'STOLE', 'STOLEN', 'VICTIM', 'WOUND', 'INJURY', 'FIGHT', 'PUNCH'];

const political = ['VOTE', 'VOTER', 'VOTING', 'ELECTION', 'SENATE', 'SENATOR', 'CONGRESS', 'PARLIAMENT', 'DEMOCRAT', 'REPUBLICAN',
  'LIBERAL', 'CONSERVATIVE', 'SOCIALIST', 'COMMUNIST', 'FASCIST', 'PRESIDENT', 'GOVERNOR', 'MAYOR', 'CAMPAIGN', 'BALLOT',
  'PROTEST', 'EMBASSY', 'DICTATOR', 'POLITICS', 'POLITICAL'];

const brands = ['LEGO', 'XEROX', 'KLEENEX', 'VELCRO', 'TEFLON', 'JACUZZI', 'FRISBEE', 'ZAMBONI', 'POPSICLE', 'BANDAID', 'TASER',
  'DUMPSTER', 'JETSKI', 'STYROFOAM', 'TUPPERWARE', 'SHARPIE', 'ROLODEX', 'THERMOS', 'GOOGLE', 'IPHONE', 'PEPSI', 'COKE', 'NIKE',
  'ADIDAS', 'DISNEY', 'BARBIE', 'MONOPOLY', 'SCRABBLE', 'YAHTZEE', 'JENGA', 'CLUEDO', 'PARCHEESI', 'NUTELLA', 'OREO', 'CRAYOLA',
  'PLAYDOH', 'TABASCO', 'JELLO', 'VASELINE', 'BUBBLEWRAP', 'ROLLERBLADE', 'WALKMAN', 'POPEYE'];

const wholeWord = new Set([...offensive, ...violent, ...political, ...brands]);

function flaggedWords(text) {
  const tokens = String(text).toUpperCase().replace(/[^A-Z' ]/g, ' ').split(/\s+/).filter(Boolean).map(t => t.replace(/'/g, ''));
  return tokens.filter(t => wholeWord.has(t));
}

module.exports = { gridScan, wholeWord, flaggedWords };
