# Bangtan Gallery — Cleanup Notes (2026-11-03)

This is the cleaned copy of the uploaded `bangtan-gallery_1_ohth.zip`.
**No site code was changed** — every file under `src/`, `index.html`, and all
Firebase rules/configs are byte-for-byte identical to the upload, so the site
looks and works exactly the same. Only junk around the code was removed:

## Removed (junk / duplicates)
- `.aistudio/` — Google AI Studio internal planning artifacts, not part of the site.
- `assets/` — contained only an AI Studio `.gitignore` leftover.
- `metadata.json` — AI Studio project descriptor; nothing in the site or build uses it.
- `bun.lock` — empty (0-byte) lockfile that conflicted with the real `package-lock.json`.
- `scripts/generate-spa-routes.js` — duplicate; the build uses `generate-spa-routes.ts`.
- `public/audio/sample_track.mp3` — byte-identical duplicate of
  `public/audio/sample_bts_chime.wav` and not referenced anywhere in the code.

## Changed (cosmetic only)
- `package.json` name: `react-example` → `bangtan-gallery`.

## Kept on purpose
- All deploy configs (`firebase.json`, `vercel.json`, `render.yaml`,
  `public/.htaccess`, `public/_redirects`) — removing one could break a deploy path.
- `firebase-blueprint.json` — documents the Firestore data structure; useful reference.
- `firebase-applet-config.json` — the live Firebase web config the site connects with.

## Verified after cleanup
- `npm install` — OK
- `npm run build` — OK (Vite build + SPA route generation, incl. 3 pre-rendered news pages)
- Served the production build locally: home page, a news article route, and both
  referenced audio files (`dynamite_preview.wav`, `sample_bts_chime.wav`) all returned 200.

## Run it
```bash
npm install
npm run dev      # local dev server on port 3000
npm run build    # production build into dist/
```
The `dist/` folder in this copy is the ready-to-deploy production build.

## Fix applied 2026-11-03 — REAL video uploads (Firebase Storage)

The Admin Panel's video uploader previously only *looked* real. Its progress
bar was simulated (timers and invented speeds), the file was stored only in
the uploader's own browser (IndexedDB), and it returned a fake `r2://`
reference — no video ever reached a server, so no visitor could watch it.

`uploadVideoWithProgress` in `src/utils/mediaStore.ts` now performs a real
Firebase Storage resumable upload (`uploadBytesResumable`):

- Progress, speed and ETA are measured from real `bytesTransferred`.
- Files are stored under `videos/` in the project's Firebase Storage bucket
  and the returned URL is the public download URL, so published videos play
  for every visitor on any device.
- Multi-GB files (2-3 GB) are supported by the resumable protocol, subject to
  project quota: the free Spark plan holds **5 GB total**, so one or two
  2-3 GB videos nearly fill it; Blaze is needed for a large library.
- `storage.rules` requires a signed-in user for writes, which matches the
  Admin Panel's Firebase Auth login. Signed-out uploads now fail with a clear
  error message instead of a fake success.
- The local IndexedDB record now stores metadata only (no multi-GB blob copy).

Verified: `npm run build` passes and the shipped bundle contains the new
upload code; the built site serves correctly. A live upload to the Firebase
project was not testable from the build environment (it needs the admin's
Firebase Auth sign-in on the deployed site) — the first upload from the
Admin Panel is the live test.

Note: the *audio* uploader (`uploadAudioWithProgress`) still uses the older
local-first pattern with a backend fallback; only the video path was changed.

## Fix applied 2026-11-03 — admin posts/uploads kept disappearing

Root causes found in `src/firebaseController.ts` (all verified in code):

1. **A 4-second race sabotaged every storage upload.** All three upload
   handlers raced `uploadBytes` against a 4 s timer. Real uploads usually
   "timed out", so files silently fell back to giant base64 strings — or, for
   audio, to a made-up `/audio/<filename>` URL for a file that exists on no
   server.
2. **Silent save failures.** Base64 files were embedded in the single shared
   `config/published` / `config/draft` Firestore documents. Once a document
   passed Firestore's 1 MiB limit, every save failed — but the cache-first
   wrappers swallowed the error and the UI still said "saved/published", so
   posts lived only in the admin's browser cache and then vanished.
3. **Media library self-trimmed to 15 items.** Each new admin upload sliced
   `adminMedia` to the newest 15, silently deleting older uploads.
4. **A legacy cleanup could wipe all videos.** `ensureSeeded()` deleted the
   entire `videos` array in Firestore from any browser missing a localStorage
   flag if a video had id `vid1` or videoId `gdZLi9oWNZg`.

Fixes applied:

- Removed all three 4-second `Promise.race` timeouts; uploads now await the
  real Firebase Storage result. Large files that genuinely fail now throw a
  clear error instead of storing base64 or a fake `/audio/` path (small
  files keep a safe embedded fallback; the public gallery uploader keeps a
  bounded fallback within Firestore rule limits).
- Removed the 15-item media trim.
- Removed the legacy videos-wipe blocks and the flag mechanism.
- Draft save and Publish now write to Firestore directly and **surface**
  failures (HTTP 500 with the real reason) instead of fake success — the
  Admin Panel's existing error handling shows the message.
- Stored media URLs are never rewritten to non-existent paths.

**Deployment required:** push this code to GitHub so Render redeploys
`bangtangallery.online`. Already-lost posts cannot be recovered by code (the
failed writes never reached Firestore). If the first publish after deploy
reports a document-size error, the old published config is already over the
1 MiB limit: re-upload the heavy posts' images (they now go to Storage as
lightweight URLs) or delete the heaviest old posts, then publish again.

Verified: `npm run build` passes; the shipped bundle contains the new error
paths and no `Storage timeout` code remains. A live Firestore write test was
not possible from the build environment (requires the project's sign-in).

## Fix applied 2026-11-03 — traffic quota (free-plan) survival: Layer 1 + 2

Problem (as clarified by the owner): with heavy traffic (~20,000 visitors)
the free Firebase quotas run out — Firestore allows 50,000 reads/day and
Firebase Storage about 1 GB/day of downloads. When a quota dies, the site
falls back to stale cached/default content, so everything uploaded from the
Admin Panel appears to vanish, while assets baked into the code (deployed
via VS Code/GitHub/Render) remain. This is a quota problem, separate from
the data-loss bugs fixed earlier the same day.

**Layer 1 — read & bandwidth diet (active immediately, no setup):**
- `ensureSeeded()` no longer runs its full multi-document seeding check in
  every visitor's browser. Non-admin browsers take a fast path that only
  keeps the published config fresh; the full check runs for signed-in
  admins, at first-run bootstrap, plus a once-per-session admin seed guard
  (`ensureAdminSeeded`).
- `GET /api/config/published` now serves a 2-minute in-memory/localStorage
  cache (`rememberPublished`/`getFreshPublishedCache`) instead of a
  Firestore read on every component request. Publish updates the cache.
- Large photos are downscaled in the browser before storage
  (`compressImageBlobIfLarge`: max 1600px, re-encoded, only if >500 KB),
  cutting typical phone photos from 3-6 MB to ~200-400 KB — the same daily
  download quota serves roughly 10x more image views.

**Layer 2 — Cloudinary for images (code ready, needs the owner's free
account values):**
- New `src/config/media.ts`: fill `CLOUDINARY_CLOUD_NAME` and
  `CLOUDINARY_UPLOAD_PRESET` (unsigned preset) or set the matching
  `VITE_CLOUDINARY_*` env vars. Cloudinary's free plan: 25 GB storage +
  25 GB bandwidth/month, no card required.
- All three image upload handlers try Cloudinary first (after compression)
  and automatically fall back to Firebase Storage when Cloudinary is not
  configured or fails. Audio and video are unchanged (Firebase/YouTube).
- Images already stored in Firebase keep working; only new uploads move.

**Owner's remaining steps:** create the free Cloudinary account, create an
unsigned upload preset, put the two values in `src/config/media.ts`, then
push to GitHub so Render redeploys.

Verified: `npm run build` passes; the shipped bundle contains the
Cloudinary endpoint, the visitor fast-path, and the published-cache logic.
Live quota behaviour can only be observed on the deployed site.

## Fix applied 2026-11-03 — all fake/stock "AI" pictures replaced with real BTS photos

Audit found no local image files; all imagery was remote. The fake pictures
were **Unsplash stock photos presented as BTS content** (43 references):
generic concert/DJ/stock shots used as song covers for 17 tracks, gallery
"meme" pictures, concert covers, Generate-Pic studio presets, and —
worst — stock photos labelled as specific members ("Jung Kook", "V",
"Jimin", "RM") in the studio's bias picker. Also, gallery items gal1–gal12
all showed the same White House press photo under 12 different false titles,
and two news covers were unlicensed Pinterest hotlinks.

Replacements — every one a **real, CC-licensed BTS photograph from
Wikimedia Commons** (the same source as the member portraits, which were
already real):
- Track covers: real concert photos matched to songs where possible —
  "Fake Love" and "Spring Day" use actual live photos of those songs;
  solo tracks use the member's real portrait or live photo.
- Gallery: each item now shows the photo its title describes (Wembley
  purple ocean, "Fire" in São Paulo, first Daesang 2016, MelOn 2018,
  Jung Kook's "Euphoria" at Rose Bowl…) and member items use their real
  portraits; false titles were corrected to honest captions.
- Generate-Pic studio: presets and member picker now use the real member
  portraits and real concert photos.
- Concert covers, news covers, OG-image defaults and admin fallbacks:
  real group/concert photos; Pinterest hotlinks removed.

Photo URLs use Wikimedia Commons' `Special:FilePath` service (redirects to
the official thumbnail CDN). The mechanism was verified in a live browser:
the Wembley concert photo loads at 1280×720. Licenses are CC BY — the
Commons file pages credit the photographers.

Verified: zero `images.unsplash.com` and zero `i.pinimg.com` references
remain in the source; `npm run build` passes and the pre-rendered news
pages now carry the real Wikimedia covers.

Not changed (already real photos, only their seed labels are decorative):
the admin media seed names and the seeded fan-art entries, which use the
White House group photo — the owner can replace those from the Admin Panel.

## Fix applied 2026-11-03 — Live Stream section now does REAL live streaming

Before: the section was a simulation. It booted as a permanently "live"
third-party VdoCipher stream with invented statistics (3,420 viewers,
68,420 views, started 45 minutes ago — all hardcoded), the HLS player fell
back to a non-existent `/live/stream.m3u8` that retried forever, and the
admin "Start Live Stream" button called a `simulate_publish` endpoint that
flipped a flag, invented 120–170 random viewers, and toasted "RTSP/RTMP
Simulated Successfully". No real stream could ever play.

Now (real flow, free): the admin starts the broadcast on YouTube (YouTube
hosts it free — this static site has no streaming server of its own, so
OBS/RTMP keys were never usable here), pastes the live link / embed code /
.m3u8 URL in Admin Panel → Live Streaming, and presses Go Live. The site
saves it to the live config and the section plays the real stream:
YouTube/Twitch/Kick/Vimeo links are converted to proper embeds
(`src/utils/streamEmbed.ts`), .m3u8 plays through the HLS engine, and the
Firestore live chat already worked and is unchanged.

Changes:
- `LiveStreamSection`: honest initial state (offline, no source, zeroed
  stats); HLS engine no longer falls back to the dead local file; player
  only uses the HLS branch for real .m3u8 sources; dead simulate handler
  removed.
- `AdminPanel`: "Start/Stop Live Stream" now performs a real publish of
  the pasted source (and refuses to go live with no source); added a
  step-by-step "How to Go Live — Free, with YouTube Live" guide in the tab.
- `firebaseController`: live-status defaults no longer inject the
  third-party stream, fake RTMP/WHIP server URLs, or invented viewer
  numbers; `simulate_publish` no longer fabricates viewers; telemetry now
  reports the actual source type (YouTube Live / HLS / Embedded).

Verified: build passes; no UI path calls the simulate endpoint anymore.
The first real test is on the deployed site: paste a YouTube Live link in
the admin tab and press Start — it should appear in the section at once.

## Change applied 2026-11-03 — gallery download gate + Admin Panel split into its own app

**Gallery preview & downloads.** The gallery already had a full-screen
viewer (click a photo → preview, ✕ close, prev/next). What was missing is
that downloads were open to everyone. Now they are the admin's choice:
Admin Panel → Gallery tab → "Gallery Image Downloads" switch (stored as
`galleryDownloadsEnabled` in the site config, applied on Publish).
Default OFF: visitors can view but see no download button anywhere; ON:
the download button appears on the card hover and in the preview.

**Admin Panel is a separate app now.** Before, the panel lived inside the
public website: it opened at /admin or #admin, or by triple-clicking the
footer copyright line, and its ~13k lines shipped in the public bundle.
Now the build produces two apps from the same codebase:
- `index.html` — the public website. AdminPanel import, the /admin and
  #admin triggers, and the 3-tap entry are all removed; the public JS
  bundle dropped from ~2.6 MB to ~1.2 MB and contains no admin code
  (verified by bundle inspection — admin-only strings exist only in the
  admin bundle, which the public page never loads).
- `admin.html` — the standalone Admin Panel (new entry `src/admin-main.tsx`
  + `src/AdminApp.tsx`), with no ad scripts and a noindex tag. Routing:
  `render.yaml` and `public/_redirects` rewrite /admin → /admin.html, so
  the panel lives at bangtangallery.online/admin.

Both apps share the same client-side API layer (`src/apiPatch.ts`,
extracted unchanged from main.tsx) and the same Firebase backend, so the
panel stays fully connected: publish in the panel and the website updates
exactly as before. The admin login is unchanged (Firebase Auth).

Verified: `npm run build` passes with both entries; local preview serves
/ (site) and /admin.html (panel) with HTTP 200.

Note: the earlier single-file downloadable preview predates this change
and no longer matches the site structure; check this version after
deploying to Render.

## Change applied 2026-11-03 — owner's own member photos (from Pinterest), self-hosted

The owner supplied 7 Pinterest pins (pin.it links), one portrait per
member, all from the same dark editorial shoot, and chose the
download-into-the-project option. Each pin was resolved to its original
image, identified by member, lightly normalised (re-encoded JPEG q88,
metadata stripped), and saved self-hosted at:
`public/images/members/{rm,jin,suga,j-hope,jimin,v,jung-kook}.jpg`
(38–53 KB each, ~736px). Mapping (pin order): 1 RM, 2 Jung Kook,
3 Jin, 4 SUGA, 5 j-hope, 6 Jimin, 7 V.

`MEMBERS[].portraitUrl` in `src/data/btsData.ts` now points at the local
files — these are the website's member profiles (Members section and
everywhere the profile data is used), not Weverse.

