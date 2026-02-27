"use client"

import { create } from 'zustand'

interface ExamState {
  isExamActive: boolean
  currentExamId: string | null
  startExam: (examId: string) => void
  endExam: () => void
}

export const useExamStore = create<ExamState>((set) => ({
  isExamActive: false,
  currentExamId: null,
  startExam: (examId: string) => set({ isExamActive: true, currentExamId: examId }),
  endExam: () => set({ isExamActive: false, currentExamId: null }),
}))
