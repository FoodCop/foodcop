import { COUNTRIES } from './countries';

// Home's "Explore cities": FUZO's own list, so showing it costs nothing (it
// used to run 17 Google searches + up to 21 address lookups per area, the
// largest share of the search bill; docs/GOOGLE_COST_PLAN.md). Each country's
// food city from countries.ts counts too, so every listed country has one.
// To add a city: [name, lat, lng] under its ISO country code.

type Row = readonly [name: string, lat: number, lng: number];

const CITIES: Record<string, readonly Row[]> = {
  CA: [
    ['Toronto', 43.6532, -79.3832], ['Montreal', 45.5019, -73.5674], ['Vancouver', 49.2827, -123.1207], ['Calgary', 51.0447, -114.0719],
    ['Edmonton', 53.5461, -113.4938], ['Ottawa', 45.4215, -75.6972], ['Winnipeg', 49.8951, -97.1384], ['Quebec City', 46.8139, -71.208],
    ['Hamilton', 43.2557, -79.8711], ['Kitchener', 43.4516, -80.4925], ['London', 42.9849, -81.2453], ['Victoria', 48.4284, -123.3656],
    ['Halifax', 44.6488, -63.5752], ['Oshawa', 43.8971, -78.8658], ['Windsor', 42.3149, -83.0364], ['Saskatoon', 52.1332, -106.67],
    ['Regina', 50.4452, -104.6189], ['Mississauga', 43.589, -79.6441], ['Brampton', 43.7315, -79.7624], ['Surrey', 49.1913, -122.849],
    ['Kelowna', 49.888, -119.496], ['Barrie', 44.3894, -79.6903], ['St. John\'s', 47.5615, -52.7126], ['Niagara Falls', 43.0896, -79.0849],
    ['Guelph', 43.5448, -80.2482], ['Kingston', 44.2312, -76.486], ['Moncton', 46.0878, -64.7782], ['Thunder Bay', 48.3809, -89.2477],
  ],
  US: [
    ['New York', 40.7128, -74.006], ['Los Angeles', 34.0522, -118.2437], ['Chicago', 41.8781, -87.6298], ['Houston', 29.7604, -95.3698],
    ['Phoenix', 33.4484, -112.074], ['Philadelphia', 39.9526, -75.1652], ['San Antonio', 29.4241, -98.4936], ['San Diego', 32.7157, -117.1611],
    ['Dallas', 32.7767, -96.797], ['Austin', 30.2672, -97.7431], ['San Francisco', 37.7749, -122.4194], ['Seattle', 47.6062, -122.3321],
    ['Denver', 39.7392, -104.9903], ['Washington', 38.9072, -77.0369], ['Boston', 42.3601, -71.0589], ['Nashville', 36.1627, -86.7816],
    ['Portland', 45.5152, -122.6784], ['Las Vegas', 36.1699, -115.1398], ['Detroit', 42.3314, -83.0458], ['Atlanta', 33.749, -84.388],
    ['Miami', 25.7617, -80.1918], ['Minneapolis', 44.9778, -93.265], ['New Orleans', 29.9511, -90.0715], ['Tampa', 27.9506, -82.4572],
    ['Orlando', 28.5383, -81.3792], ['Charlotte', 35.2271, -80.8431], ['Pittsburgh', 40.4406, -79.9959], ['Buffalo', 42.8864, -78.8784],
    ['Salt Lake City', 40.7608, -111.891], ['Honolulu', 21.3069, -157.8583], ['Kansas City', 39.0997, -94.5786], ['St. Louis', 38.627, -90.1994],
  ],
  IN: [
    ['New Delhi', 28.6139, 77.209], ['Mumbai', 19.076, 72.8777], ['Bengaluru', 12.9716, 77.5946], ['Hyderabad', 17.385, 78.4867],
    ['Chennai', 13.0827, 80.2707], ['Kolkata', 22.5726, 88.3639], ['Pune', 18.5204, 73.8567], ['Ahmedabad', 23.0225, 72.5714],
    ['Jaipur', 26.9124, 75.7873], ['Lucknow', 26.8467, 80.9462], ['Kanpur', 26.4499, 80.3319], ['Nagpur', 21.1458, 79.0882],
    ['Indore', 22.7196, 75.8577], ['Bhopal', 23.2599, 77.4126], ['Patna', 25.5941, 85.1376], ['Varanasi', 25.3176, 82.9739],
    ['Gorakhpur', 26.7606, 83.3732], ['Prayagraj', 25.4358, 81.8463], ['Ayodhya', 26.7922, 82.1998], ['Agra', 27.1767, 78.0081],
    ['Noida', 28.5355, 77.391], ['Gurugram', 28.4595, 77.0266], ['Chandigarh', 30.7333, 76.7794], ['Amritsar', 31.634, 74.8723],
    ['Ludhiana', 30.901, 75.8573], ['Dehradun', 30.3165, 78.0322], ['Surat', 21.1702, 72.8311], ['Vadodara', 22.3072, 73.1812],
    ['Kochi', 9.9312, 76.2673], ['Thiruvananthapuram', 8.5241, 76.9366], ['Coimbatore', 11.0168, 76.9558], ['Madurai', 9.9252, 78.1198],
    ['Mysuru', 12.2958, 76.6394], ['Visakhapatnam', 17.6868, 83.2185], ['Bhubaneswar', 20.2961, 85.8245], ['Guwahati', 26.1445, 91.7362],
    ['Ranchi', 23.3441, 85.3096], ['Raipur', 21.2514, 81.6296], ['Goa', 15.4909, 73.8278], ['Srinagar', 34.0837, 74.7973],
  ],
  GB: [
    ['London', 51.5074, -0.1278], ['Manchester', 53.4808, -2.2426], ['Birmingham', 52.4862, -1.8904], ['Liverpool', 53.4084, -2.9916],
    ['Leeds', 53.8008, -1.5491], ['Glasgow', 55.8642, -4.2518], ['Edinburgh', 55.9533, -3.1883], ['Bristol', 51.4545, -2.5879],
    ['Cardiff', 51.4816, -3.1791], ['Belfast', 54.5973, -5.9301], ['Newcastle', 54.9783, -1.6178], ['Sheffield', 53.3811, -1.4701],
  ],
  AU: [
    ['Sydney', -33.8688, 151.2093], ['Melbourne', -37.8136, 144.9631], ['Brisbane', -27.4698, 153.0251], ['Perth', -31.9505, 115.8605],
    ['Adelaide', -34.9285, 138.6007], ['Canberra', -35.2809, 149.13], ['Gold Coast', -28.0167, 153.4], ['Hobart', -42.8821, 147.3272],
  ],
  NZ: [['Auckland', -36.8509, 174.7645], ['Wellington', -41.2865, 174.7762], ['Christchurch', -43.5321, 172.6362], ['Queenstown', -45.0312, 168.6626]],
  FR: [['Paris', 48.8566, 2.3522], ['Lyon', 45.764, 4.8357], ['Marseille', 43.2965, 5.3698], ['Bordeaux', 44.8378, -0.5792], ['Nice', 43.7102, 7.262], ['Toulouse', 43.6047, 1.4442], ['Strasbourg', 48.5734, 7.7521]],
  DE: [['Berlin', 52.52, 13.405], ['Munich', 48.1351, 11.582], ['Hamburg', 53.5511, 9.9937], ['Frankfurt', 50.1109, 8.6821], ['Cologne', 50.9375, 6.9603], ['Stuttgart', 48.7758, 9.1829]],
  IT: [['Rome', 41.9028, 12.4964], ['Milan', 45.4642, 9.19], ['Naples', 40.8518, 14.2681], ['Florence', 43.7696, 11.2558], ['Bologna', 44.4949, 11.3426], ['Venice', 45.4408, 12.3155], ['Turin', 45.0703, 7.6869], ['Palermo', 38.1157, 13.3615]],
  ES: [['Madrid', 40.4168, -3.7038], ['Barcelona', 41.3874, 2.1686], ['Valencia', 39.4699, -0.3763], ['Seville', 37.3891, -5.9845], ['Bilbao', 43.263, -2.935], ['San Sebastian', 43.3183, -1.9812]],
  JP: [['Tokyo', 35.6762, 139.6503], ['Osaka', 34.6937, 135.5023], ['Kyoto', 35.0116, 135.7681], ['Yokohama', 35.4437, 139.638], ['Sapporo', 43.0618, 141.3545], ['Fukuoka', 33.5904, 130.4017], ['Nagoya', 35.1815, 136.9066]],
  KR: [['Seoul', 37.5665, 126.978], ['Busan', 35.1796, 129.0756], ['Incheon', 37.4563, 126.7052], ['Daegu', 35.8714, 128.6014], ['Jeju', 33.4996, 126.5312]],
  CN: [['Beijing', 39.9042, 116.4074], ['Shanghai', 31.2304, 121.4737], ['Guangzhou', 23.1291, 113.2644], ['Shenzhen', 22.5431, 114.0579], ['Chengdu', 30.5728, 104.0668], ['Xi\'an', 34.3416, 108.9398]],
  TH: [['Bangkok', 13.7563, 100.5018], ['Chiang Mai', 18.7883, 98.9853], ['Phuket', 7.8804, 98.3923], ['Pattaya', 12.9236, 100.8825], ['Hat Yai', 7.0086, 100.4747], ['Khon Kaen', 16.4322, 102.8236]],
  VN: [['Hanoi', 21.0278, 105.8342], ['Ho Chi Minh City', 10.8231, 106.6297], ['Da Nang', 16.0544, 108.2022], ['Hue', 16.4637, 107.5909]],
  ID: [['Jakarta', -6.2088, 106.8456], ['Bali', -8.4095, 115.1889], ['Bandung', -6.9175, 107.6191], ['Surabaya', -7.2575, 112.7521], ['Yogyakarta', -7.7956, 110.3695]],
  MY: [['Kuala Lumpur', 3.139, 101.6869], ['Penang', 5.4141, 100.3288], ['Johor Bahru', 1.4927, 103.7414], ['Malacca', 2.1896, 102.2501]],
  PH: [['Manila', 14.5995, 120.9842], ['Cebu City', 10.3157, 123.8854], ['Davao City', 7.1907, 125.4553]],
  PK: [['Karachi', 24.8607, 67.0011], ['Lahore', 31.5204, 74.3587], ['Islamabad', 33.6844, 73.0479]],
  BD: [['Dhaka', 23.8103, 90.4125], ['Chittagong', 22.3569, 91.7832]],
  NP: [['Kathmandu', 27.7172, 85.324], ['Pokhara', 28.2096, 83.9856]],
  LK: [['Colombo', 6.9271, 79.8612], ['Kandy', 7.2906, 80.6337]],
  AE: [['Dubai', 25.2048, 55.2708], ['Abu Dhabi', 24.4539, 54.3773], ['Sharjah', 25.3463, 55.4209]],
  MX: [['Mexico City', 19.4326, -99.1332], ['Guadalajara', 20.6597, -103.3496], ['Monterrey', 25.6866, -100.3161], ['Oaxaca', 17.0732, -96.7266], ['Puebla', 19.0414, -98.2063], ['Cancun', 21.1619, -86.8515]],
  BR: [['Sao Paulo', -23.5505, -46.6333], ['Rio de Janeiro', -22.9068, -43.1729], ['Salvador', -12.9777, -38.5016], ['Brasilia', -15.8267, -47.9218], ['Belo Horizonte', -19.9167, -43.9345]],
  TR: [['Istanbul', 41.0082, 28.9784], ['Ankara', 39.9334, 32.8597], ['Izmir', 38.4237, 27.1428], ['Gaziantep', 37.0662, 37.3833]],
  ZA: [['Cape Town', -33.9249, 18.4241], ['Johannesburg', -26.2041, 28.0473], ['Durban', -29.8587, 31.0218]],
};

