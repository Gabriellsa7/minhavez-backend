import {
  EPatientPriority,
  isPriorityCategory,
} from '../../domain/patient/interfaces/patient.interface';

describe('isPriorityCategory', () => {
  it.each([
    EPatientPriority.ELDERLY,
    EPatientPriority.PREGNANT,
    EPatientPriority.DISABLED,
  ])('gives queue priority to the legal category %s', (priority) => {
    expect(isPriorityCategory(priority)).toBe(true);
  });

  it('gives no queue priority to NORMAL or to a missing priority', () => {
    expect(isPriorityCategory(EPatientPriority.NORMAL)).toBe(false);
    expect(isPriorityCategory(undefined)).toBe(false);
  });

  it('gives no queue priority to the removed CHRONIC_CONDITION value still stored in old records', () => {
    expect(isPriorityCategory('CHRONIC_CONDITION' as EPatientPriority)).toBe(
      false,
    );
  });
});
