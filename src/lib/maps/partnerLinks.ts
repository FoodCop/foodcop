// Book / order hand-offs on restaurant feed cards (client list #5, 2026-11-04).
// OpenTable and Uber Eats share no public availability data without a partner
// agreement, so these open a search for the restaurant on their sites. They
// cost nothing and make no call until tapped. Replace with real availability
// if a partner API is signed.

export function partnerLinks(placeName: string, lat?: number | null, lng?: number | null) {
  const openTable = new URLSearchParams({ term: placeName });
  if (lat != null && lng != null) {
    openTable.set('latitude', String(lat));
    openTable.set('longitude', String(lng));
  }
  return {
    openTable: `https://www.opentable.com/s?${openTable.toString()}`,
    uberEats: `https://www.ubereats.com/search?${new URLSearchParams({ q: placeName }).toString()}`,
  };
}
