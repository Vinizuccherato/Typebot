# Ethical, legal and platform-policy risks of a consumer visagism / facial-analysis app ("facet.") — risk register and design mitigations (as of Nov 2026)

> Risk awareness, not legal advice. Researched 2026-11-17. Source labels:
> - **[verified]**: the claim was seen in search results or a fetched page this session.
> - **[known, not fetched]**: well-established public fact I know, with its canonical URL. I did not open the URL this session, so check it before quoting it as authority.
> - Some hosts could not be reached from this session (artificialintelligenceact.eu, gibsondunn.com, news.cuanschutz.edu), so AI Act recital wording is given from knowledge and flagged.

---

## 1. Biometric and sensitive-data law (Brazil LGPD/ANPD, EU GDPR + AI Act, US BIPA/CUBI/WA/CCPA, minors)

### Takeaway
Treat every face photo and every facial-landmark or geometry vector as **sensitive biometric data** in all target markets. That means specific, highlighted, opt-in consent; purpose limitation; short retention; a published deletion policy; and no third-party reuse. Brazil added a strict minors regime in March 2026 (ECA Digital, enforced by the ANPD, which is now an agency, with fines up to R$50M). Illinois BIPA is still the biggest litigation risk in the US, and virtual try-on and beauty apps are a known target. The EU AI Act transparency duties (Art. 50) apply from 2 Aug 2026 and were **not** postponed by the Digital Omnibus.

### Cited Findings

