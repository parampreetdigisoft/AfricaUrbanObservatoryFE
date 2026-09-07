import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminService } from '../../admin.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { PillarsVM } from 'src/app/core/models/PillersVM';
declare var bootstrap: any; 

@Component({
  selector: 'app-pillar',
  templateUrl: './pillar.component.html',
  styleUrl: './pillar.component.css'
})
export class PillarComponent implements OnInit, OnDestroy {

  pillars: PillarsVM[] = [];
  selectedPillar: PillarsVM | null = null;  
  loading: boolean = false;
  isLoader: boolean = false;

  constructor(private adminService: AdminService, private toaster: ToasterService) { }

  ngOnInit(): void {
    this.GetAllPillars();

  }
  GetAllPillars() {
    this.pillars = [];
    this.isLoader = true;
    this.adminService.getAllPillars().subscribe(pillars => {
      this.pillars = pillars.map(p => ({
      ...p,
      expand: false,
      showToggle: this.isLongText(p.description)
    }));
      this.isLoader = false;
    });
  }

isLongText(html: string): boolean {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.innerText || temp.textContent || "";
  return text.split(/\s+/).length > 40; // approx 4 lines
}

  addUpdatePillar(piller: PillarsVM | any) {
    if(!this.selectedPillar || piller.pillarID ==0 || piller.pillarID ==null){
       this.toaster.showWarning('No selected pillar');
       return;
    }
    if (this.selectedPillar.pillarName.length < 5) {
      this.toaster.showError('pillarName cannot be to short');
      return;
    }
    this.loading =true;
    this.adminService.editAllPillars(this.selectedPillar.pillarID , piller).subscribe({
      next:()=>{
     this.closeModal();
        this.toaster.showSuccess('Pillar updated successfully');
        this.GetAllPillars();
      },
      error: (err) => {
        this.toaster.showError('Failed to update pillar');
      }
    });
  }

  editPillar(piller: PillarsVM){
    this.selectedPillar = piller;
  }

  ngOnDestroy(): void {

  }

  closeModal() {
    this.loading =false;
    const modalEl = document.getElementById('exampleModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
    setTimeout(() => {
      this.selectedPillar = null;
    }, 100);
  }
  decodeHtml(text: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value.replace(/\u00a0/g, ' '); // Replace non-breaking space with normal space
  }
}
