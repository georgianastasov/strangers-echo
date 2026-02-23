import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTheme,
  ApexDataLabels,
  ApexFill,
  ApexYAxis,
  ApexStroke,
  ApexTooltip,
  ApexGrid,
  ApexPlotOptions,
} from 'ng-apexcharts';

export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  theme: ApexTheme;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  dataLabels: ApexDataLabels;
  colors: string[];
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  theme: ApexTheme;
  fill: ApexFill;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
  plotOptions: ApexPlotOptions;
};

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  theme: ApexTheme;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  colors: string[];
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './stats.html',
  styleUrls: ['./stats.css'],
})
export class StatsComponent implements OnInit, OnDestroy {
  private firestore: Firestore = inject(Firestore);
  private unsubscribe: any;

  public totalTracked = 0;
  public lastHour = 0;
  public last24h = 0;

  public recentWhispers: any[] = [];
  public topCities: { name: string; count: number }[] = [];

  public timelineChartOptions!: Partial<LineChartOptions>;
  public countryChartOptions!: Partial<BarChartOptions>;
  public cityChartOptions!: Partial<BarChartOptions>;
  public timeOfDayOptions!: Partial<DonutChartOptions>;
  public chartsReady = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.initEmptyCharts();
  }

  public ngOnInit() {
    const clicksRef = collection(this.firestore, 'clicks');
    const q = query(clicksRef, orderBy('timestamp', 'desc'), limit(500));

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      this.totalTracked = snapshot.docs.length;
      this.lastHour = 0;
      this.last24h = 0;

      const countryCounts: Record<string, number> = {};
      const cityCounts: Record<string, number> = {};
      const dateCounts: Record<string, number> = {};

      let night = 0,
        morning = 0,
        afternoon = 0,
        evening = 0;

      this.recentWhispers = [];

      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        if (!data['timestamp']) return;

        const date = data['timestamp'].toDate();
        const fullLocation = data['location'] || 'Unknown';

        const parts = fullLocation.split(',');
        const city = parts[0] ? parts[0].trim() : 'Unknown';
        const country = parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown';

        if (date > oneHourAgo) this.lastHour++;
        if (date > oneDayAgo) this.last24h++;

        countryCounts[country] = (countryCounts[country] || 0) + 1;
        cityCounts[city] = (cityCounts[city] || 0) + 1;

        const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        dateCounts[dateString] = (dateCounts[dateString] || 0) + 1;

        const hour = date.getHours();
        if (hour >= 0 && hour < 6) night++;
        else if (hour >= 6 && hour < 12) morning++;
        else if (hour >= 12 && hour < 18) afternoon++;
        else evening++;

        if (index < 5) {
          this.recentWhispers.push({
            location: fullLocation,
            time: date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          });
        }
      });

      this.topCities = Object.entries(cityCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      this.processChartData(dateCounts, countryCounts, [night, morning, afternoon, evening]);

      this.chartsReady = true;
      this.cdr.detectChanges();
    });
  }

  public processChartData(
    dateCounts: Record<string, number>,
    countryCounts: Record<string, number>,
    timeDistribution: number[],
  ) {
    const sortedDates = Object.keys(dateCounts).reverse();
    const timelineData = sortedDates.map((date) => dateCounts[date]);

    this.timelineChartOptions.series = [{ name: 'Whispers', data: timelineData }];
    this.timelineChartOptions.xaxis = {
      ...this.timelineChartOptions.xaxis,
      categories: sortedDates,
    };

    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.countryChartOptions.series = [{ name: 'Clicks', data: topCountries.map((c) => c[1]) }];
    this.countryChartOptions.xaxis = {
      ...this.countryChartOptions.xaxis,
      categories: topCountries.map((c) => c[0]),
    };

    this.cityChartOptions.series = [{ name: 'Clicks', data: this.topCities.map((c) => c.count) }];
    this.cityChartOptions.xaxis = {
      ...this.cityChartOptions.xaxis,
      categories: this.topCities.map((c) => c.name),
    };

    this.timeOfDayOptions.series = timeDistribution;
  }

  public initEmptyCharts() {
    this.timelineChartOptions = {
      series: [],
      chart: {
        type: 'area',
        height: 250,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 800 },
      },
      theme: { mode: 'dark' },
      colors: ['#ff0000'],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 100] },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: {
        categories: [],
        labels: { style: { colors: '#a3a3a3' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
      tooltip: { theme: 'dark' },
    };

    this.countryChartOptions = {
      series: [],
      chart: { type: 'bar', height: 260, toolbar: { show: false }, background: 'transparent' },
      theme: { mode: 'dark' },
      colors: ['#ff3333'],
      plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '60%' } } as any,
      dataLabels: { enabled: true, style: { colors: ['#fff'] } },
      xaxis: {
        categories: [],
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#ffcccc', fontSize: '13px', fontWeight: 600 } } },
      grid: { show: false },
      tooltip: { theme: 'dark' },
    };

    this.cityChartOptions = {
      series: [],
      chart: { type: 'bar', height: 260, toolbar: { show: false }, background: 'transparent' },
      theme: { mode: 'dark' },
      colors: ['#ff4d4d'],
      plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '60%' } } as any,
      dataLabels: { enabled: true, style: { colors: ['#fff'] } },
      xaxis: {
        categories: [],
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#ffcccc', fontSize: '13px', fontWeight: 600 } } },
      grid: { show: false },
      tooltip: { theme: 'dark' },
    };

    this.timeOfDayOptions = {
      series: [],
      chart: { type: 'donut', height: 260, background: 'transparent' },
      labels: ['Night (00-06)', 'Morning (06-12)', 'Afternoon (12-18)', 'Evening (18-24)'],
      theme: { mode: 'dark' },
      colors: ['#330000', '#ff0000', '#ff6666', '#990000'],
      stroke: { show: true, colors: ['#0a0000'], width: 2 },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '75%' } } },
      tooltip: { theme: 'dark' },
    };
  }

  public ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  public goBack() {
    this.router.navigate(['/']);
  }
}
