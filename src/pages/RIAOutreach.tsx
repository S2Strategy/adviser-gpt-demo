import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Home, MapPin, Phone, Mail, ExternalLink, Building2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VaultSidebar } from '@/components/VaultSidebar';
import { ChatInput } from '@/components/ChatInput';

interface RIAFirm {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  logo?: string;
  assetsUnderManagement: string;
  yearFounded: number;
  specialties: string[];
  crdNumber: string;
}

// Mock data for RIA firms - in a real app, this would come from an API
const mockRIAFirms: RIAFirm[] = [
  {
    id: '1',
    name: 'Alpha Investment Advisors',
    contactPerson: 'Sarah Johnson',
    email: 'sarah.johnson@alphainvest.com',
    phone: '(555) 123-4567',
    website: 'https://alphainvest.com',
    address: {
      street: '123 Financial Plaza',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    },
    assetsUnderManagement: '$2.5B',
    yearFounded: 2010,
    specialties: ['Wealth Management', 'Retirement Planning', 'Tax Optimization'],
    crdNumber: '123456'
  },
  {
    id: '2',
    name: 'Beta Wealth Management',
    contactPerson: 'Michael Chen',
    email: 'mchen@betawealth.com',
    phone: '(555) 234-5678',
    website: 'https://betawealth.com',
    address: {
      street: '456 Investment Drive',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105'
    },
    assetsUnderManagement: '$1.8B',
    yearFounded: 2015,
    specialties: ['ESG Investing', 'Alternative Investments', 'Family Office'],
    crdNumber: '234567'
  },
  {
    id: '3',
    name: 'Gamma Financial Partners',
    contactPerson: 'Emily Rodriguez',
    email: 'emily@gammapartners.com',
    phone: '(555) 345-6789',
    website: 'https://gammapartners.com',
    address: {
      street: '789 Capital Boulevard',
      city: 'Chicago',
      state: 'IL',
      zip: '60601'
    },
    assetsUnderManagement: '$3.2B',
    yearFounded: 2008,
    specialties: ['Institutional Consulting', 'Risk Management', 'Portfolio Optimization'],
    crdNumber: '345678'
  },
  {
    id: '4',
    name: 'Delta Advisory Group',
    contactPerson: 'David Thompson',
    email: 'dthompson@deltagroup.com',
    phone: '(555) 456-7890',
    website: 'https://deltagroup.com',
    address: {
      street: '321 Wealth Street',
      city: 'Boston',
      state: 'MA',
      zip: '02108'
    },
    assetsUnderManagement: '$1.2B',
    yearFounded: 2012,
    specialties: ['High Net Worth', 'Estate Planning', 'Business Succession'],
    crdNumber: '456789'
  },
  {
    id: '5',
    name: 'Epsilon Investment Solutions',
    contactPerson: 'Lisa Wang',
    email: 'lwang@epsilonsolutions.com',
    phone: '(555) 567-8901',
    website: 'https://epsilonsolutions.com',
    address: {
      street: '654 Advisor Lane',
      city: 'Austin',
      state: 'TX',
      zip: '73301'
    },
    assetsUnderManagement: '$950M',
    yearFounded: 2018,
    specialties: ['Technology Sector', 'Growth Investing', 'Financial Planning'],
    crdNumber: '567890'
  },
  {
    id: '6',
    name: 'Zeta Capital Management',
    contactPerson: 'Robert Kim',
    email: 'rkim@zetacapital.com',
    phone: '(555) 678-9012',
    website: 'https://zetacapital.com',
    address: {
      street: '987 Investment Center',
      city: 'Miami',
      state: 'FL',
      zip: '33101'
    },
    assetsUnderManagement: '$1.5B',
    yearFounded: 2014,
    specialties: ['International Investing', 'Real Estate', 'Tax Planning'],
    crdNumber: '678901'
  },
  {
    id: '7',
    name: 'Omega Financial Advisors',
    contactPerson: 'Jennifer Martinez',
    email: 'jmartinez@omegafinancial.com',
    phone: '(555) 789-0123',
    website: 'https://omegafinancial.com',
    address: {
      street: '147 Wealth Management Plaza',
      city: 'Denver',
      state: 'CO',
      zip: '80202'
    },
    assetsUnderManagement: '$2.1B',
    yearFounded: 2009,
    specialties: ['Sustainable Investing', 'Retirement Income', 'Healthcare Planning'],
    crdNumber: '789012'
  },
  {
    id: '8',
    name: 'Theta Investment Group',
    contactPerson: 'Christopher Lee',
    email: 'clee@thetagroup.com',
    phone: '(555) 890-1234',
    website: 'https://thetagroup.com',
    address: {
      street: '258 Financial District',
      city: 'Seattle',
      state: 'WA',
      zip: '98101'
    },
    assetsUnderManagement: '$1.7B',
    yearFounded: 2016,
    specialties: ['Tech Startups', 'Venture Capital', 'Private Equity'],
    crdNumber: '890123'
  }
];

