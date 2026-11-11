// PrivacyPolicy.tsx — Batch 120: a real Privacy Policy page
// (owner-ordered; also the page ad review expects). The
// text describes what the site ACTUALLY does today: browser-
// local profiles, public-by-design boards, form messages,
// third-party ads and embeds. Batch 144 (owner): the text
// names NO advertising or embed platform — it speaks of
// third-party advertising partners and embedded services in
// general, exactly as the owner asked. Reached from the
// footer and at /privacy — deliberately NOT a sidebar tab.

import { ArrowLeft, ShieldCheck } from 'lucide-react';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Who we are',
    body: [
      'Bangtan Gallery (bangtangallery.online) is an independent, unofficial fan site made by ARMY, for ARMY. It is not affiliated with, endorsed by, or officially connected to BTS, BIGHIT MUSIC, HYBE, or any related organisation. This page explains, in plain words, what information the site handles and what happens to it.',
    ],
  },
  {
    title: 'Information you give us',
    body: [
      'When you use the site’s forms, you choose what to send: a username and your country (your profile), messages through the Contact and Feedback pages, posts on the Supporters Wall, votes and vote proofs, song and video submissions, letters sealed in the ARMY Time Capsule, and profile name-change requests.',
      'Your country is also used to light up your country on the ARMY World Map on the Home page. Please do not put private information (such as your real address, phone number, or passwords) into public posts or messages.',
    ],
  },
  {
    title: 'Information stored in your own browser',
    body: [
      'Your visitor profile, theme choice, favourite songs, game best scores and similar preferences are stored in your own browser’s local storage — on your device, under your control. There are no password accounts on Bangtan Gallery, and we never ask for your password for any service.',
      'You can remove the profile at any time with the Log Out button in the profile panel, and you can clear the rest from your browser settings.',
    ],
  },
  {
    title: 'Things that are public by design',
    body: [
      'Some features are public on purpose, so everyone can enjoy them: Supporters Wall posts, Music Quiz leaderboard names and scores, and the names shown on published song and video submissions. If you post to one of these, the name you chose will be visible to other visitors. Vote proofs are NOT public — only the site admin can see them. Sealed Time Capsule letters stay private too — nobody can read them until the capsule opens on FESTA, June 13, 2027.',
    ],
  },
  {
    title: 'Cookies and advertising',
    body: [
      'This site may contain advertisements served by third-party advertising partners. These partners may use cookies and similar technologies to serve and measure ads, including personalised ads based on your visits to this and other websites.',
      'You can manage or block cookies and personalised advertising at any time through your browser and device settings. Blocking cookies will never stop the site from working.',
    ],
  },
  {
    title: 'Third-party embeds',
    body: [
      'Some pages play or show content embedded from other services, such as video, music and social platforms. Those services may set their own cookies and collect data under their own privacy policies when you press play or interact with the embed.',
    ],
  },
  {
    title: 'How we use information',
    body: [
      'Only to run the site: showing your posts and submissions with the name you chose, counting votes and map pins, moderating content, replying to your messages, and keeping the site safe and working. We do not sell your personal information, and we do not send marketing emails.',
    ],
  },
  {
    title: 'Children',
    body: [
      'Bangtan Gallery is a general-audience fan site and is not directed at children under 13. If you are a parent and believe your child has posted personal information here, contact us and we will remove it.',
    ],
  },
  {
    title: 'Your choices and removal',
    body: [
      'Want a post, submission, or message of yours removed? Send a note through the Contact page or our Telegram channel with enough detail to find it, and we will take it down. Profile name changes are handled through the profile panel and approved by the admin, exactly so that one ARMY’s name cannot be taken by someone else.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'If the site’s features or partners change, this page will be updated and the date below will change with it. Last updated: November 11, 2026.',
    ],
  },
];

export default function PrivacyPolicy({ onBack }: { onBack?: () => void }) {
  // Batch 122: a Back system for this page (owner's ask) — the
  // page is reached from the FAQ card or directly at /privacy,
  // so a visitor needs an obvious way back to where they were.
  const goBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/faq';
    }
  };
  const backButton = (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-purple-500/25 text-purple-200 hover:border-purple-400/60 hover:text-white text-xs sm:text-sm font-bold cursor-pointer transition-all"
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-10">
      <div className="mb-4">{backButton}</div>
      <div className="text-center space-y-2">
        <div className="mx-auto w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300">
            Privacy Policy
          </span>
        </h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          What Bangtan Gallery collects, why, and the choices you have — in plain words.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {SECTIONS.map((s) => (
          <article key={s.title} className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
            <h3 className="text-base sm:text-lg font-black text-white">{s.title}</h3>
            {s.body.map((para, i) => (
              <p key={i} className="text-sm text-gray-300 leading-relaxed mt-2">
                {para}
              </p>
            ))}
          </article>
        ))}
      </div>

      <div className="mt-6 text-center">{backButton}</div>
    </section>
  );
}
