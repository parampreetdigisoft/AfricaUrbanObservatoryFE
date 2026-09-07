import { environment } from 'src/environments/environment';
import { GetMutiplekpiLayerResultsDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerResultsDto';
import { CommonModule } from '@angular/common';
import { UserService } from 'src/app/core/services/user.service';
import { UserRole } from 'src/app/core/enums/UserRole';
import { Component, Input, signal, computed, effect } from '@angular/core';


@Component({
  selector: 'app-compare-city-kpi-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare-city-kpi-detail.component.html',
  styleUrl: './compare-city-kpi-detail.component.css'
})
export class CompareCityKpiDetailComponent {

  private _selectedLayer = signal<GetMutiplekpiLayerResultsDto | null>(null);
  @Input() set selectedLayer(value: GetMutiplekpiLayerResultsDto | null) {
    this._selectedLayer.set(value);
  }
  selectedLayerSig = this._selectedLayer; 

  interpretations = computed(() =>
    this.selectedLayerSig()?.fiveLevelInterpretations ?? []
  );

  constructor(private userService: UserService) { }


  private extractCondition( interpretationID: number | null | undefined ): string {
    if (!interpretationID) return 'NA';
    const condition =
      this.selectedLayerSig()?.fiveLevelInterpretations
        ?.find(x => x.interpretationID === interpretationID)
        ?.condition ?? 'NA';

    return condition.split(' ')[0];
  }
  
  cityConditions = computed(() => {
    const layer = this.selectedLayerSig();
    if (!layer) return [];

    return layer.cities.map(city => ({
      manual: this.extractCondition(city.interpretationID),
      ai: this.extractCondition(city.aiInterpretationID)
    }));
  });

  isCityUser = computed(() => this.userService.userInfo.role === UserRole.CityUser);

  getInterpretaionClass = (interpretationID: number) => {
    const layer = this.selectedLayerSig();
    if (!layer) return '';

    if (!this.isCityUser()) {
      const manual = layer.cities.find(x => x.interpretationID === interpretationID);
      if (manual) return 'active_row';
    }
    const ai = layer.cities.find(x => x.aiInterpretationID === interpretationID);
    return ai ? 'active_ai' : '';
  };

}
