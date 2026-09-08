import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { CityVM } from "../../../../core/models/CityVM";
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import {
  InviteUserDto,
  UpdateInviteUserDto,
} from "../../../../core/models/AnalystVM";
import { GetUserByRoleResponse } from "../../../../core/models/GetUserByRoleResponse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { UserRoleValue } from "src/app/core/enums/UserRole";
import { UserService } from "src/app/core/services/user.service";
import { catchError, debounceTime, map, Observable, of, Subscription, switchMap } from "rxjs";
import { AdminService } from "../../admin.service";
import { TieredAccessPlanValue } from "src/app/core/enums/TieredAccessPlan";
import { PillarsVM } from "src/app/core/models/PillersVM";

@Component({
  selector: "app-add-update-city-user",
  templateUrl: "./add-update-city-user.component.html",
  styleUrl: "./add-update-city-user.component.css",
})
export class AddUpdateCityUserComponent implements OnInit, OnDestroy {
  @Input() cityUser: GetUserByRoleResponse | null = null;
  @Input() cities: CityVM[] | null = [];
  @Output() cityUserChange = new EventEmitter<UpdateInviteUserDto | null>();
  @Output() closeCityUserModel = new EventEmitter<boolean>();
  @Output() bulkImportChange = new EventEmitter<UpdateInviteUserDto[] | null>();
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;
  @Input() loading: boolean = false;
  @Input() pillars: PillarsVM[] = [];

  alertMsg = "";
  excelData: any;
  isSubmitted: boolean = false;
  requiredHeaders = ["FullName", "Email", "Phone", "CityName"];
  cityUserForm: FormGroup = this.fb.group({});
  tierOptions = [
    { label: "Basic", value: TieredAccessPlanValue.Basic },
    { label: "Standard", value: TieredAccessPlanValue.Standard },
    { label: "Premium", value: TieredAccessPlanValue.Premium },
  ];
  pillarLimits: Record<number, { min: number; max: number; name: string }> = {
    1: { min: 1, max: 7, name: "Basic" },
    2: { min: 1, max: 12, name: "Standard" },
  };
  premiumGeoMode: "select" | "all" = "select";
  limitMessages: { [key: string]: string } = {};
  private tierSub?: Subscription;
  private previousTier: TieredAccessPlanValue | null = null;

