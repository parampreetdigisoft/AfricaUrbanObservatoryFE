export enum AssessmentPhase {
  NotStarted = 0,     // Assessment not submitted at all
  InProgress = 1,     // User has access to edit
  EditRequested = 2,  // User requested permission to edit
  EditRejected = 3,   // Admin/analyst rejected edit request
  EditApproved = 4,   // Admin/analyst approved edit request
  Completed = 5       // Assessment completed
}
export enum AssessmentPhaseButtonText {
  InProgress = 'Edit',     // User has access to edit
  EditRequested = 'Requested',  // User requested permission to edit
  EditRejected = 'Rejected',   // Admin/analyst rejected edit request
  EditApproved = 'Approved',   // Admin/analyst approved edit request
  Completed = 'Send Request'       // Assessment completed
}

