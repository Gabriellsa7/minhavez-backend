import { IExamRepository } from '../repository/exam.repository.interface';
import { IPatientRepository } from '../../patient/repository/patient.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import { IAppointmentRepository } from '../../appointment/repository/appointment.repository.interface';
import { IExamBookingRepository } from '../../exam-booking/repository/exam-booking.repository.interface';
import { IEmailProvider } from '../../auth/interfaces/email-provider.interface';
import { INotificationService } from '../../notification/interfaces/notification.service.interface';
import { IExamWithContext, IExamWithFileUrl } from '../interfaces/exam.interface';
import { IPaginationParams } from '../../../shared/utils/pagination';

export interface IParamsExamService {
  examRepository: IExamRepository;
  patientRepository: IPatientRepository;
  healthUnitRepository: IHealthUnitRepository;
  userRepository: IUserRepository;
  appointmentRepository: IAppointmentRepository;
  examBookingRepository: IExamBookingRepository;
  emailProvider: IEmailProvider;
  notificationService: Pick<INotificationService, 'createNotification'>;
}

export interface IParamsRegisterExam {
  patientCpf: string;
  healthUnitId: string;
  examType: string;
  examDate?: Date | null;
  doctorName?: string;
  notes?: string;
  fileBase64: string;
  fileName: string;
  mimeType: string;
  examBookingId?: string;
}

export interface IRequestingUser {
  sub: string;
  isAdmin: boolean;
  isHealthProfessional: boolean;
}

export interface IExamUploader {
  sub: string;
  name: string;
  isExamProfessional: boolean;
  healthUnitId?: string;
}

export interface IExamService {
  registerExam(
    params: IParamsRegisterExam,
    uploader: IExamUploader,
  ): Promise<IExamWithContext>;
  getExamForRequester(
    id: string,
    requester: IRequestingUser,
  ): Promise<IExamWithFileUrl>;
  downloadExamFile(
    id: string,
    requester: IRequestingUser,
  ): Promise<IExamWithFileUrl>;
  listExamsByPatientId(
    patientId: string,
    requester: IRequestingUser,
    pagination?: IPaginationParams | null,
  ): Promise<{ items: IExamWithContext[]; totalItems: number }>;
  listExamsByHealthUnitId(
    healthUnitId: string,
    requester: IRequestingUser,
  ): Promise<IExamWithContext[]>;
  listExamsByProfessionalId(
    professionalId: string,
    requester: IRequestingUser,
  ): Promise<IExamWithContext[]>;
}
