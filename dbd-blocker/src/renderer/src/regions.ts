import type { Region } from './types'

export const REGIONS: Region[] = [
  // North America
  { id: 'us-east-1',      name: 'Virginia',    country: 'USA',         continent: 'North America', flag: '🇺🇸', countryCode: 'US', lat: 37.43,  lng: -78.66  },
  { id: 'us-east-2',      name: 'Ohio',        country: 'USA',         continent: 'North America', flag: '🇺🇸', countryCode: 'US', lat: 39.96,  lng: -82.99  },
  { id: 'us-west-1',      name: 'California',  country: 'USA',         continent: 'North America', flag: '🇺🇸', countryCode: 'US', lat: 37.37,  lng: -121.97 },
  { id: 'us-west-2',      name: 'Oregon',      country: 'USA',         continent: 'North America', flag: '🇺🇸', countryCode: 'US', lat: 44.04,  lng: -123.11 },
  { id: 'ca-central-1',   name: 'Montréal',    country: 'Canada',      continent: 'North America', flag: '🇨🇦', countryCode: 'CA', lat: 45.50,  lng: -73.57  },
  // Europe
  { id: 'eu-central-1',   name: 'Frankfurt',   country: 'Germany',     continent: 'Europe',        flag: '🇩🇪', countryCode: 'DE', lat: 50.11,  lng: 8.68    },
  { id: 'eu-west-1',      name: 'Dublin',      country: 'Ireland',     continent: 'Europe',        flag: '🇮🇪', countryCode: 'IE', lat: 53.33,  lng: -6.25   },
  { id: 'eu-west-2',      name: 'London',      country: 'UK',          continent: 'Europe',        flag: '🇬🇧', countryCode: 'GB', lat: 51.52,  lng: -0.11   },
  // Asia Pacific
  { id: 'ap-south-1',     name: 'Mumbai',      country: 'India',       continent: 'Asia Pacific',  flag: '🇮🇳', countryCode: 'IN', lat: 19.08,  lng: 72.88   },
  { id: 'ap-east-1',      name: 'Hong Kong',   country: 'China',       continent: 'Asia Pacific',  flag: '🇭🇰', countryCode: 'HK', lat: 22.39,  lng: 114.11  },
  { id: 'ap-northeast-1', name: 'Tokyo',       country: 'Japan',       continent: 'Asia Pacific',  flag: '🇯🇵', countryCode: 'JP', lat: 35.68,  lng: 139.77  },
  { id: 'ap-northeast-2', name: 'Seoul',       country: 'South Korea', continent: 'Asia Pacific',  flag: '🇰🇷', countryCode: 'KR', lat: 37.57,  lng: 126.98  },
  { id: 'ap-southeast-1', name: 'Singapore',   country: 'Singapore',   continent: 'Asia Pacific',  flag: '🇸🇬', countryCode: 'SG', lat: 1.35,   lng: 103.82  },
  { id: 'ap-southeast-2', name: 'Sydney',      country: 'Australia',   continent: 'Asia Pacific',  flag: '🇦🇺', countryCode: 'AU', lat: -33.87, lng: 151.21  },
  // South America
  { id: 'sa-east-1',      name: 'São Paulo',   country: 'Brazil',      continent: 'South America', flag: '🇧🇷', countryCode: 'BR', lat: -23.55, lng: -46.63  },
]

export const CONTINENTS = ['North America', 'Europe', 'Asia Pacific', 'South America'] as const

export const regionsByContinent = CONTINENTS.map((continent) => ({
  continent,
  regions: REGIONS.filter((r) => r.continent === continent)
}))