  get isPremium(): boolean {
    return Number(this.cityUserForm?.get("tier")?.value) === TieredAccessPlanValue.Premium;
  }

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.bindTierChanges();
  }

  ngOnDestroy(): void {
    this.tierSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.alertMsg = "";
    this.isSubmitted = false;
    this.limitMessages = {};

    if (!this.cityUserForm?.contains("tier")) {
      return;
    }

    if (changes["cityUser"]) {
      this.patchFormFromInputs();
      return;
    }

    if (changes["pillars"] && this.isPremium) {
      this.applyPremiumPillars();
    }
  }

  private buildForm(): void {
    this.cityUserForm = this.fb.group({
      fullName: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email], [this.emailExistsValidator()]],
      phone: [null, [Validators.required]],
      tier: [null, [Validators.required]],
      pillars: [[], [Validators.required]],
      city: [[], [Validators.required]],
    });
    this.patchFormFromInputs();
  }

  private bindTierChanges(): void {
    this.tierSub?.unsubscribe();
    this.tierSub = this.cityUserForm.get("tier")?.valueChanges.subscribe((tier) => {
      this.onTierChanged(Number(tier));
    });
  }

  private patchFormFromInputs(): void {
    const selectedCityIds = this.cityUser?.cities?.map((c) => c.cityID) ?? [];
    const totalCities = this.cities?.length ?? 0;
    const tier = this.cityUser?.tier != null ? Number(this.cityUser.tier) : null;
    const isPremium = tier === TieredAccessPlanValue.Premium;
    const hasAllCities =
      isPremium && totalCities > 0 && selectedCityIds.length >= totalCities;

    this.premiumGeoMode = hasAllCities ? "all" : "select";
    this.previousTier = tier;

    this.cityUserForm.reset(
      {
        fullName: this.cityUser?.fullName ?? null,
        email: this.cityUser?.email ?? null,
        phone: this.cityUser?.phone ?? null,
        tier: tier,
        pillars: isPremium
          ? this.getAllPillarIds()
          : this.cityUser?.pillars ?? [],
        city: hasAllCities ? [] : selectedCityIds,
      },
      { emitEvent: false }
    );

    this.applyTierValidators(tier);
    if (isPremium) {
      this.applyPremiumPillars();
      if (hasAllCities) {
        this.cityUserForm.get("city")?.clearValidators();
        this.cityUserForm.get("city")?.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  private onTierChanged(tier: number): void {
    this.limitMessages = {};
    const wasPremium = this.previousTier === TieredAccessPlanValue.Premium;
    const isPremium = tier === TieredAccessPlanValue.Premium;
    this.previousTier = Number.isFinite(tier) ? (tier as TieredAccessPlanValue) : null;

    if (isPremium) {
      this.premiumGeoMode = "select";
      this.applyPremiumPillars();
      this.cityUserForm.get("pillars")?.clearValidators();
      this.cityUserForm.get("pillars")?.updateValueAndValidity({ emitEvent: false });
      this.cityUserForm.get("city")?.setValidators([Validators.required]);
      this.cityUserForm.get("city")?.updateValueAndValidity({ emitEvent: false });
    } else {
      if (wasPremium) {
        this.cityUserForm.patchValue({ pillars: [] }, { emitEvent: false });
        if (this.premiumGeoMode === "all") {
          this.cityUserForm.patchValue({ city: [] }, { emitEvent: false });
        }
        this.premiumGeoMode = "select";
      }
      this.cityUserForm.get("pillars")?.setValidators([Validators.required]);
      this.cityUserForm.get("pillars")?.updateValueAndValidity({ emitEvent: false });
      this.cityUserForm.get("city")?.setValidators([Validators.required]);
      this.cityUserForm.get("city")?.updateValueAndValidity({ emitEvent: false });
      this.checkSelectionLimit("pillars");
      this.checkSelectionLimit("city");
    }
  }

  private applyTierValidators(tier: number | null): void {
    if (tier === TieredAccessPlanValue.Premium) {
      this.cityUserForm.get("pillars")?.clearValidators();
    } else {
      this.cityUserForm.get("pillars")?.setValidators([Validators.required]);
    }
    this.cityUserForm.get("pillars")?.updateValueAndValidity({ emitEvent: false });
    this.cityUserForm.get("city")?.setValidators([Validators.required]);
    this.cityUserForm.get("city")?.updateValueAndValidity({ emitEvent: false });
  }

  onPremiumGeoModeChange(mode: "select" | "all"): void {
    this.premiumGeoMode = mode;
    this.limitMessages["city"] = "";
    if (mode === "all") {
      this.cityUserForm.patchValue({ city: [] }, { emitEvent: false });
      this.cityUserForm.get("city")?.clearValidators();
      this.cityUserForm.get("city")?.updateValueAndValidity({ emitEvent: false });
    } else {
      this.cityUserForm.get("city")?.setValidators([Validators.required]);
      this.cityUserForm.get("city")?.updateValueAndValidity({ emitEvent: false });
    }
  }

  private getAllPillarIds(): number[] {
    return (this.pillars ?? []).map((p) => p.pillarID);
  }

  private applyPremiumPillars(): void {
    this.cityUserForm.patchValue({ pillars: this.getAllPillarIds() }, { emitEvent: false });
  }

  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      return of(control.value).pipe(
        debounceTime(500),
        switchMap((email) =>
          this.adminService.checkEmailExist({
            email: email,
            userId: this.cityUser?.userID ?? 0,
          })
        ),
        map((exists: boolean) => (exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  onSubmit() {
    this.isSubmitted = true;

    if (this.isPremium) {
      this.applyPremiumPillars();
      if (this.premiumGeoMode === "all") {
        this.cityUserForm.patchValue({ city: [] }, { emitEvent: false });
        this.cityUserForm.get("city")?.clearValidators();
        this.cityUserForm.get("city")?.updateValueAndValidity({ emitEvent: false });
      }
    } else {
      this.checkSelectionLimit("pillars");
      this.checkSelectionLimit("city");
      if (this.limitMessages["pillars"] || this.limitMessages["city"]) {
        return;
      }
    }

    if (this.cityUserForm.invalid) {
      return;
    }

    if (this.isPremium && this.premiumGeoMode === "select") {
      const selected = this.cityUserForm.get("city")?.value || [];
      if (!Array.isArray(selected) || selected.length < 1) {
        this.limitMessages["city"] = "Please select at least one city.";
        return;
      }
    }

    const isAllCities = this.isPremium && this.premiumGeoMode === "all";
    const cityData: UpdateInviteUserDto = {
      fullName: this.cityUserForm.value.fullName,
      email: this.cityUserForm.value.email,
      phone: this.cityUserForm.value.phone,
      password: "",
      role: UserRoleValue.CityUser,
      tier: this.cityUserForm.value.tier,
      pillars: this.isPremium ? this.getAllPillarIds() : this.cityUserForm.value.pillars,
      invitedUserID: 0,
      userID: this.cityUser?.userID ?? 0,
      cityID: isAllCities ? [] : this.cityUserForm.value.city ?? [],
      isAllCities,
    };
    this.cityUserChange.emit(cityData);
  }

  downloadTemplate() {
    const headers = ["FullName", "Email", "Phone", "CityName"];
    const sampleRow = {
      FullName: "FullName of City User",
      Email: "Enter Email of City User",
      Phone: "Enter Phone Number of City User",
      CityName: "Enter city separated by comma, like :- Lagos, Nairobi, Accra",
    };
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CityUserTemplate");
    const excelBuffer: any = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data: Blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "CityUserTemplate.xlsx");
  }

  onFileChange(evt: any) {
    this.alertMsg = "";
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: "binary" });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const jsonData = <any[]>XLSX.utils.sheet_to_json(ws, { defval: "" });

      const headers = Object.keys(jsonData[0] || {});
      const missingHeaders = this.requiredHeaders.filter((h) => !headers.includes(h));
      if (missingHeaders.length > 0) {
        this.alertMsg = `Invalid file format. Missing headers: ${missingHeaders.join(", ")}`;
        this.fileInput.nativeElement.value = "";
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9+\-\s()]+$/;
      const excelData: InviteUserDto[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const fullName = String(row["FullName"] || "").trim();
        const email = String(row["Email"] || "").trim();
        const phone = String(row["Phone"] || "").trim();
        const cityName = String(row["CityName"] || "").trim();
        const isCompletelyBlank = !fullName && !email && !phone && !cityName;
        if (isCompletelyBlank) continue;
        if (!fullName || !email || !phone || !cityName) {
          this.alertMsg = `Row ${i + 2}: All fields are required.`;
          this.fileInput.nativeElement.value = "";
          return;
        }
        if (fullName.toLowerCase() === "fullname of city user") continue;
        if (!emailRegex.test(email)) {
          this.alertMsg = `Row ${i + 2}: Invalid email format (${email}).`;
          this.fileInput.nativeElement.value = "";
          return;
        }
        if (excelData.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
          this.alertMsg = `Row ${i + 2}: Duplicate email name (${email}).`;
          this.fileInput.nativeElement.value = "";
          return;
        }
        if (!phoneRegex.test(phone)) {
          this.alertMsg = `Row ${i + 2}: Invalid phone number format (${phone}).`;
          this.fileInput.nativeElement.value = "";
          return;
        }
        const dto: InviteUserDto = {
          invitedUserID: this.userService.userInfo?.userID ?? 0,
          fullName,
          email,
          phone,
          password: email,
          role: UserRoleValue.CityUser,
          cityID: this.getCityByName(cityName),
        };
        excelData.push(dto);
      }
      this.excelData = excelData;
      if (this.excelData.length == 0) {
        this.alertMsg = "The uploaded file does not contain any valid records.";
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  getCityByName(cityNames: string): number[] {
    if (!cityNames) return [];
    return cityNames
      .split(",")
      .map((name) => name.trim())
      .map((name) => this.cities?.find((c) => c.cityName === name)?.cityID)
      .filter((id): id is number => id !== undefined);
  }

  bulkImport() {
    if (this.excelData.length > 0 && this.fileInput.nativeElement.value != "") {
      this.bulkImportChange.emit(this.excelData);
      this.fileInput.nativeElement.value = "";
      this.excelData = [];
    }
  }

  closeModel() {
    if (this.fileInput?.nativeElement?.value) this.fileInput.nativeElement.value = "";
    this.alertMsg = "";
    this.isSubmitted = false;
    this.limitMessages = {};
    this.premiumGeoMode = "select";
    this.previousTier = null;
    this.cityUserForm.reset(
      {
        fullName: null,
        email: null,
        phone: null,
        tier: null,
        pillars: [],
        city: [],
      },
      { emitEvent: false }
    );
    this.closeCityUserModel.emit(true);
  }

  numberOnly(event: KeyboardEvent): void {
    const key = event.key;
    if (!/^[0-9+]$/.test(key)) {
      event.preventDefault();
    }
  }

  checkSelectionLimit(controlName: string) {
    const control = this.cityUserForm.get(controlName);
    const selected = control?.value || [];
    const tier = Number(this.cityUserForm.get("tier")?.value);
    let message = "";

    if (!Array.isArray(selected)) {
      this.limitMessages[controlName] = "";
      return;
    }

    const limits = this.pillarLimits[tier];

    if (controlName === "city") {
      if (this.isPremium && this.premiumGeoMode === "all") {
        this.limitMessages[controlName] = "";
        return;
      }
      if (selected.length < 1) {
        message = "Please select at least one city.";
      } else if (selected.length > limits?.max) {
        control?.patchValue(selected.slice(0, limits.max));
        message = `${limits.name} plan allows maximum ${limits.max} cities.`;
      } else if (selected.length < limits?.min) {
        message = `${limits.name} plan requires at least ${limits.min} city.`;
      }

      this.limitMessages[controlName] = message;
      return;
    }

    if (controlName === "pillars") {
      if (this.isPremium) {
        this.limitMessages[controlName] = "";
        return;
      }
      if (!limits) {
        this.limitMessages[controlName] = "Please select a tier first.";
        return;
      }
      if (selected.length > limits?.max) {
        control?.patchValue(selected.slice(0, limits.max));
        message = `${limits.name} plan allows maximum ${limits.max} pillars.`;
      } else if (selected.length < limits?.min) {
        message = `${limits.name} plan requires at least ${limits.min} pillar.`;
      }
      this.limitMessages[controlName] = message;
    }
  }

  trackByFn(item: any) {
    return item.pillarID;
  }
    customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item.cityName?.toLowerCase().includes(term) ||
      item.cityAliasName?.toLowerCase().includes(term) ||
      item.country?.toLowerCase().includes(term) ||
      item.region?.toLowerCase().includes(term) 
    );
  }
}
