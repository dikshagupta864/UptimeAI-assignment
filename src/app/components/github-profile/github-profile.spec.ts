import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubProfile } from './github-profile';

describe('GithubProfile', () => {
  let component: GithubProfile;
  let fixture: ComponentFixture<GithubProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GithubProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GithubProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
