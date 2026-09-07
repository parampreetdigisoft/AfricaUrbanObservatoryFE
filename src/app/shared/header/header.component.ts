import { Component, OnInit, Renderer2 } from "@angular/core";
import { UserInfo } from "src/app/core/models/UserInfo";
import { CommonService } from "src/app/core/services/common.service";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { environment } from "src/environments/environment";
declare var bootstrap: any;
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
})
export class HeaderComponent implements OnInit {
  urlBase = environment.apiUrl;
  menuOpen = false;
  userinfo: UserInfo | undefined;
  loading = false;
  isOpendialog = false;
  userInfoForUpdate: UserInfo | undefined;
  constructor(
    private userService: UserService,
    private renderer: Renderer2,
    private commonService: CommonService,
    private toaster: ToasterService
  ) {}
  ngOnInit(): void {
    this.userinfo = this.userService.userInfo;
    this.getUserInfo();
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/default-profile.png';
  }
  toggleMenu() {
    this.menuOpen = !this.menuOpen;

    const body = document.body;
    if (body.classList.contains("toggle_nav")) {
      this.renderer.removeClass(body, "toggle_nav");
    } else {
      this.renderer.addClass(body, "toggle_nav");
    }
  }

  updateUserEvent(event: any) {
    this.loading = true;
    const email = event.get("Email");
    this.commonService.updateUser(event).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded && res.result) {
          
          if(this.userService.userInfo.email == email){
            this.userService.updateUser(res.result);
            this.getUserInfo();
            this.userinfo = this.userService.userInfo;
            this.toaster.showSuccess(res?.messages.join(", "));
          }
          else {
            this.toaster.showSuccess("Please Check your email and verify");
            setTimeout(() => {
              this.userService.logout();
            }, 1000);
          }

        } else {
          this.toaster.showError(res?.errors.join(", "));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError("Failed to update profile details. Please try again");
      },
    });
  }
  getUserInfo(){
    this.commonService.getUserInfo().subscribe({
      next:(res)=>{
        if(res.succeeded && res.result){
          this.userInfoForUpdate = res.result;
        }else{
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error:()=>{
        this.toaster.showError("There is an error occure Please try again!");
      }
    })
  }

  opendialog() {
    this.isOpendialog = true;
    setTimeout(() => {
      const modalEl = document.getElementById("exampleModal");
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl); 
        }
        modalInstance.show(); // ✅ use show()
      }
    }, 100);
  }
  closeModal() {
    this.loading = false;
    this.isOpendialog = false;
    const homeTab = document.querySelector("#pills-home-tab") as HTMLElement;
    if (homeTab) {
      homeTab.click();
    }
    const modalEl = document.getElementById("exampleModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
  }

  showRoleBasedInfor(){
    if(this.userinfo?.role?.toLowerCase() === 'cityuser'){
      if(this.userinfo?.tier === 1){
        return 'Researcher';
      }
      else if(this.userinfo?.tier === 2){
        return 'City Analyst';
      }
      else if(this.userinfo?.tier === 3){
        return 'Network Administrator';
      }
    }
    return this.userinfo?.role;
  }
}
