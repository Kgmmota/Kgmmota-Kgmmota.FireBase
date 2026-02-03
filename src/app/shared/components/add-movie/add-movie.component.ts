import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators'; // <--- Importante para o upload

@Component({
  selector: 'app-add-movie',
  templateUrl: './add-movie.component.html',
  styleUrl: './add-movie.component.scss'
})
export class AddMovieComponent implements OnInit {

  movieForm!: FormGroup;
  selectedFile: File | null = null; // foto do filme (arquivo bruto)
  previewUrl: string | null = null; // pré visualização da imagem

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(){
    this.movieForm = this.fb.group({
      name: ['', [Validators.required]],
      rating: [0, [Validators.required]],
      analysis: ['', [Validators.required]],
      photo_path: [''] // Campo que vai receber a URL do Firebase
    });
  }

  setRating(rating: number) {
    this.movieForm.patchValue({
      rating: rating
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      // Cria a pré-visualização local
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit() {
    // Verifica se o formulário é válido e se tem uma imagem selecionada
    if (this.movieForm.valid && this.selectedFile) {
      
      const filePath = `movies/${Date.now()}_${this.selectedFile.name}`; // Nome único
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.selectedFile);

      // --- PASSO 1: Fazer Upload da Imagem ---
      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            
            // --- PASSO 2: Pegar a URL e jogar no formulário ---
            this.movieForm.patchValue({ photo_path: url });
            
            // --- PASSO 3: Salvar no Banco de Dados ---
            this.saveMovieToFirestore();
          });
        })
      ).subscribe();

    } else if (this.movieForm.valid && !this.selectedFile) {
       alert('Por favor, selecione uma imagem para a capa do filme.');
    } else {
       alert('Preencha todos os campos corretamente.');
    }
  }

  // Função separada para organizar o código
  saveMovieToFirestore() {
    const formData = this.movieForm.value;

    this.databaseService.addDocument('movies', formData).then((docRef: any) => {
      console.log('Documento Adicionado com ID:', docRef.id);
      
      // --- PASSO 4: Gravar o ID dentro do documento ---
      docRef.update({ id: docRef.id });

      // --- PASSO 5: Limpar e Fechar ---
      this.movieForm.reset();
      this.selectedFile = null;
      this.previewUrl = null;
      this.onClose(); // Fecha o modal automaticamente
    })
    .catch((error) => {
      console.error('Erro ao salvar:', error);
    });
  }

  // variável que emite um evento para o componente da home
  @Output() closeModal = new EventEmitter<void>();

  // Função que emite o evento para o componente da home, fechando o Modal
  onClose() {
    this.closeModal.emit();
  }
}