Because the live site reads members from Firestore (seeded earlier with
the old Wikimedia portrait URLs), a serve-time migration was added in
`src/firebaseController.ts` (`migrateMemberPhotos`): any stored config
whose member portraitUrl exactly matches one of the 7 old hotlinks is
served with the new local file instead. Visitors and the admin panel
therefore show the new portraits immediately on deploy, and the paths
become permanent in Firestore the next time the admin publishes. Custom
portraits uploaded by the admin never match and are untouched.

Left unchanged on purpose: the same members' faces in the Generate-Pic
studio picker, solo track covers, and solo gallery items still use the
previous real (Wikimedia) photos — different features from the profiles;
they can be swapped the same way on request.

Verified: build passes; all 7 files are in dist and served with
HTTP 200 as image/jpeg.

## Change applied 2026-11-03 — link-sharing cover set to the owner's group photo

The owner supplied a BTS group photo (all seven in suits, dark red/black)
to be the cover shown whenever the site link is shared. It was processed
to the Open Graph standard size (1200×630, center-cropped protecting the
heads) and saved self-hosted at `public/images/og-cover.jpg`.

Set as the share image everywhere a site-level cover is used:
`index.html` (og:image, og:image:secure_url, twitter:image, image_src,
JSON-LD primary image, and the width/height tags), the default OG image
in `src/utils/seoHtmlInjector.ts`, the /news fallback in `vite.config.ts`
(this one still pointed at an old Pinterest hotlink — now fixed), and
both defaults in `scripts/generate-spa-routes.ts`. News articles keep
their own covers. Absolute URL used:
https://bangtangallery.online/images/og-cover.jpg

Verified: build passes; the built pages carry the new og:image and the
file serves with HTTP 200. Note for the owner: sharing apps cache link
previews, so the old cover can appear for a while after deploy; the new
one takes over as caches refresh.

## Change applied 2026-11-03 — share cover replaced with the press-conference group photo

The owner replaced the link-sharing cover with a second group photo
(BTS at a press table with microphones). Processed the same way
(1200×630, faces verified intact after the crop) and saved as
`public/images/og-cover-2.jpg`; the previous og-cover.jpg was removed.
A new filename was used on purpose: sharing apps cache previews by URL,
so the new address makes WhatsApp/Facebook fetch the new cover fresh
instead of reusing the cached first one. All 10 references were updated
(index.html ×6, seoHtmlInjector ×1, vite.config ×1, generate-spa-routes
×2). The same tags are what Google reads for the image shown beside the
site in search results; Google applies it on its own re-crawl schedule.
Verified: build passes; og:image points at the new file and it serves
with HTTP 200.

## Changes applied 2026-11-04 — owner's six fixes (music, voting, gallery, memes, visitors)

Reported from the live site with screenshots: the Music page showed two
players at once, the page was not responsive, custom music from the
admin did not reach visitors, voting events showed no details, gallery
pictures would not open, a separate Memes page existed, and the admin
showed no real visitor count.

1. Music — one player only (MusicSection.tsx, AudioPlayerContext.tsx,
   GlobalMiniPlayer.tsx): every track click/play button now goes through
   a single activateTrack() path. A Spotify track plays only in the
   player card — the floating audio bar pauses and hides (new
   spotifyPanelActive flag in the audio context). An uploaded-audio
   track plays only in the floating bar and clears the card. The third
   player (the per-row inline Spotify embed + its Embed toggle) was
   removed. Responsive: the player card is sticky only on desktop
   (lg:sticky) and stacks full-width on mobile, the grid gained bottom
   padding so the floating bar never covers content.
2. Custom music from the admin: the Digital Track editor's audio
   uploader (AdminAudioUploadManager → /api/upload/audio) already lands
   in the upload handler fixed on 2026-11-03, so an MP3 uploaded in
   Admin → Music → Digital Tracks is stored as a real file URL and
   plays for every visitor after Publish. No code change was needed
   beyond the music-page playback fix above.
3. Voting (VotingCenterSection.tsx): clicking an event's cover or
   title, or the new "👁 View Details" button, opens a details view
   with the full description, platform, start/end dates, a Vote Now
   link and the Submit Vote action in one place.
4. Gallery (GallerySection.tsx): the lightbox no longer renders
   through framer-motion's AnimatePresence (a fragile portal pattern
   that could swallow the preview) — it mounts directly, and a
   floating ✕ close button was added at the top-right so the preview
   can always be closed on phones.
5. Memes removed as a page: src/components/MemesSection.tsx deleted,
   its App import removed, and /memes now routes to Gallery with the
   'Memes' category preselected. Memes live on as a Gallery category:
   the gallery upload form's category list already includes 'Memes',
   and the seeded meme items already carry category 'Memes'.
6. Real visitor counter (firebaseController.ts): the existing
   once-per-session POST /api/stats/view (already called by
   BackendContext) now increments a Firestore `live_views` field, and
   GET /api/stats reports totalViews = 51,456 + live_views — the
   owner's real historical total as the base, counting up live. The
   Admin Panel's "Cumulative Page Views" card shows this number.

Verified: production build passes; the built bundles contain the new
counter, the details view and the single-player flag; home and admin
pages serve HTTP 200. Takes effect on bangtangallery.online after the
owner pushes this zip to GitHub and Render redeploys.

## Changes applied 2026-11-05 — moderation flow, live stream, admin cleanup

Reported with screenshots: visitors could see/use delete on Videos;
pending items in the admin could not be rejected or published; a live
embed set in the admin appeared once on the site then vanished; the
concert cover upload stuck on "Uploading image asset..."; the game-era
Audio & Sound CMS and 3D Showcase admin sections were unwanted; the
Visual Page Editor rendered garbled on narrower screens.

1. Real moderation for submissions (firebaseController.ts): the auth
   check treated every browser as an admin (`|| isClientEnvironment`),
   so public submission lists leaked everything and the video
   user-action endpoint (delete / clear-all / set-featured) executed
   for anyone. isAuthenticated is now real (Firebase Auth user or a
   stored admin token), and both user-action endpoints refuse
   management actions without it. Video and music submissions are born
   'pending' and are no longer instantly copied into the live config;
   approve adds them once (reusing the submission id, deduped), and
   reject now also scrubs any live copy from draft+published (older
   auto-published leaks included, matched by id or URL). Voting
   proposals already used the pending flow and were left as-is.
2. Public Videos page (YouTubeClone.tsx): the per-video delete button,
   its confirmation modal, the "Clear All" wipe-all button and the
   featured/delete helpers were removed — visitors can submit and
   watch, nothing more. Deletion lives only in the Admin Panel.
3. Live stream vanishing (firebaseController.ts +
   LiveStreamSection.tsx): /api/admin/live/update (and
   simulate_publish) now mirror the merged stream into the draft
   config as well as the published one, and the public section no
   longer listens to the published-config mirror — config/liveStream
   is the single source of truth, so the two snapshots can't race the
   player back offline after it appears.
4. Concert cover upload: the SmartImageInput → /api/admin/media/upload
   → Firebase Storage path was verified correct; all three Storage
   upload sites in the controller now go through
   uploadBytesWithTimeout (60s), so a stalled network await ends in
   the existing clear error/fallback instead of hanging on
   "Uploading image asset..." forever.
5. Admin Panel: the 'Audio & Sound CMS' (AudioControl) and '3D Media
   Showcase' (Showcase) tabs were removed completely — sidebar
   entries, page blocks, and their save-mapping branches. Site
   content/data for showcase & trending is untouched; the Trending
   editor happened to live inside the Showcase tab, so it went with
   it (flagged to the owner).
6. Visual Page Editor (VisualWebsiteEditor.tsx): below the xl
   breakpoint the preview and the 380px editor panel now stack
   vertically (panel full-width under the preview) instead of the
   preview being crushed into a garbled sliver; the header wraps.

Verified: production build passes; bundles contain the new auth gate
and timeout guard and none of the removed tabs/buttons; home and
admin pages serve HTTP 200. Takes effect after the owner pushes this
zip to GitHub and Render redeploys.

## Changes applied 2026-11-05 — gallery upload spinner, live caption, heading sizes

1. Gallery uploads stuck on "loading" (GallerySection.tsx,
   BackendContext.tsx, firebaseController.ts): the submit chain could
   pend forever — the controller's Firestore media write has no settle
   guarantee on slow/blocked connections, BackendContext.uploadMedia
   awaited a full refreshData() before returning, and the form awaited
   all of it. Fixes: the media write is raced against 15s (the item is
   already in the local cache and is returned as saved); uploadMedia
   now refreshes in the background (8s bound) instead of blocking the
   submit; the form races the whole upload against 45s and ends the
   spinner with a clear message if the network stalls.
2. Live Stream page (LiveStreamSection.tsx): the broadcast caption
   card (live badge, stream title, description, chat/uptime stats)
   moved from under the player to directly under the page header —
   above the player — and restyled as a prettier gradient card with a
   gradient headline.
3. Page headings shrunk one size step across the site, per the
   owner's screenshot of the oversized Voting Center title: Voting
   Center, Music, News, Countdown, Member Profile, Concert Replays,
   Gallery, Generate Pic, Timeline, Events, Downloads, FAQ, Contact,
   Feedback, Settings, and the Live Stream header.

Verified: production build passes; home and admin serve HTTP 200.
Takes effect after the owner pushes this zip to GitHub and Render
redeploys.

## Changes applied 2026-11-05 — Telegram videos in Concert Replays

The owner asked for Telegram-hosted concert videos to play inside the
website's Concerts & Replays section when a Telegram link is pasted,
so the same video no longer has to be re-uploaded elsewhere. Telegram
has no direct file URL for post videos without the Bot API; the
supported route is Telegram's official post-embed widget, which
streams the video inline (public channels/groups only).

- New src/utils/telegramEmbed.ts: parseTelegramPost() recognizes
  public post links (t.me/<channel>/<postId>, also telegram.me and
  t.me/s/ preview links) and rejects private (t.me/c/...), invite
  (t.me/+...) and joinchat links, which Telegram cannot embed.
- New src/components/TelegramPostEmbed.tsx: loads the official
  telegram-widget.js with data-telegram-post, themed dark/purple,
  with an always-visible "watch it on Telegram" fallback link so the
  player never dead-ends if the widget is blocked.
- RecentConcertReplay.tsx: a Telegram videoUrl now renders the widget
  (before this, a t.me link fell into a <video> tag pointing at an
  HTML page and could never play); the player box drops its fixed
  16:9 crop for widget posts, which size themselves.
- AdminMediaUploaders.tsx (AdminConcertVideoManager): the embed field
  accepts a Telegram post link alongside YouTube — it keeps the
  original t.me link as the video URL, confirms with a toast, shows
  the widget in the preview frame, and the field's labels/hints now
  say so; existing concerts with a Telegram link open in embed mode.

Verified: production build passes; the widget loader is present in
the shared bundle chunk used by both apps; home and admin serve
HTTP 200. Takes effect after the owner pushes this zip to GitHub and
Render redeploys.

## Changes applied 2026-11-05 — working white mode + real photo logo

