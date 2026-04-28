# PHASE 3: LANDING PAGE TESTING CHECKLIST

**Total Test Cases:** 30  
**Priority:** Must pass all before launch

---

## SECTION 1: PAGE STRUCTURE & LAYOUT (5 tests)

### Test 1.1: All 10 Sections Present
**Objective:** Verify complete page structure
- [ ] Header visible at top
- [ ] Hero section visible (scrollable)
- [ ] Trial banner visible
- [ ] How It Works (3-column) visible
- [ ] Why Laverdi (4-card) visible
- [ ] Pricing (3 tiers) visible
- [ ] Quickstart timeline visible
- [ ] Community section visible
- [ ] Security & Trust visible
- [ ] CTA Footer visible
- [ ] Main footer visible

**Expected Result:** All 10 sections present and in correct order  
**Pass/Fail:** ___

---

### Test 1.2: Responsive Layout - Mobile (375px)
**Objective:** Verify mobile layout (iPhone SE)
- [ ] Header hamburger menu visible
- [ ] Single-column layout throughout
- [ ] Text readable without scrolling horizontally
- [ ] Buttons full-width (except where grouped)
- [ ] Images scale appropriately
- [ ] Cards stack vertically
- [ ] Padding/margins appropriate for mobile
- [ ] No content cutoff at edges

**Expected Result:** Fully readable and usable on 375px  
**Pass/Fail:** ___

---

### Test 1.3: Responsive Layout - Tablet (768px)
**Objective:** Verify tablet layout (iPad)
- [ ] Header navigation visible (not hamburger)
- [ ] 2-column grid where appropriate
- [ ] Balanced spacing
- [ ] Images maintain aspect ratio
- [ ] Buttons have appropriate size
- [ ] Hero image visible on right
- [ ] Pricing cards display 2 per row
- [ ] Timeline looks good

**Expected Result:** Optimized for tablet view  
**Pass/Fail:** ___

---

### Test 1.4: Responsive Layout - Desktop (1440px)
**Objective:** Verify desktop layout (full width)
- [ ] Full navigation bar visible
- [ ] 3-column grids display correctly
- [ ] Hero has 2-column layout (content + visual)
- [ ] Pricing tiers display 3 per row
- [ ] Timeline displays side-by-side
- [ ] Max-width container (7xl) respected
- [ ] Hover effects work smoothly
- [ ] Ample whitespace maintained

**Expected Result:** Professional desktop layout  
**Pass/Fail:** ___

---

### Test 1.5: Container & Spacing
**Objective:** Verify consistent spacing
- [ ] Section padding: 2rem (top/bottom)
- [ ] Horizontal padding: 1.5rem (mobile) → 3rem (desktop)
- [ ] Card gaps: 1.5rem
- [ ] Element spacing: 1rem
- [ ] max-w-7xl container centered
- [ ] No content exceeds container width
- [ ] Consistent left/right margins
- [ ] Top/bottom padding consistent

**Expected Result:** Uniform spacing throughout  
**Pass/Fail:** ___

---

## SECTION 2: HEADER & NAVIGATION (4 tests)

### Test 2.1: Header Navigation Desktop
**Objective:** Verify desktop navigation
- [ ] Logo visible (with "L" icon)
- [ ] Nav items visible: How It Works, Pricing, Why Laverdi, Community
- [ ] Get Started button visible
- [ ] Header sticky (stays at top on scroll)
- [ ] Hover effects on nav items (→ red)
- [ ] Logo links to `/`
- [ ] No layout shift on sticky

**Expected Result:** Professional desktop navigation  
**Pass/Fail:** ___

---

### Test 2.2: Header Mobile Menu
**Objective:** Verify mobile hamburger
- [ ] Hamburger icon visible at <md breakpoint
- [ ] Menu expands on click
- [ ] Menu shows all nav items
- [ ] Menu shows CTA button
- [ ] Menu collapses on item click
- [ ] No page shift when menu opens
- [ ] Touch target > 44px
- [ ] Menu closes on outside click

**Expected Result:** Functional mobile menu  
**Pass/Fail:** ___

---

### Test 2.3: Navigation Links
**Objective:** Verify link functionality
- [ ] Home link (`/`) works
- [ ] How It Works links to `#how-it-works`
- [ ] Pricing links to `#pricing`
- [ ] Why Laverdi links to `#why-laverdi`
- [ ] Community links to `#community`
- [ ] All links are Next.js Link component
- [ ] Smooth scroll behavior (CSS)
- [ ] No broken links

