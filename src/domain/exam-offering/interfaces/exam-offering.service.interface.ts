import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IExamOfferingRepository } from '../repository/exam-offering.repository.interface';
import { IExamOffering } from './exam-offering.interface';

export interface IParamsExamOfferingService {
  examOfferingRepository: IExamOfferingRepository;
  healthUnitRepository: IHealthUnitRepository;
}

export interface IParamsCreateExamOffering {
  healthUnitId: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  sampleType?: string;
  durationMinutes: number;
  resultTurnaroundEstimate?: string;
  requiresPreparation?: boolean;
  preparationInstructions?: string;
  requiresFasting?: boolean;
  fastingHours?: number;
  price?: number;
  acceptedInsurances?: string[];
}

export interface IParamsUpdateExamOffering {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  sampleType?: string;
  durationMinutes?: number;
  resultTurnaroundEstimate?: string;
  requiresPreparation?: boolean;
  preparationInstructions?: string;
  requiresFasting?: boolean;
  fastingHours?: number;
  price?: number;
  acceptedInsurances?: string[];
  isActive?: boolean;
}

export interface IExamOfferingService {
  createExamOffering(
    params: IParamsCreateExamOffering,
    requestingAdminUserId: string,
  ): Promise<IExamOffering>;
  updateExamOffering(
    id: string,
    params: IParamsUpdateExamOffering,
    requestingAdminUserId: string,
  ): Promise<IExamOffering>;
  getExamOfferingById(id: string): Promise<IExamOffering>;
  listExamOfferingsByHealthUnitId(
    healthUnitId: string,
    requestingUserId: string | undefined,
    includeInactive: boolean,
  ): Promise<IExamOffering[]>;
}
