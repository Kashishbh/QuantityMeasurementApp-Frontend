import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type Review = {
  name: string;
  title: string;
  body: string;
};

@Component({
  selector: 'app-reviews-section',
  imports: [CommonModule],
  templateUrl: './reviews-section.component.html',
  styleUrl: './reviews-section.component.css',
})
export class ReviewsSectionComponent {
  protected readonly title = 'Reviews';
  protected readonly description =
    'Built for everyday accuracy. Here is what people say after converting measurements in seconds.';

  protected readonly reviews: Review[] = [
    {
      name: 'Ayesha K.',
      title: 'Fast and accurate',
      body: 'The converter feels effortless. I can switch units instantly and trust the numbers.',
    },
    {
      name: 'Daniel R.',
      title: 'Great for daily work',
      body: 'Compare and calculate operations are exactly what I needed. The layout is clean and clear.',
    },
    {
      name: 'Priya S.',
      title: 'History is useful',
      body: 'Saving calculations helps me keep track during projects. Refreshing history is seamless.',
    },
  ];
}

