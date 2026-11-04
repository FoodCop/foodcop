// Google calls window.gm_authFailure when the Maps script is refused (key or
// API turned off, quota used up), then paints its own "Oops" over each map.
// It can happen before any map page has opened, so the handler is installed in
// <head> (app/layout.tsx) and remembers the failure for later. This file stays
// free of React hooks because the layout is a server component.

export const MAPS_FAILED_EVENT = 'fz-maps-failed';

export const MAPS_HEALTH_SCRIPT = `window.gm_authFailure=function(){window.__fzMapsFailed=true;window.dispatchEvent(new Event('${MAPS_FAILED_EVENT}'));};`;
