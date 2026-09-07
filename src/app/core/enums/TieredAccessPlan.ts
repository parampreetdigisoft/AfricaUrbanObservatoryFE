
export enum TieredAccessPlan {
    Basic = 'Basic',
    Standard = 'Standard',
    Premium = 'Premium',


    Pending = 'Pending',
    // EvaluationBasic = 'EVALUATION_BASIC',
    // EvaluationStandard = 'EVALUATION_STANDARD',
    // EvaluationPremium = 'EVALUATION_PREMIUM',
    // AccessBasic = 'ACCESS_BASIC',
    // AccessStandard = 'ACCESS_STANDARD',
    // AccessPremium = 'ACCESS_PREMIUM'
}

export enum TieredAccessPlanValue {
    Basic = 1,
    Standard = 2,
    Premium = 3,
    
    Pending = 0,
    // EvaluationBasic = 1,
    // EvaluationStandard = 2,
    // EvaluationPremium = 3,
    // AccessBasic = 4,
    // AccessStandard = 5,
    // AccessPremium = 6
}

export enum PaymentStatus { Pending = 0, Succeeded = 1, Failed = 2 }
