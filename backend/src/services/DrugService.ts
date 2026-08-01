// @ts-nocheck
import Drug from '../models/Drug';
import dailyMedService from './DailyMedService';
import drugInteractionService from './DrugInteractionService';
import aiService from './AIService';

class DrugService {
  async getOrCreateDrug(drugName: string) {
    // Check local database first
    let drug = await Drug.findOne({ name: drugName });

    if (drug) {
      // Check if data is stale (older than 24 hours)
      const hoursOld = (Date.now() - new Date(drug.lastUpdated).getTime()) / (1000 * 60 * 60);
      if (hoursOld < 24) {
        return drug;
      }
    }

    // Fetch warnings/contraindications/side effects live from the FDA label
    const dailyMedData = await dailyMedService.searchDrug(drugName);

    if (!dailyMedData) {
      throw new Error(`Drug "${drugName}" not found in any database`);
    }

    // Update or create drug
    const drugData = {
      name: drugName,
      setid: dailyMedData?.setid || 'unknown',
      warnings: dailyMedData?.warnings || ['No warnings available'],
      contraindications: dailyMedData?.contraindications || ['No contraindications available'],
      sideEffects: dailyMedData?.sideEffects || ['No side effects available'],
      interactions: [],
      lastUpdated: new Date()
    };

    if (drug) {
      Object.assign(drug, drugData);
      await drug.save();
    } else {
      drug = new Drug(drugData);
      try {
        await drug.save();
      } catch (error) {
        if (error.code === 11000) {
          // Concurrent request already created this drug
          drug = await Drug.findOne({ name: drugName });
          Object.assign(drug, drugData);
          await drug.save();
        } else {
          throw error;
        }
      }
    }

    return drug;
  }

  async checkAllergies(patient: any, drug: any) {
    if (!patient.allergies || patient.allergies.length === 0) {
      return null;
    }

    // Check if any patient allergies match drug
    for (const allergy of patient.allergies) {
      if (drug.name.toLowerCase().includes(allergy.toLowerCase()) ||
          allergy.toLowerCase().includes(drug.name.toLowerCase())) {
        return allergy;
      }
    }

    return null;
  }

  /**
   * Runs a live n-way polypharmacy interaction evaluation across the drug being
   * prescribed plus all of the patient's current medications, then asks the AI
   * to make the final clinical decision. No hardcoded interaction data is used.
   */
  async performSafetyCheck(patient: any, drugName: string) {
    const drug = await this.getOrCreateDrug(drugName);

    const allergyCheck = await this.checkAllergies(patient, drug);

    // Polypharmacy set: the new drug + every current medication
    const currentMeds = (patient.currentMedications || [])
      .map((med) => med?.drugName)
      .filter(Boolean)
      .filter((name) => name.toLowerCase() !== drugName.toLowerCase());
    const allDrugs = [drugName, ...currentMeds];

    const interactionReport = await drugInteractionService.evaluatePolypharmacy(allDrugs);

    // AI adjudicates the final status from the live interaction evidence
    const decision = await aiService.generateInteractionDecision({
      patient,
      drug,
      allergyCheck,
      interactionReport
    });

    return {
      status: decision.status,
      message: decision.message,
      summary: decision.summary,
      recommendations: decision.recommendations,
      allergyCheck,
      interactionReport,
      drug
    };
  }
}

export default new DrugService();
