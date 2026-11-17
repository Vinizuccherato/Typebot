# Growth & conversion best practices for the first-run flow (onboarding → scan → results → paywall → home) of a subscription iOS visagism / face-analysis app (as of Nov 2026)

> Research note, written 2026-11-17. Method caveat: in this session the primary vendor sites (revenuecat.com, adapty.io) were **not reachable by direct fetch** (network allowlist), so figures below come from web-search extracts of those pages plus secondary coverage (TechCrunch, PPC Land, law firms, teardown blogs). Each figure is attributed and dated. Verify exact numbers against the original reports before quoting them externally.

## 1. Benchmarks: onboarding completion, trial start, trial-to-paid, install-to-paid, plan mix, price points

### Takeaway
2026 reference points: median install-to-paid (D35) is ~2.9% in Health & Fitness and ~1.5% in Photo & Video. Trial-to-paid is ~38% (H&F) vs ~22% (Photo & Video, the lowest category). More than 80% of trials start on install day. Weekly plans now earn more than half of subscription revenue. Face/looksmax apps cluster at about $3.99–9.99 per week. A visagism app sits between "Lifestyle/H&F self-improvement" and "Photo & Video", so it should plan against the weaker Photo & Video baseline and aim for H&F-like numbers.

### Cited Findings
**RevenueCat – State of Subscription Apps 2026 (115k apps, $16B revenue; published ~Mar 2026)**
- Hard paywalls: median D35 trial-to-paid **10.7%** vs **2.1%** for freemium (~5x). Top 10% of hard-paywall apps reach **38.7%**. — [RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps); [SaaStr summary](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth); [buildmvpfast](https://www.buildmvpfast.com/blog/hard-paywall-vs-free-trial-revenuecat-indie-app-2026). These "10.7%" figures appear to be download→paid-style rates as reported secondhand, not trial→paid among trialists. The metric definition is ambiguous in the secondary sources.
- Trial length: trials of 17+ days show a **42.5%** median trial-to-paid conversion vs **25.5%** for trials of 4 days or less. **46.5%** of apps still use trials of 4 days or less. — [RevenueCat blog: 2026 trends](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026); [RevenueCat: trial length](https://www.revenuecat.com/blog/growth/free-trial-length)
- Health & Fitness (2026): median trial-to-paid **37.7%** (top quartile >51.4%). Median download-to-paid within 35 days **2.9%** (top quartile >6.2%). **82.1%** of trials start on the day of install. 54% of H&F apps use 5–9-day trials. — [Sahha summary of RevenueCat 2026](https://sahha.ai/blog/health-app-monetization-first-month); [tasu.ai](https://tasu.ai/library/trial-to-paid-conversion-rate-benchmark)
- Photo & Video (2026): median trial-to-paid **22.2%**, the lowest category (top quartile >33.1%). D35 install-to-paid **~1.5%**, from a single secondary blog and unverified. — [tasu.ai](https://tasu.ai/library/trial-to-paid-conversion-rate-benchmark); [sahha.ai](https://sahha.ai/blog/health-app-monetization-first-month)
- Day-0 trial starts: RevenueCat reports **82.1%** for H&F and Adapty reports **86.1%**. — [sahha.ai comparison table](https://sahha.ai/blog/health-app-monetization-first-month)
- AI apps (RevenueCat 2026): ~**41% more revenue per payer** but churn **~30% faster**. 12-month retention is **21.1%** for AI apps vs **30.7%** for non-AI. Monthly-plan retention is **6.1%** vs **9.5%**. Weekly-plan retention is **2.5%** vs **1.7%**. Refund rates are higher for AI apps (exact figure truncated in sources; xix.ai says ~20% higher). — [TechCrunch, 2026-03-10](https://techcrunch.com/2026/03/10/ai-powered-apps-struggle-with-long-term-retention-new-report-shows); [PPC Land](https://ppc.land/ai-apps-earn-41-more-per-user-but-churn-30-faster-revenuecat-finds/); [xix.ai](https://xix.ai/ainews/revenuecat-2026-report-ai-app-retention-rate-at-21-churn-30-faster-than-traditional-apps.html)

**Adapty – State of In-App Subscriptions 2026 (16k+ apps, ~$3B revenue)**
- Weekly plans make up **~55.5%** of subscription revenue, up from **43.3% in 2023**. Monthly plans fell from **21.1% to 11.7%**. — [Adapty SOIAS 2026](https://adapty.io/state-of-in-app-subscriptions/); [PPC Land](https://ppc.land/95-of-app-subscription-revenue-goes-to-top-10-adaptys-2026-benchmark-report/); [Airbridge](https://www.airbridge.io/en/blog/weekly-vs-annual-subscription-app)
- Best paywall for 12-month LTV is **weekly + trial**, but the figure varies by source: **$49.27** (Adapty landing page), **$54.50** (PPC Land), **$54.39** (another Adapty page). Weekly with trial reportedly shows **42%** D30 retention vs **23%** without a trial. — [Adapty](https://adapty.io/state-of-in-app-subscriptions/); [Rocketship HQ](https://www.rocketshiphq.com/adapty-subscription-app-benchmark-2025-summary/)
- Weekly plans give the highest LTV in North America, MEA and LATAM. Annual plans win in Europe and APAC. In Lifestyle, annual leads LTV on no-trial setups. — [Adapty mirror](https://adapty-state-of-appsubs.vercel.app/) (provenance uncertain); [Adapty Lifestyle benchmarks](https://adapty.io/blog/lifestyle-app-subscription-benchmarks/)
- Top 10% of apps capture ~95% of revenue. — [PPC Land](https://ppc.land/95-of-app-subscription-revenue-goes-to-top-10-adaptys-2026-benchmark-report/)

**Adapty – State of Paywalls 2026 (78k+ paywalls, 30k+ App Store apps, Oct 2025–Sep 2026)**
- Median US app converts **2.75%** of paywall viewers to paid within 30 days. — [Adapty State of Paywalls](https://adapty.io/state-of-paywalls/)
- Onboarding paywalls convert **~0.85% of views** vs **0.23%** for later (in-app) paywalls. Later paywalls still bring **38%** of subscription revenue. — [Adapty State of Paywalls](https://adapty.io/state-of-paywalls/); [Adapty blog](https://adapty.io/blog/paywall-optimization-tests/)

**Onboarding completion / quiz-to-paywall (case data, self-reported)**
- Cal AI (AI photo-scan calorie app, the closest analogue to a "scan → result" flow): **20–25%** of onboarding completers convert to trial or paid. The offer is a 3-day trial into a **$29/yr** plan. — [Getlatka](https://getlatka.com/blog/how-cal-ai-achieved-35-million-revenue-in-just-one-year) (secondary, self-reported)
- I found no reliable cross-industry benchmark for onboarding-completion rate (see Gaps).

**Face / looksmax app price points**
- UMAX: **$3.99/week** (Fortune, Jul 2024). Over 7M downloads, #36 in US Lifestyle. Roughly **$500k/month** revenue is reported by secondary sites citing Fortune. — [Fortune 2024-07-01](https://www.fortune.com/2024/07/01/looksmaxxing-apps-rate-teen-boys-faces-mental-health); [Techmeme](https://www.techmeme.com/240701/p21); [facerating.ai](https://facerating.ai/blog/umax-alternative-free)
- Looksmaxxing apps in 2026: weekly plans run about **$3.99–$9.99** and monthly plans about **$9.99–$24.99**. LooksMax AI is cited at both $3.99/wk and ~$9.99/wk (conflicting). UMAX's listing says results require a subscription, and the paywall appears after photo upload. — [realworldappeal: looksmaxxing apps compared](https://realworldappeal.com/en/blog/looksmaxxing-apps-compared); [selfmadenewbie](https://selfmadenewbie.com/best-looksmaxxing-apps/); [mogged.link](https://mogged.link/articles/mogged-vs-umax-vs-looksmax-ai) (affiliate-style blogs, low reliability)

### Inferences
- Use these planning numbers for a visagism app: about **80%+ of trials on day 0**, which makes the onboarding paywall the main monetisation moment. Target trial-to-paid of **22% (P&V median) to 38% (H&F median)**, and install-to-paid of **1.5–3% at D35**, with 6% as the top-quartile H&F stretch goal.
- Weekly pricing works for an impulse "see my result" AI app, but AI apps churn fast. Offer a weekly plan plus an annual anchor, and expect EU/BR users to behave differently by region. Brazil is likely closer to LATAM, where weekly does well.
- Price corridor for the category: **~US$3.99–7.99/week** and **~US$29–59.99/year**. Localise the BRL price rather than converting it directly.

### Gaps
- Exact Photo & Video and Lifestyle install-to-trial and D35 install-to-paid figures in the original RevenueCat 2026 tables could not be fetched.
- I found no credible benchmark for **onboarding completion rate** (quiz start → quiz finish) by category. Vendors rarely publish it.
- No audited revenue or plan-mix data for face-analysis or visagism apps specifically. The UMAX figures are from 2024.

## 2. Paywall design: hard vs soft, placement, blurred-result teasers, plan presentation, social proof, trial timelines, A/B evidence

### Takeaway
The evidence favours a **hard paywall (or hard with a downsell) shown at the peak of intent**, at the end of onboarding. With trials and purchases combined, hard paywalls win in 57% of apps (Adapty), and RevenueCat measures roughly 5x higher conversion than freemium. Also keep **in-app paywalls**, which bring 38% of revenue. For iOS in 2026: **no free-trial toggle** (Apple began rejecting toggles in Jan 2026), attach the trial to a plan card, pre-select a plan, and use a transparent "how your trial works" timeline. A "blurred results" teaser is common in face apps but has **no published A/B evidence**.

### Cited Findings
- Hard paywalls perform better in **57%** of apps with trials and purchases combined, yet only **~11%** of apps use one. — [Adapty State of Paywalls 2026](https://adapty.io/state-of-paywalls/); [snappai](https://snappai.co/blog/hard-paywall-vs-freemium)
- Hard paywall median **10.7%** vs freemium **2.1%** (RevenueCat 2026). — [SaaStr](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth)
- Onboarding paywalls convert about 3.7x better per view than later paywalls (0.85% vs 0.23%), but later paywalls still contribute 38% of revenue. — [Adapty State of Paywalls](https://adapty.io/state-of-paywalls/)
- Superwall says many apps capture **>50% of revenue during onboarding**, and argues against skipping the onboarding paywall. — [Superwall best practices](https://superwall.com/blog/superwall-best-practices-winning-paywall-strategies-and-experiments-to)
- Trial length by plan: **3-day trials** perform better on **weekly** plans, and **7-day trials** perform better on **monthly and annual** plans. — [Adapty State of Paywalls](https://adapty.io/state-of-paywalls/)
- Testing hit-rates: 62% of localisation tests, 60% of trial tests and 59% of plan-duration tests increased LTV. Among mid-size apps, **69%** of the top 10% by revenue per view personalise their paywalls, vs 42% of others. — [Adapty State of Paywalls](https://adapty.io/state-of-paywalls/)
- **Annual default:** Superwall's own test plan proposes switching the onboarding default from monthly to annual, targeting a +10% lift in D30 retained ARPU, and recommends judging winners on retained ARPU rather than trial starts. A secondhand claim says a default change moved the plan mix from ~37% to ~63% yearly. — [Superwall: how to A/B test a paywall](https://superwall.com/blog/how-to-ab-test-a-paywall); [Otter Growth](https://ottergrowth.com/notes/paywall-defaults-and-framing) (secondhand, unverified)
- **Trial timeline / reminder (Blinkist):** the redesigned paywall (timeline + reminder before trial end) is reported as **+23% conversion and −55% complaints**. The metric is disputed (trial starts vs paid), and reminder timing is reported as both "2 days before end" and "day 5 of 7". A replication at Slopes saw a **7.8% decrease** in trial→paid. — [RevenueCat: how top apps approach paywalls](https://www-docs.revenuecat.com/blog/growth/how-top-apps-approach-paywalls); [Betterlaunch playbook](https://www.betterlaunch.co/playbooks/mark-kennedy-jeff-bailey-community-4); [Slopes Diaries #39](https://blog.curtisherbert.com/slopes-diaries-39-risky-business/)
- **Free-trial toggle:** Superwall noted toggles can raise trial starts partly because users "may not notice the trial". Since **mid-January 2026** Apple has rejected toggle paywalls under **Guideline 3.1.2**, with no announcement or doc change. The suggested fix is to attach the trial to a specific plan card. — [Superwall](https://superwall.com/blog/superwall-best-practices-winning-paywall-strategies-and-experiments-to); [Adapty: toggle paywall rejected](https://adapty.io/blog/your-toggle-paywall-is-about-to-get-rejected/); [RevenueCat: R.I.P. toggle paywall](https://www.revenuecat.com/blog/growth/rip-toggle-paywall); [Superwall: confirmed Apple rules](https://superwall.com/blog/external-checkout-a-b-testing-and-trial-toggles-confirmed-apples-rules-for-ios)
- **Cal AI funnel structure:** quiz → hard paywall → price anchoring → **downsell** for decliners. Moving **sign-in to the end of onboarding** was the largest single fix for drop-off. — [Sebastian Stef case study](https://sebastianstef.com/resources/cal-ai-case-study); [Getlatka](https://getlatka.com/blog/how-cal-ai-achieved-35-million-revenue-in-just-one-year)
- **Post-scan paywall in face apps:** UMAX puts the paywall right after photo upload, and analysis results require a subscription. — [facerating.ai](https://facerating.ai/blog/umax-alternative-free); [realworldappeal](https://realworldappeal.com/en/blog/looksmaxxing-apps-compared)
- Vendor marketing claims without methodology: +10% trial conversion from opt-in trial tests and +20% from intro-offer tests. — [Superwall homepage](https://superwall.dev/)

### Inferences
- Recommended order for a visagism app: short quiz → camera priming → **scan with a visible "analysis" step** → **partial result reveal** (face shape and one or two free insights, shown for real) → paywall framed as "unlock your full report and plan" → home. This mirrors UMAX's post-upload paywall while staying honest. The free reveal is what makes the paywall feel earned.
- "Blurred results" is defensible only if the blurred content **really exists and is computed**, and the paywall says exactly what unlocks. Blurring a fabricated or generic score is deceptive (see section 6).
- Plan presentation: two or three plans; the annual plan pre-selected with a per-week equivalent and a savings badge; the weekly plan visible as the anchor. Put the trial on one plan card, not a toggle. Add a three-step timeline: today full access, day N−1 reminder, day N charge. The CTA text must match the trial state. Social proof (rating, review count, testimonials) is standard, but I found **no 2026 quantitative evidence** on its lift.
- Judge paywall tests on D30/D35 retained revenue, not trial starts. Blinkist vs Slopes shows trial-start wins often don't carry through to paid.

### Gaps
- No published A/B data on blurred-result teasers, social-proof elements, or the number of plans. Adapty's "pre-selected plan" section could not be read.
- Nielsen Norman Group pages on paywalls and dark patterns were not reached in this session.
- ScreensDesign and Growth.Design teardowns of face apps (UMAX, LooksMax AI, Qoves, FaceApp) were not retrieved.

## 3. Quiz / personalisation funnels: question count, "labour illusion" loaders, personalised plan reveal, commitment devices, risks

### Takeaway
Long quizzes (about 15–30 screens) are standard among top AI-scan apps, and their founders claim even "useless" questions lift conversion through sunk cost and investment. The "labour illusion" has peer-reviewed support (Buell & Norton 2011), with an important limit: visible effort makes people **less** satisfied when the result is poor. Fake delays and fabricated "personalised" plans carry growing legal risk in the EU (Digital Fairness Act proposal, Nov 2026).

### Cited Findings
- Cal AI onboarding: **16 questions across 29 screens** before the paywall, plus **3 iOS permission prompts** (another teardown counts 28 steps). — [ASOitis Cal AI teardown](https://asoitis.com/case-studies/cal-ai); [ScreensDesign Cal AI](https://screensdesign.com/showcase/cal-ai-calorie-tracker)
- Cal AI reports that a question with no effect on the output (diet type) still lifted conversion, attributed to time invested. — [Getlatka](https://getlatka.com/blog/how-cal-ai-achieved-35-million-revenue-in-just-one-year); [X post attributed to the Cal AI founder](https://x.com/tobiadonadon_/status/2112602320529764637)
- **Labour illusion** (Buell & Norton, *Management Science* 57(9), 2011, 5 experiments in online travel and dating): people can prefer sites with longer waits over instant identical results when the work is shown (progress bar, sources searched, intermediate results). Perceived reciprocity mediates the effect. In the **dating experiment, visible effort raised satisfaction for good matches but made users unhappier with poor matches**. — [ResearchGate: Buell & Norton 2011](https://www.researchgate.net/publication/227447718_The_Labor_Illusion_How_Operational_Transparency_Increases_Perceived_Value); [Marketing Week (Shotton)](https://www.marketingweek.com/richard-shotton-labour-illusion/); [BVA Nudge](https://www.bvanudgeconsulting.com/bias-of-the-week/labor-illusion/)
- A design blog claims the authors also tested artificial delays and the effect held. This is unverified against the paper. — [austinlindsay.design](https://austinlindsay.design/insights/labour-illusion-web-design/)
- The EU Digital Fairness Act proposal (2026-11-11) would ban interfaces "likely to deceive or manipulate", with an annex of blacklisted practices including false scarcity, certain pre-selected defaults, and repeated requests to change a choice already made. — [Lexology](https://www.lexology.com/library/detail.aspx?g=bc8008ec-26a8-4528-8235-cc541b35d510); [The Next Web](https://thenextweb.com/news/eu-digital-fairness-act-loot-boxes-dark-patterns)

### Inferences
- For visagism, target **8–15 meaningful questions**: goals, gender expression, hair, glasses, makeup, style preferences, budget for services. Use answers that really change the report or plan, and say so ("we use this to adapt your hairstyle suggestions"). The Cal AI claim about useless questions is self-reported, and padding raises dark-pattern risk.
- A loader during the real AI analysis is good **operational transparency** if it shows actual steps: face detection, landmark mapping, face-shape classification, colour analysis. A **purely fake multi-second delay** is ethically weak and risky under the DFA. Buell & Norton's dating result also predicts a backlash if the reveal disappoints, so the reveal must deliver real, specific value.
- Commitment devices such as a "commit to your glow-up" tap or a plan start date are common. Avoid fake countdown timers and "only X spots" scarcity, which are explicitly targeted by the DFA annex.

### Gaps
- No controlled study found on optimal quiz length for app onboarding. No direct study on loaders in quiz funnels; the 2026 NYU CHI latency study was only seen on a Substack and is unverified.

## 4. Permission priming (camera, notifications) and App Tracking Transparency

### Takeaway
iOS push opt-in sits around **49–56%** on average in 2025, with the top decile around 74%. Contextual pre-prompts and onboarding campaigns raise opt-in meaningfully. ATT opt-in averages about **35%** (Adjust, Q2 2025). The camera prompt is a functional necessity for a scan app, so prime it right before the scan with a privacy promise.

### Cited Findings
- iOS push opt-in: Batch 2025 reports **56%** (down from 58%). Pushwoosh 2025 (600+ apps) reports **56.36%**. Airship medians are **49.4% (2024)** and **48.85% (2025)** on iOS, with the top decile at **74.1%**. — [Batch benchmark](https://batch.com/ressources/etudes/benchmark-notifications-push-crm-mobile); [Pushwoosh 2025](https://www.pushwoosh.com/blog/push-notification-benchmarks/); [Business of Apps push stats](https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/)
- Airship: apps running onboarding campaigns see opt-in rates **up to 40% above** their category average. In-app messages to opted-out users lift opt-in by **14%** on average. — [Business of Apps](https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/); [shno.co](https://www.shno.co/marketing-statistics/push-notification-statistics)
- A vendor glossary claims cold prompts get 30–40% and value pre-prompts 50–70%, with no primary study. — [mwm.ai](https://mwm.ai/glossary/push-notification) (unverified)
- Blinkist's trial-reminder paywall is reported to have driven a large rise in notification opt-in, because the reminder promise gives users a reason to allow notifications. — [B2B Pricing Insights](https://b2bpricinginsights.substack.com/p/4-min-read-how-blinkists-new-paywall)
- ATT: Adjust's industry average is **~35%** among users shown the prompt in Q2 2025 (34.5% in Q2 2024). Gaming leads at ~39%. Lifestyle and social improved YoY. By country, **Brazil leads at ~50%**. Other sources conflict widely by category. — [Adjust: ATT opt-in rates 2025](https://www.adjust.com/blog/att-opt-in-rates-2025); [Business of Apps ATT](https://www.businessofapps.com/data/att-opt-in-rates/)
- Cal AI shows **3 iOS permission prompts** during onboarding. — [ASOitis](https://asoitis.com/case-studies/cal-ai)

### Inferences
- Camera: prime it on a screen right before the scan, covering what is analysed, that the photo is not shared, and how to delete it. Handle denial with a "use a photo from library" fallback and a Settings deep-link.
- Notifications: ask **after value**, for example on the results screen or tied to the trial reminder ("we'll remind you 2 days before your trial ends") and re-scan reminders. This doubles as a transparency feature.
- ATT: only ask if paid UA needs IDFA. Ask late, never before the scan, to avoid stacking prompts. Brazil's comparatively high opt-in (~50%) helps if Brazil is the launch market.

### Gaps
- No public benchmark for **camera-permission acceptance** rates. No category-specific ATT number for Photo & Video or Beauty.

## 5. Retention & engagement loops: progress tracking, re-scans, streaks, share cards, virality, referrals

### Takeaway
Face-analysis apps monetise up front but retain poorly; AI apps keep only ~21% of subscribers at 12 months. Retention has to be designed in: recurring re-scans and progress comparison, plan tasks, and reminders. Virality in looksmax apps has been driven mainly by users posting app screenshots and scores in TikTok videos. Referral mechanics exist (UMAX had one) but are weakly documented.

### Cited Findings
- AI apps: 12-month retention **21.1%** vs **30.7%** for non-AI, and churn ~30% faster (RevenueCat 2026). — [TechCrunch](https://techcrunch.com/2026/03/10/ai-powered-apps-struggle-with-long-term-retention-new-report-shows); [VEED summary](https://www.veed.io/learn/revenuecat-2026-why-ai-apps-churn-fast)
- UMAX's founder credits growth to users showing **screenshots of the app as a backdrop in their own social videos**, and claims 1B+ impressions (a company claim). UMAX had a **referral discount**, which did not work in Fortune's test. — [Fortune 2024-07-01](https://www.fortune.com/2024/07/01/looksmaxxing-apps-rate-teen-boys-faces-mental-health)
- Looksmax hashtags (PSL, mogging, looksmaxxing, mewing) have billions of TikTok views and are linked to incel-adjacent content (University of Portsmouth). — [Univ. of Portsmouth](https://www.port.ac.uk/news-events-and-blogs/news/why-incel-social-media-accounts-are-encouraging-young-people-towards-extreme-looksmaxxing-procedures)
- Psychologists say face-rating apps worsen youth mental-health issues. — [Fortune](https://www.fortune.com/2024/07/01/looksmaxxing-apps-rate-teen-boys-faces-mental-health); [The Star](https://www.thestar.com.my/tech/tech-news/2024/07/03/looksmaxxing-is-exacerbating-the-youth-mental-health-crisis-psychologists-say)
- The EU DFA proposal (Nov 2026) would give users an **off switch for addictive features such as streaks and autoplay**. — [gHacks 2026-11-11](https://www.ghacks.net/2026/11/11/eu-proposes-digital-fairness-act-to-ban-dark-patterns-and-let-users-turn-off-streaks-and-autoplay/)
- Weekly with trial reportedly gives 42% D30 retention vs 23% without a trial (Adapty). — [Rocketship HQ](https://www.rocketshiphq.com/adapty-subscription-app-benchmark-2025-summary/)

### Inferences
- Visagism loops that fit the category:
  - (a) A **"style passport" result card**: face shape, best haircut and glasses frames, colour palette. Make it shareable with a watermark/deep-link. The positive, non-ranking framing is safer than an attractiveness score and more shareable without humiliation.
  - (b) **Try-on/before-after** of haircuts and frames as a recurring reason to open the app.
  - (c) A **re-scan after a change** (new haircut, glasses), tracked in a timeline.
  - (d) **Bring-to-salon** export for barbers and stylists, a B2B2C viral path.
  - (e) **Give-a-week / get-a-week referrals.**
- Avoid numeric "attractiveness" ratings and peer ranking. They drove UMAX's virality but also the mental-health criticism and the regulatory and App Review exposure.
- Make streaks optional and dismissible, anticipating the DFA.

### Gaps
- I found no quantitative data on share-card virality (k-factor, share rate) or referral performance for face/beauty apps, and no re-scan cadence benchmark.

## 6. Apple App Store rules (3.1.2 etc.), recent enforcement, and legal risk (EU, FTC/US)

### Takeaway
App Review has historically required **price to be more prominent than the free trial**. Since **Jan 2026** it rejects **free-trial toggles** under 3.1.2. In the US, the FTC "click-to-cancel" amendments were **vacated (8th Cir., Jul 2025)**; the FTC re-opened rulemaking with an ANPRM in **Mar 2026**, and enforcement continues under ROSCA and ~30 state auto-renewal laws. In the EU, the **online withdrawal button (Dir. 2023/2673) applies from 19 Jun 2026**, and the **Digital Fairness Act** was proposed on **11 Nov 2026**, targeting dark patterns, trial traps, streaks and pre-selected defaults, with fines up to 6% of turnover.

### Cited Findings
**Apple**
- Guideline 3.1.2(c) rejection wording: the subscription "promotes the free trial, introductory pricing, or introductory period … more clearly than" the subscription itself. App Review also requires that the app "clearly describe what the user gets for the price" before asking them to subscribe. — [Apple Dev Forums thread 841626](https://developer.apple.com/forums/thread/841626); [Apple Dev Forums 3.1.2 thread](https://developer.apple.com/forums/thread/768364)
- Older reports (2018–2020): App Review rejected paywalls where "pricing is not the most prominent element". — [Michael Tsai blog](https://mjtsai.com/blog/?p=23748)
- Toggle-paywall rejections since mid-January 2026 under 3.1.2. Apple's rationale is that the design "may prevent users from understanding that they are committing to an auto-renewing subscription". This is iOS-only and still possible on Android/web. — [Adapty](https://adapty.io/blog/your-toggle-paywall-is-about-to-get-rejected/); [RevenueCat](https://www.revenuecat.com/blog/growth/rip-toggle-paywall); [Superwall](https://superwall.com/blog/external-checkout-a-b-testing-and-trial-toggles-confirmed-apples-rules-for-ios)
- Rejections for missing subscription policy links (Terms of Use and Privacy) under 3.1.2. — [Apple Dev Forums 813493](https://developer.apple.com/forums/thread/813493)

**US**
- The 8th Circuit vacated the FTC's amended Negative Option ("click-to-cancel") Rule in **July 2025** (most sources say 8 Jul) on procedural grounds. — [Latham & Watkins](https://www.lw.com/en/insights/eighth-circuit-vacates-ftc-click-to-cancel-rule-days-before-compliance-deadline); [Wiley](https://www.wiley.law/alert-With-Click-to-Cancel-Rule-Now-Vacated-by-8th-Circuit-Whats-Next-for-FTC)
- The FTC restarted rulemaking with an ANPRM in **March 2026** (comments closed ~13 Apr 2026). Enforcement under **ROSCA** continues. A conforming rule restoring the pre-2024 text reportedly took effect on **12 Feb 2026** (91 FR 6507, to verify). — [Gibson Dunn](https://www.gibsondunn.com/ftc-restarts-negative-option-rulemaking-after-eighth-circuit-vacatur-enforcement-under-rosca-continues/); [Jones Day, May 2026](https://www.jonesday.com/en/insights/2026/05/ftc-revives-clicktocancel-rule-new-risks-for-subscription-businesses); [renewalrules.com](https://renewalrules.com/click-to-cancel-rule/ftc-click-to-cancel-rule-vacated)
- About **30 states** have automatic-renewal laws, some stricter than the vacated federal rule. — [Womble Bond Dickinson](https://www.womblebonddickinson.com/us/insights/insights/102ngkw/ftcs-click-to-cancel-rule-is-vacated-but-remember-it-was-not-alone); [subjolt](https://www.subjolt.com/guides/subscription-cancellation-law/)

**EU**
- **Directive (EU) 2023/2673** adds Art. 11a to the Consumer Rights Directive: an online **withdrawal function** for distance contracts with a withdrawal right, applicable from **19 June 2026**. Germany implemented it as § 356a BGB, and some member states were late. — [Hogan Lovells](https://www.hoganlovells.com/en/publications/eu-consumer-protection-law-update-new-mandatory-withdrawal-button-what-online-traders-need-to-know); [Greenberg Traurig, May 2026](https://www.gtlaw.com/en/insights/2026/5/eu-consumer-law-new-withdrawal-button-requirements-for-online-contracts); [Van Bael & Bellis PDF](https://vbb.com/wp-content/uploads/2026/06/8-06-26-The-online-withdrawal-button.pdf)
- **Digital Fairness Act proposal (European Commission, 11 Nov 2026):**
  - bans deceptive or manipulative interfaces, with a blacklist covering false scarcity, certain pre-selected defaults and nagging;
  - requires **reminders before free trials end**, explicit consent before paid contracts start, and online cancellation in a few clicks;
  - gives users an off switch for streaks and autoplay, and requires clear prices including in-app currencies;
  - bans paid loot boxes for minors;
  - fines up to **6%** of worldwide turnover.
  
  It is still a proposal and goes to Parliament and Council. — [Lexology](https://www.lexology.com/library/detail.aspx?g=bc8008ec-26a8-4528-8235-cc541b35d510); [technology.org](https://www.technology.org/2026/11/12/eu-digital-fairness-act-dark-patterns-subscriptions-loot-boxes/); [Europawire press release](https://news.europawire.eu/european-commission-proposes-digital-fairness-act-and-stronger-eu-consumer-law-enforcement/eu-press-release/2026/11/12/15/28/04/187330/); [Engadget](https://www.engadget.com/2313329/europe-wants-to-ban-dark-patterns-in-apps-and-loot-boxes-for-minors/)

### Inferences
- **Paywall compliance checklist for iOS (2026):**
  - The billed price and renewal period are the largest pricing text. The per-week equivalent is secondary.
  - No trial toggle.
  - The CTA states the trial and the post-trial price ("Start 3-day free trial, then R$X/year").
  - Include "Cancel anytime in Settings › Apple ID" plus Terms and Privacy links, and a Restore Purchases button.
  - Describe the deliverables of the subscription concretely.
- Add **trial-end reminders** (push or email) now. They are low-cost, Blinkist links them to fewer complaints, and the DFA would require them.
- Pre-selecting the annual plan is common and supported by A/B tests, but "certain pre-selected defaults" are on the DFA blacklist. Monitor the final text. A defensible pattern is a pre-selected plan with clear per-period pricing, never pre-ticked add-ons.
- Fake countdowns and fake "spots left" are high risk under the DFA. Fake "analysing" delays and fabricated or inflated scores could fit "likely to deceive". Face-rating minors raises extra risk: the mental-health criticism, potential age-gating, and possible scrutiny under Apple's sensitive-content and data rules (not verified here).
- Brazil (likely target market): the CDC (Consumer Defense Code) art. 49 gives a 7-day right of withdrawal for remote purchases. Not researched in this session; verify separately.

### Gaps
- The official Apple App Review Guideline 3.1.2 text and the Apple guidance on face/biometric data (5.1.x) were not fetched directly this session.
- I found no specific Apple enforcement against face-rating apps, and no EU enforcement case against a beauty or face app.
- Brazilian law (CDC, LGPD on biometric data as sensitive personal data) is outside the sources gathered and needs separate research.
