import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HeaderComponent } from "./header/header.component";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { PaginationComponent } from "./pagination/pagination.component";
import { PromptComponent } from "./prompt/prompt.component";
import { NgSelectModule } from "@ng-select/ng-select";
import { AlphaOnlyDirective } from "./directives/alpha-only.directive";
import { NumberOnlyDirective } from "./directives/number-only.directive";
import { AlphSomeSepecialDirective } from "./directives/alph-some-sepecial.directive";
import { FileUploadModalComponent } from "./file-upload-modal/file-upload-modal.component";
import { AgCharts } from "ag-charts-angular";
import { AgBarComponent } from "./grid/ag-bar/ag-bar.component";
import { ShowAssessmentProgressComponent } from "./grid/show-assessment-progress/show-assessment-progress.component";
import { MatTableModule } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UpdateProfileComponent } from "./update-profile/update-profile.component";
import { ViewKpiLayerComponent } from "./view-kpi-layer/view-kpi-layer.component";
import { NgApexchartsModule } from "ng-apexcharts";
import { ChatContainerComponent } from "./chatbox/chat-container/chat-container.component";

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    AlphaOnlyDirective,
    NumberOnlyDirective,
    AlphSomeSepecialDirective,
    FileUploadModalComponent,
    AgBarComponent,
    ShowAssessmentProgressComponent,
    UpdateProfileComponent,
    ViewKpiLayerComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    AgCharts,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule ,
    NgApexchartsModule,
    PaginationComponent,
    PromptComponent,
    ChatContainerComponent
  ],
  exports: [
    HeaderComponent,
    SidebarComponent,
    PaginationComponent,
    ReactiveFormsModule,
    FormsModule,
    PromptComponent,
    NgSelectModule,
    AlphaOnlyDirective,
    NumberOnlyDirective,
    AlphSomeSepecialDirective,
    FileUploadModalComponent,
    AgBarComponent,
    ShowAssessmentProgressComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    ViewKpiLayerComponent,
    NgApexchartsModule
  ],
})
export class SharedModule {}
