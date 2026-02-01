import { Component,OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

type Settings = {
  id: number;
  delivery_distance: number;
  discount: number;
  service_fee: number;
}

type DiscountCode = {
  code: string;
  id: number;
  percent: number|undefined;
  amount: number|undefined;
  isPercent: boolean;
  isEditing: boolean;
}

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, Navbar],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class ManagerSettings  implements OnInit{
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  settings: Settings[] = [];
  codes: DiscountCode[] = [];
  isEditingCodes: boolean[] = [];

  edit = {
    delivery_distance: -1,
    discount: -1,
    service_fee: -1
  };
  code ={
    code: "-1",
    percent: -1,
    amount: -1,
    isPercent: false
  }

  isLoadingSettings = false;
  isEditingSettings = false;
  isLoadingCodes = false;
  errorMsg: string | null = null;
  private API = 'http://localhost:3000';

  ngOnInit() {
    this.loadSettings();
    this.loadDiscountCodes();
  }

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return {
      headers: new HttpHeaders({
        Authorization: token,
      }),
    };
  }

  loadSettings() {
    this.isLoadingSettings = true;
    this.errorMsg = null;

    this.http.get<Settings[]>(
      `http://localhost:3000/manager/settings`,
      this.getAuthHeaders()
    )
    .subscribe({
      next: (rows) => {
        console.log('loaded settings', rows);
        this.settings = rows ?? [];
        this.isLoadingSettings = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingSettings = false;
        if (this.handleAuthError(err))return;
        console.error(err);
        this.errorMsg = 'Error laoding settings';
        this.cdr.detectChanges();
      }
    });
  }

  startEditSettings(){
    this.isEditingSettings = true;
  }

  saveSettings(){
    this.edit.delivery_distance = parseInt((document.getElementById("managerDeliveryDistanceInput")as HTMLInputElement).value);
    this.edit.discount = parseInt((document.getElementById("managerDiscountInput")as HTMLInputElement).value);
    let fee =(document.getElementById("managerServiceFeeInput")as HTMLInputElement).value.split("$");
    this.edit.service_fee = parseFloat(fee.length == 1 ? fee[0]: fee[1]);
    
    this.updateSettings();
    this.cdr.detectChanges();
  }

  cancelEditSettings(){
    this.isEditingSettings = false;
    this.cdr.detectChanges();
  }

  updateSettings() {
    const payload = {
      delivery_distance: this.edit.delivery_distance,
      discount: this.edit.discount,
      service_fee: this.edit.service_fee
    }

    this.http.patch<any>(
      `${this.API}/manager/settings`, payload, this.getAuthHeaders()
    )
    .subscribe({
      next: (res) => {
        if(res){
          (document.getElementById("managerDeliveryDistance")as HTMLSpanElement).textContent = this.edit.delivery_distance.toString() + " ";
          this.settings[0].delivery_distance = this.edit.delivery_distance;
          (document.getElementById("managerDiscount")as HTMLSpanElement).textContent = this.edit.discount.toString() + " ";
          this.settings[0].discount = this.edit.discount;
          (document.getElementById("managerServiceFee")as HTMLSpanElement).textContent = "$"+ this.edit.service_fee.toString() + " ";
          this.settings[0].service_fee = this.edit.service_fee;
    
          this.isEditingSettings = false;
          this.cdr.detectChanges();
          //alert('settings saved');
        }
        else{
          console.log(res);
        }
        
      },
      error: (err) => {
        if (this.handleAuthError(err)) return;
        console.error(err);
        this.errorMsg = 'Failed to update settings';
        this.cdr.detectChanges();
      }
    })

  }

  loadDiscountCodes() {
    this.isLoadingCodes = true;
    this.errorMsg = null;

    this.http.get<DiscountCode[]>(
      `http://localhost:3000/manager/discountCodes`,
      this.getAuthHeaders()
    )
    .subscribe({
      next: (rows) => {
        console.log('loaded discountCodes', rows);
        this.codes = rows ?? [];
        this.isLoadingCodes = false;
        this.codes.forEach(c => {
          c.isEditing = false
          if(c.percent != undefined && c.percent > 0)
            c.isPercent = true;
          else
            c.isPercent = false
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingCodes = false;
        if (this.handleAuthError(err))return;
        console.error(err);
        this.errorMsg = 'Error laoding Discount Codes';
        this.cdr.detectChanges();
      }
    });
  }

  startEditingDiscountCode(id:number){
    let codeID = this.codes.map(e => e.id).indexOf(id);
    this.codes[codeID].isEditing = true;
    this.cdr.detectChanges();
  }
  saveDiscountCode(id: number){
    let codeID = this.codes.map(e => e.id).indexOf(id);
    this.codes[codeID].isEditing = false;
    let am = (document.getElementById(`amountInput${id}`) as HTMLInputElement)?.value.split("$");
    let code: DiscountCode = {  
      code: (document.getElementById(`codeInput${id}`) as HTMLInputElement).value,
      id: id,
      percent: this.codes[codeID].isPercent ? parseInt((document.getElementById(`percentInput${id}`) as HTMLInputElement).value) : undefined,
      amount: !this.codes[codeID].isPercent ? parseFloat(am.length>1? am[1]:am[0]) : undefined,
      isPercent: this.codes[codeID].isPercent,
      isEditing: false
    }

    this.codes[codeID] = code;
    this.updateDiscountCode(code);
  }
  updateDiscountCode(code: DiscountCode){

    const payload = {
      id: code.id,
      code: code.code,
      amount: code.amount,
      percent: code.percent
      }

    this.http.patch<any>(
      `${this.API}/manager/discountCodes/${code.id}`, payload, this.getAuthHeaders()
    )
    .subscribe({
      next: (res) => {
        if(res){
          (document.getElementById(`code${code.id}`)as HTMLSpanElement).textContent = payload.code;
          (document.getElementById(`percent${code.id}`)as HTMLSpanElement).textContent = (payload.percent!=null ? payload.percent.toString() : null);
          (document.getElementById(`amount${code.id}`)as HTMLSpanElement).textContent = (payload.amount!=null ? "$"+ payload.amount.toString() + (payload.amount%0.1 < 0.001 ?  "0" : (payload.amount%1 < 0.001?".00" : "")) : null);

          this.cdr.detectChanges();
          alert('code saved');
        }
        else{
          console.log(res);
        }
        
      },
      error: (err) => {
        if (this.handleAuthError(err)) return;
        console.error(err);
        this.errorMsg = 'Failed to update settings';
        this.cdr.detectChanges();
      }
    })

    this.cdr.detectChanges();
  }
  addDiscountCode(){
    let code = (document.getElementById("newCodeInput")as HTMLInputElement).value;
    let percent = (document.getElementById("newPercentInput") as HTMLInputElement).value;
    let amount = (document.getElementById("newAmountInput") as HTMLInputElement).value;
    let isPer = false;
    if(percent!= ""){
      isPer = true;
    }
    let payload ={
      code: code,
      percent: isPer ? percent : null,
      amount: isPer ? null : amount
    }

    this.http.post<any>(
      `${this.API}/manager/discountCodes`, payload
    )
    .subscribe({
      next: (res) => {
        if(res)
          console.log(res);
          this.loadDiscountCodes();
      }
    })

  }
  deleteDiscountCode(id:number){
    this.http.delete<any>(
      `${this.API}/manager/discountCodes/${id}`, this.getAuthHeaders()
    )
      .subscribe({
        next: (res) => {
          this.loadDiscountCodes();
          this.cdr.detectChanges();
        },
        error: (err) =>{
          console.log('Could not delete discountCode', err);
        }
      })
  }

  handleAuthError(err: any) {
    if(err?.status === 401 || err?.status === 403) {
      this.router.navigate(['/authentication']);
      return true;
    }
    return false;
  }
}
