# DANAVA GO — lower homepage editorial refresh

2026-10-27. Builds on main fddcea1; preserve hero, motion and booking flow.

- FeaturedRoutes: one large heritage feature plus two smaller city stories;
  optional fourth route via accessible expand/collapse. Use correct destination
  crops from existing hero landmark banks, replacing mismatched illustrated route
  images. No fabricated prices. Preview updates the existing hero; search opens
  real route results.
- VehicleExperience: open cream/white layout, alpha vehicle photographs shared
  with hero, one segmented selector, four amenities, actual capacity/floor data.
  No nested image card or unsupported rating. CTA returns to the existing search
  form; it does not pretend to apply a vehicle filter.
- BookingSteps: compact three-step line, once-only reveal and reduced motion.
- BenefitsSection: navy split layout with four concise capability links.
- FaqSection: two-column help/accordion, working contact email, honest demo
  storage/payment and operator-specific change/cancellation explanations. No
  blanket refund timing promises. Final CTA returns to search.
- SiteFooter: customer-facing support copy replaces implementation commentary.
- home-editorial.css: shared1280px content width, navy/cream/orange palette,
  consistent spacing, responsive stacks and explicit keyboard focus.

No assets generated, no libraries added. Existing route atlases are reused with
correct SVG crops. No new backend capability, payment integration, cancellation
workflow, interior photography or policy page is implied.

Validation: build/lint passed;96 existing journey integration assertions passed.
After final reduced-motion scrolling and image-contrast adjustments, build/lint
and12 additional browser checks passed: overflow at1440/1280/390/360px, fourth
route image, vehicle tab, FAQ, final CTA, route preview, route search and no runtime
errors. Inspected desktop/mobile screenshots. No claim of measured retention or
conversion improvement. Main bundle ~497kB, no chunk-size advisory on this build.
