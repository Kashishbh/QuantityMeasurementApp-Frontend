import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';

import { HeroSectionComponent } from './hero-section.component';
import { FeaturesSectionComponent } from './features-section.component';
import { HomeComponent } from '../features/home/home.component';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, HeroSectionComponent, FeaturesSectionComponent, HomeComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class LandingPageComponent {}

