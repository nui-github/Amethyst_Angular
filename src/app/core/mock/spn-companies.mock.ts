export interface SpnBranch {
  id: string;
  name: string;
}

export interface SpnUrl {
  id: string;
  label: string;
  url: string;
  env: 'production' | 'uat' | 'dev';
}

export interface SpnCompany {
  id: string;
  name: string;
  shortName: string;
  branches: SpnBranch[];
  urls: SpnUrl[];
}

export const MOCK_SPN_COMPANIES: SpnCompany[] = [
  {
    id: 'netbay',
    name: 'บริษัท เน็ตเบย์ จำกัด (มหาชน)',
    shortName: 'Netbay',
    branches: [
      { id: 'hq', name: 'สำนักงานใหญ่' },
      { id: 'lp', name: 'สาขาลาดพร้าว' },
    ],
    urls: [
      { id: 'netbay-prod', label: 'Branch-001', url: 'spn.netbay.co.th',     env: 'production' },
      { id: 'netbay-uat',  label: 'Branch-002', url: 'spn-uat.netbay.co.th', env: 'uat' },
    ],
  },
  {
    id: 'healthpharma',
    name: 'บริษัท เฮลท์ฟาร์มา จำกัด',
    shortName: 'HealthPharma',
    branches: [
      { id: 'hq', name: 'สำนักงานใหญ่' },
    ],
    urls: [
      { id: 'hp-prod', label: 'Branch-001', url: 'spn-hp.devnetbay.com',     env: 'production' },
      { id: 'hp-uat',  label: 'Branch-002', url: 'spn-hp-uat.devnetbay.com', env: 'uat' },
    ],
  },
  {
    id: 'agriplus',
    name: 'บริษัท แอกริพลัส จำกัด',
    shortName: 'AgriPlus',
    branches: [
      { id: 'hq',     name: 'สำนักงานใหญ่' },
      { id: 'korat',  name: 'สาขาโคราช' },
      { id: 'chiangmai', name: 'สาขาเชียงใหม่' },
    ],
    urls: [
      { id: 'ap-prod', label: 'Branch-001', url: 'spn-ap.devnetbay.com',     env: 'production' },
      { id: 'ap-uat',  label: 'Branch-002', url: 'spn-ap-uat.devnetbay.com', env: 'uat' },
      { id: 'ap-dev',  label: 'Branch-003', url: 'spn-ap-dev.devnetbay.com', env: 'dev' },
    ],
  },
];

export interface SpnProfile {
  code: string;         // 4-letter uppercase, e.g. "NETB"
  displayName: string;  // full name
  companyId: string;
  urlId: string;
  username: string;
  color: string;
}

export const MOCK_SPN_PROFILES: SpnProfile[] = [
  { code: 'NETB', displayName: 'Netbay Production',     companyId: 'netbay',      urlId: 'netbay-prod', username: 'netbay.user',  color: '#0463EF' },
  { code: 'NETU', displayName: 'Netbay UAT',            companyId: 'netbay',      urlId: 'netbay-uat',  username: 'netbay.test',  color: '#7C3AED' },
  { code: 'HLTH', displayName: 'HealthPharma PROD',     companyId: 'healthpharma',urlId: 'hp-prod',     username: 'hp.admin',     color: '#0D8F61' },
  { code: 'AGRI', displayName: 'AgriPlus Production',   companyId: 'agriplus',    urlId: 'ap-prod',     username: 'agri.user',    color: '#B45309' },
  { code: 'AGRD', displayName: 'AgriPlus Dev',          companyId: 'agriplus',    urlId: 'ap-dev',      username: 'agri.dev',     color: '#6B7280' },
];
