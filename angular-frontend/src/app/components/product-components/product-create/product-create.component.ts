import { Component } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { Router } from '@angular/router';


@Component({
  selector: 'app-product-create',
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.css']
})
export class ProductCreateComponent {
  product: Product = {
    id: 0,
    name: '',
    price: 0,
    description: '',
    
  };

  constructor(
    private productService: ProductService,
    private router: Router,
  ) { }

  onSubmit() {
    this.productService.addProduct(this.product).subscribe(
      data => {
        console.log('Product created successfully!', data);
        this.router.navigate(['/products']);
      },
      error => {
        console.error('Error creating product!', error);
      }
    );
  }
}
