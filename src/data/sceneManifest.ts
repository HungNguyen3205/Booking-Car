export interface LocationInfo {
  id: string;
  name: string;
  province: string;
}

export const SUPPORTED_LOCATIONS: LocationInfo[] = [
  { id: 'da-lat', name: 'Đà Lạt', province: 'Lâm Đồng' },
  { id: 'da-nang', name: 'Đà Nẵng', province: 'Đà Nẵng' },
  { id: 'hue', name: 'Huế', province: 'Thừa Thiên Huế' },
  { id: 'hoi-an', name: 'Hội An', province: 'Quảng Nam' },
  { id: 'quy-nhon', name: 'Quy Nhơn', province: 'Bình Định' },
  { id: 'nha-trang', name: 'Nha Trang', province: 'Khánh Hòa' },
  { id: 'ha-noi', name: 'Hà Nội', province: 'Hà Nội' },
  { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh', province: 'Hồ Chí Minh' },
];

// Exact canonical ID mapping - avoids arbitrary 'includes' searching
export const LOCATION_ALIAS_MAP: Record<string, string> = {
  'da-lat': 'da-lat', 'đà lạt': 'da-lat', 'da lat': 'da-lat', 'dalat': 'da-lat',
  'da-nang': 'da-nang',
  'đà nẵng': 'da-nang',
  'da nang': 'da-nang',
  'danang': 'da-nang',
  'dad': 'da-nang',

  'hue': 'hue',
  'huế': 'hue',
  'thừa thiên huế': 'hue',

  'hoi-an': 'hoi-an',
  'hội an': 'hoi-an',
  'hoi an': 'hoi-an',
  'hoian': 'hoi-an',

  'quy-nhon': 'quy-nhon',
  'quy nhơn': 'quy-nhon',
  'quy nhon': 'quy-nhon',
  'quynhon': 'quy-nhon',
  'uih': 'quy-nhon',

  'nha-trang': 'nha-trang',
  'nha trang': 'nha-trang',
  'nhatrang': 'nha-trang',
  'khánh hòa': 'nha-trang',
  'cxr': 'nha-trang',

  'ha-noi': 'ha-noi',
  'hà nội': 'ha-noi',
  'ha noi': 'ha-noi',
  'hanoi': 'ha-noi',
  'han': 'ha-noi',

  'ho-chi-minh': 'ho-chi-minh',
  'tp. hồ chí minh': 'ho-chi-minh',
  'tp hồ chí minh': 'ho-chi-minh',
  'hồ chí minh': 'ho-chi-minh',
  'sài gòn': 'ho-chi-minh',
  'sai-gon': 'ho-chi-minh',
  'saigon': 'ho-chi-minh',
  'tphcm': 'ho-chi-minh',
  'hcm': 'ho-chi-minh',
  'sgn': 'ho-chi-minh',
};

export function getCanonicalLocationId(input: string): string {
  if (!input) return 'unknown';
  const clean = input.trim().toLowerCase();
  return LOCATION_ALIAS_MAP[clean] || clean;
}

export function getLocationDisplayName(idOrName: string): string {
  const id = getCanonicalLocationId(idOrName);
  const found = SUPPORTED_LOCATIONS.find((loc) => loc.id === id);
  return found ? found.name : idOrName.trim();
}
