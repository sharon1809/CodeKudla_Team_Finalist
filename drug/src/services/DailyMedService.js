import { DailyMed } from '@ncbijs/dailymed';
import axios from 'axios';

class DailyMedService {
  constructor() {
    this.client = new DailyMed();
    this.openFdaBaseURL = 'https://api.fda.gov/drug/label.json';
  }

  async searchDrug(drugName) {
    try {
      // Use @ncbijs/dailymed to resolve setId (it does this correctly)
      let setid = null;
      try {
        const spls = await this.client.spls(drugName);
        if (spls?.data?.[0]?.setId) {
          setid = spls.data[0].setId;
        }
      } catch (err) {
        console.warn('DailyMed setId lookup failed:', err.message);
      }

      // Use OpenFDA for the actual drug label data (warnings, contraindications, etc.)
      const fdaData = await this.fetchOpenFDA(drugName);

      if (!fdaData && !setid) {
        return null;
      }

      return {
        setid: setid || fdaData?.set_id || 'unknown',
        name: drugName,
        warnings: this.extractWarnings(fdaData),
        contraindications: this.extractContraindications(fdaData),
        sideEffects: this.extractSideEffects(fdaData),
        drugInteractions: this.extractDrugInteractions(fdaData)
      };
    } catch (error) {
      console.error('DailyMed/OpenFDA error:', error.message);
      return null;
    }
  }

  async fetchOpenFDA(drugName) {
    try {
      // Search by brand name first, then generic name
      const queries = [
        `openfda.brand_name:"${drugName}"`,
        `openfda.generic_name:"${drugName}"`
      ];

      for (const searchQuery of queries) {
        try {
          const response = await axios.get(this.openFdaBaseURL, {
            params: {
              search: searchQuery,
              limit: 1
            },
            timeout: 15000
          });

          if (response.data?.results?.[0]) {
            return response.data.results[0];
          }
        } catch (err) {
          // 404 means no results for this query, try next
          if (err.response?.status === 404) continue;
          throw err;
        }
      }

      return null;
    } catch (error) {
      console.error('OpenFDA API error:', error.message);
      return null;
    }
  }

  extractWarnings(fdaData) {
    if (!fdaData) return [];
    const warnings = [];

    if (fdaData.boxed_warning) {
      warnings.push(...fdaData.boxed_warning);
    }
    if (fdaData.warnings) {
      warnings.push(...fdaData.warnings);
    }
    if (fdaData.warnings_and_cautions) {
      warnings.push(...fdaData.warnings_and_cautions);
    }
    if (fdaData.stop_use) {
      warnings.push(...fdaData.stop_use.map(s => `Stop use: ${s}`));
    }

    return warnings;
  }

  extractContraindications(fdaData) {
    if (!fdaData) return [];
    const contraindications = [];

    if (fdaData.contraindications) {
      contraindications.push(...fdaData.contraindications);
    }
    if (fdaData.do_not_use) {
      contraindications.push(...fdaData.do_not_use);
    }

    return contraindications;
  }

  extractSideEffects(fdaData) {
    if (!fdaData) return [];
    const sideEffects = [];

    if (fdaData.adverse_reactions) {
      sideEffects.push(...fdaData.adverse_reactions);
    }

    return sideEffects;
  }

  extractDrugInteractions(fdaData) {
    if (!fdaData) return [];

    if (fdaData.drug_interactions) {
      return fdaData.drug_interactions;
    }

    return [];
  }
}

export default new DailyMedService();
