/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Album, Video, GalleryItem, TimelineEvent, NewsArticle, DownloadItem, FanArt, BTSEvent, FAQItem } from '../types';

export const MEMBERS: Member[] = [
  {
    id: 'rm',
    name: 'RM',
    fullName: 'Kim Nam-joon (김남준)',
    portraitUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    biography: 'Known as the intelligent and eloquent leader of BTS, RM (formerly Rap Monster) is a brilliant songwriter, record producer, and fluent English speaker who famously represented BTS at the United Nations. He is renowned for his philosophical lyrics and love for art.',
    birthday: 'September 12, 1994',
    age: 31,
    height: '181 cm (5\'11")',
    bloodGroup: 'A',
    mbti: 'ENFP',
    position: ['Leader', 'Main Rapper'],
    emoji: '🐨',
    funFacts: [
      'He taught himself English by watching the American sitcom Friends.',
      'He has an IQ of 148 and placed in the top 1.3% of the nation in the high school university entrance exams.',
      'He is extremely clumsy and is affectionately called the "God of Destruction" for accidentally breaking things.',
      'He is a passionate art collector and enjoys visiting museums and galleries worldwide ("Namjooning").'
    ],
    soloActivities: [
      'Released solo mixtape "RM" (2015)',
      'Released playlist "Mono" (2018)',
      'Solo studio album "Indigo" (2022)',
      'Second solo studio album "Right Place, Wrong Person" (2024)'
    ],
    discography: [
      'Indigo (Album - 2022)',
      'Right Place, Wrong Person (Album - 2024)',
      'Mono (Mixtape - 2018)',
      'RM (Mixtape - 2015)'
    ],
    awards: [
      'Patron of the Arts Brand Award (2020)',
      'Multiple Billboard Chart entries as songwriter'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80'
    ],
    videoIds: ['qOOYn6o-lD0', 'unOdB0GMc8g'],
    quotes: [
      "No matter who you are, where you're from, your skin color, your gender identity: just speak yourself.",
      "Maybe I made a mistake yesterday, but yesterday's me is still me. I am who I am today with all my faults."
    ],
    timeline: [
      { year: '2013', event: 'Joined as the first member and leader of BTS.' },
      { year: '2015', event: 'Released first self-titled solo mixtape "RM".' },
      { year: '2018', event: 'Addressed the United Nations General Assembly under the Love Myself campaign.' },
      { year: '2022', event: 'Released solo studio album "Indigo" to critical acclaim.' },
      { year: '2023', event: 'Enlisted in the South Korean Republic of Korea Army for military service.' },
      { year: '2025', event: 'Honorably discharged from military service, welcoming supporters globally.' }
    ]
  },
  {
    id: 'jin',
    name: 'Jin',
    fullName: 'Kim Seok-jin (김석진)',
    portraitUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    biography: 'The oldest member of BTS, Jin is the group\'s powerful sub-vocalist and visual, famously dubbing himself "Worldwide Handsome." Jin is known for his silver voice, incredible high notes, dad jokes, cooking skills, and the highly successful solo track "The Astronaut".',
    birthday: 'December 4, 1992',
    age: 33,
    height: '179 cm (5\'10")',
    bloodGroup: 'O',
    mbti: 'INTP',
    position: ['Sub Vocalist', 'Visual'],
    emoji: '🐹',
    funFacts: [
      'He was street-cast by Big Hit Music while street walking due to his outstanding looks.',
      'He opened a Japanese-style restaurant with his brother in 2018 called Otsu Seiromushi.',
      'He plays guitar and piano beautifully and has written several emotional ballads.',
      'He was the first member to enlist and complete his active military duty.'
    ],
    soloActivities: [
      'Single "Tonight" (2019) for BTS Festa',
      'Original Soundtrack "Yours" (2021) for K-Drama Jirisan',
      'Hit release "Super Tuna" (2021)',
      'Solo single "The Astronaut" (2022) co-written with Coldplay'
    ],
    discography: [
      'The Astronaut (Single - 2022)',
      'Super Tuna (Single - 2021)',
      'Epiphany (Solo Track - 2018)',
      'Abyss (Single - 2020)'
    ],
    awards: [
      'The Astronaut Certified Platinum in Korea',
      'Melon Music Awards Nominee for Original Soundtrack Yours'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80'
    ],
    videoIds: ['c6AS_yT9aXw', 'Yis8E8G27mE'],
    quotes: [
      "Your presence can give happiness. I hope you remember that.",
      "If any of you feels lost in the face of uncertainty, or under the pressure of starting anew, don't rush."
    ],
    timeline: [
      { year: '2013', event: 'Debuted as the visual and eldest vocalist of BTS.' },
      { year: '2018', event: 'Awarded the fifth-class Hwagwan Order of Cultural Merit by the government.' },
      { year: '2021', event: 'Released the viral sensation and fun track "Super Tuna".' },
      { year: '2022', event: 'Enlisted as an active-duty soldier in the ROK army.' },
      { year: '2024', event: 'First member of BTS to complete military service, greeted by all members.' },
      { year: '2026', event: 'Preparing custom solo theater presentations and new studio EP releases.' }
    ]
  },
  {
    id: 'suga',
    name: 'SUGA',
    fullName: 'Min Yoon-gi (민윤기) / Agust D',
    portraitUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    biography: 'SUGA is BTS\'s fierce lead rapper, genius producer, and songwriter who also releases absolute masterworks under his solo moniker Agust D. He has over 100 registered KOMCA songs and is known for producing hits for international superstars (Coldplay, IU, Halsey, PSY).',
    birthday: 'March 9, 1993',
    age: 33,
    height: '174 cm (5\'8.5")',
    bloodGroup: 'O',
    mbti: 'ISTP',
    position: ['Lead Rapper', 'Producer'],
    emoji: '🐱',
    funFacts: [
      'He started writing songs and learning MIDI at the age of 13.',
      'He was an underground rapper in Daegu named Gloss before joining Big Hit.',
      'He loves basketball and was named Suga because it stands for "Shooting Guard" - his favorite position.',
      'Conducted highly successful solo arena world tour "D-DAY Tour" in 2023.'
    ],
    soloActivities: [
      'Agust D solo mixtape (2016)',
      'D-2 mixtape (2020) featuring hit track Daechwita',
      'Produced and featured in PSY\'s megahit "That That" (2022)',
      'Agust D studio album "D-DAY" (2023)'
    ],
    discography: [
      'D-DAY (Agust D Album - 2023)',
      'D-2 (Agust D Mixtape - 2020)',
      'Agust D (Mixtape - 2016)'
    ],
    awards: [
      'Mnet Asian Music Awards - Best Collaboration (with IU - Eight) (2020)',
      'Golden Disc Awards - Best Rap/Hip-Hop Award (2023)'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1501196354995-1db51d65a70f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'
    ],
    videoIds: ['qGjAWJ2zWWI', 'H_atG_S_t4o'],
    quotes: [
      "Life is tough, and things don't always work out well, but we should be brave and go on with our lives.",
      "Stay strong, the dawn before the sunrise is always the darkest."
    ],
    timeline: [
      { year: '2013', event: 'Debuted as the lead rapper and key music architect.' },
      { year: '2016', event: 'Launched solo project Agust D, establishing raw storytelling.' },
      { year: '2020', event: 'Mixtape "D-2" hit Top 11 on the US Billboard 200.' },
      { year: '2023', event: 'Released "D-DAY" and launched the Agust D TOUR spanning North America and Asia.' },
      { year: '2023', event: 'Began mandatory military enlistment serving as a public service social worker.' }
    ]
  },
  {
    id: 'jhope',
    name: 'j-hope',
    fullName: 'Jung Ho-seok (정호석)',
    portraitUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
    biography: 'Known as the group\'s master dancer, "j-hope" acts as the sunshine and source of hope for both the team and ARMY. A former street-dancer in Gwangju, he acts as the main choreographer who guides BTS performances, while releasing highly original, boundary-pushing solo work.',
    birthday: 'February 18, 1994',
    age: 32,
    height: '177 cm (5\'9.5")',
    bloodGroup: 'A',
    mbti: 'INFJ',
    position: ['Main Dancer', 'Lead Rapper', 'Sub Vocalist'],
    emoji: '🐿️',
    funFacts: [
      'He was a famous street dancer under the crew "Neuron" and won numerous dance competitions before debut.',
      'He was the first member to host a solo headline set at a major American music festival: Lollapalooza (2022).',
      'He is extremely neat, organized, and is often called the "second leader/mom" of the group.',
      'His famous introduction line is: "I\'m your hope, you\'re my hope, I\'m j-hope!"'
    ],
    soloActivities: [
      'Mixtape "Hope World" (2018)',
      'Single "Chicken Noodle Soup" featuring Becky G (2019)',
      'Solo studio album "Jack In The Box" (2022)',
      'Special documentary and album "HOPE ON THE STREET VOL.1" (2024)'
    ],
    discography: [
      'Jack In The Box (Album - 2022)',
      'HOPE ON THE STREET VOL.1 (EP - 2024)',
      'Hope World (Mixtape - 2018)',
      'Chicken Noodle Soup (Single - 2019)'
    ],
    awards: [
      'Mama Award for Culture & Style (2022)',
      'Billboard 200 Top 10 with Hope on the Street Vol 1'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=600&q=80'
    ],
    videoIds: ['r6WbbU_LRmU', 'i6m47S_VpMc'],
    quotes: [
      "Even if the desert becomes cracked, no matter who shakes this world, don't let go of the hand you hold.",
      "If you don't work hard, there won't be good results."
    ],
    timeline: [
      { year: '2013', event: 'Debuted as the primary dance leader and rapper.' },
      { year: '2018', event: 'Released first mixtape "Hope World" which charted on the Billboard 200.' },
      { year: '2022', event: 'Headline performance at Lollapalooza main stage - Hobipalooza!' },
      { year: '2023', event: 'Enlisted as active-duty drill instructor in the ROK Army.' },
      { year: '2024', event: 'Discharged from military service and released special street dance docu-series.' }
    ]
  },
  {
    id: 'jimin',
    name: 'Jimin',
    fullName: 'Park Ji-min (박지민)',
    portraitUrl: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
    biography: 'Known for his angelic vocals and contemporary dance training, Jimin was the top student in modern dance at the Busan High School of Arts. He is respected for his graceful stage presence, extreme work ethic, and sweet personality. His solo "Like Crazy" debuted at #1 on Billboard Hot 100.',
    birthday: 'October 13, 1995',
    age: 30,
    height: '174 cm (5\'8.5")',
    bloodGroup: 'A',
    mbti: 'ESTP',
    position: ['Main Dancer', 'Lead Vocalist'],
    emoji: '🐣',
    funFacts: [
      'He was the last member to join BTS, training for only six months before debut.',
      'He holds a black belt in Taekwondo and trained in martial arts for many years.',
      'He became the first Korean solo artist to reach Number 1 on the Billboard Hot 100 with "Like Crazy".',
      'He is very close with the other members and acts as a supportive shoulder when someone is crying.'
    ],
    soloActivities: [
      'Solo single "Promise" (2018)',
      'OST "With You" (2022) with Ha Sung-woon for Our Blues',
      'Debuted solo album "FACE" (2023) featuring Like Crazy',
      "Second solo album \"MUSE\" (2024) featuring Who's"
    ],
    discography: [
      'FACE (Album - 2023)',
      'MUSE (Album - 2024)',
      'With You (OST Single - 2022)'
    ],
    awards: [
      'Billboard Hot 100 #1 Solo Achievement (2023)',
      'Melon Music Awards - Best Male Solo (2023)'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&w=600&q=80'
    ],
    videoIds: ['nOCO_3G4upg', 'cDQ3L9S7t3Y'],
    quotes: [
      "Go on your path, even if you live for a day. Do something. Put away your weakness.",
      "Once your heart is touched, it will develop to something better."
    ],
    timeline: [
      { year: '2013', event: 'Debuted as K-pop contemporary dancer & lead vocalist.' },
      { year: '2019', event: 'Solo track "Lie" reached over 100 million views on Spotify.' },
      { year: '2023', event: 'Released "FACE" and made global history as #1 Billboard Solo artist.' },
      { year: '2023', event: 'Enlisted in the active ROK military army with member Jung Kook.' },
      { year: '2025', event: 'Completing army duty and releasing cinematic BTS music updates.' }
    ]
  },
  {
    id: 'v',
    name: 'V',
    fullName: 'Kim Tae-hyung (김태형)',
    portraitUrl: 'https://images.unsplash.com/photo-1504257400765-1d12931d6a98?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    biography: 'V is renowned for his deep, rich soulful baritone, striking visual elegance, and artistic personality. Combining jazz, R&B, and neo-soul inflections, V charms critics with his distinct, smooth fashion and love for classical art, film photography, and saxophone playing.',
    birthday: 'December 30, 1995',
    age: 30,
    height: '179 cm (5\'10")',
    bloodGroup: 'AB',
    mbti: 'INFP',
    position: ['Lead Dancer', 'Sub Vocalist', 'Visual'],
    emoji: '🐯',
    funFacts: [
      'He was an accidental auditionee: went to support an auditioning friend and was urged to audition by staff.',
      'He acted in the popular historical K-drama "Hwarang: The Poet Warrior Youth" in 2016.',
      'He loves jazz music, classical melodies, and plays the saxophone beautifully.',
      'He came up with the word "I Purple You" (Borahae) which means "I will trust and love you for a long time."'
    ],
    soloActivities: [
      'Drama OST "Sweet Night" (2020) for Itaewon Class',
      'OST "Christmas Tree" (2021) for Our Beloved Summer',
      'Debut Solo Album "Layover" (2023) creative directed by Min Hee-jin',
      'Digital single "FRI(END)S" (2024)'
    ],
    discography: [
      'Layover (Album - 2023)',
      'FRI(END)S (Single - 2024)',
      'Sweet Night (OST - 2020)',
      'Christmas Tree (OST - 2021)'
    ],
    awards: [
      'MAMA Award - Best OST Award: Sweet Night (2020)',
      'British NME Awards Winner (2023)'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80'
    ],
    videoIds: ['jN0Y_vTidp0', 'QK7O74Rz3lA'],
    quotes: [
      "I have a heart of a child, but I have a mind of an adult.",
      "Purple is the last color of the rainbow. Purple means I will trust and love you for a long time."
    ],
    timeline: [
      { year: '2013', event: 'Revealed as the absolute "secret member" of BTS just prior to debut.' },
      { year: '2016', event: 'Made acting debut on KBS historical TV show Hwarang.' },
      { year: '2020', event: 'OST "Sweet Night" broke iTunes records in 118 countries around the world.' },
      { year: '2023', event: 'Released "Layover" EP and enlisted in the prestigious ROK Military Special Task Force (SDT).' }
    ]
  },
  {
    id: 'jungkook',
    name: 'Jung Kook',
    fullName: 'Jeon Jung-kook (전정국)',
    portraitUrl: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80',
    biography: 'Known as the "Golden Maknae" (youngest member) due to his exceptional natural talent in singing, main dancing, sports, drawing, and filmmaking. Jung Kook was scouted by 7 agencies before choosing Big Hit after watching RM rap. Hit single "Seven" reached #1 on Billboard Hot 100.',
    birthday: 'September 1, 1997',
    age: 28,
    height: '179 cm (5\'10")',
    bloodGroup: 'A',
    mbti: 'INTP',
    position: ['Main Vocalist', 'Lead Dancer', 'Sub Rapper', 'Center'],
    emoji: '🐰',
    funFacts: [
      'He got scouted in Superstar K and chose Big Hit because he thought RM was incredibly cool.',
      'He directed several BTS music videos and vlogs under the name G.C.F (Golden Closet Film).',
      'He performed "Dreamers" at the the FIFA World Cup Qatar 2022 Opening Ceremony.',
      'An exceptional athlete, he loves weightlifting, boxing, bowling, and painting.'
    ],
    soloActivities: [
      'Single "Still With You" (2020) for Festa',
      'FIFA World Cup Anthem "Dreamers" (2022)',
      'Solo single "Seven" feat. Latto (2023) smashing Billboard records',
      'Debut Solo Album "GOLDEN" (2023) with major pop hits "Standing Next to You"'
    ],
    discography: [
      'GOLDEN (Album - 2023)',
      'Seven (Single - 2023)',
      '3D (Single - 2023)',
      'Never Let Go (Single - 2024)'
    ],
    awards: [
      'MTV Video Music Award - Song of the Summer (Seven) (2023)',
      'Billboard Music Award - Top Global K-Pop Song (Seven) (2023)'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?auto=format&fit=crop&w=600&q=80'
    ],
    videoIds: ['QU9c0053UAU', 'UNo0QA9CjPU'],
    quotes: [
      "Effort makes you. You will regret someday if you don't do your best now.",
      "Living without passion is like being dead."
    ],
    timeline: [
      { year: '2013', event: 'Debuted as the center, main vocalist, and Golden Maknae of BTS.' },
      { year: '2022', event: 'First Korean artist to perform at the official FIFA World Cup Opening Ceremony.' },
      { year: '2023', event: 'Released "GOLDEN" and scored a historic Billboard Hot 100 #1 with "Seven".' },
      { year: '2023', event: 'Enlisted in the Republic of Korea armed forces.' }
    ]
  }
];