**Brazil (LGPD, ANPD, ECA Digital)**
- LGPD Art. 5(II) lists "dado biométrico" as **sensitive personal data**. Under Art. 11, consent for sensitive data must be given "de forma específica e destacada, para finalidades específicas" (specific, highlighted, for specific purposes). Other bases are narrow (e.g., fraud prevention / security of the data subject in identification and authentication). Art. 14 requires the child's or adolescent's best interest, and specific consent from a parent or guardian for children. Art. 18 gives data-subject rights, including deletion and revoking consent. — [LGPD text, Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) [known, not fetched]
- The ANPD ran a public "Tomada de Subsídios" on biometric data (sensitive personal data) from **2 Jun to 1 Aug 2025** under item 5 of its 2025–2026 Regulatory Agenda. It had 18 questions in five blocks, including one on facial recognition and emerging technologies. — [gov.br Participa+ page](https://www.gov.br/participamaisbrasil/ts-dados-biometricos); [ANPD opening Technical Note 17/2025](https://www.gov.br/anpd/pt-br/acesso-a-informacao/participacao-social/outras-acoes/ts-01-2025-nota-tecnica-17-de-abertura.pdf/@@display-file/file); [Mattos Filho](https://www.mattosfilho.com.br/unico/anpd-dados-biometricos/) [verified]
- The consultation drew 88 participants and 1,594 contributions. Contributors broadly supported biometrics for fraud prevention but **disagreed on consent, facial recognition, behavioural biometrics and biometrics in AI**. Reports expect a regulation in 2026 covering legal bases, security, impact assessments and limits on facial recognition. **No published draft was found.** — [Convergência Digital](https://convergenciadigital.com.br/governo/anpd-reconhecimento-facial-e-inteligencia-artificial-racham-consulta-sobre-biometria/); [Mobile Time, Dec 2025, "uso banal de biometria"](https://www.mobiletime.com.br/noticias/02/12/2025/anpd-uso-banal-biometria/) [verified]
- The ANPD has publicly criticised the "banal" or trivial use of biometrics (Dec 2025 coverage) and held a webinar on biometric data on 27 Nov 2025. — [Mobile Time](https://www.mobiletime.com.br/noticias/02/12/2025/anpd-uso-banal-biometria/); [Legismap](https://legismap.com.br/conteudos/artigos-e-noticias/anpd-webinario-aborda-tratamento-de-dados-biometricos-27-11-2025) [verified, headline level]
- **ECA Digital (Lei 15.211/2025)** came into force on **17 Mar 2026**. MP 1.319/2025 cut the vacatio legis to six months, and implementing decrees followed on 18 Mar 2026. Key points:
  - Self-declaration is no longer accepted as age verification.
  - App stores and operating systems must provide age signals through a secure API, with data minimisation (Art. 12).
  - Manipulative or compulsive-use design aimed at minors is banned.
  - The ANPD enforces it. It became a regulatory agency under Lei 15.352/2026.
  - Fines go up to R$50M per infraction.
  - Some sources disagree on the sanction date (17 vs 18 Sep 2025).
  — [Machado Meyer](https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/estatuto-digital-da-crianca-e-do-adolescente-lei-n-15-211-2025-entra-em-vigor-em-17-de-marco-de-2026); [Canaltech](https://canaltech.com.br/internet/pontos-para-entender-o-eca-digital-que-entra-em-vigor-nesta-terca-17/); [Data Privacy Brasil analysis of implementing acts](https://www.dataprivacybr.org/wp-content/uploads/2026/03/DPBR_20260324_Analise-dos-atos-normativos-de-implementacao-do-ECA-Digital.pdf); [ComputerWeekly BR](https://www.computerweekly.com/br/reportagen/ECA-Digital-obrigacoes-penalidades-e-o-que-muda-para-plataformas-digitais-no-Brasil) [verified via search summaries]
- Reports say age-assurance requirements for "sensitive content" are being phased in rather than applied in full from day one, and that the age-assessment method is still uncertain. — [ABCdoABC](https://www.abcdoabc.com.br/eca-digital-vigor-2026-indefinicao-idade/) [verified, summary level]
- ANPD Enunciado CD/ANPD nº 1/2023: children's and adolescents' data may be processed on the Art. 7 / Art. 11 legal bases (not only parental consent), always in the child's best interest. — [ANPD](https://www.gov.br/anpd/pt-br) [known, not fetched]

**EU (GDPR + AI Act)**
- GDPR Art. 4(14) defines "biometric data" as data from specific technical processing that allows or confirms **unique identification**. Art. 9(1) prohibits processing biometric data "for the purpose of uniquely identifying a natural person" unless an exception applies, usually **explicit consent** (Art. 9(2)(a)). Face photos can also reveal racial or ethnic origin, which is another Art. 9 category. A DPIA (Art. 35) is expected for systematic processing of sensitive data and innovative technology. — [GDPR Art. 9, gdpr-info.eu](https://gdpr-info.eu/art-9-gdpr/) [known, not fetched]
- Inference from the definition above: geometry used only for style recommendations, never to identify, may fall outside the strict Art. 9 "biometric" definition, as the EDPB discusses in Guidelines 3/2019 on video devices. Regulators and courts read this narrowly, so treat it as Art. 9 data anyway. — [EDPB Guidelines 3/2019](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32019-processing-personal-data-through-video_en) [known, not fetched]
- AI Act Art. 5 bans have applied since **2 Feb 2025**:
  - Art. 5(1)(g): biometric categorisation that infers race, political opinions, trade-union membership, religious or philosophical beliefs, or sex life / sexual orientation.
  - Art. 5(1)(f): emotion recognition in workplaces and education.
  - Annex III(1)(b)–(c) classes other biometric categorisation and emotion recognition as **high-risk**.
  - Art. 50(3) requires deployers of emotion-recognition or biometric-categorisation systems to inform the people exposed.
  — [AI Act, EUR-Lex 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) [known, not fetched; artificialintelligenceact.eu was unreachable]
- AI Act Recital 16 (from knowledge, unverified this session): biometric categorisation does not cover purely **ancillary features tied to another commercial service**. Its examples are filters that categorise facial or body features on online marketplaces so a consumer can preview a product on themselves, and social-network filters that let users add or modify pictures. A visagism app whose core product *is* the facial categorisation (face shape, features) may not qualify for this carve-out. — [Recital 16](https://artificialintelligenceact.eu/recital/16/) [host unreachable; verify]
- **Digital Omnibus** = Regulation (EU) 2026/1744, in force since 27 Jul 2026:
  - Annex III high-risk obligations move to **2 Dec 2027**; Annex I to 2 Aug 2028.
  - **Art. 50 transparency still applies from 2 Aug 2026.**
  - The one exception is a grace period to **2 Dec 2026** for Art. 50(2) machine-readable marking on systems already on the market before 2 Aug 2026.
  - Sources disagree on whether the grace period is wider than Art. 50(2).
  — [Legalithm](https://www.legalithm.com/en/blog/eu-ai-act-what-applies-2-august-2026); [CSA research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-article50-watermarking-deadline/); [Elevate Consult](https://elevateconsult.com/insights/eu-ai-act-article-50-icp-impact/); [aiacto.eu](https://www.aiacto.eu/en/blog/digital-omnibus-ai-act-report-2027) [verified via search; Gibson Dunn page unreachable]

**United States**
- **Illinois BIPA (740 ILCS 14):**
  - Requires a written notice and a **written release** before collection.
  - Requires a **public written retention and destruction schedule**, with destruction when the purpose is met or within 3 years of the last interaction.
  - Bans selling or profiting from biometric data.
  - Private right of action: $1,000 per negligent and $5,000 per intentional or reckless violation.
  — [BIPA statute, ilga.gov](https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57) [known, not fetched]
- **SB 2979 / Public Act 103-0769** (signed 2 Aug 2024) limits damages to $1,000/$5,000 **per person**, not per scan, and accepts electronic signatures as a written release. On 1 Apr 2026 the 7th Circuit held the amendment applies **retroactively** to pending cases. — [SecurePrivacy BIPA 2026 guide](https://secureprivacy.ai/blog/illinois-bipa-2026-guide); [Byte Back Law](https://www.bytebacklaw.com/category/biometric-data/) [verified via search]
- **Face and beauty try-on litigation under BIPA:**
  - Charlotte Tilbury settled for **$2.925M** (2023) and agreed to change its app and site.
  - Louis Vuitton plaintiffs dropped their eyewear try-on BIPA claims.
  - Estée Lauder won dismissal because plaintiffs did not show the scans could identify them.
  - A suit over L'Oréal's ModiFace try-on survived a motion to dismiss (2024).
  - An e.l.f. suit was filed in 2024.
  - A sunglasses try-on case was dismissed under BIPA's health-care exemption (2023).
  — [ClassAction.org](https://www.classaction.org/news/charlotte-tilbury-settles-bipa-class-action-for-2.92-million); [The Fashion Law](https://www.thefashionlaw.com/plaintiffs-drop-bipa-claims-in-louis-vuitton-eyewear-try-on-case/); [FashionNetwork](https://us.fashionnetwork.com/news/Estee-lauder-beats-biometric-class-action-over-virtual-try-on-tool,1593762.html); [Top Class Actions – L'Oréal](https://topclassactions.com/lawsuit-settlements/privacy/bipa/loreal-class-action-says-makeup-companys-virtual-try-on-tool-violates-privacy); [Northwestern JTIP](https://jtip.law.northwestern.edu/2023/11/06/companies-face-massive-biometric-information-privacy-act-bipa-allegations-with-virtual-try-on-technology/) [verified]
- Large earlier BIPA face cases include Facebook tag suggestions ($650M), TikTok ($92M), Snapchat Lenses/filters ($35M, 2022) and Google Photos ($100M). — [Top Class Actions round-up](https://topclassactions.com/lawsuit-settlements/privacy/bipa/data-privacy-highlighted-in-recent-bipa-class-actions-settlements) [partially verified; exact figures from knowledge]
- **Texas CUBI (Bus. & Com. Code §503.001):**
  - Requires notice and consent before capturing a biometric identifier for a commercial purpose.
  - No sale.
  - Destruction within a reasonable time, at most 1 year after the purpose expires.
  - Penalty up to $25,000 per violation, enforced **by the AG only**.
  - Meta settled with Texas for **$1.4B** (30 Jul 2024) over facial-recognition tag suggestions.
  — [Spencer Fane](https://www.spencerfane.com/insight/billion-dollar-biometric-bust-meta-reaches-largest-ag-settlement-in-history-1-4-billion-for-alleged-violations-of-texas-biometric-privacy-law/); [Vinson & Elkins](https://velaw.com/insights/texas-biometrics-case-highlights-need-for-consent-meta-settles-for-1-4-billion) [verified]
- Texas sued Google under CUBI in Oct 2022. A **$1.375B Texas–Google settlement (May 2025)** was reported, but it was **not confirmed** in this session's search results. — [Faegre Drinker](https://www.faegredrinker.com/en/insights/publications/2024/8/texas-attorney-generals-office-zeroes-in-on-data-privacy-and-entities-using-biometric-data) [verified for the suit; settlement unverified]
- **Washington:**
  - RCW 19.375 (biometric identifiers, AG enforcement).
  - **My Health My Data Act** (effective 31 Mar 2024) treats biometric data as "consumer health data". It requires separate consent and has a **private right of action**.
  - **CCPA/CPRA** treats biometric information processed to identify a consumer as "sensitive personal information" and gives consumers a right to limit its use. CPPA regulations on risk assessments and ADMT were finalised in 2025, with obligations phasing in from 2026. Exact dates not verified.
  — [WA AG – MHMDA](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy); [CPPA](https://cppa.ca.gov/regulations/) [known, not fetched]
- **FTC:**
  - Everalbum (2021) required the company to delete photos **and the face-recognition models and algorithms** built from them without proper consent ("algorithmic disgorgement").
  - The 2023 Policy Statement on Biometric Information warns that unsubstantiated accuracy or bias claims and failing to assess foreseeable harms can be unfair or deceptive.
  - Rite Aid (2023) received a 5-year facial-recognition ban for failing to assess bias and accuracy.
  — [FTC Everalbum](https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3172-everalbum-inc-matter); [FTC Biometric Policy Statement](https://www.ftc.gov/legal-library/browse/policy-statement-federal-trade-commission-biometric-information-section-5-federal-trade-commission-act) [known, not fetched]

**Minors**
- **COPPA amended rule:** published 22 Apr 2025, effective 23 Jun 2025, full compliance **22 Apr 2026**. "Personal information" now includes **biometric identifiers, including facial templates / faceprints**. The FTC refused carve-outs for security or age verification. A Feb 2026 FTC policy statement reportedly limits enforcement for data collected solely for age verification (scope unverified). — [Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/ftc-publishes-final-coppa-rule-amendments); [Latham](https://www.lw.com/en/insights/2025/05/ftc-publishes-updates-to-coppa-rule); [Davis Polk](https://www.davispolk.com/index%2Ephp/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect) [verified via search]
- **US state app-store age laws:** Texas SB 2420; Utah enforcement for new accounts from 6 May 2026; Louisiana from 1 Jul 2026. These rely on Apple's Declared Age Range API. — [PPC Land](https://ppc.land/declared-age-range/) [verified via search]

### Inferences
- facet. can plausibly avoid "identification" (it does not need to recognise who someone is), but this is **not a safe harbour**. LGPD, BIPA, CUBI, MHMDA and CCPA all cover face geometry, and plaintiffs have sued beauty try-on tools under BIPA. Estée Lauder won on the identifiability point, but L'Oréal's case went ahead, so outcomes are unpredictable.
- The highest-value design decision is **"no face template leaves the device and nothing persists by default."** That shrinks BIPA, CUBI and COPPA exposure, and it makes the deletion story credible.
- EU: if the app labels attributes that could proxy for ethnicity (skin-tone categories, "ethnic" face types), it risks crossing into Art. 5(1)(g) territory. **Never infer or label race or ethnicity.** Skin undertone for colour palettes should be framed as colour, not as ethnicity. Any "mood" or "expression" reading would trigger Art. 50(3) duties and possible high-risk classification, so drop it.
- Brazil is the primary market. The new ANPD biometric regulation (expected 2026) and ECA Digital enforcement mean facet. should keep an LGPD RIPD (DPIA) ready now.

### Gaps
- No published text yet for the ANPD biometric resolution. Check gov.br/anpd before launch.
- AI Act Recital 16/18 wording could not be fetched (host unreachable). Verify on EUR-Lex.
- The Texas–Google $1.375B CUBI settlement was not confirmed.
- CPPA ADMT and risk-assessment effective dates were not verified.
- No confirmation of whether ECA Digital decrees specifically treat appearance or "beauty" apps as risky content for adolescents.

---

## 2. Apple platform rules (App Store Review Guidelines, age ratings, privacy labels and manifests)

### Takeaway
Apple prohibits using camera or ARKit face data for marketing, advertising or data mining. It requires consent and an easy way to withdraw it, in-app account deletion, validated accuracy for any health-type claims, and honest age ratings. In 2026 Apple also delivers age signals for Brazil through the Declared Age Range API under ECA Digital. A "hot-or-not"-style rating of real people is grounds for removal.

### Cited Findings
- **5.1.2(vi):** data from "depth and/or facial mapping tools (such as ARKit, Camera APIs, or Photo APIs) may not be used for marketing, advertising or use-based data mining, including by third parties." — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) [verified]
- **5.1.2(i):** apps must clearly disclose where personal data is shared with third parties, **"including with third-party AI"**, and get explicit permission first. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/) [verified]
- **5.1.1(ii):** consent is required even for "anonymous" data. Paid functionality must not depend on granting data access. Withdrawing consent must be easy. **5.1.1(v):** in-app account deletion is required if accounts exist. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/) [verified]
- **1.2:** apps used for "objectification of real people (such as 'hot-or-not' voting)… or bullying do not belong on the App Store". **1.1.1** bans discriminatory or mean-spirited content likely to humiliate. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/) [verified]
- **1.4.1:** apps must disclose data and methodology behind health-measurement accuracy claims, and Apple rejects claims it cannot validate. **5.1.1(ix):** apps in regulated healthcare fields or that require sensitive data should be submitted by a legal entity. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/) [verified]
- **2.5.13:** face-based authentication must use LocalAuthentication, not ARKit, with an alternative for users under 13. **2.3.6:** answer the age questionnaire honestly. **1.3:** the Kids Category bans third-party analytics and ads. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/) [verified]
- **New age tiers** 4+/9+/13+/16+/18+ replaced 12+/17+. Developers had to complete the new questionnaire by **31 Jan 2026** or updates would be blocked. — [9to5Mac](https://9to5mac.com/2025/07/24/apple-notifies-developers-of-new-app-store-age-rating-system/); [TechCrunch](https://techcrunch.com/2025/07/25/apple-broadens-app-stores-age-rating-system) [verified]
- **Brazil:** developers can use the updated **Declared Age Range API** to get a user's age category, released with the user's or parent's consent, plus a signal of the age-assurance method used. Apple blocks 18+ downloads in Brazil, Australia and Singapore unless the user is confirmed as an adult, and notes developers may have their own obligations. One developer-forum report says the API returned no data in production (anecdotal). — [Apple Developer News](https://developer.apple.com/news/?id=f5zj08ey); [TechRepublic](https://www.techrepublic.com/article/news-apple-expands-age-verification-api-global-compliance/); [Apple Dev Forums](https://developer.apple.com/forums/thread/828152) [verified]
- **Privacy manifests** (PrivacyInfo.xcprivacy) have been required for new apps and updates that use "required-reason" APIs or listed third-party SDKs since 1 May 2024. App Privacy "nutrition labels" must declare collected data types, including photos and "sensitive info". `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` purpose strings are mandatory. — [Apple privacy manifest docs](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files); [App privacy details](https://developer.apple.com/app-store/app-privacy-details/) [known, not fetched]

### Inferences
- Avoid any "score", "rating" or "rank" of a face. That reduces App Review risk under 1.2/1.1.1 and wellbeing risk.
- Avoid dermatology or "skin health" claims, so that 1.4.1 and 5.1.1(ix) don't apply. Keep the app "style guidance".
- If photos are sent to a cloud LLM or vision API, 5.1.2(i) requires naming that third-party AI and getting explicit permission. On-device (Vision / Core ML) avoids this.
- Probably rate the app 13+ or 16+ (appearance focus, possible body-image sensitivity), and use the Declared Age Range API in Brazil.

### Gaps
- The full text past 5.2.5 and the "last updated" date of the guidelines were not captured.
- Unverified: whether Apple now forces 13+ for apps with social or sharing features (single-source PPC Land report).

---

## 3. Ethics and harm (body image, looksmaxxing, bias, golden-ratio pseudoscience)

### Takeaway
There is credible clinical and academic concern that numeric attractiveness ratings and "looksmaxxing" culture harm teens and young men (appearance anxiety, BDD-like cognition, abusive comparison). Facial-analysis models have documented demographic error gaps. The "golden ratio" has no good evidence as a beauty standard. Rigorous studies of specific rating *apps* are scarce, so precaution is the defensible stance.

### Cited Findings
- **Harm in rating communities:** a 2025 *Sociology of Health & Illness* study found that in nearly every rating thread analysed, at least one participant insulted users, compared them unfavourably, or encouraged self-harm. A 2025 review in *Facial Plastic Surgery & Aesthetic Medicine* argued that looksmaxxing reduces beauty to mathematical symmetry and can build a body schema resembling body dysmorphic disorder. — [Cleveland Clinic summary](https://health.clevelandclinic.org/looksmaxxing); [Wikipedia: Looksmaxxing (secondary)](https://en.wikipedia.org/wiki/Looksmaxxing) [verified via secondary summaries; primary papers not fetched]
- Child Mind Institute clinicians say looksmaxxing content can worsen underlying depression and social anxiety in boys. CU Anschutz experts warn that teens asking AI to rate their faces can increase appearance anxiety. — [Child Mind Institute](https://childmind.org/article/looksmaxxing-and-its-impact-on-boys/); [CU Anschutz](https://news.cuanschutz.edu/news-stories/why-are-teens-asking-ai-to-rate-their-faces) [verified via search; CU page unreachable]
- Clinicians say numeric "PSL"-style scales tie self-worth to a number and deepen insecurity. — [LifeStance Health](https://lifestance.com/blog/looksmaxxing/); [Therapy Group DC](https://therapygroupdc.com/therapist-dc-blog/psychology-of-looksmaxxing/) [verified; practitioner blogs, lower evidence quality]
- The App Store already has many AI "rate/maxx your looks" apps (e.g., LooksMax AI, Maxx AI) with scores and in-app purchases. These are the category facet. will be compared with. — [LooksMax AI listing](https://apps.apple.com/lc/app/looksmax-ai-umax-your-looks/id6476589483); [Maxx AI listing](https://apps.apple.com/us/app/id6754365800) [verified]
- "Snapchat dysmorphia": filtered selfies are pushing cosmetic-surgery requests (Rajanala, Maymone & Vashi, *JAMA Facial Plastic Surgery*, 2018). — [JAMA FPS](https://jamanetwork.com/journals/jamafacialplasticsurgery/fullarticle/2688763) [known, not fetched]
- **Algorithmic bias:** Gender Shades (Buolamwini & Gebru, 2018) found commercial gender classifiers had error rates of up to **34.7% for darker-skinned women vs 0.8% for lighter-skinned men** (20.8–34.7% across vendors). Vendors cut subgroup errors by 17.7–30.4% after the audit. IBM disputed the scale of its own result. NIST's 2019 demographic-effects report also found differentials by sex and race. — [Gender Shades paper](https://www.cs.ucdavis.edu/~koehl/Teaching/ECS089/PDF_files/Gebru_18.pdf); [MIT Media Lab results](https://www-prod.media.mit.edu/projects/gender-shades/results/); [Actionable Auditing, CACM](https://cacm.acm.org/research/actionable-auditing-revisited); [SIA critique (industry)](https://www.securityindustry.org/2021/07/23/what-science-really-says-about-facial-recognition-accuracy-and-bias-concerns/) [verified]
- The 2016 Beauty.AI contest judged by AI picked overwhelmingly light-skinned winners. — [The Guardian, 2016](https://www.theguardian.com/technology/2016/sep/08/artificial-intelligence-beauty-contest-doesnt-like-black-people) [known, not fetched]
- A University of Virginia study found that AI "beauty" outputs were driven mainly by **demographic variation, not mathematical proportion**. It suggests "beauty standards" in models reflect dataset bias. — [EurekAlert release](https://www.eurekalert.org/news-releases/1126122) [verified]
- **Golden ratio:** Marquardt's 2002 "mask" was built from a small sample of actors and models, and its fit to real faces was "statistically significantly invalid". There is no evidence that φ determines facial beauty. Attractiveness effects track **averageness** better. — [The Conversation](https://theconversation.com/does-amber-heard-really-have-the-worlds-most-beautiful-face-an-expert-explains-why-the-golden-ratio-test-is-bogus-187018); [Aesthetic Surgery Journal review](https://dbpia.nl.go.kr/asj/article/44/1/NP1/7269091) [verified]

### Inferences
- Visagism's traditional "ideal face = oval / golden proportions" framing carries both a scientific-credibility risk and a harm risk. Reframe it as descriptive proportions plus style options, with no ideal or target face.
- Brazil is highly diverse, so bias testing across skin tones (e.g., Monk Skin Tone scale), Afro-Brazilian, Asian-Brazilian and Indigenous facial morphology, hair textures, genders and ages is a product-quality issue and a discrimination issue.
- Teen boys are the core looksmaxxing demographic. Marketing language, App Store keywords and the age rating should stay away from that audience.

### Gaps
- No peer-reviewed RCT or longitudinal study of a specific AI face-rating app's mental-health effects was found.
- Major press investigations (Guardian, NYT, Wired) on looksmax apps were not retrieved this session.
- No Brazil-specific data (e.g., CFM/SBCP statements) on appearance apps was found. Brazil has one of the highest cosmetic-surgery volumes in the world (ISAPS), which is worth sourcing separately.

---

## 4. Design mitigations and risk register

### Takeaway
Most legal and ethical risk can be designed out with:
- on-device processing and ephemeral storage;
- separate, granular, opt-in biometric consent, with deletion and a published retention schedule;
- no scores, no ideal face, and no inferences about race, ethnicity, emotion or health;
- age assurance (13+/16+ with Apple's age signals in Brazil);
- validated bias testing with an honest accuracy disclaimer;
- distress safeguards.

### Cited Findings
- Requirements that drive the mitigations:
  - LGPD: specific, highlighted consent for sensitive data. — [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
  - BIPA: written release plus a public retention and destruction schedule. — [BIPA](https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57)
  - CUBI: destroy within 1 year. — [Spencer Fane](https://www.spencerfane.com/insight/billion-dollar-biometric-bust-meta-reaches-largest-ag-settlement-in-history-1-4-billion-for-alleged-violations-of-texas-biometric-privacy-law/)
  - Apple: withdrawable consent, in-app deletion, no face data for ads or mining, third-party AI disclosure. — [Apple Guidelines](https://developer.apple.com/app-store/review/guidelines/)
  - COPPA: faceprints count as personal information. — [Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/ftc-publishes-final-coppa-rule-amendments)
  - ECA Digital: no self-declared age, no compulsive design. — [Machado Meyer](https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/estatuto-digital-da-crianca-e-do-adolescente-lei-n-15-211-2025-entra-em-vigor-em-17-de-marco-de-2026)
- FTC Everalbum shows that models trained on improperly consented photos can be ordered destroyed, so **do not train on user photos without separate opt-in**. — [FTC](https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3172-everalbum-inc-matter) [known, not fetched]
- The Charlotte Tilbury settlement required app changes for BIPA compliance. A consent flow built before launch is cheaper than a retrofit. — [ClassAction.org](https://www.classaction.org/news/charlotte-tilbury-settles-bipa-class-action-for-2.92-million) [verified]
- Apple's Declared Age Range API gives Brazil age categories with consent. — [Apple Developer News](https://developer.apple.com/news/?id=f5zj08ey) [verified]
- Bias audits measurably reduced subgroup error after Gender Shades. — [CACM](https://cacm.acm.org/research/actionable-auditing-revisited) [verified]
- Google's Monk Skin Tone scale is a 10-point scale designed to be more inclusive than Fitzpatrick for ML evaluation. — [skintone.google](https://skintone.google/) [known, not fetched]
- Crisis resources: Brazil **CVV, call 188** (free, 24h); international directory at findahelpline.com. — [CVV](https://cvv.org.br/); [Find A Helpline](https://findahelpline.com/) [known, not fetched]

### Inferences

**Risk register.** L = likelihood, I = impact (H/M/L), judged by the author.

| # | Risk | Where | L | I | Mitigation (design / product) |
|---|------|-------|---|---|---|
| R1 | Collecting face geometry without valid sensitive-data consent | LGPD Art. 11, GDPR Art. 9, BIPA, CUBI, MHMDA, CPRA | M | H | Dedicated biometric consent screen *before* the camera opens. It must be separate from the Terms and not pre-ticked, with plain-language purpose ("calculate proportions to suggest haircuts, glasses, makeup"). Log consent version and timestamp. Add a BIPA-style written release (e-signature/checkbox) for US users. |
| R2 | Retaining photos or templates; no deletion schedule | BIPA §15(a), CUBI 1-yr, LGPD Art. 15–16/18, Apple 5.1.1(v) | M | H | **On-device processing by default** (Apple Vision / ARKit face mesh / Core ML). Discard the raw frame after analysis. Store only derived non-identifying style results (e.g., "oval-ish, warm undertone"). Optional "save my photo" is opt-in and stays local or encrypted. Publish a retention policy (e.g., auto-delete after 30 days or account deletion, never more than 1 year). One-tap "Delete all my face data" plus in-app account deletion. |
| R3 | Sending photos to cloud or third-party AI | Apple 5.1.2(i), LGPD international transfer (Art. 33), GDPR Ch. V | M | H | Prefer on-device. If cloud is needed, name the provider, get explicit per-feature permission, no training, zero-retention contract, and an encrypted transient upload. Update the privacy label and privacy manifest. |
| R4 | Using face data for ads, attribution or analytics | Apple 5.1.2(vi), BIPA no-profit, CUBI no-sale | L–M | H | No third-party ad or analytics SDK may receive camera or face data. Audit SDKs through the privacy manifest. No ATT tracking linked to analysis results. |
| R5 | Training models on user faces | FTC Everalbum (model deletion), LGPD purpose limitation | L | H | Never by default. A separate opt-in research consent if ever. Build training and test sets from licensed, consented, diverse datasets. |
| R6 | Minors using the app; faceprints of under-13s | COPPA (faceprints), LGPD Art. 14, ECA Digital, Apple age ratings | H (teens attracted) | H | Rate 16+ (or at least 13+). Use the Declared Age Range API in Brazil and supported US states. Block under-13s. For 13–17: no social sharing or leaderboards, no "before/after" pressure, no compulsive streaks (ECA Digital). Self-declaration alone is not accepted in Brazil. |
| R7 | Attractiveness score / ranking causing body-image harm | Ethics evidence; Apple 1.2 "hot-or-not", 1.1.1 | H if scores shipped | H | **No numeric beauty score, percentile, "PSL", ranking or ideal-face overlay.** Use descriptive language ("your face is slightly longer than wide → these cuts add width"). Every suggestion is optional and additive ("try"), never corrective ("fix", "flaw", "defect"). No comparisons with celebrities or other users. |
| R8 | Golden-ratio / "ideal proportions" pseudoscience; misleading accuracy | FTC Act §5 (deception), CDC (Brazil consumer code) misleading advertising, Apple 1.4.1 if health-like | M | M | Avoid claiming scientific beauty standards. Explain in "How it works" that proportions are descriptive and that visagism is a stylistic tradition, not science. Show confidence levels and a "may be inaccurate with glasses, beard, low light, angles" notice. |
| R9 | Biased results across skin tones, ethnicities, genders, ages | Discrimination (LGPD Art. 6(IX) non-discrimination), FTC biometric statement, AI Act fairness | M | H | Test landmark and face-shape accuracy and colour-undertone classification stratified by Monk Skin Tone, sex, age band and Brazilian ancestry groups. Set parity thresholds before launch. Publish a short model card / accuracy note. Let users correct the result manually ("not quite — my face is…"). |
| R10 | Inferring sensitive traits (race, ethnicity, emotion, health, gender identity) | AI Act Art. 5(1)(g) and Art. 50(3)/Annex III; GDPR Art. 9; LGPD sensitive data | L–M | H | Never output ethnicity or race labels, "ethnic features", emotion or "mood", or age guesses presented as fact. Skin analysis is limited to colour palette (undertone/contrast) for makeup and clothing. Gender-neutral style catalogue; the user chooses style preferences, nothing is inferred. |
| R11 | Distress or self-harm signals; BDD-vulnerable users | Ethics, duty of care, ECA Digital best-interest | M | H | Positive, non-judgmental microcopy. Session limits and no infinite re-scans (rate-limit re-analysis). Optional "wellbeing" link to CVV 188 (BR) / findahelpline. If the user types "ugly", "hate my face" etc. into a free-text or AI chat, show a supportive message and resources. No surgery or procedure recommendations or upsells. |
| R12 | Insufficient transparency for AI processing | AI Act Art. 50 (from 2 Aug 2026), LGPD Art. 9/20 (review of automated decisions), CPRA ADMT | M | M | Label the app "AI-assisted analysis". Explain inputs and outputs in a layered notice. Offer a "human-readable why" for each suggestion. If AI-generated preview images are shown (e.g., haircut try-on), mark them as synthetic (Art. 50(2) marking). |
| R13 | App Review rejection | Apple 5.1.1/5.1.2/1.2/1.4.1, privacy manifest, purpose strings | M | M | Specific purpose strings (e.g., "facet. uses the camera to measure facial proportions on your device to suggest styles. Photos are not uploaded."). Accurate privacy label ("Sensitive Info / Photos — not linked, not used for tracking" if true). Privacy manifest for all SDKs. Review notes explaining on-device processing. |
| R14 | Regulatory change (ANPD biometric rule 2026, ECA Digital decrees, EU Omnibus) | Brazil, EU | H | M | Keep a RIPD/DPIA. Appoint an Encarregado (DPO) and give their contact in the app. Quarterly regulatory watch. Design consent and age modules to be configurable per jurisdiction. |

**Wording guidelines (style guide for UI copy):**
- Avoid: "score", "rating", "attractiveness", "beauty level", "flaw", "defect", "fix", "correct", "ideal", "perfect", "golden ratio", "symmetry score", "mog", "PSL", "looksmax", "ethnic features".
- Prefer: "proportions", "your face shape tends toward…", "options that highlight…", "you might enjoy…", "balance", "frame", "personal style".
- Present all results as one of several valid options, and let the user dismiss or override them.

**Consent screen checklist:**
1. What is captured (face image, facial landmarks).
2. Why (style suggestions only).
3. Where it is processed (on device / named provider).
4. How long it is kept (e.g., deleted immediately / 30 days).
5. No sale, no ads, no training.
6. How to withdraw and delete.
7. Age requirement.
8. Links to the privacy policy and the biometric retention policy.

### Gaps
- No regulator guidance (ANPD, EDPB, FTC) was found that specifically addresses consumer "style/visagism" facial analysis, so the mitigations are extrapolated from general biometric rules and try-on litigation.
- No published industry standard for "attractiveness-free" wording was found. The wording guide above is the author's synthesis from clinical commentary.
- The effectiveness of crisis-resource prompts in appearance apps was not researched.
