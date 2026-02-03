import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss'
})
export class CadastroComponent {

  name: string = '';
  email: string ='';
  password: string = '';
  confirmPassword: string = '';

  constructor(private auth: AuthService){}

  valideForm(): boolean{
    return this.name !== '' &&
           this.email !== '' &&
           this.password !== '' &&
           this.confirmPassword !== '';
  }

  cadastrar(){
    if(this.valideForm()){
      this.auth.cadastro(this.name,this.email,this.password,this.confirmPassword)
    }else{
      alert('Preencha todos os Campos.')
    }
  }
  
}
