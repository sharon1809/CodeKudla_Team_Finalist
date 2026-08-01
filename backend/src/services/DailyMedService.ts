import axios from 'axios';

class DailyMedService {
  private openFdaBaseURL: string;
  private dailyMedBaseURL: string;

  constructor() {
    this.openFdaBaseURL = 'https://api.fda.gov/drug/label.json';
    this.dailyMedBaseURL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json';
  }

  async searchDrug(drugName: string) {
    try {
      let setid: string | null = null;
      try {
        const response = await axios.get(this.dailyMedBaseURL, {
          params: { drug_name: drugName }
        });
        if (response.data?.data?.[0]?.setid) {
          setid = response.data.data[0].setid;
        }
      } catch (err: any) {
        console.warn('DailyMed setId lookup failed:', err.message);
      }

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
    } catch (error: any) {
      console.error('DailyMed/OpenFDA error:', error.message);
      return null;
    }
  }

  async fetchOpenFDA(drugName: string) {
    try {
      const queries = [
        `openfda.brand_name:"${drugName}"`,
        `openfda.generic_name:"${drugName}"`
      ];

      for (const searchQuery of queries) {
        try {
          const response = await axios.get(this.openFdaBaseURL, {
            params: { search: searchQuery, limit: 1 },
            timeout: 15000
          });
          if (response.data?.results?.[0]) {
            return response.data.results[0];
          }
        } catch (err: any) {
          if (err.response?.status === 404) continue;
          throw err;
        }
      }
      return null;
    } catch (error: any) {
      console.error('OpenFDA API error:', error.message);
      return null;
    }
  }

  extractWarnings(fdaData: any) {
    if (!fdaData) return [];
    const warnings = [];
    if (fdaData.boxed_warning) warnings.push(...fdaData.boxed_warning);
    if (fdaData.warnings) warnings.push(...fdaData.warnings);
    if (fdaData.warnings_and_cautions) warnings.push(...fdaData.warnings_and_cautions);
    if (fdaData.stop_use) warnings.push(...fdaData.stop_use.map((s: string) => `Stop use: ${s}`));
    return warnings;
  }

  extractContraindications(fdaData: any) {
    if (!fdaData) return [];
    const contraindications = [];
    if (fdaData.contraindications) contraindications.push(...fdaData.contraindications);
    if (fdaData.do_not_use) contraindications.push(...fdaData.do_not_use);
    return contraindications;
  }

  extractSideEffects(fdaData: any) {
    if (!fdaData) return [];
    const sideEffects = [];
    if (fdaData.adverse_reactions) sideEffects.push(...fdaData.adverse_reactions);
    return sideEffects;
  }

  extractDrugInteractions(fdaData: any) {
    if (!fdaData) return [];
    if (fdaData.drug_interactions) return fdaData.drug_interactions;
    return [];
  }
}

export default new DailyMedService();
