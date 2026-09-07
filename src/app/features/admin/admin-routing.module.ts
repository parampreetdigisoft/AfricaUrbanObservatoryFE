import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { AdminComponent } from "./component/admin.component";
import { CityComponent } from "./container/city/city.component";
import { PillarComponent } from "./container/pillar/pillar.component";
import { QuestionComponent } from "./container/question/question.component";
import { AssesmentComponent } from "./container/assesment/assesment.component";
import { AnalystViewComponent } from "./container/analyst-view/analyst-view.component";
import { AdminDashboardComponent } from "./container/admin-dashboard/admin-dashboard.component";
import { ComparisionComponent } from "./container/comparision/comparision.component";
import { KpiLayersComponent } from "./container/kpi-layers/kpi-layers.component";
import { EvaluatoinResponseViewComponent } from "./container/evaluatoin-response-view/evaluatoin-response-view.component";

const routes: Routes = [
  {
    path: "",
    component: AdminComponent,
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      { path: "dashboard", component: AdminDashboardComponent },
      { path: "city", component: CityComponent },
      { path: "analyst", component: AnalystViewComponent },
      { path: "pillar", component: PillarComponent },
      { path: "question", component: QuestionComponent },
      { path: "assesment", component: AssesmentComponent },
      { path: "assesment/:roleID/:cityID", component: AssesmentComponent },
      {
        path: "assessment-result/:assessmentID/:userName",
        component: EvaluatoinResponseViewComponent,
      },
      { path: "viewUser/:roleID", component: AnalystViewComponent },
      { path: "evaluator-Comparision", component: ComparisionComponent },
      {
        path: "kpi-layers",
        loadComponent: () =>
          import("./container/kpi-layers/kpi-layers.component").then(
            (m) => m.KpiLayersComponent
          ),
      },
      {
        path: "kpi-comparision",
        loadComponent: () =>
          import("./container/kpi-comparision/kpi-comparision.component").then(
            (m) => m.KpiComparisionComponent
          ),
      },
      {
        path: "ai/city-analysis",
        loadComponent: () =>
          import("./container/ai-city-analysis/aicity-analysis.component").then(
            (m) => m.AICityAnalaysisComponent
          ),
      },

      {
        path: "ai/city-comparison",
        loadComponent: () =>
          import(
            "./container/ai-city-comparison/ai-city-comparison.component"
          ).then((m) => m.AiCityComparisonComponent),
      },
      {
        path: "ai/questions-analysis",
        loadComponent: () =>
          import(
            "./container/ai-question-analysis/ai-question-analysis.component"
          ).then((m) => m.AiQuestionAnalysisComponent),
      },
      {
        path: "ai/kpi-analysis",
        loadComponent: () =>
          import("./container/ai-kpi-analysis/kpianalysis.component").then(
            (m) => m.KPIAnalysisComponent
          ),
      },
      {
        path: "blogs",
        loadComponent: () =>
          import("./container/blog/blog.component").then(
            (m) => m.BlogComponent
          ),
      },
      {
        path: "ai-documents",
        loadComponent: () =>
          import("./container/ai-documents/ai-documents.component").then(
            (m) => m.AiDocumentsComponent
          ),
      },
      {
        path: "aevum",
        loadComponent: () =>
          import("../../shared/chatbox/chat-container/chat-container.component").then(
            (m) => m.ChatContainerComponent
          ),
      }
    ],
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
