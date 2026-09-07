import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './component/admin.component';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from 'src/app/shared/share.module';
import { CityComponent } from './container/city/city.component';
import { PillarComponent } from './container/pillar/pillar.component';
import { QuestionComponent } from './container/question/question.component';
import { AssesmentComponent } from './container/assesment/assesment.component';
import { AddUpdateAnalystComponent } from './features/add-update-analyst/add-update-analyst.component';
import { AddUpdateCityComponent } from './features/add-update-city/add-update-city.component';
import { AnalystViewComponent } from './container/analyst-view/analyst-view.component';
import { AddUpdateQuestionComponent } from './features/add-update-question/add-update-question.component';
import { EvaluatoinResponseViewComponent } from './container/evaluatoin-response-view/evaluatoin-response-view.component';
import { UpdatePillarComponent } from './features/update-pillar/update-pillar.component';
import { QuillModule } from 'ngx-quill';
import { AdminDashboardComponent } from './container/admin-dashboard/admin-dashboard.component';
import { ComparisionComponent } from './container/comparision/comparision.component';
import { TransterAssessmentComponent } from './features/transter-assessment/transter-assessment.component';
import { KpiComparisionComponent } from './container/kpi-comparision/kpi-comparision.component';
import { KpiLayersComponent } from './container/kpi-layers/kpi-layers.component';

@NgModule({
  declarations: [
    AdminComponent,
    CityComponent,
    PillarComponent,
    QuestionComponent,
    AssesmentComponent,
    AddUpdateAnalystComponent,
    AddUpdateCityComponent,
    AnalystViewComponent,
    AddUpdateQuestionComponent,
    EvaluatoinResponseViewComponent,
    UpdatePillarComponent,
    AdminDashboardComponent,
    ComparisionComponent,
    TransterAssessmentComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AdminRoutingModule,
    QuillModule.forRoot({
      theme: 'snow',
      format: 'html' ,
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'header': [1, 2, 3, false] }],
          ['link', 'image']
        ]
      }
    }) 
  ],
  //bootstrap: [AdminComponent]
})
export class AdminModule { } 