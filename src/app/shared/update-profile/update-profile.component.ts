import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UserInfo } from "src/app/core/models/UserInfo";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-update-profile",
  templateUrl: "./update-profile.component.html",
  styleUrl: "./update-profile.component.css",
})
export class UpdateProfileComponent implements OnInit, OnChanges {
  selectedFile: any;
  @Input() loading: boolean = false;
  isSubmitted = false;
  @Input() userinfo: UserInfo | undefined | null = null;
  @Output() updateUserEvent: any = new EventEmitter();
  @Output() closeModelEvent: any = new EventEmitter();
  userForm: FormGroup<any> = this.fb.group({});
  urlBase = environment.apiUrl;
    imagePreview: string | ArrayBuffer | null = null;
  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    //this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/default-profile.png';
  }
  initializeForm() {
    if (this.userinfo) {
      this.userForm = this.fb.group({
        fullName: [this.userinfo.fullName, [Validators.required]],
        phone: [this.userinfo.phone, [Validators.required]],
        email: [this.userinfo.email, [Validators.required, Validators.email]],
        profileImage: [],
        is2FAEnabled:[this.userinfo.is2FAEnabled]
      });
    }
  }
  updateUser(fullName: string, email: string, phone: string,is2FAEnabled:boolean, profileImage?: File) {
    const formData = new FormData();
    formData.append("FullName", fullName);
    formData.append("Phone", phone);
    formData.append("Email", email);
    formData.append("UserID", `${this.userinfo?.userID ?? 0}`);
    formData.append("Is2FAEnabled", `${is2FAEnabled ?? 0}`);
    if (profileImage) {
      formData.append("ProfileImage", this.selectedFile);
    }
    this.updateUserEvent.emit(formData);
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.userForm.valid) {
      var form = this.userForm.value;
      this.updateUser(form.fullName, form.email, form.phone,form.is2FAEnabled, form.profileImage);
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  closeModel() {
    this.closeModelEvent.emit();
  }
}