export function RIAOutreach() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFirms, setFilteredFirms] = useState<RIAFirm[]>(mockRIAFirms);

  // Parse natural language search query
  const parseSearchQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Extract location information
    const locationKeywords = ['in', 'near', 'located', 'based'];
    const states = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming'];
    const majorCities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'washington', 'boston', 'el paso', 'nashville', 'detroit', 'oklahoma city', 'portland', 'las vegas', 'memphis', 'louisville', 'baltimore', 'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'mesa', 'kansas city', 'atlanta', 'long beach', 'colorado springs', 'raleigh', 'miami', 'virginia beach', 'omaha', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans'];
    
    // Extract specialty keywords
    const specialtyKeywords = ['wealth management', 'retirement planning', 'tax optimization', 'esg investing', 'alternative investments', 'family office', 'institutional consulting', 'risk management', 'portfolio optimization', 'high net worth', 'estate planning', 'business succession', 'technology sector', 'growth investing', 'financial planning', 'international investing', 'real estate', 'tax planning', 'sustainable investing', 'retirement income', 'healthcare planning', 'tech startups', 'venture capital', 'private equity'];
    
    // Extract client type keywords
    const clientTypeKeywords = ['high net worth', 'ultra high net worth', 'institutional', 'retail', 'family office', 'corporate', 'individual', 'retirement', 'pension'];
    
    const extractedInfo = {
      locations: [] as string[],
      specialties: [] as string[],
      clientTypes: [] as string[],
      generalTerms: [] as string[]
    };

    // Extract locations
    [...states, ...majorCities].forEach(location => {
      if (lowerQuery.includes(location)) {
        extractedInfo.locations.push(location);
      }
    });

    // Extract specialties
    specialtyKeywords.forEach(specialty => {
      if (lowerQuery.includes(specialty)) {
        extractedInfo.specialties.push(specialty);
      }
    });

    // Extract client types
    clientTypeKeywords.forEach(clientType => {
      if (lowerQuery.includes(clientType)) {
        extractedInfo.clientTypes.push(clientType);
      }
    });

    // Extract general terms (words that might match firm names or other attributes)
    const words = lowerQuery.split(/\s+/).filter(word => 
      word.length > 2 && 
      !locationKeywords.includes(word) &&
      !extractedInfo.locations.includes(word) &&
      !extractedInfo.specialties.includes(word) &&
      !extractedInfo.clientTypes.includes(word)
    );
    extractedInfo.generalTerms = words;

    return extractedInfo;
  };

  // Filter firms based on natural language search
  const filterFirmsByQuery = (query: string) => {
    if (!query.trim()) {
      return mockRIAFirms;
    }

    const searchCriteria = parseSearchQuery(query);
    const lowerQuery = query.toLowerCase();

    return mockRIAFirms.filter(firm => {
      let matches = 0;
      let totalCriteria = 0;

      // Check location matches
      if (searchCriteria.locations.length > 0) {
        totalCriteria++;
        const firmLocation = `${firm.address.city} ${firm.address.state}`.toLowerCase();
        if (searchCriteria.locations.some(location => firmLocation.includes(location))) {
          matches++;
        }
      }

      // Check specialty matches
      if (searchCriteria.specialties.length > 0) {
        totalCriteria++;
        if (searchCriteria.specialties.some(specialty => 
          firm.specialties.some(firmSpecialty => 
            firmSpecialty.toLowerCase().includes(specialty)
          )
        )) {
          matches++;
        }
      }

      // Check client type matches (map to specialties)
      if (searchCriteria.clientTypes.length > 0) {
        totalCriteria++;
        const clientTypeMapping: { [key: string]: string[] } = {
          'high net worth': ['High Net Worth', 'Wealth Management'],
          'ultra high net worth': ['High Net Worth', 'Wealth Management', 'Family Office'],
          'institutional': ['Institutional Consulting'],
          'family office': ['Family Office'],
          'retirement': ['Retirement Planning', 'Retirement Income'],
          'corporate': ['Business Succession', 'Institutional Consulting']
        };
        
        if (searchCriteria.clientTypes.some(clientType => {
          const mappedSpecialties = clientTypeMapping[clientType] || [];
          return mappedSpecialties.some(specialty => 
            firm.specialties.some(firmSpecialty => 
              firmSpecialty.toLowerCase().includes(specialty.toLowerCase())
            )
          );
        })) {
          matches++;
        }
      }

      // Check general term matches (firm name, contact person, etc.)
      if (searchCriteria.generalTerms.length > 0) {
        totalCriteria++;
        const searchableText = `${firm.name} ${firm.contactPerson} ${firm.specialties.join(' ')}`.toLowerCase();
        if (searchCriteria.generalTerms.some(term => searchableText.includes(term))) {
          matches++;
        }
      }

      // If no specific criteria found, do a general text search
      if (totalCriteria === 0) {
        const searchableText = `${firm.name} ${firm.contactPerson} ${firm.address.city} ${firm.address.state} ${firm.specialties.join(' ')}`.toLowerCase();
        return searchableText.includes(lowerQuery);
      }

      // Return true if at least 50% of criteria match
      return matches / totalCriteria >= 0.5;
    });
  };

  // Handle search submission
  const handleSearch = () => {
    const results = filterFirmsByQuery(searchQuery);
    setFilteredFirms(results);
  };

  const handleContactFirm = (firm: RIAFirm) => {
    // In a real app, this would open a contact form or email client
    console.log('Contacting firm:', firm.name);
    alert(`Opening contact form for ${firm.name}`);
  };

  return (
    <div className="h-screen bg-sidebar-background flex gap-4">
      {/* Vault Sidebar */}
      <VaultSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background mt-4 rounded-tl-2xl vault-scroll">
        <div className="flex-1 overflow-y-auto">
          {/* Header with Breadcrumbs */}
          <div className="border-b border-foreground/10 bg-background">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm mb-6 px-6 pt-6 max-w-[100rem] mx-auto">
              <Link to="/" className="text-foreground/70 hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <span className="text-foreground font-medium">
                Outreach
              </span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">Outreach</h1>
                <p className="text-foreground/70">Connect with certified Registered Investment Advisors</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="max-w-6xl mx-auto h-full">
              {/* Natural Language Search */}
              <div className="mb-8">
                <ChatInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={handleSearch}
                  placeholder="e.g. Find advisers in Miami, Florida specializing in high net worth clients"
                  autoFocus={true}
                  variant="main"
                  showFormatDropdown={false}
                  showAttachButton={false}
                  showFileCards={false}
                  showBottom={false}
                  onClear={() => {
                    setSearchQuery('');
                    setFilteredFirms(mockRIAFirms);
                  }}
                  showClearButton={searchQuery.trim().length > 0}
                />
                <p className="text-sm text-foreground/60 mt-2">
                  {filteredFirms.length} firm{filteredFirms.length !== 1 ? 's' : ''} found
                  {searchQuery.trim() && (
                    <span className="ml-2 text-sidebar-primary">
                      • Searching for: "{searchQuery}"
                    </span>
                  )}
                </p>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {filteredFirms.map((firm) => (
                  <Card key={firm.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        {/* Left Section - Firm Info */}
                        <div className="flex items-center gap-6 flex-1">

                          {/* Firm Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold truncate">{firm.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                CRD #{firm.crdNumber}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-foreground/70 mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{firm.address.city}, {firm.address.state}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                <span>{firm.assetsUnderManagement} AUM</span>
                              </div>
                              <span>Founded {firm.yearFounded}</span>
                            </div>

                            {/* Specialties */}
                            <div className="flex flex-wrap gap-1">
                              {firm.specialties.map((specialty, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Contact Info & Actions */}
                        <div className="flex items-center gap-6">
                          {/* Contact Person */}
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{firm.contactPerson}</span>
                            </div>
                            <div className="space-y-1 text-xs text-foreground/60">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{firm.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-48">{firm.email}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleContactFirm(firm)}
                              className="bg-sidebar-primary hover:bg-sidebar-primary/80"
                            >
                              Contact
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => window.open(firm.website, '_blank')}
                              className="px-3"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* No Results */}
              {filteredFirms.length === 0 && searchQuery.trim() && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground/70 mb-2">No firms found</h3>
                  <p className="text-foreground/50">
                    Try adjusting your search terms or browse all available firms.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
