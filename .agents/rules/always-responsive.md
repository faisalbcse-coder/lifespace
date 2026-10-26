# Always Build Responsive (Mobile-First)

Applies to every UI feature, component, page, modal and layout.

- Always build fully responsive UI that works on mobile, tablet, laptop and desktop. Never make it laptop/desktop-only.
- Design mobile-first: start with the smallest screen (~320–375px), then scale up with breakpoints.
- No horizontal page overflow at any width. Text, toolbars, tables, cards, modals and menus must wrap, stack, scroll inside their own container, or collapse (e.g. into dropdowns) on small screens.
- Touch-friendly: tap targets at least ~40px, no hover-only interactions (provide tap/click alternatives).
- Use fluid units and flexible layouts (flex/grid, `min-w-0`, `max-w-full`, `clamp()`, `%`/`rem`) instead of fixed pixel widths. Dropdowns/popovers must stay inside the viewport.
- Use responsive images/media and readable font sizes on mobile.
- Before finishing any UI task, check the layout at mobile width as well as desktop, and fix any issue found.
- This rule applies even when the user does not mention mobile or responsiveness.
