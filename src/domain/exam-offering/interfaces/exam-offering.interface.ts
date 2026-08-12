export interface IExamOffering {
  _id: string;
  healthUnitId: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  sampleType?: string;
  durationMinutes: number;
  resultTurnaroundEstimate?: string;
  requiresPreparation: boolean;
  preparationInstructions?: string;
  requiresFasting: boolean;
  fastingHours?: number;
  price?: number;
  acceptedInsurances: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
