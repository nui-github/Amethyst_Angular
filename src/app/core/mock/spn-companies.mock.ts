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
      { id: 'prod', label: 'ShippingNet Production', url: 'spn.netbay.co.th',     env: 'production' },
      { id: 'uat',  label: 'ShippingNet UAT',        url: 'spn-uat.netbay.co.th', env: 'uat' },
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
      { id: 'prod', label: 'ShippingNet Production', url: 'spn-hp.devnetbay.com', env: 'production' },
      { id: 'uat',  label: 'ShippingNet UAT',        url: 'spn-hp-uat.devnetbay.com', env: 'uat' },
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
      { id: 'prod', label: 'ShippingNet Production', url: 'spn-ap.devnetbay.com',     env: 'production' },
      { id: 'uat',  label: 'ShippingNet UAT',        url: 'spn-ap-uat.devnetbay.com', env: 'uat' },
      { id: 'dev',  label: 'ShippingNet Dev',        url: 'spn-ap-dev.devnetbay.com', env: 'dev' },
    ],
  },
];
