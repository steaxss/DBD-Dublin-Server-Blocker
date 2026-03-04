import type { Region } from './types'

export const REGIONS: Region[] = [
  // North America
  { id: 'us-east-1',      name: 'Virginia',    country: 'USA',         continent: 'North America', flag: '🇺🇸' },
  { id: 'us-east-2',      name: 'Ohio',        country: 'USA',         continent: 'North America', flag: '🇺🇸' },
  { id: 'us-west-1',      name: 'California',  country: 'USA',         continent: 'North America', flag: '🇺🇸' },
  { id: 'us-west-2',      name: 'Oregon',      country: 'USA',         continent: 'North America', flag: '🇺🇸' },
  { id: 'ca-central-1',   name: 'Montréal',    country: 'Canada',      continent: 'North America', flag: '🇨🇦' },
  // Europe
  { id: 'eu-central-1',   name: 'Frankfurt',   country: 'Germany',     continent: 'Europe',        flag: '🇩🇪' },
  { id: 'eu-west-1',      name: 'Dublin',      country: 'Ireland',     continent: 'Europe',        flag: '🇮🇪' },
  { id: 'eu-west-2',      name: 'London',      country: 'UK',          continent: 'Europe',        flag: '🇬🇧' },
  // Asia Pacific
  { id: 'ap-south-1',     name: 'Mumbai',      country: 'India',       continent: 'Asia Pacific',  flag: '🇮🇳' },
  { id: 'ap-east-1',      name: 'Hong Kong',   country: 'China',       continent: 'Asia Pacific',  flag: '🇭🇰' },
  { id: 'ap-northeast-1', name: 'Tokyo',       country: 'Japan',       continent: 'Asia Pacific',  flag: '🇯🇵' },
  { id: 'ap-northeast-2', name: 'Seoul',       country: 'South Korea', continent: 'Asia Pacific',  flag: '🇰🇷' },
  { id: 'ap-southeast-1', name: 'Singapore',   country: 'Singapore',   continent: 'Asia Pacific',  flag: '🇸🇬' },
  { id: 'ap-southeast-2', name: 'Sydney',      country: 'Australia',   continent: 'Asia Pacific',  flag: '🇦🇺' },
  // South America
  { id: 'sa-east-1',      name: 'São Paulo',   country: 'Brazil',      continent: 'South America', flag: '🇧🇷' },
]

export const CONTINENTS = ['North America', 'Europe', 'Asia Pacific', 'South America'] as const

export const regionsByContinent = CONTINENTS.map((continent) => ({
  continent,
  regions: REGIONS.filter((r) => r.continent === continent)
}))
