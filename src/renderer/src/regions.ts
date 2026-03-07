import type { Region } from './types'

export const REGIONS: Region[] = [
  // North America
  { id: 'us-east-1',      name: 'Virginia',    country: 'USA',         continent: 'North America', flag: '🇺🇸', countryCode: 'US', lat: 37.43,  lng: -78.66,  timezone: 'America/New_York'    },
  { id: 'us-east-2',      name: 'Ohio',        country: 'USA',         continent: 'North America', flag: '🇺🇸', countryCode: 'US', lat: 39.96,  lng: -82.99,  timezone: 'America/New_York'    },
  { id: 'us-west-1',      name: 'California',  country: 'USA',         continent: 'North America', flag: '🇺🇸', countryCode: 'US', lat: 37.37,  lng: -121.97, timezone: 'America/Los_Angeles'  },
  { id: 'us-west-2',      name: 'Oregon',      country: 'USA',         continent: 'North America', flag: '🇺🇸', countryCode: 'US', lat: 44.04,  lng: -123.11, timezone: 'America/Los_Angeles'  },
  { id: 'ca-central-1',   name: 'Montréal',    country: 'Canada',      continent: 'North America', flag: '🇨🇦', countryCode: 'CA', lat: 45.50,  lng: -73.57,  timezone: 'America/Toronto'      },
  // Europe
  { id: 'eu-central-1',   name: 'Frankfurt',   country: 'Germany',     continent: 'Europe',        flag: '🇩🇪', countryCode: 'DE', lat: 50.11,  lng: 8.68,    timezone: 'Europe/Berlin'        },
  { id: 'eu-west-1',      name: 'Dublin',      country: 'Ireland',     continent: 'Europe',        flag: '🇮🇪', countryCode: 'IE', lat: 53.33,  lng: -6.25,   timezone: 'Europe/Dublin'        },
  { id: 'eu-west-2',      name: 'London',      country: 'UK',          continent: 'Europe',        flag: '🇬🇧', countryCode: 'GB', lat: 51.52,  lng: -0.11,   timezone: 'Europe/London'        },
  // Asia Pacific
  { id: 'ap-south-1',     name: 'Mumbai',      country: 'India',       continent: 'Asia Pacific',  flag: '🇮🇳', countryCode: 'IN', lat: 19.08,  lng: 72.88,   timezone: 'Asia/Kolkata'         },
  { id: 'ap-east-1',      name: 'Hong Kong',   country: 'China',       continent: 'Asia Pacific',  flag: '🇭🇰', countryCode: 'HK', lat: 22.39,  lng: 114.11,  timezone: 'Asia/Hong_Kong'       },
  { id: 'ap-northeast-1', name: 'Tokyo',       country: 'Japan',       continent: 'Asia Pacific',  flag: '🇯🇵', countryCode: 'JP', lat: 35.68,  lng: 139.77,  timezone: 'Asia/Tokyo'           },
  { id: 'ap-northeast-2', name: 'Seoul',       country: 'South Korea', continent: 'Asia Pacific',  flag: '🇰🇷', countryCode: 'KR', lat: 37.57,  lng: 126.98,  timezone: 'Asia/Seoul'           },
  { id: 'ap-southeast-1', name: 'Singapore',   country: 'Singapore',   continent: 'Asia Pacific',  flag: '🇸🇬', countryCode: 'SG', lat: 1.35,   lng: 103.82,  timezone: 'Asia/Singapore'       },
  { id: 'ap-southeast-2', name: 'Sydney',      country: 'Australia',   continent: 'Asia Pacific',  flag: '🇦🇺', countryCode: 'AU', lat: -33.87, lng: 151.21,  timezone: 'Australia/Sydney'     },
  // South America
  { id: 'sa-east-1',      name: 'São Paulo',   country: 'Brazil',      continent: 'South America', flag: '🇧🇷', countryCode: 'BR', lat: -23.55, lng: -46.63,  timezone: 'America/Sao_Paulo'    },
]

export const CONTINENTS = ['North America', 'Europe', 'Asia Pacific', 'South America'] as const

export const regionsByContinent = CONTINENTS.map((continent) => ({
  continent,
  regions: REGIONS.filter((r) => r.continent === continent)
}))