1. Light/white mode (src/index.css): the theme toggle only restyled
   the app shell (header/sidebar) while every section hardcoded dark
   panels and white text, so "white mode" was unreadable inside the
   pages. A translation layer of .light-scoped overrides now converts
   the recurring dark palette site-wide: near-black purple surfaces
   become white cards, purple-950 panels become light lavender,
   white/pale text becomes dark (#211335 family), muted grays/purples
   darken to readable tones, hairline white borders become soft dark
   lines, and placeholders darken. Solid/gradient brand buttons and
   badges keep white text; media players and image scrims stay dark.
   The toggle itself (header sun/moon + Settings preferences) already
   existed and now actually works everywhere.
2. Logo/icons: the favicon was a third-party icons8 hotlink (both in
   index.html and as seo.faviconUrl in the site config). It is
   replaced everywhere by the owner's own BTS group photo — the same
   press-conference image shown beside shared links (og-cover-2.jpg) —
   center-cropped square as public/images/logo-bts.jpg (purple-styled
   in place). Set as favicon + apple-touch-icon in index.html,
   admin.html and public/404.html; the config default faviconUrl now
   points to it, and a serve-time migration rewrites any stored
   icons8 faviconUrl to it so the live config cannot resurrect the old
   icon. Brand marks that used the ⟭⟬⁷ glyph — the site header logo
   box, the admin login brand and the admin top bar — now show the
   photo in a purple ring/frame. The glyph remains only where it is
   written text (quotes, labels, song/template names), not an icon.

Verified: production build passes; logo file ships in dist and
serves HTTP 200; the light-mode rules are present in the built CSS;
home and admin serve HTTP 200. Takes effect after the owner pushes
this zip to GitHub and Render redeploys.

## Correction applied 2026-11-05 — favicon stays, only the in-site logo changed

The owner clarified the previous change: the favicon — the icon shown
beside the website's link (the "earth icon" in their browser) — must
stay exactly as it was; only the BTS logo INSIDE the website (the
glyph mark in the header, circled red in their screenshot) becomes
the real group photo. Accordingly, all favicon changes from the
previous entry were reverted: index.html, admin.html and
public/404.html once again use the original icons8 favicon links, the
config default faviconUrl is the original icons8 URL, and the
serve-time favicon migration was removed. What remains from the
previous entry: the light-mode translation layer (unchanged), and
the in-website brand marks — site header, admin login, admin top
bar — showing public/images/logo-bts.jpg (the group photo) in a
purple ring/frame instead of the ⟭⟬⁷ glyph.

Verified: production build passes; dist/index.html carries the
original icons8 favicon again; the logo photo still ships and serves
HTTP 200.

## Owner round 2026-11-05 (batch 8): logo, video queue, vote proofs, live caption, light mode 2, Telegram note

- Logo: the in-website brand marks (site header, admin login, admin
  top bar) now use the owner's supplied purple BTS logo image
  (public/images/bts-logo.png) instead of the group photo; the photo
  file was removed. Favicon untouched, as corrected before.
- Video curation queue: the Admin Panel inbox listed EVERY submission
  forever (no status filter), so Approve/Reject looked broken — the
  pitch never left the queue. The queue now shows only pending items,
  the buttons verify the server's real success flag, remove the pitch
  from the queue instantly on success, and surface the server's error
  text when an action truly fails.
- Vote proofs (new): the Cast Verified Vote modal was posting to
  /api/voting/ballot, which had NO handler — votes were never recorded
  anywhere. Now: real POST /api/voting/ballot storing ballots in a
  vote_ballots Firestore collection, and GET /api/voting/proofs. The
  modal asks (top to bottom) for the voter's X username, voter
  username, full name, country (dropdown) and a vote screenshot
  (compressed in the browser to fit the database record). The Voting
  Center shows a public "ARMY Vote Proofs — by Country" board with
  per-country counts, bars and the latest proof thumbnails. The owner
  can switch the whole proof system ON/OFF in Admin Panel -> Voting
  Center CMS (applies on Publish; default ON).
- Live caption: the big caption card above the player is removed. The
  caption is now simple text overlaid on the video itself while live
  (LIVE badge + title + one-line description, text shadow, no
  background box), in both the embed and HLS players.
- Light mode round 2: dark gradient surfaces (voting header card,
  news hero cards) are flattened to white in .light (image scrims,
  which are absolutely positioned, are untouched; brand button
  gradients keep their colors), and text over the home featured-news
  photo keeps its white color via an .on-media marker.
- Telegram: added an in-component note — when Telegram shows
  "Media is too big", that is Telegram's own web-embed size limit for
  large files (e.g. a full 27-minute live); the post then has to be
  watched in Telegram via the link under the embed. No website code
  can override Telegram's limit.

Verified: production build passes; bundles contain the ballot/proofs
endpoints, the proof board and the admin toggle; the old caption card
markup is gone; home/admin serve HTTP 200 and the new logo serves.

## Owner round 2026-11-05 (batch 9): live layout order, bias emojis, one music player, gallery share links

- Top spacing: the content wrapper's mobile top padding was cut and
  section roots tightened, so pages no longer open with a big empty
  band under the header.
- Live Stream page order is now: video -> caption -> Telegram button
  -> chat -> ad. The caption is plain text UNDER the player
  (YouTube-style, per the owner's reference screenshot) — the overlay
  caption from batch 8 was removed again in favour of this. The ad
  moved out of the player column to below the chat.
- Member bias emoji: new shared MemberEmojiPicker (RM 🐨, Jin 🐹,
  SUGA 🐱, j-hope 🐿️, Jimin 🐥, V 🐯, Jung Kook 🐰; choice remembered
  in localStorage). Wired into: live chat (picker over the input, the
  emoji replaces the generated avatar beside the name), gallery
  comments (picker over the comment box, emoji in the profile circle;
  threaded through BackendContext.submitComment and the controller's
  comment record), and video submissions (picker in the submit form,
  stored on the submission, carried through approval into the site
  video, shown beside "Submitted by" and in the admin inbox).
- Music: the separate Spotify player card is GONE. Every track —
  uploaded audio or Spotify — now plays in the single bottom player
  bar (its built-in Spotify mode shows the embed inside the bar).
  AudioPlayerContext was patched so Spotify-only tracks toggle
  play/pause state without touching the empty <audio> element, and
  GlobalMiniPlayer no longer hides for Spotify. The page header is
  now one simple line: "🎵 Enjoy your BANGTAN MUSIC".
- Gallery share links: the lightbox Copy Link button now copies
  bangtangallery.online/gallery/<photo-id> (it used to copy the raw
  image file URL). The app opens that exact photo in the viewer when
  the link is visited (/gallery/<id> or ?photo=<id>), and
  generate-spa-routes now pre-renders a page per built-in gallery
  photo with that photo as the link-preview image. Photos uploaded
  after a build open in the viewer too; their preview falls back to
  the site cover until the next deploy regenerates pages.

Verified: production build passes; /gallery/gal5 preview page
carries the photo as og:image; the old music hero and Spotify card
strings are absent from the bundles; the picker and simple header
are present; home/admin serve HTTP 200.

## Batch 10 — Videos page: 2-per-row cards on mobile (2026-11-05)

Owner request: on mobile the Concert Replay cards (and the videos
below them) showed one large card per row; they should sit 2 per row,
wrapping to the next row.

- RecentConcertReplay: cards grid is now grid-cols-2 on mobile
  (3 cols on desktop), tighter gaps, and the card internals were
  compacted for the narrow width — smaller padding, title
  (13px, 2-line clamp), description (11px, 2-line clamp), smaller
  quality/part/featured badges, stacked Watch/Download buttons with
  smaller text. Location truncates instead of pushing the date out.
- YouTubeClone (the video grid below the concerts on the Videos
  page): same change — grid-cols-2 on mobile (3 on desktop), tighter
  gaps, compact card body (smaller title/description, smaller play
  overlay button, platform badge, Era/date and By/Watch meta rows
  tightened so nothing overflows at half width).
- Desktop layout unchanged (3 columns, original sizes from sm up).

Verified: production build passes; both new grid classes are
present in the built public bundle.

## Batch 11 — Smooth site, header icon removed, Concert nav page (2026-11-05)

Owner requests: (1) make the whole site smooth with no lag, (2) remove
the round circle-with-lines icon shown beside the site title, (3) give
the Concert Replay section its own nav entry "Concert" with a share
link like bangtangallery.online/arirang_concert_reply.

- Icon removed: the custom circled "⊕"-style Sparkles icon
  (src/components/CustomSparkles.tsx) is deleted, along with every use
  of it — beside "BANGTAN GALLERY" in the header, the mobile drawer
  title, the footer badge, three spots in MemberProfileDetail, and two
  in AdminPanel (the Visual Page Editor nav item now uses the lucide
  Palette icon). The lucide star-shaped Sparkles used inside sections
  is a different icon and was left alone.
- Concert nav page: new "Concert" item in the nav (after Videos,
  Ticket icon). It renders RecentConcertReplay as a standalone page
  (new `standalone` prop drops the in-page top rule/offset). The URL
  for the tab is /arirang_concert_reply (aliases /concert, /concerts,
  /concert-replay also open it), the global search suggests it, and
  generate-spa-routes pre-renders /arirang_concert_reply with its own
  title/OG share metadata. The concert block also still appears on the
  Videos page, unchanged.
- Performance pass (no visual redesign):
  * All tab sections are now React.lazy code-split chunks (Music,
    Videos, Concert, Gallery, Live Stream, Voting, News, Events,
    Timeline, Downloads, FAQ, Contact, Feedback, Settings, Generate
    Pic, Member profiles, Play Game). The public main bundle dropped
    from ~1.2 MB to ~340 KB; a small spinner shows while a tab's chunk
    loads (Suspense around the content area).
  * Page-change transition no longer animates a full-screen blur
    filter (expensive on phones) — it is a short fade/slide now.
  * AuroraBackground: the cursor-halo rAF loop now stops when the halo
    reaches the cursor instead of running a 60fps setState loop
    forever; mousemove updates are coalesced per frame and skipped
    entirely on touch devices; floating particles cut 35 -> 12; the
    two giant blurred blobs no longer pulse (a pulsing 120px blur is
    one of the most expensive things a phone GPU can be asked to do).
  * Always-on header animations removed: pulsing nav icons, the two
    "ping" halo dots and the spinning clock icons in the header are
    static now (content-level badges unchanged).
  * Video card thumbnails and news card thumbnails now load lazily
    (loading="lazy", decoding="async").

Verified: production build passes; main bundle 340 KB with separate
chunks for YouTubeClone (28 KB) and RecentConcertReplay (13.7 KB);
dist/arirang_concert_reply serves with the concert share title; home,
concert route and admin all return HTTP 200; no CustomSparkles
references remain in src.

## Batch 12 — Header search actually works (2026-11-05)

Owner report: the search at the top did not work — searching anything
felt like it left the site / found nothing.

Root causes found in src/App.tsx:
- The mobile drawer search sat outside the desktop search container
  ref, while a document-level 'mousedown' listener hid the suggestion
  panel. On phones a tap fires mousedown before click, so the panel
  closed and swallowed the tap — results could never be tapped.
- The search index only covered members, the static album catalogue,
  static news and keyword shortcuts. Real site content — uploaded
  videos, concerts, gallery photos, events, FAQs, downloads, timeline
  entries, published news/tracks — was not searchable at all, so most
  searches returned nothing.
- There was no Enter/Search-key behaviour at all.

Fixes:
- Click-outside listener now treats anything inside a
  [data-search-root] (both search boxes and their panels) as inside,
  so suggestion taps register on mobile and desktop alike.
- Search index now covers the published config: members, albums and
  tracks, uploaded digital tracks, site videos by title, concert
  replays by title/location, gallery photos by title/category,
  events, timeline entries, FAQ questions, downloads, and published
  news. Result actions are deep: a member opens their profile, a news
  hit opens that exact article, a gallery hit opens the Gallery with
  that photo's category selected, a concert hit opens the Concert
  page. Suggestions cap raised 6 -> 8.
- Enter / keyboard Search key submits to the best in-site match via a
  form with preventDefault (no page reload, never an outside web
  search). Both inputs gained enterKeyHint="search"; the mobile input
  now also opens the panel on focus.
- When nothing matches, the panel now says so ("No results for … in
  the site. Try a member name, song, video or concert title.") instead
  of silently showing nothing.

Verified: production build passes; the built bundle contains the new
search root handling and the no-results message; home serves HTTP 200.

## Batch 13 — Download icon on every gallery picture (2026-11-05)

Owner request: put a download icon on the gallery images; the picture
shown is the picture that downloads.

What was wrong: a download button existed but (a) it rendered only
when the admin switch "Gallery Image Downloads" was ON (default OFF,
so in practice nobody saw it), and (b) on the cards it appeared only
on mouse hover — on phones there is no hover, so it was invisible.

Changes (src/components/GallerySection.tsx):
- Every gallery card now carries an always-visible round download
  icon at the image's top-right corner. Tapping it downloads exactly
  that picture (the existing fetch-to-blob save-as helper, with a
  new-tab fallback when a host blocks CORS fetch).
- Downloads are ON by default: the icons hide only when the published
  config explicitly sets galleryDownloadsEnabled to false, so the
  Admin Panel switch still works as an off switch.
- The saved filename now keeps the picture's real extension
  (jpg/png/webp) instead of always forcing .png.
- The full-screen viewer keeps its Download button (same behaviour),
  so the open picture can be saved from there too.

Verified: production build passes; the built Gallery chunk contains
the always-visible card download button and the new default-on gate.

## Batch 14 — Vote board to bottom, Live black-screen fix, Videos concert button (2026-11-05)

Owner requests: (1) the "ARMY Vote Proofs — by Country" board should
show at the BOTTOM of the Voting page, (2) the Live Stream page goes
black and shows nothing when opened — fix it, (3) on the Videos page
the concert replay cards should drop their per-card buttons for ONE
"WATCH CONCERT REPLY" button that leads to the Concert page.

1. Vote board moved (VotingCenterSection): the proofs board block now
   renders after the voting-events tab grids, at the bottom of the
   page, instead of directly under the header card.

2. Live Stream black screen — ROOT CAUSE FOUND AND FIXED: in
   LiveStreamSection.tsx a second hook (the bias-emoji useState) had
   been nested INSIDE the chatAuthorName useState initializer
   (introduced with the batch-9 emoji picker). Hooks may never be
   called inside another hook's initializer: the nested call consumed
   the wrong hook slot and corrupted hook order, so as soon as the
   stream status loaded and the component re-rendered, React threw
   and unmounted the whole tree — a black page. The bias-emoji state
   is now a normal top-level hook. Hardening: App.tsx gained a
   SectionErrorBoundary around the tab content (keyed by tab), so if
   any section ever throws again, the visitor sees a small "Tap to
   retry" card instead of a black page.

3. Videos-page concerts (RecentConcertReplay new `linkMode`, passed
   by YouTubeClone): cards no longer carry Watch/Download buttons;
   clicking a card — or the single gradient "Watch Concert Reply"
   button under the grid — navigates to the Concert page
   (/arirang_concert_reply via pushState + popstate, which App's
   routing handles). The standalone Concert page keeps its per-card
   Watch Now / Download buttons unchanged.

Verified: production build passes; the concert chunk contains the
"Watch Concert Reply" button; the main bundle contains the error
boundary fallback; source order confirms the vote board sits after
the tab grids; the Live hook nesting is gone; home serves HTTP 200.

## Batch 14 addendum — Videos page: cards gone, ONLY the button (2026-11-05)

Owner clarification: on the Videos page the concert CARDS themselves
should be removed — not just their buttons. RecentConcertReplay's
linkMode now returns early with a single full-width gradient
"WATCH CONCERT REPLY" button (which navigates to /arirang_concert_
reply); no header, no cards, no grid on the Videos page. The
standalone Concert page is unchanged, with per-card Watch Now /
Download buttons. This supersedes batch 14 item 3's card-keeping
version. Verified: production build passes and the button is in the
built concert chunk that the Videos page loads.

## Batch 15 — Member profile cover banners from the owner's links (2026-11-05)

The owner supplied 7 Pinterest image links as member profile covers.
Downloaded into the project (public/images/members/covers/, PIL
re-encode q88, metadata stripped) and set as each member's bannerUrl;
the serve-time migration (migrateMemberPhotos, extended) also swaps
the old seeded banner on the live config: any member whose bannerUrl
is still the seeded White House group photo is served their own cover,
keyed by member id.

IMPORTANT — link mix-up caught by inspecting the images: the link the
owner pasted for BOTH j-hope and SUGA is the same image, and that
image is SUGA's cover (it shows SUGA and reads "Welcome To suga
World"). It was assigned to SUGA only. All other links were verified
against their pictures (RM, Jin, V/Taehyung, Jung Kook, Jimin all
match their own "Welcome to … world" banners). j-hope's banner
therefore still uses the group photo; his migration entry and data
line stay ready for the correct link when the owner sends it.

Verified: production build passes; all six cover files are in dist/
images/members/covers/ and the migration ships in the built bundle.

## Batch 15 addendum — j-hope's cover received and added (2026-11-05)

The owner sent j-hope's correct cover link. Verified visually: it is
j-hope's own banner ("Welcome To Jhope world"). Saved as
public/images/members/covers/jhope.jpg, set as his bannerUrl, and his
entry added to MEMBER_BANNER_MIGRATION, so all 7 members now have
their own supplied cover banner. Build verified; all 7 covers ship in
dist/images/members/covers/.

## Batch 16 — Aesthetic Moments: RM (2026-11-05)

The owner began supplying per-member photos for each profile's
"Aesthetic Moments" grid (member.gallery). RM: 3 links sent, but the
3rd Pinterest file is dead (AccessDenied at 736x and originals — the
image was removed from Pinterest's CDN), so 2 photos were installed:
public/images/members/aesthetic/rm-1.jpg, rm-2.jpg (verified RM fan
edits), set as RM's gallery in btsData.ts. Every member's seeded
gallery was just the White House group photo twice, so the serve-time
migration gained MEMBER_GALLERY_MIGRATION (keyed by member id): a
member's gallery is replaced only while every entry is still the old
seeded group photo, so an admin-curated gallery is never overridden.
Other members will be added to the map as their links arrive.
Build verified; both files ship in dist/images/members/aesthetic/.

## Batch 16 addendum — Aesthetic Moments: Jimin + j-hope (2026-11-05)

Jimin: 3 links sent but links 2 and 3 were the SAME image, so 2
unique photos installed (aesthetic/jimin-1.jpg, jimin-2.jpg — both
verified Jimin). j-hope: 3 unique photos installed (jhope-1/2/3.jpg —
all verified j-hope). Data galleries updated for both.

Migration correction made in this batch: the seeded member galleries
were NOT uniformly the group photo — each member's seed was [their
old Wikimedia portrait URL, the group photo] (only RM and Jung Kook
had the group photo twice). The gallery migration now exact-matches
each member's original seeded pair (MEMBER_SEED_GALLERY_URLS) before
replacing, so it still fires on the live config and still never
overrides an admin-curated gallery. Build verified; 7 aesthetic files
now ship in dist (rm x2, jimin x2, jhope x3).

## Batch 16 addendum 2 — Aesthetic Moments: Jin, SUGA, V, Jung Kook (2026-11-05)

The owner sent pin.it short links for the remaining four members.
Resolved each pin page's og:image to its i.pinimg.com 736x file,
downloaded, visually verified every photo against its member, saved
self-hosted (PIL q88) and wired into data + MEMBER_GALLERY_MIGRATION:
- Jin: the same pin.it link was pasted twice, so only 1 unique photo
  (jin-1.jpg). Owner can send another for a second slot.
- SUGA: 2 (suga-1/2.jpg). V: 2 (v-1/2.jpg).
- Jung Kook: 4 (jungkook-1..4.jpg).
All 7 members now have owner-supplied Aesthetic Moments (16 photos
total in public/images/members/aesthetic/). Build verified; all 16
files ship in dist.

## Batch 17 — Real Instagram handles + new Solo Spotlight songs (2026-11-05)

Owner sent a screenshot of SUGA's Instagram following list (the real
handles) and asked: use these real Instagram usernames on the
profiles, drop the duplicate/dead links, and put each member's NEW
solo songs (2 each) in the Solo Performance Spotlight.

Instagram: the profile page builds socials from member data fields,
falling back to hardcoded defaults in MemberProfileDetail. Findings:
six members' default Instagram links already matched the screenshot
(@rkive, @jin, @agustd, @uarmyhope, @j.m, @thv), but Jung Kook had NO
Instagram entry at all (Spotify/TikTok/Weverse only). Fixes: Jung
Kook got an explicit social block with Instagram @mnijungkook first,
and btsData now carries instagramUrl/spotifyUrl/weverseUrl for all
seven members (plus tiktokUrl for Jung Kook) with exactly the real
values, so the data itself is correct too.

Solo Performance Spotlight (member.videoIds): the seeded pairs were
stale — spot-checks against YouTube's oEmbed showed most old IDs no
longer resolve. All fourteen slots were replaced with each member's
newest solo releases, every ID verified via YouTube oEmbed returning
the exact official title (HYBE LABELS / BANGTANTV):
RM: LOST! (kq6UVL3H6SI), Come back to me (NrfikKxF4Ps)
Jin: Don't Say You Love Me (o7BcyAd6rqg), Running Wild (uoHol5Dr_go)
SUGA: Haegeum (iy9qZR_OGa0), AMYGDALA (IX1dkYoLHVs)
j-hope: Killin' It Girl (q9leDzlNEaY), MONA LISA (ECqGCH1TfLY)
Jimin: Who (Av9DvtlJ9_M), Smeraldo Garden Marching Band (LIER2z3DBe8)
V: Winter Ahead (HAWYOuMGkK0), FRI(END)S (62peQdQv4uo)
Jung Kook: Standing Next to You (UNo0TG9LwwI), Never Let Go lyric
video (J_n4Ysi5iUM)
All 14 IDs are unique — no duplicates anywhere. The serve-time
migration gained MEMBER_VIDEO_MIGRATION with the same exact-match
guard (replaces only a member's untouched seeded pair), so the live
site's stored members get the new spotlight too.
Build verified; handles and IDs confirmed in the built bundles.

## Batch 18 — Weverse Profile cards on member pages (2026-11-05)

The owner sent one pin.it link per member ("Weverse profile pic add
koro and cover o"). Each pin resolved to a black-and-white portrait
of the correct member (all 7 visually verified). There was no
Weverse-profile UI on the member pages, so a new "Weverse Profile"
card section was built into MemberProfileDetail, placed before
Aesthetic Moments:
- Cover band: the member's own supplied cover banner (bannerUrl).
- Round profile picture: the new owner-supplied photo, self-hosted
  at public/images/members/weverse/<id>.jpg (PIL q88), stored on the
  member as the new optional field weversePicUrl.
- Mint "Weverse" badge, member name + emoji, "BTS · Artist on
  Weverse" caption, and an "Open on Weverse" button linking to the
  member's real Weverse artist page (member.weverseUrl, with the
  standard artist-slug fallback; j-hope's slug is j_hope).
The serve-time migration fills weversePicUrl from
MEMBER_WEVERSE_PIC_DEFAULTS whenever a stored member lacks it, so
the card appears on the live site without an admin re-publish; the
component also has the same fallback map. Build verified; all 7
photos ship in dist/images/members/weverse/.

## Batch 19 — Weverse post quick-add system (2026-11-05)

The owner asked whether new Weverse posts could auto-publish to the
site. They cannot: Weverse has no public API, embed, or feed, and
login-based scraping would break its terms and break constantly —
explained to the owner, who chose the manual quick-add instead.

Built:
- New config field `weverseFeed` (defaultWebsiteConfig, starts EMPTY
  — no invented sample posts) carried by the normal draft → publish
  flow.
- New admin component src/components/WeverseFeedQuickAdd.tsx,
  rendered at the top of Admin Panel → Weverse Posts CMS: member
  dropdown (7 + BTS Group), post date (defaults today), post text
  (paste), optional photo URL, optional original Weverse post link,
  one "Add Post" button, and a list of added posts with Delete. The
  pre-existing fixed-slot Weverse editor below it is untouched.
- Public display: MemberProfileDetail gained an optional weverseFeed
  prop (App passes publishedConfig.weverseFeed). Under the Weverse
  Profile card, a "Latest Weverse Posts" section shows that member's
  posts newest-first — Weverse pic avatar, name, formatted date,
  text, optional photo, and "View original on Weverse ↗" — with an
  honest caption that posts are shared by the site owner from
  Weverse. The section renders nothing until the owner adds a post
  for that member.
Build verified; form string confirmed in the admin bundle and the
feed heading in the member-profile chunk.

## Batch 20 — ARIRANG tour countdown: Asia & Australia aligned, upcoming-first (2026-11-05)

The owner sent a screenshot of the LIVE site's Tour Countdown stuck
on Brussels (July 2026) with the timer at 00, and supplied the
remaining ARIRANG World Tour stops after 2026-11-05, asking for them
in the Tour Countdown with the same design, the countdown working as
before, upcoming stops first, and OT7 cover photos on the cards.

Findings: TourCountdownCarousel's built-in CONCERT_DATES already
contained all nine Asia & Australia stops, but three entries
differed from the owner's list and the carousel always opened on the
first (long-finished) card. Fixes, all in TourCountdownCarousel.tsx:
- Data aligned exactly to the owner's 2026-11-05 list: Kuala Lumpur
  venue -> Bukit Jalil National Stadium; Melbourne -> Feb 12 & 13,
  2027 (target 2027-02-12, the extra Feb 10 date removed); Hong Kong
  venue -> Kai Tak Sports Park; Manila -> city Manila, venue
  Philippine Arena (was Bulacan / Philippine Sports Stadium);
  Jakarta venue -> GBK Stadium. Kaohsiung (Nov 19/21/22, 2026),
  Bangkok (Dec 3/5/6), Singapore (Dec 17/19/20/22), Sydney
  (Feb 20/21, 2027) and Hong Kong dates already matched.
- Upcoming-first: the filtered list is now sorted by target date,
  and on mount / region switch the carousel opens on the first stop
  still in the future — so the countdown (unchanged mechanism) counts
  to the next real concert (Kaohsiung, 19 Nov 2026) instead of
  sitting at 00 on a finished stop. Past stops remain reachable via
  the arrows; region tabs work as before.
- Card covers: all 20 cards previously repeated one White House
  photo; they now rotate through 7 real OT7 group photos (Wikimedia
  Commons: White House press conference, Wembley 2019 concert, Rose
  Bowl 2019, MelOn Awards 2018, first Daesang 2016, Wings Tour
  Anaheim with ARMY, ARMY at Wembley).
Note: if the owner previously saved custom events in Admin Panel ->
Tour Countdown, those config events override these built-in defaults
in the carousel; clearing them restores this list.
Build verified; new venue names confirmed in the built bundle.

## Batch 20 (addendum) — unique cover per tour card + admin merge (2026-11-05)

The owner clarified two things: (1) the supplied schedule AND
whatever they add themselves in the Admin Panel must BOTH stay;
(2) every tour card should have its own different cover — the
7-photo rotation still repeated.

- Covers: the carousel now assigns ONE UNIQUE real OT7 photo to
  each of the 20 cards (no repeats). Pool: 9 group/concert photos
  already verified in this project plus 11 more Wikimedia Commons
  BTS concert photos (Love Yourself LA/Nagoya/Hong Kong, Speak
  Yourself Rose Bowl/MetLife, Wings Tour Anaheim), each checked
  live (HTTP 200) before use.
- Merge: TourCountdownCarousel previously used the admin-saved
  config events INSTEAD of the built-in list whenever any existed.
  It now merges — admin events first, built-ins fill in by id; an
  admin event with a built-in's id overrides that stop (the edit
  path), and untouched built-ins always remain.
Build verified.

## Batch 21 — Latest Updates block only when 2+ news (2026-11-05)

Owner rule for the Home hero grid's "Latest Updates" block: show it
only when there are 2+ published news articles; with a single
article it must disappear completely (previously it stayed visible
with a "No additional articles published." empty state).

App.tsx hero grid: the Latest Updates block now renders only when
latestNewsList (published news beyond the featured article) is
non-empty, and the featured card expands to full width
(lg:col-span-3) when the block is hidden so no empty gap remains.
The moment a 2nd article is published the block returns on its own.
One shared code path covers mobile and desktop. Build verified.

## Batch 22 — Fake-content cleanup (owner-approved audit fixes) (2026-11-05)

A full image/content audit found no AI-image services and no stock
hotlinks left (the one "unsplash" hit is a filter check in code).
The owner approved removing the remaining template-era fakes:

- InteractiveMediaWall (Home): the built-in default Weverse posts
  with INVENTED member quotes are deleted. The wall now shows only
  owner-published posts, skips slots with empty text, and hides
  entirely when nothing real exists.
- AdminPanel Weverse defaults (incl. Reset to Defaults): post texts
  blanked; profile/post images now point at each member's own
  self-hosted Weverse pic and cover banner (group slot uses the
  site cover), so a reset can never restore invented quotes.
- FAN_ARTS seeds (btsData): the six fake fan arts (one group photo
  under invented titles, invented artist names, fake like counts)
  removed; the array starts empty — real fan art comes from
  submissions/admin.
- Admin media seeds m-seed-1..3 renamed honestly ("BTS Group Photo
  — White House 2022").
- AudioPlayerContext: the unused SoundHelix demo-song list (dead
  code) deleted; the admin new-track default audio URL is now empty
  instead of a SoundHelix demo, and the field's example placeholder
  no longer names SoundHelix.
Note: if the owner's live Firestore already holds the old invented
Weverse slot texts from an earlier publish, those remain until the
owner clears the slot texts in Admin Panel -> Weverse Posts CMS and
publishes again (the slots now show the members' real photos).
Build verified; greps confirm no SoundHelix or invented-quote text
remains in src.

## Batch 23 — Stock/AI image certification + full sitemap (2026-11-05)

The owner asked to remove every "splash" (Unsplash/stock) and
AI-related image, change nothing else, keep everything smooth, and
help the site show on Google BTS searches.

- Full-project scan (src, public, scripts, HTML, configs AND the
  built dist): ZERO Unsplash/Pexels/Pixabay/Pinterest-hotlink/
  placeholder/AI-image references. The batch-4 replacement had
  already removed them all; today re-certified end to end. What the
  owner still sees on the live site and in Google is the OLD
  pre-fix deploy plus Google's cache — both clear only after the
  new zip is pushed and Google re-crawls.
- No site code, layout, or feature was changed in this batch.
- Google help (build-script only): generate-spa-routes.ts now
  writes a complete dist/sitemap.xml on every build — 16 main pages
  + every news article + every gallery photo page (36 URLs today),
  replacing the homepage-only static sitemap. robots.txt already
  allows Googlebot and points at the sitemap. Ranking itself is
  Google's decision over days; the technical setup is now correct.
Build verified; dist scan clean; sitemap URL count confirmed.

## Batch 24 — Admin Panel: mandatory password login (2026-11-05)

The owner noticed /admin opened with no password. Audit found the
template's auth was cosmetic: isLoggedIn started true, the panel
auto-invented a 'bts_authorized_admin_session' token, handleLogin
had hardcoded fallback credentials (admin / admin@festa.bts with
passwords 'army7seven' / 'army-7777-seven' OR ANY password of 6+
characters), the controller counted any non-empty token string as
authenticated, and the admin-path gate only logged a warning and
proceeded anyway.

Fix (owner-approved):
- AdminPanel starts logged out. Boot validates a stored token via
  POST /api/admin/session/check against the session registry in the
  config/admin doc; anything else shows the login screen. The
  Firebase listener no longer forces a login state.
- handleLogin now has ONE path: /api/admin/login, which bcrypt-
  compares email + password against config/admin. On success the
  handler issues an 'admin_session_' token and registers it in the
  admin doc's sessions list (max 10). All backdoors deleted,
  including the 'army7seven' prefill in the account-update form.
  Login field relabelled "Admin Email".
- Controller: isAuthenticated = Firebase Auth user OR a registered
  session token (30s-cached registry read; public visitors never
  trigger it). Admin paths now hard-refuse when unauthenticated
  (auth endpoints whitelisted: login, session check/logout,
  forgot-password). Login handler treats a missing stage as stage 1
  so the Live page broadcaster login (which already expected a
  returned token) works with the new system.
- Logout deregisters the token in Firestore, then clears local
  state and signs out of Firebase.
Owner's login: the seeded admin email (tgarirangarmy7@gmail.com)
and the password stored in the live admin doc — still the template
default if never changed; owner advised to change password + backup
code after first sign-in via the panel's security settings.
Residual limit (unchanged architecture): the app runs client-side,
so the deepest enforcement is the project's Firestore security
rules in the owner's Firebase console, outside this codebase.
Build verified; 'bts_authorized_admin_session' no longer appears
anywhere in the built bundles.

## Batch 24 (addendum) — No password anywhere in the code (2026-11-05)

The owner required that their password never be saved in the site's
code. The template had the default password in plaintext as the
admin-seed value (bcrypt.hashSync('army7seven')) in two seed blocks,
the default backup code 'ARMY-7777-SEVEN' in the same seeds, in a
security-settings fallback response, and as an AdminPanel state
default. All removed:
- Seed admin passwords are now bcrypt hashes of a random one-time
  secret generated at seed time and never printed or stored — the
  code contains no usable password. (Seeding never touches the live
  admin doc; the owner's real password exists only as a bcrypt hash
  in Firestore.)
- Seed/fallback/panel backup codes are now empty; the owner sets
  their own in the panel's security settings.
Verified: 'army7seven' and 'ARMY-7777-SEVEN' no longer appear
anywhere in src or in the built dist bundles. (The unrelated
'BTS-ARMY-7777' string in GeneratePicStudio is a decorative fan
membership ID on generated pics, not a credential — left as is.)
Build verified.

## Batch 25 — Permanent "Welcome to Bangtan Gallery" intro news (2026-11-05)

The owner asked for a permanent News article introducing the site.
- Cover: the owner's pin.it photo (OT7 dark-suit editorial with the
  ARIRANG mark), downloaded and self-hosted at
  public/images/news/bangtan-gallery-intro-cover.jpg (PIL q88).
- Article (id/slug 'welcome-to-bangtan-gallery', Announcement,
  Nov 5 2026) prepended to NEWS_ARTICLES in btsData: a full tour of
  the site (members, music, concert replays, gallery, live + tour
  countdown, voting center, news), the community links the owner
  specified — Telegram channel "Bangtan Gallery"
  (https://t.me/arirang_army7), group "Bangtan Gallery Fan Chat"
  (https://t.me/arirang_army7chat), X @arirang_army_7 — both as
  in-text link chips and a links[] resource box, and the fan-made /
  not-affiliated disclaimer.
- Inline photos: NewsSection's article renderer now treats a
  paragraph that is only ![img](url) as a full-width in-body photo
  (new convention, no existing article affected). The article uses
  three verified OT7 Commons photos inline (Wembley 2019, Rose Bowl
  2019, MelOn 2018) plus a 3-photo gallery (White House group photo,
  Wings Anaheim with ARMY, Fire São Paulo).
- Permanence: besides the seed, the controller's ensureIntroArticle
  (inside migrateMemberPhotos, so it covers published + draft
  returns) prepends the article at serve time whenever a stored
  config's news lacks it — it cannot vanish with config edits.
- The build pre-renders /news/welcome-to-bangtan-gallery with the
  cover as its share image, and the sitemap includes it.
Build verified.

## Batch 25 (addendum) — Intro article stays owner-controlled (2026-11-05)

The owner asked: can I also cancel it and move it top/bottom? The
News CMS already has ▲/▼ reorder, Edit, Delete and a published
on/off switch for every article. The serve-time ensureIntroArticle
would have resurrected a deliberately deleted copy, so it now
respects a tombstone: draft saves and publishes record
introArticleRemoved = (article absent from the saved news list),
and ensureIntroArticle never injects when that flag is set.
"Permanent" now means: it cannot vanish by accident, but the owner
can hide, reorder, edit or delete it like any other article.
Build verified.

## Batch 26 — Events auto-sort by date + Contact email delivery (2026-11-05)

Events (owner screenshot: June/July 2026 events sitting under
"Upcoming Events"): the Events tabs filtered by the stored `type`
label only. EventsSection now classifies by real date
(countdownTarget / dDayTarget / date): past-dated events move
themselves to Past Milestones, future ones are Upcoming regardless
of the stored label; the type badge and countdown chip use the same
computed value; Upcoming sorts soonest-first, Past most-recent-
first. New events with future dates are Upcoming automatically.

Contact (owner request: submissions should also move by email):
each successful submission now also fires a background FormSubmit
AJAX call — a copy of the message is emailed to the owner's inbox
(tgarirangarmy7@gmail.com, the site admin email; one-line constant
CONTACT_NOTIFY_EMAIL in ContactSection.tsx) and the visitor gets an
automatic thank-you reply at the address they submitted
(_autoresponse). The Firestore save to the Admin Support Inbox is
unchanged and happens first; the email is best-effort and never
blocks the form. ONE-TIME SETUP: FormSubmit emails an activation
confirmation to that inbox on the first submission — the owner
clicks it once. Note the address appears in the page's request code
(as with any static-site form service); a different inbox can be
substituted in the same constant.
Build verified; FormSubmit endpoint confirmed in the built chunk.

## Batch 27 — Site social links fixed everywhere (2026-11-05)

The owner supplied the site's official socials and asked for every
icon/link on the site to match. Audit of all surfaces (header
drawer, footer rows, Contact page, floating Ko-fi button, defaults,
Admin Links tab):
- Telegram channel https://t.me/arirang_army7, community
  https://t.me/arirang_army7chat, X https://x.com/arirang_army_7 and
  Ko-fi https://ko-fi.com/bangtangallery were already correct
  everywhere.
- Instagram was wrong: the site's social row pointed at the BTS
  official account (instagram.com/bts.bighitofficial). Now the
  site's own @arirang_army_7 everywhere: defaultSocialLinks, all
  four App.tsx fallback rows, the Admin Links tab fallback, and a
  serve-time correction in migrateMemberPhotos that swaps the exact
  old value in already-stored configs (admin-chosen values are
  never overridden).
- defaultSocialLinks also carried the template author's personal
  Pinterest/GitHub/LinkedIn (hey_shaif / shaifsiam) — blanked.
- YouTube and Facebook: no owner pages were supplied, so the icons
  keep pointing at the real official destinations already in place
  (YouTube: BANGTANTV; Facebook: bangtan.official) rather than
  inventing URLs; owner can supply their own pages anytime.
Member-profile socials (the members' real accounts) untouched.
Build verified; new Instagram URL confirmed in the built bundles.

## Batch 28 — ARMY Bomb background player (2026-11-05)

Owner feature from their voice note: they supplied a "Body to Body"
(ARIRANG part, slowed) BTS edit MP3 (~54 s, 1.8 MB) and asked for an
ARMY Bomb on the site — tap the bomb and the song plays in the
background; tap again to stop; while it plays the bomb should light
up uniquely.
- Audio self-hosted at public/audio/army-bomb-body-to-body.mp3.
- New src/components/ArmyBombPlayer.tsx, mounted in App next to the
  Ko-fi FAB: a floating lightstick at bottom-left (orb + stick,
  "ARMY BOMB" label). Idle the orb is dim; while playing it gets the
  .bomb-on treatment (bombGlow + bombShimmer keyframes in index.css:
  pulsing purple→pink concert glow), two expanding light rings, an
  ambient aura, and the label switches to "♪ BODY TO BODY". The
  song loops until tapped off.
- No fighting with the main player: starting the bomb pauses the
  AudioPlayerContext player; starting a track stops the bomb
  (useEffect on isPlaying). When the mini player bar is open the
  bomb floats higher (bottom-32) so they never overlap. The Ko-fi
  button stays bottom-right untouched.
Build verified; MP3 and CSS confirmed in dist.

## Batch 28 addendum — Real ARMY Bomb photos (2026-11-05)

The owner replaced the drawn bomb with their own real product
photos: plain bomb = OFF, lit purple bomb = ON, both the SAME size,
as PNG, and NO text label underneath (the "ARMY BOMB / ♪ BODY TO
BODY" chip is removed — just bomb on/off + sound on/off).
Backgrounds were removed with rembg (u2net session; the isnet
default model OOM-killed the box, and the venv had to live outside
the 512 MB /tmp) and both cut-outs were normalized onto an
identical 260x560 transparent canvas:
public/images/army-bomb-off.png (69 KB) and army-bomb-on.png
(128 KB), visually verified clean. ArmyBombPlayer now swaps the
photo on toggle; while ON the photo gets .bomb-img-on (animated
drop-shadow silhouette glow following the PNG alpha) plus the
aura and expanding rings over the orb. Audio/toggle/player-yield
behavior unchanged.

## Batch 29 — Purple Love + Fireworks floating buttons removed (2026-11-05)

The owner screenshotted the two draggable floating emoji buttons
at the right edge (💜 "Purple Love" — floating hearts overlay;
🎆 "Fireworks" — fireworks canvas overlay) and asked what they
were for and whether to remove them, code and all. Recommendation
given and accepted: remove — they were template gimmicks adding
mobile clutter and a permanent canvas animation cost. Removed
completely: both DraggableButton usages in App.tsx, the
isPurpleLove/isFireworks states and toggles, the PurpleLoveOverlay
render, and the two component files (DraggableButton.tsx,
PurpleLoveOverlay.tsx) — grep-clean, build verified. Unrelated
features untouched: the FESTA section's own fireworks scene and
the Aurora ambient background stay. Old zips still contain the
code if it is ever wanted back.

## Batch 30 — Permanent per-visit disclaimer + small Concert ad (2026-11-05)

Disclaimer (owner rule): the Admin Panel disclaimer (text, title,
duration, position — stored in the published config, so the SETTING
is permanent in Firebase) must show on every entry and dismiss
itself. The popup already auto-dismissed after the admin-set
duration with a progress bar; the gap was a sessionStorage gate
that showed it only once per browser session. Removed: the trigger
effect now fires once per page load via a ref (publishedConfig can
refresh identity mid-session without re-popping), and the close
handler no longer writes the 'bts_disclaimer_shown' flag. Result:
every fresh visit shows the admin's disclaimer; it auto-closes
after the configured seconds (default 6) or on ✕; in-app tab
switches do not re-pop it. The admin Preview trigger is unchanged.

Concert page ad (owner request: one SMALL ad at the bottom, from
the site's existing ad codes, not a big one): RecentConcertReplay's
full-page render now ends with a centered <AdsterraAd type={7} />
— the compact 320x50 banner — imported from the existing component.
The linkMode render used on the Videos page is untouched, so the
ad appears on the Concert page only.
Build verified; the session gate string is gone from the bundle.

## Batch 31 — Quotes CMS: Home quotes editable from Admin (2026-11-05)

Owner request: the Quote section ("Golden Quotes & Lyrics" carousel
on Home) must be editable from the Admin Panel. It was hardcoded
QUOTES_DATA in BTSQuotesCarousel.
- Config: DEFAULT_HOME_QUOTES (the same 7 built-in quotes, copied
  verbatim) added in firebaseController and seeded as
  defaultWebsiteConfig.homeQuotes; migrateMemberPhotos fills
  homeQuotes at serve time for stored configs that predate the
  field (admin-saved arrays are never overridden).
- Public: BTSQuotesCarousel takes an items prop; App passes
  publishedConfig.homeQuotes. Built-ins remain the fallback; an
  explicitly emptied list hides the section.
- Admin: new sidebar tab "💬 Quotes CMS" (after FAQs CMS) mirroring
  the FAQ editor — per-quote text, author, emoji, type
  (Quote/Lyric), source/song, card color (9 presets from the
  existing cards), ▲/▼ reorder via moveDraftArrayItem, Add, and
  FAQ-style delete that publishes instantly; other edits go through
  the normal draft → Publish flow. homeQuotes (and weverseFeed)
  added to sanitizeConfig's array keys. The data field avatarUrl is
  carried but intentionally has no editor — the carousel never
  renders it.
Build verified; tab and field confirmed in the built bundles.

## Batch 32 — Generate Pic: AUTO DESIGN mode (2026-11-05)

Owner ask: keep the big poster, but make it AI-like — "pic dile auto
pic design hobe": give a photo, the design happens by itself.
Added a full-width "🤖 AUTO DESIGN — Pic Dilei Boro Poster Ready"
button at the top of Generate Pic Studio. Flow: with no photo it
opens the normal upload; the moment the upload lands (or if a photo
is already there) runAutoDesign samples the photo's average color
(48x48 canvas, HSL), then sets the studio's own states — designType
'BTS Poster', theme matched to the photo (gold/amber → Golden
Luxury + Golden Glow + Golden Glitter; red → ARIRANG Tour; violet/
magenta → Purple Galaxy + Borahae Purple; blue/teal dark →
Cyberpunk Neon, light → Dreamy Lilac; near-gray → B&W Editorial;
yellow → FESTA), an Arch crop frame, and reset zoom/pan/rotation.
The existing renderArtwork effect then draws the poster and the
normal Download flow applies. Manual controls all remain for
fine-tuning afterwards. Honest scope, as told to the owner: this is
automatic design of the visitor's OWN photo (colors/layout chosen
by the system) — not an AI image generator; no faces are created
or altered, per the site's no-AI-faces rule.
Build verified; button confirmed in the built chunk.

## Batch 33 — Comeback Poster + Birthday Cake studios (2026-11-05)

The owner sent two b-cd.app tools (a comeback-poster maker and a
decorate-a-cake tool) and asked for the same kind of simple
auto-design on their site. Both pages were inspected live
(read-only); the same EXPERIENCE was then built with this site's
own original code and artwork — none of their templates, album
art, texts or sticker art were copied.
Generate Pic Studio gains two tabs (union type extended):
- "🎉 4. Comeback Poster" (ComebackPosterStudio.tsx): sizes Poster
  1200x630 / Header 1500x500 / Square 1080x1080; four original
  style templates (Clean White, Borahae Night, ARIRANG Red, Golden
  Stage); icon / text / background color pickers with hex fields;
  editable big text + small line; optional background photo upload;
  three original geometric glyphs above the wordmark; a brush +
  eraser drawing tool that draws on a separate layer (the eraser
  removes paint, never the poster — fixed after a first pass that
  punched destination-out holes, glyph 1 also redesigned as a ring
  for the same reason); Undo/Clear; Generate & Download PNG; Reset.
- "🎂 5. Birthday Cake" (BirthdayCakeStudio.tsx): a procedurally
  drawn 2D cake on a 960x960 canvas with step tabs Cake / Decorate
  / Message / Share — Round/Square/Heart shapes; drip icing,
  frosting swirls and bead-border toggles; preset + custom colors
  for cake, icing, piping, plate and background; 0–7 candles with
  color choice and flames; 16 emoji stickers (incl. the member bias
  emojis) that are added by tap and dragged on the canvas, with
  per-sticker size and remove; a two-line message (30 chars each)
  with quick original birthday wishes, size/font/color/position;
  Download PNG, Copy Image, Share on X/Facebook.
Build verified; tab headings confirmed in the built chunk.

## Batch 34 — Ready-made poster design removed from Generate Pic (owner request, 2026-11-05)

- The owner screenshotted the Generate Pic Studio's default poster (purple
  BTS door/shield logo, "BTS", "TEAM <bias>", fan-ID texts — rendered even
  with NO photo uploaded) and ordered it removed: "ei Design ta bad jabe".
- `renderArtwork()` now returns early when no photo is uploaded and clears
  any previous artwork: no photo → no poster. The no-photo branch and the
  entire `drawShieldLogo()` function were deleted from
  `GeneratePicStudio.tsx` (grep: 0 occurrences left).
- The preview's empty state is now an upload prompt ("Upload a photo — your
  design is made from it") with an Upload Photo button; pressing
  GENERATE DESIGN with no photo opens the photo picker and arms the
  Batch 32 auto-design flow, so picking a photo designs it automatically.
  With a photo, everything works as before (auto design + manual themes,
  filters, overlays, typography, downloads). Presets/inspirations still set
  their styles and now apply as soon as a photo is uploaded.
- Comeback Poster and Birthday Cake tabs untouched. Ads code untouched —
  the owner repeated the standing rule this day: never touch the ads code
  (AdsterraAd component and all ad slots remain exactly as they were).
Build verified; new prompt strings confirmed in the built
GeneratePicStudio chunk; dist served HTTP 200.

## Batch 35 — New studios wear the site's own colors by default (owner check, 2026-11-05)

- The owner asked whether the two Batch 33 studios (Comeback Poster,
  Birthday Cake) had been made with b-cd.app's design/colors, and restated
  the rule: only the design idea/flow may be borrowed — everything visible
  must wear Bangtan Gallery's own colors (dark black + purple/pink).
- Verified in code: both studios were already built with original code,
  original templates/art/text (nothing of b-cd's copied) and dark
  site-styled UI chrome. Two defaults, however, opened in a light look:
  the poster studio defaulted to its 'Clean White' template, and the cake
  studio defaulted to pastel cake/icing/light-lavender background.
- Fixes (defaults only — every color remains freely changeable):
  Comeback Poster: 'Borahae Night' (bg #1b0533 → #070110, icon #c084fc,
  text #f5d0fe) is now the first/default template and the initial state;
  Reset returns to it. Birthday Cake: defaults are now cake #8b5cf6,
  icing #f472b6, piping #f5d0fe, plate #3b1470, background #1b0533,
  message #f9a8d4; background swatches reordered dark-first.
Build verified; new defaults confirmed in the built chunk.

## Batch 36 — Full website check & error fix pass (owner request, 2026-11-05)

Owner asked for a full check of the whole site, all errors/mistakes fixed,
and a fresh zip stored permanently. Results:

- TYPE CHECK NOW PASSES CLEAN (`npm run lint` = `tsc --noEmit`: 0 errors).
  Root cause found: the template shipped WITHOUT @types/react /
  @types/react-dom, so TypeScript never really checked the project. Both
  added as devDependencies (React 19 types). The real types surfaced
  46 latent errors; all fixed:
  - REAL BUG: AdminPanel and VotingCenterSection import lucide's `Image`
    icon, which shadowed the DOM Image constructor — `new Image()` in
    the admin image-compress helpers and in the vote-screenshot reader
    (readScreenshot) was constructing the icon, not an image, so those
    uploads would hang/throw. All three sites now use `new window.Image()`.
  - REAL BUG: the vote modal read `coverImageUrl` / `platformName`,
    fields no data source writes — the event cover and platform never
    showed. Now reads `coverUrl` / `platform`, and 'published' displays
    as 'Active'.
  - REAL GAP: Admin dashboard 'Digital Downloads' read
    stats.totalDownloads, which the stats API never returned. The
    controller now returns totalDownloads from the stats doc's downloads
    counter; LiveStats type + defaults gained the field. Also added
    live_views to the GET-stats fallback objects (visitor counter typing).
  - Type-only fixes (runtime already correct): cmsEditing tab union and
    musicSubTab union widened to the values the code actually uses;
    Track gained isSpotlight/isPinned (shared type + MusicSection local
    type); SectionErrorBoundary uses named Component/ReactNode imports;
    slideVariants annotated as motion Variants; theme toggle annotated;
    a bogus 'anonymity' key removed from DisclaimerPopup's backdrop
    initial state; submission-preview pseudo-album typed as any.
- API CROSS-CHECK: all 68 /api endpoints called by components have a
  handler in firebaseController — no orphan calls.
- ASSETS: all 45 local asset references (/images, /audio) exist in
  public/; og-cover-2.jpg, admin.html and the 37-URL sitemap are in dist.
- CLEANUP: 5 stray intermediate member photos deleted from the project
  root (jin.jpg, jimin.jpg, jk.jpg, v.jpg, jhope_suga.jpg — working files
  from the Batch 15/16 downloads; the real copies live in
  public/images/members/), and the template's leftover public/image/
  folder (a lone README) removed.
- Ads code untouched, per the owner's standing rule.
Build verified (vite + SSG), dist served locally with HTTP 200s.

## Batch 37 — Five owner-reported fixes from screenshots (2026-11-05)

1. GENERATE PIC PAGE LAYOUT ("emon keno"): the hero banner was a flex row
   whose middle child (the AUTO DESIGN block) carried `w-full`, squeezing
   the title into a narrow column and leaving a huge empty stretch on
   desktop. The row is now flex-wrap on lg, the title block flexes, and
   the AUTO DESIGN block is a fixed 330px column on large screens.
2. NEWS ARTICLE IN WHITE MODE + TOP GAP: in light mode the article card
   flattens to white but the body stayed text-zinc-300 / summary
   text-purple-100 — unreadable. index.css gained `.light` rules scoped
   to a new `news-article-view` marker class on the article container
   (dark body text, dark-purple summary/links, dark title). The body was
   also lifted: card padding/space tightened (md:p-6, space-y-4) and the
   featured image is aspect-[21/9] on md+ instead of 16/9.
3. VOTE PROOF SWITCH FLIPPING BACK ON: the admin switch only edited the
   local draft, so any panel config reload before Publish silently
   restored ON. The switch now applies instantly via a dedicated
   toggleVoteProof handler: one tap saves the draft AND publishes, and
   on any failure it reverts and toasts the error — the switch can no
   longer display a state that was not saved. OFF now reliably hides the
   public proof board and switches voting to plain mode; ON restores it.
4. VIDEOS PAGE BUTTON + GAP: RecentConcertReplay's linkMode block sat at
   the very top of the Videos page with mt-12 + pt-10 of empty space and
   a full-width py-4 button. The gap is now mt-1/pt-1 and the button is
   compact (py-2.5, text-xs/sm:text-sm, smaller icons) and centered with
   auto width on sm+ screens.
5. ARMY BOMB (owner circled it in a footer screenshot): snug into the
   bottom-left corner (left-2/md:left-4, bottom-4/md:bottom-6) at a
   smaller size (h-24/md:h-28, was h-28/md:h-36); the lift above the
   mini player (bottom-32) is unchanged.
Ads code untouched. Build + tsc verified clean (0 errors).

## Batch 38 — Social links repair, Weverse wall profiles, live player hardening (2026-11-06)

Owner reports (screenshots): (1) Admin Links tab showed the Telegram
channel URL in EVERY social field; (2) the Home "Latest Weverse Posts"
wall was an empty black shell; (3) the Live Stream player stayed black
on the main site although the admin preview worked.

Verified against the LIVE Firestore data before fixing (read-only):
- config/published + config/draft socialLinks really do store
  https://t.me/arirang_army7 in every slot (telegram, twitter, youtube,
  instagram, facebook, weverse, email, linkedin) — an old admin save
  poisoned the data; the current admin inputs are bound correctly.
- config/liveStream holds the owner's youtu.be link with isLive=true,
  and the video (CazéTV interview) allows embedding (oEmbed 200); the
  generated embed iframe src is correct.
- weverseFeed is empty (0 posts) in both configs, and the Home wall was
  fed from the legacy weversePosts slots — so quick-add posts could
  never appear on the wall at all.

Fixes:
1. SOCIAL LINKS: serve-time repair inside migrateMemberPhotos — when a
   non-Telegram social slot holds exactly the Telegram channel URL, it
   is swapped back to that network's canonical defaultSocialLinks value
   (X, Instagram, YouTube/BANGTANTV, Facebook, Weverse, email; linkedin/
   pinterest/github blank). Admin-chosen different values are never
   touched; the Telegram slots keep the channel link.
2. WEVERSE WALL: App now passes publishedConfig.weverseFeed + members.
   The wall merges quick-add feed posts (mapped to its card shape,
   newest first, cover = post photo or the member's own banner) ahead
   of any filled legacy slots, and dates render readably. While there
   are no posts, the wall shows the 7 members' Weverse PROFILE cards —
   cover = the member's own banner, round Weverse portrait, mint
   badge — and tapping one opens a profile modal (cover, portrait,
   Open on Weverse, View Member Profile). The header subtitle no longer
   claims an automatic real-time feed.
3. LIVE PLAYER: URL-based stream sources now render as a real React
   <iframe> (new resolveEmbedSrc helper in streamEmbed.ts) instead of
   dangerouslySetInnerHTML markup, in both the main player and the
   playerOnly embed view; raw script/custom embeds keep the HTML path.
   A "▶ Watch on YouTube" shortcut overlays the player for YouTube
   sources so visitors always have a working path if a browser or
   blocker refuses the embedded player. Also fixed the LIVE badge:
   bg-red-650 does not exist in Tailwind (badge rendered with no
   background) — now bg-red-600 everywhere in the section.
Ads code untouched. Build + tsc verified clean (0 errors).

## Batch 39 — Member cover/aesthetic/spotlight really set + Videos page seed purge (2026-11-06)

Owner: "members section er moddhe profile cover, aesthetic moment and
spotlight add korte bolci — ogla admin panel e set koro" and, with a
Videos page screenshot, "video page e eigla huth kore show kore abr
jai, egla remove maro — amr dewa chara ashbe na".

Root cause found by reading the LIVE Firestore data: the live
database was seeded by the ORIGINAL template, whose member photos are
Pinterest hotlinks (i.pinimg.com). Every serve-time migration guard
was keyed to the fixed code's Wikimedia seed URLs, so on the real
data the banner and gallery guards NEVER fired — the site and the
Admin Panel were still serving the template's pinimg banner (same
group photo for everyone) and a [group photo × 2] gallery, while the
Admin Panel member editor showed those junk values. (videoIds had
already migrated because their seed guard matched.)

Fixes (all in migrateMemberPhotos, which runs on published AND draft
reads, so the Admin Panel editors now show the real values and the
owner's next Publish stores them permanently):
- Any i.pinimg.com portrait → the member's owner-supplied local
  portrait (new MEMBER_PHOTO_MIGRATION_BY_ID).
- Any i.pinimg.com banner → the member's own local cover
  (MEMBER_BANNER_MIGRATION: /images/members/covers/<member>.jpg).
- A gallery whose entries are all pinimg / the old group photo →
  the member's Aesthetic Moments set (MEMBER_GALLERY_MIGRATION).
- Admin-set values never contain pinimg and are never touched.
- Admin Panel member editor: the banner field is now labeled
  "Profile Cover Banner URL" (the gallery editor is "📸 Aesthetic
  Moments / Member Gallery" and the videos editor "🎥 Member Video
  Spotlight & Solo Videos" — all three live in Members CMS → select a
  member).
Verified end-to-end by running the app's own GET /api/config/
published + draft handlers against the live backend: all 7 members
serve local portraits, covers and aesthetic sets (RM 2, Jin 1, SUGA 2,
j-hope 3, Jimin 2, V 2, Jung Kook 4) and the Batch-17 spotlight IDs.

Videos page seed purge (owner: only owner-added videos may show):
- The screenshot's phantom videos (incl. the "LOS ANGELES REPLAY"
  spotlight hero) come from an OLD build — that title does not exist
  in the current source, the code defaults (btsData VIDEOS,
  defaultWebsiteConfig) are already empty, and the live configs hold
  0 videos. Two real leak paths in current code were closed anyway:
  (1) YouTubeClone only applied a fetched list when it was non-empty,
  so a stale/seed list once loaded never cleared and flickered
  against the real library — it now always applies the fetched list;
  (2) migrateMemberPhotos now strips the template's legacy sample
  videos (ids vid1–vid6, YouTube id gdZLi9oWNZg) from any stored
  config at serve time and clears a featuredVideoId pointing at one.
  Public submissions still merge approved-only, as before.
Ads code untouched. Build + tsc verified clean (0 errors).

## Batch 40 — "Welcome To X World" text covers removed from profiles (2026-11-06)

Owner order: "'Welcome To Rm Worlds' erokom kono text kono member er
profile e thakbe na" — no text banners in profiles. (The text is
baked into the Batch-15 banner images themselves, which the owner had
supplied as covers; the owner has now retired them as covers.)

- Profile cover (bannerUrl) for every member is now the member's own
  text-free portrait photo (the owner-supplied dark-suit set):
  MEMBER_BANNER_MIGRATION values changed from
  /images/members/covers/<member>.jpg to /images/members/<portrait>.jpg,
  and btsData's bannerUrl defaults changed the same way.
- Stored configs that already hold a /images/members/covers/* path
  (fixed-code seeds or an admin publish) are remapped to the portrait
  at serve time as well, so no provenance can resurrect a text cover.
- The profile hero banner crops around the face zone
  (object-[center_25%]) since the portraits are square.
- The Welcome banner files stay in the project (unused as covers) in
  case the owner ever wants them back; the Weverse card cover and the
  Home wall profile cards follow bannerUrl, so they show the
  portraits too.
Verified via the app's own published read against the live backend:
all 7 members serve their portrait file as banner. Build + tsc clean.

## Batch 41 — "Welcome" covers belong to the Members SECTION cards (2026-11-06)

Owner clarification (00:37 Dhaka): the 7 "Welcome To X World" pics
are cover images for the Members section (localhost:3000/members) —
"ei section er jonno egla, cover image". Combined with the previous
order (no such text in member profiles), the placement is now exact:
- New Member field `cardCoverUrl` (types.ts), defaulted in btsData to
  /images/members/covers/<member>.jpg for all 7, filled at serve time
  by migrateMemberPhotos (MEMBER_CARD_COVER_DEFAULTS) whenever missing
  or a pinimg hotlink; an admin-set value wins.
- The /members grid card was restructured to the classic cover layout:
  the member's cover image as a top band (h-36), the portrait as a
  round avatar overlapping the band's bottom edge, name/full name
  below it; positions, bio and the MBTI/Detailed Bio footer unchanged.
  Tapping the card still opens the profile.
- Profile pages keep the Batch-40 change (banner = text-free
  portrait); the Weverse card cover follows the profile banner.
- Admin Panel member editor gained "Members Section Card Cover URL
  (shows on the /members cards only)" beside the profile banner field.
- All 7 cover files were refreshed from the exact links the owner
  re-sent (the JK/Jimin links this time were new working hashes — the
  old ones had died on Pinterest; images verified identical to the
  Batch-15 set).
Verified via the app's own published read against the live backend:
cardCover = the member's cover file and profileBanner = portrait for
all 7 members. Build + tsc clean.

## Batch 42 — Fake "@hybe_admin (HYBE official)" attribution removed from Gallery (2026-11-06)

Owner order: no "@hybe_admin (HYBE official)"-style text in the
Gallery — HYBE did nothing; this is a fan site. Found in
GallerySection.getUnifiedItems: every built-in gallery photo card
was stamped username 'hybe_admin', displayName 'HYBE official', a
description claiming "Official concept shoot...", and fabricated
share counts (154+/200+).
- Both built-in blocks now carry the site's own fan identity:
  username 'bangtan_gallery', displayName 'Bangtan Gallery',
  description "Fan-shared photo from the <category> collection.",
  sharesCount 0.
- Admin/visitor-uploaded media keeps its real uploader names —
  untouched.
- Verified: 0 occurrences of hybe_admin / "HYBE official" left in
  src or the built bundle, and the live published/draft configs hold
  none either (it existed only in code defaults). Build + tsc clean.

## Batch 43 — Gallery mobile layout cleaned (2026-11-06)

Owner (mobile screenshots): gallery images must sit 2 (or 3) per
row on mobile, the viewer hid much of the photo, and there was a
lot of empty space at the bottom.
- The masonry (columns-1 on mobile, natural image heights, one
  giant card at a time) is now a real grid: grid-cols-2 on mobile,
  md:grid-cols-3, xl:grid-cols-4, tighter gaps (gap-3 sm:gap-5).
- Every card image has a fixed aspect-[4/5] frame — all cards the
  same height, no letterbox voids; card info padding compacted on
  mobile (p-2.5). The viewer still shows the full photo.
- Viewer on mobile: image column h-[62vh] (was 50vh), photo
  max-h-[54vh] with object-contain so the whole picture is visible,
  info/guestbook column h-[38vh], related strip tightened
  (p-3, thumbs h-11). Desktop layout unchanged.
Build + tsc clean; new classes verified in the built chunk.

## Batch 44 — Photo UPLOAD for Weverse quick-add posts (2026-11-06)

Owner: "Weverse post er jonno admin panel theke pic upload dewar
system add koro" — until now the quick-add photo was URL-paste only.
- WeverseFeedQuickAdd gained a "📤 Photo Upload Koro" button beside
  the photo field: pick an image from the device → it is optimized
  in the browser (max 1200px, JPEG q0.75; GIF/SVG/small files sent
  as-is) → uploaded through the SAME admin pipeline as every other
  Admin Panel image field (POST /api/admin/media/upload with the
  admin token) → the returned URL fills the post's imageUrl.
- A thumbnail preview with a "✕ Photo Bad" (remove) button appears
  once a photo is set; added-posts list rows now show the photo
  thumbnail too. URL paste still works as before.
Build + tsc clean; the control is present in the built admin bundle.

## Batch 45 — Site UI language: Bangla removed, everything English (2026-11-06)

Owner order: nothing on the site may be in Bangla ("kono kicu
bangla language hbena") — prompted by the AUTO DESIGN button's
Bangla text in Generate Pic Studio.
- GeneratePicStudio: AUTO DESIGN button is now "🤖 AUTO DESIGN —
  One Photo, Big Poster Ready", its subtitle and the two feedback
  messages (auto-design ready / select-a-photo first) are English.
- WeverseFeedQuickAdd (admin): the whole box — instructions, labels,
  placeholders, upload button and status messages — translated from
  Romanized Bangla to English.
- Full sweep of src for Bangla/Banglish UI strings: nothing else
  remains (remaining matches were English substrings). The owner's
  own chat language is unaffected — this rule is for the website UI.
Build + tsc clean; old strings absent from the built bundle.

## Batch 46 — Upload prompt simplified; b-cd studio tabs confirmed present (2026-11-06)

Owner: (1) asked where the b-cd.app-inspired features were added
("oigla koi add korla, koronai to kicu") — verified in code and in
the built bundle: they are Generate Pic Studio tabs "🎉 4. Comeback
Poster" and "🎂 5. Birthday Cake" (Batch 33), in the tab row below
the studio hero; the owner's screenshot had only shown the hero.
No code change needed — the owner was pointed to the exact tabs.
(2) Owner: the upload area should just say "Click to upload photo"
with no long text — the preview empty state now shows exactly
"Click to upload photo" (long explanation paragraph removed), and
the whole empty-state box is clickable to open the picker.
Build + tsc clean.

## Batch 47 — Studio crash fix + nav, gallery buttons, covers unified, Weverse card removed (2026-11-06)

Six owner items from one screenshot batch:
1. Comeback Poster tab crashed the whole Generate Pic section
   ("couldn't load / TAP TO RETRY"): the studios drew with
   CanvasRenderingContext2D.roundRect(), which does not exist in
   older browsers/WebViews — it throws inside the mount effect and
   the error boundary takes the section down. All 7 call sites
   (ComebackPosterStudio ×2, BirthdayCakeStudio ×3,
   GeneratePicStudio renderer ×2) now use an arcTo-based helper
   (src/utils/roundRectPath.ts); zero .roundRect( calls remain in
   the built bundle.
2. Generate Pic hero/nav: the tab switcher no longer sits squeezed
   as a third hero column. The hero is now a clean stack — title,
   then a full-width tab bar (overflow-x-auto, buttons never wrap),
   then the AUTO DESIGN button full-width directly under the tabs.
3. Gallery viewer: Copy Link + Download are one compact row
   (px-2.5 py-1.5, text-[11px], no wrap); the sidebar header and
   description blocks were compacted (px-4 py-3, description
   max-h-12, comments padding px-4 py-3) so the guestbook is
   visible without the buttons eating the panel.
4. Card cover == profile cover (owner reversed the Batch-40
   split): bannerUrl defaults and MEMBER_BANNER_MIGRATION point
   back at /images/members/covers/*; the Batch-40 covers→portrait
   remap was removed, and a new serve-time rule maps a stored
   portrait-path bannerUrl back to the cover. Verified via the
   app's published read: bannerUrl === cardCoverUrl for all 7.
5. The Weverse Profile card section was removed from
   MemberProfileDetail (owner: it was an unnecessary extra). The
   "Latest Weverse Posts" section stays.
6. Home Weverse wall profile cards: the member's cover is the
   background at reduced opacity (img opacity-70 + bg-black/45
   overlay) and the B&W Weverse profile pic sits on the cover,
   larger (w-10 h-10, mint ring).
Build + tsc clean.

## Batch 48 — Weverse upload stall, News top gap, profile name overlap (2026-11-06)

1. Weverse photo upload stuck on "Uploading…": every image upload
   first attempts Firebase Storage, which stalls in this project
   (the app's admin sign-in is not Firebase Auth, and localhost is
   not a Storage-friendly origin) — the attempt was capped at 60s,
   so uploads effectively never finished. Fixes: the Storage
   attempt for image uploads is now capped at 15s
   (uploadBytesWithTimeout at all 3 image call sites; the video
   path is separate and untouched), the admin handler's embedded
   fallback threshold rose 180K → 400K chars, the quick-add
   compresses to max 1000px / q0.72 so typical photos fit the
   fallback, and the form itself has a 45s hard timeout so the
   button can never spin forever.
2. News section top gap: header block py-10 → pt-1 pb-5, outer
   spacing space-y-8 → space-y-5, filter bar pb-6 → pb-4.
3. Member profile hero: the avatar's glow/overlap hid the start of
   the member's name. The avatar is slightly smaller on mobile
   (w-24) and raised a touch (-translate-y-2 / md:-translate-y-4),
   spacing tightened, and the name block sits above with a strong
   text shadow so the full name always reads.
Build + tsc clean.

## Batch 49 — ARMY Bomb much smaller (2026-11-06)

Owner: shrink the ARMY Bomb a lot, to the floating Ko-fi button's
size. The Ko-fi FAB is w-12 h-12 (48px); the bomb image is now
h-12 md:h-14 (was h-24 md:h-28). Position, glow, rings and the
tap-to-play behavior are unchanged. Build + tsc clean.

## Batch 50 — Weverse wall covers: no fog, just light opacity (2026-11-06)

Owner: the wall cards looked blurred/foggy. Cause: three dimming
layers were stacked (img opacity-70 + a bg-black/45 overlay + a
heavy bottom gradient). Now the profile cards use a single light
touch — the cover image at opacity-90, NO dark overlay — and the
bottom text gradient softened (black/85 via black/30). Covers read
clearly; the B&W Weverse pic still sits on top. Build + tsc clean.

## Batch 51 — AUTO DESIGN button renamed (2026-11-06)

Owner: replace the big gradient button's text with "Click to
upload photo". Done — the button under the studio tab bar now reads
exactly that (the auto-design behavior on click is unchanged, and
the subtitle still explains it). Build + tsc clean.

## Batch 52 — News share icons + Submit Video placement (2026-11-06)

1. News article share row: the Telegram / WhatsApp / FB / X / Copy
   buttons are now icon-only round buttons (w-9 h-9) on ONE
   non-wrapping line — no text labels (owner request). Handlers
   unchanged; Copy shows a check icon when copied.
2. Videos page: the SUBMIT VIDEO button wrapped to its own row
   under the ALL TYPES filter on mobile. The filter row is now
   flex-nowrap with a flexible select, so the button sits on the
   same line, right where the owner circled (right of ALL TYPES).
Build + tsc clean.

## Batch 53 — Media Manager: delete fixed + template pics removed (2026-11-06)

Owner: Media Files Manager pics can't be deleted; remove the
template ("AI") pics. Diagnosis, verified against the live
config/admin doc:
- The panel's rows passed `item.filename`, but stored media items
  only carry `name` — so every Trash/Restore/Rename/Replace call
  sent filename=undefined and the controller never matched a file.
- The live library held 10 items: the owner's 7 uploads (3 files
  uploaded twice) plus 3 original-template seeds (m-seed-1..3)
  hotlinking Unsplash stock photos ("BTS Proof Album Cover.jpg",
  "BTS Festa Concert Crowd.png", "Group Profile HD Wallpaper.jpg").
Fixes:
- Controller: stripTemplateMedia() removes m-seed*/Unsplash items
  from GET /api/admin/media and cleans the stored list on the next
  upload/delete/restore write; both code seed blocks now seed
  adminMedia: [] — they can never return.
- GET /api/admin/media normalizes each item with filename + id_str
  (the shape the panel expects).
- Delete/restore now match by the item's unique id (panel sends it),
  falling back to name; trash marks every match, so duplicate-name
  rows clear properly. Rename/Replace call sites got the same
  name-fallback fix.
Verified against the live data: the 3 seed items drop, the owner's
7 uploads remain. Build + tsc clean.

## Batch 54 — Only owner news shows (template news removed) (2026-11-06)

Owner: extra built-in news appear; only the news they add may
show. Verified against the live Firestore first: published and
draft configs already hold exactly 2 articles — the intro
(welcome-to-bangtan-gallery) and the owner's Taiwan article
(news-1793644208560). The extras came from the code defaults:
NEWS_ARTICLES still carried 3 template articles (Jimin soloists,
FESTA announcement, template welcome) which NewsSection (line 409),
the Home list and the search index all fall back to whenever the
config list is empty/stale. Fix: NEWS_ARTICLES now contains ONLY
the intro article, and migrateMemberPhotos strips those 3 legacy
slugs from any stored config at serve time. The Taiwan article is
untouched and remains a normal Admin-managed article (deletable
from the panel, as the owner asked). Verified via the app's own
published/draft reads: exactly [intro, Taiwan]. Build + tsc clean.

## Batch 55 — Weverse wall: profile pic == cover pic (2026-11-06)

Owner (confirmed via a read-back of the request first): on the
Home Weverse wall, each member's round profile pic and the card's
background cover must be the SAME photo — the member's Weverse
profile photo — with the cover at reduced opacity. The card
background now uses weversePicUrl (was bannerUrl, the Welcome
cover) at opacity-60, no overlay; the profile popup that opens on
tap got the same treatment (cover = weversePicUrl at opacity-70).
Post cards (owner-added posts with their own photo) unchanged.
Build + tsc clean.

## Batch 56 — Trending Showcase auto-fed from owner content (2026-11-06)

Owner chose: the Trending Showcase fills automatically from the
Videos/Concerts they add (no editor, no manual cards). The
component's hardcoded fallback (fake titles like "Dynamic Busan
Reunion Live Stage Remaster", invented 410M views, "HYBE LABELS"
credits, the same White House photo ×5) is DELETED; with no owner
content the section renders nothing. App now builds the cards from
publishedConfig: concerts first (title, cover — the site cover as
fallback when a concert has none, date, Watch → Concert page),
then videos (YouTube thumbnail from the video id, its real
category as tag, Watch → Videos page), ranked #1.. in order,
capped at 10. Section subtitle rewritten honestly. Verified
against live data: 2 owner concerts exist (both will show), 0
videos (cards appear as the owner adds them). Build + tsc clean.

## Batch 57 — Gallery Uploads manager + blank/double photo fixes (2026-11-06)

Owner asked whether Gallery uploads can be deleted/edited from
the panel (they could not), then reported blank and double photos
in the Gallery. Three fixes:

1. NEW Admin Panel tab "Gallery Uploads" (after Media Files
   Manager): lists every photo in the Firestore `media`
   collection with thumbnail, editable title, category dropdown
   (the site's own gallery categories), description, Save and
   Delete. Backed by two admin-auth endpoints:
   POST /api/admin/gallery/update and /api/admin/gallery/delete
   (they sit behind the Batch-24 /api/admin/ gate — verified: the
   same calls WITHOUT a login token are refused). Delete removes
   the Firestore doc and the local cache copy; both actions write
   to the activity log. Verified end-to-end against live data with
   a throwaway test upload: edit changed its title/category in the
   live list, delete removed it, and the temporary test session
   used for the check was removed again afterwards.
2. Blank photos: uploaded photos whose source link is dead
   (expired hotlinks) rendered as big black cards. Grid images
   now report load errors and the card hides itself; the viewer
   shows "This photo could not be loaded" instead of black; items
   with an empty URL are dropped before render.
3. Double photos: getUnifiedItems could emit the same photo
   twice (config list + code defaults, worsened by an index-based
   fallback that borrowed unrelated photos). The index fallback
   is removed (id match only) and the merged list is de-duplicated
   by photo URL.

Build + tsc clean.

## Batch 58 — ARMY Bomb idle fade (2026-11-06)

Owner rule: the floating ARMY Bomb starts fully visible; after
5 idle seconds in the OFF state it fades to 40% opacity; touching
(or hovering) it restores full opacity and restarts the 5-second
count; while the bomb is ON (song playing) it never fades.
Implemented in ArmyBombPlayer with a dimmed state + a 5s timer
effect keyed on the on/off state and the last interaction
(pointer down / pointer enter), with a 1s opacity transition.
Build + tsc clean.

## Batch 59 — Live Stream: caption under the player removed (2026-11-06)

Owner asked for the separately-printed caption under the Live
player to be cut so only the video remains. The title/description
block that rendered under the player (stream title + "💜" and the
description line) is removed from LiveStreamSection. The title
and description are still stored in the live config and editable
in Admin → Live Streaming — they are just no longer printed on
the page. Player, Telegram backup banner, chat and ad order are
unchanged. Build + tsc clean.

## Batch 60 — Caption restored + concert player black screen fixed (2026-11-06)

1. The Batch 59 caption removal was a misunderstanding: the owner
   wanted YouTube's OWN in-player title gone (impossible — it is
   part of YouTube's embed), NOT the admin-written caption under
   the player. The caption block under the Live player is restored
   exactly as before.
2. Concert player black for admin-added links: verified against
   live data — the new São Paulo D03 concert stores a YouTube
   embed URL (ik2l5jDdeeI, the same video that plays fine on the
   Live page via a real React iframe; oEmbed confirms the video
   exists and is embeddable). The concert player injected its
   iframe as an HTML string through dangerouslySetInnerHTML and
   the frame never painted. Replaced with a real React iframe fed
   by a resolveEmbedSrc() helper (YouTube watch/youtu.be/embed/
   shorts/live, Vimeo, VdoCipher/player passthrough) — the same
   pattern as the Live player. Telegram and direct-file branches
   unchanged. Build + tsc clean.

## Batch 61 — Videos page: submission videos appearing then vanishing (2026-11-06)

Owner reported Videos-page videos show sometimes, then vanish.
Two findings:

1. REAL BUG (fixed): YouTubeClone had two writers fighting over
   the video list — an 8-second polling fetch that merges approved
   submissions into the config videos, and a passedConfig sync
   effect that overwrote the list with config-only videos on every
   config refresh. Submission videos appeared, then vanished, in a
   loop. The submissions are now kept in a ref and the config sync
   merges them in instead of wiping them. The spotlight preview
   image also falls back to the site cover instead of a broken-
   image icon when a non-embeddable link has no thumbnail.
2. Data check (no code change): the live database holds 5 video
   submissions — 1 approved (MIC DROP) and 4 rejected (LA Replay,
   ON MV, BTS NORMAL MV, Baltimore Fancam — the ones in the
   owner's screenshot). The submissions endpoint correctly serves
   ONLY approved ones to the public (verified by calling it), so
   rejected items can only have been visible while still approved
   (before rejection) or from a stale browser cache.

Build + tsc clean.

## Batch 62 — Full bug audit + security/session fixes (2026-11-07)

Owner asked to hunt for remaining bugs. Audited: admin tabs vs
render blocks (all present), public nav vs sections (all 18
render), every frontend /api call vs controller handlers, the
show/vanish flicker pattern in other sections (none), live data
health (member files all present; config gallery has some
Pinterest hotlinks + untitled items — owner-editable data, not
code). Found and fixed:

1. SECURITY: the Security tab's "Kill Token" (revoke session)
   called POST /api/admin/security/session/:id/revoke, which had
   NO handler — it fell into the catch-all's fake {success:true},
   so the panel claimed success while the session stayed valid.
   Implemented for real (id = the session token). Verified
   end-to-end: revoked token fails session/check, others stay
   valid, repeat revoke honestly reports "not found".
2. "Logout all devices" (POST /api/admin/logout-all) also had no
   handler — only the current browser was signed out. Implemented
   (clears all sessions); verified end-to-end.
3. The Active Sessions table rendered stored sessions ({token,
   createdAt}) with fields they never had (id, ip, device,
   loginTime, isActive) — real sessions showed blank and
   "Revoked" with no Kill button. The security-settings response
   now maps sessions into the rendered shape, and new logins
   store the full record.
4. Stage-2 login issued tokens that were never registered, so
   they would fail every admin auth check. Now registered like
   stage-1 tokens.
5. Admin Panel's 7-second config sync unconditionally reset the
   draft, wiping in-progress typing in form tabs outside the
   VisualBuilder modal. The sync now skips while an input,
   textarea, select or editable element is focused.

Temporary test sessions used for verification were removed and
the owner's original session list restored exactly. Build + tsc
clean.

## Batch 63 — Password recovery was missing + music honesty (2026-11-07)

Owner reported: even after changing the admin password, the old
default "army7seven" still logs in. Verified against the live
admin doc: the stored hash IS bcrypt("army7seven") — the change
never landed, because (a) the old build's flows were fake-success
(the catch-all again) and (b) the forgot-password recovery
handlers DID NOT EXIST at all: the panel's query/reset calls fell
into the same fake success.

1. Implemented POST /api/admin/forgot-password/query and /reset:
   email must match the admin email; reset verifies the security
   answer (bcrypt) or the backup code, sets the new password hash
   and clears all sessions. The panel's two recovery handlers now
   also check data.success (apiPatch returns HTTP 200 even for
   {success:false}). FULL end-to-end test against live data:
   wrong email rejected, question loads, wrong answer rejected
   with the hash untouched, correct answer reset the password
   (old one died, sessions cleared), login with the temporary
   password worked, the account endpoint changed it back, and the
   owner's original sessions were restored — the live state is
   exactly as before the test (password still army7seven until
   the owner changes it after this deploy).
2. Music check (owner asked): NOTHING on the Music page can
   currently play — the 2 published digital tracks are "One More
   Night" (audioUrl /audio/One_More_Night.mp3, a template-era
   invented path; the file exists nowhere — 404 on the live site)
   and "New Track" (empty URL); the single approved music
   submission is the same dead file; built-in album tracks carry
   no audio source. The MP3 itself was never stored and cannot be
   recovered — the owner must re-upload it (uploads are real since
   Batch 1) or add Spotify links. Code side: the player now SHOWS
   an error in the player bar when a track's file fails to load
   instead of failing silently, and tracks with no playable
   source no longer render as cards.

Build + tsc clean.

## Batch 64 — Favicon was a black third-party icon (2026-11-07)

Owner screenshot: the browser-tab icon showed as an invisible
black square while the header logo was fine. Root cause: the tab
icon was a hotlinked icons8 PNG with color=000000 (a black logo),
and at runtime App.tsx replaced it with the stored config's
seo.faviconUrl — another hotlinked icons8 file. Replaced with
self-hosted icons made from the owner's own purple BTS logo
(public/images/bts-logo.png on its dark background):
favicon.ico (16/32/48), favicon-32.png, favicon-512.png,
apple-touch-icon.png. index.html, admin.html and public/404.html
now link the local files; the seoHtmlInjector and the SPA-route
generator JSON-LD logo point to the site's own favicon-512.png;
defaultSeo.faviconUrl is '/favicon-512.png'; and a serve-time
repair in migrateMemberPhotos swaps any stored icons8 faviconUrl
to '/favicon-512.png' (custom non-icons8 panel values untouched)
— so the tab icon becomes the purple logo as soon as this build
is deployed, no panel action needed. Note: browsers cache
favicons hard; a hard refresh may be needed to see it. Build +
tsc clean; dist verified to contain the new icon files/links.

## Batch 65 — panel-added news get their own share previews
The owner asked whether a NEW news article would show its own
cover when shared. Live check proved it would NOT: per-article
preview pages were generated at build time from CODE defaults
only (after Batch 54 that is just the intro article), so a
panel-added article (their Taiwan article) shared with the
site's default title + main cover. Fix in
scripts/generate-spa-routes.ts: the generator now also fetches
the LIVE published news list from Firestore (public read,
mask=news), merges it over the local list by slug (live wins,
unpublished and the 3 stripped template slugs excluded, data:-URI
covers cleared so they fall back to the site cover), and
generates preview pages + sitemap entries for the merged set;
the fetch is best-effort so an offline build still works. The
script body is now an async IIFE for the await. Verified: build
merged 2 articles and pre-rendered
/news/bts-world-tour-arirang-202-kaohsiung-taiwan with og:title
= the article's title and og:image = its own kpopofficial cover;
tsc 0 errors. HONEST LIMIT (told to the owner): preview pages
are a build-time snapshot — articles existing at deploy time get
pages; an article added after a deploy gets its page at the NEXT
deploy. Until then it shares with the site cover, like gallery
uploads already do.

## Batch 66 — write-quota survival (owner-approved)
On 2026-11-07 ~02:23 Dhaka the Firestore free DAILY WRITE quota
(20,000/day) ran out: a backend login test captured Google's
RESOURCE_EXHAUSTED 'Free daily write units' error. The public site
kept reading fine, but every save hung — worst, the Admin login
spun forever on 'UNLOCKING ARCHIVES...' because logging in saves
a session and the Firestore SDK retries a dead-quota write with
long backoff instead of failing. Two fixes in
src/firebaseController.ts:
(1) WRITE SAMPLING for the view counter: POST /api/stats/view
used one write per visitor session; now ~1 in 10 sessions writes
+10 (total stays accurate on average, local display still +1 per
session) — ~200k sessions/day now fit the free quota.
(2) WRITE TIMEOUT: a withWriteTimeout() race (12s) now wraps every
Firestore write — the four local wrappers (setDoc/updateDoc/
deleteDoc/addDoc) plus the direct fbSetDoc calls in
ensureAdminSeeded, draft save and publish (in place, so the
honest rethrow-on-failure save flows keep their semantics). On
timeout the wrappers take their existing cache-only fallback; the
SDK write is not cancelled and may still land after the quota
resets (midnight Pacific ≈ 2 PM Dhaka). AdminPanel login now also
shows the server's specific error instead of a generic one.
VERIFIED under the live outage via the handler shim: stats/view
returns instantly when unsampled and in ~12.4s (timeout firing)
when sampled; login COMPLETES in ~30s with success + a token
(previously killed at 170s with no result); build + tsc clean and
the dist bundle contains the WRITE_TIMEOUT code. Also confirmed
the owner's 02:16 contact-form test never reached the database
(the inbox holds only one older message from 'simrab') — its save
was caught by the same outage.

## Batch 67 — password change was fake: fixed and proven
The owner reported that in Admin → Security, ANY text in the
'current password' field let the change 'succeed', and the old
army7seven kept logging in while their new password did not.
Both true, proven in code and live data: the panel sends
{ currentPassword, newEmail, newPassword } to
POST /api/admin/security/account, but the handler read
body.email / body.password (never sent), never looked at
currentPassword at all, and returned success with an EMPTY
update payload — a textbook fake success. A REST re-read of
config/admin confirmed the stored hash still matched
army7seven after the owner's change. Fix: the handler now
(1) requires currentPassword and bcrypt-verifies it against
the stored hash (wrong/missing -> success:false 'Current
password is incorrect.'), (2) accepts newPassword/newEmail
(legacy password/email keys kept), (3) returns an honest error
when there is nothing to update, and (4) on an email/password
change clears ALL sessions, as the panel's success toast has
always promised. Both panel forms now require data.success
(not just res.ok) before showing the success toast.
E2E against live data (temp session, full restore afterwards):
wrong current password rejected with the hash untouched;
correct current password saved (fresh REST read: hash matches
the new password, no longer the old); all sessions wiped on
change (6 -> 0); fresh login with the new password succeeded
and with army7seven was refused; the original hash/email/
sessions were then restored exactly (hash matches army7seven
again, sessions back to the original 5, temp token absent).
Build + tsc clean; the built bundle contains the new error
string. The security question/answer save (PUT
/api/admin/security/settings) was checked too — its keys
already matched and it genuinely persists.
