# Reconstruction notes

## What the implementation preserves

The earlier site had a single PHP page controller and a shared class/function file. A small MySQL schema held information pages, news, forum boards, topics, posts and members. The new implementation keeps those relationships in `data.js` and browser-local state rather than shipping the historical database.

The homepage is the News route. The six-item left navigation is present throughout. News and information pages have a second, graphical menu to the right; forum and administration views use the wider content area. Events remain an editable information page rather than an invented calendar service.

Forum topics sort by announcement, sticky status and creation date. The index's latest-topic field means the latest created topic, not the latest reply. Threads show ten posts per page. The historical “REPLIES” column counts the opening post as well; that harmless quirk is retained deliberately. The shared avatar is replaced with the fictional organisation's mark, rather than adding an avatar-upload feature absent from the supplied implementation.

The original title bars, news-bar pieces, tabs, menu edges and small administration controls are reused. Raster filenames such as `FORUMDAMINISTRATOION.jpg`, `newsDAMINISTRATOION.jpg` and `140(sidebar)fini1_r2_c1.gif` retain their historical spelling. Alternate generic button states are retained as production remnants.

`orangebar`, `forumbuttons`, `PostWrite`, `MM_swapImage`, `MM_swapImgRestore` and `MM_preloadImages` keep original names where there is an analogous function. Relevant original comments include `//grab data`, `// MODERATOR STUFF TO DO`, the reply-placement explanation, Fireworks/Dreamweaver export comments and `//v3.0`. The “Updated Succesfully” message preserves its original spelling. Phase 4 also restored relevant `wordswrap` comments (including “deviding” and “hyberlink”), the former toolbar helper names and an attributed note about the `MM_findObj` v4.01 browser compatibility branches. The replacement header explicitly attributes the original master's `07/20/04` Fireworks MX metadata; it does not claim that the new image was created in 2004.

## Deliberate changes

- The organisation and all public content are independently fictional.
- Newly constructed SVGs replace client-bearing graphics at matching dimensions. The replacement mark is typographic and does not reproduce the old client's symbol.
- SQL, PHP, historical accounts, credentials, source documents and screenshots remain outside the public package.
- HTML structure is repaired. Native labelled controls, keyboard rollover behaviour, a skip link and readable status messages improve operation without a visual redesign.
- Passwords are not retained. Demo identities are explicit and local. Status/role checks illustrate the original UI rather than providing real authentication.
- Editing preserves article/post timestamps as the older helpers did. New activity uses the fictional 2005 clock.
- Local text/image preview takes the place of server file management. No browser-local file is sent to a service.
- User content is displayed through a restricted formatting renderer. Scripts, embedded applications, remote images and external links are not accepted through the editor. The word censor matches literal text and ignores empty lines.
- Public profile views are a modest demonstration addition based on the evidenced profile fields; a separate public member-directory route was not established by the surviving source.
- The original production credit remains visible. A separate credit page provides context and a natural home for the supplied Farsight logo; its original placement in the live website is not asserted.

## Uncertain or unsupported original features

The early functional diagram mentions confidential topics and moderator reassignment, but the supplied application does not establish working interfaces for them. Neither has been invented. Personal avatar uploads, signatures, IP bans, anti-spam protection and multi-page older-news listings are not represented as delivered historical features.

The manual and PHP disagree about some moderation permissions, upload extensions and which features were optional. The demo uses a consistent interpretation: moderators manage their assigned boards; administrators manage the whole fictional site. It does not reproduce contradictory permissions or ineffective security checks.

The old table markup contains conflicting width declarations. The 800 px masthead, sidebar dimensions, palette and screenshot composition guide this reconstruction; exact pixel-for-pixel equality across historical browsers is not claimed. Phase 3 compared the rendered composition with the supplied screenshots and slice dimensions. Small raster lettering and operating-system font fallbacks will still differ between browsers.

## Phase boundary

All four reconstruction phases are complete. Navigation, representative member/moderator/administrator workflows, local persistence, reset, graphic states and subdirectory hosting were exercised in Chromium. The detailed functional record is in `phase3-verification.md`; the subsequent review is in `final-audit.md`.

Phase 4 reviewed client de-identification, historical preservation and the fresh-copy serve/publish handover. It restored relevant harmless source notes and clarified the publishing instructions. This site has not been published.

The Phase 2 construction checks remain valid: both JavaScript files parse; fictional IDs and relationships are consistent; linked topic/board IDs and supplied documents exist; post dates fit the fictional chronology; all 83 reused raster assets decode and match their source bytes; all 16 replacement SVGs parse. A packaging guard excluded archival source and prohibited client text/filenames. The complete identity audit is recorded in `final-audit.md`.

The Phase 2 browser limitation was resolved in Phase 3 with an isolated preview containing only the fictional reconstruction. Original evidence was not served or altered.
