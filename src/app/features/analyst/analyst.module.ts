import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AnalystComponent } from './analyst.component';
import { AssignedCityComponent } from './container/assigned-city/assigned-city.component';
import { EvaluatorViewComponent } from './container/evaluator-view/evaluator-view.component';
import { AnalystAssessmentComponent } from './container/analyst-assessment/analyst-assessment.component';
import { SharedModule } from 'src/app/shared/share.module';
import { AddUpdateEvaluatorComponent } from './features/add-update-evaluator/add-update-evaluator.component';
import { EvaluatorResponsesComponent } from './container/evaluator-responses/evaluator-responses.component';
import { EvaluatorResponseViewComponent } from './container/evaluator-response-view/evaluator-response-view.component';
import { AnalystDashboardComponent } from './container/analyst-dashboard/analyst-dashboard.component';
import { ComparisionComponent } from './container/comparision/comparision.component';
const routes: Routes = [
  {
    path: '',
    component: AnalystComponent,
    data: { roles: [] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AnalystDashboardComponent },
      { path: 'assigned-city', component: AssignedCityComponent },
      { path: 'evaluator-view', component: EvaluatorViewComponent },
      { path: 'evaluator-response/:assessmentUserID', component: EvaluatorResponsesComponent },
      { path: 'evaluator-response', component: EvaluatorResponsesComponent },
      { path: 'evaluator-response/:userID/:cityID', component: EvaluatorResponsesComponent },
      { path: 'analyst-assessment', component: AnalystAssessmentComponent },
      { path: 'assessment-result/:assessmentID/:userName', component: EvaluatorResponseViewComponent },
      { path: 'evaluator-Comparision', component: ComparisionComponent },
      {
        path: 'kpi-layers',
        loadComponent: () => import('./container/kpi-layers/kpi-layers.component').then(m => m.KpiLayersComponent)
      },
      {
        path: 'kpi-comparision',
        loadComponent: () => import('./container/kpi-comparision/kpi-comparision.component').then(m => m.KpiComparisionComponent)
      },
      {
        path: 'ai/city-analysis',
        loadComponent: () => import('./container/ai-city-analysis/aicity-analysis.component').then(m => m.AICityAnalaysisComponent)
      },
      {
        path: 'ai/city-comparison',
        loadComponent: () => import('./container/ai-city-comparison/ai-city-comparison.component').then(m => m.AiCityComparisonComponent)
      },
      {
        path: 'ai/questions-analysis',
        loadComponent: () => import('./container/ai-question-analysis/ai-question-analysis.component').then(m => m.AiQuestionAnalysisComponent)
      },
      {
        path: 'ai/kpi-analysis',
        loadComponent: () => import('./container/ai-kpi-analysis/kpianalysis.component').then(m => m.KPIAnalysisComponent)
      }
    ],
  },

];

@NgModule({
  declarations: [
    AnalystComponent,
    AssignedCityComponent,
    EvaluatorViewComponent,
    AnalystAssessmentComponent,
    AddUpdateEvaluatorComponent,
    EvaluatorResponsesComponent,
    EvaluatorResponseViewComponent,
    AnalystDashboardComponent,
    ComparisionComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AnalystModule { } 