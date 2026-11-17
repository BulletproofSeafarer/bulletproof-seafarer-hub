export type Service = { name: string; url: string; purpose: string; mapQuery?: string };
export type ServiceGroup = { id: string; label: string; services: Service[] };

export const serviceGroups: ServiceGroup[] = [
  { id: 'maritime', label: 'Maritime Services', services: [
    { name: 'MARINA', url: 'https://marina.gov.ph', purpose: 'Seafarer certification and maritime administration', mapQuery: 'Maritime Industry Authority Philippines' },
    { name: 'MISMO', url: 'https://online-appointment.marina.gov.ph/', purpose: 'Access MARINA’s online appointment portal' },
    { name: 'SID / SRB appointment (eGovPH)', url: 'https://e.gov.ph/', purpose: 'Find the online appointment channel for your seafarer ID or record book' }
  ] },
  { id: 'medical', label: 'PEME Clinics', services: [
    { name: 'SuperCare', url: 'https://supercare.com.ph/SMSI/', purpose: 'Pre-employment medical exams', mapQuery: 'SuperCare Medical Services Philippines' },
    { name: 'YGEIA', url: 'https://www.ygeiamedicalcenter.com/', purpose: 'Pre-employment medical exams', mapQuery: 'Ygeia Medical Center Philippines' },
    { name: 'Nordic', url: 'https://nordicmedicalclinic.com/customer-portal/', purpose: 'Medical clinic and customer portal', mapQuery: 'Nordic Medical Clinic Philippines' }
  ] },
  { id: 'ofw', label: 'OFW Services', services: [
    { name: 'DMW', url: 'https://dmw.gov.ph', purpose: 'Overseas employment services and advisories', mapQuery: 'Department of Migrant Workers Philippines' },
    { name: 'OWWA', url: 'https://owwa.gov.ph', purpose: 'Overseas worker welfare and membership', mapQuery: 'OWWA office Philippines' },
    { name: 'PhilHealth', url: 'https://www.philhealth.gov.ph', purpose: 'Health insurance membership and benefits', mapQuery: 'PhilHealth office Philippines' },
    { name: 'SSS', url: 'https://www.sss.gov.ph', purpose: 'Social security contributions and benefits', mapQuery: 'SSS branch Philippines' },
    { name: 'Pag-IBIG', url: 'https://www.pagibigfund.gov.ph', purpose: 'Membership, savings and housing services', mapQuery: 'Pag-IBIG Fund branch Philippines' },
    { name: 'OFBank', url: 'https://ofbank.com.ph/', purpose: 'Overseas Filipino banking' }
  ] },
  { id: 'training', label: 'Training Centers', services: [
    { name: 'CREST', url: 'https://www.crestmaritime.ph/index.html', purpose: 'Maritime training courses and schedules', mapQuery: 'CREST Maritime Philippines' },
    { name: 'EXACT', url: 'https://exact-center.com/', purpose: 'Maritime training courses and enrollment', mapQuery: 'EXACT Training Center Philippines' }
  ] },
  { id: 'manning', label: 'Manning Agencies', services: [
    { name: 'Pascor', url: 'https://pacific-ace.com/pascor/about-us/', purpose: 'Crewing agency information', mapQuery: 'Pascor Pacific Ace Philippines' },
    { name: 'Capital Shipping', url: 'https://www.capitalshipmanning.ph/', purpose: 'Crewing agency information', mapQuery: 'Capital Ship Manning Philippines' },
    { name: 'BSM', url: 'https://bsm-csc.ph/', purpose: 'Crew service center information', mapQuery: 'BSM Crew Service Centre Philippines' },
    { name: 'JPhil', url: 'https://www.jphilmarine.com/about', purpose: 'Crewing agency information', mapQuery: 'JPhil Marine Philippines' },
    { name: 'Knutsen', url: 'https://knutsenphilippines.com/', purpose: 'Crewing agency information', mapQuery: 'Knutsen Philippines' }
  ] },
  { id: 'documents', label: 'Document Services', services: [
    { name: 'Passport', url: 'https://www.passport.gov.ph', purpose: 'Book a Philippine passport appointment', mapQuery: 'DFA passport consular office Philippines' },
    { name: 'NBI Clearance', url: 'https://clearance.nbi.gov.ph', purpose: 'Apply for or renew NBI clearance', mapQuery: 'NBI clearance center Philippines' },
    { name: 'PSA', url: 'https://psa.gov.ph', purpose: 'Civil registry documents and certificates', mapQuery: 'PSA civil registry outlet Philippines' }
  ] }
];

export function mapLinks(query: string) {
  const encoded = encodeURIComponent(query);
  return {
    apple: `https://maps.apple.com/?q=${encoded}`,
    google: `https://www.google.com/maps/search/?api=1&query=${encoded}`
  };
}
