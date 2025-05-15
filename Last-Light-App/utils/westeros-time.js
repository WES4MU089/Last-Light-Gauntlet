/* utils/westeros-time.js
   ──────────────────────────────────────────────────────────────────
   Lore-accurate time-keeping (Ninepenny Kings era, 260 A.C.)
   ────────────────────────────────────────────────────────────────── */

const WESTEROSI_HOURS = [
  /*00*/ 'Hour of the Owl',
  /*01*/ 'Hour of Ghosts',
  /*02*/ 'Hour of the Wolf',
  /*03*/ 'Hour of the Nightingale',
  /*04*/ 'Hour of the Cock',
  /*05*/ 'Hour of the Dawn',
  /*06*/ 'Hour of the Sparrow',
  /*07*/ 'Hour of the Smith',
  /*08*/ 'Hour of the Fisher',
  /*09*/ 'Hour of the Falcon',
  /*10*/ 'Hour of the Warrior',
  /*11*/ 'Hour of the Lion',
  /*12*/ 'Hour of the Sun',
  /*13*/ 'Hour of the Maiden',
  /*14*/ 'Hour of the Crane',
  /*15*/ 'Hour of the Hound',
  /*16*/ 'Hour of the Stranger',
  /*17*/ 'Hour of the Shepherd',
  /*18*/ 'Hour of the Evenstar',
  /*19*/ 'Hour of the Bat',
  /*20*/ 'Hour of the Moth',
  /*21*/ 'Hour of the Fox',
  /*22*/ 'Hour of the Cat',
  /*23*/ 'Hour of the Moon'
];

const STORY_YEAR = 260;  // A.C.

/* ordinal helper */
function ordinal(n) {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

/**
 * Format a JS Date into Westerosi labels
 * @param  {Date} dt
 * @return {{hourLabel:string,dateLabel:string}}
 */
function formatLetterTimestamp(dt) {
  const hourLabel = WESTEROSI_HOURS[dt.getHours()];
  const day       = ordinal(dt.getDate());
  const moon      = ordinal(dt.getMonth() + 1);
  const dateLabel = `${day} Day, of the ${moon} Moon, ${STORY_YEAR} A.C.`;
  return { hourLabel, dateLabel };
}

module.exports = { WESTEROSI_HOURS, formatLetterTimestamp };
