import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AgChartOptions } from 'ag-charts-community';
@Component({
  selector: 'app-ag-bar',
  templateUrl: './ag-bar.component.html',
  styleUrl: './ag-bar.component.css'
})
export class AgBarComponent implements OnInit, OnChanges {

  @Input() data: any;
  @Input() options: AgChartOptions | any={};

  
  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {

  }
  ngOnInit(): void {


  }

}
