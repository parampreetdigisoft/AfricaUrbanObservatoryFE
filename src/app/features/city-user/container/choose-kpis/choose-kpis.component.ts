import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UpdateInviteUserDto } from 'src/app/core/models/AnalystVM';
import { CityVM } from 'src/app/core/models/CityVM';
import { UserService } from 'src/app/core/services/user.service';
import { CityUserService } from '../../city-user.service';
import { AnalyticalLayerResponseDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { TieredAccessPlanValue } from 'src/app/core/enums/TieredAccessPlan';

@Component({
  selector: 'app-choose-kpis',
  templateUrl: './choose-kpis.component.html',
  styleUrl: './choose-kpis.component.css'
})
export class ChooseKpisComponent {
  kpis: AnalyticalLayerResponseDto[] = [];
  cityList: CityVM[] = [];
  @Input() pillars: PillarsVM[] = [];
  tier: TieredAccessPlanValue = TieredAccessPlanValue.Pending;
  @Output() kpiChange = new EventEmitter<any | null>();
  @Output() closeAnalystModel = new EventEmitter<boolean>();
  @Input() loading: boolean = false;
  alertMsg = "";
  excelData: any;
  isSubmitted: boolean = false;
  kpiForm: FormGroup<any> = this.fb.group({});
  pillarLimitMsg: string = '';
  limitMessages: { [key: string]: string } = {};

  constructor(private fb: FormBuilder, private cityuserService: CityUserService, private userService: UserService) {
    this.tier = this.userService?.userInfo?.tier || TieredAccessPlanValue.Pending;
  }
  ngOnInit(): void {
    this.initializeForm();
    //this.GetAllKpi();
    this.getAllCities();
  }
  initializeForm() {
    this.kpiForm = this.fb.group({
      pillars: [[], [Validators.required]],
      cities: [[], [Validators.required]]
    });
  }
  trackByFn(item: any) {
    return item.pillarID;
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.alertMsg = "";
    this.isSubmitted = false;
    //this.initializeForm();
  }

  GetAllKpi() {
    this.cityuserService.GetAllKpi().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.kpis = res.result ?? [];
        }
      }
    });
  }
  getAllCities() {
    this.cityuserService.getAllCities().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.cityList = res.result ?? [];
        }
      }
    });
  }
  checkSelectionLimit(controlName: string) {
    const selected = this.kpiForm.get(controlName)?.value || [];
    let limit = 999; // default unlimited
    let message = '';

    // Determine limit dynamically based on control type and tier
    if (this.tier === 1) limit = 3;
    else if (this.tier === 2) limit = 7;
    else if (this.tier ===0) limit = 0;
    // Trim values if they exceed limit
    if (selected.length > limit) {
      this.kpiForm.patchValue({
        [controlName]: selected.slice(0, limit)
      });
      message = `You can select up to ${limit} ${controlName} in your current tier.`;
    }
    // Store per-control message
    this.limitMessages[controlName] = message;
  }


  onSubmit() {
    this.isSubmitted = true;
    if (this.kpiForm.valid) {
      const cityData: UpdateInviteUserDto = {
        ...this.kpiForm.value
      };
      this.kpiChange.emit(cityData);
    }
  }
  closeModel() {
    this.closeAnalystModel.emit(true);
  }
}

