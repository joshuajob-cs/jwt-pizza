# Notes on the views

What each line does, in my own words, so I can rebuild these without help.

## dinerDashboard.tsx

```tsx
HSOverlay.open(document.getElementById('hs-jwt-modal')!);
```

HSOverlay lets you make, open, and close a popup "on top" of the screen.
