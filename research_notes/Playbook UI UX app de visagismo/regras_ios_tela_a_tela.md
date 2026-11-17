# iOS screen-by-screen design rules (Apple HIG incl. iOS 26 / Liquid Glass, plus UX research)

Research date: 2026-11-17. Apple HIG pages were read through their JSON data endpoints (developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json), which hold the same text as the public pages linked below. Network note: nngroup.com and useyourloaf.com could not be reached from this session (DNS blocked), so NN/g and device-size findings come from search-result snippets only and are flagged as such.

---

## 1. iPhone layout fundamentals (screen sizes, safe areas, margins, grid, touch targets, bar heights, large titles, sheet detents)

### Takeaway
Apple's Layout page gives principles, not iPhone pixel specs: respect safe areas and layout margins, design by size class, and in iOS 26 let content run under floating Liquid Glass bars. The hard numbers Apple does publish are hit targets of 44x44 pt by default and 28x28 pt minimum, with about 12 pt spacing between bezeled controls and 24 pt between borderless ones. Logical screen sizes and bar heights come from secondary sources and should be checked in the Xcode simulator.

### Cited Findings
**Safe areas, margins, size classes**
- The safe area is the part of a window not covered by hardware features or by other views (toolbar, tab bar, status bar). Keep content inside it so the Dynamic Island and system UI don't cover controls. Use the system's predefined layout guides, which apply standard margins and limit text width. — [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- Layouts should respond to size classes (compact or regular in each dimension), not to device type or orientation. Test every combination, including portrait, landscape and iPhone Mirroring. — [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- At large text sizes, stack horizontally adjacent views vertically and let rows grow so text isn't clipped. Test the largest and smallest layouts first. — [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- **iOS 26 change:** "Differentiate controls from content" with Liquid Glass. Use a *scroll edge effect* instead of a solid or semi-opaque background behind controls. Extend full-screen background content under sidebars, toolbars and tab bars. Use the background extension effect (`backgroundExtensionEffect()` / `UIBackgroundExtensionView`) where a bar would cover important imagery. Liquid Glass guidance was added on 9 Jun 2025, and the page was last updated on 9 Sep 2026 ("current best practices"). — [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- The Layout changelog lists device specifications for iPhone 16, 16e, 17, 17 Pro and Air, but the values sit in an Apple Design Resources table that could not be extracted. — [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout)

**Logical screen sizes (secondary sources, verify)**
- iPhone 17 and 17 Pro: 402 x 874 pt @3x. iPhone 17 Pro Max: 440 x 956 pt @3x. iPhone Air: 420 x 912 pt @3x, though one source gives a different Air size. iPhone 16e: 390 x 844 pt @3x. — [picturesizes iPhone 17 specs](https://picturesizes-com.pages.dev/specs/devices/iphone-17); [useyourloaf iPhone 17 screen sizes (snippet only)](https://useyourloaf.com/blog/iphone-17-screen-sizes/)
- Safe-area insets, iPhone 17 portrait: top 62, bottom 34, left/right 0. iPhone 17 Pro Max landscape: top 20, bottom 20, left/right 62. iPhone Air landscape: top 20, bottom 29, left/right 68. Portrait values for the Pro Max, Air and 16e were not confirmed. — [useyourloaf iPhone 17 screen sizes (search snippet)](https://useyourloaf.com/blog/iphone-17-screen-sizes/); [useyourloaf iPhone 16 screen sizes](https://useyourloaf.com/blog/iphone-16-screen-sizes/)

**Touch targets and spacing**
- iOS/iPadOS control size: **44 x 44 pt default, 28 x 28 pt minimum**. Leave about **12 pt** padding around bezeled elements and about **24 pt** around the visible edges of borderless elements. — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

**Bars (toolbars, navigation bars, tab bars)**
- **iOS 26:** navigation bars and toolbars take on the glass appearance and float above content. To keep a large title visible, extend the scroll view fully under the navigation bar. — [WWDC25 session 284 index](https://nonstrict.eu/wwdcindex/wwdc2025/284/)
- Toolbars have leading, center and trailing groups, with no more than three groups. Back and Close go in the leading group. The primary action goes trailing, uses the `.prominent` (tinted) style, and there is only one per toolbar. Prefer symbols over text, except for actions such as "Edit". Use the standard circular Back button without a "Back" text label. Titles should be under 15 characters and should not be the app name. Large titles collapse to a standard title on scroll. Keep backgrounds and tints minimal and let the content drive the colour. Custom components should use corner radii concentric with the bar. — [HIG Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) (Liquid Glass updates 9 Jun 2025 and 16 Dec 2025)
- Bar heights (third-party, not Apple-published): navigation bar 44 pt, about 96 pt with a large title; tab bar 49 pt, 83 pt including the home-indicator area. In iOS 26 the tab bar is an inset Liquid Glass capsule. — [learnui.design iOS guidelines](https://learnui.design/blog/ios-design-guidelines-templates.html); [skillsmp iOS 26 design system](https://skillsmp.com/creators/seunghan91/ios26-design-system/skills-ios26-design)
- Content placed in a native navigation header should stay within a 44 pt height on iOS 26. — [thoughtbot](https://thoughtbot.com/blog/migrating-to-native-stack-navigation-with-a-surprise-from-ios-26)
- Developers report that the iOS 26 UITabBar is taller and looks oversized on Touch ID (home-button) devices. — [Apple Developer Forums 796986](https://developer.apple.com/forums/thread/796986)

**Sheet detents**
- Detents: *large* (full height, default), *medium* (about half the full height), or custom values. Medium alone prevents expansion. Medium suits progressive disclosure, as in the share sheet. Resizable sheets need a grabber, which supports VoiceOver and cycles detents on tap. No point heights are published. — [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)

### Inferences
- Treat 402 x 874 pt as the base artboard for the current lineup (17 and 17 Pro), and check it at 390 x 844 (16e) and 440 x 956 (Pro Max). Keep primary CTAs above the 34 pt bottom inset and the floating tab bar.
- An 8 pt spacing grid with 16 pt side margins (the iPhone default readable margin) and 20 pt on Max-width devices is industry convention. The HIG pages read here do not state an 8 pt grid or a margin value, so present it as convention, not an Apple rule.
- In iOS 26 nothing should be designed as an opaque bar background. Full-bleed images (camera previews, results imagery) should extend under the bars, with the scroll edge effect providing separation.

### Gaps
- Apple's exact table of logical sizes and insets for iPhone 16, 16e, 17, 17 Pro and Air (in Apple Design Resources) could not be extracted. Verify it in Xcode 26 simulators.
- Official iOS 26 point heights for the floating tab bar, its inset from the screen edges, its corner radius and the navigation bar are not published in the HIG. The values above are third-party.
- The standard layout margin (16/20 pt) and the 8 pt grid could not be confirmed on the Apple pages read here.
- Sheet corner radius and the iOS 26 inset sheet look (a floating glass sheet at medium detent that becomes edge-to-edge at large) are not described on the HIG Sheets page.

---

## 2. Typography (SF Pro text styles, Dynamic Type, custom fonts)

### Takeaway
The verified iOS default (Large) Dynamic Type table runs from Large Title 34/41 down to Caption 2 11/13. Body text defaults to 17 pt and nothing should go below 11 pt. Text must scale to at least 200%, and custom fonts must carry the same Dynamic Type and Bold Text behaviour.

### Cited Findings
- iOS/iPadOS Dynamic Type at the **Large (default)** size, as size/leading in pt (weight; emphasized weight):
  - Large Title 34/41 (Regular; Bold)
  - Title 1 28/34 (Regular; Bold)
  - Title 2 22/28 (Regular; Bold)
  - Title 3 20/25 (Regular; Semibold)
  - Headline 17/22 (Semibold; Semibold)
  - Body 17/22 (Regular; Semibold)
  - Callout 16/21 (Regular; Semibold)
  - Subhead 15/20 (Regular; Semibold)
  - Footnote 13/18 (Regular; Semibold)
  - Caption 1 12/16 (Regular; Semibold)
  - Caption 2 11/13 (Regular; Semibold)

  The Emphasized-weight column was added on 16 Dec 2025. — [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- The default text size is 17 pt and the minimum is 11 pt (iOS/iPadOS), for both system and custom fonts. Prefer Regular, Medium, Semibold or Bold, and avoid Ultralight, Thin and Light at small sizes. — [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- Let people enlarge text by **at least 200%**. Use larger sizes for thin weights. — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- Custom fonts must implement the same accessibility behaviours as the system font, including Dynamic Type and Bold Text. See "Applying Custom Fonts to Text" (UIFontMetrics / `.custom(_:size:relativeTo:)`). — [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- Avoid truncation: at the largest accessibility size, show as much text as at the largest standard size, using multi-line labels. Scale meaningful icons with the text (SF Symbols do this automatically). Use stacked layouts and fewer columns at large sizes, and keep primary elements near the top. — [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)

### Inferences
- A brand display face is fine for headings if it is mapped to a text style (for example Title 1 relative to `.title`) and scales with it. Keep SF Pro for Body, Callout and Footnote in dense UI such as settings and forms.
- Results and report screens with numbers and percentages should be tested at the AX5 size. Use vertical stacking instead of side-by-side metric chips.

### Gaps
- The tables for the other Dynamic Type sizes (xSmall to AX5) are in the remaining ~180k characters of the page, which were not read. They are available on the same HIG page.
- No iOS 26-specific typography changes were found beyond the emphasized-weight column.

---

## 3. Colour and materials (semantic colours, dark mode, contrast, materials, Liquid Glass)

### Takeaway
Use semantic system colours with light, dark and increased-contrast variants, and meet 4.5:1 for text up to 17 pt (3:1 for 18 pt+ or bold). Liquid Glass belongs only in the functional layer (controls and navigation), never in content, and colour on it should be used sparingly. Use the clear variant only over rich media, with a 35% dimming layer when the media is bright.

### Cited Findings
- Contrast as used by Accessibility Inspector (WCAG AA): text up to 17 pt needs 4.5:1, 18 pt needs 3:1, and bold text at any size needs 3:1. Provide a higher-contrast scheme when Increase Contrast is on, and check both appearances. — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- Don't hard-code system colour values, because they change between releases. Don't repurpose semantic colours (for example separator as text). Custom colours need light, dark and increased-contrast variants. "Even if your app ships in a single appearance mode, provide both light and dark colors to support Liquid Glass adaptivity." Don't rely on colour alone to convey meaning. — [HIG Color](https://developer.apple.com/design/human-interface-guidelines/color)
- **Liquid Glass colour:** glass has no inherent colour and takes it from the content behind. Small elements (tab bars, toolbars) are monochrome by default, darker over light content and lighter over dark content. Apply colour sparingly, reserve it for status or the primary action, and put it on the glass background rather than on the symbols. Don't tint several controls. — [HIG Color](https://developer.apple.com/design/human-interface-guidelines/color)
- **Where glass goes:** controls and navigation float as a functional layer above content. "Don't use Liquid Glass in the content layer." "Use Liquid Glass effects sparingly." Standard components adopt it automatically. Transient controls such as sliders and toggles take a glass look while they are active. — [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- **Variants:** *regular* blurs the background and adjusts luminosity, and suits text-heavy components (alerts, sidebars, popovers). *clear* is highly translucent and is "only" for use over visually rich backgrounds (photos, video). Over bright content beneath clear glass, add a dark dimming layer at **35% opacity**. The look changes with the user's Liquid Glass preference, Reduce Transparency and Increase Contrast, so test with each. API: `glassEffect(_:in:)`, `Glass.regular` / `Glass.clear`. — [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- **Standard materials** (content layer) on iOS: ultra-thin, thin, regular (default) and thick. Use vibrant label colours on them. Thicker materials give better contrast for fine text. Avoid quaternary labels on thin and ultra-thin. — [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- Tab bar colour: avoid label colours similar to the content background. Over colourful content, use a monochrome tab bar or a clearly contrasting accent. — [HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

### Inferences
- On a camera capture or AR try-on screen (rich, live video), floating controls such as the shutter, flip and close buttons are the right place for *clear* glass with a 35% dim when the scene is bright. Report cards, results panels and dashboard cards are content and should use opaque or standard-material surfaces, not glass.

### Gaps
- The exact semantic colour hex values were not collected. Apple advises against hard-coding them anyway.

---

## 4. Per-screen specifications

### Takeaway
Across all screens, Apple's rules are: the launch screen is an imageless copy of the first screen, not a splash; onboarding is short, optional and interactive; sign-in is delayed until it brings value, and Sign in with Apple is offered at equal prominence; permissions are requested in context, with at most a one-button "Continue" primer; something appears immediately while loading; one sheet at a time, with visible Cancel/Done; full-screen modals for camera and long flows; and the tab bar is for navigation only.

### Cited Findings

#### 4.1 Launch screen and splash
- The launch screen is not a splash or onboarding screen and is "not an opportunity for artistic expression". Make it nearly identical to the first screen. If the first screen is a solid colour, show only that colour. Match the current orientation and light/dark mode. **No text** (it can't be localized). **No logos or branding** unless the logo is a fixed part of the first screen. Launch "instantly" because people may not wait more than a couple of seconds. Restore the previous state, including scroll position. — [HIG Launching](https://developer.apple.com/design/human-interface-guidelines/launching)
- If you need a branded splash, show it at the start of onboarding, or right after launch if there is no onboarding. Keep it to a graphic that can be absorbed at a glance, without making people feel delayed. — [HIG Launching](https://developer.apple.com/design/human-interface-guidelines/launching); [HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- App Store screenshots should show the app in use, not just title art, a login page or a splash screen. — [App Review Guidelines 2.3.3](https://developer.apple.com/app-store/review/guidelines/)

#### 4.2 Onboarding (value carousel)
- Use onboarding only if necessary, and make it "fast, fun, and optional". It runs after launch. Teach through interactivity, prefer contextual tips (TipKit) over one long flow, and don't teach the system or the device. Provide sensible defaults and postpone nonessential setup. Leave licences to the App Store. Don't make people wait for large downloads. An optional tutorial that was skipped should not be shown again, and should stay reachable from Help or Settings. Ask for ratings or purchases only after people have used the app. Changelog: 10 Jun 2024. — [HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- You may request permissions during onboarding if the app needs them to function, explaining why. Otherwise request them at first use. — [HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- NN/g recommends avoiding app onboarding where possible because it adds interaction cost, and even skipping takes a tap. In a test with 70 users across 4 apps, people who read tutorials perceived tasks as harder and showed no advantage in success rate or completion time over those who skipped. Onboarding is justified when you need user information to get started or when a feature is truly new. — [NN/g Mobile app onboarding (search snippet)](https://www.nngroup.com/articles/mobile-app-onboarding/); [NN/g Mobile tutorials](https://www.nngroup.com/articles/mobile-tutorials/)
- Vendor claims that carousels complete at under 30% "per NNGroup" could not be verified and should not be cited. — [Bolder Apps (unverified)](https://www.bolderapps.com/blog-posts/app-onboarding-flow-architecture-2026)

#### 4.3 Sign-in / sign-up (incl. Sign in with Apple)
- **Delay sign-in** until it offers clear value (personalisation, sync), and let people explore first. If an account is required, explain why before showing the options. — [HIG Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- **Button:** at least as large as the other sign-in buttons, with no scrolling needed to reach it. Styles: White (on dark), White-outline (on light) and Black (on light). Titles: "Sign in with Apple", "Sign up with Apple" or "Continue with Apple", used consistently. **Minimum 140 x 30 pt, 44 pt recommended height.** Margin of at least 1/10 of the button height. Corner radius should match the other buttons (rounded, square or capsule allowed). For custom buttons, the title font size is about 43% of the button height, with at least 8% of the width as right title margin, and only Apple-supplied logo artwork. App Review evaluates custom buttons. — [HIG Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- **Data:** minimise it and mark fields as required or optional. Never ask for a password, respect the private relay email, ask for optional data later, and don't block features if optional data is declined. After sign-in, go straight into the account with no extra forms. Show "Using Sign in with Apple" in account settings. — [HIG Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- **App Review 4.8:** if a third-party or social login (Google, Facebook, etc.) is used for the primary account, the app must also offer an *equivalent* login service that limits data to name and email, allows email hiding, and does not track for ads without consent. Sign in with Apple satisfies this. The current wording no longer names Apple specifically. — [App Review Guidelines 4.8](https://developer.apple.com/app-store/review/guidelines/)
- **5.1.1(v):** without significant account-based features, the app must be usable without login. If the app supports account creation, **account deletion must be available in-app**. Don't require personal information unless it is core to the app or legally required. — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- An app with login must provide App Review with a demo account or a demo mode (2.1(a)). — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

#### 4.4 Permission requests (camera, notifications, photos) and pre-permission priming
- Ask only when clearly needed, ideally when the person first uses the feature. Avoid asking at launch unless the app can't function without the access. — [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- **Purpose string:** a brief, complete, specific sentence in sentence case and active voice, ending with a period. Good example: "The app records during the night to detect snoring sounds." Bad examples: "…needed for a better experience." and "Turn on microphone access." — [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- **Priming (pre-alert) screen:** use one only when extra detail is essential. It has **one button** ("Continue" or "Next") that opens the system alert. There is no second Cancel or Close action unless legally required. The button must not say "Allow", and the screen must not imitate the alert, show an image of the alert, annotate the Allow button, offer incentives, or withhold functionality. — [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- **ATT:** if you track, show the system alert before collecting any data. Never precede it with a misleading custom screen, which can lead to rejection. — [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- The Photos alert offers "Select Photos", "Allow Access to All Photos" and "Don't Allow" (limited library). People can change their choice in Settings > Privacy. — [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- **App Review 5.1.1(ii)/(iv):** paid features must not depend on granting data access. Purpose strings must fully describe the use. Don't manipulate or force consent to unnecessary access; for example, photo posting must not require the microphone. Provide alternatives when consent is declined, such as manual entry or importing from the library. — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Secondary sources report that users instinctively dismiss system popups, and that a priming screen that explains value improves comprehension. No NN/g primary source was reachable for this. — [WebSearch summary of uxcel / vendor sources](https://uxcel.com/lessons/onboarding-734)

#### 4.5 Quiz / personalisation
- Provide reasonable defaults, postpone nonessential setup, and collect user information only when it is needed to start, because that is when onboarding is justified. — [HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding); [NN/g (snippet)](https://www.nngroup.com/articles/mobile-app-onboarding/)
- Don't require personal information unless it is core functionality (5.1.1(v)). Mark optional data clearly and ask for it later. — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/); [HIG Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- For a multi-step flow in a sheet: Cancel (leading) and an inactive Done (trailing) on step 1, Back replacing Cancel on later steps, and Done active only at the end. Never show Cancel, Back and Done together. — [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)

#### 4.6 Camera capture with guidance overlays (incl. face capture)
- Camera views and long multistep flows should be **full-screen modals**, not sheets. — [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Over visually rich backgrounds such as a live camera, use *clear* Liquid Glass for controls, with a 35% dark dim over bright scenes. — [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- Hiding toolbars contextually for distraction-free viewing is acceptable, as long as there is always a reliable way to restore them. — [HIG Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- If camera access is declined, offer an alternative such as importing from the photo library. — [App Review 5.1.1(iv)](https://developer.apple.com/app-store/review/guidelines/); [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- ARKit face tracking can estimate scene lighting from the face itself (`isLightEstimationEnabled` → `ARDirectionalLightEstimate`), which supports "too dark / uneven light" feedback. Faces are detected within 3 m. An app using face tracking must include a privacy policy covering face data. — [ARFaceTrackingConfiguration](https://developer.apple.com/documentation/arkit/arfacetrackingconfiguration)
- Pair audio cues (a capture success sound) with matching haptics, and add visual indicators. — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

#### 4.7 Loading / processing / progress
- Show something as soon as possible, because blank screens look broken. Use placeholders and let people keep working while content loads. For long waits, show tips or feature intros and estimate the remaining time accurately. Use **determinate** indicators when the duration is known and **indeterminate** ones when it isn't. Show an indicator when loading takes more than a moment or two. — [HIG Loading](https://developer.apple.com/design/human-interface-guidelines/loading)
- Under Reduce Motion, reduce automatic and repetitive animations, replace x/y/z transitions with fades, avoid animating into and out of blurs, and be careful with fast or blinking motion. — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

#### 4.8 Results / report
- Keep the information hierarchy consistent at all text sizes, with primary elements near the top. Avoid truncation and stack layouts at large sizes. — [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- Don't use colour alone to convey meaning (for example a good or bad face-shape fit). Pair it with labels or glyphs. — [HIG Color](https://developer.apple.com/design/human-interface-guidelines/color)
- Ask for ratings or purchases only after people have experienced the app. The moment after a valued result is a natural point. — [HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)

#### 4.9 Home / dashboard with tab bar
- The tab bar is for navigation between top-level sections, **not for actions** (use a toolbar for those). It stays visible except under modals. Avoid overflow into "More". Each icon needs a label, a single word where possible, with filled SF Symbols preferred. **Never disable or hide tabs**; explain empty content instead. Use badges only for critical information. — [HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- **iOS 26:** the tab bar floats on Liquid Glass with content showing through. It can minimize on scroll (`TabBarMinimizeBehavior`) and have a bottom accessory (`TabViewBottomAccessoryPlacement`, like Music's MiniPlayer). A dedicated **search tab** sits at the trailing end. Changelog: 28 Jul 2025, 16 Dec 2025, 8 Jun 2026. — [HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Where tabs are customizable, keep the default to 5 or fewer. — [HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Use a large title on the root screen for orientation. It collapses on scroll. — [HIG Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)

#### 4.10 Detail pages
- Use the standard circular Back button with no "Back" text. The title should be short (under 15 characters) or empty if redundant. Put one prominent primary action on the trailing side and extra actions in a More menu. Extend hero imagery under the bars, using the background extension effect where needed. — [HIG Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars); [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout)

#### 4.11 Bottom sheets / modals
- Use sheets for brief, occasional, scoped tasks, not for app navigation. Show **one sheet at a time**; close it before presenting another. Support swipe-down dismissal, confirm with an action sheet if there are unsaved changes, and always provide a visible Cancel or Done. Pair Done with Cancel. Use a grabber on resizable sheets and medium/large detents. Nonmodal sheets suit tools that affect the parent view, like Notes' format sheet. Use an alert or action sheet for a single critical choice. — [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)

#### 4.12 AR / virtual try-on
- See section 5 (ARKit). Controls over live AR should be clear glass with dimming. Camera and AR should be full-screen modals. — [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials); [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Under Reduce Motion, avoid z-axis depth animation and use fades. — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

#### 4.13 Profile / settings
- Keep skipped tutorials reachable from Help, Account or Settings. — [HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- Show "Using Sign in with Apple" and offer account linking. — [HIG Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- **Account deletion in-app is mandatory** if accounts can be created. Provide an easy way to withdraw consent, and to revoke social credentials. — [App Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/)

#### 4.14 Sharing (share sheet, share cards)
- The share sheet is the canonical use of the medium detent, showing the most relevant items first. — [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Social sharing or inviting friends is not core functionality, so it can't justify a mandatory social login. — [App Review 5.1.1(v)](https://developer.apple.com/app-store/review/guidelines/)

#### 4.15 Empty / error / offline states
- Never leave a blank screen; show placeholders. — [HIG Loading](https://developer.apple.com/design/human-interface-guidelines/loading)
- Don't hide or disable tabs when content is unavailable. Explain why the section is empty. — [HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- When permission is denied, provide an alternative path (manual input or import). — [App Review 5.1.1(iv)](https://developer.apple.com/app-store/review/guidelines/)

#### Cross-cutting accessibility
- Label every element for VoiceOver and Voice Control, and test with Accessibility Inspector. Support Dynamic Type to 200%+, Reduce Motion, Increase Contrast and Reduce Transparency. Pair sounds with haptics. — [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility); [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials)

### Inferences
- **Face-scan flow for a visagism app:**
  1. Primer screen with a single "Continue" button.
  2. Camera system alert.
  3. Full-screen camera modal containing: a face-oval guide sized to about 60–70% of the screen width; one live instruction line in Headline/Title 3; a clear-glass close button and help button at least 44 pt; an auto-capture countdown or shutter at least 44 pt (shutters are conventionally about 64–72 pt); lighting feedback driven by ARKit light estimation; distance and centering feedback driven by face anchor pose.
  4. Haptic plus a sound on capture.
  5. Processing screen. Use a determinate progress indicator when steps are known (for example "Measuring proportions 2/4"). Respect Reduce Motion.
- **Results screen:** use a large title, opaque content cards, colour plus text labels for the face-shape classification, a single prominent CTA (try-on or share), and the share sheet at the medium detent.
- **Tab bar:** 3–5 tabs (for example Home, Scan, Try-on, Profile). Don't put the "Scan" action in the tab bar as an action button. Make it a section, or a prominent button on Home, because Apple says tabs are not for actions.
- The priming screen must not say "Allow". Use "Continue". Don't add a "Not now" button unless it is legally needed. This is stricter than many growth-blog playbooks that recommend a two-button primer.

### Gaps
- The HIG pages for Camera/capture UI, Activity views (share sheet), Augmented reality, Notifications permission timing, Feedback/haptics patterns, and Progress indicators (exact sizes) were not fetched within the session budget. Check [HIG Augmented reality](https://developer.apple.com/design/human-interface-guidelines/augmented-reality), [HIG Activity views](https://developer.apple.com/design/human-interface-guidelines/activity-views), [HIG Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics) and [HIG Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators).
- NN/g articles on permission requests and mobile forms, and Baymard research, could not be fetched because the host was blocked. Primary NN/g data on priming opt-in lifts was not obtained, and no reliable statistic should be cited.
- Notifications: the HIG Privacy page does not cover them. Provisional authorization (quiet delivery) is a known iOS option but was not verified this session.
- Share-card image dimensions (for example a 1080x1920 story) are not iOS HIG specs. They come from the social platforms and were not researched.

---

## 5. ARKit face tracking capabilities and limits (for scan and try-on screens)

### Takeaway
`ARFaceTrackingConfiguration` tracks faces within 3 m of the front camera. On iOS 14+ it needs a device with an Apple Neural Engine; before iOS 14 it needed TrueDepth. Each face anchor provides pose, a fitted face mesh, blend-shape expression coefficients, eye transforms and gaze, and the face can serve as a light probe. The commonly cited 52 blend shapes and ~1,220-vertex mesh were not confirmed from a rendered Apple page in this session.

### Cited Findings
- Available on iOS 11+. Detects faces within **3 metres** of the front camera. On iOS 14+ it requires a device with an **Apple Neural Engine**; on iOS 13 and earlier it required a **TrueDepth** camera. Check `isSupported` at runtime. `maximumNumberOfTrackedFaces` and `supportedNumberOfTrackedFaces` support multi-face tracking (no number stated). `isWorldTrackingEnabled` gives the 6DoF device pose when `supportsWorldTracking` is true. Light estimation uses the face as a light probe and returns an `ARDirectionalLightEstimate`. A privacy policy covering face data is required. — [ARFaceTrackingConfiguration](https://developer.apple.com/documentation/arkit/arfacetrackingconfiguration)
- `ARFaceAnchor` provides:
  - `transform`: pose in world coordinates. The face coordinate system is right-handed, in metres, with the origin behind the face, +x to the viewer's right, +y up and +z toward the viewer.
  - `geometry` (`ARFaceGeometry`): a coarse mesh fitted to the face's shape and expression, usable for virtual makeup or tattoos and for *occlusion geometry*.
  - `blendShapes`: a dictionary of named expression coefficients.
  - `leftEyeTransform` / `rightEyeTransform`.
  - `lookAtPoint`: an estimate of gaze direction.

  Face tracking can also run inside a world-tracking session. — [ARFaceAnchor](https://developer.apple.com/documentation/arkit/arfaceanchor)
- Face tracking data falls under ARKit and camera privacy. A camera purpose string is needed. — [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)

### Inferences
- For try-on (glasses, hairstyles, earrings), use the face mesh as occlusion geometry so virtual frames correctly go behind the ears and head. Use `transform` plus the eye transforms to place glasses. Use the light estimate to warn about poor lighting and to light virtual objects.
- For pose checks (frontal versus profile capture), derive yaw, pitch and roll from the anchor's transform. For "keep a neutral expression", check the blend-shape values (for example `jawOpen` and the smile shapes).
- Devices without face tracking support need a fallback. Vision-framework 2D landmarks on any front camera are the standard alternative, though they were not verified this session.

### Gaps
- **52 blend shapes** and **~1,220 vertices / ~2,304 triangles** in `ARFaceGeometry` are widely cited community figures, and match the agent's prior knowledge. The Apple `BlendShapeLocation` and `ARFaceGeometry` pages did not render in this session, so these numbers are unconfirmed here. Verify them on [ARFaceAnchor.BlendShapeLocation](https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapelocation) and [ARFaceGeometry](https://developer.apple.com/documentation/arkit/arfacegeometry). The 0–1 coefficient range was likewise not confirmed.
- The numeric value of `supportedNumberOfTrackedFaces` (commonly 3 on recent devices) was not stated on the page read.
- The minimum chip for face tracking without TrueDepth (often cited as A12) is not named on the page.
