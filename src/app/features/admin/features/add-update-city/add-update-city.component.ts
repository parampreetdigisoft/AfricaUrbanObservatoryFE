import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CityVM } from '../../../../core/models/CityVM';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CommonService } from 'src/app/core/services/common.service';
import { debounceTime } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-update-city',
  templateUrl: './add-update-city.component.html',
  styleUrls: ['./add-update-city.component.css']
})
export class AddUpdateCityComponent implements OnChanges, OnInit {
  urlBase = environment.apiUrl;
  selectedFile: File | null = null;
  @Input() city: CityVM | null | undefined = null;
  @Output() cityChange = new EventEmitter<FormData>();
  @Output() bulkImport = new EventEmitter<CityVM[]>();
  @Output() closeModal = new EventEmitter<boolean>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() loading: boolean = false;
  @Input() cities: CityVM[] = [];

  isSubmitted = false;
  cityForm!: FormGroup;
  bulkImportData: CityVM[] | null = null;
  alertMsg = '';
  imagePreview: string | ArrayBuffer | null = null;
  constructor(private fb: FormBuilder, private commonService: CommonService) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.isSubmitted = false;
    this.cityForm = this.fb.group({
      state: [this.city?.state, Validators.required],
      cityName: [this.city?.cityName, Validators.required],
      cityAliasName: [this.city?.cityAliasName && this.city.cityAliasName !== 'null' ? this.city.cityAliasName : ''],
      region: [this.city?.region, Validators.required],
      country: [this.city?.country, Validators.required],
      postalCode: [this.city?.postalCode, Validators.required],
      latitude: [this.city?.latitude, Validators.required],
      longitude: [this.city?.longitude, Validators.required],
      imageFile: [''],
      population: [this.city?.population, Validators.required],
      income: [this.city?.income, Validators.required],
      livingCost: [this.city?.livingCost || null, [Validators.required, Validators.min(1)]],
      purchasingPower: [this.city?.purchasingPower || null, [Validators.required, Validators.min(1)]],
      peerCities: [this.city?.peerCitiesIDs],
    });
    this.onFormChange();
    if (this.cityForm.get('latitude')?.invalid && this.cityForm.get('cityName')?.valid && this.cityForm.get('state')?.valid && this.cityForm.get('country')?.valid) {
      this.getLatitudeLongitude();
    }
  }

  onFormChange() {
    this.cityForm.valueChanges.pipe(debounceTime(500)).subscribe({
      next: (r) => {
        if (this.cityForm.get('latitude')?.invalid && this.cityForm.get('cityName')?.valid && this.cityForm.get('state')?.valid && this.cityForm.get('country')?.valid) {
          this.getLatitudeLongitude();
        }
      }
    })
  }
  getLatitudeLongitude() {
    let c = {
      city: this.cityForm.get('cityName')?.value,
      region: this.cityForm.get('region')?.value,
      state: this.cityForm.get('state')?.value,
      country: this.cityForm.get('country')?.value,
      postalCode: this.cityForm.get('postalCode')?.value,
      format: 'json'
    }
    this.commonService.getLatitudeLongitude(c).subscribe({
      next: (r) => {
        if (r.length) {
          this.cityForm.patchValue({
            latitude: r[0].lat,
            longitude: r[0].lon
          });
        }
      }
    })
  }
  ngOnChanges(changes: SimpleChanges): void {

    this.alertMsg = '';
    //this.initializeForm();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.selectedFile = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
  onSubmit() {
    this.isSubmitted = true;
    if (this.cityForm.invalid) return;

    const formData = new FormData();

    // Append all form values (capitalized keys)
    formData.append('State', this.cityForm.get('state')?.value);
    formData.append('CityName', this.cityForm.get('cityName')?.value);
    formData.append('CityAliasName', this.cityForm.get('cityAliasName')?.value);
    formData.append('Region', this.cityForm.get('region')?.value);
    formData.append('Country', this.cityForm.get('country')?.value);
    formData.append('PostalCode', this.cityForm.get('postalCode')?.value);
    formData.append('Longitude', this.cityForm.get('longitude')?.value);
    formData.append('Latitude', this.cityForm.get('latitude')?.value);
    formData.append('CityID', (this.city?.cityID ?? 0).toString());
    formData.append('Population', this.cityForm.get('population')?.value);
    formData.append('Income', this.cityForm.get('income')?.value);
    formData.append('PurchasingPower', this.cityForm.get('purchasingPower')?.value);
    formData.append('LivingCost', this.cityForm.get('livingCost')?.value);

    this.cityForm.get('peerCities')?.value?.forEach((id: string) => {
      formData.append('PeerCities', id);
    });

    if (this.selectedFile) {
      formData.append('ImageFile', this.selectedFile as Blob, this.selectedFile?.name);
    }

    // Include CityID if editing
    this.cityChange.emit(formData);
  }


  downloadTemplate() {
    const headers = ["CityName", "CityAliasName", "Country", "State", "PostalCode", "Region", "Latitude", "Longitude", "Population", "Income", "LivingCost", "PurchasingPower"];
    // One sample row
    const sampleRow = {
      CityName: "Enter City Name",
      CityAliasName: "Enter City Alias Name",
      Country: "Enter Country Name",
      State: "Enter State Name",
      Region: "Enter Region Name",
      PostalCode: "Enter Postal Code",
      Latitude: "Enter Latitude",
      Longitude: "Enter Longitude",
      Population: "Enter Population",
      Income: "Enter Income",
      LivingCost: "Enter cost of living adjusted income",
      PurchasingPower: "Enter purchasing power adjusted income",
    };

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CitiesTemplate');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'CityTemplate.xlsx');
  }

  // 👉 Handle file import
  handleFileImport(evt: any) {
    this.alertMsg = '';

    const target: DataTransfer = evt.target as DataTransfer;
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const ws: XLSX.WorkSheet = wb.Sheets[wb.SheetNames[0]];

      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];

      // ✅ Header validation
      const requiredHeaders = [
        "CityName", "CityAliasName", "Country", "State",
        "PostalCode", "Region", "Latitude", "Longitude",
        "Population", "Income", "LivingCost", "PurchasingPower"
      ];

      const headers = Object.keys(jsonData[0] || {});
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length) {
        return this.setError(`Invalid file format. Missing headers: ${missingHeaders.join(", ")}`);
      }

      const excelData: CityVM[] = [];
      const seenCities = new Set<string>();

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        const cityName = this.getString(row["CityName"]);
        const cityAliasName = this.getString(row["CityAliasName"]);
        const state = this.getString(row["State"]);
        const region = this.getString(row["Region"]);
        const country = this.getString(row["Country"]);
        const postalCode = this.getString(row["PostalCode"]);

        const latitude = this.toValidNumber(row["Latitude"]);
        const longitude = this.toValidNumber(row["Longitude"]);
        const population = this.toValidNumber(row["Population"]);
        const income = this.toValidNumber(row["Income"]);
        const livingCost = this.toValidNumber(row["LivingCost"]);
        const purchasingPower = this.toValidNumber(row["PurchasingPower"]);

        const isBlank = !cityName && !state && !country;
        if (isBlank) continue;

        if (cityName.toLowerCase() === "enter city name") continue;

        // ✅ Required fields
        if (!cityName || !state || !country) {
          return this.setError("CityName, State and Country are required.", i);
        }

        // ✅ Duplicate check
        const key = cityName.toLowerCase();
        if (seenCities.has(key)) {
          return this.setError(`Duplicate city name (${cityName}).`, i);
        }
        seenCities.add(key);
        
        if(latitude ==null|| longitude ==null){
          return this.setError(`Latitude/Longitude not have valid value.`, i);
        }

        // ✅ Latitude/Longitude validation
        if (latitude !== null && (latitude < -90 || latitude > 90)) {
          return this.setError("Latitude must be between -90 and 90.", i);
        }

        if (longitude !== null && (longitude < -180 || longitude > 180)) {
          return this.setError("Longitude must be between -180 and 180.", i);
        }

        // ✅ Numeric validation (non-negative)
        const numericFields = [
          { name: "Population", value: population },
          { name: "Income", value: income },
          { name: "LivingCost", value: livingCost },
          { name: "PurchasingPower", value: purchasingPower }
        ];
        
        for (const field of numericFields) {
          if(field.value == null){
            return this.setError(`${field.name} not have valid value.`, i);
          }
         else if (field.value < 0) {
            return this.setError(`${field.name} cannot be negative.`, i);
          }
        }

        // ✅ DTO
        excelData.push({
          cityName,
          cityAliasName,
          state,
          region,
          country,
          postalCode,
          latitude,
          longitude,
          population,
          income,
          livingCost,
          purchasingPower
        } as CityVM);
      }

      if (!excelData.length) {
        return this.setError("No valid records found.");
      }

      this.bulkImportData = excelData;
    };

    reader.readAsBinaryString(target.files[0]);
  }
  private setError(message: string, rowIndex?: number): void {
    this.alertMsg = rowIndex !== undefined
      ? `Row ${rowIndex + 2}: ${message}`
      : message;

    this.fileInput.nativeElement.value = "";
  }

  private getString(val: any): string {
    return String(val || "").trim();
  }

  private toValidNumber(val: any): number | null {
    if (val === null || val === undefined || val === "") return null;

    const num = parseFloat(val);
    return Number.isFinite(num) ? num : null;
  }


  bulkImportCity() {

    if (this.bulkImportData && this.bulkImportData.length && this.fileInput.nativeElement.value != "") {
      this.bulkImport.emit(this.bulkImportData);
      this.bulkImportData = [];
    }
    this.fileInput.nativeElement.value = "";
  }

  closeModel() {
    if (this.fileInput?.nativeElement?.value)
      this.fileInput.nativeElement.value = "";
    this.alertMsg = '';
    this.closeModal.emit(true);
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/noImageAvailable.png';
  }
}
