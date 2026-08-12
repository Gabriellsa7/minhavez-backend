import { IExamOffering } from '../interfaces/exam-offering.interface';

export interface IParamsCreateExamOffering {
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
}

export interface IExamOfferingRepository {
  createExamOffering(data: IParamsCreateExamOffering): Promise<IExamOffering>;
  updateExamOfferingById(
    id: string,
    params: Partial<IExamOffering>,
  ): Promise<IExamOffering | null>;
  getExamOfferingById(id: string): Promise<IExamOffering | null>;
  listExamOfferingsByHealthUnitId(
    healthUnitId: string,
    includeInactive: boolean,
  ): Promise<IExamOffering[]>;
}
