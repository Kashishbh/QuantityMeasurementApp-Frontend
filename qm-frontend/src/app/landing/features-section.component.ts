import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type FeatureCard = {
  title: string;
  description: string;
  icon: 'convert' | 'compare' | 'history';
};

@Component({
  selector: 'app-features-section',
  imports: [CommonModule],
  templateUrl: './features-section.component.html',
  styleUrl: './features-section.component.css',
})
export class FeaturesSectionComponent {
  protected readonly title = 'How does it work?';
  protected readonly description =
    'Pick a measurement type, choose an operation, and get a precise result in the unit you want. Save your calculations to review later.';

  protected readonly cards: FeatureCard[] = [
    {
      title: 'Instant Conversion',
      description: 'Convert values across length, volume, weight, and temperature units.',
      icon: 'convert',
    },
    {
      title: 'Compare & Calculate',
      description: 'Normalize values and compute results for ADD, SUBTRACT, MULTIPLY, and DIVIDE.',
      icon: 'compare',
    },
    {
      title: 'Smart History',
      description: 'Keep a timeline of your latest calculations and refresh when needed.',
      icon: 'history',
    },
  ];
}

