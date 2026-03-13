import { Injectable, Logger } from '@nestjs/common';
import {
    MedicalDocument,
    DocumentType,
    DocumentRiskLevel,
    AIAnalysisResult,
    KeyMeasurement,
} from './entities/medical-document.entity';
import { MedGemmaService } from '../ai/medgemma.service';

@Injectable()
export class DocumentAnalysisService {
    private readonly logger = new Logger(DocumentAnalysisService.name);

    constructor(private readonly medgemmaService: MedGemmaService) {}

    async analyzeDocument(doc: MedicalDocument, fileBuffer: Buffer): Promise<AIAnalysisResult> {
        const isImage = doc.mimeType.startsWith('image/');
        const isPdf = doc.mimeType === 'application/pdf';
        const isDicom = doc.mimeType.includes('dicom') || doc.originalFileName.endsWith('.dcm');

        const systemPrompt = this.buildSystemPrompt(doc.documentType);
        const userPrompt = this.buildUserPrompt(doc.documentType);

        let rawAnalysis = '';
        let model = 'template-analysis';

        if (isDicom) {
            rawAnalysis = JSON.stringify({
                summary: `DICOM ${this.getDocTypeLabel(doc.documentType)} study uploaded. Open in a DICOM-compatible viewer for detailed analysis.`,
                riskLevel: 'medium',
                riskIndicators: ['Manual physician review required for DICOM files'],
                abnormalFindings: [],
                normalFindings: [],
                confidenceScore: 0.3,
                keyMeasurements: [],
                recommendations: [
                    'Open in DICOM-compatible viewer (e.g., OsiriX, Horos, RadiAnt)',
                    'Attending physician review required before clinical decisions',
                ],
            });
            model = 'template';
        } else if (isImage) {
            const result = await this.analyzeWithVision(fileBuffer, doc.mimeType, userPrompt, systemPrompt);
            rawAnalysis = result.text;
            model = result.model;
        } else if (isPdf) {
            const result = await this.analyzeWithText(fileBuffer, userPrompt, systemPrompt);
            rawAnalysis = result.text;
            model = result.model;
        } else {
            const result = await this.analyzeWithText(fileBuffer, userPrompt, systemPrompt);
            rawAnalysis = result.text;
            model = result.model;
        }

        this.logger.log(
            `[ParseAnalysis] rawAnalysis length=${rawAnalysis.length}, first 400 chars: ${rawAnalysis.slice(0, 400)}`,
        );

        return this.parseAnalysis(rawAnalysis, model);
    }

    // ── Vision analysis (images) ──────────────────────────────────────────────

