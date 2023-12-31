import { Component, OnInit, OnDestroy } from '@angular/core';
import { MovieService } from '../../services/movie.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.css']
})
export class MoviesComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  public unsubscribed = false;

  movies: any[] = [];
  searchTerm = '';
  currentPage = 0;
  pageSize = 5;
  totalItems = 0;

  constructor(
    private movieService: MovieService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    console.log('ngOnInit called');
    this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      console.log('queryParams:', params);
      // Get the current page and search term from query params
      this.currentPage = params['page'] ? parseInt(params['page'], 10) : 0;
      this.searchTerm = params['searchTerm'] || '';

      if (this.searchTerm) {
        this.searchMovies(this.currentPage);
      } else {
        this.reloadData(this.currentPage);
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.unsubscribed = true;
  }

  reloadData(page: number = this.currentPage, size: number = this.pageSize): void {
    console.log('reloadData called');
    this.movieService.getMovies(page, size).subscribe({
      next: (data) => {
        // Check if 'data' has 'content' and 'totalElements' properties
        if (data.content && data.totalElements !== undefined) {
          const processedMovies = data.content.map((movie: any) => {
            // Process each movie object here as needed
            return {
              ...movie,
              genreNames: movie.genres?.map((g: any) => g.name).join(', ') || 'N/A',
              actorNames: movie.actors?.map((actor: any) => actor.name).join(', ') || 'No actors',
              releaseYear: movie.releaseYear || 'Unknown',
            };
          });

          // Update the component's movies and pagination-related properties
          this.movies = processedMovies;
          this.totalItems = data.totalElements;
        } else {
          // Handle unexpected response structure
          console.error('Unexpected response structure:', data);
        }
      },
      error: (error) => {
        // Handle errors during the API call
        console.error('Error fetching movies:', error);
      }
    });
  }

  addMovie(): void {
    this.router.navigate(['/add-movie']);
  }

  addActor(): void {
    this.router.navigate(['/add-actor']);
  }

  addGenre(): void {
    this.router.navigate(['/add-genre']);
  }

  // Method to handle deletion of a movie
  deleteMovie(id: number, movieTitle: string): void {
    if (confirm(`Are you sure you want to delete "${movieTitle}"?`)) {
      this.movieService.deleteMovie(id).subscribe({
        next: (data) => {
          console.log('Movie deleted:', data);
          this.reloadData();
        },
        error: (error) => {
          console.error('Error deleting movie:', error);
        }
      });
    }
  }

  updateMovie(id: number) {
    this.router.navigate(['/movie/edit', id]);
  }

  searchMovies(page: number = this.currentPage): void {
    if (!this.searchTerm.trim()) {
      // If the search term is empty or only whitespace, reload the initial movie data
      this.reloadData(page);
    } else {
      // Otherwise, proceed with the search
      this.movieService.searchMovies(this.searchTerm, page, this.pageSize).subscribe(data => {
        const processedMovies = data['content'].map((movie: any) => {
          const genreNames = movie.genres && movie.genres.length > 0
            ? movie.genres.map((g: { name: any; }) => g.name).join(', ')
            : 'N/A';
          const actorNames = movie.actors && movie.actors.length > 0
            ? movie.actors.map((actor: any) => actor.name).join(', ')
            : 'No actors';
          return {
            ...movie,
            genreNames: genreNames,
            actorNames: actorNames,
          };
        });

        this.movies = processedMovies;
        this.totalItems = data['totalElements']; // Total number of items for pagination
        this.currentPage = page;
      }, error => console.log('Error searching for movies:', error));
    }
  }

  // Generate an array of page numbers based on totalItems and pageSize
  getPages(totalItems: number, pageSize: number): number[] {
    const totalPages = Math.ceil(totalItems / pageSize);
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    if (this.searchTerm) {
      this.searchMovies(page);
    } else {
      this.reloadData(page);
    }
  }
}
