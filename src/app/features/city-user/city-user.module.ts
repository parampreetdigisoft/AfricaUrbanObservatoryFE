import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CityUserComponent } from './city-user.component';
import { tierAccessGuard } from 'src/app/core/services/tier-access.guard';
import { CityUserDashboardComponent } from './container/city-user-dashboard/city-user-dashboard.component';
import { SharedModule } from 'src/app/shared/share.module';
import { CityViewComponent } from './container/city-view/city-view.component';
import { CityDetailsComponent } from './features/city-details/city-details.component';
import { ChooseKpisComponent } from './container/choose-kpis/choose-kpis.component';
const routes: Routes = [
  {
    path: '',
    component: CityUserComponent,
    canActivate: [tierAccessGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CityUserDashboardComponent },
      { path: 'city-view', component: CityViewComponent },
      { path: 'city-details', component: CityDetailsComponent },
      {
        path: 'kpi-layer', 
        loadComponent: () => import('./container/kpi-layers/kpi-layers.component').then(m => m.KpiLayersComponent)
      },
      {
        path: 'comparision', 
        loadComponent: () => import('./container/comparison/comparison.component').then(m => m.ComparisonComponent)
      },
      {
        path: 'ai/city-analysis',
        loadComponent: () => import('./container/ai-city-analysis/aicity-analysis.component').then(m => m.AICityAnalaysisComponent)
      },
      {
        path: 'ai/city-comparison',
        loadComponent: () => import('./container/ai-city-comparison/ai-city-comparison.component').then(m => m.AiCityComparisonComponent)
      },
      // {
      //   path: 'ai/questions-analysis',
      //   loadComponent: () => import('./container/ai-question-analysis/ai-question-analysis.component').then(m => m.AiQuestionAnalysisComponent)
      // },
      {
        path: 'ai/kpi-analysis',
        loadComponent: () => import('./container/ai-kpi-analysis/kpianalysis.component').then(m => m.KPIAnalysisComponent)
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
  {
    path: 'payment',
    loadChildren: () => import("../payment-getway/payment-getway.module").then((m) => m.PaymentGetwayModule)
  }
];

@NgModule({
  declarations: [
    CityUserComponent,
    CityUserDashboardComponent,
    CityViewComponent,
    CityDetailsComponent,
    ChooseKpisComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class CityUserModule { } 