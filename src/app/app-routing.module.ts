import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { RoleGuard } from "./core/services/role.guard";
import { UserRole } from "./core/enums/UserRole";

const routes: Routes = [
  {
    path: "",
    canActivate: [RoleGuard],
    canActivateChild: [RoleGuard],
    component: HomeComponent,
    children: [
      {
        path: "admin",
        loadChildren: () =>
          import("./features/admin/admin.module").then((m) => m.AdminModule),
        canActivate: [RoleGuard],
        data: { role: UserRole.Admin },
      },
      {
        path: "analyst",
        loadChildren: () =>
          import("./features/analyst/analyst.module").then(
            (m) => m.AnalystModule
          ),
        canActivate: [RoleGuard],
        data: { role: UserRole.Analyst },
      },
      {
        path: "evaluator",
        loadChildren: () =>
          import("./features/evaluator/evaluator.module").then(
            (m) => m.EvaluatorModule
          ),
        canActivate: [RoleGuard],
        data: { role: UserRole.Evaluator },
      },
      {
        path: "cityuser",
        loadChildren: () =>
          import("./features/city-user/city-user.module").then(
            (m) => m.CityUserModule
          ),
        canActivate: [RoleGuard],
        data: { role: UserRole.CityUser },
      },
    ],
  },
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.module").then((m) => m.AuthModule),
  },
  {
    path: "**",
    redirectTo: "",
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
