import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { TooltipComponent, GridComponent, VisualMapComponent, CalendarComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { GithubService, GitHubUser, ContributionDay } from '../../services/github';
import { EChartsOption } from 'echarts';

echarts.use([HeatmapChart, TooltipComponent, GridComponent, VisualMapComponent, CalendarComponent, CanvasRenderer]);

@Component({
  selector: 'app-github-profile',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './github-profile.html',
  styleUrl: './github-profile.scss',
})
export class GithubProfile implements OnInit {
  username = signal('shreeramk');
  user = signal<GitHubUser | null>(null);
  contributions = signal<ContributionDay[]>([]);
  activeTab = signal<'overview' | 'repositories' | 'projects' | 'packages' | 'stars'>('overview');
  loading = signal(true);
  error = signal<string | null>(null);
  selectedYear = signal(2025);

  // Mock data for repositories
  popularRepos = [
    {
      name: 'Complete-Python-3-Bootcamp',
      description: 'Course Files for Complete Python 3 Bootcamp Course on Udemy',
      language: 'Jupyter Notebook',
      languageColor: '#DA5B0B',
      stars: 0,
      forks: 0,
      isForked: true,
      forkedFrom: 'Pierian-Data/Complete-Python-3-Bootcamp',
      visibility: 'Public'
    },
    {
      name: 'flutter_login_ui',
      description: 'https://youtu.be/Rrk6t8T7f4r44',
      language: 'Dart',
      languageColor: '#00B4AB',
      stars: 0,
      forks: 0,
      isForked: true,
      forkedFrom: 'MarouniMg/flutter_login_ui',
      visibility: 'Public'
    },
    {
      name: 'gitignore',
      description: 'A collection of useful .gitignore templates',
      language: null,
      languageColor: null,
      stars: 0,
      forks: 0,
      isForked: true,
      forkedFrom: 'github/gitignore',
      visibility: 'Public'
    },
    {
      name: 'node-opcua-logger',
      description: 'An OPCUA Client for logging data to InfluxDB',
      language: 'JavaScript',
      languageColor: '#f1e05a',
      stars: 0,
      forks: 0,
      isForked: true,
      forkedFrom: 'coussej/node-opcua-logger',
      visibility: 'Public'
    },
    {
      name: 'kafkajs',
      description: 'A modern Apache Kafka client for node.js',
      language: 'JavaScript',
      languageColor: '#f1e05a',
      stars: 0,
      forks: 0,
      isForked: true,
      forkedFrom: 'tulios/kafkajs',
      visibility: 'Public'
    },
    {
      name: 'node-opcua-1',
      description: 'an implementation of a OPC UA stack fully written in javascript and nodejs',
      language: 'TypeScript',
      languageColor: '#3178c6',
      stars: 0,
      forks: 0,
      isForked: true,
      forkedFrom: 'node-opcua/node-opcua',
      visibility: 'Public'
    }
  ];

  // Mock achievements
  achievements = [
    { icon: '🏆', name: 'Arctic Code Vault', level: '' },
    { icon: '🦊', name: 'YOLO', level: '' },
    { icon: '⭐', name: 'Pull Shark', level: 'x4' },
    { icon: '🔷', name: 'Quickdraw', level: '' }
  ];

  // Computed values
  totalContributions = computed(() => {
    return this.contributions().reduce((sum, day) => sum + day.count, 0);
  });

  chartOption = computed<EChartsOption>(() => {
    const data = this.contributions();
    if (!data.length) return {};

    // Create calendar heatmap data
    const calendarData = data.map(d => [d.date, d.count]);
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return {
      tooltip: {
        formatter: (params: any) => {
          if (!params.data) return '';
          return `${params.data[1]} contributions on ${params.data[0]}`;
        }
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxCount,
        inRange: {
          color: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
        }
      },
      calendar: {
        top: 20,
        left: 40,
        right: 20,
        cellSize: [13, 13],
        range: [data[0]?.date || '2025-01-01', data[data.length - 1]?.date || '2025-12-31'],
        itemStyle: {
          borderWidth: 3,
          borderColor: '#0d1117'
        },
        yearLabel: { show: false },
        dayLabel: {
          color: '#8b949e',
          fontSize: 10,
          nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },
        monthLabel: {
          color: '#8b949e',
          fontSize: 10
        },
        splitLine: { show: false }
      },
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: calendarData
      }]
    };
  });

  constructor(
    private route: ActivatedRoute,
    private githubService: GithubService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['username']) {
        this.username.set(params['username']);
      }
      this.loadData();
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load user profile from GitHub API
    this.githubService.getUser(this.username()).subscribe({
      next: (user: GitHubUser) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err: Error) => {
        console.error('Failed to load user', err);
        this.error.set('Failed to load user profile');
        this.loading.set(false);
      }
    });

    // Load contributions
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    this.githubService.getContributionsGraphql(
      this.username(),
      oneYearAgo.toISOString(),
      now.toISOString()
    ).subscribe({
      next: (data: ContributionDay[]) => {
        if (data.length > 0) {
          this.contributions.set(data);
        } else {
          this.loadMockContributions();
        }
      },
      error: () => {
        this.loadMockContributions();
      }
    });
  }

  loadMockContributions(): void {
    this.githubService.getMockContributions().subscribe({
      next: (data: ContributionDay[]) => this.contributions.set(data),
      error: (err: Error) => console.error('Failed to load mock contributions', err)
    });
  }

  setActiveTab(tab: 'overview' | 'repositories' | 'projects' | 'packages' | 'stars'): void {
    this.activeTab.set(tab);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
