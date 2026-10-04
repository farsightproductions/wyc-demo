# Phase 3 — functional and visual verification

Verified 3 October 2026. This records the Phase 3 checkpoint. The subsequent Phase 4 review is recorded in `final-audit.md`; neither report implies a live deployment.

## Visual corrections

The source screenshots, CSS declarations and raster slice dimensions remained the visual authority. The fixed 800 px canvas, small type, grey/yellow palette, bitmap buttons, large old-fashioned form areas and irregular period spacing are intentional.

- Removed the white vertical seam between each news orb and its bar. The second original raster now fills its actual cell width; neither source raster was edited.
- Aligned the replacement left-sidebar panel with the surviving edge slice. Removed the extra rounded corner and matched the original panel's top/bottom transition rows.
- Restored the Latest News image to the source's displayed 413 × 19 px size, correcting its overly stretched lettering.
- Aligned the administration tab with the 19 px news tabs.
- Matched the replacement About WYF button to the Tahoma/Verdana/Arial stack and neighbouring label position. Restored the source's Verdana table-heading stack.
- Aligned image links and button controls in the administration action cells.
- Stopped the right graphical menu's container from stretching down with long content.
- Added a stylesheet revision query so the corrected CSS can replace cached copies.

No new visual theme, responsive card layout, external font or modern component library was introduced. All 83 reused raster assets retain their original bytes.

## Browser checks

The application was served by a plain static HTTP server and exercised at a project path (`/phase3/`). The following results describe actual browser checks; they are not inferred from syntax validation alone.

| Area | Result and observed coverage |
| --- | --- |
| Homepage | Five latest stories, header/sidebar composition, account controls and original-width canvas rendered. |
| Primary navigation | All six links: News, About, Events, Discussion, Links, Contact. Each rendered without main-panel horizontal overflow or broken loaded images. |
| News | Latest and older listings; individual latest/older articles; related-article links. Older articles retain the historical six-candidate related-news behaviour. |
| Information/events/contact | All information routes rendered; event dates, venue text, forum/contact links and fictional contact area present. Events remain an information page, not a booking service. |
| Forums | Five-board index, Around Westbridge topic list, individual thread and member author links rendered. |
| Pagination | Open-afternoon thread showed ten posts on page 1 and four on page 2; next/previous controls worked. |
| Local login/logout | Fictional pixelpete login succeeded; logout returned to Guest. No real credentials or account service were used. |
| Registration | A fictional test screen name was created and selected locally. |
| Topic/reply/edit | Created a disposable topic, replied and edited the reply. Line breaks survived; the sample censor replaced a mild sample word. |
| Persistence | Reply edits and local text-file preview survived full reloads. |
| Moderator controls | Skylark locked/unlocked and made a topic sticky; locked topics hid the reply form. Moderator access to news administration was denied as intended. |
| News administration | Added a fictional story, edited its headline, viewed it, and separately verified article deletion. |
| Information editor | Saved an About-page change and verified its displayed result. |
| User administration | User list rendered without overflow/missing images; changed pixelpete's secondary status successfully. |
| File cabinet | Added the supplied fictional text document to the local cabinet, displayed its complete contents and reloaded the preview successfully. |
| Reset | Confirmation restored Guest, the deleted latest story and original About content. Five original boards remained. Test changes did not alter the seed files. |
| Graphic states | About-button keyboard focus selected its alternate graphic and restored it on blur. Pointer entry selected the Forums tile's blue alternate, and navigation from that tile worked. |
| History/deep links | Browser Back/Forward restored the expected views. Direct query-string routes loaded under the project subdirectory. |
| Assets/layout | Checked rendered images for successful loading and main-panel overflow. Final homepage measured 800 px overall, 413 px Latest News label and no main-panel overflow. |
| Console | No site-origin warnings/errors in the checked session. Browser-extension metadata errors were identified separately and are not application errors. |

The file picker initially responded slowly in the test environment; the operation subsequently completed and its preview/persistence were verified. Native confirmation dialogs were accepted to complete the explicitly disposable test operations.

## Coverage limits

This pass used Chromium. It does not claim Firefox/Safari, historical Internet Explorer or every operating-system font rendering was tested. The fixed canvas deliberately pans on small screens; this is not a mobile redesign. Image-cabinet uploads, every deletion/ban combination and blocked/quota-full browser storage were not exhaustively exercised. These limits do not affect the successful core flows above.

No GitHub repository or live Pages deployment was created in this phase. Subdirectory compatibility was checked on the static preview. The original archive remains separate and unchanged. At this checkpoint, Phase 4 awaited approval. The subsequently completed organisational-identity, preservation and technical review is recorded in `final-audit.md`.
