import React from 'react';
import { StudentAttendanceModal } from './StudentAttendanceModal';
import { Family, Student } from '../types';

interface FamilyAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: Family;
  students: Student[];
  initialStudentId?: string;
  onSave: (familyId: string, attendanceDays: number[], studentAttendanceMap?: Record<string, number[]>) => void;
  onSaveStudentDays?: (studentId: string, attendanceDays: number[]) => void;
  onSaveAllStudentsDays?: (updates: Record<string, number[]>) => void;
}

export const FamilyAttendanceModal: React.FC<FamilyAttendanceModalProps> = ({
  isOpen,
  onClose,
  family,
  students,
  initialStudentId,
  onSave,
  onSaveStudentDays,
  onSaveAllStudentsDays,
}) => {
  return (
    <StudentAttendanceModal
      isOpen={isOpen}
      onClose={onClose}
      family={family}
      students={students}
      initialStudentId={initialStudentId}
      onSaveStudentDays={(studentId, days) => {
        if (onSaveStudentDays) {
          onSaveStudentDays(studentId, days);
        } else {
          onSave(family.id, days);
        }
      }}
      onSaveAllStudentsDays={(updates) => {
        if (onSaveAllStudentsDays) {
          onSaveAllStudentsDays(updates);
        } else {
          const firstKey = Object.keys(updates)[0];
          if (firstKey) {
            onSave(family.id, updates[firstKey], updates);
          }
        }
      }}
    />
  );
};
