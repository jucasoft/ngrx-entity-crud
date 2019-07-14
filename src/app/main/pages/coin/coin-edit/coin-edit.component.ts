import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-coin-edit',
  templateUrl: './coin-edit.component.html',
  styleUrls: ['./coin-edit.component.scss']
})
export class CoinEditComponent implements OnInit {

  constructor() {
  }

  form: FormGroup;
  value: FormControl;
  name: FormControl;
  description: FormControl;

// { "id": 1, "value": "10", "name": "xxxx", "description": "xxxx" },

  ngOnInit() {
    this.value = new FormControl('', Validators.required);
    this.name = new FormControl('', Validators.required);
    this.description = new FormControl('', Validators.required);
    this.form = new FormGroup(
      {
        value: this.value,
        name: this.name,
        description: this.description
      }
    );
  }

  submit(item) {
    console.log('CoinEditComponent.submit()');
  }

  cancel() {
    console.log('CoinEditComponent.cancel()');
  }

}
