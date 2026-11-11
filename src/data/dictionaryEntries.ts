// ARMY Dictionary — starter entries (Batch 92).
// Every entry is a widely-documented fandom term, nickname, line
// or phrase with a conservative origin note; where the exact
// origin is uncertain the note says who made it famous instead.
// The Admin Panel can add/edit/delete entries — the live list
// lives in config (dictionaryEntries); this file is the seed and
// the fallback so the page is never empty.

export interface DictionaryEntry {
  id: string;
  term: string;
  category: 'Fandom Words' | 'Nicknames' | 'Iconic Lines' | 'Member Phrases';
  member?: string;
  meaning: string;
  origin?: string;
}

export const DICTIONARY_CATEGORIES = ['Fandom Words', 'Nicknames', 'Iconic Lines', 'Member Phrases'] as const;

export const DEFAULT_DICTIONARY_ENTRIES: DictionaryEntry[] = [
  // ---------- Fandom Words ----------
  { id: 'dict-borahae', term: 'Borahae', category: 'Fandom Words', member: 'V', meaning: '"I purple you." Purple is the last colour of the rainbow — so it means: I will trust you and love you for a long, long time.', origin: 'Coined by V at a fan meeting in 2016' },
  { id: 'dict-apobangpo', term: 'APOBANGPO', category: 'Fandom Words', member: 'Jung Kook', meaning: '"ARMY Forever, Bangtan Forever." A promise between BTS and ARMY: we stay together, always.', origin: "Jung Kook's abbreviation, loved by all of ARMY" },
  { id: 'dict-ot7', term: 'OT7', category: 'Fandom Words', meaning: '"One True 7" — all seven members together. OT7 means loving and supporting the whole group, no one left out.', origin: 'ARMY fandom slang' },
  { id: 'dict-bias', term: 'Bias', category: 'Fandom Words', meaning: 'Your favourite member — the one your eyes look for first in every photo and performance.', origin: 'K-pop fandom slang' },
  { id: 'dict-bias-wrecker', term: 'Bias Wrecker', category: 'Fandom Words', meaning: 'The member who keeps stealing your attention away from your bias — until you start questioning everything.', origin: 'K-pop fandom slang' },
  { id: 'dict-maknae', term: 'Maknae', category: 'Fandom Words', meaning: 'The Korean word for the youngest person in a group. BTS\'s maknae is Jung Kook.', origin: 'Korean word (막내)' },
  { id: 'dict-hyung', term: 'Hyung', category: 'Fandom Words', meaning: 'What a younger man calls an older brother or older male friend in Korea. The younger members call Jin, SUGA, j-hope and RM "hyung".', origin: 'Korean word (형)' },
  { id: 'dict-maknae-line', term: 'Maknae Line', category: 'Fandom Words', meaning: 'The three youngest members: Jimin, V and Jung Kook — the playful chaos team of BTS.', origin: 'ARMY fandom term' },
  { id: 'dict-hyung-line', term: 'Hyung Line', category: 'Fandom Words', meaning: 'The four oldest members: Jin, SUGA, j-hope and RM — the older-brother line of BTS.', origin: 'ARMY fandom term' },
  { id: 'dict-aegyo', term: 'Aegyo', category: 'Fandom Words', meaning: 'Acting cute on purpose — a sweet voice, cute gestures and a playful face to make someone smile.', origin: 'Korean word (애교)' },
  { id: 'dict-daesang', term: 'Daesang', category: 'Fandom Words', meaning: 'The grand prize at a Korean music award show — the biggest honour of the night, like Album of the Year or Artist of the Year.', origin: 'Korean word (대상) — "grand prize"' },
  { id: 'dict-hwaiting', term: 'Hwaiting!', category: 'Fandom Words', meaning: 'A Korean cheer that sounds like "Fighting!" — it means "You can do it!" and is shouted to give someone strength.', origin: 'Korean cheer (화이팅)' },
  { id: 'dict-selca', term: 'Selca', category: 'Fandom Words', meaning: 'Korean slang for a selfie — from "self" + "camera". A member posting a selca can break the internet for ARMY.', origin: 'Korean slang (셀카)' },
  { id: 'dict-purple-ocean', term: 'Purple Ocean', category: 'Fandom Words', meaning: 'The breathtaking sea of purple ARMY Bomb lights filling a stadium at a BTS concert — the fandom\'s most famous view.', origin: 'Named by ARMY at BTS concerts' },
  { id: 'dict-bt21', term: 'BT21', category: 'Fandom Words', meaning: 'The cartoon characters the members created with LINE FRIENDS: Koya (RM), RJ (Jin), Shooky (SUGA), Mang (j-hope), Chimmy (Jimin), Tata (V), Cooky (Jung Kook) and Van, ARMY\'s guardian.', origin: 'Created by the members themselves' },

  // ---------- Nicknames ----------
  { id: 'dict-wwh', term: 'Worldwide Handsome', category: 'Nicknames', member: 'Jin', meaning: 'Jin\'s legendary title for himself — and honestly, nobody argues. Often shortened to WWH.', origin: 'Jin\'s own famous self-introduction' },
  { id: 'dict-mochi', term: 'Mochi', category: 'Nicknames', member: 'Jimin', meaning: 'Fans call Jimin "Mochi" for his soft, squishy cheeks — like the Japanese rice cake. The nickname stuck worldwide.', origin: 'Given by fans and the members' },
  { id: 'dict-golden-maknae', term: 'Golden Maknae', category: 'Nicknames', member: 'Jung Kook', meaning: 'The youngest member who seems to be good at everything he tries — singing, dancing, sports, drawing, filming.', origin: 'Named by RM' },
  { id: 'dict-taetae', term: 'Taetae', category: 'Nicknames', member: 'V', meaning: 'V\'s soft, cute nickname — from his real name, Kim Taehyung.', origin: 'His childhood nickname' },
  { id: 'dict-hobi', term: 'Hobi', category: 'Nicknames', member: 'j-hope', meaning: 'The members\' and ARMY\'s affectionate short name for j-hope — from his real name, Jung Hoseok.', origin: 'From his real name, Hoseok' },
  { id: 'dict-kookie', term: 'Kookie', category: 'Nicknames', member: 'Jung Kook', meaning: 'ARMY\'s sweet nickname for Jung Kook. Say it once and it never leaves your vocabulary.', origin: 'ARMY fandom nickname' },
  { id: 'dict-god-of-destruction', term: 'God of Destruction', category: 'Nicknames', member: 'RM', meaning: 'RM\'s funny old nickname — sunglasses, props and stage equipment somehow keep breaking in his hands. He has apologised to many objects.', origin: 'From his trainee and early debut days' },
  { id: 'dict-agust-d', term: 'Agust D', category: 'Nicknames', member: 'SUGA', meaning: 'SUGA\'s fierce alter ego for his solo rap music. Read it backwards: "DT SUGA" — DT stands for Daegu Town, his hometown.', origin: 'Created by SUGA himself' },
  { id: 'dict-lil-meow-meow', term: 'Lil Meow Meow', category: 'Nicknames', member: 'SUGA', meaning: 'ARMY\'s nickname for SUGA, because he can be quiet, sleepy and cat-like — until he suddenly isn\'t.', origin: 'ARMY fandom nickname' },
  { id: 'dict-sunshine', term: 'Sunshine', category: 'Nicknames', member: 'j-hope', meaning: 'What everyone calls j-hope for his bright energy — he walks in and the room gets warmer.', origin: 'Given by fans and the members' },
  { id: 'dict-joonie', term: 'Joonie', category: 'Nicknames', member: 'RM', meaning: 'ARMY\'s soft nickname for RM — from his real name, Kim Namjoon.', origin: 'ARMY fandom nickname' },
  { id: 'dict-chimchim', term: 'ChimChim', category: 'Nicknames', member: 'Jimin', meaning: 'Jimin\'s cute nickname, born in the early days and still used by ARMY everywhere.', origin: 'From his early debut days' },
  { id: 'dict-cgv', term: 'CGV', category: 'Nicknames', member: 'V', meaning: '"Computer Graphics V" — because his face looks too perfect to be real, like it was rendered on a computer.', origin: 'ARMY fandom nickname' },

  // ---------- Iconic Lines ----------
  { id: 'dict-love-yourself', term: '"Love Yourself"', category: 'Iconic Lines', member: 'RM', meaning: 'RM\'s message to the world: find your name, speak yourself, and learn to love who you truly are.', origin: 'RM\'s speech at the UN General Assembly, 2018' },
  { id: 'dict-teamwork', term: '"Teamwork makes the dream work."', category: 'Iconic Lines', member: 'RM', meaning: 'RM\'s favourite saying about how BTS reached everything — never alone, always together.', origin: 'RM\'s famous repeated quote' },
  { id: 'dict-you-nice', term: '"You nice, keep going."', category: 'Iconic Lines', member: 'Jimin', meaning: 'Three small words of encouragement from Jimin that ARMY now say to each other whenever life gets hard.', origin: 'Jimin, from the American Hustle Life era' },
  { id: 'dict-lachimolala', term: '"Lachimolala"', category: 'Iconic Lines', member: 'Jimin', meaning: 'Jimin\'s legendary mishearing of the word "carbonara" during a game — ARMY have never let him forget it, lovingly.', origin: 'A Run BTS! game moment' },
  { id: 'dict-no-jams', term: '"Jimin, you got no jams."', category: 'Iconic Lines', member: 'RM', meaning: 'RM teasing Jimin that he is "no fun" — one of the oldest and most quoted jokes in BTS history.', origin: 'RM to Jimin, 2014' },
  { id: 'dict-do-you-know-bts', term: '"Do you know BTS?"', category: 'Iconic Lines', member: 'RM', meaning: 'RM\'s famous line from the early LA days, asking strangers about BTS — years before the whole world could answer "yes".', origin: 'RM, from the early American Hustle Life era' },
  { id: 'dict-im-your-hope', term: '"I\'m your hope, you\'re my hope, I\'m J-Hope!"', category: 'Iconic Lines', member: 'j-hope', meaning: 'j-hope\'s signature introduction — pure sunshine in one sentence.', origin: 'j-hope\'s famous self-introduction' },
  { id: 'dict-wwh-you-know', term: '"Worldwide Handsome, you know?"', category: 'Iconic Lines', member: 'Jin', meaning: 'Jin\'s confident sign-off about his own visuals — delivered with a wink, believed by millions.', origin: 'Jin\'s famous interview line' },
  { id: 'dict-effort', term: '"Effort makes you."', category: 'Iconic Lines', member: 'Jung Kook', meaning: 'Jung Kook\'s words about hard work: you will regret it someday if you don\'t do your best now — so do your best.', origin: 'Jung Kook\'s advice to ARMY' },
  { id: 'dict-future-okay', term: '"Future\'s gonna be okay."', category: 'Iconic Lines', member: 'SUGA', meaning: 'SUGA\'s reassuring promise from his solo era — whatever today looks like, the future will be okay.', origin: 'SUGA\'s message from the D-DAY era' },
  { id: 'dict-2-3', term: '"2! 3!"', category: 'Iconic Lines', meaning: 'The count from BTS\'s first fan song: at "two, three", let\'s erase the sad memories and hope for better days.', origin: 'From the fan song "2! 3!", 2016' },
  { id: 'dict-magic-shop', term: '"Magic Shop"', category: 'Iconic Lines', meaning: 'A door inside your heart: on a day you hate yourself, the Magic Shop exchanges your fears for happiness. BTS built it for ARMY.', origin: 'From the song "Magic Shop", inspired by the book "Into the Magic Shop"' },

  // ---------- Member Phrases ----------
  { id: 'dict-bangtan-greeting', term: '"2, 3! Bangtan! Hello, we are BTS!"', category: 'Member Phrases', meaning: 'The group\'s official greeting, counted in by the leader — heard at every show, interview and award stage.', origin: 'BTS\'s official greeting since debut' },
  { id: 'dict-namjooning', term: 'Namjooning', category: 'Member Phrases', member: 'RM', meaning: 'Living the RM way: long walks, nature, museums, books, riding a bicycle and thinking quietly.', origin: 'Named by RM himself, adopted by ARMY' },
  { id: 'dict-dad-jokes', term: 'Dad Jokes', category: 'Member Phrases', member: 'Jin', meaning: 'Jin\'s endless supply of puns. The members groan, Jin laughs the loudest, and ARMY wouldn\'t change a thing.', origin: 'Jin\'s signature humour' },
  { id: 'dict-suchwita', term: 'Suchwita', category: 'Member Phrases', member: 'SUGA', meaning: 'SUGA\'s talk show where guests chat honestly over drinks — the name blends "SUGA", "drunk" and "talk" in Korean.', origin: 'SUGA\'s own show' },
  { id: 'dict-hope-world', term: 'Hope World', category: 'Member Phrases', member: 'j-hope', meaning: 'j-hope\'s bright universe — his music, colours and energy, welcoming everyone in with a smile.', origin: 'From j-hope\'s mixtape "Hope World"' },
  { id: 'dict-vante', term: 'Vante', category: 'Member Phrases', member: 'V', meaning: 'V\'s artist name for his photography and art — a blend of "Van Gogh", his favourite painter, and his own name.', origin: 'Created by V for his art' },
  { id: 'dict-party-party-yeah', term: '"Party party yeah!"', category: 'Member Phrases', member: 'Jung Kook', meaning: 'Jung Kook\'s adorable English celebration phrase — nobody says it like him, and ARMY say it everywhere now.', origin: 'Jung Kook, from a live broadcast' },
  { id: 'dict-eat-jin', term: 'Eat Jin', category: 'Member Phrases', member: 'Jin', meaning: 'Jin\'s famous mukbang series — just Jin, good food and happy chaos. ARMY watched, ARMY got hungry.', origin: 'Jin\'s own show' },
  { id: 'dict-run-bts', term: 'Run BTS!', category: 'Member Phrases', meaning: 'The members\' beloved variety show of games, missions and betrayals — and the shout that starts every episode: "Dalyeora, Bangtan!"', origin: 'BTS\'s variety show since 2015' },
  { id: 'dict-bon-voyage', term: 'Bon Voyage', category: 'Member Phrases', meaning: 'BTS\'s travel reality series — seven friends, one trip, zero survival skills, endless memories.', origin: 'BTS\'s travel show since 2016' }
];