    private async analyzeWithVision(
        buffer: Buffer,
        mimeType: string,
        prompt: string,
        systemPrompt: string,
    ): Promise<{ text: string; model: string }> {
        try {
            const base64 = buffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64}`;
            return await this.medgemmaService.generateWithImage(dataUrl, prompt, systemPrompt);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Vision model failed (${msg}). Falling back to text-only.`);
            const result = await this.medgemmaService.generate(
                `${prompt}\n\n[Note: The image could not be directly processed. Provide a structured clinical analysis framework for this imaging type as if reviewing the study, noting image review was not performed visually.]`,
                { systemPrompt, maxTokens: 1500 },
            );
            return { text: result.text, model: result.model };
        }
    }

    // ── Text analysis (PDFs) ──────────────────────────────────────────────────

    private async analyzeWithText(
        buffer: Buffer,
        prompt: string,
        systemPrompt: string,
    ): Promise<{ text: string; model: string }> {
        let extractedText = '';
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(buffer);
            extractedText = (pdfData.text || '').slice(0, 6000);
        } catch {
            extractedText = '[PDF text extraction unavailable]';
        }

        const fullPrompt = extractedText
            ? `${prompt}\n\nExtracted Report Content:\n${extractedText}`
            : prompt;

        const result = await this.medgemmaService.generate(fullPrompt, {
            systemPrompt,
            maxTokens: 1800,
        });
        return { text: result.text, model: result.model };
    }

    // ── System Prompts ────────────────────────────────────────────────────────

    private buildSystemPrompt(docType: DocumentType): string {
        const label = this.getDocTypeLabel(docType);
        return `You are a senior medical AI radiologist and clinician specialized in ${label} interpretation. You provide detailed, accurate clinical decision support.

OUTPUT RULE: Respond with ONLY a single JSON object. No markdown, no explanation, no text before or after the JSON. Start your response with { and end with }.

JSON schema (fill every field):
{
  "summary": "3-5 sentence clinical overview describing the key findings observed",
  "riskLevel": "low",
  "riskIndicators": ["specific finding 1", "specific finding 2"],
  "abnormalFindings": ["detailed abnormal finding 1", "detailed abnormal finding 2"],
  "normalFindings": ["normal finding 1", "normal finding 2"],
  "confidenceScore": 0.85,
  "keyMeasurements": [
    {"name": "parameter name", "value": "measured value", "unit": "unit", "normalRange": "normal range", "isAbnormal": false}
  ],
  "recommendations": ["specific clinical recommendation 1", "specific recommendation 2"]
}

Field rules:
- riskLevel: EXACTLY one of: "low", "medium", "high", "critical"
- confidenceScore: decimal 0.0 to 1.0 reflecting image/data quality and finding clarity
- riskIndicators: up to 6 specific findings that drive the risk level
- abnormalFindings: up to 10 findings outside normal range with clinical detail
- normalFindings: up to 5 structures/values within normal limits
- keyMeasurements: up to 8 quantitative values with units and reference ranges
- recommendations: up to 5 specific clinical action items

Be specific and accurate to the actual image/data presented. Never use generic placeholder text.`;
    }

    // ── User Prompts ──────────────────────────────────────────────────────────

    private buildUserPrompt(docType: DocumentType): string {
        const prompts: Record<DocumentType, string> = {

            [DocumentType.XRAY]: `Analyze this X-ray image systematically. Examine every visible structure and report what you ACTUALLY see.

For CHEST X-RAY examine:
- Lung fields: consolidation, infiltrates, effusions, pneumothorax, masses, nodules, atelectasis, hyperinflation
- Cardiac silhouette: cardiothoracic ratio (normal <0.5), chamber enlargement, aortic knuckle
- Mediastinum: width, tracheal deviation, hilar lymphadenopathy
- Bones: rib fractures, lytic/sclerotic lesions, spine alignment, shoulder girdle
- Diaphragm: flattening, elevation, free subdiaphragmatic air
- Soft tissue: subcutaneous emphysema, calcifications
- Pleura: costophrenic angle blunting, pleural thickening

For SKELETAL X-RAY examine:
- Fracture lines: location, orientation, displacement, angulation, comminution
- Bone density: osteopenia, sclerosis, lytic lesions
- Joint spaces: narrowing, effusion, alignment, subluxation
- Cortical integrity: periosteal reaction, cortical breach
- Soft tissue swelling: location and extent

Report the cardiothoracic ratio or fracture details as keyMeasurements. Set confidenceScore based on positioning and image quality.`,

            [DocumentType.ECG]: `Analyze this 12-lead ECG tracing systematically. Report ACTUAL values from the tracing.

Measure and report:
RATE & RHYTHM:
- Heart rate (count R-R intervals): exact BPM
- Rhythm: regular or irregular, sinus or non-sinus origin
- P-wave morphology and axis, PR relationship

INTERVALS (measure actual values):
- PR interval (normal 120-200 ms) — flag if <120 ms (pre-excitation) or >200 ms (block)
- QRS duration (normal <120 ms) — if ≥120 ms identify LBBB vs RBBB morphology
- QTc interval (normal <440 ms men, <460 ms women) — calculate from QT and RR
- QT interval raw measurement

MORPHOLOGY per lead:
- ST segment: elevation >1mm limb leads or >2mm precordial = significant; note territory
- T-wave: inversions (which leads), hyperacute T-waves, biphasic
- Q-waves: pathological (>40ms, >25% QRS), location (inferior/anterior/lateral)
- Delta waves: pre-excitation / WPW pattern
- R-wave progression V1-V6
- QRS axis: normal (-30° to +90°), LAD, RAD

SPECIFIC PATTERNS: STEMI, NSTEMI criteria, hypertrophy (LVH by Sokolow-Lyon or Cornell), Brugada pattern, WPW, complete/incomplete BBB, AV blocks (1st/2nd/3rd degree).

Set keyMeasurements with actual HR, PR, QRS, QTc values.`,

            [DocumentType.BLOOD_REPORT]: `Analyze this blood/laboratory report. For EVERY value present in the report:
1. State the measured value and reference range
2. Flag as normal or abnormal with clinical significance
3. Note trends or patterns across related values

CBC panel (report actual values vs reference ranges):
- WBC with differential (neutrophils, lymphocytes, monocytes, eosinophils)
- RBC, Hemoglobin, Hematocrit, MCV, MCH, MCHC, RDW
- Platelets

Metabolic panel:
- Sodium, Potassium, Chloride, CO2/Bicarbonate (calculate anion gap = Na - [Cl + HCO3], normal 8-12)
- BUN, Creatinine, eGFR, Glucose
- Calcium, Magnesium, Phosphorus

Liver function:
- AST, ALT, ALP, GGT, Total/Direct bilirubin, Albumin, Total protein

Lipid panel:
- Total cholesterol, LDL, HDL, Triglycerides, non-HDL cholesterol

Other reported values:
- HbA1c, TSH, CRP, ESR, Troponin, BNP, PT/INR, aPTT, D-dimer, Ferritin, Vitamin D, B12

In keyMeasurements list EVERY value with its measured result, unit, and normal range. Set isAbnormal=true for any out-of-range value.`,

            [DocumentType.MRI]: `Analyze this MRI study systematically. Describe findings per sequence if identifiable.

BRAIN MRI — examine:
- Parenchymal signal: T1/T2/FLAIR changes, cortex, white matter, basal ganglia, thalami, cerebellum, brainstem
- White matter: T2/FLAIR hyperintensities (periventricular, subcortical, deep) — grade and distribution
- Diffusion (DWI/ADC): restricted diffusion (acute ischemia, abscess, high-grade tumor)
- Enhancement (T1+Gd): pattern (ring, nodular, leptomeningeal, gyral), location
- Ventricles: size, symmetry, hydrocephalus signs, transependymal flow
- Sulci: atrophy, effacement (raised ICP)
- Midline shift: measure in mm (normal = 0 mm)
- Mass lesions: size, location, signal characteristics, surrounding edema, enhancement
- Vascular: flow voids, AVM, cavernous malformation

SPINE MRI — examine:
- Disc morphology per level: height, T2 signal (dark = degeneration), protrusion vs extrusion
- Canal: stenosis grade (mild/moderate/severe), AP diameter measurements
- Foraminal narrowing: level and side
- Cord signal change: T2 hyperintensity (myelopathy)
- Vertebral bodies: height, fractures, marrow signal (infiltration, infection, Modic changes)
- Posterior elements, ligaments

MUSCULOSKELETAL MRI:
- Ligament/tendon: signal, continuity, thickness
- Cartilage: thickness, defects, grade
- Bone marrow edema: location and extent
- Joint effusion: volume, signal

Report lesion sizes and midline shift as keyMeasurements.`,

            [DocumentType.CT_SCAN]: `Analyze this CT scan systematically. Use Hounsfield unit (HU) ranges where relevant.

CT HEAD — examine:
- Brain parenchyma: hyperdense (acute hemorrhage ~50-80 HU), hypodense (ischemia/edema ~10-20 HU)
- Hemorrhage: epidural (biconvex), subdural (crescent), subarachnoid (cisterns/sulci), intraparenchymal — volume estimate
- Mass lesions: density, margins, surrounding edema, herniation signs
- Ventricles and cisterns: effacement, dilatation
- Midline shift: measure in mm; herniation (uncal, subfalcine, tonsillar)
- Skull, sinuses, mastoids

CT CHEST — examine:
- Lung windows: nodules (size, density: solid/subsolid/GGO, margins, location/lobe), consolidation, GGO, interstitial pattern, emphysema, bronchiectasis
- Mediastinum: lymphadenopathy (>10mm short axis), masses, aortic caliber, pericardial effusion
- Pleura: effusion (estimate volume), thickening, pneumothorax (% collapse)
- Lung-RADS for nodules if present

CT ABDOMEN/PELVIS — examine:
- Liver: size, attenuation, masses (HU pre/post contrast, margins, enhancement pattern)
- Gallbladder: stones (HU), wall thickness (>3mm abnormal), pericholecystic fluid
- Pancreas: size, duct diameter (>3mm dilated), peripancreatic stranding/fluid
- Spleen: size (>12cm enlarged)
- Kidneys: size, cortical thickness, hydronephrosis grade, calculi (HU), masses
- Bowel: wall thickness, dilation, pneumatosis, obstruction, free air
- Aorta: diameter (>3cm = aneurysm)
- Free fluid: HU (simple <20, hemorrhagic 30-45, complex >20)
- Lymph nodes: size, morphology

Report HU values and lesion dimensions as keyMeasurements.`,

            [DocumentType.ULTRASOUND_ECHO]: `Analyze this ultrasound/echocardiogram study systematically.

ECHOCARDIOGRAM (TTE/TEE) — measure and report:
DIMENSIONS (adult normal ranges):
- LV EDD (normal ♂<55mm ♀<52mm), LV ESD, IVS thickness (normal 6-11mm), PW thickness
- LA diameter (normal <40mm), RA area
- RV basal diameter (normal <42mm)

SYSTOLIC FUNCTION:
- LV ejection fraction by Simpson biplane (normal ≥55%): report actual percentage
- Regional wall motion abnormalities: territory (LAD/RCA/LCx), severity (hypokinesis/akinesis/dyskinesis)
- TAPSE (normal ≥16mm) for RV function

DIASTOLIC FUNCTION:
- Mitral inflow: E velocity, A velocity, E/A ratio, deceleration time
- Tissue Doppler: e' lateral and septal, E/e' ratio (normal <14)
- Left atrial volume index

VALVES:
- Aortic: morphology (tricuspid/bicuspid), peak velocity (normal <2 m/s), mean gradient, valve area (normal AVA >1.5cm²)
- Mitral: morphology, regurgitation grade (none/trivial/mild/moderate/severe), stenosis PHT
- Tricuspid: regurgitation, estimated RVSP (TR velocity method + RAP)
- Pulmonic: morphology, pulmonary regurgitation

PERICARDIUM:
- Effusion size: trivial (<5mm), small (5-10mm), moderate (10-20mm), large (>20mm)
- Tamponade signs: RV diastolic collapse, RA systolic collapse, respiratory variation >25%

ABDOMINAL ULTRASOUND:
- Liver: size, echogenicity (fatty = increased echogenicity), focal lesions (size, echogenicity, vascularity)
- CBD diameter (normal ≤6mm, ≤8mm post-cholecystectomy)
- Gallbladder: stones (shadowing), polyps, wall thickness (>3mm abnormal), pericholecystic fluid
- Pancreas: echogenicity, duct dilation
- Spleen: size (normal ≤12cm), focal lesions
- Kidneys: size (normal 9-12cm), echogenicity, cortical thickness, hydronephrosis grade (0-IV), calculi size/location
- Aorta: diameter (normal <3cm)
- Ascites: volume estimate, echogenicity (simple/complex)

Report all measured values (EF, gradients, velocities, organ sizes) as keyMeasurements.`,
        };

        return prompts[docType] || `Analyze this ${this.getDocTypeLabel(docType)} study and provide detailed structured clinical findings.`;
    }

    // ── Response Parser ───────────────────────────────────────────────────────

    private parseAnalysis(rawText: string, model: string): AIAnalysisResult {
        // If completely empty, return an honest error result
        if (!rawText || rawText.trim().length < 10) {
            this.logger.warn('parseAnalysis: rawText is empty — MedGemma returned no content');
            return this.errorResult(model, 'MedGemma returned no content. Check backend logs for the Vertex AI response.');
        }

        let parsed: Partial<AIAnalysisResult & { riskLevel: string }> = {};

        // ── Step 1: Try to extract JSON from raw text ──────────────────────────
        try {
            // Remove markdown code fences if present
            const cleaned = rawText
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/\s*```\s*$/, '')
                .trim();

            // Try full parse first (model returned pure JSON)
            try {
                parsed = JSON.parse(cleaned);
            } catch {
                // Try to extract the largest {...} block
                const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                }
            }
        } catch (e) {
            this.logger.warn(`JSON parse failed — will extract from prose. Error: ${e}`);
        }

        // ── Step 2: Validate / fill each field ────────────────────────────────

        const summary = (typeof parsed.summary === 'string' && parsed.summary.length > 10)
            ? parsed.summary
            : this.extractSummaryFromProse(rawText);

        const riskLevel = this.validateRiskLevel(parsed.riskLevel)
            || this.inferRiskFromText(rawText);

        const confidenceScore = (typeof parsed.confidenceScore === 'number')
            ? Math.min(1, Math.max(0, parsed.confidenceScore))
            : this.inferConfidenceFromText(rawText);

        const riskIndicators = this.sanitiseStringArray(parsed.riskIndicators, 6)
            .filter(s => s.length > 2);

        const abnormalFindings = this.sanitiseStringArray(parsed.abnormalFindings, 10)
            .filter(s => s.length > 2);

        const normalFindings = this.sanitiseStringArray(parsed.normalFindings, 5)
            .filter(s => s.length > 2);

        const keyMeasurements: KeyMeasurement[] = Array.isArray(parsed.keyMeasurements)
            ? (parsed.keyMeasurements as KeyMeasurement[])
                .filter(m => m && typeof m.name === 'string' && m.name.length > 0)
                .slice(0, 8)
            : [];

        const recommendations = this.sanitiseStringArray(parsed.recommendations, 5)
            .filter(s => s.length > 5);

        // ── Step 3: If still empty, try prose extraction ───────────────────────
        const finalAbnormal = abnormalFindings.length > 0
            ? abnormalFindings
            : this.extractListFromProse(rawText, ['abnormal', 'finding', 'irregular', 'fracture', 'lesion', 'opacity', 'effusion', 'elevated', 'increased', 'decreased', 'low', 'high']);

        const finalRecommendations = recommendations.length > 0
            ? recommendations
            : this.extractListFromProse(rawText, ['recommend', 'suggest', 'follow', 'correlate', 'obtain', 'consider', 'refer', 'urgent']);

        this.logger.log(
            `parseAnalysis result — risk=${riskLevel}, confidence=${confidenceScore.toFixed(2)}, ` +
            `abnormal=${finalAbnormal.length}, normal=${normalFindings.length}, ` +
            `measurements=${keyMeasurements.length}, recommendations=${finalRecommendations.length}`,
        );

        return {
            summary,
            riskLevel,
            riskIndicators,
            abnormalFindings: finalAbnormal,
            normalFindings,
            confidenceScore,
            keyMeasurements,
            recommendations: finalRecommendations,
            rawAnalysis: rawText.slice(0, 5000),
            model,
            analyzedAt: new Date().toISOString(),
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private sanitiseStringArray(value: unknown, limit: number): string[] {
        if (!Array.isArray(value)) return [];
        return (value as unknown[])
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
            .slice(0, limit);
    }

    private inferRiskFromText(text: string): DocumentRiskLevel {
        const t = text.toLowerCase();
        if (/critical|emergency|immediate.{0,20}(intervention|attention)|life.?threat|cardiac.?arrest|code|tension.?pneumo|tamponade|acute.?mi|stemi/i.test(t))
            return DocumentRiskLevel.CRITICAL;
        if (/fracture|dislocation|fractur|abnormal|elevated|significantly|severe|worrisome|suspicious|malignant|hemorrhage|infarct|emboli|thrombosis|stenosis|obstruct|rupture|mass|tumor|cancer/i.test(t))
            return DocumentRiskLevel.HIGH;
        if (/borderline|mild|mildly|slight|minor|early|possible|possible|consider|monitor|follow.?up|watch/i.test(t))
            return DocumentRiskLevel.MEDIUM;
        return DocumentRiskLevel.LOW;
    }

    private inferConfidenceFromText(text: string): number {
        // If we got content from the model, base confidence on length and quality
        if (!text || text.length < 50) return 0.3;
        if (text.length > 500) return 0.75;
        if (text.length > 200) return 0.65;
        return 0.5;
    }

    private extractSummaryFromProse(text: string): string {
        if (!text || text.length < 5) return 'No analysis content returned from AI model.';
        // Take first 2-3 meaningful sentences
        const sentences = text
            .replace(/\{[\s\S]*\}/, '') // remove any JSON block
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 20 && !s.startsWith('"') && !s.startsWith('{'));
        if (sentences.length > 0) {
            return sentences.slice(0, 3).join(' ').slice(0, 500) + '.';
        }
        return text.slice(0, 400).trim() + '.';
    }

    private extractListFromProse(text: string, keywords: string[]): string[] {
        // Extract bullet points or numbered items that contain relevant keywords
        const lines = text.split(/\n/)
            .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
            .filter(l => {
                if (l.length < 10 || l.length > 250) return false;
                return keywords.some(kw => l.toLowerCase().includes(kw));
            });
        return lines.slice(0, 5);
    }

    private extractSummary(text: string): string {
        const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);
        return (sentences.slice(0, 2).join('. ').trim() || text.slice(0, 200)) + '.';
    }

    private validateRiskLevel(level: unknown): DocumentRiskLevel | null {
        return Object.values(DocumentRiskLevel).includes(level as DocumentRiskLevel)
            ? (level as DocumentRiskLevel)
            : null;
    }

    private errorResult(model: string, message: string): AIAnalysisResult {
        return {
            summary: message,
            riskLevel: DocumentRiskLevel.MEDIUM,
            riskIndicators: ['AI analysis could not be completed — manual review required'],
            abnormalFindings: [],
            normalFindings: [],
            confidenceScore: 0.0,
            keyMeasurements: [],
            recommendations: [
                'Review document manually with qualified medical personnel',
                'Re-attempt AI analysis after verifying MedGemma service connectivity',
            ],
            rawAnalysis: message,
            model,
            analyzedAt: new Date().toISOString(),
        };
    }

    private getDocTypeLabel(type: DocumentType): string {
        const labels: Record<DocumentType, string> = {
            [DocumentType.XRAY]: 'X-Ray',
            [DocumentType.ECG]: 'ECG/EKG',
            [DocumentType.BLOOD_REPORT]: 'Blood/Lab Report',
            [DocumentType.MRI]: 'MRI',
            [DocumentType.CT_SCAN]: 'CT Scan',
            [DocumentType.ULTRASOUND_ECHO]: 'Ultrasound/Echo',
        };
        return labels[type] || type;
    }
}