export const ALBUMS: Album[] = [
  {
    id: 'proof',
    title: 'Proof',
    type: 'album',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80',
    releaseDate: 'June 10, 2022',
    description: 'Proof is an anthology album that embodies the history of BTS. As the group celebrated their 9th anniversary, this three-CD compilation contained key selected classic songs, unreleased demo tracks, and brand-new messages celebrating their journey and looking toward the future ("Yet to Come").',
    tracks: [
      { title: 'Yet To Come (The Most Beautiful Moment)', duration: '3:13', lyrics: 'Was it honestly the best? Cause I just wanna see the next. Diligently passing through our yesterdays, beautifully. Yeah, the past was honestly the best, but my best is what comes next. We are not seventy, we are just starting...' },
      { title: 'Run BTS (달려라 방탄)', duration: '3:24', lyrics: 'Run bulletproof run, yeah you gotta run. Two bare feet are our gasoline, go, go! We did it headers, we did it from the basement. Run bulletproof, run!' },
      { title: 'For Youth', duration: '4:24', lyrics: 'If I never met you, I would have been different. You are my best friend for the rest of my life. I will stay by your side forever.' },
      { title: 'Born Singer', duration: '3:58', lyrics: 'I am a born singer, slightly late confession. The mirage that always seemed so far away is now before my eyes.' }
    ],
    spotifyEmbed: 'https://open.spotify.com/embed/album/66Z769996rBv5CieyA7K7S',
    appleMusicEmbed: 'https://embed.music.apple.com/us/album/proof/1622340321',
    youtubeEmbed: 'https://www.youtube.com/embed/gBut_7_t6U4',
    relatedVideos: [
      { title: 'Yet To Come Official MV', videoId: 'gBut_7_t6U4' },
      { title: 'Yet To Come (Live at Busan)', videoId: 'BpcY2Ff_E6I' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'be',
    title: 'BE',
    type: 'album',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    releaseDate: 'November 20, 2020',
    description: 'BE is a comforting hand to fans globally during the peak of the global pandemic. Fully produced and curated by the BTS members themselves - from songwriting, packaging, photo layouts, to music video direction - BE delivered the warm reassurance that "Life Goes On" despite everything.',
    tracks: [
      { title: 'Life Goes On', duration: '3:27', lyrics: 'One day the world stopped without any warning. Spring didn\'t know to wait, showed up not even a minute late. Streets erased of footprints, I lie here fallen on the ground. Like an echo in the forest, the day will return as if nothing happened. Yeah, life goes on like this again...' },
      { title: 'Fly To My Room (내 방을 여행하는 법)', duration: '3:42', lyrics: 'Let\'s go, fly to my room. Get me out of my blues, let\'s start traveling this cozy room now.' },
      { title: 'Blue & Grey', duration: '4:15', lyrics: 'Where is my angel? At the end of the day, someone come and save me, please. A sigh of a weary day.' },
      { title: 'Dynamite', duration: '3:19', lyrics: 'Cause I-I-I\'m in the stars tonight, so watch me bring the fire and set the night alight! Shining through the city with a little funk and soul!' }
    ],
    spotifyEmbed: 'https://open.spotify.com/embed/album/6ia0b7feA6AX797g6767Sp',
    appleMusicEmbed: 'https://embed.music.apple.com/us/album/be/1531773091',
    youtubeEmbed: 'https://www.youtube.com/embed/-5q5mZgDff8',
    relatedVideos: [
      { title: 'Life Goes On MV', videoId: '-5q5mZgDff8' },
      { title: 'Dynamite Recording MV', videoId: 'gdZLi9oWNZg' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'mots7',
    title: 'Map of the Soul: 7',
    type: 'album',
    coverUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=600&q=80',
    releaseDate: 'February 21, 2020',
    description: 'A monument of pop artistry, Map of the Soul: 7 marks seven years since debut with seven members. Exploring their deepest shadows, highest lights, and the integration of their public persona versus their inner selves, it highlights chart-topping bangers like "ON" and "Black Swan".',
    tracks: [
      { title: 'ON', duration: '4:06', lyrics: 'I can\'t understand what people are saying. Who and what do I need to follow? With every step, the shadow grows. Look at my feet, look down, the shadow resembles me. Is it pain or is it peace? Bring the pain, oh, let it be!' },
      { title: 'Black Swan', duration: '3:18', lyrics: 'The heart no longer races when the music starts to play. If this no longer resonates, then this may be my first death. But I will dive into my own deep ocean...' },
      { title: 'Boy With Luv (작은 것들을 위한 시) (feat. Halsey)', duration: '3:49', lyrics: 'I obtained a strange peace, you gave me wings to fly. Now, everything about you is what I want to know, let me make you a boy with luv.' },
      { title: 'We are Bulletproof: the Eternal', duration: '4:21', lyrics: 'We had only seven. But we have you all now. After seven winters and springs, at the tips of our fingers entwined, we are bulletproof.' }
    ],
    spotifyEmbed: 'https://open.spotify.com/embed/album/6m246g8rGv80z8vscesce',
    appleMusicEmbed: 'https://embed.music.apple.com/us/album/map-of-the-soul-7/1498668102',
    youtubeEmbed: 'https://www.youtube.com/embed/mPVDGOVjRQ0',
    relatedVideos: [
      { title: 'ON Kinetic Manifesto Film', videoId: 'mPVDGOVjRQ0' },
      { title: 'Black Swan MV', videoId: '0lapF4DQGtY' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'golden',
    title: 'GOLDEN',
    type: 'solo',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    releaseDate: 'November 3, 2023',
    description: 'GOLDEN is the debut solo studio album by Jung Kook. Drawing inspiration from the golden moments of Jung Kook as the golden maknae of BTS and a solo artist, the album features international hits produced alongside world-class artists like Andrew Watt, Diplo, and Ed Sheeran.',
    tracks: [
      { title: 'Seven (feat. Latto)', duration: '3:04', lyrics: 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday... Seven days a week, every hour, every minute, every second, I\'ll be loving you right.' },
      { title: 'Standing Next to You', duration: '3:26', lyrics: 'Standing next to you, through the fire and the rain. Deeply rooted in love, we will dance through the night. Nothing can tear us apart.' },
      { title: '3D (feat. Jack Harlow)', duration: '3:21', lyrics: 'I wanna see it in motion, in 3D. Out of my screen and into your arms, side-to-side, dimension-by-dimension.' }
    ],
    spotifyEmbed: 'https://open.spotify.com/embed/album/5p7b6f70DScE0K758u1Www',
    appleMusicEmbed: 'https://embed.music.apple.com/us/album/golden/1709405615',
    youtubeEmbed: 'https://www.youtube.com/embed/UNo0QA9CjPU',
    relatedVideos: [
      { title: 'Standing Next to You MV', videoId: 'UNo0QA9CjPU' },
      { title: 'Seven (feat. Latto) Official MV', videoId: 'QU9c0053UAU' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80'
    ]
  }
];

export const VIDEOS: Video[] = [
  {
    id: 'vid1',
    videoId: 'gdZLi9oWNZg',
    title: 'BTS (방탄소연단) "Dynamite" Official MV',
    description: 'The record-shattering English disco-pop single that earned BTS their first-ever Grammy Award nomination and debuted at Number 1 on the Billboard Hot 100 chart. An upbeat, colorful, and highly energetic performance dedicated to spreading joy.',
    playlist: 'Main Hits',
    category: 'MV',
    uploadedAt: 'August 21, 2020'
  },
  {
    id: 'vid2',
    videoId: 'gBut_7_t6U4',
    title: 'BTS (방탄소년단) "Yet To Come" Official MV',
    description: 'The title track of the anthology album Proof. Recalling 9 years of memories and looking forward with the absolute promise to fans that "The best is yet to come."',
    playlist: 'Proof Era',
    category: 'MV',
    uploadedAt: 'June 10, 2022'
  },
  {
    id: 'vid3',
    videoId: 'BpcY2Ff_E6I',
    title: 'BTS "Yet To Come" in BUSAN Live Performance',
    description: 'Live performance of Yet to Come in front of over 50,000 screaming fans in Busan, South Korea. Highlighting the incredible vocal harmonies, deep rap verses, and legendary purple ocean of light-sticks.',
    playlist: 'Concerts',
    category: 'Live Performance',
    uploadedAt: 'October 15, 2022'
  },
  {
    id: 'vid4',
    videoId: '-5q5mZgDff8',
    title: 'BTS (방탄소년단) "Life Goes On" Official MV',
    description: 'Directed by member Jeon Jung Kook, this MV captures a heartwarming, intimate portrait of the members spending time together at home during pandemic limitations, expressing that life keeps going.',
    playlist: 'BE Era',
    category: 'MV',
    uploadedAt: 'November 20, 2020'
  },
  {
    id: 'vid5',
    videoId: 'mPVDGOVjRQ0',
    title: 'BTS (방탄소년단) "ON" Kinetic Manifesto Film',
    description: 'An outstanding, explosive dance performance featuring the Blue Devils marching band in Los Angeles, California. Showcasing the absolute peak of BTS structural choreography and intense physical performance.',
    playlist: 'Map of the Soul',
    category: 'Live Performance',
    uploadedAt: 'February 21, 2020'
  },
  {
    id: 'vid6',
    videoId: 'XsX3ATc3FbA',
    title: 'BTS (방탄소년단) "Boy With Luv" Official MV (feat. Halsey)',
    description: 'The cheerful, retro, neon-soaked collaboration that brought BTS and Halsey together in a beautiful tribute to the tiny precious things that make up love and connection.',
    playlist: 'Main Hits',
    category: 'MV',
    uploadedAt: 'April 12, 2019'
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  { id: 'gal1', category: 'Concert', title: 'Purple Ocean Lights at Wembley Stadium, London', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal2', category: 'Concert', title: 'BTS Stage Pyro and Laser Show in Seoul', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal3', category: 'BTS', title: 'Proof Anthology Concept Group Photo', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal4', category: 'Festa', title: 'Army Fireworks Display over Han River, Seoul', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal5', category: 'RM', title: 'RM "Indigo" Forest Visual Shoot', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal6', category: 'Jin', title: 'Jin "The Astronaut" Starlit Profile', url: 'https://images.unsplash.com/photo-1496715976403-7e36dc43f17b?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal7', category: 'SUGA', title: 'Agust D "D-DAY" Traditional Sword Vibe', url: 'https://images.unsplash.com/photo-1501196354995-1db51d65a70f?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal8', category: 'j-hope', title: 'j-hope "Jack In The Box" Retro Vinyl Cover', url: 'https://images.unsplash.com/photo-1484755560695-a4c7300c5c29?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal9', category: 'Jimin', title: 'Jimin "FACE" Reflection Studio Portrait', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal10', category: 'V', title: 'V "Layover" Cinematic Jazz Session', url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal11', category: 'Jung Kook', title: 'Jung Kook "GOLDEN" Neon Mic Angle', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80' },
  { id: 'gal12', category: 'Fan Art', title: 'Borahae Whales digital painting (Purple cosmic whale, BTS concept art)', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=800&q=80' }
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    year: '2013',
    date: 'June 13, 2013',
    title: 'The Debut: 2 Cool 4 Skool',
    description: 'BTS (Bangtan Sonyeondan) officially debuts with lead single "No More Dream" from album 2 Cool 4 Skool. The song expresses a bold message urging youths to trace their own unique dreams and defy systemic conventions.',
    category: 'Debut'
  },
  {
    year: '2015',
    date: 'April 29, 2015',
    title: 'The Most Beautiful Moment in Life, Pt. 1 (HYYH)',
    description: 'HYYH Era begins. The release of "I Need U" marks a pivotal shift in BTS\'s musical styling and charts. Winning their first-ever music show trophy, the album explores the messy, glowing vulnerability of youth.',
    category: 'Albums'
  },
  {
    year: '2017',
    date: 'May 21, 2017',
    title: 'First Billboard Music Award - Top Social Artist',
    description: 'BTS breaks Justin Bieber\'s 6-year winning streak to win Top Social Artist at the BBMAs. Making their official US television performance debut at the AMAs with "DNA", they spark an unstoppable historic wave.',
    category: 'Awards'
  },
  {
    year: '2018',
    date: 'May 28, 2018',
    title: 'First Billboard 200 #1 Album - Love Yourself: Tear',
    description: 'Confirming K-pop\'s definitive arrival on global music charts, "Love Yourself: Tear" debuts at Number 1 on the US Billboard 200 chart. Lead track "Fake Love" cements their status.',
    category: 'Albums'
  },
  {
    year: '2018',
    date: 'September 24, 2018',
    title: 'UN General Assembly "Speak Yourself" Speech',
    description: 'Leader RM delivers an incredibly powerful, heartfelt speech at UNICEF\'s partnership launch during the United Nations General Assembly, urging youth around the world to find their own voices.',
    category: 'Awards'
  },
  {
    year: '2020',
    date: 'August 31, 2020',
    title: 'Historic #1 Billboard Hot 100 - "Dynamite"',
    description: 'The release of disco-pop anthem "Dynamite" scores the group\'s first-ever absolute Number 1 rank on the Billboard Hot 100 chart, making them the first all-Korean group in history to achieve this crown.',
    category: 'Awards'
  },
  {
    year: '2022',
    date: 'June 10, 2022',
    title: 'Chapter 2 Announcement & Proof Anthology',
    description: 'BTS releases "Proof" anthology and announces their Chapter 2 focus: the seven members will begin completing mandatory military defense terms while pursuing highly creative, individual solo art projects first.',
    category: 'Solo Era'
  },
  {
    year: '2023',
    date: 'April-December 2023',
    title: 'Solo Albums & Active Military Enlistments',
    description: 'Jimin, SUGA, V, and Jung Kook release outstanding solo albums FACE, D-DAY, Layover, and GOLDEN. By December 2023, all remaining members have enlisted in active military duty to serve their nation.',
    category: 'Military'
  },
  {
    year: '2024',
    date: 'June 12, 2024',
    title: 'Jin\'s Discharge and BTS Reunion',
    description: 'Oldest member Jin completes his terms as sergeant drill instructor and is discharged. The remaining six members secure temporary leave to gather in Seoul and celebrate the milestone with hugs and music.',
    category: 'Comebacks'
  },
  {
    year: '2025',
    date: 'June-October 2025',
    title: 'The Great Return: Discharges Complete',
    description: 'J-hope, RM, Jimin, V, SUGA, and Jung Kook complete their military defense services. Fans celebrate the gradual reuniting of the bulletproof septet as they gear up for joint music planning.',
    category: 'Comebacks'
  },
  {
    year: '2026',
    date: 'June 13, 2026',
    title: 'The Ultimate BTS 2026 Comeback World Tour',
    description: 'Answering several years of patient waiting, BTS holds their 13th anniversary FESTA with brand-new full group studio tracks, dynamic stadiums scheduling, and a message of everlasting love to ARMY.',
    category: 'Comebacks'
  }
];

export const NEWS_ARTICLES: NewsArticle[] = [];

export const DOWNLOADS: DownloadItem[] = [
  {
    id: 'dl1',
    name: 'BTS 2026 Festa official Purple Aurora Wallpaper (Ultra HD Desktop)',
    type: 'Wallpaper',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=90',
    size: '4.2 MB'
  },
  {
    id: 'dl2',
    name: 'Bangtan Gallery Mobile Lockscreen - RM, Jin, SUGA, j-hope, Jimin, V, JK',
    type: 'Wallpaper',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1080&q=90',
    size: '2.8 MB'
  },
  {
    id: 'dl3',
    name: 'Bangtan Borahae Glow Vector Icons Pack (Custom SVG PNG for Theme customizers)',
    type: 'Icon',
    url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=500&q=80',
    size: '1.4 MB'
  },
  {
    id: 'dl4',
    name: 'Official High-Res BTS "Proof" Wing Logo PNG (Original Transparent)',
    type: 'Logo',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
    size: '800 KB'
  },
  {
    id: 'dl5',
    name: 'BTS English Lyric Compilation (Dynamite, Butter, Life Goes On, Proof demo sheets)',
    type: 'PDF',
    url: 'https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?auto=format&fit=crop&w=800&q=80',
    size: '1.9 MB'
  },
  {
    id: 'dl6',
    name: 'FESTA 2026 Celebration Kit (HD printable postals, sticker designs, purple cutouts)',
    type: 'ZIP',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    size: '48.5 MB'
  }
];

export const FAN_ARTS: FanArt[] = [
  { id: 'fa1', imageUrl: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=800&q=80', title: 'Cosmic Whale over Busan Concert Stage', artist: 'ArmyPainter97', likes: 2311 },
  { id: 'fa2', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80', title: 'Gold and Purple Mic Sunset Silhouette', artist: 'TaeTaeGlows', likes: 1845 },
  { id: 'fa3', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', title: 'RM Philosopher Indigo Reflection Sketch', artist: 'NamjoonieStudy', likes: 1420 },
  { id: 'fa4', imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=80', title: 'Worldwide Handsome Comic Pop Art', artist: 'JinDadJokes', likes: 2519 },
  { id: 'fa5', imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=800&q=80', title: 'Agust D Daechwita Traditional Ink Painting', artist: 'YoongiSlices', likes: 3105 },
  { id: 'fa6', imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', title: 'Sunshine J-Hope Vibrant Abstract Expression', artist: 'HobiWorld94', likes: 1980 }
];

export const EVENTS: BTSEvent[] = [
  {
    id: 'evt1',
    title: 'BTS 13th Anniversary FESTA Main Event',
    type: 'Upcoming',
    date: 'June 13, 2026',
    time: '18:00 KST',
    location: 'Jamsil Olympic Stadium, Seoul & Weverse Live stream',
    details: 'The official collective 13th anniversary FESTA. Featuring custom live stage appearances, interactive games, the worldwide debut of their anniversary single, and a beautiful synchronized purple fireworks display over Seoul.',
    countdownTarget: '2026-06-13T18:00:00+09:00'
  },
  {
    id: 'evt2',
    title: 'Jin Solo Fan-Meeting "Welcome Back Astronaut"',
    type: 'Upcoming',
    date: 'July 5, 2026',
    time: '14:00 KST',
    location: 'Kyung Hee University Peace Hall, Seoul',
    details: 'An intimate, high-production interactive fan-meeting experience hosted by Jin to celebrate his full studio recordings and perform custom acoustic covers alongside Coldplay guest surprises.',
    countdownTarget: '2026-07-05T14:00:00+09:00'
  },
  {
    id: 'evt3',
    title: 'Agust D "D-DAY THE FINAL" Screenings worldwide',
    type: 'Past',
    date: 'April 10, 2026',
    time: '19:30 Local',
    location: 'Golden Screen Cinemas & IMAX worldwide',
    details: 'Worldwide theatrical release showcasing Suga/Agust D\'s explosive D-DAY concert finale, featuring cameo songs from RM, Jimin, and Jung Kook.'
  },
  {
    id: 'evt4',
    title: 'BTS yet to come in Busan concert',
    type: 'Past',
    date: 'October 15, 2022',
    time: '18:00 KST',
    location: 'Busan Asiad Main Stadium, Busan',
    details: 'A massive historic free concert supporting Busan\'s World Expo bid, attracting over 50 million online and physical general viewers globally.'
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq1',
    question: 'What is the "Bangtan Gallery" and is it affiliated with BigHit Music?',
    answer: 'Bangtan Gallery is an ultimate tribute portal created by and for ARMYs (BTS superfans) celebrating their music, artistry, and members. It is an independent, non-commercial fan community website and has no corporate affiliation with BigHit Music, HYBE, or BTS itself.',
    category: 'General'
  },
  {
    id: 'faq2',
    question: 'How often are the music lists and timeline updated?',
    answer: 'Our timeline tracks the entire journey of BTS from 2013 to the current active 2026 scheduling. Whenever new solo album previews, military updates, or global tour tickets are announced, they are instantly synchronized onto our scheduling board.',
    category: 'Website'
  },
  {
    id: 'faq3',
    question: 'Can I stream or purchase albums directly on this website?',
    answer: 'In compliance with fan guidelines, there is no direct commercial transaction or voting system here. Instead, interactive album cards provide verified direct embeds to standard official streams (Spotify, Apple Music, and YouTube MVs) so you can support the boys officially.',
    category: 'Music'
  },
  {
    id: 'faq4',
    question: 'What does "Borahae" or "I Purple You" mean?',
    answer: 'Coined by member V during a fan Muster, purple is the last color of the rainbow. He explained that purple represents a bond of deep trust and everlasting love that shields and lasts. Since then, purple has become the official representative color of BTS and ARMY.',
    category: 'Lore'
  },
  {
    id: 'faq5',
    question: 'Is there a login or profile registration system?',
    answer: 'No. To offer a clean, high-speed, secure, and privacy-respecting portal, there are no signup sheets, cookie accounts, or database registers. Simply access and enjoy the ultimate BTS content directly from the launch!',
    category: 'General'
  }
];