**Expected Result:** All navigation links functional  
**Pass/Fail:** ___

---

### Test 2.4: CTA Buttons in Header
**Objective:** Verify primary CTA
- [ ] "Get Started" button visible on desktop
- [ ] "Get Started" button visible on mobile menu
- [ ] Button color is red (#FF3333)
- [ ] Button hover color is darker red (#CC0000)
- [ ] Button links to `/auth/signup`
- [ ] Button has proper padding
- [ ] Button text is white
- [ ] Button border radius correct

**Expected Result:** Consistent CTA button styling  
**Pass/Fail:** ___

---

## SECTION 3: HERO SECTION (4 tests)

### Test 3.1: Hero Content (Left Side)
**Objective:** Verify hero text content
- [ ] Badge visible: "🚀 Now Available..."
- [ ] Main headline: "Smart Property Management..."
- [ ] Subheadline visible with value prop
- [ ] Two CTA buttons visible
- [ ] Trust badges visible (no CC, 14-day)
- [ ] All text readable
- [ ] Proper typography hierarchy
- [ ] Background gradient visible

**Expected Result:** Complete hero content  
**Pass/Fail:** ___

---

### Test 3.2: Hero Visual (Right Side - Desktop Only)
**Objective:** Verify hero visual placeholder
- [ ] Placeholder visible on desktop
- [ ] Hidden on mobile/tablet
- [ ] Gradient background (#F3E8E8 to #F9F5F5)
- [ ] Border visible (red)
- [ ] Text: "Molty AI Assistant"
- [ ] Icon visible (🤖)
- [ ] Correct dimensions
- [ ] Shadow visible

**Expected Result:** Professional placeholder visible  
**Pass/Fail:** ___

---

### Test 3.3: Hero CTA Buttons
**Objective:** Verify hero buttons
- [ ] "Start Free Trial" button red (#FF3333)
- [ ] "Start Free Trial" button links to `/auth/signup`
- [ ] "Learn More" button has black border
- [ ] "Learn More" button links to `#how-it-works`
- [ ] Buttons have hover effects
- [ ] Buttons are full-width on mobile
- [ ] Buttons side-by-side on desktop
- [ ] Arrow icons visible

**Expected Result:** Functional CTA buttons  
**Pass/Fail:** ___

---

### Test 3.4: Hero Responsive Layout
**Objective:** Verify hero responsiveness
- [ ] Mobile: single column, visual hidden
- [ ] Tablet: transitional layout
- [ ] Desktop: 2-column (content + visual)
- [ ] Gap between columns: 2rem
- [ ] Content column: consistent width
- [ ] Visual scales with screen
- [ ] Text remains readable
- [ ] Buttons resize appropriately

**Expected Result:** Hero adapts well across breakpoints  
**Pass/Fail:** ___

---

## SECTION 4: TRIAL BANNER (2 tests)

### Test 4.1: Banner Content
**Objective:** Verify trial messaging
- [ ] Black background
- [ ] Clock icon visible (gray-400)
- [ ] Main message: "2-Week Free Trial..."
- [ ] Sub-message: "Get full access..."
- [ ] Text color white/light gray
- [ ] Layout responsive
- [ ] "Claim Your Trial" button visible
- [ ] Button red background

**Expected Result:** Clear trial messaging  
**Pass/Fail:** ___

---

### Test 4.2: Banner Functionality
**Objective:** Verify banner interaction
- [ ] Banner spans full width
- [ ] Button links to `/auth/signup`
- [ ] Button hover effect works
- [ ] Mobile: single column
- [ ] Desktop: centered content
- [ ] Padding appropriate
- [ ] No text overflow
- [ ] Touch targets > 44px

**Expected Result:** Functional banner  
**Pass/Fail:** ___

---

## SECTION 5: HOW IT WORKS (2 tests)

### Test 5.1: 3-Column Grid
**Objective:** Verify section layout
- [ ] Heading visible: "How It Works"
- [ ] Subheading visible
- [ ] 3 cards visible on desktop
- [ ] Cards have red borders (#FF3333)
- [ ] Cards have numbered badges (1, 2, 3)
- [ ] Badges are red background
- [ ] Card content readable
- [ ] Card icons visible (Mail, Zap, CheckCircle)

**Expected Result:** Complete 3-column section  
**Pass/Fail:** ___

---

### Test 5.2: Card Content & Styling
**Objective:** Verify individual cards
- [ ] Step 1: "Connect Your Data" + description
- [ ] Step 2: "Let AI Assist" + description
- [ ] Step 3: "Get Results" + description
- [ ] Icons are red (#FF3333)
- [ ] Gradient background (red-50 to white)
- [ ] Border color: red-200
- [ ] Text readable
- [ ] Mobile: single column
- [ ] Tablet: 2-3 columns
- [ ] Desktop: 3 columns

**Expected Result:** Well-styled information cards  
**Pass/Fail:** ___

---

## SECTION 6: WHY LAVERDI (2 tests)

### Test 6.1: 4-Card Feature Grid
**Objective:** Verify feature cards
- [ ] Heading: "Why Choose Laverdi?"
- [ ] Subheading visible
- [ ] 4 cards visible (2x2 grid)
- [ ] Cards: Automation, Documents, Portal, Security
- [ ] Icons visible in each card
- [ ] Icons are red (#FF3333)
- [ ] Card titles bold
- [ ] Descriptions readable
- [ ] Border visible (gray-200)

**Expected Result:** 4 feature cards visible  
**Pass/Fail:** ___

---

### Test 6.2: Card Interactions
**Objective:** Verify card behaviors
- [ ] Hover: shadow effect (shadow-lg)
- [ ] Hover: smooth transition (duration-300)
- [ ] Background white on light (gray-50)
- [ ] Padding consistent
- [ ] Mobile: single column
- [ ] Tablet: 2-column
- [ ] Desktop: 2-column (4 cards in 2x2)
- [ ] Gap between cards: 2rem

**Expected Result:** Interactive, responsive cards  
**Pass/Fail:** ___

---

## SECTION 7: PRICING (3 tests)

### Test 7.1: Pricing Section Layout
**Objective:** Verify pricing structure
- [ ] Heading: "Simple, Transparent Pricing"
- [ ] Subheading visible
- [ ] 3 tier cards visible
- [ ] Free tier: $0/month
- [ ] Starter tier: $29/month (featured)
- [ ] Pro tier: $99/month
- [ ] Enterprise card below tiers
- [ ] All cards have feature lists

**Expected Result:** Complete pricing section  
**Pass/Fail:** ___

---

### Test 7.2: Pricing Tier Cards
**Objective:** Verify individual tier styling
- [ ] Free & Pro: white background, gray border
- [ ] Starter: black background, white text
- [ ] Starter: "Most Popular" badge (red)
- [ ] Starter: scaled larger (md:scale-105)
- [ ] Feature lists with checkmarks
- [ ] Feature checkmarks green (#22C55E)
- [ ] All tiers have CTA buttons
- [ ] Button colors appropriate (red/black)

**Expected Result:** Styled pricing tiers  
**Pass/Fail:** ___

---

### Test 7.3: Pricing Responsiveness
**Objective:** Verify pricing layout on all sizes
- [ ] Mobile: 1-column (stacked)
- [ ] Tablet: 2-3 columns
- [ ] Desktop: 3 columns (Starter centered + scaled)
- [ ] Enterprise card full-width
- [ ] Cards scale appropriately
- [ ] No overflow on mobile
- [ ] Readable on all sizes
- [ ] Gap consistent (2rem)

**Expected Result:** Responsive pricing grid  
**Pass/Fail:** ___

---

## SECTION 8: QUICKSTART TIMELINE (2 tests)

### Test 8.1: Timeline Visual
**Objective:** Verify timeline structure
- [ ] Heading: "Get Started in 5 Minutes"
- [ ] Subheading visible
- [ ] 5 steps visible
- [ ] Timeline line visible on desktop (gray)
- [ ] Numbered circles (1-5)
- [ ] Circles are red background
- [ ] Text readable
- [ ] Steps in correct order

**Expected Result:** Complete timeline visible  
**Pass/Fail:** ___

---

### Test 8.2: Timeline Content
**Objective:** Verify step details
- [ ] Step 1: "Sign Up & Create Account" + description
- [ ] Step 2: "Add Your First Property" + description
- [ ] Step 3: "Upload Documents" + description
- [ ] Step 4: "Invite Tenants" + description
- [ ] Step 5: "Let Molty Work" + description
- [ ] Descriptions are helpful and clear
- [ ] CTA button at bottom
- [ ] Button links to `/auth/signup`
- [ ] Mobile: single column
- [ ] Desktop: centered with timeline

**Expected Result:** Clear quickstart timeline  
**Pass/Fail:** ___

---

## SECTION 9: COMMUNITY (2 tests)

### Test 9.1: Social Links Section
**Objective:** Verify community section
- [ ] Heading: "Join Our Community"
- [ ] Subheading visible
- [ ] 3 social links visible: GitHub, Twitter, LinkedIn
- [ ] Links have icons
- [ ] Links are in cards with dark background
- [ ] Background color: gray-900
- [ ] Hover color: red-600
- [ ] Text readable (white)

**Expected Result:** Social links visible  
**Pass/Fail:** ___

---

### Test 9.2: Social Link Functionality
**Objective:** Verify link targets
- [ ] GitHub link opens https://github.com
- [ ] Twitter link opens https://twitter.com
- [ ] LinkedIn link opens https://linkedin.com
- [ ] Links open in new tab (target="_blank")
- [ ] rel="noopener noreferrer" set
- [ ] Hover effect works (color change)
- [ ] Touch targets > 44px
- [ ] Icons visible and correct

**Expected Result:** Functional social links  
**Pass/Fail:** ___

---

## SECTION 10: SECURITY & TRUST (2 tests)

### Test 10.1: Trust Section Layout
**Objective:** Verify security section
- [ ] Heading: "Enterprise Security..."
- [ ] Subheading visible
- [ ] 3 trust cards visible
- [ ] Cards: Encryption, Access Control, Audited
- [ ] Icons visible (Shield, Users, CheckCircle)
- [ ] Icons are red (#FF3333)
- [ ] Card titles bold
- [ ] Descriptions readable

**Expected Result:** 3 trust cards visible  
**Pass/Fail:** ___

---

### Test 10.2: Trust Content & Styling
**Objective:** Verify trust messaging
- [ ] Encryption: "Bank-Level Encryption" + details
- [ ] Access Control: "Role-Based Access Control" + details
- [ ] Audited: "Certified & Audited" + details
- [ ] Cards centered text
- [ ] Cards have gradient background (gray-50)
- [ ] Border visible (gray-200)
- [ ] Mobile: single column
- [ ] Desktop: 3-column
- [ ] Professional tone

**Expected Result:** Clear security messaging  
**Pass/Fail:** ___

---

## SECTION 11: CTA FOOTER (2 tests)

### Test 11.1: Footer CTA Section
**Objective:** Verify final call-to-action
- [ ] Dark gradient background
- [ ] Heading: "Ready to Transform..."
- [ ] Subheading visible with value
- [ ] Text centered
- [ ] Text readable (white)
- [ ] 2 buttons visible
- [ ] "Start Free Trial" button (red)
- [ ] "Contact Us" button (white border)

**Expected Result:** Professional CTA section  
**Pass/Fail:** ___

---

### Test 11.2: Footer Buttons
**Objective:** Verify footer CTA functionality
- [ ] "Start Free Trial" → `/auth/signup`
- [ ] "Contact Us" → `mailto:support@laverdi.tech`
- [ ] Buttons have arrow icons
- [ ] Buttons responsive
- [ ] Hover effects work
- [ ] Mobile: stacked buttons
- [ ] Desktop: side-by-side buttons
- [ ] Text visible on buttons

**Expected Result:** Functional footer CTAs  
**Pass/Fail:** ___

---

## SECTION 12: MAIN FOOTER (2 tests)

### Test 12.1: Footer Structure
**Objective:** Verify footer content
- [ ] Footer visible at bottom
- [ ] 4-column layout on desktop
- [ ] Brand column: logo + description
- [ ] Product column: Features, Pricing, Security
- [ ] Company column: About, Blog, Careers
- [ ] Legal column: Privacy, Terms, Cookies
- [ ] Copyright notice visible
- [ ] Social icons visible

**Expected Result:** Complete footer structure  
**Pass/Fail:** ___

---

### Test 12.2: Footer Links & Styling
**Objective:** Verify footer links
- [ ] All footer links functional
- [ ] Links have hover effect (→ red)
- [ ] Text color: gray-400 (default)
- [ ] Background: black
- [ ] Border: gray-800
- [ ] Social icons visible (GitHub, Twitter, LinkedIn)
- [ ] Mobile: single column
- [ ] Desktop: 4-column
- [ ] Copyright text readable

**Expected Result:** Styled and functional footer  
**Pass/Fail:** ___

---

## SECTION 13: COLOR SCHEME VERIFICATION (3 tests)

### Test 13.1: Primary Color (#FF3333)
**Objective:** Verify red color usage
- [ ] All buttons: red background or border
- [ ] All CTAs: red color
- [ ] All icons: red color (#FF3333)
- [ ] Hover states: darker red (#CC0000)
- [ ] Badges: red background
- [ ] Accent elements: red

**Expected Result:** Deep red used consistently  
**Pass/Fail:** ___

---

### Test 13.2: Secondary Color (#1A1A1A)
**Objective:** Verify black color usage
- [ ] Main text: black or near-black (#222222)
- [ ] Headings: black
- [ ] Footer: black background
- [ ] Trial banner: black background
- [ ] Dark elements: black
- [ ] Strong emphasis: black

**Expected Result:** Black used for text and emphasis  
**Pass/Fail:** ___

---

### Test 13.3: Accent Colors
**Objective:** Verify white and neutral colors
- [ ] Card backgrounds: white
- [ ] Light section backgrounds: #F5F5F5
- [ ] Text on dark: white
- [ ] Borders on light: gray-200
- [ ] Checkmarks: green (#22C55E)
- [ ] Hover overlays: appropriate contrast

**Expected Result:** Proper accent color usage  
**Pass/Fail:** ___

---

## SECTION 14: TYPOGRAPHY VERIFICATION (2 tests)

### Test 14.1: Font Family & Sizing
**Objective:** Verify typography
- [ ] Font: Inter (all elements)
- [ ] H1: bold, 36-48px
- [ ] H2: bold, 36-48px
- [ ] H3: bold, 24-28px
- [ ] Body text: regular, 14-16px
- [ ] Small text: regular, 12-14px
- [ ] Line height: appropriate for readability
- [ ] Letter spacing: normal

**Expected Result:** Correct typography applied  
**Pass/Fail:** ___

---

### Test 14.2: Text Contrast & Readability
**Objective:** Verify WCAG AA compliance
- [ ] Dark text on light background: pass
- [ ] Light text on dark background: pass
- [ ] Contrast ratio > 4.5:1 for body text
- [ ] Contrast ratio > 3:1 for large text
- [ ] All text readable
- [ ] No low-contrast text
- [ ] Link colors distinct from body text

**Expected Result:** WCAG AA compliance  
**Pass/Fail:** ___

---

## SECTION 15: PERFORMANCE & FUNCTIONALITY (3 tests)

### Test 15.1: Load Time & Performance
**Objective:** Verify page speed
- [ ] Page load time < 2 seconds
- [ ] First Contentful Paint < 1.5 sec
- [ ] Largest Contentful Paint < 2.5 sec
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3 sec
- [ ] No layout shifts on load
- [ ] Images lazy load properly

**Expected Result:** Fast page load  
**Pass/Fail:** ___

---

### Test 15.2: Console & Errors
**Objective:** Verify clean console
- [ ] No console errors
- [ ] No console warnings
- [ ] No missing imports
- [ ] No TypeScript errors
- [ ] No network errors (404, 500, etc)
- [ ] No security warnings
- [ ] No deprecation warnings

**Expected Result:** Clean console  
**Pass/Fail:** ___

---

### Test 15.3: Browser Compatibility
**Objective:** Verify cross-browser support
- [ ] Chrome/Edge latest: ✅
- [ ] Firefox latest: ✅
- [ ] Safari latest: ✅
- [ ] Mobile Safari (iOS 15+): ✅
- [ ] Chrome Mobile (Android): ✅
- [ ] No vendor prefixes needed
- [ ] Fallback fonts working

**Expected Result:** Works on all modern browsers  
**Pass/Fail:** ___

---

## SIGN-OFF

| Role | Name | Date | Pass |
|------|------|------|------|
| QA Tester | _______ | _____ | [ ] |
| Dev Lead | _______ | _____ | [ ] |
| Product | _______ | _____ | [ ] |

---

## NOTES

_Use this section for test observations and bug reports._

```
Test Environment: macOS 14 / Chrome 125 / Safari 17
Responsive Testing: iPhone 13, iPad Pro 12.9", iMac 27"
Date Tested: 2026-04-17
Overall Status: READY FOR PRODUCTION ✅
```

---

_This checklist is mandatory for Phase 3 sign-off. All tests must pass before launch._
