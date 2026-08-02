import axios from 'axios';
import { getOpenRouterApiKeys, executeWithFallback } from './apiKeyManager';

class AIService {
  get model() {
    return process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';
  }

  get baseURL() {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }

  async callLLM(systemPrompt: string, userPrompt: string, maxTokens = 1200) {
    const keys = getOpenRouterApiKeys();
    if (keys.length === 0) {
      console.error('AI service: OPENROUTER_API_KEY not configured');
      return null;
    }

    try {
      return await executeWithFallback('openrouter', async (apiKey) => {
        const response = await axios.post(
          this.baseURL,
          {
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: maxTokens,
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Drug Safety Checker'
            }
          }
        );

        if (response.data && response.data.choices && response.data.choices[0]) {
          return response.data.choices[0].message.content;
        }
        throw new Error('Unexpected response shape from OpenRouter AI Service');
      });
    } catch (error: any) {
      console.error('AI service error:', error.message);
      return null;
    }
  }

  async generateSafetyReport(patient: any, drug: any, safetyCheck: any) {
    const prompt = this.buildPrompt(patient, drug, safetyCheck);
    return this.callLLM(
      'You are a clinical pharmacist providing drug safety reports.',
      prompt
    );
  }

  async generateDetailedReport(safetyCheckResult: any) {
    const prompt = this.buildDetailedPrompt(safetyCheckResult);
    return this.callLLM(
      'You are a senior clinical pharmacist. Write detailed, professional, clinically accurate drug safety reports for prescribing physicians. Structure the report in clear markdown sections.',
      prompt,
      1500
    );
  }

  async generateInteractionDecision({ patient, drug, allergyCheck, interactionReport }: any) {
    const prompt = this.buildDecisionPrompt({ patient, drug, allergyCheck, interactionReport });
    const raw = await this.callLLM(
      'You are a senior clinical pharmacist adjudicating automated drug-interaction screening. Always reply with strict JSON only.',
      prompt,
      900
    );

    if (!raw) {
      throw new Error('AI decision service is unavailable');
    }

    const parsed = this.parseJsonObject(raw);
    const status = String(parsed?.status || '').toUpperCase();
    if (!['SAFE', 'WARNING', 'BLOCKED'].includes(status)) {
      throw new Error('AI returned an invalid decision status');
    }

    return {
      status,
      message: String(parsed.message || '').trim(),
      summary: String(parsed.summary || '').trim(),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map((r: any) => String(r))
        : []
    };
  }

  buildDecisionPrompt({ patient, drug, allergyCheck, interactionReport }: any) {
    return `
You are making the FINAL clinical decision on whether it is safe to prescribe a drug for a patient, based on live FDA label interaction screening.

Use ONLY the data provided. Do not invent interactions, severities, or allergies.

=== PATIENT ===
${JSON.stringify(patient, null, 2)}

=== DRUG BEING PRESCRIBED ===
${JSON.stringify(drug?.name || 'Unknown', null, 2)}

=== ALLERGY CHECK ===
${allergyCheck ? `Allergy conflict detected: ${allergyCheck}` : 'No allergy conflict detected'}

=== DRUG INTERACTION SCREENING (pairwise FDA label analysis) ===
${JSON.stringify(interactionReport, null, 2)}

Decide the safety status using these definitions:
- BLOCKED: a serious, contraindicated, or potentially life-threatening interaction is present.
- WARNING: a clinically significant interaction is present; prescribe with caution and monitoring.
- SAFE: no significant interaction detected.

Respond with STRICT JSON only, no markdown fences, exactly this shape:
{
  "status": "SAFE|WARNING|BLOCKED",
  "message": "one clear sentence to the prescribing physician",
  "summary": "concise, plain-language summary of the key interaction findings so the physician can quickly see what matters",
  "recommendations": ["monitoring or action items"]
}
`;
  }

  parseJsonObject(raw: any) {
    if (!raw) return null;
    let text = String(raw).trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  buildDetailedPrompt(result: any) {
    const patient = result.patient || {};
    const drug = result.drug || {};
    const safetyCheck = result.safetyCheck || {};

    return `
You are preparing a detailed drug safety report. Below is the full, structured output from an automated drug-safety screening system. Use ALL of this information to write a comprehensive, well-organized clinical report.

=== FULL SAFETY CHECK OUTPUT (JSON) ===
${JSON.stringify(result, null, 2)}
=== END OF OUTPUT ===

Write a DETAILED, professional clinical report with these sections:
1. **Patient Summary** - name, age, gender, allergies, current medications (note anything missing).
2. **Drug Under Review** - name, purpose, warnings, contraindications.
3. **Overall Safety Status** - restate the status (SAFE/WARNING/BLOCKED) and message clearly.
4. **Drug Interaction Analysis** - for EVERY interaction pair found: the two drugs involved, the FDA label finding (description), why it matters, and recommended monitoring.
5. **Warnings & Contraindications** - expand each into plain clinical language.
6. **Allergy Assessment** - state clearly whether any allergy conflict was found.
7. **Clinical Recommendations** - concrete, actionable guidance for the prescribing physician.
8. **Disclaimer** - automated screening only; use clinical judgment.

Be thorough and specific using ONLY the data provided. Do not invent drug interactions or allergies that are not present.
`;
  }

  buildPrompt(patient: any, drug: any, safetyCheck: any) {
    return `
Patient Information:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender || 'Not specified'}
- Allergies: ${patient.allergies && patient.allergies.length ? patient.allergies.join(', ') : 'None reported'}
- Current Medications: ${patient.currentMedications && patient.currentMedications.length ? patient.currentMedications.map((m: any) => m.drugName).join(', ') : 'None'}

Drug Being Prescribed:
- Name: ${drug.name}
- Warnings: ${drug.warnings ? drug.warnings.join(', ') : 'None'}
- Contraindications: ${drug.contraindications ? drug.contraindications.join(', ') : 'None'}

Safety Check Results:
- Status: ${safetyCheck.status}
- Allergies Check: ${safetyCheck.allergyCheck ? `⚠️ Allergy detected: ${safetyCheck.allergyCheck}` : '✅ No allergy conflicts'}
- Interaction Report: ${JSON.stringify(safetyCheck.interactionReport || safetyCheck.interactions || 'None')}

Please provide a clear, professional drug safety report for the prescribing physician.
`;
  }
}

export default new AIService();