export type CityEntry = { code: string; name: string; lat: number; lng: number; distanceKm: number };

const toRad = (d: number) => (d * Math.PI) / 180;
export const kmBetween = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const s = Math.sin(toRad(bLat - aLat) / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(toRad(bLng - aLng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
};

const ALL_CITIES = [
  ...Object.entries(CITIES).flatMap(([code, rows]) => rows.map(([name, lat, lng]) => ({ code, name, lat, lng }))),
  ...COUNTRIES.filter((c) => !CITIES[c.code]).map((c) => ({ code: c.code, name: c.city, lat: c.lat, lng: c.lng })),
];

const withDistance = <T extends { lat: number; lng: number }>(list: T[], lat: number, lng: number) =>
  list.map((c) => ({ ...c, distanceKm: Math.round(kmBetween(lat, lng, c.lat, c.lng)) })).sort((a, b) => a.distanceKm - b.distanceKm);

/** The country whose city is closest: good enough for a row of suggestions, and it needs no Google lookup. */
export function nearestCountryCode(lat: number, lng: number): string | null {
  return withDistance(ALL_CITIES, lat, lng)[0]?.code ?? null;
}

/** Cities in the user's country, nearest first. */
export function citiesNear(lat: number, lng: number, limit = 16): { country: { name: string; code: string } | null; cities: CityEntry[] } {
  const code = nearestCountryCode(lat, lng);
  if (!code) return { country: null, cities: [] };
  const name = COUNTRIES.find((c) => c.code === code)?.name;
  return {
    country: name ? { name, code } : null,
    cities: withDistance(ALL_CITIES.filter((c) => c.code === code), lat, lng).slice(0, limit),
  };
}

/** Other countries, nearest first. */
export function countriesNear(lat: number, lng: number, excludeCode: string | null, limit = 16) {
  return withDistance(COUNTRIES.filter((c) => c.code !== excludeCode), lat, lng).slice(0, limit);
}
